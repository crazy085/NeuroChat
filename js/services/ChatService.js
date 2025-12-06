// Chat Service
class ChatService {
    constructor() {
        this.chats = [];
        this.messages = {};
        this.currentChatId = null;
        this.init();
    }

    // Initialize chat service
    init() {
        this.chats = storageService.get(STORAGE_KEYS.CHATS, []).map(c => Chat.fromJSON(c));
        this.messages = storageService.get(STORAGE_KEYS.MESSAGES, {});
        
        // Sort chats by last message time
        this.sortChats();
    }

    // Sort chats by last message time
    sortChats() {
        this.chats.sort((a, b) => {
            const timeA = a.lastMessage?.createdAt || a.createdAt;
            const timeB = b.lastMessage?.createdAt || b.createdAt;
            return new Date(timeB) - new Date(timeA);
        });
    }

    // Get all chats
    getChats() {
        return this.chats;
    }

    // Get chat by ID
    getChat(chatId) {
        return this.chats.find(c => c.id === chatId);
    }

    // Create new chat
    async createChat(name, type, participants) {
        try {
            const currentUser = authService.getCurrentUser();
            if (!currentUser) {
                throw new Error('User not authenticated');
            }
            
            let chat;
            
            if (type === CHAT_TYPES.DIRECT) {
                // Check if direct chat already exists
                const existingChat = this.chats.find(c => 
                    c.type === CHAT_TYPES.DIRECT &&
                    c.participants.includes(currentUser.id) &&
                    c.participants.includes(participants[0])
                );
                
                if (existingChat) {
                    return existingChat;
                }
                
                chat = Chat.createDirect(currentUser.id, participants[0]);
            } else {
                chat = Chat.createGroup(name, currentUser.id, participants);
            }
            
            // Add to chats
            this.chats.push(chat);
            this.saveChats();
            
            // Emit event
            Helpers.eventEmitter.emit(EVENTS.CHAT_CREATED, chat);
            
            return chat;
            
        } catch (error) {
            console.error('Create chat error:', error);
            throw error;
        }
    }

    // Update chat
    updateChat(chatId, data) {
        const chat = this.getChat(chatId);
        if (!chat) return false;
        
        chat.update(data);
        this.saveChats();
        
        Helpers.eventEmitter.emit(EVENTS.CHAT_UPDATED, chat);
        return true;
    }

    // Delete chat
    deleteChat(chatId) {
        const index = this.chats.findIndex(c => c.id === chatId);
        if (index === -1) return false;
        
        const chat = this.chats[index];
        this.chats.splice(index, 1);
        
        // Delete messages
        delete this.messages[chatId];
        
        this.saveChats();
        this.saveMessages();
        
        Helpers.eventEmitter.emit(EVENTS.CHAT_DELETED, chat);
        return true;
    }

    // Get messages for chat
    getMessages(chatId, limit = 50) {
        if (!this.messages[chatId]) {
            this.messages[chatId] = [];
        }
        
        return this.messages[chatId]
            .slice(-limit)
            .map(m => Message.fromJSON(m));
    }

    // Send message
    async sendMessage(chatId, text, type = 'text', fileData = null) {
        try {
            const currentUser = authService.getCurrentUser();
            if (!currentUser) {
                throw new Error('User not authenticated');
            }
            
            const chat = this.getChat(chatId);
            if (!chat) {
                throw new Error('Chat not found');
            }
            
            // Create message
            let message;
            if (type === 'text') {
                message = Message.createText(chatId, currentUser.id, text);
            } else if (fileData) {
                message = new Message({
                    chatId,
                    senderId: currentUser.id,
                    text: text || '',
                    type,
                    fileUrl: fileData.url,
                    fileName: fileData.name,
                    fileSize: fileData.size
                });
            }
            
            // Add to messages
            if (!this.messages[chatId]) {
                this.messages[chatId] = [];
            }
            this.messages[chatId].push(message.toJSON());
            
            // Update chat
            chat.setLastMessage(message.toJSON());
            chat.resetUnread();
            
            // Save and sort
            this.saveMessages();
            this.saveChats();
            this.sortChats();
            
            // Emit events
            Helpers.eventEmitter.emit(EVENTS.MESSAGE_SENT, message);
            
            // Simulate delivery and read receipts
            setTimeout(() => {
                message.setStatus(MESSAGE_STATUS.DELIVERED);
                this.updateMessage(chatId, message.id, { status: MESSAGE_STATUS.DELIVERED });
            }, 1000);
            
            setTimeout(() => {
                message.setStatus(MESSAGE_STATUS.READ);
                this.updateMessage(chatId, message.id, { status: MESSAGE_STATUS.READ });
            }, 2000);
            
            // Simulate reply in other chats
            if (Math.random() > 0.7) {
                this.simulateReply(chatId);
            }
            
            return message;
            
        } catch (error) {
            console.error('Send message error:', error);
            throw error;
        }
    }

    // Update message
    updateMessage(chatId, messageId, data) {
        if (!this.messages[chatId]) return false;
        
        const messageIndex = this.messages[chatId].findIndex(m => m.id === messageId);
        if (messageIndex === -1) return false;
        
        const message = Message.fromJSON(this.messages[chatId][messageIndex]);
        message.update(data);
        
        this.messages[chatId][messageIndex] = message.toJSON();
        this.saveMessages();
        
        Helpers.eventEmitter.emit(EVENTS.MESSAGE_UPDATED, message);
        return true;
    }

    // Delete message
    deleteMessage(chatId, messageId) {
        if (!this.messages[chatId]) return false;
        
        const messageIndex = this.messages[chatId].findIndex(m => m.id === messageId);
        if (messageIndex === -1) return false;
        
        const message = Message.fromJSON(this.messages[chatId][messageIndex]);
        message.delete();
        
        this.messages[chatId][messageIndex] = message.toJSON();
        this.saveMessages();
        
        Helpers.eventEmitter.emit(EVENTS.MESSAGE_DELETED, message);
        return true;
    }

    // Mark messages as read
    markAsRead(chatId) {
        if (!this.messages[chatId]) return false;
        
        const chat = this.getChat(chatId);
        if (!chat) return false;
        
        // Update message statuses
        this.messages[chatId].forEach(m => {
            if (m.status !== MESSAGE_STATUS.READ) {
                m.status = MESSAGE_STATUS.READ;
            }
        });
        
        // Reset unread count
        chat.resetUnread();
        
        this.saveMessages();
        this.saveChats();
        
        return true;
    }

    // Get unread count
    getUnreadCount() {
        return this.chats.reduce((total, chat) => total + chat.unreadCount, 0);
    }

    // Search chats
    searchChats(query) {
        return this.chats.filter(chat => {
            const name = chat.name.toLowerCase();
            const lastMessage = chat.lastMessage?.text?.toLowerCase() || '';
            return name.includes(query.toLowerCase()) || lastMessage.includes(query.toLowerCase());
        });
    }

    // Simulate reply
    simulateReply(chatId) {
        const chat = this.getChat(chatId);
        if (!chat) return;
        
        const currentUser = authService.getCurrentUser();
        const otherParticipants = chat.participants.filter(id => id !== currentUser.id);
        
        if (otherParticipants.length === 0) return;
        
        const replies = [
            "That's interesting!",
            "I see what you mean.",
            "Thanks for sharing!",
            "I completely agree.",
            "That's a good point.",
            "Let me think about that.",
            "Sure, I'll get back to you on that.",
            "No problem at all!",
            "How about you?",
            "Sounds good!",
            "Absolutely!",
            "I'm doing great, thanks for asking!",
            "What's up?",
            "Nice to hear from you!"
        ];
        
        setTimeout(() => {
            const replyText = replies[Math.floor(Math.random() * replies.length)];
            const replyMessage = new Message({
                chatId,
                senderId: otherParticipants[0],
                text: replyText,
                type: 'text',
                status: MESSAGE_STATUS.DELIVERED
            });
            
            if (!this.messages[chatId]) {
                this.messages[chatId] = [];
            }
            this.messages[chatId].push(replyMessage.toJSON());
            
            chat.setLastMessage(replyMessage.toJSON());
            chat.incrementUnread();
            
            this.saveMessages();
            this.saveChats();
            this.sortChats();
            
            Helpers.eventEmitter.emit(EVENTS.MESSAGE_RECEIVED, replyMessage);
            
            // Show notification
            if (window.notificationSystem) {
                notificationSystem.show({
                    type: 'info',
                    title: 'New Message',
                    message: `${chat.getDisplayName(currentUser.id)}: ${replyText}`
                });
            }
        }, 2000 + Math.random() * 3000);
    }

    // Save chats to storage
    saveChats() {
        storageService.save(STORAGE_KEYS.CHATS, this.chats.map(c => c.toJSON()));
    }

    // Save messages to storage
    saveMessages() {
        storageService.save(STORAGE_KEYS.MESSAGES, this.messages);
    }

    // Set current chat
    setCurrentChat(chatId) {
        this.currentChatId = chatId;
        if (chatId) {
            this.markAsRead(chatId);
        }
    }

    // Get current chat
    getCurrentChat() {
        return this.currentChatId ? this.getChat(this.currentChatId) : null;
    }
}

// Export singleton instance
window.chatService = new ChatService();
