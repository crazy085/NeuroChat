/**
 * Neurochat Real-time Application Logic
 */
const app = {
    state: {
        currentUser: 'Guest',
        activeChatId: null,
        socket: null, // Socket.io instance
        isMobile: window.innerWidth <= 768,
        contacts: [
            {
                id: 1,
                name: "Sarah Connor",
                avatar: "https://picsum.photos/seed/sarah/80/80",
                status: "online",
                messages: [], // Will be populated by socket history
                unread: 0
            },
            {
                id: 2,
                name: "Dr. Freeman",
                avatar: "https://picsum.photos/seed/freeman/80/80",
                status: "busy",
                messages: [],
                unread: 0
            },
            {
                id: 3,
                name: "Neural Core AI",
                avatar: "https://picsum.photos/seed/ai/80/80",
                status: "online",
                messages: [],
                unread: 0
            },
            {
                id: 4,
                name: "Design Team",
                avatar: "https://picsum.photos/seed/design/80/80",
                status: "offline",
                messages: [],
                unread: 0
            },
            {
                id: 5,
                name: "Mom",
                avatar: "https://picsum.photos/seed/mom/80/80",
                status: "online",
                messages: [],
                unread: 0
            }
        ]
    },

    init() {
        this.cacheDOM();
        this.bindEvents();
        this.renderContactList();
        this.setupCanvas();

        // Initialize Socket
        this.initSocket();

        window.addEventListener('resize', () => {
            this.state.isMobile = window.innerWidth <= 768;
            this.handleResize();
        });
    },

    initSocket() {
        // Connect to the same host
        this.state.socket = io();

        // Listen for incoming messages
        this.state.socket.on('receive_message', (data) => {
            // If the message is for the currently open chat, render it
            if (this.state.activeChatId === data.roomId) { // Note: server sends room context implicitly or we match ID
                // In our simple setup, we know which room we are in via activeChatId
                // But to be safe, we can assume the room matches the active chat if we joined it.
                // For this specific implementation, let's append directly:
                this.appendMessageToUI(data.text, data.sender, data.time);
            } else {
                // If it's for a chat not currently open, increment unread
                const contact = this.state.contacts.find(c => c.id == data.roomId); // Assuming roomId maps to contact ID
                if(contact) {
                    contact.unread++;
                    this.showToast(`New message from ${contact.name}`);
                    this.renderContactList(this.dom.searchInput.value);
                }
            }
        });

        // Listen for chat history when joining a room
        this.state.socket.on('load_history', (history) => {
            const contact = this.state.contacts.find(c => c.id === this.state.activeChatId);
            if (contact) {
                contact.messages = history;
                this.renderMessages();
                this.renderContactList(); // Update preview text
            }
        });
    },

    cacheDOM() {
        this.dom = {
            authScreen: document.getElementById('auth-screen'),
            usernameInput: document.getElementById('username-input'),
            loginBtn: document.getElementById('login-btn'),
            currentUserDisplay: document.getElementById('current-user-name'),
            sidebar: document.getElementById('sidebar'),
            chatList: document.getElementById('chat-list'),
            chatArea: document.getElementById('chat-area'),
            emptyState: document.getElementById('empty-state'),
            activeChatView: document.getElementById('active-chat-view'),
            activeAvatar: document.getElementById('active-avatar'),
            activeName: document.getElementById('active-name'),
            activeStatus: document.getElementById('active-status'),
            messagesContainer: document.getElementById('messages-container'),
            messageInput: document.getElementById('message-input'),
            sendBtn: document.getElementById('send-btn'),
            searchInput: document.getElementById('search-input'),
            typingIndicator: document.getElementById('typing-indicator'),
            toastContainer: document.getElementById('toast-container'),
            backBtn: document.getElementById('back-btn')
        };
    },

    bindEvents() {
        this.dom.loginBtn.addEventListener('click', () => this.login());
        this.dom.sendBtn.addEventListener('click', () => this.sendMessage());
        this.dom.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
        this.dom.searchInput.addEventListener('input', (e) => this.filterContacts(e.target.value));
        this.dom.backBtn.addEventListener('click', () => this.closeChat());
    },

    login() {
        const username = this.dom.usernameInput.value.trim();
        if (username) {
            this.state.currentUser = username;
            this.dom.currentUserDisplay.textContent = username;
            this.dom.authScreen.classList.add('hidden');
            
            // Join a general connection (Optional)
            // We join specific rooms in openChat()
            
            this.showToast(`Welcome back, ${username}.`, 'success');
        } else {
            this.showToast('Please enter a username.', 'error');
        }
    },

    renderContactList(filterText = '') {
        this.dom.chatList.innerHTML = '';
        
        const filtered = this.state.contacts.filter(c => 
            c.name.toLowerCase().includes(filterText.toLowerCase())
        );

        filtered.forEach(contact => {
            const lastMsg = contact.messages.length > 0 
                ? contact.messages[contact.messages.length - 1].text 
                : "No messages yet";
            
            const time = contact.messages.length > 0 
                ? contact.messages[contact.messages.length - 1].time 
                : "";

            const item = document.createElement('div');
            item.className = `chat-item ${this.state.activeChatId === contact.id ? 'active' : ''}`;
            item.onclick = () => this.openChat(contact.id);
            
            let unreadHTML = contact.unread > 0 
                ? `<span class="unread-badge">${contact.unread}</span>` 
                : '';

            item.innerHTML = `
                <img src="${contact.avatar}" class="avatar">
                <div class="chat-info">
                    <div class="chat-header-row">
                        <span class="chat-name">${contact.name}</span>
                        <span class="chat-time">${time}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span class="chat-preview">${lastMsg}</span>
                        ${unreadHTML}
                    </div>
                </div>
            `;
            this.dom.chatList.appendChild(item);
        });
    },

    openChat(id) {
        const contact = this.state.contacts.find(c => c.id === id);
        if (!contact) return;

        this.state.activeChatId = id;
        contact.unread = 0; 
        
        // UI Updates
        this.dom.emptyState.classList.add('hidden-view');
        this.dom.activeChatView.classList.remove('hidden-view');
        this.dom.activeChatView.classList.add('height-100');
        
        this.dom.activeName.textContent = contact.name;
        this.dom.activeAvatar.src = contact.avatar;
        this.dom.activeStatus.textContent = contact.status === 'online' ? 'Online' : 'Last seen recently';
        this.dom.activeStatus.className = `status-text ${contact.status}`;

        // SOCKET: Join the room for this chat
        if(this.state.socket) {
            this.state.socket.emit('join', {
                username: this.state.currentUser,
                chatId: id
            });
        }

        // The messages will be populated by the 'load_history' event
        // But we clear the view immediately for responsiveness
        this.dom.messagesContainer.innerHTML = '';
        const dateDiv = document.createElement('div');
        dateDiv.style.textAlign = 'center';
        dateDiv.style.color = 'var(--text-secondary)';
        dateDiv.style.fontSize = '0.75rem';
        dateDiv.style.margin = '10px 0';
        dateDiv.innerText = 'Connected to Neural Network';
        this.dom.messagesContainer.appendChild(dateDiv);

        this.renderContactList(this.dom.searchInput.value);

        // Mobile Transitions
        if (this.state.isMobile) {
            this.dom.sidebar.classList.add('hidden-mobile');
            this.dom.chatArea.classList.add('active-mobile');
        }

        setTimeout(() => this.dom.messageInput.focus(), 100);
    },

    closeChat() {
        if (this.state.isMobile) {
            this.dom.chatArea.classList.remove('active-mobile');
            this.dom.sidebar.classList.remove('hidden-mobile');
            this.state.activeChatId = null;
            setTimeout(() => this.renderContactList(), 300);
        }
    },

    renderMessages() {
        // This is now primarily called after history loads
        const contact = this.state.contacts.find(c => c.id === this.state.activeChatId);
        if (!contact) return;

        // Clear current except the "Connected" message (optional, simpler to just clear all)
        this.dom.messagesContainer.innerHTML = '';

        // Re-add date header
        const dateDiv = document.createElement('div');
        dateDiv.style.textAlign = 'center';
        dateDiv.style.color = 'var(--text-secondary)';
        dateDiv.style.fontSize = '0.75rem';
        dateDiv.style.margin = '10px 0';
        dateDiv.innerText = 'Today';
        this.dom.messagesContainer.appendChild(dateDiv);

        contact.messages.forEach(msg => {
            this.appendMessageToUI(msg.text, msg.sender, msg.time, false); // false = no scroll (we do it once at end)
        });

        this.scrollToBottom();
    },

    appendMessageToUI(text, sender, time, autoScroll = true) {
        const div = document.createElement('div');
        const isMe = sender === this.state.currentUser;
        
        div.className = `message ${isMe ? 'sent' : 'received'}`;
        div.innerHTML = `
            ${text}
            <div class="message-meta">
                ${time}
                ${isMe ? '<i class="fa-solid fa-check-double"></i>' : ''}
            </div>
        `;
        this.dom.messagesContainer.appendChild(div);
        if (autoScroll) this.scrollToBottom();

        // Also update local state to keep it in sync
        const contact = this.state.contacts.find(c => c.id === this.state.activeChatId);
        if(contact) {
            // Avoid duplicates if this was triggered by my own send
            const exists = contact.messages.find(m => m.time === time && m.text === text);
            if(!exists) {
                contact.messages.push({ text, sender, time });
                this.renderContactList(this.dom.searchInput.value);
            }
        }
    },

    sendMessage() {
        const text = this.dom.messageInput.value.trim();
        if (!text || !this.state.activeChatId) return;

        // SOCKET: Emit message to server
        if(this.state.socket) {
            this.state.socket.emit('send_message', {
                chatId: this.state.activeChatId,
                text: text,
                sender: this.state.currentUser
            });
        }

        this.dom.messageInput.value = '';
        // No need to manually call renderMessages here, 
        // the server will broadcast back to us (and everyone else)
    },

    scrollToBottom() {
        this.dom.messagesContainer.scrollTop = this.dom.messagesContainer.scrollHeight;
    },

    filterContacts(text) {
        this.renderContactList(text);
    },

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = 'toast';
        const icon = type === 'success' ? 'fa-check-circle' : 'fa-info-circle';
        toast.innerHTML = `<i class="fa-solid ${icon}"></i> ${message}`;
        
        this.dom.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },
    
    handleResize() {
        if (!this.state.isMobile) {
            this.dom.sidebar.classList.remove('hidden-mobile');
            this.dom.chatArea.classList.remove('active-mobile');
        } else {
            if (this.state.activeChatId) {
                this.dom.sidebar.classList.add('hidden-mobile');
                this.dom.chatArea.classList.add('active-mobile');
            } else {
                this.dom.sidebar.classList.remove('hidden-mobile');
                this.dom.chatArea.classList.remove('active-mobile');
            }
        }
    },

    setupCanvas() {
        // ... (Keep existing canvas code exactly as is) ...
        const canvas = document.getElementById('neural-canvas');
        const ctx = canvas.getContext('2d');
        let width, height;
        let particles = [];

        function resize() {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        }
        
        window.addEventListener('resize', resize);
        resize();

        class Particle {
            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.vx = (Math.random() - 0.5) * 0.5;
                this.vy = (Math.random() - 0.5) * 0.5;
                this.size = Math.random() * 2 + 1;
            }
            update() {
                this.x += this.vx;
                this.y += this.vy;
                if (this.x < 0 || this.x > width) this.vx *= -1;
                if (this.y < 0 || this.y > height) this.vy *= -1;
            }
            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(0, 206, 201, 0.5)';
                ctx.fill();
            }
        }

        for (let i = 0; i < 60; i++) {
            particles.push(new Particle());
        }

        function animate() {
            ctx.clearRect(0, 0, width, height);
            
            particles.forEach((p, index) => {
                p.update();
                p.draw();
                
                for (let j = index + 1; j < particles.length; j++) {
                    const p2 = particles[j];
                    const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
                    if (dist < 150) {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(108, 92, 231, ${1 - dist/150})`;
                        ctx.lineWidth = 0.5;
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                    }
                }
            });
            requestAnimationFrame(animate);
        }
        animate();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
