// Realtime Service - Simulates real-time functionality
class RealtimeService {
    constructor() {
        this.isConnected = false;
        this.typingUsers = {};
        this.typingTimeouts = {};
        this.init();
    }

    // Initialize realtime service
    init() {
        // Simulate connection
        setTimeout(() => {
            this.connect();
        }, 1000);
        
        // Set up event listeners
        this.setupEventListeners();
    }

    // Connect to service
    connect() {
        this.isConnected = true;
        console.log('Connected to realtime service');
        
        // Start simulating user activity
        this.startUserActivitySimulation();
    }

    // Disconnect from service
    disconnect() {
        this.isConnected = false;
        console.log('Disconnected from realtime service');
    }

    // Setup event listeners
    setupEventListeners() {
        // Listen for message sent
        Helpers.eventEmitter.on(EVENTS.MESSAGE_SENT, (message) => {
            this.broadcastMessage(message);
        });
        
        // Listen for user login
        Helpers.eventEmitter.on(EVENTS.USER_LOGIN, (user) => {
            this.broadcastUserStatus(user.id, USER_STATUS.ONLINE);
        });
        
        // Listen for user logout
        Helpers.eventEmitter.on(EVENTS.USER_LOGOUT, (user) => {
            this.broadcastUserStatus(user.id, USER_STATUS.OFFLINE);
        });
    }

    // Send typing indicator
    sendTyping(chatId, isTyping) {
        if (!this.isConnected) return;
        
        const currentUser = authService.getCurrentUser();
        if (!currentUser) return;
        
        const typingKey = `${chatId}_${currentUser.id}`;
        
        if (isTyping) {
            this.typingUsers[typingKey] = {
                userId: currentUser.id,
                chatId,
                timestamp: Date.now()
            };
            
            // Clear existing timeout
            if (this.typingTimeouts[typingKey]) {
                clearTimeout(this.typingTimeouts[typingKey]);
            }
            
            // Set timeout to stop typing
            this.typingTimeouts[typingKey] = setTimeout(() => {
                this.stopTyping(chatId);
            }, 3000);
            
            // Broadcast typing event
            Helpers.eventEmitter.emit(EVENTS.TYPING_START, {
                userId: currentUser.id,
                chatId
            });
        } else {
            this.stopTyping(chatId);
        }
    }

    // Stop typing
    stopTyping(chatId) {
        const currentUser = authService.getCurrentUser();
        if (!currentUser) return;
        
        const typingKey = `${chatId}_${currentUser.id}`;
        
        delete this.typingUsers[typingKey];
        
        if (this.typingTimeouts[typingKey]) {
            clearTimeout(this.typingTimeouts[typingKey]);
            delete this.typingTimeouts[typingKey];
        }
        
        // Broadcast stop typing event
        Helpers.eventEmitter.emit(EVENTS.TYPING_STOP, {
            userId: currentUser.id,
            chatId
        });
    }

    // Get typing users for chat
    getTypingUsers(chatId) {
        const currentUser = authService.getCurrentUser();
        if (!currentUser) return [];
        
        const typingUsers = [];
        const now = Date.now();
        
        Object.values(this.typingUsers).forEach(typing => {
            if (typing.chatId === chatId && 
                typing.userId !== currentUser.id &&
                now - typing.timestamp < 5000) {
                typingUsers.push(typing.userId);
            }
        });
        
        return typingUsers;
    }

    // Broadcast message
    broadcastMessage(message) {
        // In a real app, this would send to server
        console.log('Broadcasting message:', message);
        
        // Simulate other users receiving the message
        setTimeout(() => {
            this.simulateMessageReceived(message);
        }, Math.random() * 2000);
    }

    // Simulate message received
    simulateMessageReceived(message) {
        const currentUser = authService.getCurrentUser();
        if (!currentUser) return;
        
        // Don't simulate receiving own messages
        if (message.senderId === currentUser.id) return;
        
        // Emit message received event
        Helpers.eventEmitter.emit(EVENTS.MESSAGE_RECEIVED, message);
    }

    // Broadcast user status
    broadcastUserStatus(userId, status) {
        console.log(`User ${userId} status: ${status}`);
        
        // Emit status change event
        Helpers.eventEmitter.emit(EVENTS.USER_STATUS_CHANGED, {
            userId,
            status
        });
    }

    // Start user activity simulation
    startUserActivitySimulation() {
        // Simulate users coming online and offline
        setInterval(() => {
            if (Math.random() > 0.8) {
                this.simulateUserActivity();
            }
        }, 10000);
    }

    // Simulate user activity
    simulateUserActivity() {
        const users = authService.getOnlineUsers();
        if (users.length === 0) return;
        
        const randomUser = users[Math.floor(Math.random() * users.length)];
        const activities = ['typing', 'status_change'];
        const activity = activities[Math.floor(Math.random() * activities.length)];
        
        if (activity === 'typing') {
            // Simulate typing in a random chat
            const chats = chatService.getChats();
            const userChats = chats.filter(c => c.participants.includes(randomUser.id));
            
            if (userChats.length > 0) {
                const randomChat = userChats[Math.floor(Math.random() * userChats.length)];
                
                // Start typing
                this.typingUsers[`${randomChat.id}_${randomUser.id}`] = {
                    userId: randomUser.id,
                    chatId: randomChat.id,
                    timestamp: Date.now()
                };
                
                Helpers.eventEmitter.emit(EVENTS.TYPING_START, {
                    userId: randomUser.id,
                    chatId: randomChat.id
                });
                
                // Stop typing after a few seconds
                setTimeout(() => {
                    delete this.typingUsers[`${randomChat.id}_${randomUser.id}`];
                    Helpers.eventEmitter.emit(EVENTS.TYPING_STOP, {
                        userId: randomUser.id,
                        chatId: randomChat.id
                    });
                }, 2000 + Math.random() * 3000);
            }
        } else if (activity === 'status_change') {
            // Simulate status change
            const statuses = [USER_STATUS.ONLINE, USER_STATUS.AWAY, USER_STATUS.BUSY];
            const newStatus = statuses[Math.floor(Math.random() * statuses.length)];
            
            this.broadcastUserStatus(randomUser.id, newStatus);
        }
    }

    // Get connection status
    getConnectionStatus() {
        return this.isConnected;
    }

    // Send presence update
    sendPresence(status) {
        if (!this.isConnected) return;
        
        const currentUser = authService.getCurrentUser();
        if (!currentUser) return;
        
        // Update user status
        authService.updateUser({ status });
        
        // Broadcast status
        this.broadcastUserStatus(currentUser.id, status);
    }

    // Join chat room
    joinChat(chatId) {
        if (!this.isConnected) return;
        
        console.log(`Joined chat room: ${chatId}`);
        
        // In a real app, this would join a WebSocket room
    }

    // Leave chat room
    leaveChat(chatId) {
        if (!this.isConnected) return;
        
        console.log(`Left chat room: ${chatId}`);
        
        // In a real app, this would leave a WebSocket room
        
        // Clear typing indicators for this chat
        Object.keys(this.typingUsers).forEach(key => {
            if (key.startsWith(`${chatId}_`)) {
                delete this.typingUsers[key];
            }
        });
    }
}

// Export singleton instance
window.realtimeService = new RealtimeService();
