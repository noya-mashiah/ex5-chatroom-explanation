'use strict';

/**
 * Error handling controller
 * Provides centralized error handling for both HTML pages and JSON API responses
 * Includes 404 handlers, general error middleware, and standardized JSON error formatting
 * @module controllers/errors
 */

// ============================================
// Dependencies
// ============================================

const createError = require('http-errors');
const MSG = require('../config/messages');

// ============================================
// HTML Error Handlers (Express Middleware)
// ============================================

/**
 * Handle 404 Not Found errors
 * Creates a 404 error and passes it to error handler
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function get404(req, res, next) {
    next(createError(404, 'Page not found'));
}

/**
 * Handle general application errors
 * Renders error page with appropriate status code
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function handleError(err, req, res, next) {
    // Set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // Render the error page
    res.status(err.status || 500);
    res.render('error', {
        title: 'Error',
        message: err.message,
        error: res.locals.error
    });
}

// ============================================
// JSON Error Response Functions (API Endpoints)
// ============================================

/**
 * Base function for sending JSON error responses
 * Encapsulates common error response structure
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 400)
 * @param {Object} additionalData - Additional data to include in response (optional)
 * @returns {Object} Express response object
 * @private
 */
function _sendJsonErrorBase(res, message, statusCode = 400, additionalData = {}) {
    return res.status(statusCode).json({
        success: false,
        message: message,
        ...additionalData
    });
}

/**
 * Send JSON error response (for API endpoints)
 * Generic error response for validation and server errors
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 400)
 * @returns {Object} Express response object
 */
function sendJsonError(res, message, statusCode = 400) {
    return _sendJsonErrorBase(res, message, statusCode);
}

/**
 * Send JSON error response with emailExists flag
 * Specialized error for duplicate email registration attempts
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 400)
 * @returns {Object} Express response object
 */
function sendEmailExistsError(res, message = MSG.EMAIL_EXISTS, statusCode = 400) {
    return _sendJsonErrorBase(res, message, statusCode, { emailExists: true });
}

/**
 * Send JSON error response with timeout flag
 * Specialized error for registration session timeouts
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 400)
 * @returns {Object} Express response object
 */
function sendTimeoutError(res, message = MSG.REGISTRATION_TIMEOUT, statusCode = 400) {
    return _sendJsonErrorBase(res, message, statusCode, { timeout: true });
}

// ============================================
// JSON Success Response Functions (API Endpoints)
// ============================================

/**
 * Send JSON success response (for API endpoints)
 * Provides consistent success response structure
 * @param {Object} res - Express response object
 * @param {string} message - Success message
 * @param {Object} additionalData - Additional data to include in response (optional)
 * @param {number} statusCode - HTTP status code (default: 200)
 * @returns {Object} Express response object
 */
function sendJsonSuccess(res, message, additionalData = {}, statusCode = 200) {
    return res.status(statusCode).json({
        success: true,
        message: message,
        ...additionalData
    });
}

// ============================================
// Module Exports
// ============================================

module.exports = {
    get404,
    handleError,
    sendJsonError,
    sendEmailExistsError,
    sendTimeoutError,
    sendJsonSuccess
};
