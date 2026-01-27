'use strict';

/**
 * Login routes
 * Handles user authentication (login and logout) endpoints
 * Redirects authenticated users away from login page
 * @module routes/login
 */

var express = require('express');
var router = express.Router();
var authController = require('../controllers/auth');
var { redirectIfAuthenticated } = require('../middleware/auth');

// ============================================
// Login Page Route (GET)
// ============================================

/**
 * GET /
 * Display login page (application landing page)
 * Redirects authenticated users to chatroom
 * @returns {200} Login page for unauthenticated users
 * @returns {302} Redirect to /chatroom if already authenticated
 */
router.get('/', redirectIfAuthenticated, authController.showLoginPage);

// ============================================
// Authentication Action Routes (POST)
// ============================================

/**
 * POST /login
 * Handle login form submission
 * Validates credentials and creates session
 * Redirects authenticated users to chatroom before processing
 * @body {string} email - User email
 * @body {string} password - User password
 * @returns {302} Redirect to /chatroom on success, back to / on failure
 */
router.post('/login', redirectIfAuthenticated, authController.login);

/**
 * POST /logout
 * Handle logout action
 * Destroys user session and redirects to login page
 * @returns {302} Redirect to / (login page)
 */
router.post('/logout', authController.logout);

module.exports = router;
