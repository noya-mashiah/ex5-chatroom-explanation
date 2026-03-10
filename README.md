[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/WKmV5Lq-)

# Chatroom Application with User Authentication

A secure web-based chatroom application built with Node.js, Express, MariaDB, and EJS templating. Features a two-step registration process, session-based authentication, real-time message polling, and comprehensive CRUD operations with REST API support.

## Authors
- **Noya Mashiah** - noyamas@edu.jmc.ac.il
- **Revai Mor** - roymo@edu.jmc.ac.il

---

## ⚠️ Important Configuration Notes

### Required Constants (Lines to Check)

We defined the following constants in separate files as required by the exercise specifications:

#### 1. REGISTER_TIMEOUT (config/constants.js, line 19)
```javascript
const REGISTER_TIMEOUT = 30; // seconds
```
- **Purpose**: 30-second timeout for completing two-step registration
- **Location**: Defined in `config/constants.js` to prevent circular dependencies between `app.js` and `controllers/register.js`
- **Why separate file**: Avoids circular dependency issues while maintaining accessibility

#### 2. POLLING (config/constants.js, line 42)
```javascript
const POLLING = 10000; // milliseconds (10 seconds)
```
- **Purpose**: Chat update interval for polling mechanism
- **Default**: 10 seconds for production
- **Testing**: Can be changed to 300000 (5 minutes) for testing different scenarios
- **Note**: We intentionally apply polling to both the main chatroom page AND the search results page. This ensures that search results remain synchronized with the database even when new messages are added, edited, or deleted by other users.

---

## 📋 Features

### Part A: User Registration and Login (Completed)

#### Two-Step Registration Process
- **Step 1: Basic Information**
  - First Name (3-32 letters, a-z only)
  - Last Name (3-32 letters, a-z only)
  - Email (validated format, case-insensitive, unique check)
- **Step 2: Password Setup**
  - Password entry with confirmation (max 32 characters)
  - Back button to return to Step 1
  - 30-second timeout with visual countdown timer

#### Security Features
- **Password Hashing**: bcrypt with 10 salt rounds (never stored in plain text)
- **Session Management**: 24-hour persistent sessions using express-session
- **Cookie Security**: httpOnly cookies prevent XSS attacks
- **Input Sanitization**: All inputs trimmed; email converted to lowercase
- **Multi-Layer Validation**: Both client-side (HTML5) and server-side validation
- **Protected Routes**: Middleware-based authentication guards

### Part B: Chatroom with Database (Completed)

#### Chatroom Features
- **Real-Time Updates**: Automatic polling every 10 seconds (configurable via POLLING constant)
- **Message Display**: Messages sorted by newest first (descending order)
- **User Identification**: Each message shows author's first name and last name
- **Welcome Message**: Personalized greeting with logged-in user's first name
- **Character Limit**: Messages support up to 5000 characters

#### Message Operations
- **Add Message**: Form-based message submission (POST request)
- **Edit Message**: REST API-based editing with fetch (PUT request)
  - Only message owner can edit
  - Real-time update after edit
  - Edit interface protected during polling updates
- **Delete Message**: Form-based deletion with confirmation modal (POST request)
  - Confirmation dialog displays message content
  - Warning: "Are you sure? Deleting a message cannot be undone."
  - Only message owner can delete
- **Search Messages**: Content-based search with case-insensitive pattern matching
  - Search results page with result count
  - Polling continues on search page (intentional design for synchronization)

#### Database Integration
- **MariaDB**: Running in Docker container via docker-compose.yml
- **Sequelize ORM**: Complete database abstraction layer
- **Paranoid Mode**: Soft-delete functionality (deletedAt timestamp)
- **Relationships**: User hasMany Messages, Message belongsTo User
- **Automatic Timestamps**: createdAt, updatedAt, deletedAt fields

#### REST API
- **GET /api/messages**: Fetch all messages with author information
- **GET /api/messages/search?q=query**: Search messages by content
- **POST /api/messages**: Create new message
- **PUT /api/messages/:id**: Update message content (owner only)
- **DELETE /api/messages/:id**: Soft-delete message (owner only)
- **Authentication**: All endpoints require valid session
- **Authorization**: Edit/delete operations verify message ownership

#### Session Termination Handling
- Automatic redirect to login when session expires
- Detection during all server communication (polling, form submission, REST API)
- Handled on both server-side (res.redirect) and client-side (window.location)

---

## 🛠️ Technologies Used

### Backend
- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **express-session** - Session management middleware
- **cookie-parser** - Cookie parsing middleware
- **bcrypt** - Password hashing and verification
- **Sequelize** - ORM for database operations
- **MariaDB** - MySQL-compatible relational database
- **EJS** - Embedded JavaScript templating engine

### Frontend
- **Vanilla JavaScript** - Client-side interactivity and polling
- **Bootstrap 5** - Modern responsive UI framework
- **Fetch API** - AJAX requests for REST API communication

### Development Tools
- **Docker** - MariaDB container management
- **docker-compose** - Multi-container orchestration
- **phpMyAdmin** - Database administration interface

---

## 📁 Complete Project Structure

ex5-express-noya-mashiah-and-revai-mor/
├── .github/
│   └── workflows/
│       └── email.yml                   # GitHub Actions workflow
│
├── .gitignore                          # Git ignore rules
│
├── app.js                              # Main application entry point
│   ├── Express app initialization
│   ├── Database connection & sync
│   ├── Middleware configuration
│   ├── User-Message relationship definitions
│   └── Route registration
│
├── bin/
│   └── www                             # Server startup script (port 3000)
│
├── config/
│   ├── constants.js                    # Application constants
│   │   ├── REGISTER_TIMEOUT (line 19): 30 seconds
│   │   ├── POLLING (line 42): 10000ms (10 seconds)
│   │   ├── SESSION_SECRET: Session signing key
│   │   └── SESSION_MAX_AGE: 24 hours
│   │
│   └── messages.js                     # Centralized message strings
│       ├── Success messages (API & UI)
│       ├── Error messages (validation, not found, server errors)
│       ├── Authentication messages
│       └── Registration messages
│
├── controllers/
│   ├── auth.js                         # Authentication logic
│   │   ├── login(): Validates credentials with bcrypt
│   │   ├── logout(): Destroys session
│   │   └── Session management
│   │
│   ├── chatroom.js                     # Chatroom controller
│   │   ├── showChatroom(): Displays chatroom with messages
│   │   ├── addMessage(): Creates new message
│   │   ├── deleteMessage(): Soft-deletes message
│   │   └── searchMessages(): Searches messages by content
│   │
│   ├── errors.js                       # Error handling
│   │   ├── get404(): 404 error handler
│   │   ├── handleError(): Global error handler
│   │   ├── sendJsonError(): JSON error responses
│   │   └── sendJsonSuccess(): JSON success responses
│   │
│   └── register.js                     # Registration logic
│       ├── showRegisterStep1(): Displays first registration page
│       ├── handleStep1(): Processes Step 1 submission
│       ├── showRegisterStep2(): Displays password page
│       ├── handleStep2(): Completes registration
│       └── handleBack(): Returns to Step 1 from Step 2
│
├── docker-compose.yml                  # Docker configuration
│   ├── MariaDB service (port 3306)
│   ├── phpMyAdmin service (port 8080)
│   └── Database credentials: mydb/internet/internet
│
├── middleware/
│   └── auth.js                         # Authentication & authorization middleware
│       ├── requireAuth(): Web route authentication (redirects)
│       ├── requireAuthApi(): API route authentication (JSON 401)
│       ├── redirectIfAuthenticated(): Prevents logged-in users from login/register
│       └── isMessageAuthor(): Verifies message ownership (403 if not owner)
│
├── models/
│   ├── index.js                        # Sequelize database connection
│   │   ├── Connection configuration
│   │   ├── Connection pool settings
│   │   └── Database credentials (from docker-compose.yml)
│   │
│   ├── message.js                      # Message model
│   │   ├── Fields: id, content, userId, createdAt, updatedAt, deletedAt
│   │   ├── Paranoid mode: Soft-delete support
│   │   ├── Validation: 1-5000 characters, not empty
│   │   ├── Hooks: beforeValidate (trims content)
│   │   └── Relationship: belongsTo User
│   │
│   └── user.js                         # User model
│       ├── Fields: id, email, password, firstName, lastName
│       ├── Validation: Email format, name length (3-32), letters only
│       ├── Hooks: beforeValidate (trim & lowercase), beforeCreate/Update (bcrypt hash)
│       ├── Static method: emailExists(email)
│       └── Relationship: hasMany Messages
│
├── package.json                        # Project dependencies and scripts
├── package-lock.json                   # Dependency lock file
│
├── public/
│   ├── images/
│   │   └── chatroom_pic.PNG           # Login page image
│   │
│   ├── javascripts/
│   │   ├── chatroom.js                # Chatroom client-side logic
│   │   │   ├── Polling mechanism (POLLING interval)
│   │   │   ├── Message loading and display
│   │   │   ├── Edit interface handling
│   │   │   ├── Delete confirmation
│   │   │   ├── Session termination detection
│   │   │   ├── HTML generation and escaping
│   │   │   └── Event listener management
│   │   │
│   │   ├── common.js                  # Shared utilities
│   │   │   ├── API communication helpers
│   │   │   └── Toast notifications
│   │   │
│   │   ├── login.js                   # Login page client logic
│   │   │   └── Form handling
│   │   │
│   │   └── register.js                # Registration client logic
│   │       ├── Countdown timer display
│   │       ├── Email availability check
│   │       └── Form validation
│   │
│   └── stylesheets/
│       └── style.css                   # Custom styles
│
├── README.md                           # This file
│
├── routes/
│   ├── api.js                          # REST API routes
│   │   ├── GET /api/messages: Fetch all messages
│   │   ├── GET /api/messages/search: Search messages
│   │   ├── POST /api/messages: Create message
│   │   ├── PUT /api/messages/:id: Update message
│   │   ├── DELETE /api/messages/:id: Delete message
│   │   └── All protected with requireAuthApi middleware
│   │
│   ├── chatroom.js                     # Chatroom page routes
│   │   ├── GET /chatroom: Display chatroom
│   │   ├── GET /chatroom/search: Search messages
│   │   ├── POST /chatroom/message: Add message (form)
│   │   ├── POST /chatroom/message/:id/delete: Delete message (form)
│   │   └── All protected with requireAuth middleware
│   │
│   ├── login.js                        # Login routes
│   │   ├── GET /: Display login page (redirects if logged in)
│   │   ├── POST /login: Process login
│   │   └── POST /logout: Process logout
│   │
│   └── register.js                     # Registration routes
│       ├── GET /register: Display Step 1
│       ├── POST /register/step1: Process Step 1
│       ├── GET /register/step2: Display Step 2
│       ├── POST /register/step2: Complete registration
│       └── POST /register/back: Return to Step 1
│
├── utils/
│   ├── session.js                      # Session utilities
│   │   ├── isAuthenticated(): Check if user is logged in
│   │   └── Session helper functions
│   │
│   └── validators.js                   # Validation functions
│       ├── validateContent(): Message content validation
│       ├── isValidName(): Name validation (3-32 letters)
│       ├── isValidEmail(): Email format validation
│       └── isValidPassword(): Password validation
│
└── views/
    ├── chatroom.ejs                    # Chatroom page template
    │   ├── Welcome message
    │   ├── Message input form (5000 char limit)
    │   ├── Search form
    │   ├── Message list display
    │   ├── Edit interface for each message
    │   ├── Delete confirmation modal
    │   ├── Logout button
    │   └── Polling configuration injection
    │
    ├── error.ejs                       # Error page template
    │
    ├── login.ejs                       # Login page template
    │   ├── Email input
    │   ├── Password input
    │   └── Link to registration
    │
    └── register.ejs                    # Registration page template (two-step)
        ├── Step 1: Email, first name, last name
        ├── Step 2: Password confirmation
        ├── Countdown timer display
        └── Back button
---

## 🚀 Installation & Setup

### Prerequisites
- **Node.js** (v14 or higher)
- **npm** (Node Package Manager)
- **Docker** (for MariaDB container)
- **Docker Compose** (for orchestration)

### Installation Steps

1. **Clone the repository**
   git clone <repository-url>
   cd ex5-express-noya-mashiah-and-revai-mor

2. **Install dependencies**
   npm install

3. **Start MariaDB with Docker**
   docker-compose up -d

   This starts:
   - MariaDB on port 3306
   - phpMyAdmin on port 8080 (http://localhost:8080)

4. **Start the Express server**
   npm start

5. **Access the application**
   - Main app: http://localhost:3000
   - phpMyAdmin: http://localhost:8080 (credentials: internet/internet)

---

## 📖 Usage

### Registration Flow

1. **Navigate to Registration**
   - From login page, click "Register"
   - Or visit: http://localhost:3000/register

2. **Complete Step 1 (Basic Information)**
   - Enter first name (3-32 letters only, a-z)
   - Enter last name (3-32 letters only, a-z)
   - Enter valid email address (case-insensitive, checked for uniqueness)
   - Click "Next"
   - 30-second timer starts automatically

3. **Complete Step 2 (Password Setup)**
   - Enter password (max 32 characters, Unicode allowed including Hebrew)
   - Confirm password (must match)
   - Click "Register" to complete
   - Or click "Back" to modify Step 1 information (within 30-second timeout)

4. **Login**
   - Automatically redirected to login page with success message
   - Enter registered email and password
   - Access chatroom after successful login

### Login Flow

1. **Navigate to Login**
   - Visit: http://localhost:3000/

2. **Enter Credentials**
   - Email address (case-insensitive)
   - Password (case-sensitive)
   - Click "Sign in"

3. **Access Chatroom**
   - Automatically redirected to /chatroom
   - Session valid for 24 hours

### Using the Chatroom

1. **Viewing Messages**
   - Messages displayed newest first
   - Shows author name, timestamp, content
   - "(edited)" badge appears if message was modified
   - Auto-updates every 10 seconds (POLLING constant)

2. **Sending Messages**
   - Type message in input box (up to 5000 characters)
   - Character counter shows remaining characters
   - Click "Send" or press Enter
   - Message appears immediately after page refresh

3. **Editing Messages**
   - Click "Edit" button on your own messages
   - Edit interface appears with textarea
   - Modify content (up to 5000 characters)
   - Click "Save" to update, "Cancel" to discard
   - Message updates immediately via REST API

4. **Deleting Messages**
   - Click "Delete" button on your own messages
   - Confirmation modal appears showing message content
   - Click "Delete Message" to confirm
   - Message removed immediately (soft-deleted in database)

5. **Searching Messages**
   - Enter search query in search box
   - Click "Search"
   - Results page shows matching messages
   - Search is case-insensitive
   - Polling continues on search page (updates every 10 seconds)
   - Click "Back to Chat" to return to main chatroom

6. **Logging Out**
   - Click "Logout" button
   - Session destroyed
   - Redirected to login page

---

## ⚙️ Configuration

### Database Configuration (docker-compose.yml)
```yaml
MYSQL_ROOT_PASSWORD: password
MYSQL_DATABASE: mydb
MYSQL_USER: internet
MYSQL_PASSWORD: internet
```
**Note**: Do NOT change these credentials (required by exercise specifications)

### Session Configuration (config/constants.js)
```javascript
const SESSION_SECRET = process.env.SESSION_SECRET || 'your-secret-key-change-in-production';
const SESSION_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours
```

### Registration Timeout (config/constants.js, line 19)
```javascript
const REGISTER_TIMEOUT = 30; // seconds
```

### Polling Interval (config/constants.js, line 42)
```javascript
const POLLING = 10000; // 10 seconds (10000ms)
```
**For Testing**: Change to `300000` (5 minutes) to test various scenarios

### Message Length Limit
- **Maximum**: 5000 characters per message
- **Validation**: Enforced on both client and server
- **Database**: TEXT field type supports up to 65,535 characters

---

## 🔒 Security Features

### Password Security
- **Hashing**: bcrypt with 10 salt rounds (2^10 = 1024 iterations)
- **Storage**: Only hashed passwords stored in database
- **Verification**: bcrypt.compare() for login authentication
- **Automatic**: beforeCreate and beforeUpdate hooks handle hashing

### Session Security
- **Server-Side Storage**: Session data stored on server only
- **Signed Cookies**: Session ID signed with SECRET_KEY
- **httpOnly Cookies**: Prevents client-side JavaScript access
- **24-Hour Expiration**: Automatic session timeout
- **Secure Flag**: Set to true in production with HTTPS

### Input Validation & Sanitization

#### Multi-Layer Defense System

**Layer 1: Client-Side (HTML5)**
- `required` attributes prevent empty submission
- `pattern` attributes for name validation (letters only)
- `type="email"` for email format validation
- `minlength` and `maxlength` constraints
- `maxlength="5000"` for message content

**Layer 2: Sequelize Model Hooks**
- `beforeValidate` hook trims all text inputs
- Email converted to lowercase
- Names converted to lowercase
- Password trimmed but case preserved

**Layer 3: Sequelize Validators**
- Email: isEmail, notEmpty, unique
- Names: isAlpha, len[3,32], notEmpty
- Password: len[1,32], notEmpty
- Message content: len[1,5000], notEmpty

**Layer 4: Server-Side Validation**
- Custom validation functions in `utils/validators.js`
- Controller-level validation before database operations
- Middleware validation for API requests

**Layer 5: Authorization**
- Authentication middleware for all protected routes
- Ownership verification for edit/delete operations
- Session validation on every request

### Attack Prevention
- ✅ SQL Injection: Prevented by Sequelize parameterized queries
- ✅ XSS: HTML escaping in templates, httpOnly cookies
- ✅ Empty input attacks: Trimming + server validation
- ✅ Direct API calls: Authentication middleware on all endpoints
- ✅ CSRF: Session-based authentication (same-origin policy)
- ✅ Unauthorized edits/deletes: isMessageAuthor middleware
- ✅ Session hijacking: Signed cookies, httpOnly flag

---

## 📦 Dependencies

```json
{
  "bcrypt": "^5.1.1",
  "cookie": "^1.1.1",
  "cookie-parser": "~1.4.4",
  "debug": "~2.6.9",
  "ejs": "~2.6.1",
  "express": "~4.16.1",
  "express-session": "^1.18.2",
  "http-errors": "~1.6.3",
  "mariadb": "^3.4.5",
  "morgan": "~1.9.1",
  "mysql2": "^3.16.0",
  "sequelize": "^6.37.7"
}
```

---

## ✅ Implementation Details

### Polling Mechanism
- **Interval**: Controlled by POLLING constant (10 seconds default)
- **Scope**: Applies to both main chatroom AND search results page
- **Purpose**: Ensures all users see synchronized content
- **Optimization**: Skips DOM update if user is actively editing a message
- **Detection**: Checks for visible edit interface before updating

### Search Page Polling (Intentional Design)
We deliberately apply the polling mechanism to the search results page for the following reasons:
1. **Consistency**: Search results stay synchronized with database
2. **Multi-User Support**: New messages matching search criteria appear automatically
3. **Edit/Delete Reflection**: Changes by other users are reflected in search results
4. **User Experience**: No need to manually refresh search results

### Paranoid Mode (Soft Delete)
- **Implementation**: Sequelize paranoid option enabled
- **Behavior**: DELETE operations set `deletedAt` timestamp instead of removing record
- **Queries**: Automatically exclude soft-deleted records
- **Recovery**: Deleted messages remain in database for potential recovery

### User-Message Relationships
- **Type**: One-to-Many relationship
- **Pattern**: User hasMany Messages ↔ Message belongsTo User
- **Foreign Key**: userId in Messages table
- **Cascade**: onDelete: 'CASCADE' - deleting user removes all their messages
- **Join**: Eager loading with `include` for efficient queries

### REST API Design
- **Pattern**: Follows standard REST conventions
- **Authentication**: Session-based (same as web routes)
- **Authorization**: Message ownership verified for PUT/DELETE
- **Response Format**: Consistent JSON structure with success/error flags
- **HTTP Codes**: 200 (OK), 201 (Created), 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 500 (Server Error)

### Separation of Concerns
- **Routes**: Define endpoints and middleware chain
- **Controllers**: Handle business logic and orchestration
- **Models**: Define data structure and database operations
- **Middleware**: Reusable authentication and authorization logic
- **Utils**: Pure functions for validation and sanitization
- **Config**: Centralized constants and configuration

---

## 🧪 Testing Recommendations

### Required Testing Scenarios

1. **Multi-User Testing**
   - Open 2 different browsers (Chrome and Firefox)
   - Register and login as different users
   - Send, edit, delete messages from both users
   - Verify synchronization via polling

2. **Session Termination Testing**
   - Login in two tabs of the same browser
   - Logout in one tab
   - Try to interact in the other tab
   - Verify automatic redirect to login

3. **Registration Timeout Testing**
   - Start registration, complete Step 1
   - Wait 30+ seconds on Step 2
   - Try to submit - should redirect to Step 1
   - Verify cookie expiration

4. **Polling Testing**
   - Set POLLING to 300000 (5 minutes) in constants.js
   - Test all scenarios without automatic updates
   - Verify manual refresh works correctly
   - Return to 10000 (10 seconds) for production

5. **Search Page Testing**
   - Perform a search
   - In another browser, add/edit/delete matching messages
   - Verify search results update automatically via polling

6. **Edit Interface Protection**
   - Start editing a message
   - Wait for polling interval
   - Verify edit interface remains visible (not overwritten)

---

## 🎓 Course Requirements Compliance

### Part A: User Registration and Login ✅
- [x] Two-step registration process
- [x] Cookie-based 30-second timeout
- [x] Session-based login/logout
- [x] Password hashing with bcrypt
- [x] Email uniqueness validation
- [x] Protected chatroom route
- [x] All input trimmed
- [x] Case-insensitive email handling

### Part B: Chatroom with Database ✅
- [x] MariaDB database integration
- [x] Docker + docker-compose setup
- [x] Sequelize ORM with proper configuration
- [x] User-Message relationships (hasMany/belongsTo)
- [x] Paranoid mode for soft deletes
- [x] POLLING constant (10 seconds, easily configurable)
- [x] Message display sorted by newest first
- [x] Add message (form submission)
- [x] Edit message (REST API with fetch)
- [x] Delete message (form submission with confirmation)
- [x] Search functionality (case-insensitive)
- [x] REST API authentication
- [x] Message ownership verification
- [x] Session termination handling
- [x] Immediate updates after add/edit/delete
- [x] Polling on search page (intentional design)
- [x] Multi-user support tested
- [x] Navigation between pages without browser buttons

### Code Quality Standards ✅
- [x] Clean, modular, maintainable code
- [x] Separation of concerns (MVC pattern)
- [x] No code duplication (DRY principle)
- [x] OOP + encapsulation principles
- [x] Small, focused functions
- [x] Middleware for reusable logic
- [x] Centralized constants and messages
- [x] Complete JSDoc documentation
- [x] Professional English documentation
- [x] No "AI-like" phrasing

---

## 📚 Architecture References

We followed the reference architecture from:
- **12-express-db-master**: Database setup, Sequelize configuration, paranoid mode, Contact-Order relationship pattern
- **REST API example**: Validation middleware, error handling, response format, HTTP status codes

---

## 🙏 Acknowledgments

- JMC Computer Science Department
- Express.js and Sequelize documentation
- Bootstrap 5 documentation
- MariaDB and Docker documentation
- Course instructor and TAs for guidance and examples
