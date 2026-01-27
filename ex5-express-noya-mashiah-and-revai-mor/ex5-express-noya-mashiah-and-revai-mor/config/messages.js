'use strict';

/**
 * Application Message Strings
 * Centralized message constants for consistent API and UI responses
 * Organized by category for easy maintenance and updates
 * @module config/messages
 */

// ============================================
// Success Messages (API & UI)
// ============================================

/**
 * Success messages for API responses
 * Used when operations complete successfully (HTTP 200, 201)
 */
const SUCCESS = {
    // Message retrieval
    MESSAGES_RETRIEVED: 'Messages retrieved successfully',
    
    // Message creation
    MESSAGE_CREATED: 'Message created successfully',
    
    // Message update
    MESSAGE_UPDATED: 'Message updated successfully',
    
    // Message deletion
    MESSAGE_DELETED: 'Message deleted successfully',
    
    // Message search
    SEARCH_COMPLETED: 'Search completed successfully',

    // UI success messages
    MESSAGE_SENT: 'Message sent successfully'
};

// ============================================
// Error Messages (API & UI)
// ============================================

/**
 * Error messages for API responses
 * Used for validation, not found, and server errors (HTTP 400, 404, 500)
 */
const ERROR = {
    // Not found errors (404)
    MESSAGE_NOT_FOUND: 'Message not found',
    
    // Validation errors (400)
    SEARCH_QUERY_REQUIRED: 'Search query is required',
    MESSAGE_EMPTY: 'Message content cannot be empty',

    // Server errors (500)
    FAILED_FETCH_MESSAGES: 'Failed to fetch messages',
    FAILED_CREATE_MESSAGE: 'Failed to create message',
    FAILED_UPDATE_MESSAGE: 'Failed to update message',
    FAILED_DELETE_MESSAGE: 'Failed to delete message',
    FAILED_SEARCH_MESSAGES: 'Failed to search messages',
    FAILED_SEND_MESSAGE: 'Failed to send message. Please try again.',
    FAILED_LOAD_MESSAGES: 'Failed to load messages. Please refresh the page.',
    SEARCH_FAILED: 'Search failed. Please try again.',
    NOT_MESSAGE_OWNER: 'You can only delete your own messages',
    INVALID_MESSAGE_CONTENT: 'Invalid message content'
};

// ============================================
// Authentication Messages
// ============================================

/**
 * Authentication and authorization messages
 * Used for login, logout, session validation, and permission checks
 */
const AUTH = {
    // Login errors
    INVALID_EMAIL_FORMAT: 'Invalid email format',
    PASSWORD_REQUIRED: 'Password is required',
    INVALID_CREDENTIALS: 'Invalid email or password',
    LOGIN_FAILED: 'Login failed. Please try again.',
    
    // Logout errors
    LOGOUT_ERROR: 'Error logging out',

    // API authentication errors (HTTP 401, 403)
    UNAUTHORIZED_API: 'Unauthorized: Authentication required',
    FORBIDDEN_NOT_OWNER: 'Forbidden: You can only modify your own messages',
    AUTHORIZATION_ERROR: 'Server error during authorization check'
};

// ============================================
// Registration Messages
// ============================================

/**
 * Registration process messages
 * Used for email validation, session timeouts, and registration errors
 */
const REGISTER = {
    // Email validation
    EMAIL_EXISTS: 'This email is already in use, please use another one',
    
    // Session timeout
    REGISTRATION_TIMEOUT: 'Registration session expired. Please start over.'
};

// ============================================
// Module Exports
// ============================================

/**
 * Export message categories and flat structure
 * Categories: For organized imports (e.g., MSG.SUCCESS.MESSAGE_CREATED)
 * Flat: For convenience (e.g., MSG.MESSAGE_CREATED)
 */
module.exports = {
    // Categorized exports
    SUCCESS,
    ERROR,
    AUTH,
    REGISTER,
    
    // Flat exports for convenience
    ...SUCCESS,
    ...ERROR,
    ...AUTH,
    ...REGISTER
};
