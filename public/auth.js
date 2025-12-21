/**
 * NextOrder Authentication Module
 * Handles login, signup, and session management with real backend API
 */

// Auth State Keys
const AUTH_TOKEN_KEY = 'nextorder_token';
const USER_KEY = 'nextorder_user';

/**
 * Check if user is authenticated
 */
function isAuthenticated() {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const user = localStorage.getItem(USER_KEY);

    if (!token || !user) {
        return false;
    }

    // Check if token is expired (basic check - server will do full validation)
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expiry = payload.exp * 1000; // Convert to milliseconds

        if (Date.now() >= expiry) {
            clearSession();
            return false;
        }

        return true;
    } catch (error) {
        clearSession();
        return false;
    }
}

/**
 * Get current user data
 */
function getCurrentUser() {
    const userData = localStorage.getItem(USER_KEY);
    return userData ? JSON.parse(userData) : null;
}

/**
 * Get auth token
 */
function getAuthToken() {
    return localStorage.getItem(AUTH_TOKEN_KEY);
}

/**
 * Save user session
 */
function saveSession(token, user) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * Clear user session
 */
function clearSession() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('nextorder_kitchen');
}

/**
 * Logout and redirect
 */
function logout() {
    clearSession();
    window.location.href = 'index.html';
}

/**
 * Protect page - redirect to login if not authenticated
 */
function protectPage() {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

/**
 * Redirect to kitchen selection if already authenticated
 */
function redirectIfAuthenticated() {
    if (isAuthenticated()) {
        window.location.href = 'select-kitchen.html';
    }
}

/**
 * Handle Login Form Submission
 */
async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const remember = document.getElementById('remember')?.checked || false;
    const loginBtn = document.getElementById('login-btn');
    const errorMsg = document.getElementById('error-message');

    // Reset error state
    errorMsg.classList.add('hidden');

    // Basic validation
    if (!email || !password) {
        showError('Please fill in all fields');
        return;
    }

    // Show loading state
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<span style="opacity: 0.7;">Signing in...</span>';

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password, rememberMe: remember })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // Save session
            saveSession(data.token, data.user);

            // Redirect to kitchen selection
            window.location.href = 'select-kitchen.html';
        } else {
            showError(data.message || 'Login failed. Please try again.');
            loginBtn.disabled = false;
            loginBtn.innerHTML = 'Sign in';
        }

    } catch (error) {
        console.error('Login error:', error);
        showError('Network error. Please check your connection.');
        loginBtn.disabled = false;
        loginBtn.innerHTML = 'Sign in';
    }
}

/**
 * Handle Signup Form Submission
 */
async function handleSignup(event) {
    event.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const terms = document.getElementById('terms')?.checked || false;
    const signupBtn = document.getElementById('signup-btn');
    const errorMsg = document.getElementById('error-message');
    const successMsg = document.getElementById('success-message');

    // Reset states
    errorMsg.classList.add('hidden');
    successMsg.classList.add('hidden');

    // Validation
    if (!email || !password || !confirmPassword) {
        showError('Please fill in all fields');
        return;
    }

    if (password.length < 8) {
        showError('Password must be at least 8 characters');
        return;
    }

    if (password !== confirmPassword) {
        showError('Passwords do not match');
        return;
    }

    if (!terms) {
        showError('Please accept the Terms of Service');
        return;
    }

    // Show loading state
    signupBtn.disabled = true;
    signupBtn.innerHTML = '<span style="opacity: 0.7;">Creating account...</span>';

    try {
        const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                password,
                name: email.split('@')[0]
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // Show success message
            successMsg.classList.remove('hidden');

            // Save session and redirect after delay
            setTimeout(() => {
                saveSession(data.token, data.user);
                window.location.href = 'select-kitchen.html';
            }, 1500);
        } else {
            showError(data.message || 'Signup failed. Please try again.');
            signupBtn.disabled = false;
            signupBtn.innerHTML = 'Create account';
        }

    } catch (error) {
        console.error('Signup error:', error);
        showError('Network error. Please check your connection.');
        signupBtn.disabled = false;
        signupBtn.innerHTML = 'Create account';
    }
}

/**
 * Show error message
 */
function showError(message) {
    const errorMsg = document.getElementById('error-message');
    if (errorMsg) {
        errorMsg.textContent = message;
        errorMsg.classList.remove('hidden');

        // Add shake animation
        errorMsg.style.animation = 'none';
        errorMsg.offsetHeight; // Trigger reflow
        errorMsg.style.animation = 'shake 0.5s ease';
    }
}

/**
 * Make authenticated API request
 */
async function authFetch(url, options = {}) {
    const token = getAuthToken();

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        ...options,
        headers
    });

    // If unauthorized, redirect to login
    if (response.status === 401) {
        clearSession();
        window.location.href = 'login.html';
        throw new Error('Session expired');
    }

    return response;
}

// Add shake animation keyframes dynamically
const styleSheet = document.createElement('style');
styleSheet.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
`;
document.head.appendChild(styleSheet);

// Check if on auth pages and redirect if already logged in
if (window.location.pathname.includes('login.html') || window.location.pathname.includes('signup.html')) {
    redirectIfAuthenticated();
}
