'use strict';

/**
 * Authentication and Authorization Middleware
 * Provides session-based authentication guards and ownership verification for routes
 * Supports both web routes (HTML/redirects) and API routes (JSON responses)
 * @module middleware/auth
 */

// ============================================
// Dependencies
// ============================================

const Message = require('../models/message');
const { sendJsonError } = require('../controllers/errors');
const { isAuthenticated } = require('../utils/session');
const MSG = require('../config/messages');

// ============================================
// Web Route Authentication Middleware
// (HTML pages with redirects)
// ============================================

/**
 * Middleware to redirect authenticated users
 * Used on login/register pages to prevent already-logged-in users from accessing them
 * If user has a valid session, redirect to chatroom
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function redirectIfAuthenticated(req, res, next) {
    if (isAuthenticated(req)) {
        // User is logged in, redirect to chatroom
        return res.redirect('/chatroom');
    }
    next();
}

/**
 * Middleware to require authentication for web routes
 * Used on protected HTML pages (chatroom, profile, etc.)
 * If user is not authenticated, redirect to login page
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function requireAuth(req, res, next) {
    if (!isAuthenticated(req)) {
        return res.redirect('/');
    }
    next();
}

// ============================================
// API Route Authentication Middleware
// (JSON endpoints without redirects)
// ============================================

/**
 * Middleware to require authentication for API endpoints
 * Returns JSON 401 Unauthorized if user is not authenticated
 * Unlike requireAuth, this does NOT redirect (API clients expect JSON)
 * Used for REST API endpoints that are called via fetch/AJAX
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @returns {Object} JSON error response if not authenticated, otherwise calls next()
 */
function requireAuthApi(req, res, next) {
    if (!isAuthenticated(req)) {
        return sendJsonError(res, MSG.UNAUTHORIZED_API, 401);
    }
    next();
}

// ============================================
// Authorization Middleware
// (Ownership and permission checks)
// ============================================

/**
 * Middleware to verify message ownership
 * Checks if current user is the author of the message
 * Returns 404 if message not found, 403 if not the owner
 * Must be used AFTER requireAuthApi middleware in the middleware chain
 * Prevents users from editing or deleting other users' messages
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {string} req.params.id - Message ID from URL
 * @param {Object} req.session - Express session object
 * @param {number} req.session.userId - Current user's ID from session
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @returns {Promise<Object>} JSON error response if unauthorized, otherwise calls next()
 */
async function isMessageAuthor(req, res, next) {
    try {
        const messageId = req.params.id;
        const userId = req.session.userId;
        
        // Find message by ID
        const message = await Message.findByPk(messageId);
        
        if (!message) {
            return sendJsonError(res, MSG.MESSAGE_NOT_FOUND, 404);
        }
        
        // Check ownership - user can only modify their own messages
        if (message.userId !== userId) {
            return sendJsonError(res, MSG.FORBIDDEN_NOT_OWNER, 403);
        }
        
        // User owns the message, proceed to next middleware/handler
        next();
        
    } catch (error) {
        console.error('Error checking message ownership:', error);
        return sendJsonError(res, MSG.AUTHORIZATION_ERROR, 500);
    }
}

// ============================================
// Module Exports
// ============================================

module.exports = {
    // Web authentication
    redirectIfAuthenticated,
    requireAuth,
    
    // API authentication
    requireAuthApi,
    
    // Authorization
    isMessageAuthor
};
