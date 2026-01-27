'use strict';

/**
 * Main application entry point
 * Express application setup with database, middleware, and routing configuration
 * Initializes MariaDB connection via Sequelize and establishes User-Message relationships
 * @module app
 */

// ============================================
// Module Dependencies & Imports
// ============================================

// Configuration constants
const { SESSION_SECRET, SESSION_MAX_AGE } = require('./config/constants');

// Express core dependencies
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const logger = require('morgan');

// Sequelize database connection and models
const sequelize = require('./models/index');
const User = require('./models/user');
const Message = require('./models/message');

// Route handlers
const loginRouter = require('./routes/login');
const apiRouter = require('./routes/api');
const registerRouter = require('./routes/register');
const chatroomRouter = require('./routes/chatroom');

// Controllers
const errorController = require('./controllers/errors');

// ============================================
// Database Model Relationships
// ============================================

/**
 * Establish User-Message relationship (one-to-many)
 * Pattern follows Contact-Order relationship from reference project (12-express-db-master)
 * - One User can have many Messages
 * - Each Message belongs to one User
 * - Cascade delete: When user is deleted, all their messages are also deleted
 */
User.hasMany(Message, {
    foreignKey: 'userId',
    as: 'messages',
    onDelete: 'CASCADE' // Delete user's messages when user is deleted
});

Message.belongsTo(User, {
    foreignKey: 'userId',
    as: 'author'
});

// ============================================
// Express Application Initialization
// ============================================

const app = express();

// ============================================
// Database Connection & Synchronization
// ============================================

/**
 * Initialize database connection and sync models
 * Uses IIFE (Immediately Invoked Function Expression) for async/await
 * - Authenticates connection to MariaDB
 * - Synchronizes Sequelize models with database tables
 * - Uses { force: false } to preserve existing data
 */
(async () => {
    try {
        await sequelize.authenticate();
        console.log('MariaDB connection established successfully.');

        // Sync models with database
        // Use { force: false } to preserve existing data
        // Change to { force: true } only during development to reset tables
        await sequelize.sync({ force: false });
        console.log('Database models synchronized successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
})();

// ============================================
// View Engine Configuration
// ============================================

// Set up EJS as the view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// ============================================
// Middleware Configuration
// ============================================

// HTTP request logger (development mode)
app.use(logger('dev'));

// Body parsers for JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Cookie parser for reading cookies
app.use(cookieParser());

// Session middleware configuration
// Manages user sessions with secure cookies
app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,      // Set to true in production with HTTPS
        httpOnly: true,     // Prevents client-side JavaScript access to cookies
        maxAge: SESSION_MAX_AGE // 24 hours (from constants)
    }
}));

// Static file serving (CSS, JavaScript, images)
app.use(express.static(path.join(__dirname, 'public')));

// ============================================
// Route Registration
// ============================================

// Application routes (order matters - more specific routes first)
app.use('/', loginRouter);           // Root path: login/logout
app.use('/register', registerRouter); // User registration (two-step process)
app.use('/chatroom', chatroomRouter); // Chatroom page and message operations
app.use('/api', apiRouter);           // REST API for messages (JSON responses)

// ============================================
// Error Handling
// ============================================

// Catch 404 errors and forward to error handler
app.use(errorController.get404);

// Global error handler
// Handles all errors from routes and middleware
app.use(errorController.handleError);

// ============================================
// Module Export
// ============================================

module.exports = app;
