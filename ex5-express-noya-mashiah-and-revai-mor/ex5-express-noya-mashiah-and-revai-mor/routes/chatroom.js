'use strict';

/**
 * Chatroom routes
 * Handles chatroom page display and message management via form submissions
 * All routes require user authentication
 * @module routes/chatroom
 */

var express = require('express');
var router = express.Router();
var chatroomController = require('../controllers/chatroom');
var { requireAuth } = require('../middleware/auth');

// ============================================
// Chatroom Page Routes (GET)
// ============================================

/**
 * GET /chatroom
 * Display chatroom page with all messages
 * Requires authentication
 * @returns {200} Chatroom page with messages list
 */
router.get('/', requireAuth, chatroomController.showChatroom);

/**
 * GET /chatroom/search
 * Search messages by content and display results
 * Requires authentication
 * @query {string} q - Search query
 * @returns {200} Chatroom page in search mode with filtered messages
 */
router.get('/search', requireAuth, chatroomController.searchMessages);

// ============================================
// Message Management Routes (POST)
// ============================================

/**
 * POST /chatroom/message
 * Add new message via form submission
 * Requires authentication
 * @body {string} content - Message content
 * @returns {302} Redirect back to chatroom with success/error message
 */
router.post('/message', requireAuth, chatroomController.addMessage);

/**
 * POST /chatroom/message/:id/delete
 * Delete message via form submission
 * Requires authentication and ownership verification (checked in controller)
 * @param {number} id - Message ID to delete
 * @returns {302} Redirect back to chatroom with success/error message
 */
router.post('/message/:id/delete', requireAuth, chatroomController.deleteMessage);

module.exports = router;
