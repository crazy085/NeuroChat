// Message Model
class Message {
    constructor(data = {}) {
        this.id = data.id || Helpers.generateId();
        this.chatId = data.chatId || '';
        this.senderId = data.senderId || '';
        this.text = data.text || '';
        this.type = data.type || 'text'; // text, image, file, audio, video
        this.fileUrl = data.fileUrl || null;
        this.fileName = data.fileName || null;
        this.fileSize = data.fileSize || null;
        this.status = data.status || MESSAGE_STATUS.SENT;
        this.replyTo = data.replyTo || null; // Message ID this is replying to
        this.reactions = data.reactions || {};
        this.isEdited = data.isEdited || false;
        this.editedAt = data.editedAt || null;
        this.isDeleted = data.isDeleted || false;
        this.deletedAt = data.deletedAt || null;
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
    }

    // Update message
    update(data) {
        Object.keys(data).forEach(key => {
            if (this.hasOwnProperty(key)) {
                this[key] = data[key];
            }
        });
        this.updatedAt = new Date().toISOString();
    }

    // Edit message
    editText(newText) {
        this.text = newText;
        this.isEdited = true;
        this.editedAt = new Date().toISOString();
        this.updatedAt = new Date().toISOString();
    }

    // Set status
    setStatus(status) {
        this.status = status;
        this.updatedAt = new Date().toISOString();
    }

    // Add reaction
    addReaction(emoji, userId) {
        if (!this.reactions[emoji]) {
            this.reactions[emoji] = [];
        }
        if (!this.reactions[emoji].includes(userId)) {
            this.reactions[emoji].push(userId);
        }
        this.updatedAt = new Date().toISOString();
    }

    // Remove reaction
    removeReaction(emoji, userId) {
        if (this.reactions[emoji]) {
            const index = this.reactions[emoji].indexOf(userId);
            if (index > -1) {
                this.reactions[emoji].splice(index, 1);
                if (this.reactions[emoji].length === 0) {
                    delete this.reactions[emoji];
                }
            }
        }
        this.updatedAt = new Date().toISOString();
    }

    // Delete message
    delete() {
        this.isDeleted = true;
        this.deletedAt = new Date().toISOString();
        this.updatedAt = new Date().toISOString();
    }

    // Get formatted time
    getTime() {
        return Helpers.formatTime(this.createdAt, 'time');
    }

    // Get display text
    getDisplayText() {
        if (this.isDeleted) {
            return 'This message was deleted';
        }
        
        if (this.type === 'text') {
            return this.text;
        } else if (this.type === 'image') {
            return '📷 Image';
        } else if (this.type === 'file') {
            return `📎 ${this.fileName || 'File'}`;
        } else if (this.type === 'audio') {
            return '🎵 Audio message';
        } else if (this.type === 'video') {
            return '📹 Video';
        }
        
        return 'Message';
    }

    // Check if message is from current user
    isFromUser(userId) {
        return this.senderId === userId;
    }

    // Get reaction count
    getReactionCount() {
        return Object.values(this.reactions).reduce((total, users) => total + users.length, 0);
    }

    // Get all reactions
    getAllReactions() {
        const reactions = [];
        Object.entries(this.reactions).forEach(([emoji, users]) => {
            reactions.push({ emoji, count: users.length, users });
        });
        return reactions;
    }

    // Validate message
    validate() {
        const errors = [];
        
        if (!this.chatId) {
            errors.push('Chat ID is required');
        }
        
        if (!this.senderId) {
            errors.push('Sender ID is required');
        }
        
        if (this.type === 'text' && !this.text.trim()) {
            errors.push('Message text cannot be empty');
        }
        
        if (this.type !== 'text' && !this.fileUrl) {
            errors.push('File URL is required for non-text messages');
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
            chatId: this.chatId,
            senderId: this.senderId,
            text: this.text,
            type: this.type,
            fileUrl: this.fileUrl,
            fileName: this.fileName,
            fileSize: this.fileSize,
            status: this.status,
            replyTo: this.replyTo,
            reactions: this.reactions,
            isEdited: this.isEdited,
            editedAt: this.editedAt,
            isDeleted: this.isDeleted,
            deletedAt: this.deletedAt,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    // Create message from JSON
    static fromJSON(data) {
        return new Message(data);
    }

    // Create text message
    static createText(chatId, senderId, text) {
        return new Message({
            chatId,
            senderId,
            text,
            type: 'text'
        });
    }

    // Create image message
    static createImage(chatId, senderId, fileUrl, fileName) {
        return new Message({
            chatId,
            senderId,
            fileUrl,
            fileName,
            type: 'image'
        });
    }

    // Create file message
    static createFile(chatId, senderId, fileUrl, fileName, fileSize) {
        return new Message({
            chatId,
            senderId,
            fileUrl,
            fileName,
            fileSize,
            type: 'file'
        });
    }
}

// Export Message model
window.Message = Message;
