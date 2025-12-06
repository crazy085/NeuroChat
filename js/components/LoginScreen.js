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
