'use strict';

/**
 * Chatroom client-side functionality
 * Handles message polling, editing, deleting, and real-time updates
 * Follows modular design with single-responsibility functions
 * @module chatroom
 */

// ============================================
// Configuration
// ============================================

const POLLING = window.CHATROOM_CONFIG.polling;
const IS_SEARCH_PAGE = window.CHATROOM_CONFIG.isSearchPage;
const CURRENT_USER_ID = window.CHATROOM_CONFIG.currentUserId;

// ============================================
// Utility Functions (Shared Logic)
// ============================================

/**
 * Escape HTML to prevent XSS attacks
 * Creates a temporary div, sets textContent, and returns innerHTML
 * @param {string} text - Text to escape
 * @returns {string} HTML-escaped text
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Format date to readable string
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString();
}

/**
 * Check if session is terminated and redirect to login
 * Centralizes 401 handling to avoid duplication
 * @param {Response} response - Fetch API response object
 * @returns {boolean} True if session terminated, false otherwise
 */
function handleSessionTermination(response) {
    if (response.status === 401) {
        window.location.href = '/';
        return true;
    }
    return false;
}

/**
 * Get message card DOM elements for editing operations
 * Centralizes DOM element selection to avoid duplication
 * @param {HTMLElement} triggerElement - The element that triggered the event (button)
 * @returns {Object} Object containing messageCard, editInterface, messageContent, and editBtn
 */
function getMessageCardElements(triggerElement) {
    const messageCard = triggerElement.closest('.message-card');
    return {
        messageCard: messageCard,
        editInterface: messageCard.querySelector('.edit-interface'),
        messageContent: messageCard.querySelector('.message-content'),
        editBtn: messageCard.querySelector('.edit-btn')
    };
}

/**
 * Toggle edit interface visibility
 * Shows edit interface and hides message content and edit button
 * @param {Object} elements - Object containing editInterface, messageContent, and editBtn
 * @param {boolean} showEdit - True to show edit interface, false to hide it
 */
function toggleEditInterface(elements, showEdit) {
    if (showEdit) {
        elements.editInterface.style.display = 'block';
        elements.messageContent.style.display = 'none';
        elements.editBtn.style.display = 'none';
    } else {
        elements.editInterface.style.display = 'none';
        elements.messageContent.style.display = 'block';
        elements.editBtn.style.display = 'inline-block';
    }
}

/**
 * Get current search query from URL
 * Reads query parameter from browser URL without maintaining global state
 * @returns {string|null} Search query if on search page, null otherwise
 */
function getSearchQuery() {
    if (!IS_SEARCH_PAGE) {
        return null;
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('q');
}

/**
 * Make an authenticated API request
 * Base function for all API calls to reduce fetch duplication
 * @async
 * @param {string} url - API endpoint URL
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
 * @param {Object} body - Request body (optional)
 * @returns {Promise<Object>} Response object with { ok, status, data }
 */
async function makeApiRequest(url, method = 'GET', body = null) {
    try {
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        if (body) {
            options.body = JSON.stringify(body);
        }
        
        const response = await fetch(url, options);
        
        // Check session termination
        if (handleSessionTermination(response)) {
            return null;
        }
        
        const data = await response.json();
        
        return {
            ok: response.ok,
            status: response.status,
            data: data
        };
        
    } catch (error) {
        console.error('Network error:', error);
        alert('Network error. Please check your connection and try again.');
        return null;
    }
}

// ============================================
// HTML Generation Functions (Single Responsibility)
// ============================================

/**
 * Generate HTML for message header (author and date)
 * @param {Object} message - Message object
 * @param {boolean} isEdited - Whether message has been edited
 * @returns {string} HTML string for message header
 */
function generateMessageHeader(message, isEdited) {
    const authorName = `${escapeHtml(message.authorFirstName)} ${escapeHtml(message.authorLastName)}`;
    const editedBadge = isEdited ? '<span class="edited-badge">(edited)</span>' : '';
    
    return `
        <div class="message-header">
            <div>
                <span class="message-author">${authorName}</span>
                <span class="message-date">
                    ${formatDate(message.createdAt)}
                    ${editedBadge}
                </span>
            </div>
        </div>
    `;
}

/**
 * Generate HTML for message action buttons (Edit/Delete)
 * @param {number} messageId - Message ID
 * @param {string} escapedContent - Escaped message content
 * @returns {string} HTML string for action buttons
 */
function generateActionButtons(messageId, escapedContent) {
    return `
        <div class="message-actions">
            <button class="btn btn-sm btn-outline-primary edit-btn" data-message-id="${messageId}">
                Edit
            </button>
            <button class="btn btn-sm btn-outline-danger delete-btn" 
                    data-message-id="${messageId}"
                    data-message-content="${escapedContent}">
                Delete
            </button>
        </div>
    `;
}

/**
 * Generate HTML for edit interface (textarea and buttons)
 * @param {number} messageId - Message ID
 * @param {string} escapedContent - Escaped message content
 * @returns {string} HTML string for edit interface
 */
function generateEditInterface(messageId, escapedContent) {
    return `
    <div class="edit-interface">
        <textarea class="form-control" maxlength="5000">${escapedContent}</textarea>
            <button class="btn btn-sm btn-success save-edit-btn" data-message-id="${messageId}">
                Save
            </button>
            <button class="btn btn-sm btn-secondary cancel-edit-btn" data-message-id="${messageId}">
                Cancel
            </button>
        </div>
    `;
}

/**
 * Generate HTML for a single message card
 * Combines header, content, and optional action buttons/edit interface
 * @param {Object} message - Message object
 * @returns {string} HTML string for complete message card
 */
function generateMessageCard(message) {
    const isOwner = message.userId === CURRENT_USER_ID;
    const isEdited = new Date(message.updatedAt) > new Date(message.createdAt);
    const escapedContent = escapeHtml(message.content);
    
    let html = `
        <div class="message-card" data-message-id="${message.id}">
            ${generateMessageHeader(message, isEdited)}
            <div class="message-content" data-message-content="${escapedContent}">
                ${escapedContent}
            </div>
    `;
    
    if (isOwner) {
        html += generateActionButtons(message.id, escapedContent);
        html += generateEditInterface(message.id, escapedContent);
    }
    
    html += `</div>`;
    
    return html;
}

// ============================================
// API Functions (Data Layer)
// ============================================

/**
 * Load messages from API
 * Context-aware: fetches from search endpoint if on search page
 * Fetches latest messages and updates the chat container
 * @async
 * @returns {void}
 */
async function loadMessages() {
    // Determine which endpoint to use based on page context
    const searchQuery = getSearchQuery();
    
    let url = '/api/messages';
    if (searchQuery) {
        // On search page with query - use search endpoint to maintain filter
        url = `/api/messages/search?q=${encodeURIComponent(searchQuery)}`;
    }

    const result = await makeApiRequest(url, 'GET');
    
    if (!result) {
        return; // Session terminated or network error
    }
    
    if (!result.ok) {
        console.error('Failed to fetch messages:', result.status);
        return;
    }
    
    if (result.data.success) {
        updateChatContainer(result.data.messages);
    }
}

/**
 * Edit message via API
 * Uses fetch PUT to update message content
 * @async
 * @param {number} messageId - Message ID to edit
 * @param {string} newContent - New message content
 */
async function editMessage(messageId, newContent) {
    const result = await makeApiRequest(`/api/messages/${messageId}`, 'PUT', { content: newContent });
    
    if (!result) {
        return; // Session terminated or network error
    }
    
    // Handle specific error cases
    if (result.status === 403) {
        alert('You can only edit your own messages');
        return;
    }
    
    if (result.status === 404) {
        alert('Message not found. It may have been deleted.');
        await loadMessages(); // Refresh to remove stale UI
        return;
    }
    
    if (!result.ok) {
        alert(result.data.message || 'Failed to edit message');
        return;
    }
    
    // IMMEDIATE UPDATE via API call (no page reload needed)
    await loadMessages();  // ← Fetches and displays updated messages immediately
}

// ============================================
// DOM Update Functions
// ============================================

/**
 * Update chat container with messages
 * Rebuilds entire DOM structure (server is source of truth)
 * IMPORTANT: Skips update if user is actively editing to prevent disruption
 * @param {Array} messages - Array of message objects from API
 */
function updateChatContainer(messages) {
    const container = document.getElementById('chatContainer');
    
    // Check if any edit interface is currently active (visible)
    // If so, skip the update to avoid disrupting the user's editing
    const activeEditInterface = document.querySelector('.edit-interface[style*="display: block"], .edit-interface[style*="display:block"]');
    if (activeEditInterface) {
        console.log('Skipping message update: User is currently editing');
        return; // Don't update while user is editing
    }

    if (!messages || messages.length === 0) {
        container.innerHTML = '<div class="empty-state">No messages yet. Be the first to send a message!</div>';
        
        // Update search count if on search page
        const searchCount = document.getElementById('searchCount');
        if (searchCount) {
            searchCount.textContent = '0';
        }

        return;
    }
    
    // Generate HTML for all messages
    const html = messages.map(message => generateMessageCard(message)).join('');
    container.innerHTML = html;
    
    // Update search count if on search page
    const searchCount = document.getElementById('searchCount');
    if (searchCount) {
        searchCount.textContent = messages.length;
    }

    // Re-attach event listeners to new DOM elements
    attachEventListeners();
}

// ============================================
// Event Handler Functions (Each with Single Responsibility)
// ============================================

/**
 * Handle edit button click
 * Shows edit interface and hides message content
 * @param {Event} event - Click event
 */
function handleEditClick(event) {
    const elements = getMessageCardElements(event.currentTarget);
    toggleEditInterface(elements, true);
}

/**
 * Handle cancel edit button click
 * Hides edit interface and shows message content
 * @param {Event} event - Click event
 */
function handleCancelEditClick(event) {
    const elements = getMessageCardElements(event.currentTarget);
    
    // Hide edit interface, show content and button
    toggleEditInterface(elements, false);
    
    // Reset textarea to original content
    const originalContent = elements.messageContent.dataset.messageContent;
    elements.editInterface.querySelector('textarea').value = originalContent;
}

/**
 * Handle save edit button click
 * Validates content and sends edit request to API
 * @async
 * @param {Event} event - Click event
 */
async function handleSaveEditClick(event) {
    const elements = getMessageCardElements(event.currentTarget);
    const messageId = event.currentTarget.dataset.messageId;
    const textarea = elements.editInterface.querySelector('textarea');
    const newContent = textarea.value.trim();
    
    // Validate content
    if (!newContent) {
        alert('Message content cannot be empty');
        return;
    }
    
    // Hide edit interface BEFORE calling editMessage
    // This allows updateChatContainer() to run and refresh the DOM
    toggleEditInterface(elements, false);
    
    // Send edit request (this will call loadMessages() which updates the DOM)
    await editMessage(messageId, newContent);
}

/**
 * Handle delete button click
 * Shows delete confirmation modal with message content
 * @param {Event} event - Click event
 */
function handleDeleteClick(event) {
    const messageId = event.currentTarget.dataset.messageId;
    const messageContent = event.currentTarget.dataset.messageContent;
    
    // Show modal with message content
    const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
    document.getElementById('deleteMessageContent').textContent = messageContent;
    document.getElementById('deleteForm').action = `/chatroom/message/${messageId}/delete`;
    modal.show();
}

/**
 * Attach event listeners to all message elements
 * Called after DOM is updated with new messages
 */
function attachEventListeners() {
    // Attach all event listeners using dedicated handler functions
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', handleEditClick);
    });
    
    document.querySelectorAll('.cancel-edit-btn').forEach(btn => {
        btn.addEventListener('click', handleCancelEditClick);
    });
    
    document.querySelectorAll('.save-edit-btn').forEach(btn => {
        btn.addEventListener('click', handleSaveEditClick);
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', handleDeleteClick);
    });
}

// ============================================
// Initialization
// ============================================

/**
 * Initialize chatroom functionality on page load
 * Sets up event listeners and starts polling if not on search page
 */
function initializeChatroom() {
    // Attach event listeners to initial server-rendered messages
    attachEventListeners();
    
    // Set up character counter for message input (if element exists)
    const messageInput = document.getElementById('messageInput');
    const charCount = document.getElementById('charCount');
    if (messageInput && charCount) {
        // Update counter on input
        messageInput.addEventListener('input', function() {
            charCount.textContent = this.value.length;
        });
        
        // Initialize counter with current length
        charCount.textContent = messageInput.value.length;
    }

    // Initial load from API (sync with any changes since page render)
    loadMessages();
    
    // Set up polling interval
    setInterval(loadMessages, POLLING);
}

// Start everything when DOM is ready
document.addEventListener('DOMContentLoaded', initializeChatroom);
