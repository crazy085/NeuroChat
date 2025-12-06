// User Model
class User {
    constructor(data = {}) {
        this.id = data.id || Helpers.generateId();
        this.username = data.username || '';
        this.email = data.email || '';
        this.password = data.password || '';
        this.avatar = data.avatar || Helpers.generateAvatar(this.username);
        this.status = data.status || USER_STATUS.ONLINE;
        this.customStatus = data.customStatus || 'Hey there! I\'m using NeuroChat';
        this.lastSeen = data.lastSeen || new Date().toISOString();
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
        this.settings = data.settings || { ...DEFAULT_SETTINGS };
        this.contacts = data.contacts || [];
        this.isOnline = data.isOnline !== undefined ? data.isOnline : true;
    }

    // Update user data
    update(data) {
        Object.keys(data).forEach(key => {
            if (this.hasOwnProperty(key)) {
                this[key] = data[key];
            }
        });
        this.updatedAt = new Date().toISOString();
    }

    // Set user status
    setStatus(status) {
        this.status = status;
        this.lastSeen = new Date().toISOString();
        this.updatedAt = new Date().toISOString();
    }

    // Set online status
    setOnline(isOnline) {
        this.isOnline = isOnline;
        if (!isOnline) {
            this.lastSeen = new Date().toISOString();
        }
        this.updatedAt = new Date().toISOString();
    }

    // Update settings
    updateSettings(settings) {
        this.settings = { ...this.settings, ...settings };
        this.updatedAt = new Date().toISOString();
    }

    // Add contact
    addContact(userId) {
        if (!this.contacts.includes(userId)) {
            this.contacts.push(userId);
            this.updatedAt = new Date().toISOString();
        }
    }

    // Remove contact
    removeContact(userId) {
        const index = this.contacts.indexOf(userId);
        if (index > -1) {
            this.contacts.splice(index, 1);
            this.updatedAt = new Date().toISOString();
        }
    }

    // Get display name
    getDisplayName() {
        return this.username || 'Unknown User';
    }

    // Get status text
    getStatusText() {
        if (this.isOnline) {
            return this.status;
        }
        return `Last seen ${Helpers.getRelativeTime(this.lastSeen)}`;
    }

    // Validate user data
    validate() {
        const errors = [];
        
        if (!this.username || this.username.length < 3) {
            errors.push('Username must be at least 3 characters');
        }
        
        if (!this.email || !Helpers.validateEmail(this.email)) {
            errors.push('Valid email is required');
        }
        
        if (!this.password || this.password.length < 6) {
            errors.push('Password must be at least 6 characters');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Convert to JSON
    toJSON() {
        return {
            id: this.id,
            username: this.username,
            email: this.email,
            avatar: this.avatar,
            status: this.status,
            customStatus: this.customStatus,
            lastSeen: this.lastSeen,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            settings: this.settings,
            contacts: this.contacts,
            isOnline: this.isOnline
        };
    }

    // Create user from JSON
    static fromJSON(data) {
        return new User(data);
    }
}

// Export User model
window.User = User;
