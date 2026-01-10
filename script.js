/**
 * Neurochat Application Logic
 * Handles authentication, state management, chat simulation, and UI rendering.
 */
const app = {
    state: {
        currentUser: 'Guest',
        activeChatId: null,
        isMobile: window.innerWidth <= 768,
        contacts: [
            {
                id: 1,
                name: "Sarah Connor",
                avatar: "https://picsum.photos/seed/sarah/80/80",
                status: "online",
                messages: [
                    { id: 1, text: "Have you seen the new neural interface update?", sender: "them", time: "10:30 AM" },
                    { id: 2, text: "Yes, the latency is almost zero now.", sender: "me", time: "10:32 AM" }
                ],
                unread: 0
            },
            {
                id: 2,
                name: "Dr. Freeman",
                avatar: "https://picsum.photos/seed/freeman/80/80",
                status: "busy",
                messages: [
                    { id: 1, text: "The resonance cascade scenario is unlikely.", sender: "them", time: "Yesterday" }
                ],
                unread: 1
            },
            {
                id: 3,
                name: "Neural Core AI",
                avatar: "https://picsum.photos/seed/ai/80/80",
                status: "online",
                messages: [
                    { id: 1, text: "System diagnostics complete. All neurons firing at 98%.", sender: "them", time: "09:00 AM" }
                ],
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
                messages: [
                    { id: 1, text: "Don't forget to eat real food.", sender: "them", time: "Mon" }
                ],
                unread: 2
            }
        ],
        botResponses: [
            "That is a fascinating perspective.",
            "I am analyzing the data points you provided.",
            "Connection stable. Please continue.",
            "Can you elaborate on the neural implications?",
            "Processing request... done. I agree.",
            "That's exactly what I was thinking!",
            "My logic circuits align with your statement."
        ]
    },

    init() {
        this.cacheDOM();
        this.bindEvents();
        this.renderContactList();
        this.setupCanvas();
        
        // Handle Resize
        window.addEventListener('resize', () => {
            this.state.isMobile = window.innerWidth <= 768;
            this.handleResize();
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
            this.showToast(`Welcome back, ${username}.`, 'success');
        } else {
            this.showToast('Please enter a username.', 'error');
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
        
        // Update UI visibility
        this.dom.emptyState.classList.add('hidden-view');
        this.dom.activeChatView.classList.remove('hidden-view');
        this.dom.activeChatView.classList.add('height-100');
        
        // Update Header
        this.dom.activeName.textContent = contact.name;
        this.dom.activeAvatar.src = contact.avatar;
        this.dom.activeStatus.textContent = contact.status === 'online' ? 'Online' : 'Last seen recently';
        this.dom.activeStatus.className = `status-text ${contact.status}`;

        this.renderMessages();
        this.renderContactList(this.dom.searchInput.value);

        // Mobile Transitions
        if (this.state.isMobile) {
            this.dom.sidebar.classList.add('hidden-mobile');
            this.dom.chatArea.classList.add('active-mobile');
        }

        setTimeout(() => this.dom.messageInput.focus(), 100);
    },

    closeChat() {
        // Mobile only action
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
            const div = document.createElement('div');
            div.className = `message ${msg.sender === 'me' ? 'sent' : 'received'}`;
            div.innerHTML = `
                ${msg.text}
                <div class="message-meta">
                    ${msg.time}
                    ${msg.sender === 'me' ? '<i class="fa-solid fa-check-double"></i>' : ''}
                </div>
            `;
            this.dom.messagesContainer.appendChild(div);
        });

        this.scrollToBottom();
    },

    sendMessage() {
        const text = this.dom.messageInput.value.trim();
        if (!text || !this.state.activeChatId) return;

        const contact = this.state.contacts.find(c => c.id === this.state.activeChatId);
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        contact.messages.push({
            id: Date.now(),
            text: text,
            sender: 'me',
            time: timeString
        });

        this.dom.messageInput.value = '';
        this.renderMessages();
        this.renderContactList(this.dom.searchInput.value);
        this.simulateIncomingReply(contact);
    },

    simulateIncomingReply(contact) {
        this.dom.typingIndicator.style.display = 'flex';
        this.scrollToBottom();

        const delay = Math.floor(Math.random() * 2000) + 1000;

        setTimeout(() => {
            this.dom.typingIndicator.style.display = 'none';
            
            const now = new Date();
            const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const randomResponse = this.state.botResponses[Math.floor(Math.random() * this.state.botResponses.length)];

            contact.messages.push({
                id: Date.now() + 1,
                text: randomResponse,
                sender: 'them',
                time: timeString
            });

            if (this.state.activeChatId === contact.id) {
                this.renderMessages();
            } else {
                contact.unread++;
                this.showToast(`New message from ${contact.name}`);
            }
            this.renderContactList(this.dom.searchInput.value);

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

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
