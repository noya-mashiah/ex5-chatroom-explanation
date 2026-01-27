'use strict';

/**
 * Session utility functions
 * Handles user session creation, destruction, and authentication verification
 * Centralizes session management to ensure consistency across the application
 * @module utils/session
 */

// ============================================
// Session Management Functions
// ============================================

/**
 * Create user session with authentication data
 * Populates session with user information after successful login
 * Centralizes session structure to ensure consistency across the application
 * @param {Object} req - Express request object with session
 * @param {Object} user - User object from database (Sequelize instance or plain object)
 * @returns {void}
 */
function createUserSession(req, user) {
    req.session.userId = user.id;
    req.session.userEmail = user.email;
    req.session.userFirstName = user.firstName;
    req.session.userLastName = user.lastName;
    req.session.userName = `${user.firstName} ${user.lastName}`;
}

/**
 * Clear user session data
 * Destroys the session and clears the session cookie
 * Used during logout and session termination
 * @param {Object} req - Express request object with session
 * @param {Object} res - Express response object
 * @param {Function} callback - Callback function to execute after session destruction
 * @returns {void}
 */
function destroyUserSession(req, res, callback) {
    req.session.destroy((err) => {
        if (err) {
            return callback(err);
        }
        // Clear session cookie
        res.clearCookie('connect.sid');
        callback(null);
    });
}

// ============================================
// Session Verification Functions
// ============================================

/**
 * Check if user is authenticated
 * Verifies that session contains valid user ID
 * Used by authentication middleware and controllers
 * @param {Object} req - Express request object with session
 * @returns {boolean} True if user is authenticated, false otherwise
 */
function isAuthenticated(req) {
    return !!(req.session && req.session.userId);
}

// ============================================
// Module Exports
// ============================================

module.exports = {
    createUserSession,
    destroyUserSession,
    isAuthenticated
};
