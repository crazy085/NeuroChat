// Main Application Module with Real Chat
class NeuroChat {
    constructor() {
        this.currentUser = null;
        this.currentChat = null;
        this.users = [];
        this.messages = {};
        this.socket = null;
        this.typingTimers = {};
        this.init();
    }

    init() {
        // Initialize neural background
        if (window.neuralBg) {
            neuralBg.init('neuralBg');
        }

        // App will be initialized after authentication
    }

    initWithAuth(token, user) {
        this.currentUser = user;
        this.socket = auth.initializeSocket();
        this.setupSocketListeners();
        this.loadUsers();
        this.updateProfileModal();
    }

    setupSocketListeners() {
        if (!this.socket) return;

        this.socket.on('receive-message', (message) => {
            this.handleIncomingMessage(message);
        });

        this.socket.on('user-typing', (data) => {
            this.handleUserTyping(data);
        });

        this.socket.on('user-online', (data) => {
            this.updateUserStatus(data.userId, true);
        });

        this.socket.on('user-offline', (data) => {
            this.updateUserStatus(data.userId, false);
        });

        this.socket.on('message-sent', (message) => {
            this.addMessageToChat(message);
        });
    }

    async loadUsers() {
        try {
            const response = await fetch('/api/users', {
                headers: auth.getAuthHeaders()
            });

            const data = await response.json();
            if (response.ok) {
                this.users = data.users;
                this.renderUserList();
            }
        } catch (error) {
            console.error('Load users error:', error);
        }
    }

    renderUserList(filter = 'all') {
        const chatList = document.getElementById('chatList');
        chatList.innerHTML = '';

        let filteredUsers = this.users;
        
        if (filter === 'online') {
            filteredUsers = this.users.filter(user => user.isOnline);
        }

        filteredUsers.forEach(user => {
            const userItem = document.createElement('div');
            userItem.className = `chat-item ${this.currentChat?.id === user._id ? 'active' : ''}`;
            userItem.onclick = () => this.selectUser(user);
            
            userItem.innerHTML = `
                <div class="chat-avatar">
                    <img src="${user.avatar}" alt="${user.username}">
                    ${user.isOnline ? '<div class="online-indicator"></div>' : ''}
                </div>
                <div class="chat-info">
                    <div class="chat-name">
                        ${user.username}
                        ${this.typingTimers[user._id] ? `
                            <span class="typing-indicator">
                                <span class="typing-dot"></span>
                                <span class="typing-dot"></span>
                                <span class="typing-dot"></span>
                            </span>
                        ` : ''}
                    </div>
                    <div class="chat-message">
                        ${user.status || 'Active'}
                    </div>
                </div>
                <div class="chat-meta">
                    <div class="chat-time">${user.isOnline ? 'Online' : 'Offline'}</div>
                </div>
            `;
            
            chatList.appendChild(userItem);
        });
    }

    async selectUser(user) {
        this.currentChat = user;
        
        document.getElementById('welcomeScreen').style.display = 'none';
        document.getElementById('chatArea').classList.add('active');
        
        document.getElementById('currentChatName').textContent = user.username;
        document.getElementById('currentChatAvatar').src = user.avatar;
        document.getElementById('onlineIndicator').style.display = user.isOnline ? 'block' : 'none';
        document.getElementById('currentChatStatus').textContent = user.status || 'Active';
        
        await this.loadMessages(user._id);
        this.renderUserList();
    }

    async loadMessages(userId) {
        try {
            const response = await fetch(`/api/messages/${userId}`, {
                headers: auth.getAuthHeaders()
            });

            const data = await response.json();
            if (response.ok) {
                this.messages[userId] = data.messages;
                this.renderMessages();
            }
        } catch (error) {
            console.error('Load messages error:', error);
        }
    }

    renderMessages() {
        const container = document.getElementById('messagesContainer');
        container.innerHTML = '';
        
        const messages = this.messages[this.currentChat._id] || [];
        
        messages.forEach(message => {
            const messageDiv = document.createElement('div');
            const isSent = message.sender._id === this.currentUser.id;
            messageDiv.className = `message ${isSent ? 'sent' : 'received'}`;
            
            messageDiv.innerHTML = `
                <div class="message-content">
                    <div class="message-text">${message.content}</div>
                    <div class="message-time">
                        ${new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        ${isSent ? `
                            <span class="message-status">
                                ${message.isRead ? '✓✓' : '✓'}
                            </span>
                        ` : ''}
                    </div>
                </div>
            `;
            
            container.appendChild(messageDiv);
        });
        
        container.scrollTop = container.scrollHeight;
    }

    sendMessage() {
        const text = ui.getInputValue();
        
        if (!text || !this.currentChat || !this.socket) return;
        
        this.socket.emit('send-message', {
            receiverId: this.currentChat._id,
            content: text,
            messageType: 'text'
        });
        
        ui.clearInput();
    }

    handleIncomingMessage(message) {
        const senderId = message.sender._id;
        
        if (!this.messages[senderId]) {
            this.messages[senderId] = [];
        }
        
        this.messages[senderId].push(message);
        
        if (this.currentChat && this.currentChat._id === senderId) {
            this.renderMessages();
        } else {
            // Show notification for new message
            ui.showToast(`New message from ${message.sender.username}`);
        }
    }

    handleUserTyping(data) {
        const { userId, isTyping } = data;
        
        if (isTyping) {
            this.typingTimers[userId] = true;
            clearTimeout(this.typingTimers[`${userId}_timeout`]);
            
            this.typingTimers[`${userId}_timeout`] = setTimeout(() => {
                delete this.typingTimers[userId];
                this.renderUserList();
            }, 3000);
        } else {
            delete this.typingTimers[userId];
        }
        
        this.renderUserList();
    }

    updateUserStatus(userId, isOnline) {
        const user = this.users.find(u => u._id === userId);
        if (user) {
            user.isOnline = isOnline;
            this.renderUserList();
        }
    }

    addMessageToChat(message) {
        const receiverId = message.receiver._id;
        
        if (!this.messages[receiverId]) {
            this.messages[receiverId] = [];
        }
        
        this.messages[receiverId].push(message);
        
        if (this.currentChat && this.currentChat._id === receiverId) {
            this.renderMessages();
        }
    }

    searchUsers() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const filteredUsers = this.users.filter(user => 
            user.username.toLowerCase().includes(searchTerm)
        );
        
        const chatList = document.getElementById('chatList');
        chatList.innerHTML = '';
        
        filteredUsers.forEach(user => {
            const userItem = document.createElement('div');
            userItem.className = `chat-item ${this.currentChat?._id === user._id ? 'active' : ''}`;
            userItem.onclick = () => this.selectUser(user);
            
            userItem.innerHTML = `
                <div class="chat-avatar">
                    <img src="${user.avatar}" alt="${user.username}">
                    ${user.isOnline ? '<div class="online-indicator"></div>' : ''}
                </div>
                <div class="chat-info">
                    <div class="chat-name">${user.username}</div>
                    <div class="chat-message">${user.status || 'Active'}</div>
                </div>
                <div class="chat-meta">
                    <div class="chat-time">${user.isOnline ? 'Online' : 'Offline'}</div>
                </div>
            `;
            
            chatList.appendChild(userItem);
        });
    }

    filterUsers(category) {
        // Update active category button
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        
        this.renderUserList(category);
    }

    updateProfileModal() {
        if (this.currentUser) {
            document.getElementById('profileUsername').value = this.currentUser.username;
            document.getElementById('profileEmail').value = this.currentUser.email;
            document.getElementById('profileStatus').value = this.currentUser.status || '';
            document.getElementById('profileAbout').value = this.currentUser.about || '';
        }
    }

    handleTyping() {
        if (!this.currentChat || !this.socket) return;
        
        this.socket.emit('typing', {
            receiverId: this.currentChat._id,
            isTyping: true
        });
        
        clearTimeout(this.typingTimeout);
        this.typingTimeout = setTimeout(() => {
            this.socket.emit('typing', {
                receiverId: this.currentChat._id,
                isTyping: false
            });
        }, 1000);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new NeuroChat();
});

// Global functions for HTML event handlers
window.sendMessage = () => app.sendMessage();
window.handleKeyPress = (event) => {
    if (event.key === 'Enter') {
        app.sendMessage();
    } else {
        app.handleTyping();
    }
};
window.searchUsers = () => app.searchUsers();
window.filterUsers = (category) => app.filterUsers(category);
window.toggleProfileModal = () => {
    ui.toggleModal(ui.elements.profileModal);
    app.updateProfileModal();
};
window.toggleEmojiPicker = () => ui.toggleEmojiPicker();
window.insertEmoji = (emoji) => ui.insertEmoji(emoji);
window.attachFile = () => ui.showToast('File transfer coming soon!');
window.toggleVideoCall = () => ui.showToast('Video call coming soon!');
window.toggleVoiceCall = () => ui.showToast('Voice call coming soon!');
window.toggleChatInfo = () => ui.showToast('Chat info coming soon!');
