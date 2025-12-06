// Chat List Component
class ChatList {
    constructor() {
        this.container = document.getElementById('chatList');
        this.searchInput = document.getElementById('searchInput');
        this.chats = [];
        this.filteredChats = [];
        this.init();
    }

    // Initialize chat list
    init() {
        this.setupSearch();
        this.setupEventListeners();
        this.loadChats();
    }

    // Setup search functionality
    setupSearch() {
        if (this.searchInput) {
            this.searchInput.addEventListener('input', 
                Helpers.debounce(() => this.handleSearch(), 300)
            );
        }
    }

    // Setup event listeners
    setupEventListeners() {
        // Listen for chat events
        Helpers.eventEmitter.on(EVENTS.CHAT_CREATED, () => this.loadChats());
        Helpers.eventEmitter.on(EVENTS.CHAT_UPDATED, () => this.loadChats());
        Helpers.eventEmitter.on(EVENTS.MESSAGE_SENT, () => this.loadChats());
        Helpers.eventEmitter.on(EVENTS.MESSAGE_RECEIVED, () => this.loadChats());
    }

    // Load chats
    loadChats() {
        this.chats = chatService.getChats();
        this.filteredChats = [...this.chats];
        this.render();
    }

    // Handle search
    handleSearch() {
        const query = this.searchInput.value.trim().toLowerCase();
        
        if (!query) {
            this.filteredChats = [...this.chats];
        } else {
            this.filteredChats = this.chats.filter(chat => {
                const currentUser = authService.getCurrentUser();
                const displayName = chat.getDisplayName(currentUser.id).toLowerCase();
                const lastMessage = chat.getPreview().toLowerCase();
                return displayName.includes(query) || lastMessage.includes(query);
            });
        }
        
        this.render();
    }

    // Render chat list
    render() {
        if (!this.container) return;
        
        this.container.innerHTML = '';
        
        if (this.filteredChats.length === 0) {
            this.renderEmptyState();
            return;
        }
        
        this.filteredChats.forEach(chat => {
            const chatElement = this.createChatElement(chat);
            this.container.appendChild(chatElement);
        });
    }

    // Render empty state
    renderEmptyState() {
        const emptyElement = document.createElement('div');
        emptyElement.className = 'chat-list-empty';
        emptyElement.innerHTML = `
            <div class="empty-icon">
                <i class="fas fa-comments"></i>
            </div>
            <div class="empty-text">
                <h3>No chats found</h3>
                <p>Start a new conversation to see it here</p>
            </div>
        `;
        emptyElement.style.cssText = `
            text-align: center;
            padding: 40px 20px;
            color: var(--text-muted);
        `;
        
        this.container.appendChild(emptyElement);
    }

    // Create chat element
    createChatElement(chat) {
        const currentUser = authService.getCurrentUser();
        const chatElement = document.createElement('div');
        chatElement.className = 'chat-item';
        chatElement.dataset.chatId = chat.id;
        
        // Get other user for direct chats
        let otherUser = null;
        if (chat.type === CHAT_TYPES.DIRECT) {
            const otherUserId = chat.participants.find(id => id !== currentUser.id);
            otherUser = authService.getUserById(otherUserId);
        }
        
        // Determine status
        let statusClass = 'offline';
        let statusText = 'offline';
        
        if (chat.type === CHAT_TYPES.DIRECT && otherUser) {
            if (otherUser.isOnline) {
                statusClass = 'online';
                statusText = 'online';
            } else {
                statusClass = 'offline';
                statusText = `last seen ${Helpers.getRelativeTime(otherUser.lastSeen)}`;
            }
        } else if (chat.type === CHAT_TYPES.GROUP) {
            statusClass = 'online';
            statusText = `${chat.participants.length} members`;
        }
        
        chatElement.innerHTML = `
            <div class="chat-avatar">
                <img src="${chat.avatar}" alt="${chat.getDisplayName(currentUser.id)}">
                <div class="status-indicator ${statusClass}"></div>
            </div>
            <div class="chat-info">
                <div class="chat-name">
                    <span class="name">${chat.getDisplayName(currentUser.id)}</span>
                    <span class="time">${chat.getTime()}</span>
                </div>
                <div class="chat-preview">
                    <span class="message">${chat.getPreview()}</span>
                    ${chat.unreadCount > 0 ? `<div class="unread-count">${chat.unreadCount}</div>` : ''}
                </div>
            </div>
        `;
        
        // Add click handler
        chatElement.addEventListener('click', () => {
            this.selectChat(chat.id);
        });
        
        return chatElement;
    }

    // Select chat
    selectChat(chatId) {
        // Remove active class from all chats
        document.querySelectorAll('.chat-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Add active class to selected chat
        const selectedChat = document.querySelector(`[data-chat-id="${chatId}"]`);
        if (selectedChat) {
            selectedChat.classList.add('active');
        }
        
        // Open chat
        window.chatWindow.openChat(chatId);
        
        // On mobile, hide sidebar
        if (window.innerWidth <= 768) {
            document.getElementById('sidebar').classList.add('hidden');
        }
    }

    // Update chat item
    updateChatItem(chatId) {
        const chatElement = document.querySelector(`[data-chat-id="${chatId}"]`);
        if (!chatElement) return;
        
        const chat = chatService.getChat(chatId);
        if (!chat) return;
        
        // Re-render the chat item
        const newChatElement = this.createChatElement(chat);
        chatElement.replaceWith(newChatElement);
        
        // Move to top if it's the most recent
        if (this.filteredChats[0]?.id === chatId) {
            this.container.insertBefore(newChatElement, this.container.firstChild);
        }
    }

    // Add new chat
    addChat(chat) {
        const chatElement = this.createChatElement(chat);
        this.container.insertBefore(chatElement, this.container.firstChild);
    }

    // Remove chat
    removeChat(chatId) {
        const chatElement = document.querySelector(`[data-chat-id="${chatId}"]`);
        if (chatElement) {
            chatElement.remove();
        }
    }

    // Update unread count
    updateUnreadCount(chatId, count) {
        const chatElement = document.querySelector(`[data-chat-id="${chatId}"]`);
        if (!chatElement) return;
        
        const unreadElement = chatElement.querySelector('.unread-count');
        if (unreadElement) {
            if (count > 0) {
                unreadElement.textContent = count;
                unreadElement.style.display = 'flex';
            } else {
                unreadElement.style.display = 'none';
            }
        } else if (count > 0) {
            const previewElement = chatElement.querySelector('.chat-preview');
            const unreadBadge = document.createElement('div');
            unreadBadge.className = 'unread-count';
            unreadBadge.textContent = count;
            previewElement.appendChild(unreadBadge);
        }
    }

    // Get selected chat
    getSelectedChat() {
        const activeChat = document.querySelector('.chat-item.active');
        return activeChat ? activeChat.dataset.chatId : null;
    }

    // Clear selection
    clearSelection() {
        document.querySelectorAll('.chat-item').forEach(item => {
            item.classList.remove('active');
        });
    }
}

// Export singleton instance
window.chatList = new ChatList();
