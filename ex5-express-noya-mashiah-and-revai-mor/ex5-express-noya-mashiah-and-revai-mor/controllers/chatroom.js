'use strict';

/**
 * Chatroom controller
 * Handles chatroom display, message CRUD operations, and search functionality
 * @module controllers/chatroom
 */

// ============================================
// Dependencies
// ============================================

const Message = require('../models/message');
const User = require('../models/user');
const { Op } = require('sequelize');
const { POLLING } = require('../config/constants');
const MSG = require('../config/messages');

// ============================================
// Helper Functions (Session & Data Formatting)
// ============================================

/**
 * Extract user data from session
 * Encapsulates session data access for better maintainability
 * @param {Object} session - Express session object
 * @returns {Object} User object with id, firstName, lastName, and email
 */
function getUserFromSession(session) {
    if (!session) {
        return {
            id: null,
            firstName: '',
            lastName: '',
            email: ''
        };
    }
    
    return {
        id: session.userId || null,
        firstName: session.userFirstName || '',
        lastName: session.userLastName || '',
        email: session.userEmail || ''
    };
}

/**
 * Format message for template rendering
 * Encapsulates message formatting logic to eliminate duplication
 * @param {Object} msg - Message model instance with author included
 * @returns {Object} Formatted message object for template
 */
function formatMessage(msg) {
    return {
        id: msg.id,
        content: msg.content,
        userId: msg.userId,
        authorFirstName: msg.author.firstName,
        authorLastName: msg.author.lastName,
        createdAt: msg.createdAt,
        updatedAt: msg.updatedAt,
        isEdited: msg.updatedAt > msg.createdAt
    };
}

/**
 * Format multiple messages for template rendering
 * @param {Array} messages - Array of message model instances
 * @returns {Array} Array of formatted message objects
 */
function formatMessages(messages) {
    return messages.map(formatMessage);
}

// ============================================
// Page Rendering Functions
// ============================================

/**
 * Display the chatroom page with all messages
 * Fetches messages from database with author information
 * @async
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function showChatroom(req, res) {
    try {
        const user = getUserFromSession(req.session);
        
        // Fetch all messages with author information
        const messages = await Message.findAll({
            include: [{
                model: User,
                as: 'author',
                attributes: ['id', 'firstName', 'lastName']
            }],
            order: [['createdAt', 'DESC']], // Newest first
            paranoid: true // Exclude soft-deleted messages
        });

        // Format messages for template
        const formattedMessages = formatMessages(messages);

        res.render('chatroom', {
            title: 'Chatroom',
            user: user,
            messages: formattedMessages,
            polling: POLLING,
            successMessage: req.query.success || null,
            errorMessage: req.query.error || null,
            searchQuery: null // Not in search mode
        });

    } catch (error) {
        console.error('Error fetching messages:', error);
        res.render('chatroom', {
            title: 'Chatroom',
            user: getUserFromSession(req.session),
            messages: [],
            polling: POLLING,
            successMessage: null,
            errorMessage: MSG.FAILED_LOAD_MESSAGES,
            searchQuery: null
        });
    }
}

/**
 * Search messages by content
 * Renders chatroom page in search mode with filtered results
 * @async
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function searchMessages(req, res) {
    try {
        const user = getUserFromSession(req.session);
        const searchQuery = req.query.q ? req.query.q.trim() : '';
        
        let messages = [];
        
        if (searchQuery) {
            // Search messages containing the query
            messages = await Message.findAll({
                where: {
                    content: {
                        [Op.like]: `%${searchQuery}%`
                    }
                },
                include: [{
                    model: User,
                    as: 'author',
                    attributes: ['id', 'firstName', 'lastName']
                }],
                order: [['createdAt', 'DESC']],
                paranoid: true
            });
        }
        
        // Format messages
        const formattedMessages = formatMessages(messages);

        res.render('chatroom', {
            title: 'Search Messages',
            user: user,
            messages: formattedMessages,
            polling: POLLING,
            successMessage: null,
            errorMessage: null,
            searchQuery: searchQuery // Search mode enabled
        });

    } catch (error) {
        console.error('Error searching messages:', error);
        res.render('chatroom', {
            title: 'Search Messages',
            user: getUserFromSession(req.session),
            messages: [],
            polling: POLLING,
            successMessage: null,
            errorMessage: MSG.SEARCH_FAILED,
            searchQuery: req.query.q || ''
        });
    }
}

// ============================================
// Message CRUD Operations
// ============================================

/**
 * Add new message via form submission
 * Creates message in database and redirects back to chatroom
 * @async
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function addMessage(req, res) {
    try {
        const { content } = req.body;
        const userId = req.session.userId;
        
        // Validate content
        const trimmedContent = content ? content.trim() : '';
        if (!trimmedContent) {
            return res.redirect('/chatroom?error=' + encodeURIComponent(MSG.MESSAGE_EMPTY));
        }
        
        // Create message in database
        await Message.create({
            content: trimmedContent,
            userId: userId
        });

        // Redirect back to chatroom (page reload shows new message)
        res.redirect('/chatroom?success=' + encodeURIComponent(MSG.MESSAGE_SENT));

    } catch (error) {
        console.error('Error adding message:', error);
        
        // Handle Sequelize validation errors
        if (error.name === 'SequelizeValidationError') {
            const errorMessage = error.errors[0]?.message || MSG.INVALID_MESSAGE_CONTENT;
            return res.redirect('/chatroom?error=' + encodeURIComponent(errorMessage));
        }

        res.redirect('/chatroom?error=' + encodeURIComponent(MSG.FAILED_SEND_MESSAGE));
    }
}

/**
 * Delete message via form submission
 * Performs soft delete (paranoid mode) after ownership verification
 * @async
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function deleteMessage(req, res) {
    try {
        const messageId = req.params.id;
        const userId = req.session.userId;
        
        // Find message
        const message = await Message.findByPk(messageId);
        
        if (!message) {
            return res.redirect('/chatroom?error=' + encodeURIComponent(MSG.MESSAGE_NOT_FOUND));
        }
        
        // Check ownership
        if (message.userId !== userId) {
            return res.redirect('/chatroom?error=' + encodeURIComponent(MSG.NOT_MESSAGE_OWNER));
        }

        // Soft delete (paranoid mode - sets deletedAt timestamp)
        await message.destroy();
        
        // IMMEDIATE UPDATE via page redirect
        res.redirect('/chatroom?success=' + encodeURIComponent(MSG.MESSAGE_DELETED));
        
    } catch (error) {
        console.error('Error deleting message:', error);
        res.redirect('/chatroom?error=' + encodeURIComponent(MSG.FAILED_DELETE_MESSAGE));
    }
}

// ============================================
// Module Exports
// ============================================

module.exports = {
    showChatroom,
    addMessage,
    deleteMessage,
    searchMessages
};
