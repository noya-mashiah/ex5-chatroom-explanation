'use strict';

/**
 * Registration routes
 * Handles two-step user registration process with cookie-based state management
 * Step 1: Email validation and data storage
 * Step 2: Password creation and account completion
 * @module routes/register
 */

var express = require('express');
var router = express.Router();
var registerController = require('../controllers/register');
var { redirectIfAuthenticated } = require('../middleware/auth');

// ============================================
// Registration Page Route (GET)
// ============================================

/**
 * GET /register
 * Display registration page (landing page for new user registration)
 * Redirects authenticated users to chatroom
 * Shows Step 1 or Step 2 based on cookie presence
 * @returns {200} Registration form (Step 1 or Step 2)
 * @returns {302} Redirect to /chatroom if already authenticated
 */
router.get('/', redirectIfAuthenticated, registerController.showRegisterPage);

// ============================================
// Registration Step 1 Routes (POST) - Email Validation & Storage
// ============================================

/**
 * POST /register/validate
 * Validate email availability (Step 1a)
 * Checks if email is already registered in database
 * @body {string} email - Email to validate
 * @returns {200} JSON success if email available
 * @returns {400} JSON error if email already exists
 */
router.post('/validate', redirectIfAuthenticated, registerController.validateEmail);

/**
 * POST /register/store
 * Store registration data in cookie (Step 1b)
 * Saves first name, last name, and email in encrypted cookie with timestamp
 * @body {string} firstName - User's first name
 * @body {string} lastName - User's last name
 * @body {string} email - User's email
 * @returns {200} JSON success with timestamp if data stored
 * @returns {400} JSON error if validation fails
 */
router.post('/store', redirectIfAuthenticated, registerController.storeRegistrationData);

// ============================================
// Registration Step 2 Routes (POST) - Account Creation
// ============================================

/**
 * POST /register
 * Complete registration with password (Step 2)
 * Creates user account in database using cookie data + password
 * @body {string} firstName - User's first name (from hidden field/cookie)
 * @body {string} lastName - User's last name (from hidden field/cookie)
 * @body {string} email - User's email (from hidden field/cookie)
 * @body {string} password - User's chosen password (bcrypt hashed by model hook)
 * @returns {200} JSON success if account created
 * @returns {400} JSON error if validation fails or cookie expired
 */
router.post('/', redirectIfAuthenticated, registerController.completeRegistration);

module.exports = router;
