// Login Screen Component
class LoginScreen {
    constructor() {
        this.screen = document.getElementById('loginScreen');
        this.loginForm = document.getElementById('loginForm');
        this.signupForm = document.getElementById('signupForm');
        this.authError = document.getElementById('authError');
        this.init();
    }

    // Initialize login screen
    init() {
        this.setupTabSwitching();
        this.setupForms();
        this.setupInputValidation();
    }

    // Setup tab switching
    setupTabSwitching() {
        const tabs = document.querySelectorAll('.tab');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabType = tab.dataset.tab;
                this.switchTab(tabType);
            });
        });
    }

    // Switch tab
    switchTab(tabType) {
        // Update tab buttons
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabType}"]`).classList.add('active');
        
        // Update forms
        document.querySelectorAll('.auth-form').forEach(form => {
            form.classList.remove('active');
        });
        document.getElementById(`${tabType}Form`).classList.add('active');
        
        // Clear error
        this.hideError();
    }

    // Setup forms
    setupForms() {
        // Login form
        this.loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
        
        // Signup form
        this.signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSignup();
        });
    }

    // Setup input validation
    setupInputValidation() {
        // Username validation
        const usernameInputs = document.querySelectorAll('input[id*="Username"]');
        usernameInputs.forEach(input => {
            input.addEventListener('input', () => {
                if (input.value.length < 3) {
                    input.setCustomValidity('Username must be at least 3 characters');
                } else {
                    // Check for valid characters
                    const usernameRegex = /^[a-zA-Z0-9_]+$/;
                    if (!usernameRegex.test(input.value)) {
                        input.setCustomValidity('Username can only contain letters, numbers, and underscores');
                    } else {
                        input.setCustomValidity('');
                    }
                }
            });
        });
        
        // Email validation (only if provided)
        const emailInput = document.getElementById('signupEmail');
        if (emailInput) {
            emailInput.addEventListener('input', () => {
                // Only validate if email is not empty
                if (emailInput.value.trim() && !Helpers.validateEmail(emailInput.value)) {
                    emailInput.setCustomValidity('Please enter a valid email address');
                } else {
                    emailInput.setCustomValidity('');
                }
            });
        }
        
        // Password validation
        const passwordInputs = document.querySelectorAll('input[type="password"]');
        passwordInputs.forEach(input => {
            input.addEventListener('input', () => {
                if (input.value.length < 6) {
                    input.setCustomValidity('Password must be at least 6 characters');
                } else {
                    input.setCustomValidity('');
                }
            });
        });
        
        // Confirm password validation
        const confirmPassword = document.getElementById('signupConfirmPassword');
        const password = document.getElementById('signupPassword');
        
        if (confirmPassword && password) {
            confirmPassword.addEventListener('input', () => {
                if (confirmPassword.value !== password.value) {
                    confirmPassword.setCustomValidity('Passwords do not match');
                } else {
                    confirmPassword.setCustomValidity('');
                }
            });
        }
    }

    // Handle login
    async handleLogin() {
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;
        
        if (!username || !password) {
            this.showError('Please fill in all fields');
            return;
        }
        
        // Show loading state
        this.setLoading(true, 'login');
        
        try {
            await authService.login(username, password);
            this.hideError();
            this.showSuccess('Login successful!');
            
            // Switch to chat screen
            setTimeout(() => {
                window.app.showChatScreen();
            }, 1000);
            
        } catch (error) {
            this.showError(error.message);
        } finally {
            this.setLoading(false, 'login');
        }
    }

    // Handle signup
    async handleSignup() {
        const username = document.getElementById('signupUsername').value.trim();
        const email = document.getElementById('signupEmail').value.trim();
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('signupConfirmPassword').value;
        
        if (!username || !password || !confirmPassword) {
            this.showError('Please fill in all required fields');
            return;
        }
        
        if (password !== confirmPassword) {
            this.showError('Passwords do not match');
            return;
        }
        
        // Show loading state
        this.setLoading(true, 'signup');
        
        try {
            await authService.register(username, email, password, confirmPassword);
            this.hideError();
            this.showSuccess('Account created successfully!');
            
            // Switch to chat screen
            setTimeout(() => {
                window.app.showChatScreen();
            }, 1000);
            
        } catch (error) {
            this.showError(error.message);
        } finally {
            this.setLoading(false, 'signup');
        }
    }

    // Set loading state
    setLoading(isLoading, formType) {
        const form = document.getElementById(`${formType}Form`);
        const submitBtn = form.querySelector('button[type="submit"]');
        
        if (isLoading) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="loading"></span> Processing...';
        } else {
            submitBtn.disabled = false;
            const originalText = formType === 'login' ? 'Login' : 'Create Account';
            const originalIcon = formType === 'login' ? 'fa-arrow-right' : 'fa-user-plus';
            submitBtn.innerHTML = `<span>${originalText}</span><i class="fas ${originalIcon}"></i>`;
        }
    }

    // Show error
    showError(message) {
        this.authError.textContent = message;
        this.authError.classList.add('show');
    }

    // Hide error
    hideError() {
        this.authError.classList.remove('show');
    }

    // Show success message
    showSuccess(message) {
        // Create temporary success element
        const successDiv = document.createElement('div');
        successDiv.className = 'auth-success';
        successDiv.textContent = message;
        successDiv.style.cssText = `
            background: #d4edda;
            color: #155724;
            padding: 12px;
            border-radius: 8px;
            margin-top: 15px;
            text-align: center;
            animation: fadeIn 0.3s ease;
        `;
        
        this.authError.parentNode.appendChild(successDiv);
        
        // Remove after 3 seconds
        setTimeout(() => {
            successDiv.remove();
        }, 3000);
    }

    // Show screen
    show() {
        this.screen.classList.add('active');
    }

    // Hide screen
    hide() {
        this.screen.classList.remove('active');
        // Clear forms
        this.loginForm.reset();
        this.signupForm.reset();
        this.hideError();
    }
}

// Export singleton instance
window.loginScreen = new LoginScreen();
