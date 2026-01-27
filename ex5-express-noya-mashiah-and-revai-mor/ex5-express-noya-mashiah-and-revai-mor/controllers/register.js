'use strict';

/**
 * User registration controller
 * Handles two-step registration process with cookie-based session management
 * Manages user data validation, email availability checking, and account creation
 * Integrates with Sequelize User model for database persistence
 * @module controllers/register
 */

// ============================================
// Dependencies
// ============================================

const { REGISTER_TIMEOUT, REGISTER_TIMEOUT_WARNING_THRESHOLD, REGISTRATION_SUCCESS_COOKIE } = require('../config/constants');
const userModel = require('../models/user');
const { isValidEmail, isValidName, isValidPassword, sanitizeString, sanitizeStringPreserveCase } = require('../utils/validators');
const { sendJsonError, sendEmailExistsError, sendTimeoutError, sendJsonSuccess } = require('./errors');

// ============================================
// Constants
// ============================================

/**
 * Cookie name for registration data storage
 */
const REGISTRATION_DATA_COOKIE = 'registrationData';

// ============================================
// Cookie Management Functions
// ============================================

/**
 * Clear registration data cookie
 * Encapsulates cookie clearing logic for consistency
 * @param {Object} res - Express response object
 * @returns {void}
*/
function clearRegistrationCookie(res) {
    res.clearCookie(REGISTRATION_DATA_COOKIE, {
        httpOnly: true
    });
}

/**
 * Set registration cookie with data
 * Encapsulates cookie setting logic for consistency
 * @param {Object} res - Express response object
 * @param {Object} cookieData - Cookie data object to store
 * @returns {void}
*/
function setRegistrationCookie(res, cookieData) {
    const maxAge = REGISTER_TIMEOUT * 1000;
    res.cookie(REGISTRATION_DATA_COOKIE, JSON.stringify(cookieData), {
        maxAge: maxAge,
        httpOnly: true
    });
}

/**
 * Parse and validate registration cookie
 * @param {string} cookieData - Cookie data string
 * @returns {Object} Object with { isValid: boolean, data: Object|null, error: string|null }
 */
function parseRegistrationCookie(cookieData) {
    if (!cookieData) {
        return { isValid: false, data: null, error: 'Cookie not found' };
    }
    
    try {
        const data = JSON.parse(cookieData);
        const cookieAge = (Date.now() - data.timestamp) / 1000;
        
        if (cookieAge >= REGISTER_TIMEOUT) {
            return { isValid: false, data: null, error: 'Cookie expired' };
        }
        
        return { isValid: true, data: data, error: null };
    } catch (err) {
        return { isValid: false, data: null, error: 'Invalid cookie data' };
    }
}

/**
 * Create registration cookie data object
 * @param {string} firstName - First name (already validated and trimmed)
 * @param {string} lastName - Last name (already validated and trimmed)
 * @param {string} email - Email (already validated and sanitized)
 * @param {number} timestamp - Timestamp (defaults to current time)
 * @returns {Object} Cookie data object
 */
function createCookieData(firstName, lastName, email, timestamp = Date.now()) {
    return {
        firstName: firstName.toLowerCase(),
        lastName: lastName.toLowerCase(),
        email: email,
        stage2: true,
        timestamp: timestamp
    };
}

/**
 * Create new registration cookie data with current timestamp
 * Encapsulates cookie creation logic to eliminate duplication
 * @param {Object} validationResult - Validation result object with values
 * @returns {Object} Object with { timestamp: number, cookieData: Object }
 */
function createNewRegistrationCookie(validationResult) {
    const newTimestamp = Date.now();
    const cookieData = createCookieData(
        validationResult.values.firstName,
        validationResult.values.lastName,
        validationResult.values.email,
        newTimestamp
    );
    return { timestamp: newTimestamp, cookieData: cookieData };
}

/**
 * Handle registration cookie creation logic
 * Determines whether to create new cookie or handle timeout
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Object} validationResult - Validation result object
 * @returns {Object|null} Object with { cookieData: Object, timestamp: number } or null if timeout error
 */
function handleRegistrationCookieCreation(req, res, validationResult) {
    const existingCookie = req.cookies[REGISTRATION_DATA_COOKIE];
    const hadCookieOnLoad = req.body.hadCookieOnLoad === true || req.body.hadCookieOnLoad === 'true';

    if (existingCookie) {
        const cookieResult = parseRegistrationCookie(existingCookie);
        
        // Cookie exists - always reset timestamp to current time (whether valid or expired)
        const cookieInfo = createNewRegistrationCookie(validationResult);
        return {
            cookieData: cookieInfo.cookieData,
            timestamp: cookieInfo.timestamp
        };
    } else {
        // No existing cookie
        if (hadCookieOnLoad) {
            // Page was loaded with cookie but cookie no longer exists (expired/deleted)
            clearRegistrationCookie(res);
            return null; // Signal timeout error
        } else {
            // First-time user - create new cookie
            const cookieInfo = createNewRegistrationCookie(validationResult);
            return {
                cookieData: cookieInfo.cookieData,
                timestamp: cookieInfo.timestamp
            };
        }
    }
}

/**
 * Process registration cookie and extract form data
 * Handles cookie parsing, validation, and form data extraction
 * @param {string} cookieData - Cookie data string
 * @param {Object} res - Express response object
 * @returns {Object} Object with { formData: Object|null, cookieTimestamp: number|null, hadCookieOnLoad: boolean }
 */
function processRegistrationCookie(cookieData, res) {
    if (!cookieData) {
        return {
            formData: null,
            cookieTimestamp: null,
            hadCookieOnLoad: false
        };
    }

    const cookieResult = parseRegistrationCookie(cookieData);
    
    if (!cookieResult.isValid) {
        // Cookie expired or invalid - clear it
        clearRegistrationCookie(res);
        return {
            formData: null,
            cookieTimestamp: null,
            hadCookieOnLoad: false
        };
    }

    // Cookie valid - restore data for pre-filling
    return {
        formData: {
            firstName: cookieResult.data.firstName || '',
            lastName: cookieResult.data.lastName || '',
            email: cookieResult.data.email || ''
        },
        cookieTimestamp: cookieResult.data.timestamp,
        hadCookieOnLoad: true
    };
}

// ============================================
// Individual Field Validation Functions
// ============================================

/**
 * Validate and sanitize first name
 * @param {string} firstName - First name to validate
 * @returns {Object} Object with { isValid: boolean, value: string, error: string|null }
 */
function validateFirstName(firstName) {
    if (!firstName) {
        return { isValid: false, value: '', error: 'First name is required' };
    }
    
    const trimmed = sanitizeStringPreserveCase(firstName);
    if (!isValidName(trimmed)) {
        return { isValid: false, value: trimmed, error: 'First name must be 3-32 characters, letters only' };
    }
    
    return { isValid: true, value: trimmed, error: null };
}

/**
 * Validate and sanitize last name
 * @param {string} lastName - Last name to validate
 * @returns {Object} Object with { isValid: boolean, value: string, error: string|null }
 */
function validateLastName(lastName) {
    if (!lastName) {
        return { isValid: false, value: '', error: 'Last name is required' };
    }
    
    const trimmed = sanitizeStringPreserveCase(lastName);
    if (!isValidName(trimmed)) {
        return { isValid: false, value: trimmed, error: 'Last name must be 3-32 characters, letters only' };
    }
    
    return { isValid: true, value: trimmed, error: null };
}

/**
 * Validate and sanitize email
 * @param {string} email - Email to validate
 * @returns {Object} Object with { isValid: boolean, value: string, error: string|null }
 */
function validateEmailField(email) {
    if (!email) {
        return { isValid: false, value: '', error: 'Email is required' };
    }
    
    const sanitized = sanitizeString(email);
    if (!isValidEmail(sanitized)) {
        return { isValid: false, value: sanitized, error: 'Invalid email format' };
    }
    
    return { isValid: true, value: sanitized, error: null };
}

/**
 * Validate and sanitize password
 * @param {string} password - Password to validate
 * @returns {Object} Object with { isValid: boolean, value: string, error: string|null }
 */
function validatePasswordField(password) {
    if (!password) {
        return { isValid: false, value: '', error: 'Password is required' };
    }
    
    const trimmed = sanitizeStringPreserveCase(password);
    if (!isValidPassword(trimmed)) {
        return { isValid: false, value: trimmed, error: 'Password is required' };
    }
    
    return { isValid: true, value: trimmed, error: null };
}

// ============================================
// Multi-Field Validation Functions
// ============================================

/**
 * Add validation error to results object if validation failed
 * Encapsulates error assignment logic to eliminate duplication
 * @param {Object} results - Results object to update
 * @param {string} fieldName - Name of the field (e.g., 'firstName')
 * @param {Object} validationResult - Validation result object with isValid and error properties
 * @returns {void}
*/
function addValidationErrorIfInvalid(results, fieldName, validationResult) {
    if (!validationResult.isValid) {
        results.errors[fieldName] = validationResult.error;
    }
}

/**
 * Validate all registration fields (firstName, lastName, email, password)
 * Returns validation results for all fields
 * @param {string} firstName - First name to validate
 * @param {string} lastName - Last name to validate
 * @param {string} email - Email to validate
 * @param {string} password - Password to validate (optional)
 * @returns {Object} Object with validation results: { isValid: boolean, errors: Object, values: Object }
 */
function validateAllRegistrationFields(firstName, lastName, email, password = null) {
    const firstNameResult = validateFirstName(firstName);
    const lastNameResult = validateLastName(lastName);
    const emailResult = validateEmailField(email);
    
    const results = {
        isValid: firstNameResult.isValid && lastNameResult.isValid && emailResult.isValid,
        errors: {},
        values: {
            firstName: firstNameResult.value,
            lastName: lastNameResult.value,
            email: emailResult.value
        }
    };
    
    // Add errors to results object if validation failed
    addValidationErrorIfInvalid(results, 'firstName', firstNameResult);
    addValidationErrorIfInvalid(results, 'lastName', lastNameResult);
    addValidationErrorIfInvalid(results, 'email', emailResult);
    
    // Validate password if provided
    if (password !== null) {
        const passwordResult = validatePasswordField(password);
        results.isValid = results.isValid && passwordResult.isValid;
        results.values.password = passwordResult.value;
        addValidationErrorIfInvalid(results, 'password', passwordResult);
    }
    
    return results;
}

/**
 * Send validation error response
 * Extracts first error from validation results and sends error response
 * Encapsulates error extraction logic to eliminate duplication
 * @param {Object} res - Express response object
 * @param {Object} validationResult - Validation result object with errors
 * @returns {Object} Express response object
 */
function sendValidationError(res, validationResult) {
    const firstError = Object.values(validationResult.errors)[0];
    return sendJsonError(res, firstError, 400);
}

// ============================================
// User Creation Functions
// ============================================

/**
 * Create user and handle success/error responses
 * Encapsulates user creation logic using Sequelize
 * Password hashing handled automatically by User model beforeCreate hook
 * @async
 * @param {Object} res - Express response object
 * @param {string} firstName - Validated first name
 * @param {string} lastName - Validated last name
 * @param {string} email - Validated email
 * @param {string} password - Validated plain text password (will be hashed by model)
 * @returns {Promise<Object>} Response object with success or error status
 * @throws {Error} If user creation fails or validation errors occur
 */
async function createUserAndRespond(res, firstName, lastName, email, password) {
    try {
        // Create user in database using Sequelize
        // Password automatically hashed by beforeCreate hook
        await userModel.create({
            firstName: firstName,
            lastName: lastName,
            email: email,
            password: password
        });

        // Clear registration cookie
        clearRegistrationCookie(res);

        // Set success cookie for login page
        res.cookie(REGISTRATION_SUCCESS_COOKIE, 'you are registered', {
            maxAge: 60 * 1000, // 60 seconds
            httpOnly: true
        });

        return sendJsonSuccess(res, 'Registration successful');

    } catch (err) {
        // Handle Sequelize validation errors
        if (err.name === 'SequelizeValidationError') {
            clearRegistrationCookie(res);
            const errorMessage = err.errors[0]?.message || 'Validation failed';
            return sendJsonError(res, errorMessage, 400);
        }

        // Handle Sequelize unique constraint errors (duplicate email)
        if (err.name === 'SequelizeUniqueConstraintError') {
            clearRegistrationCookie(res);
            return sendEmailExistsError(res);
        }

        // Handle other unexpected errors
        console.error('User creation error:', err);
        clearRegistrationCookie(res);
        return sendJsonError(res, 'Registration failed. Please try again.', 500);
    }
}

// ============================================
// Page Rendering Functions
// ============================================

/**
 * Get default page state values
 * Encapsulates default state initialization to eliminate duplication
 * @returns {Object} Object with default state values
 */
function getDefaultPageState() {
    return {
        step: 1,
        formData: null,
        error: null,
        cookieTimestamp: null,
        hadCookieOnLoad: false
    };
}

/**
 * Render registration page with data
 * Encapsulates registration page rendering logic for consistency and maintainability
 * @param {Object} res - Express response object
 * @param {number} step - Current step (1 or 2)
 * @param {Object|null} formData - Form data for pre-filling (null if none)
 * @param {string|null} error - Error message to display (null if none)
 * @param {number|null} cookieTimestamp - Cookie timestamp for timer (null if none)
 * @param {boolean} hadCookieOnLoad - Whether cookie existed when page loaded
 * @returns {void}
 */
function renderRegisterPage(res, step, formData, error, cookieTimestamp, hadCookieOnLoad) {
    res.render('register', {
        title: 'Register',
        step: step,
        formData: formData,
        error: error,
        cookieTimestamp: cookieTimestamp,
        registerTimeout: REGISTER_TIMEOUT,
        registerTimeoutWarning: REGISTER_TIMEOUT_WARNING_THRESHOLD,
        hadCookieOnLoad: hadCookieOnLoad
    });
}

// ============================================
// Route Handler Functions (Public API)
// ============================================

/**
 * Display the registration page
 * Checks for existing registration cookie and determines which step to show
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {void}
 */
function showRegisterPage(req, res) {
    // Initialize default state
    let state = getDefaultPageState();

    // Handle expired query parameter
    if (req.query.expired === 'true') {
        clearRegistrationCookie(res);
        state.error = 'Registration session expired. Please start over.';
    }

    // Process registration cookie if it exists
    const cookieData = req.cookies[REGISTRATION_DATA_COOKIE];
    if (cookieData) {
        const cookieInfo = processRegistrationCookie(cookieData, res);
        state.formData = cookieInfo.formData;
        state.cookieTimestamp = cookieInfo.cookieTimestamp;
        state.hadCookieOnLoad = cookieInfo.hadCookieOnLoad;
    }

    renderRegisterPage(res, state.step, state.formData, state.error, state.cookieTimestamp, state.hadCookieOnLoad);
}

/**
 * Validate email availability
 * Checks if email already exists in database using Sequelize
 * @async
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response indicating email availability
 */
async function validateEmail(req, res) {
    const { email } = req.body;

    const emailResult = validateEmailField(email);
    if (!emailResult.isValid) {
        return sendJsonError(res, emailResult.error, 400);
    }

    // Check if email exists in database
    const emailExists = await userModel.emailExists(emailResult.value);
    if (emailExists) {
        return sendEmailExistsError(res);
    }

    return sendJsonSuccess(res, 'Email is available');
}

/**
 * Store registration data in cookie
 * Stores firstName, lastName, and email in cookie with timestamp
 * Timer starts when cookie is first created, timestamp is preserved on updates
 * @async
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function storeRegistrationData(req, res) {
    const { firstName, lastName, email } = req.body;

    // Validate all fields (without password)
    const validationResult = validateAllRegistrationFields(firstName, lastName, email);

    if (!validationResult.isValid) {
        return sendValidationError(res, validationResult);
    }

    // Check if email already exists (early validation)
    const emailExists = await userModel.emailExists(validationResult.values.email);
    if (emailExists) {
        return sendEmailExistsError(res);
    }

    // Handle cookie creation
    const cookieInfo = handleRegistrationCookieCreation(req, res, validationResult);

    if (!cookieInfo) {
        // Timeout error occurred
        return sendTimeoutError(res);
    }

    // Set cookie
    setRegistrationCookie(res, cookieInfo.cookieData);

    return sendJsonSuccess(res, 'Registration data stored', { timestamp: cookieInfo.timestamp });
}

/**
 * Complete registration with password
 * Creates user account after final validation
 * @async
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function completeRegistration(req, res) {
    const { firstName, lastName, email, password } = req.body;

    // Validate all fields (including password)
    const validationResult = validateAllRegistrationFields(firstName, lastName, email, password);
    
    if (!validationResult.isValid) {
        return sendValidationError(res, validationResult);
    }

    // This ensures concurrent registration errors are caught even if cookie is missing/expired
    const emailExists = await userModel.emailExists(validationResult.values.email);
    if (emailExists) {
        clearRegistrationCookie(res);
        return sendEmailExistsError(res);
    }

    // Parse and validate cookie
    const cookieData = req.cookies[REGISTRATION_DATA_COOKIE];
    const cookieResult = parseRegistrationCookie(cookieData);
    
    if (!cookieResult.isValid) {
        clearRegistrationCookie(res);
        return sendTimeoutError(res);
    }

    // Create user and handle response
    return createUserAndRespond(
        res,
        validationResult.values.firstName,
        validationResult.values.lastName,
        validationResult.values.email,
        validationResult.values.password
    );
}

// ============================================
// Module Exports
// ============================================

module.exports = {
    showRegisterPage,
    validateEmail,
    storeRegistrationData,
    completeRegistration,
};
