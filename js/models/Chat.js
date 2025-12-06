// Chat Model
class Chat {
    constructor(data = {}) {
        this.id = data.id || Helpers.generateId();
        this.name = data.name || '';
        this.type = data.type || CHAT_TYPES.DIRECT;
        this.avatar = data.avatar || Helpers.generateAvatar(this.id);
        this.participants = data.participants || [];
        this.admins = data.admins || [];
        this.lastMessage = data.lastMessage || null;
        this.unreadCount = data.unreadCount || 0;
        this.isMuted = data.isMuted || false;
        this.isPinned = data.isPinned || false;
        this.isArchived = data.isArchived || false;
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
    }

    // Update chat data
    update(data) {
        Object.keys(data).forEach(key => {
            if (this.hasOwnProperty(key)) {
                this[key] = data[key];
            }
        });
        this.updatedAt = new Date().toISOString();
    }

    // Add participant
    addParticipant(userId) {
        if (!this.participants.includes(userId)) {
            this.participants.push(userId);
            this.updatedAt = new Date().toISOString();
        }
    }

    // Remove participant
    removeParticipant(userId) {
        const index = this.participants.indexOf(userId);
        if (index > -1) {
            this.participants.splice(index, 1);
            this.updatedAt = new Date().toISOString();
        }
    }

    // Add admin
    addAdmin(userId) {
        if (!this.admins.includes(userId)) {
            this.admins.push(userId);
            this.updatedAt = new Date().toISOString();
        }
    }

    // Remove admin
    removeAdmin(userId) {
        const index = this.admins.indexOf(userId);
        if (index > -1) {
            this.admins.splice(index, 1);
            this.updatedAt = new Date().toISOString();
        }
    }

    // Set last message
    setLastMessage(message) {
        this.lastMessage = message;
        this.updatedAt = new Date().toISOString();
    }

    // Increment unread count
    incrementUnread() {
        this.unreadCount++;
        this.updatedAt = new Date().toISOString();
    }

    // Reset unread count
    resetUnread() {
        this.unreadCount = 0;
        this.updatedAt = new Date().toISOString();
    }

    // Mute/unmute chat
    setMuted(isMuted) {
        this.isMuted = isMuted;
        this.updatedAt = new Date().toISOString();
    }

    // Pin/unpin chat
    setPinned(isPinned) {
        this.isPinned = isPinned;
        this.updatedAt = new Date().toISOString();
    }

    // Archive/unarchive chat
    setArchived(isArchived) {
        this.isArchived = isArchived;
        this.updatedAt = new Date().toISOString();
    }

    // Check if user is participant
    isParticipant(userId) {
        return this.participants.includes(userId);
    }

    // Check if user is admin
    isAdmin(userId) {
        return this.admins.includes(userId);
    }

    // Get display name
    getDisplayName(currentUserId) {
        if (this.type === CHAT_TYPES.GROUP) {
            return this.name || 'Unnamed Group';
        } else {
            // For direct chats, show the other user's name
            const otherUserId = this.participants.find(id => id !== currentUserId);
            return otherUserId ? `User ${otherUserId}` : 'Unknown User';
        }
    }

    // Get chat preview
    getPreview() {
        if (this.lastMessage) {
            return this.lastMessage.text || 'Media message';
        }
        return 'No messages yet';
    }

    // Get formatted time
    getTime() {
        if (this.lastMessage) {
            return Helpers.getRelativeTime(this.lastMessage.createdAt);
        }
        return Helpers.getRelativeTime(this.createdAt);
    }

    // Convert to JSON
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            avatar: this.avatar,
            participants: this.participants,
            admins: this.admins,
            lastMessage: this.lastMessage,
            unreadCount: this.unreadCount,
            isMuted: this.isMuted,
            isPinned: this.isPinned,
            isArchived: this.isArchived,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    // Create chat from JSON
    static fromJSON(data) {
        return new Chat(data);
    }

    // Create direct chat
    static createDirect(user1Id, user2Id) {
        return new Chat({
            type: CHAT_TYPES.DIRECT,
            participants: [user1Id, user2Id]
        });
    }

    // Create group chat
    static createGroup(name, creatorId, participants = []) {
        const chat = new Chat({
            name,
            type: CHAT_TYPES.GROUP,
            participants: [creatorId, ...participants],
            admins: [creatorId]
        });
        return chat;
    }
}

// Export Chat model
window.Chat = Chat;
