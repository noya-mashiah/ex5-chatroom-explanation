'use strict';

/**
 * Validation and sanitization utility functions
 * Provides centralized input validation for user data and message content
 * Ensures consistent validation rules across the application
 * @module utils/validators
 */

// ============================================
// Validation Constants
// ============================================

/**
 * Email validation regex pattern
 * Validates standard email format (user@domain.ext)
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Letters-only regex pattern
 * Used for name validation (a-z, A-Z only)
 */
const LETTERS_ONLY_REGEX = /^[a-zA-Z]+$/;

/**
 * Maximum length for standard input fields
 * Applies to names, emails, and passwords
 */
const MAX_INPUT_LENGTH = 32;

/**
 * Minimum length for name fields
 * Ensures meaningful name input
 */
const MIN_NAME_LENGTH = 3;

/**
 * Maximum length for message content
 * Prevents excessively long messages
 */
const MAX_CONTENT_LENGTH = 5000;

// ============================================
// User Input Validation Functions
// ============================================

/**
 * Check if email format is valid
 * Validates email structure and length constraints
 * @param {string} email - Email address to validate
 * @returns {boolean} True if email format is valid, false otherwise
 */
function isValidEmail(email) {
    if (!email || typeof email !== 'string') {
        return false;
    }

    const trimmedEmail = email.trim();

    // Check length and format
    return trimmedEmail.length > 0 &&
        trimmedEmail.length <= MAX_INPUT_LENGTH &&
        EMAIL_REGEX.test(trimmedEmail);
}

/**
 * Check if name is valid
 * Validates name length and ensures letters-only (a-z, A-Z)
 * @param {string} name - Name to validate
 * @returns {boolean} True if name is valid, false otherwise
 */
function isValidName(name) {
    if (!name || typeof name !== 'string') {
        return false;
    }

    const trimmedName = name.trim();

    return trimmedName.length >= MIN_NAME_LENGTH &&
        trimmedName.length <= MAX_INPUT_LENGTH &&
        LETTERS_ONLY_REGEX.test(trimmedName);
}

/**
 * Check if password is valid
 * Validates password is not empty and within length constraints
 * @param {string} password - Password to validate
 * @returns {boolean} True if password is valid, false otherwise
 */
function isValidPassword(password) {
    if (!password || typeof password !== 'string') {
        return false;
    }

    const trimmedPassword = password.trim();

    // Check length (not empty, max 32 characters)
    return trimmedPassword.length > 0 &&
        trimmedPassword.length <= MAX_INPUT_LENGTH;
}

// ============================================
// String Sanitization Functions
// ============================================

/**
 * Sanitize string by trimming and converting to lowercase
 * Used for case-insensitive fields (emails, usernames)
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string (trimmed and lowercase)
 */
function sanitizeString(str) {
    if (!str || typeof str !== 'string') {
        return '';
    }
    return str.trim().toLowerCase();
}

/**
 * Sanitize string by trimming only (preserve case)
 * Used for fields where case matters (passwords, message content)
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string (trimmed, case preserved)
 */
function sanitizeStringPreserveCase(str) {
    if (!str || typeof str !== 'string') {
        return '';
    }
    return str.trim();
}

// ============================================
// Message Content Validation Functions
// ============================================

/**
 * Validate message content
 * Checks that content is not empty and within length limits
 * Returns structured validation result with error messages
 * @param {string} content - Message content to validate
 * @returns {Object} Validation result with { isValid: boolean, value: string, error: string|null }
 */
function validateContent(content) {
    if (!content || typeof content !== 'string') {
        return { 
            isValid: false, 
            value: '', 
            error: 'Message content is required' 
        };
    }
    
    const trimmed = content.trim();
    
    if (trimmed === '') {
        return { 
            isValid: false, 
            value: '', 
            error: 'Message content cannot be empty' 
        };
    }
    
    if (trimmed.length > MAX_CONTENT_LENGTH) {
        return { 
            isValid: false, 
            value: trimmed, 
            error: `Message content must not exceed ${MAX_CONTENT_LENGTH} characters` 
        };
    }
    
    return { 
        isValid: true, 
        value: trimmed, 
        error: null 
    };
}

// ============================================
// Module Exports
// ============================================

module.exports = {
    isValidEmail,
    isValidName,
    isValidPassword,
    sanitizeString,
    sanitizeStringPreserveCase,
    validateContent
};
