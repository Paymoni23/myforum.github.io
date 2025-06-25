// User data storage and session management
const USERS_STORAGE_KEY = 'forum_users';
const CURRENT_USER_KEY = 'current_user';

// Initialize users array in localStorage if it doesn't exist
if (!localStorage.getItem(USERS_STORAGE_KEY)) {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([]));
}

// Form validation and submission handling
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    // Login form handling
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const studentId = document.getElementById('studentId').value;
            const password = document.getElementById('password').value;
            const remember = document.getElementById('remember').checked;

            // Clear previous errors
            clearErrors();

            // Validate inputs
            if (!validateStudentId(studentId)) {
                showError('studentId', 'Please enter a valid Student ID (5 digits)');
                return;
            }

            if (!validatePassword(password)) {
                showError('password', 'Password must be at least 6 characters long');
                return;
            }

            try {
                // Try to authenticate the user
                const result = authenticateUser(studentId, password);
                
                // Store user session
                if (remember) {
                    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(result.user));
                } else {
                    sessionStorage.setItem(CURRENT_USER_KEY, JSON.stringify(result.user));
                }
                
                // Redirect to home page
                window.location.href = '/index.html';
            } catch (error) {
                showError('studentId', error.message || 'Invalid Student ID or password');
            }
        });
    }

    // Registration form handling
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const studentId = document.getElementById('studentId').value;
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const terms = document.getElementById('terms').checked;

            // Clear previous errors
            clearErrors();

            // Validate inputs
            if (!validateStudentId(studentId)) {
                showError('studentId', 'Please enter a valid Student ID (5 digits)');
                return;
            }

            if (!validateUsername(username)) {
                showError('username', 'Username must be 3-20 characters long and contain only letters, numbers, and underscores');
                return;
            }

            if (!validatePassword(password)) {
                showError('password', 'Password must be at least 6 characters long');
                return;
            }

            if (password !== confirmPassword) {
                showError('confirmPassword', 'Passwords do not match');
                return;
            }

            if (!terms) {
                showError('terms', 'You must agree to the Terms of Service and Privacy Policy');
                return;
            }

            try {
                // Try to register the user
                const result = registerUser(studentId, username, password);
                
                // Store user session
                sessionStorage.setItem(CURRENT_USER_KEY, JSON.stringify(result.user));
                
                // Redirect to home page
                window.location.href = '/index.html';
            } catch (error) {
                showError('studentId', error.message || 'Registration failed');
            }
        });
    }

    // Update UI based on authentication state
    updateUIForAuthState();
});

// User Management Functions
function registerUser(studentId, username, password) {
    const users = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY));
    
    // Check if user already exists
    if (users.some(user => user.studentId === studentId)) {
        throw new Error('A user with this Student ID already exists');
    }

    if (users.some(user => user.username === username)) {
        throw new Error('This username is already taken');
    }

    // Create new user object
    const newUser = {
        studentId,
        username,
        password: hashPassword(password), // In real app, use proper password hashing
        role: 'member',
        joinDate: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        posts: 0,
        likes: 0,
        avatar: '/img/default-avatar.png' // Default avatar path
    };

    // Add user to storage
    users.push(newUser);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));

    // Return success response without password
    const { password: _, ...userWithoutPassword } = newUser;
    return {
        success: true,
        user: userWithoutPassword
    };
}

function authenticateUser(studentId, password) {
    const users = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY));
    const user = users.find(u => u.studentId === studentId);

    if (!user || user.password !== hashPassword(password)) {
        throw new Error('Invalid Student ID or password');
    }

    // Update last active timestamp
    user.lastActive = new Date().toISOString();
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;
    return {
        success: true,
        user: userWithoutPassword
    };
}

function getCurrentUser() {
    return JSON.parse(localStorage.getItem('current_user') || sessionStorage.getItem('current_user'));
}

function logout() {
    localStorage.removeItem('current_user');
    sessionStorage.removeItem('current_user');
    window.location.href = '/pages/login.html';
}

// Helper Functions
function hashPassword(password) {
    // Simple hash function - DO NOT use in production!
    // In a real app, use proper password hashing like bcrypt
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString(36);
}

function validateStudentId(studentId) {
    const re = /^\d{5}$/;
    return re.test(studentId);
}

function validateUsername(username) {
    const re = /^[a-zA-Z0-9_]{3,20}$/;
    return re.test(username);
}

function validatePassword(password) {
    return password.length >= 6;
}

function showError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    field.classList.add('input-error');
    field.parentNode.appendChild(errorDiv);
    errorDiv.style.display = 'block';
}

function clearErrors() {
    const errorMessages = document.querySelectorAll('.error-message');
    const errorFields = document.querySelectorAll('.input-error');
    
    errorMessages.forEach(error => error.remove());
    errorFields.forEach(field => field.classList.remove('input-error'));
}

// Update UI based on auth state
function updateUIForAuthState() {
    const currentUser = getCurrentUser();
    const authLinks = document.querySelectorAll('.auth-link');
    
    authLinks.forEach(link => {
        if (currentUser && link.dataset.auth === 'logged-out') {
            link.style.display = 'none';
        } else if (!currentUser && link.dataset.auth === 'logged-in') {
            link.style.display = 'none';
        }
    });

    // Update user info if available
    const userInfo = document.querySelector('.user-info');
    if (userInfo && currentUser) {
        userInfo.innerHTML = `
            <div class="user-profile">
                <div class="user-avatar">
                    <i class='bx bxs-user'></i>
                </div>
                <div class="user-details">
                    <span class="username">${currentUser.username}</span>
                    <span class="student-id">Student ID: ${currentUser.studentId}</span>
                    <span class="role ${currentUser.role}">${currentUser.role}</span>
                </div>
                <button onclick="logout()" class="logout-btn">Logout</button>
            </div>
        `;
    }
}

// Social auth buttons
const googleButton = document.querySelector('.social-button.google');
const githubButton = document.querySelector('.social-button.github');

if (googleButton) {
    googleButton.addEventListener('click', () => {
        // Implement Google OAuth
        console.log('Google sign in clicked');
    });
}

if (githubButton) {
    githubButton.addEventListener('click', () => {
        // Implement GitHub OAuth
        console.log('GitHub sign in clicked');
    });
} 