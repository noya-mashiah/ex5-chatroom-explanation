'use strict';

/**
 * Registration form handler module
 * Handles two-step registration process with real-time validation, timer, and API communication
 * Follows modular design with single-responsibility functions grouped by role
 * 
 * @requires common.js - Must be loaded before this module for shared utility functions
 * @module register
 */
(function() {
    'use strict';

    // ============================================
    // Configuration & Constants
    // ============================================

    // Email validation regex (shared constant)
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // ============================================
    // DOM Element References (Cached)
    // ============================================

    // Message display area
    const messageArea = document.getElementById('messageArea');

    // Form containers
    const step1Form = document.getElementById('step1Form');
    const step2Form = document.getElementById('step2Form');
    const backButton = document.getElementById('backButton');

    // Step 1 input elements
    const firstNameInput = document.getElementById('firstName');
    const lastNameInput = document.getElementById('lastName');
    const emailInput = document.getElementById('email');

    // Step 2 input elements
    const passwordInput = document.getElementById('password');
    const verifyPasswordInput = document.getElementById('verifyPassword');
    const hiddenFirstNameInput = document.getElementById('hiddenFirstName');
    const hiddenLastNameInput = document.getElementById('hiddenLastName');
    const hiddenEmailInput = document.getElementById('hiddenEmail');

    // Timer elements
    const timerDisplay = document.getElementById('timerDisplay');
    const timerSeconds = document.getElementById('timerSeconds');
    let timerInterval = null;

    // ============================================
    // Data Access Functions (REGISTER_DATA Management)
    // ============================================

    /**
     * Get property from REGISTER_DATA object safely
     * Encapsulates window.REGISTER_DATA access to eliminate duplication
     * @param {string} property - Property name to get
     * @param {*} defaultValue - Default value if property doesn't exist (default: undefined)
     * @returns {*} Property value or default value
     */
    function getRegisterData(property, defaultValue = undefined) {
        return window.REGISTER_DATA?.[property] ?? defaultValue;
    }

    /**
     * Set property in REGISTER_DATA object safely
     * Encapsulates window.REGISTER_DATA write access to eliminate duplication
     * @param {string} property - Property name to set
     * @param {*} value - Value to set
     */
    function setRegisterData(property, value) {
        if (!window.REGISTER_DATA) {
            window.REGISTER_DATA = {
                cookieTimestamp: null,
                registerTimeout: getRegisterData('registerTimeout', null),
                registerTimeoutWarning: getRegisterData('registerTimeoutWarning', null),
                hadCookieOnLoad: false
            };
        }
        window.REGISTER_DATA[property] = value;
    }

    /**
     * Update REGISTER_DATA with server timestamp
     * @param {number} timestamp - Cookie timestamp from server
     */
    function updateRegisterData(timestamp) {
        setRegisterData('cookieTimestamp', timestamp);
    }

    // ============================================
    // UI Utility Functions (Form & Timer Display)
    // ============================================

    /**
     * Set timer display visibility
     * Encapsulates timer display manipulation to eliminate duplication
     * @param {boolean} visible - Whether timer should be visible
     */
    function setTimerVisibility(visible) {
        if (timerDisplay) {
            timerDisplay.style.display = visible ? 'block' : 'none';
        }
    }

    /**
     * Set timer display color
     * Encapsulates timer color manipulation to eliminate duplication
     * @param {string} color - Color value ('red', 'green', etc.)
     */
    function setTimerColor(color) {
        if (timerDisplay) {
            timerDisplay.style.color = color;
        }
    }

    /**
     * Switch form step visibility
     * Encapsulates form step switching logic to eliminate duplication
     * @param {number} step - Step number (1 or 2)
     */
    function switchFormStep(step) {
        if (step === 1) {
            step1Form.classList.add('active');
            step2Form.classList.remove('active');
        } else if (step === 2) {
            step1Form.classList.remove('active');
            step2Form.classList.add('active');
        }
    }

    // ============================================
    // Validation Functions (Input Validation)
    // ============================================

    /**
     * Base validation function for common validation patterns
     * Encapsulates common validation logic to eliminate duplication
     * @param {HTMLInputElement} input - Input element to validate
     * @param {string} trimmedValue - Already trimmed input value
     * @param {string} fieldName - Name of the field (for error messages)
     * @param {Function} customValidator - Custom validation function (trimmedValue, fieldName) => string|null
     * @returns {boolean} True if valid, false otherwise
     * @private
     */
    function _validateFieldBase(input, trimmedValue, fieldName, customValidator) {
        if (trimmedValue.length === 0) {
            input.setCustomValidity('This field is required');
            return false;
        }
        
        if (trimmedValue.length > 32) {
            input.setCustomValidity(`${fieldName} must be at most 32 characters`);
            return false;
        }
        
        // Run custom validator if provided
        if (customValidator) {
            const customError = customValidator(trimmedValue, fieldName);
            if (customError) {
                input.setCustomValidity(customError);
                return false;
            }
        }
        
        // Field is valid
        input.setCustomValidity('');
        return true;
    }

    /**
     * Validate email format (client-side)
     * @param {string} email - Email to validate
     * @returns {boolean} True if valid, false otherwise
     */
    function isValidEmailFormat(email) {
        return EMAIL_REGEX.test(email);
    }

    /**
     * Validate name field in real-time (with trim)
     * @param {HTMLInputElement} input - Input element to validate
     * @param {string} fieldName - Name of the field (for error message)
     */
    function validateNameField(input, fieldName) {
        const trimmedValue = input.value.trim();
        const lettersOnlyRegex = /^[a-zA-Z]+$/;
        
        // Check minimum length before base validation
        if (trimmedValue.length > 0 && trimmedValue.length < 3) {
            input.setCustomValidity(`${fieldName} must be at least 3 characters`);
            return;
        }
        
        // Use base validation with custom validator for letters-only check
        _validateFieldBase(input, trimmedValue, fieldName, (value, name) => {
            if (!lettersOnlyRegex.test(value)) {
                return `${name} must contain only letters (a-z, A-Z)`;
            }
            return null;
        });
    }

    /**
     * Validate email field in real-time (with trim and domain extension check)
     * @param {HTMLInputElement} input - Email input element to validate
     */
    function validateEmailField(input) {
        const trimmedValue = input.value.trim();
        
        // Use base validation with custom validator for email format
        _validateFieldBase(input, trimmedValue, 'Email', (value) => {
            if (!EMAIL_REGEX.test(value)) {
                // Check if email has @ but is missing domain extension
                if (value.includes('@') && !value.includes('.')) {
                    return 'Email must include a domain extension (e.g., name@example.com)';
                } else {
                    return 'Please enter a valid email address (e.g., name@example.com)';
                }
            }
            return null;
        });
    }

    /**
     * Validate password field in real-time (with trim and max length check)
     * @param {HTMLInputElement} input - Password input element to validate
     * @param {string} fieldName - Name of the field (for error message)
     */
    function validatePasswordField(input, fieldName) {
        const trimmedValue = input.value.trim();
        
        // Use base validation (no custom validator needed for password)
        _validateFieldBase(input, trimmedValue, fieldName, null);
    }

    /**
     * Setup real-time validation for an input field
     * @param {HTMLInputElement} input - Input element
     * @param {Function} validateFn - Validation function (input, fieldName) => void
     * @param {string} fieldName - Name of the field for error messages
     */
    function setupFieldValidation(input, validateFn, fieldName) {
        if (!input) return;
        
        input.addEventListener('input', function() {
            validateFn(input, fieldName);
        });
        
        input.addEventListener('blur', function() {
            validateFn(input, fieldName);

            // Don't show validation popup on blur if field is empty/whitespace
            // Let user navigate freely, validation will catch it on submit
            const trimmedValue = input.value.trim();
            if (trimmedValue.length === 0) {
                return; // Skip reportValidity for empty fields on blur
            }

            if (!input.validity.valid) {
                // Defer reportValidity for email/password to allow blur to complete
                if (input.type === 'email' || input.type === 'password') {
                    setTimeout(function() {
                        input.reportValidity();
                    }, 0);
                } else {
                    input.reportValidity();
                }
            }
        });
    }

    // ============================================
    // Form Data Management Functions
    // ============================================

    /**
     * Get Step 1 form values (trimmed and lowercase)
     * @returns {Object} Object with firstName, lastName, email
     */
    function getStep1FormValues() {
        return {
            firstName: firstNameInput ? toLowerCase(firstNameInput.value) : '',
            lastName: lastNameInput ? toLowerCase(lastNameInput.value) : '',
            email: emailInput ? toLowerCase(emailInput.value) : ''
        };
    }

    /**
     * Get Step 2 form values (trimmed)
     * @returns {Object} Object with password, verifyPassword
     */
    function getStep2FormValues() {
        return {
            password: passwordInput ? passwordInput.value.trim() : '',
            verifyPassword: verifyPasswordInput ? verifyPasswordInput.value.trim() : ''
        };
    }

    /**
     * Update hidden fields for Step 2 with Step 1 data
     * @param {string} firstName - First name value
     * @param {string} lastName - Last name value
     * @param {string} email - Email value
     */
    function updateHiddenFields(firstName, lastName, email) {
        if (hiddenFirstNameInput) hiddenFirstNameInput.value = toLowerCase(firstName);
        if (hiddenLastNameInput) hiddenLastNameInput.value = toLowerCase(lastName);
        if (hiddenEmailInput) hiddenEmailInput.value = email;
    }

    /**
     * Clear Step 1 form fields (firstName, lastName, email)
     */
    function clearStep1Form() {
        if (firstNameInput) firstNameInput.value = '';
        if (lastNameInput) lastNameInput.value = '';
        if (emailInput) emailInput.value = '';
    }

    /**
     * Clear all form fields (Step 1 + Step 2)
     */
    function clearAllForms() {
        clearStep1Form();
        if (passwordInput) passwordInput.value = '';
        if (verifyPasswordInput) verifyPasswordInput.value = '';
    }

    // ============================================
    // Timer Management Functions
    // ============================================

    /**
     * Start the registration timer countdown
     * Timer is based on cookie timestamp (set once, never reset)
     */
    function startTimer() {
        // Clear any existing timer
        if (timerInterval) {
            clearInterval(timerInterval);
        }

        // Get cookie timestamp from server data
        const cookieTimestamp = getRegisterData('cookieTimestamp');
        const timeout = getRegisterData('registerTimeout', null);
        const warningThreshold = getRegisterData('registerTimeoutWarning', null);
        
        // Safety check: if timeout not provided by server or no cookie timestamp, hide timer
        if (!timeout || !cookieTimestamp) {
            setTimerVisibility(false);
            return;
        }

        // Calculate remaining time based on actual cookie timestamp
        function updateTimer() {
            const now = Date.now();
            const elapsed = (now - cookieTimestamp) / 1000; // seconds
            let remainingSeconds = Math.max(0, Math.floor(timeout - elapsed));

            // Hide timer if at full time (user just arrived) or expired
            // remainingSeconds >= timeout: Cookie just set, don't show timer yet
            // remainingSeconds <= 0: Time expired, hide timer
            if (remainingSeconds >= timeout || remainingSeconds <= 0) {
                setTimerVisibility(false);
            } else {
                setTimerVisibility(true);
                setTimerColor(remainingSeconds < warningThreshold ? 'red' : 'green');
            }

            if (timerSeconds) {
                timerSeconds.textContent = remainingSeconds;
            }

            // Timer expired - redirect to /register
            if (remainingSeconds <= 0) {
                clearInterval(timerInterval);
                timerInterval = null;
                redirectAfter('/register?expired=true', 0);
                return;
            }
        }
        
        // Update immediately
        updateTimer();

        // Update timer every second
        timerInterval = setInterval(updateTimer, 1000);
    }

    /**
     * Stop the registration timer (clear interval, but don't reset timestamp)
     */
    function stopTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }

    // ============================================
    // Form Step Navigation Functions
    // ============================================

    /**
     * Show Step 1 form and hide Step 2 form
     * Starts timer if cookie exists
     */
    function showStep1() {
        switchFormStep(1);
        hideMessages(); 
        
        // Start timer if cookie exists
        const cookieTimestamp = getRegisterData('cookieTimestamp');
        if (cookieTimestamp) {
            startTimer();
        }
    }

    /**
     * Show Step 2 form and hide Step 1 form
     * Starts timer and populates hidden fields
     * @param {string} firstName - First name value
     * @param {string} lastName - Last name value
     * @param {string} email - Email value
     */
    function showStep2(firstName, lastName, email) {
        switchFormStep(2);
        updateHiddenFields(firstName, lastName, email);
        hideMessages();
        
        // Start timer (cookie exists at this point)
        startTimer();
    }

    // ============================================
    // Error Handling Functions
    // ============================================

    /**
     * Handle registration error response
     * Processes different error types and executes appropriate callbacks
     * @param {Object} result - Error result from server
     * @param {Function} onEmailExists - Callback when emailExists error
     * @param {Function} onTimeout - Callback when timeout error
     * @param {Function} onOtherError - Callback for other errors
     */
    function handleRegistrationError(result, onEmailExists, onTimeout, onOtherError) {
        if (result.data.emailExists) {
            const errorMsg = result.data.message || 'this email is already in use, please use another one';
            showError(errorMsg);
            if (onEmailExists) onEmailExists();
            return;
        }
        
        if (result.data.timeout) {
            showError(result.data.message || 'Registration session expired. Please start over.');
            if (onTimeout) onTimeout();
            return;
        }
        
        // Other errors
        showError(result.data.message || 'Registration failed');
        if (onOtherError) onOtherError();
    }

    // ============================================
    // Form Submission Handlers
    // ============================================

    /**
     * Handle Step 1 form submission
     * Validates email on server and stores data if valid
     * @async
     * @param {Event} event - Form submit event
     */
    async function handleStep1Submit(event) {
        event.preventDefault();
        hideMessages();

        const formValues = getStep1FormValues();
        const { firstName, lastName, email } = formValues;

        try {
            // Step 1a: Validate email
            const validateResult = await postJSON('/register/validate', { email: email });

            if (!validateResult.ok) {
                handleRegistrationError(
                    validateResult,
                    // onEmailExists callback
                    () => {
                        if (emailInput) emailInput.focus();
                    },
                    // onTimeout callback
                    () => redirectAfter('/register', 1000),
                    // onOtherError callback
                    () => {
                        if (emailInput) emailInput.focus();
                    }
                );
                return;
            }

            // Step 1b: Store registration data
            const storeResult = await postJSON('/register/store', formValues);

            if (!storeResult.ok) {
                handleRegistrationError(
                    storeResult,
                    // onEmailExists callback
                    () => {
                        if (emailInput) emailInput.focus();
                    },
                    // onTimeout callback (shouldn't happen here)
                    () => redirectAfter('/register', 1000),
                    // onOtherError callback
                    () => {
                        clearStep1Form();
                        if (firstNameInput) firstNameInput.focus();
                    }
                );
                return;
            }

            // Both validations passed
            if (storeResult.data.success && storeResult.data.timestamp) {
                updateRegisterData(storeResult.data.timestamp);
                showStep2(firstName, lastName, email);
            }

        } catch (error) {
            showError('An error occurred. Please try again.');
        }
    }

    /**
     * Handle Step 2 form submission
     * Validates password match and completes registration
     * @async
     * @param {Event} event - Form submit event
     */
    async function handleStep2Submit(event) {
        event.preventDefault();
        hideMessages();

        const passwordValues = getStep2FormValues();
        const { password, verifyPassword } = passwordValues;

        // Check if passwords match
        if (password !== verifyPassword) {
            showError('Passwords do not match');
            return;
        }

        // Get data from hidden fields
        const firstName = hiddenFirstNameInput.value;
        const lastName = hiddenLastNameInput.value;
        const email = hiddenEmailInput.value;

        try {
            // Complete registration
            const result = await postJSON('/register', { 
                firstName: firstName,
                lastName: lastName,
                email: email,
                password: password
            });

            if (!result.ok) {
                handleRegistrationError(
                    result,
                    // onEmailExists callback
                    () => redirectAfter('/register', 2000),
                    // onTimeout callback
                    () => redirectAfter('/register', 1000),
                    // onOtherError callback
                    () => {
                        clearAllForms();
                        showStep1();
                    }
                );
                return;
            }
            
            // Registration successful
            showSuccess('Registration successful! Redirecting to login...');
            redirectAfter('/', 2000);
        } catch (error) {
            showError('An error occurred. Please try again.');
        }
    }

    /**
     * Handle back button click
     * Returns to Step 1 without resetting the timer
     */
    function handleBackButton() {
        showStep1();
        hideMessages();
    }

    /**
     * Attach lowercase conversion to email and name fields
     * Converts input to lowercase on each keystroke for case-insensitive storage
     */
    function attachLowercaseConversion() {
        document.querySelectorAll('#email, #firstName, #lastName').forEach(input => {
            input.addEventListener('input', function() {
                this.value = this.value.toLowerCase();
            });
        });
    }

    // ============================================
    // Initialization Functions
    // ============================================

    /**
     * Initialize event listeners and form state
     * Sets up real-time validation and form submission handlers
     */
    function init() {
        // Check if elements exist (defensive programming)
        if (!step1Form || !step2Form || !messageArea) {
            return;
        }

        // Attach lowercase conversion to input fields
        attachLowercaseConversion();

        // Real-time validation for name fields
        setupFieldValidation(firstNameInput, validateNameField, 'First name');
        setupFieldValidation(lastNameInput, validateNameField, 'Last name');
        
        // Real-time validation for email field
        setupFieldValidation(emailInput, validateEmailField, 'Email');
        
        // Real-time validation for password fields
        setupFieldValidation(passwordInput, validatePasswordField, 'Password');
        setupFieldValidation(verifyPasswordInput, validatePasswordField, 'Confirm Password');        
        
        // Form submission handlers
        if (step1Form) {
            step1Form.addEventListener('submit', handleStep1Submit);
        }

        if (step2Form) {
            step2Form.addEventListener('submit', handleStep2Submit);
        }

        // Back button handler
        if (backButton) {
            backButton.addEventListener('click', handleBackButton);
        }

        // Initialize timer on page load if cookie exists
        const cookieTimestamp = getRegisterData('cookieTimestamp');
        if (cookieTimestamp && step1Form && step1Form.classList.contains('active')) {
            startTimer();
        }
    }

    // ============================================
    // Module Initialization
    // ============================================

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
