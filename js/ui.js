// UI Management Module
class UIManager {
    constructor() {
        this.elements = {};
        this.initElements();
        this.initEventListeners();
    }

    initElements() {
        // Cache DOM elements
        this.elements = {
            sidebar: document.getElementById('sidebar'),
            chatList: document.getElementById('chatList'),
            messagesContainer: document.getElementById('messagesContainer'),
            messageInput: document.getElementById('messageInput'),
            searchInput: document.getElementById('searchInput'),
            welcomeScreen: document.getElementById('welcomeScreen'),
            chatArea: document.getElementById('chatArea'),
            profileModal: document.getElementById('profileModal'),
            emojiPicker: document.getElementById('emojiPicker'),
            toast: document.getElementById('toast'),
            currentChatName: document.getElementById('currentChatName'),
            currentChatAvatar: document.getElementById('currentChatAvatar'),
            currentChatStatus: document.getElementById('currentChatStatus'),
            onlineIndicator: document.getElementById('onlineIndicator'),
            toastMessage: document.getElementById('toastMessage')
        };
    }

    initEventListeners() {
        // Close emoji picker when clicking outside
        document.addEventListener('click', (e) => {
            const emojiPicker = this.elements.emojiPicker;
            const emojiButton = e.target.closest('.fa-smile');
            
            if (!emojiPicker.contains(e.target) && !emojiButton) {
                emojiPicker.classList.remove('show');
            }
        });

        // Close modal when clicking outside
        document.addEventListener('click', (e) => {
            const modal = this.elements.profileModal;
            const modalContent = e.target.closest('.modal-content');
            const profileButton = e.target.closest('.fa-user-circle');
            
            if (e.target === modal && !modalContent && !profileButton) {
                modal.classList.remove('show');
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 'k':
                        e.preventDefault();
                        this.elements.searchInput.focus();
                        break;
                    case 'n':
                        e.preventDefault();
                        window.createNewChat();
                        break;
                    case ',':
                        e.preventDefault();
                        window.toggleProfileModal();
                        break;
                }
            }
        });
    }

    showToast(message, duration = 3000) {
        this.elements.toastMessage.textContent = message;
        this.elements.toast.classList.add('show');
        
        setTimeout(() => {
            this.elements.toast.classList.remove('show');
        }, duration);
    }

    toggleModal(modal) {
        modal.classList.toggle('show');
    }

    toggleEmojiPicker() {
        this.elements.emojiPicker.classList.toggle('show');
    }

    insertEmoji(emoji) {
        this.elements.messageInput.value += emoji;
        this.elements.messageInput.focus();
        this.toggleEmojiPicker();
    }

    updateChatHeader(chat) {
        this.elements.currentChatName.textContent = chat.name;
        this.elements.currentChatAvatar.src = `https://picsum.photos/seed/${chat.avatar}/60/60`;
        this.elements.onlineIndicator.style.display = chat.online ? 'block' : 'none';
        this.elements.currentChatStatus.textContent = chat.online ? 'Active Connection' : 'Offline';
    }

    showChatArea() {
        this.elements.welcomeScreen.style.display = 'none';
        this.elements.chatArea.classList.add('active');
    }

    hideChatArea() {
        this.elements.welcomeScreen.style.display = 'flex';
        this.elements.chatArea.classList.remove('active');
    }

    scrollToBottom() {
        this.elements.messagesContainer.scrollTop = this.elements.messagesContainer.scrollHeight;
    }

    clearInput() {
        this.elements.messageInput.value = '';
    }

    getInputValue() {
        return this.elements.messageInput.value.trim();
    }

    focusInput() {
        this.elements.messageInput.focus();
    }

    renderChatList(chats, currentChatId) {
        this.elements.chatList.innerHTML = '';
        
        chats.forEach(chat => {
            const chatItem = document.createElement('div');
            chatItem.className = `chat-item ${currentChatId === chat.id ? 'active' : ''}`;
            chatItem.onclick = () => window.selectChat(chat);
            
            chatItem.innerHTML = `
                <div class="chat-avatar">
                    <img src="https://picsum.photos/seed/${chat.avatar}/60/60" alt="${chat.name}">
                    ${chat.online ? '<div class="online-indicator"></div>' : ''}
                </div>
                <div class="chat-info">
                    <div class="chat-name">
                        ${chat.name}
                        ${chat.typing ? `
                            <span class="typing-indicator">
                                <span class="typing-dot"></span>
                                <span class="typing-dot"></span>
                                <span class="typing-dot"></span>
                            </span>
                        ` : ''}
                    </div>
                    <div class="chat-message">
                        ${chat.typing ? 'Transmitting...' : chat.lastMessage}
                    </div>
                </div>
                <div class="chat-meta">
                    <div class="chat-time">${chat.time}</div>
                    ${chat.unread > 0 ? `<div class="unread-badge">${chat.unread}</div>` : ''}
                </div>
            `;
            
            this.elements.chatList.appendChild(chatItem);
        });
    }

    renderMessages(messages) {
        this.elements.messagesContainer.innerHTML = '';
        
        messages.forEach(message => {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${message.sent ? 'sent' : 'received'}`;
            
            messageDiv.innerHTML = `
                <div class="message-content">
                    <div class="message-text">${message.text}</div>
                    <div class="message-time">
                        ${message.time}
                        ${message.sent ? `
                            <span class="message-status">
                                ${message.status === 'read' ? '✓✓' : message.status === 'delivered' ? '✓' : '⏳'}
                            </span>
                        ` : ''}
                    </div>
                </div>
            `;
            
            this.elements.messagesContainer.appendChild(messageDiv);
        });
        
        this.scrollToBottom();
    }

    updateProfileModal(profile) {
        document.getElementById('profileName').value = profile.name;
        document.getElementById('profileStatus').value = profile.status;
        document.getElementById('profileAbout').value = profile.about;
    }
}

// Initialize UI Manager
window.ui = new UIManager();
