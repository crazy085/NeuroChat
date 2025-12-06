// Chat Window Component
class ChatWindow {
    constructor() {
        this.currentChatId = null;
        this.messagesContainer = document.getElementById('messagesContainer');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.emojiPicker = document.getElementById('emojiPicker');
        this.typingIndicator = document.getElementById('typingIndicator');
        this.init();
    }

    // Initialize chat window
    init() {
        this.setupMessageInput();
        this.setupEmojiPicker();
        this.setupEventListeners();
        this.setupTypingIndicator();
    }

    // Setup message input
    setupMessageInput() {
        if (this.messageInput) {
            this.messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
            
            this.messageInput.addEventListener('input', () => {
                this.handleTyping();
            });
        }
        
        if (this.sendButton) {
            this.sendButton.addEventListener('click', () => {
                this.sendMessage();
            });
        }
    }

    // Setup emoji picker
    setupEmojiPicker() {
        const emojiBtn = document.getElementById('emojiBtn');
        if (emojiBtn) {
            emojiBtn.addEventListener('click', () => {
                this.toggleEmojiPicker();
            });
        }
        
        // Load emojis
        this.loadEmojis();
        
        // Setup emoji categories
        const categories = document.querySelectorAll('.emoji-category');
        categories.forEach(category => {
            category.addEventListener('click', () => {
                this.selectEmojiCategory(category.dataset.category);
            });
        });
    }

    // Load emojis
    loadEmojis() {
        const emojiGrid = document.getElementById('emojiGrid');
        if (!emojiGrid) return;
        
        const activeCategory = document.querySelector('.emoji-category.active');
        const category = activeCategory ? activeCategory.dataset.category : 'smileys';
        const emojis = EMOJI_CATEGORIES[category] || [];
        
        emojiGrid.innerHTML = '';
        emojis.forEach(emoji => {
            const emojiElement = document.createElement('div');
            emojiElement.className = 'emoji';
            emojiElement.textContent = emoji;
            emojiElement.addEventListener('click', () => {
                this.insertEmoji(emoji);
            });
            emojiGrid.appendChild(emojiElement);
        });
    }

    // Select emoji category
    selectEmojiCategory(category) {
        document.querySelectorAll('.emoji-category').forEach(cat => {
            cat.classList.remove('active');
        });
        document.querySelector(`[data-category="${category}"]`).classList.add('active');
        this.loadEmojis();
    }

    // Toggle emoji picker
    toggleEmojiPicker() {
        if (this.emojiPicker) {
            this.emojiPicker.classList.toggle('active');
        }
    }

    // Insert emoji
    insertEmoji(emoji) {
        if (this.messageInput) {
            const start = this.messageInput.selectionStart;
            const end = this.messageInput.selectionEnd;
            const text = this.messageInput.value;
            
            this.messageInput.value = text.substring(0, start) + emoji + text.substring(end);
            this.messageInput.selectionStart = this.messageInput.selectionEnd = start + emoji.length;
            this.messageInput.focus();
        }
        
        this.toggleEmojiPicker();
    }

    // Setup event listeners
    setupEventListeners() {
        // Listen for message events
        Helpers.eventEmitter.on(EVENTS.MESSAGE_RECEIVED, (message) => {
            if (message.chatId === this.currentChatId) {
                this.addMessage(message);
            }
        });
        
        Helpers.eventEmitter.on(EVENTS.MESSAGE_SENT, (message) => {
            if (message.chatId === this.currentChatId) {
                this.addMessage(message);
            }
        });
        
        // Listen for typing events
        Helpers.eventEmitter.on(EVENTS.TYPING_START, (data) => {
            if (data.chatId === this.currentChatId) {
                this.showTypingIndicator(data.userId);
            }
        });
        
        Helpers.eventEmitter.on(EVENTS.TYPING_STOP, (data) => {
            if (data.chatId === this.currentChatId) {
                this.hideTypingIndicator(data.userId);
            }
        });
        
        // Close emoji picker when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.emojiPicker.contains(e.target) && 
                !e.target.closest('#emojiBtn')) {
                this.emojiPicker.classList.remove('active');
            }
        });
    }

    // Setup typing indicator
    setupTypingIndicator() {
        this.typingUsers = new Set();
    }

    // Open chat
    openChat(chatId) {
        this.currentChatId = chatId;
        const chat = chatService.getChat(chatId);
        
        if (!chat) return;
        
        // Update chat header
        this.updateChatHeader(chat);
        
        // Load messages
        this.loadMessages();
        
        // Show chat view
        this.showChatView();
        
        // Set as current chat
        chatService.setCurrentChat(chatId);
        
        // Join chat room
        realtimeService.joinChat(chatId);
        
        // Clear selection in chat list
        chatList.clearSelection();
        
        // Mark messages as read
        chatService.markAsRead(chatId);
    }

    // Update chat header
    updateChatHeader(chat) {
        const currentUser = authService.getCurrentUser();
        const nameElement = document.getElementById('currentChatName');
        const avatarElement = document.getElementById('currentChatAvatar');
        const statusElement = document.getElementById('currentChatStatus');
        const statusTextElement = document.getElementById('currentChatStatusText');
        
        if (nameElement) {
            nameElement.textContent = chat.getDisplayName(currentUser.id);
        }
        
        if (avatarElement) {
            avatarElement.src = chat.avatar;
        }
        
        if (statusElement && statusTextElement) {
            if (chat.type === CHAT_TYPES.DIRECT) {
                const otherUserId = chat.participants.find(id => id !== currentUser.id);
                const otherUser = authService.getUserById(otherUserId);
                
                if (otherUser) {
                    statusElement.className = `status-indicator ${otherUser.isOnline ? 'online' : 'offline'}`;
                    statusTextElement.textContent = otherUser.getStatusText();
                }
            } else {
                statusElement.className = 'status-indicator online';
                statusTextElement.textContent = `${chat.participants.length} members`;
            }
        }
    }

    // Load messages
    loadMessages() {
        if (!this.messagesContainer) return;
        
        const messages = chatService.getMessages(this.currentChatId);
        this.messagesContainer.innerHTML = '';
        
        messages.forEach(message => {
            this.addMessage(message, false);
        });
        
        // Scroll to bottom
        this.scrollToBottom();
    }

    // Add message
    addMessage(message, scroll = true) {
        if (!this.messagesContainer) return;
        
        const messageElement = this.createMessageElement(message);
        this.messagesContainer.appendChild(messageElement);
        
        if (scroll) {
            this.scrollToBottom();
        }
        
        // Play notification sound if message is from someone else
        const currentUser = authService.getCurrentUser();
        if (message.senderId !== currentUser.id) {
            this.playNotificationSound();
        }
    }

    // Create message element
    createMessageElement(message) {
        const currentUser = authService.getCurrentUser();
        const isFromMe = message.senderId === currentUser.id;
        
        const messageElement = document.createElement('div');
        messageElement.className = `message ${isFromMe ? 'sent' : 'received'}`;
        messageElement.dataset.messageId = message.id;
        
        // Get sender info for group chats
        let senderName = '';
        if (!isFromMe) {
            const chat = chatService.getChat(message.chatId);
            if (chat.type === CHAT_TYPES.GROUP) {
                const sender = authService.getUserById(message.senderId);
                senderName = sender ? sender.username : 'Unknown';
            }
        }
        
        messageElement.innerHTML = `
            <div class="message-content">
                ${senderName ? `<div class="sender-name">${senderName}</div>` : ''}
                ${message.type === 'text' ? 
                    this.formatMessageText(message.text) : 
                    this.createFileElement(message)
                }
                <div class="message-info">
                    <span>${message.getTime()}</span>
                    ${isFromMe ? this.createStatusIcon(message.status) : ''}
                </div>
            </div>
        `;
        
        return messageElement;
    }

    // Format message text
    formatMessageText(text) {
        return Helpers.formatMessage(text);
    }

    // Create file element
    createFileElement(message) {
        if (message.type === 'image') {
            return `
                <div class="message-image">
                    <img src="${message.fileUrl}" alt="${message.fileName}" loading="lazy">
                </div>
            `;
        } else if (message.type === 'file') {
            return `
                <div class="message-file">
                    <i class="fas fa-file"></i>
                    <div class="file-info">
                        <div class="file-name">${message.fileName}</div>
                        <div class="file-size">${Helpers.formatFileSize(message.fileSize)}</div>
                    </div>
                </div>
            `;
        } else if (message.type === 'audio') {
            return `
                <div class="message-audio">
                    <i class="fas fa-play"></i>
                    <span>Audio message</span>
                </div>
            `;
        }
        
        return message.getDisplayText();
    }

    // Create status icon
    createStatusIcon(status) {
        const icons = {
            [MESSAGE_STATUS.SENT]: '<i class="fas fa-check"></i>',
            [MESSAGE_STATUS.DELIVERED]: '<i class="fas fa-check-double"></i>',
            [MESSAGE_STATUS.READ]: '<i class="fas fa-check-double message-status-read"></i>'
        };
        
        return `<span class="message-status ${status}">${icons[status] || ''}</span>`;
    }

    // Send message
    async sendMessage() {
        if (!this.messageInput || !this.currentChatId) return;
        
        const text = this.messageInput.value.trim();
        if (!text) return;
        
        // Clear input
        this.messageInput.value = '';
        
        try {
            await chatService.sendMessage(this.currentChatId, text);
        } catch (error) {
            notificationSystem.error('Failed to send message');
            console.error('Send message error:', error);
        }
    }

    // Handle typing
    handleTyping() {
        if (!this.currentChatId) return;
        
        const isTyping = this.messageInput.value.trim().length > 0;
        realtimeService.sendTyping(this.currentChatId, isTyping);
    }

    // Show typing indicator
    showTypingIndicator(userId) {
        const user = authService.getUserById(userId);
        if (!user) return;
        
        this.typingUsers.add(userId);
        this.updateTypingIndicator();
    }

    // Hide typing indicator
    hideTypingIndicator(userId) {
        this.typingUsers.delete(userId);
        this.updateTypingIndicator();
    }

    // Update typing indicator
    updateTypingIndicator() {
        if (!this.typingIndicator) return;
        
        if (this.typingUsers.size > 0) {
            const userNames = Array.from(this.typingUsers).map(userId => {
                const user = authService.getUserById(userId);
                return user ? user.username : 'Someone';
            });
            
            const text = userNames.length === 1 ? 
                `${userNames[0]} is typing...` :
                `${userNames.join(', ')} are typing...`;
            
            this.typingIndicator.querySelector('#typingUser').textContent = text;
            this.typingIndicator.classList.remove('hidden');
        } else {
            this.typingIndicator.classList.add('hidden');
        }
    }

    // Scroll to bottom
    scrollToBottom() {
        if (this.messagesContainer) {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }
    }

    // Show chat view
    showChatView() {
        document.getElementById('welcomeView').classList.remove('active');
        document.getElementById('chatView').classList.add('active');
    }

    // Hide chat view
    hideChatView() {
        document.getElementById('chatView').classList.remove('active');
        document.getElementById
