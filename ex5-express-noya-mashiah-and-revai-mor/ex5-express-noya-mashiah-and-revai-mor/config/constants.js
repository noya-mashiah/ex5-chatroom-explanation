'use strict';

/**
 * Application Configuration Constants
 * Centralized configuration values used across the application
 * Prevents circular dependencies and provides single source of truth
 * @module config/constants
 */

// ============================================
// Registration Configuration
// ============================================

/**
 * Registration timeout in seconds
 * Time limit for completing the two-step registration process
 * Note: Defined here to prevent circular dependency with app.js and controllers/register.js
 */
const REGISTER_TIMEOUT = 30;

/**
 * Registration warning threshold in seconds
 * Timer color changes to red when remaining time is below this value
 */
const REGISTER_TIMEOUT_WARNING_THRESHOLD = 10;

/**
 * Cookie name for registration success message
 * Used to display success message after registration completion
 */
const REGISTRATION_SUCCESS_COOKIE = 'registrationSuccess';

// ============================================
// Chatroom Configuration
// ============================================

/**
 * Polling interval for chat updates in milliseconds
 * Default: 10 seconds for production
 * Note: Can be increased to 300000 (5 minutes) for testing if needed
 */
const POLLING = 10000;

// ============================================
// Session Configuration
// ============================================

/**
 * Session secret key for cookie signing
 * Should be set via environment variable in production
 */
const SESSION_SECRET = process.env.SESSION_SECRET || 'your-secret-key-change-in-production';

/**
 * Session maximum age in milliseconds
 * Default: 24 hours
 */
const SESSION_MAX_AGE = 24 * 60 * 60 * 1000;

// ============================================
// Module Exports
// ============================================

module.exports = {
    // Registration
    REGISTER_TIMEOUT,
    REGISTER_TIMEOUT_WARNING_THRESHOLD,
    REGISTRATION_SUCCESS_COOKIE,
    
    // Chatroom
    POLLING,
    
    // Session
    SESSION_SECRET,
    SESSION_MAX_AGE
};
