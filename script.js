/**
 * Neurochat Hybrid Application
 * Real-time Socket.io + Local AI Simulation
 */
const app = {
    state: {
        currentUser: 'Guest',
        activeChatId: null,
        socket: null,
        isSocketConnected: false,
        isMobile: window.innerWidth <= 768,
        contacts: [
            {
                id: 1,
                name: "Sarah Connor",
                avatar: "https://picsum.photos/seed/sarah/80/80",
                status: "online",
                messages: [],
                unread: 0,
                type: "human" // Real-time only
            },
            {
                id: 2,
                name: "Dr. Freeman",
                avatar: "https://picsum.photos/seed/freeman/80/80",
                status: "busy",
                messages: [],
                unread: 0,
                type: "human"
            },
            {
                id: 3,
                name: "Neural Core AI",
                avatar: "https://picsum.photos/seed/ai/80/80",
                status: "online",
                messages: [],
                unread: 0,
                type: "ai" // Uses local bot simulation
            },
            {
                id: 4,
                name: "Design Team",
                avatar: "https://picsum.photos/seed/design/80/80",
                status: "offline",
                messages: [],
                unread: 0,
                type: "human"
            },
            {
                id: 5,
                name: "Mom",
                avatar: "https://picsum.photos/seed/mom/80/80",
                status: "online",
                messages: [],
                unread: 0,
                type: "human"
            }
        ],
        botResponses: [
            "Processing your request...",
            "My neural pathways are aligned with that statement.",
            "Data analyzed. Result positive.",
            "Can you clarify the parameters?",
            "I am updating my core database.",
            "Connection stable. Go ahead.",
            "That is fascinating data.",
            "Executing protocol..."
        ]
    },

    init() {
        this.cacheDOM();
        this.bindEvents();
        this.renderContactList();
        this.setupCanvas();

        window.addEventListener('resize', () => {
            this.state.isMobile = window.innerWidth <= 768;
            this.handleResize();
        });

        // Wait for Socket.io library to load, then connect
        this.waitForSocket();
    },

    waitForSocket() {
        const checkInterval = setInterval(() => {
            if (typeof io !== 'undefined') {
                clearInterval(checkInterval);
                this.initSocket();
            } else {
                console.log("Waiting for Socket.io library...");
            }
        }, 100);
    },

    initSocket() {
        try {
            this.state.socket = io();

            this.state.socket.on('connect', () => {
                this.state.isSocketConnected = true;
                this.updateConnectionStatus('Online', 'online');
                console.log("Connected to Neural Network");
            });

            this.state.socket.on('disconnect', () => {
                this.state.isSocketConnected = false;
                this.updateConnectionStatus('Offline', 'offline');
                console.log("Disconnected from Neural Network");
            });

            this.state.socket.on('receive_message', (data) => {
                // Render message if we are in the chat
                // We assume data contains: { text, sender, time }
                // Note: In a robust app, we'd include roomId in data to double-check
                
                if (this.state.activeChatId) {
                    // We render it directly
                    this.appendMessageToUI(data.text, data.sender, data.time);
                    
                    // If it's not me, and it's for this chat, play sound or notify
                    if (data.sender !== this.state.currentUser) {
                        // Logic handled in appendMessageToUI
                    }
                }
            });

            this.state.socket.on('load_history', (history) => {
                const contact = this.state.contacts.find(c => c.id === this.state.activeChatId);
                if (contact && contact.type !== 'ai') { // AI doesn't use socket history
                    contact.messages = history;
                    this.renderMessages();
                    this.renderContactList();
                }
            });

        } catch (e) {
            console.error("Socket initialization failed:", e);
            this.updateConnectionStatus('Connection Error', 'offline');
        }
    },

    updateConnectionStatus(text, statusClass) {
        const el = document.getElementById('connection-status');
        if (el) {
            el.textContent = text;
            el.className = `status-text ${statusClass}`;
        }
    },

    cacheDOM() {
        this.dom = {
            authScreen: document.getElementById('auth-screen'),
            usernameInput: document.getElementById('username-input'),
            loginBtn: document.getElementById('login-btn'),
            loginError: document.getElementById('login-error'),
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
        // Login Inputs - Allow Enter Key
        this.dom.usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.login();
        });

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
            this.showToast(`Welcome back, ${username}.`, 'success');
        } else {
            this.dom.loginError.textContent = "Please enter a valid username.";
            this.dom.usernameInput.focus();
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

        // Logic: Socket vs Local
        if (contact.type === 'human' && this.state.isSocketConnected) {
            // Join room on server
            this.state.socket.emit('join', {
                username: this.state.currentUser,
                chatId: id
            });
            // Clear local display, wait for history
            this.dom.messagesContainer.innerHTML = ''; 
        } else {
            // AI or Offline Mode
            this.renderMessages();
        }

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
        const contact = this.state.contacts.find(c => c.id === this.state.activeChatId);
        if (!contact) return;

        this.dom.messagesContainer.innerHTML = '';

        const dateDiv = document.createElement('div');
        dateDiv.style.textAlign = 'center';
        dateDiv.style.color = 'var(--text-secondary)';
        dateDiv.style.fontSize = '0.75rem';
        dateDiv.style.margin = '10px 0';
        dateDiv.innerText = contact.type === 'ai' ? 'Connected to Neural Core' : 'Today';
        this.dom.messagesContainer.appendChild(dateDiv);

        contact.messages.forEach(msg => {
            this.appendMessageToUI(msg.text, msg.sender, msg.time, false);
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

        // Update local state
        const contact = this.state.contacts.find(c => c.id === this.state.activeChatId);
        if(contact) {
            // Prevent duplicates
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

        const contact = this.state.contacts.find(c => c.id === this.state.activeChatId);
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // 1. Handle Human Chat (Socket)
        if (contact.type === 'human') {
            if (this.state.isSocketConnected) {
                this.state.socket.emit('send_message', {
                    chatId: this.state.activeChatId,
                    text: text,
                    sender: this.state.currentUser
                });
            } else {
                // Fallback if socket fails (visual only)
                this.appendMessageToUI(text, this.state.currentUser, timeString);
                this.showToast("Server offline. Message not sent.", "error");
            }
        } 
        // 2. Handle AI Chat (Local Simulation)
        else {
            this.appendMessageToUI(text, this.state.currentUser, timeString);
            this.simulateAiReply();
        }

        this.dom.messageInput.value = '';
    },

    simulateAiReply() {
        this.dom.typingIndicator.style.display = 'flex';
        this.scrollToBottom();

        const delay = Math.floor(Math.random() * 1500) + 500;

        setTimeout(() => {
            this.dom.typingIndicator.style.display = 'none';
            
            const now = new Date();
            const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const randomResponse = this.state.botResponses[Math.floor(Math.random() * this.state.botResponses.length)];

            this.appendMessageToUI(randomResponse, 'Neural Core AI', timeString);
        }, delay);
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
        if (type === 'error') {
            toast.style.borderLeftColor = 'var(--danger)';
        }
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
