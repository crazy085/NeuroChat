/**
 * Neurochat Application Logic
 * Real Auth + Real-time Socket.io
 */
const app = {
    state: {
        currentUser: null, // null until logged in
        authToken: null,   // (Optional, for future expansion)
        activeChatId: null,
        socket: null,
        authMode: 'login', // 'login' or 'register'
        isMobile: window.innerWidth <= 768,
        contacts: [
            {
                id: 1,
                name: "Global Room",
                avatar: "https://picsum.photos/seed/global/80/80",
                status: "online",
                messages: [], // Clean slate
                unread: 0
            },
            {
                id: 2,
                name: "Neural Core AI",
                avatar: "https://picsum.photos/seed/ai/80/80",
                status: "online",
                messages: [],
                unread: 0,
                isAI: true // Flag for local simulation
            },
            {
                id: 3,
                name: "Tech Support",
                avatar: "https://picsum.photos/seed/tech/80/80",
                status: "online",
                messages: [],
                unread: 0
            }
        ],
        botResponses: [
            "Systems nominal.",
            "Analyzing input...",
            "I can help you with that.",
            "Data received.",
            "Connection secure.",
            "Executing query."
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

        // Wait for DOM fully ready
    },

    // --- Auth Logic ---

    switchAuthMode(mode) {
        this.state.authMode = mode;
        const loginTab = document.getElementById('tab-login');
        const registerTab = document.getElementById('tab-register');
        const btn = document.getElementById('auth-btn');
        const msg = document.getElementById('auth-message');

        msg.textContent = "";
        msg.style.color = "var(--text-secondary)";

        if (mode === 'login') {
            loginTab.classList.add('active');
            registerTab.classList.remove('active');
            btn.textContent = "Login";
        } else {
            registerTab.classList.add('active');
            loginTab.classList.remove('active');
            btn.textContent = "Create Account";
        }
    },

    handleAuth() {
        const username = this.dom.usernameInput.value.trim();
        const password = this.dom.passwordInput.value.trim();
        const msg = document.getElementById('auth-message');

        if (!username || !password) {
            msg.textContent = "Please fill in all fields";
            msg.style.color = "var(--danger)";
            return;
        }

        const url = this.state.authMode === 'register' ? '/register' : '/login';
        const btn = document.getElementById('auth-btn');
        const originalText = btn.textContent;

        btn.textContent = "Processing...";
        btn.disabled = true;

        fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        })
        .then(res => res.json())
        .then(data => {
            btn.textContent = originalText;
            btn.disabled = false;

            if (data.success) {
                // Successful Auth
                this.state.currentUser = data.username;
                this.dom.currentUserDisplay.textContent = data.username;
                this.dom.authScreen.classList.add('hidden');
                this.showToast(`Welcome, ${data.username}.`, 'success');
                
                // Initialize Socket connection AFTER login
                this.initSocket();
            } else {
                // Error
                msg.textContent = data.message;
                msg.style.color = "var(--danger)";
            }
        })
        .catch(err => {
            console.error(err);
            btn.textContent = originalText;
            btn.disabled = false;
            msg.textContent = "Server error. Try again later.";
            msg.style.color = "var(--danger)";
        });
    },

    // --- Socket Logic ---

    initSocket() {
        if (typeof io === 'undefined') {
            console.error("Socket.io library not loaded");
            return;
        }

        this.state.socket = io();

        this.state.socket.on('connect', () => {
            console.log("Socket connected");
        });

        this.state.socket.on('receive_message', (data) => {
            // If message belongs to active chat, render it
            if (this.state.activeChatId) {
                this.appendMessageToUI(data.text, data.sender, data.time);
            } else {
                // Logic to increment unread if chat is not active
                const contact = this.state.contacts.find(c => c.id == data.roomId); 
                // Note: Simple logic assumes roomId matches Contact ID for human chats
                if(contact) {
                    contact.unread++;
                    this.renderContactList(this.dom.searchInput.value);
                }
            }
        });

        this.state.socket.on('load_history', (history) => {
            const contact = this.state.contacts.find(c => c.id === this.state.activeChatId);
            if (contact) {
                contact.messages = history;
                this.renderMessages();
                this.renderContactList();
            }
        });
    },

    // --- UI Logic ---

    cacheDOM() {
        this.dom = {
            authScreen: document.getElementById('auth-screen'),
            usernameInput: document.getElementById('username-input'),
            passwordInput: document.getElementById('password-input'),
            authBtn: document.getElementById('auth-btn'),
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
        this.dom.authBtn.addEventListener('click', () => this.handleAuth());
        
        // Enter key for inputs
        this.dom.usernameInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') this.dom.passwordInput.focus(); });
        this.dom.passwordInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') this.handleAuth(); });

        this.dom.sendBtn.addEventListener('click', () => this.sendMessage());
        this.dom.messageInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') this.sendMessage(); });
        this.dom.searchInput.addEventListener('input', (e) => this.filterContacts(e.target.value));
        this.dom.backBtn.addEventListener('click', () => this.closeChat());
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
            
            let unreadHTML = contact.unread > 0 ? `<span class="unread-badge">${contact.unread}</span>` : '';

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

        // Logic: Join Room (Socket) OR AI
        if (!contact.isAI && this.state.socket) {
            this.state.socket.emit('join', {
                username: this.state.currentUser,
                chatId: id
            });
            // Clear UI, wait for history
            this.dom.messagesContainer.innerHTML = ''; 
        } else {
            // AI Mode
            this.renderMessages();
        }

        this.renderContactList(this.dom.searchInput.value);

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
        dateDiv.innerText = 'Today';
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

        const contact = this.state.contacts.find(c => c.id === this.state.activeChatId);
        if(contact) {
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

        // AI Logic (Local)
        if (contact.isAI) {
            this.appendMessageToUI(text, this.state.currentUser, timeString);
            this.simulateAiReply();
        } 
        // Human Logic (Socket)
        else if (this.state.socket) {
            this.state.socket.emit('send_message', {
                chatId: this.state.activeChatId,
                text: text,
                sender: this.state.currentUser
            });
        }

        this.dom.messageInput.value = '';
    },

    simulateAiReply() {
        this.dom.typingIndicator.style.display = 'flex';
        this.scrollToBottom();

        const delay = Math.floor(Math.random() * 1000) + 500;

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
            toast.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${message}`;
        } else {
            toast.innerHTML = `<i class="fa-solid ${icon}"></i> ${message}`;
        }
        
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
        // ... (Keep existing canvas code) ...
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
