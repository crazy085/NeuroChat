// Authentication Service
class AuthService {
    constructor() {
        this.currentUser = null;
        this.token = null;
        this.init();
    }

    // Initialize auth service
    init() {
        const token = storageService.get(STORAGE_KEYS.AUTH_TOKEN);
        const user = storageService.get(STORAGE_KEYS.USER);
        
        if (token && user) {
            this.token = token;
            this.currentUser = User.fromJSON(user);
        }
    }

    // Register new user
    async register(username, email, password, confirmPassword) {
        try {
            // Validate input
            if (password !== confirmPassword) {
                throw new Error('Passwords do not match');
            }
            
            if (!Helpers.validateEmail(email)) {
                throw new Error('Invalid email address');
            }
            
            if (password.length < 6) {
                throw new Error('Password must be at least 6 characters');
            }
            
            // Check if user already exists
            const existingUsers = storageService.get(STORAGE_KEYS.USERS, []);
            const usernameExists = existingUsers.some(u => u.username === username);
            const emailExists = existingUsers.some(u => u.email === email);
            
            if (usernameExists) {
                throw new Error('Username already taken');
            }
            
            if (emailExists) {
                throw new Error('Email already registered');
            }
            
            // Create new user
            const newUser = new User({
                username,
                email,
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

    // Login user
    async login(username, password) {
        try {
            // Get users from storage
            const users = storageService.get(STORAGE_KEYS.USERS, []);
            
            // Find user
            const user = users.find(u => u.username === username && u.password === password);
            
            if (!user) {
                throw new Error(ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS);
            }
            
            // Create user instance
            const userInstance = User.fromJSON(user);
            
            // Update online status
            userInstance.setOnline(true);
            userInstance.setStatus(USER_STATUS.ONLINE);
            
            // Save updated user
            const userIndex = users.findIndex(u => u.id === userInstance.id);
            users[userIndex] = userInstance.toJSON();
            storageService.save(STORAGE_KEYS.USERS, users);
            
            // Generate token (in real app, this would be JWT)
            const token = btoa(`${userInstance.id}:${Date.now()}`);
            
            // Save to storage
            storageService.save(STORAGE_KEYS.AUTH_TOKEN, token);
            storageService.save(STORAGE_KEYS.USER, userInstance.toJSON());
            
            // Set current user
            this.currentUser = userInstance;
            this.token = token;
            
            // Emit login event
            Helpers.eventEmitter.emit(EVENTS.USER_LOGIN, userInstance);
            
            return userInstance;
            
        } catch (error) {
            throw error;
        }
    }

    // Logout user
    async logout() {
        try {
            if (this.currentUser) {
                // Update offline status
                const users = storageService.get(STORAGE_KEYS.USERS, []);
                const userIndex = users.findIndex(u => u.id === this.currentUser.id);
                
                if (userIndex > -1) {
                    users[userIndex].isOnline = false;
                    users[userIndex].lastSeen = new Date().toISOString();
                    storageService.save(STORAGE_KEYS.USERS, users);
                }
                
                // Emit logout event
                Helpers.eventEmitter.emit(EVENTS.USER_LOGOUT, this.currentUser);
            }
            
            // Clear storage
            storageService.remove(STORAGE_KEYS.AUTH_TOKEN);
            storageService.remove(STORAGE_KEYS.USER);
            
            // Clear current user
            this.currentUser = null;
            this.token = null;
            
            return true;
            
        } catch (error) {
            console.error('Logout error:', error);
            return false;
        }
    }

    // Check if user is authenticated
    isAuthenticated() {
        return this.currentUser !== null && this.token !== null;
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Update current user
    updateUser(userData) {
        if (!this.currentUser) return false;
        
        try {
            // Update user instance
            this.currentUser.update(userData);
            
            // Update in storage
            const users = storageService.get(STORAGE_KEYS.USERS, []);
            const userIndex = users.findIndex(u => u.id === this.currentUser.id);
            
            if (userIndex > -1) {
                users[userIndex] = this.currentUser.toJSON();
                storageService.save(STORAGE_KEYS.USERS, users);
            }
            
            // Update current user storage
            storageService.save(STORAGE_KEYS.USER, this.currentUser.toJSON());
            
            return true;
            
        } catch (error) {
            console.error('Update user error:', error);
            return false;
        }
    }

    // Update user settings
    updateSettings(settings) {
        if (!this.currentUser) return false;
        
        this.currentUser.updateSettings(settings);
        return this.updateUser(this.currentUser);
    }

    // Change password
    async changePassword(currentPassword, newPassword) {
        if (!this.currentUser) {
            throw new Error('User not authenticated');
        }
        
        try {
            // Get users from storage
            const users = storageService.get(STORAGE_KEYS.USERS, []);
            const userIndex = users.findIndex(u => u.id === this.currentUser.id);
            
            if (userIndex === -1) {
                throw new Error('User not found');
            }
            
            // Verify current password
            if (users[userIndex].password !== currentPassword) {
                throw new Error('Current password is incorrect');
            }
            
            // Update password
            users[userIndex].password = newPassword;
            storageService.save(STORAGE_KEYS.USERS, users);
            
            // Update current user
            this.currentUser.password = newPassword;
            storageService.save(STORAGE_KEYS.USER, this.currentUser.toJSON());
            
            return true;
            
        } catch (error) {
            throw error;
        }
    }

    // Get user by ID
    getUserById(userId) {
        try {
            const users = storageService.get(STORAGE_KEYS.USERS, []);
            const user = users.find(u => u.id === userId);
            return user ? User.fromJSON(user) : null;
        } catch (error) {
            console.error('Get user error:', error);
            return null;
        }
    }

    // Search users
    searchUsers(query) {
        try {
            const users = storageService.get(STORAGE_KEYS.USERS, []);
            return users
                .filter(u => 
                    u.username.toLowerCase().includes(query.toLowerCase()) ||
                    u.email.toLowerCase().includes(query.toLowerCase())
                )
                .map(u => User.fromJSON(u));
        } catch (error) {
            console.error('Search users error:', error);
            return [];
        }
    }

    // Get all online users
    getOnlineUsers() {
        try {
            const users = storageService.get(STORAGE_KEYS.USERS, []);
            return users
                .filter(u => u.isOnline && u.id !== this.currentUser?.id)
                .map(u => User.fromJSON(u));
        } catch (error) {
            console.error('Get online users error:', error);
            return [];
        }
    }

    // Refresh token
    async refreshToken() {
        if (!this.currentUser || !this.token) {
            return false;
        }
        
        try {
            // Generate new token
            const newToken = btoa(`${this.currentUser.id}:${Date.now()}`);
            
            // Save new token
            storageService.save(STORAGE_KEYS.AUTH_TOKEN, newToken);
            this.token = newToken;
            
            return true;
        } catch (error) {
            console.error('Refresh token error:', error);
            return false;
        }
    }
}

// Export singleton instance
window.authService = new AuthService();
