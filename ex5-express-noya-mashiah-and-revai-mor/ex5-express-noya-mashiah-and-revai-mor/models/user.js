'use strict';

/**
 * User model using Sequelize ORM
 * Manages user accounts with MariaDB persistence
 * Includes automatic password hashing via bcrypt hooks
 * Follows reference architecture pattern from 12-express-db-master
 * @module models/user
 */

const { DataTypes } = require('sequelize');
const sequelize = require('./index');
const bcrypt = require('bcrypt');

// ============================================
// Model Schema Definition
// ============================================

/**
 * User model definition
 * Represents registered users in the chatroom application
 * 
 * Features:
 * - Auto-incrementing primary key (id)
 * - Unique email for authentication
 * - Bcrypt-hashed password (never stored in plain text)
 * - First and last name validation (3-32 characters, letters only)
 * - Automatic timestamps (createdAt, updatedAt)
 * - Data normalization (lowercase email/names, trimmed values)
 * - Automatic password hashing on create/update
 * 
 * Security:
 * - Password hashing handled automatically by hooks
 * - Bcrypt with 10 salt rounds (industry standard)
 * - Password max length: 32 characters (project requirement)
 * 
 * Relationship:
 * - User hasMany Message (defined in app.js)
 * - Message belongsTo User (defined in app.js)
 */
const User = sequelize.define('User', {
    // ============================================
    // Primary Key Field
    // ============================================
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    // ============================================
    // Authentication Fields
    // ============================================
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: {
            msg: 'This email is already in use, please choose another one'
        },
        validate: {
            isEmail: {
                msg: 'Valid email is required'
            },
            notEmpty: {
                msg: 'Email cannot be empty'
            }
        }
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'Password is required'
            },
            len: {
                args: [1, 32], // Project requirement: max 32 characters
                msg: 'Password must be between 1 and 32 characters'
            }
        }
    },

    // ============================================
    // User Profile Fields
    // ============================================
    firstName: {
        type: DataTypes.STRING(32),
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'First name is required'
            },
            len: {
                args: [3, 32],
                msg: 'First name must be 3-32 characters'
            },
            isAlpha: {
                msg: 'First name must contain only letters'
            }
        }
    },
    lastName: {
        type: DataTypes.STRING(32),
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'Last name is required'
            },
            len: {
                args: [3, 32],
                msg: 'Last name must be 3-32 characters'
            },
            isAlpha: {
                msg: 'Last name must contain only letters'
            }
        }
    }
}, {
    // ============================================
    // Model Options
    // ============================================
    timestamps: true, // Adds createdAt and updatedAt fields automatically

    // ============================================
    // Model Hooks (Lifecycle Events)
    // ============================================
    hooks: {
        /**
         * Sanitize and normalize user data before validation
         * Ensures consistent data format in database
         * Operations:
         * - Email: trimmed and lowercase (for case-insensitive login)
         * - Names: trimmed and lowercase (for consistent display)
         * - Password: trimmed only (case-sensitive)
         * @param {Object} user - User instance being validated
         */
        beforeValidate: (user) => {
            if (user.email) {
                user.email = user.email.trim().toLowerCase();
            }
            if (user.firstName) {
                user.firstName = user.firstName.trim().toLowerCase();
            }
            if (user.lastName) {
                user.lastName = user.lastName.trim().toLowerCase();
            }
            if (user.password) {
                user.password = user.password.trim();
            }
        },

        /**
         * Hash password before creating new user
         * Uses bcrypt with 10 salt rounds (2^10 = 1024 iterations)
         * Salt rounds balance security vs performance:
         * - 10 rounds: industry standard, ~100ms per hash
         * - Higher rounds: slower but more secure against brute force
         * @async
         * @param {Object} user - User instance being created
         * @throws {Error} If password hashing fails
         */
        beforeCreate: async (user) => {
            if (user.password) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
        },

        /**
         * Hash password before updating user if password was changed
         * Prevents re-hashing already hashed passwords
         * Only hashes if password field was actually modified
         * @async
         * @param {Object} user - User instance being updated
         * @throws {Error} If password hashing fails
         */
        beforeUpdate: async (user) => {
            if (user.changed('password')) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
        }
    }
});

// ============================================
// Static Methods (Model-Level Functions)
// ============================================

/**
 * Check if email already exists in database
 * Used for duplicate email validation during registration
 * Prevents registration with already-taken email addresses
 * @async
 * @param {string} email - Email address to check
 * @returns {Promise<boolean>} True if email exists, false otherwise
 * @example
 * const exists = await User.emailExists('test@example.com');
 * if (exists) {
 *   return res.status(400).json({ error: 'Email already in use' });
 * }
 */
User.emailExists = async function(email) {
    const user = await this.findOne({ where: { email } });
    return !!user;
};

// ============================================
// Module Exports
// ============================================

/**
 * Export User model
 * Imported by app.js to define relationships and sync database
 * Imported by controllers to perform CRUD operations (registration, login)
 */
module.exports = User;
