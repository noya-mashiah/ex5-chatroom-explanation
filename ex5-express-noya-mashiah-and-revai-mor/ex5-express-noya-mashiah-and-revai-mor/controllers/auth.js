'use strict';

/**
 * Authentication controller
 * Handles user authentication, login/logout operations, and session management
 * @module controllers/auth
 */

// ============================================
// Dependencies
// ============================================

const userModel = require('../models/user');
const { isValidEmail, isValidPassword, sanitizeString, sanitizeStringPreserveCase } = require('../utils/validators');
const { REGISTRATION_SUCCESS_COOKIE } = require('../config/constants');
const MSG = require('../config/messages');
const { createUserSession, destroyUserSession } = require('../utils/session');
const bcrypt = require('bcrypt');

// ============================================
// Helper Functions (Page Rendering)
// ============================================

/**
 * Render login page with optional error message
 * Encapsulates login page rendering logic to prevent duplication
 * @param {Object} res - Express response object
 * @param {string|null} error - Error message to display (null if none)
 * @param {string|null} successMessage - Success message to display (null if none)
 */
function renderLoginPage(res, error = null, successMessage = null) {
    res.render('login', {
        title: 'Login',
        successMessage: successMessage || null,
        error: error || null
    });
}

// ============================================
// Page Rendering Functions
// ============================================

/**
 * Display the login page
 * Checks for registration success cookie and displays message if present
 * Redirects authenticated users to chatroom
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
function showLoginPage(req, res) {
    // Check if user is already authenticated
    if (req.session && req.session.userId) {
        return res.redirect('/chatroom');
    }

    // Check for registration success cookie
    const successMessage = req.cookies[REGISTRATION_SUCCESS_COOKIE];

    // Clear the cookie after reading
    if (successMessage) {
        res.clearCookie(REGISTRATION_SUCCESS_COOKIE);
    }

    renderLoginPage(res, null, successMessage);
}

// ============================================
// Authentication Operations
// ============================================

/**
 * Handle login form submission
 * Validates credentials using Sequelize database query and bcrypt
 * Creates session on successful authentication
 * @async
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} Redirects to chatroom on success or renders login with error
 */
async function login(req, res) {
    const { email, password } = req.body;

    // Sanitize and validate email
    const sanitizedEmail = sanitizeString(email);

    if (!isValidEmail(sanitizedEmail)) {
        return renderLoginPage(res, MSG.INVALID_EMAIL_FORMAT, null);
    }

    // Validate password (trim but don't lowercase)
    const trimmedPassword = sanitizeStringPreserveCase(password);

    if (!isValidPassword(trimmedPassword)) {
        return renderLoginPage(res, MSG.PASSWORD_REQUIRED, null);
    }

    try {
        // Find user in database using Sequelize
        const user = await userModel.findOne({
            where: { email: sanitizedEmail }
        });

        if (!user) {
            return renderLoginPage(res, MSG.INVALID_CREDENTIALS, null);
        }

        // Verify password using bcrypt
        const passwordMatch = await bcrypt.compare(trimmedPassword, user.password);

        if (!passwordMatch) {
            return renderLoginPage(res, MSG.INVALID_CREDENTIALS, null);
        }

        // Create session with user data
        createUserSession(req, user);

        // Redirect to chatroom
        res.redirect('/chatroom');

    } catch (err) {
        // Handle database or bcrypt errors
        console.error('Login error:', err);
        return renderLoginPage(res, MSG.LOGIN_FAILED, null);
    }
}

/**
 * Handle logout
 * Destroys session and redirects to login page
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
function logout(req, res) {
    destroyUserSession(req, res, (err) => {
        if (err) {
            return res.status(500).send(MSG.LOGOUT_ERROR);
        }
        res.redirect('/');
    });
}

// ============================================
// Module Exports
// ============================================

module.exports = {
    showLoginPage,
    login,
    logout
};
