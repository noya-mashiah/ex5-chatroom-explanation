'use strict';

/**
 * Message model using Sequelize ORM
 * Manages chat messages with soft-delete support (paranoid mode)
 * Each message belongs to a user (author) via foreign key relationship
 * Follows Contact-Order pattern from reference architecture
 * @module models/message
 */

const { DataTypes } = require('sequelize');
const sequelize = require('./index');

// ============================================
// Model Schema Definition
// ============================================

/**
 * Message model definition
 * Represents individual chat messages in the chatroom
 * 
 * Features:
 * - Auto-incrementing primary key (id)
 * - Text content with validation (1-5000 characters)
 * - Foreign key relationship to User model (userId)
 * - Automatic timestamps (createdAt, updatedAt)
 * - Soft-delete support (deletedAt) via paranoid mode
 * - Content sanitization before validation (trim whitespace)
 * 
 * Relationship:
 * - Message belongsTo User (defined in app.js)
 * - User hasMany Message (defined in app.js)
 */
const Message = sequelize.define('Message', {
    // ============================================
    // Primary Key Field
    // ============================================
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    // ============================================
    // Content Field
    // ============================================
    content: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'Message content cannot be empty'
            },
            len: {
                args: [1, 5000],
                msg: 'Message must be between 1 and 5000 characters'
            }
        }
    },

    // ============================================
    // Foreign Key Field (Relationship to User)
    // ============================================
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Users',  // References the Users table
            key: 'id'        // References the id column
        },
        validate: {
            notNull: {
                msg: 'Message must have an author (userId required)'
            }
        }
    }
}, {
    // ============================================
    // Model Options
    // ============================================
    timestamps: true,  // Adds createdAt and updatedAt fields
    paranoid: true,    // Adds deletedAt field for soft deletion (never physically removes records)

    // ============================================
    // Model Hooks (Lifecycle Events)
    // ============================================
    hooks: {
        /**
         * Sanitize message content before validation
         * Trims whitespace to ensure clean message storage
         * Prevents empty/whitespace-only messages from passing validation
         * @param {Object} message - Message instance being validated
         */
        beforeValidate: (message) => {
            if (message.content) {
                message.content = message.content.trim();
            }
        }
    }
});

// ============================================
// Module Exports
// ============================================

/**
 * Export Message model
 * Imported by app.js to define relationships and sync database
 * Imported by controllers to perform CRUD operations
 */
module.exports = Message;
