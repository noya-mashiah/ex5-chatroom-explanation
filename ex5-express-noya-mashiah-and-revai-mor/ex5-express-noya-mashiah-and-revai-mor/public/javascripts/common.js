'use strict';

/**
 * Common utility functions for client-side operations
 * Shared across multiple pages (register, login, chatroom, etc.)
 * Provides reusable functions for API communication, message display, and navigation
 * @module common
 */

// ============================================
// Message Display Functions
// ============================================

/**
 * Base function for displaying messages
 * Creates DOM elements programmatically to prevent XSS attacks
 * Uses textContent to automatically escape any HTML in the message
 * @param {string} message - Message to display (will be escaped automatically)
 * @param {string} alertType - Alert type ('danger' or 'success')
 * @param {string} messageAreaId - ID of the message area element (default: 'messageArea')
 * @private
 */
function _showMessage(message, alertType, messageAreaId = 'messageArea') {
    const messageArea = document.getElementById(messageAreaId);
    if (messageArea) {
        // Create alert div programmatically (prevents XSS)
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${alertType}`;
        alertDiv.setAttribute('role', 'alert');
        alertDiv.textContent = message; // Safe - automatically escapes HTML
        
        // Clear previous messages and insert new one
        messageArea.innerHTML = '';
        messageArea.appendChild(alertDiv);
        messageArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

/**
 * Display error message in the message area
 * Works with Bootstrap 5 alert structure
 * @param {string} message - Error message to display
 * @param {string} messageAreaId - ID of the message area element (default: 'messageArea')
 */
function showError(message, messageAreaId = 'messageArea') {
    _showMessage(message, 'danger', messageAreaId);
}

/**
 * Display success message in the message area
 * Works with Bootstrap 5 alert structure
 * @param {string} message - Success message to display
 * @param {string} messageAreaId - ID of the message area element (default: 'messageArea')
 */
function showSuccess(message, messageAreaId = 'messageArea') {
    _showMessage(message, 'success', messageAreaId);
}

/**
 * Clear message area (hide all messages)
 * @param {string} messageAreaId - ID of the message area element (default: 'messageArea')
 */
function hideMessages(messageAreaId = 'messageArea') {
    const messageArea = document.getElementById(messageAreaId);
    if (messageArea) {
        messageArea.innerHTML = '';
    }
}

// ============================================
// API Communication Functions
// ============================================

/**
 * Make a POST request with JSON data
 * Returns standardized response object matching reference pattern
 * @async
 * @param {string} url - Request URL
 * @param {Object} data - Request body data
 * @returns {Promise<Object>} Response object with { ok, status, data }
 */
async function postJSON(url, data) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const jsonData = await response.json();

        return {
            ok: response.ok,
            status: response.status,
            data: jsonData
        };
    } catch (error) {
        // Network error or fetch failed
        return {
            ok: false,
            status: 0,
            data: {
                success: false,
                message: 'Network error. Please check your connection and try again.'
            }
        };
    }
}

// ============================================
// Navigation Functions
// ============================================

/**
 * Redirect to URL after delay
 * Allows showing messages before redirect
 * @param {string} url - URL to redirect to
 * @param {number} delay - Delay in milliseconds (default: 1500)
 */
function redirectAfter(url, delay = 1500) {
    setTimeout(() => {
        window.location.href = url;
    }, delay);
}

// ============================================
// String Utility Functions
// ============================================

/**
 * Convert string to lowercase with trim
 * Utility for case-insensitive input handling
 * @param {string} str - String to convert
 * @returns {string} Lowercase trimmed string
 */
function toLowerCase(str) {
    return str ? str.trim().toLowerCase() : '';
}
