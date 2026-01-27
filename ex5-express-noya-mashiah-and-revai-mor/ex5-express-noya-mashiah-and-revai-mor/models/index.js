'use strict';

/**
 * Sequelize database connection configuration
 * Connects to MariaDB running in Docker container
 * Provides centralized database connection for all models
 * @module models/index
 */

const { Sequelize } = require('sequelize');

// ============================================
// Configuration & Environment Variables
// ============================================

/**
 * Database configuration from docker-compose.yml
 * Environment variables allow override for different environments (dev, test, production)
 * 
 * Default values match docker-compose.yml:
 * - Database: mydb
 * - User: internet
 * - Password: internet
 * - Host: localhost (when accessed from host machine)
 * - Port: 3306 (default MariaDB port)
 */
const DB_NAME = process.env.DB_NAME || 'mydb';
const DB_USER = process.env.DB_USER || 'internet';
const DB_PASS = process.env.DB_PASS || 'internet';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306;

// ============================================
// Database Connection Setup
// ============================================

/**
 * Sequelize instance configured for MariaDB
 * Uses connection pooling for efficient database access
 * Connection pool configuration:
 * - max: 5 connections (prevents overwhelming database)
 * - min: 0 connections (releases all when idle)
 * - acquire: 30s timeout (prevents hanging requests)
 * - idle: 10s timeout (closes unused connections)
 * 
 * Logging is disabled by default for cleaner console output
 * Set logging: console.log to see SQL queries during debugging
 */
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
    host: DB_HOST,
    dialect: 'mariadb',
    port: DB_PORT,
    logging: false, // Set to console.log to see SQL queries during debugging
    pool: {
        max: 5,           // Maximum number of connections in pool
        min: 0,           // Minimum number of connections in pool
        acquire: 30000,   // Maximum time (ms) to acquire connection
        idle: 10000       // Maximum time (ms) connection can be idle
    }
});

// ============================================
// Module Exports
// ============================================

/**
 * Export configured Sequelize instance
 * Imported by all model files (user.js, message.js) to access database connection
 */
module.exports = sequelize;
