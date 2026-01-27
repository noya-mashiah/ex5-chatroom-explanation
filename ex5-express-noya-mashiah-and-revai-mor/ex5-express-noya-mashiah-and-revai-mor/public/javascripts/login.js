'use strict';

/**
 * Login page client-side functionality
 * Handles email normalization and form submission
 * @module login
 */

/**
 * Initialize login page functionality
 * Sets up event listeners for email normalization and form submission protection
 */
function initializeLogin() {
    const emailInput = document.getElementById('email');
    const loginForm = document.getElementById('loginForm');

    // Normalize email to lowercase on input
    if (emailInput) {
        emailInput.addEventListener('input', function() {
            this.value = this.value.toLowerCase();
        });
    }

    // Prevent multiple form submissions
    if (loginForm) {
        loginForm.addEventListener('submit', function() {
            const submitBtn = this.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Signing in...';
            }
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializeLogin);
