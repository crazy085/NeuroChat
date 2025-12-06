// Register new user
async register(username, email, password, confirmPassword) {
    try {
        // Validate input
        if (password !== confirmPassword) {
            throw new Error('Passwords do not match');
        }
        
        if (password.length < 6) {
            throw new Error('Password must be at least 6 characters');
        }
        
        if (username.length < 3) {
            throw new Error('Username must be at least 3 characters');
        }
        
        // Check for valid username
        const usernameRegex = /^[a-zA-Z0-9_]+$/;
        if (!usernameRegex.test(username)) {
            throw new Error('Username can only contain letters, numbers, and underscores');
        }
        
        // Validate email if provided
        if (email && !Helpers.validateEmail(email)) {
            throw new Error('Please enter a valid email address');
        }
        
        // Check if user already exists
        const existingUsers = storageService.get(STORAGE_KEYS.USERS, []);
        const usernameExists = existingUsers.some(u => u.username.toLowerCase() === username.toLowerCase());
        
        if (usernameExists) {
            throw new Error('Username already taken');
        }
        
        // Check if email already exists (if provided)
        if (email) {
            const emailExists = existingUsers.some(u => u.email && u.email.toLowerCase() === email.toLowerCase());
            
            if (emailExists) {
                throw new Error('Email already registered');
            }
        }
        
        // Create new user (email is optional)
        const newUser = new User({
            username,
            email: email || '', // Use empty string if not provided
            password // In real app, this should be hashed
        });
        
        // Save user
        existingUsers.push(newUser.toJSON());
        storageService.save(STORAGE_KEYS.USERS, existingUsers);
        
        // Auto login after registration
        return this.login(username, password);
        
    } catch (error) {
        throw error;
    }
}
