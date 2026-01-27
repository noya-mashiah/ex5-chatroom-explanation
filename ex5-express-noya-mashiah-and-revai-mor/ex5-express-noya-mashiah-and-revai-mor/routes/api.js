'use strict';

/**
 * REST API routes for message management
 * Provides JSON endpoints for CRUD operations on messages
 * All endpoints protected with session-based authentication
 * Edit and delete operations require message ownership verification
 * @module routes/api
 */

const express = require('express');
const router = express.Router();
const Message = require('../models/message');
const User = require('../models/user');
const { Op } = require('sequelize');
const { sendJsonError, sendJsonSuccess } = require('../controllers/errors');
const { validateContent } = require('../utils/validators');
const MSG = require('../config/messages');
const { requireAuthApi, isMessageAuthor } = require('../middleware/auth');

// ============================================
// Helper Functions - Database Query Utilities
// ============================================

/**
 * Sequelize include option for fetching message author
 * Reusable configuration for JOIN with Users table
 * @param {boolean} includeEmail - Whether to include email in author attributes
 * @returns {Object} Sequelize include configuration
 */
function getAuthorIncludeOption(includeEmail = false) {
    const attributes = ['id', 'firstName', 'lastName'];
    if (includeEmail) {
        attributes.push('email');
    }
    
    return {
        model: User,
        as: 'author',
        attributes: attributes
    };
}

/**
 * Fetch message with author by ID
 * Reusable function to get message with author information
 * @async
 * @param {number} messageId - Message ID to fetch
 * @param {boolean} includeEmail - Whether to include email in author data
 * @returns {Promise<Object>} Message with author information
 */
async function fetchMessageWithAuthor(messageId, includeEmail = false) {
    return await Message.findByPk(messageId, {
        include: [getAuthorIncludeOption(includeEmail)]
    });
}

// ============================================
// Helper Functions - Response Formatting
// ============================================

/**
 * Format a single message with author information
 * Standardizes message response structure across all endpoints
 * @param {Object} messageWithAuthor - Sequelize message instance with author included
 * @returns {Object} Formatted message object for API response
 */
function formatMessageWithAuthor(messageWithAuthor) {
    return {
        id: messageWithAuthor.id,
        content: messageWithAuthor.content,
        userId: messageWithAuthor.userId,
        authorFirstName: messageWithAuthor.author.firstName,
        authorLastName: messageWithAuthor.author.lastName,
        createdAt: messageWithAuthor.createdAt,
        updatedAt: messageWithAuthor.updatedAt
    };
}

/**
 * Format array of messages with author information
 * Maps array of Sequelize instances to standardized response format
 * @param {Array} messages - Array of Sequelize message instances with author included
 * @returns {Array} Array of formatted message objects
 */
function formatMessagesArray(messages) {
    return messages.map(msg => formatMessageWithAuthor(msg));
}

// ============================================
// Helper Functions - Error Handling
// ============================================

/**
 * Handle Sequelize validation errors
 * Extracts error message from Sequelize validation error and sends formatted response
 * @param {Object} error - Error object from catch block
 * @param {Object} res - Express response object
 * @param {string} fallbackMessage - Fallback error message if Sequelize error not found
 * @returns {Object} Express response object with error
 */
function handleSequelizeError(error, res, fallbackMessage) {
    // Handle Sequelize validation errors
    if (error.name === 'SequelizeValidationError') {
        const errorMessage = error.errors[0]?.message || 'Validation failed';
        return sendJsonError(res, errorMessage, 400);
    }
    
    return sendJsonError(res, fallbackMessage, 500);
}

// ============================================
// API Routes - Read Operations (GET)
// ============================================

/**
 * GET /api/messages
 * Fetch all messages sorted by newest first
 * Includes author information via JOIN with Users table
 * @returns {200} JSON array of messages with author details
 * @returns {401} Unauthorized if not logged in
 * @returns {500} Server error
 */
router.get('/messages', requireAuthApi, async (req, res) => {
    try {
        const messages = await Message.findAll({
            include: [getAuthorIncludeOption(true)],
            order: [['createdAt', 'DESC']],
            paranoid: true
        });

        const formattedMessages = formatMessagesArray(messages);
      
        return sendJsonSuccess(res, MSG.MESSAGES_RETRIEVED, {
            count: formattedMessages.length,
            messages: formattedMessages
        }, 200);

    } catch (error) {
        console.error('Error fetching messages:', error);
        return sendJsonError(res, MSG.FAILED_FETCH_MESSAGES, 500);
    }
});

/**
 * GET /api/messages/search
 * Search messages by content using case-insensitive pattern matching
 * Only accessible to authenticated users
 * @query {string} q - Search query (required)
 * @returns {200} JSON array of matching messages with author details
 * @returns {400} Missing or empty search query
 * @returns {401} Unauthorized if not logged in
 * @returns {500} Server error
 */
router.get('/messages/search', requireAuthApi, async (req, res) => {
    try {
        const { q } = req.query;
        const trimmedQuery = q ? q.trim() : '';

        if (!trimmedQuery) {
            return sendJsonError(res, MSG.SEARCH_QUERY_REQUIRED, 400);
        }

        // Search messages containing the query string (case-insensitive)
        const messages = await Message.findAll({
            where: {
                content: {
                    [Op.like]: `%${trimmedQuery}%`
                }
            },
            include: [getAuthorIncludeOption()],
            order: [['createdAt', 'DESC']],
            paranoid: true  // this excludes soft-deleted messages
        });

        const formattedMessages = formatMessagesArray(messages);

        return sendJsonSuccess(res, MSG.SEARCH_COMPLETED, {
            count: formattedMessages.length,
            query: trimmedQuery,
            messages: formattedMessages
        }, 200);

    } catch (error) {
        console.error('Error searching messages:', error);
        return sendJsonError(res, MSG.FAILED_SEARCH_MESSAGES, 500);
    }
});

// ============================================
// API Routes - Create Operations (POST)
// ============================================

/**
 * POST /api/messages
 * Create a new message
 * User ID automatically obtained from session (requireAuthApi middleware)
 * @body {string} content - Message content (required)
 * @returns {201} Created message with author information
 * @returns {400} Validation error
 * @returns {401} Unauthorized if not logged in
 * @returns {500} Server error
 */
router.post('/messages', requireAuthApi, async (req, res) => {
    try {
        const { content } = req.body;
        const userId = req.session.userId; // Get from session, not body

        // Validate content using centralized validator
        const contentValidation = validateContent(content);
        if (!contentValidation.isValid) {
            return sendJsonError(res, contentValidation.error, 400);
        }

        // No userId validation needed - guaranteed by requireAuthApi middleware
        // User automatically creates message as themselves

        // Create message (use validated and trimmed content)
        const message = await Message.create({
            content: contentValidation.value,
            userId: userId
        });

        // Fetch message with author information
        const messageWithAuthor = await fetchMessageWithAuthor(message.id);

        return sendJsonSuccess(res, MSG.MESSAGE_CREATED, {
            message: formatMessageWithAuthor(messageWithAuthor)
        }, 201);

    } catch (error) {
        console.error('Error creating message:', error);
        return handleSequelizeError(error, res, MSG.FAILED_CREATE_MESSAGE);
    }
});

// ============================================
// API Routes - Update Operations (PUT)
// ============================================

/**
 * PUT /api/messages/:id
 * Update an existing message content
 * Only content field can be updated
 * User can only update their own messages (enforced by isMessageAuthor middleware)
 * @param {number} id - Message ID
 * @body {string} content - New message content (required)
 * @returns {200} Updated message with author information
 * @returns {400} Validation error
 * @returns {401} Unauthorized if not logged in
 * @returns {403} Forbidden if not message owner
 * @returns {404} Message not found
 * @returns {500} Server error
 */
router.put('/messages/:id', requireAuthApi, isMessageAuthor, async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;

        // Validate content using centralized validator
        const contentValidation = validateContent(content);
        if (!contentValidation.isValid) {
            return sendJsonError(res, contentValidation.error, 400);
        }

        // Find message
        const message = await Message.findByPk(id);

        if (!message) {
            return sendJsonError(res, MSG.MESSAGE_NOT_FOUND, 404);
        }

        // Update message (use validated and trimmed content)
        await message.update({
            content: contentValidation.value
        });

        // Fetch updated message with author information
        const messageWithAuthor = await fetchMessageWithAuthor(id);

        return sendJsonSuccess(res, MSG.MESSAGE_UPDATED, {
            message: formatMessageWithAuthor(messageWithAuthor)
        }, 200);

    } catch (error) {
        console.error('Error updating message:', error);
        return handleSequelizeError(error, res, MSG.FAILED_UPDATE_MESSAGE);
    }
});

// ============================================
// API Routes - Delete Operations (DELETE)
// ============================================

/**
 * DELETE /api/messages/:id
 * Soft-delete a message using paranoid mode
 * Sets deletedAt timestamp instead of physically removing from database
 * User can only delete their own messages (enforced by isMessageAuthor middleware)
 * @param {number} id - Message ID
 * @returns {200} Success confirmation
 * @returns {401} Unauthorized if not logged in
 * @returns {403} Forbidden if not message owner
 * @returns {404} Message not found
 * @returns {500} Server error
 */
router.delete('/messages/:id', requireAuthApi, isMessageAuthor, async (req, res) => {
    try {
        const { id } = req.params;

        // Find message
        const message = await Message.findByPk(id);

        if (!message) {
            return sendJsonError(res, MSG.MESSAGE_NOT_FOUND, 404);
        }

        // Soft delete (paranoid mode - sets deletedAt timestamp)
        await message.destroy();
        
        return sendJsonSuccess(res, MSG.MESSAGE_DELETED, {}, 200);

    } catch (error) {
        console.error('Error deleting message:', error);
        return sendJsonError(res, MSG.FAILED_DELETE_MESSAGE, 500);
    }
});

module.exports = router;
