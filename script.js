const app = {
    state: {
        currentUser: null,
        socket: null,
        authMode: 'login',
        isMobile: window.innerWidth <= 768,
        activeChatId: null,
        // No default contacts. Loaded dynamically.
        contacts: [], 
        allUsers: [] // List of registered users
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
    },

    // --- Helpers ---
    
    // Generate a consistent private room ID for two users
    getChatId(user1, user2) {
        return [user1, user2].sort().join('_');
    },

    // --- Auth ---

    switchAuthMode(mode) {
        this.state.authMode = mode;
        document.getElementById('tab-login').className = mode === 'login' ? 'auth-tab active' : 'auth-tab';
        document.getElementById('tab-register').className = mode === 'register' ? 'auth-tab active' : 'auth-tab';
        document.getElementById('auth-btn').textContent = mode === 'login' ? 'Login' : 'Register';
    },

    handleAuth() {
        const username = this.dom.usernameInput.value.trim();
        const password = this.dom.passwordInput.value.trim();
        const msg = document.getElementById('auth-message');

        if (!username || !password) return;

        const url = '/' + this.state.authMode;
        fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                this.state.currentUser = username;
                this.dom.currentUserDisplay.textContent = username;
                this.dom.authScreen.classList.add('hidden');
                this.initSocket();
                // Fetch users so we can search them
                this.fetchUsers();
            } else {
                msg.textContent = data.message;
                msg.style.color = "var(--danger)";
            }
        });
    },

    fetchUsers() {
        fetch('/users')
        .then(res => res.json())
        .then(data => {
            this.state.allUsers = data.users;
        });
    },

    // --- Socket & Chat Logic ---

    initSocket() {
        this.state.socket = io();
        this.state.socket.on('connect', () => console.log("Connected"));

        this.state.socket.on('receive_message', (data) => {
            // data: { text, sender, time }
            // 1. Determine the chat ID (Me + Sender)
            const chatId = this.getChatId(this.state.currentUser, data.sender);
            
            // 2. Does this contact exist in our list?
            let contact = this.state.contacts.find(c => c.id === chatId);

            // If the sender is NOT me, and contact doesn't exist, create it!
            if (data.sender !== this.state.currentUser && !contact) {
                contact = {
                    id: chatId,
                    name: data.sender,
                    avatar: `https://picsum.photos/seed/${data.sender}/80/80`,
                    messages: [],
                    unread: 0
                };
                this.state.contacts.unshift(contact); // Add to top
                this.showToast(`New message from ${data.sender}`);
            }

            // 3. Add message data
            if (contact) {
                contact.messages.push(data);
                if (this.state.activeChatId === chatId) {
                    this.appendMessageToUI(data.text, data.sender, data.time);
                } else {
                    contact.unread++;
                }
                this.renderContactList();
            }
        });

        this.state.socket.on('load_history', (history) => {
            const contact = this.state.contacts.find(c => c.id === this.state.activeChatId);
            if (contact) {
                contact.messages = history;
                this.renderMessages();
            }
        });
    },

    // --- New Chat Logic ---

    toggleNewChatModal() {
        const modal = document.getElementById('new-chat-modal');
        modal.classList.toggle('hidden-modal');
        if (!modal.classList.contains('hidden-modal')) {
            document.getElementById('new-chat-username').focus();
        }
    },

    async startNewChat() {
        const targetUser = document.getElementById('new-chat-username').value.trim();
        if (!targetUser) return;
        if (targetUser === this.state.currentUser) {
            this.showToast("You can't chat with yourself!", 'error');
            return;
        }

        // Verify user exists
        if (!this.state.allUsers.includes(targetUser)) {
            this.showToast("User not found on server.", 'error');
            return;
        }

        // Generate Room ID
        const chatId = this.getChatId(this.state.currentUser, targetUser);

        // Check if already exists
        const exists = this.state.contacts.find(c => c.id === chatId);
        if (exists) {
            this.showToast("Chat already exists.");
            this.openChat(chatId);
        } else {
            // Create new contact
            const newContact = {
                id: chatId,
                name: targetUser,
                avatar: `https://picsum.photos/seed/${targetUser}/80/80`,
                messages: [],
                unread: 0
            };
            this.state.contacts.unshift(newContact);
            this.renderContactList();
            this.openChat(chatId);
        }

        this.toggleNewChatModal();
        document.getElementById('new-chat-username').value = '';
    },

    // --- UI Rendering ---

    renderContactList() {
        const list = this.dom.chatList;
        list.innerHTML = '';

        if (this.state.contacts.length === 0) {
            document.getElementById('empty-chats-hint').style.display = 'block';
            return;
        }
        document.getElementById('empty-chats-hint').style.display = 'none';

        this.state.contacts.forEach(contact => {
            const lastMsg = contact.messages.length > 0 
                ? contact.messages[contact.messages.length - 1].text 
                : "Start a conversation...";
            
            const time = contact.messages.length > 0 
                ? contact.messages[contact.messages.length - 1].time 
                : "";

            const item = document.createElement('div');
            item.className = `chat-item ${this.state.activeChatId === contact.id ? 'active' : ''}`;
            item.onclick = () => this.openChat(contact.id);

            item.innerHTML = `
                <img src="${contact.avatar}" class="avatar">
                <div class="chat-info">
                    <div class="chat-name">${contact.name}</div>
                    <div class="chat-preview">${lastMsg}</div>
                </div>
                ${contact.unread > 0 ? `<div style="background:var(--accent); color:#000; padding:2px 6px; border-radius:10px; font-size:0.7rem; font-weight:bold;">${contact.unread}</div>` : ''}
            `;
            list.appendChild(item);
        });
    },

    openChat(chatId) {
        const contact = this.state.contacts.find(c => c.id === chatId);
        if (!contact) return;

        this.state.activeChatId = chatId;
        contact.unread = 0;

        this.dom.emptyState.classList.add('hidden-view');
        this.dom.activeChatView.classList.remove('hidden-view');
        this.dom.activeName.textContent = contact.name;
        this.dom.activeAvatar.src = contact.avatar;

        // Join socket room
        if (this.state.socket) {
            this.state.socket.emit('join', {
                username: this.state.currentUser,
                chatId: chatId
            });
            // Wait for history from server
            this.dom.messagesContainer.innerHTML = '';
        }

        this.renderContactList();

        if (this.state.isMobile) {
            this.dom.sidebar.classList.add('hidden-mobile');
            this.dom.chatArea.classList.add('active-mobile');
        }
        
        setTimeout(() => this.dom.messageInput.focus(), 100);
    },

    renderMessages() {
        const contact = this.state.contacts.find(c => c.id === this.state.activeChatId);
        if (!contact) return;
        
        this.dom.messagesContainer.innerHTML = '';
        contact.messages.forEach(msg => {
            this.appendMessageToUI(msg.text, msg.sender, msg.time, false);
        });
        this.scrollToBottom();
    },

    appendMessageToUI(text, sender, time, autoScroll = true) {
        const div = document.createElement('div');
        const isMe = sender === this.state.currentUser;

        div.className = `message ${isMe ? 'sent' : 'received'}`;

        // Distinction: Show Sender Name on received messages
        let nameHTML = '';
        if (!isMe) {
            nameHTML = `<span class="msg-sender-name">${sender}</span>`;
        }

        div.innerHTML = `
            ${nameHTML}
            ${text}
            <div class="message-meta">${time}</div>
        `;
        
        this.dom.messagesContainer.appendChild(div);
        if (autoScroll) this.scrollToBottom();
    },

    sendMessage() {
        const text = this.dom.messageInput.value.trim();
        if (!text || !this.state.activeChatId) return;

        const now = new Date();
        const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        this.state.socket.emit('send_message', {
            chatId: this.state.activeChatId,
            text: text,
            sender: this.state.currentUser
        });

        this.dom.messageInput.value = '';
    },

    // ... (Keep existing cacheDOM, bindEvents, scrollToBottom, showToast, handleResize, setupCanvas) ...
    
    // For brevity, I am assuming you kept these unchanged from previous steps, 
    // but ensure cacheDOM includes:
    // usernameInput, passwordInput, authBtn, currentUserDisplay, chatList, chatArea, messagesContainer, messageInput, sendBtn, backBtn
    cacheDOM() {
        this.dom = {
            usernameInput: document.getElementById('username-input'),
            passwordInput: document.getElementById('password-input'),
            authBtn: document.getElementById('auth-btn'),
            currentUserDisplay: document.getElementById('current-user-name'),
            authScreen: document.getElementById('auth-screen'),
            chatList: document.getElementById('chat-list'),
            chatArea: document.getElementById('chat-area'),
            emptyState: document.getElementById('empty-state'),
            activeChatView: document.getElementById('active-chat-view'),
            activeName: document.getElementById('active-name'),
            activeAvatar: document.getElementById('active-avatar'),
            messagesContainer: document.getElementById('messages-container'),
            messageInput: document.getElementById('message-input'),
            sendBtn: document.getElementById('send-btn'),
            backBtn: document.getElementById('back-btn'),
            toastContainer: document.getElementById('toast-container')
        };
        this.bindEvents();
    },

    bindEvents() {
        this.dom.authBtn.addEventListener('click', () => this.handleAuth());
        this.dom.sendBtn.addEventListener('click', () => this.sendMessage());
        this.dom.messageInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') this.sendMessage(); });
        this.dom.backBtn.addEventListener('click', () => {
             if (this.state.isMobile) {
                this.dom.chatArea.classList.remove('active-mobile');
                this.dom.sidebar.classList.remove('hidden-mobile');
                this.state.activeChatId = null;
                setTimeout(() => this.renderContactList(), 300);
            }
        });
    },

    scrollToBottom() {
        this.dom.messagesContainer.scrollTop = this.dom.messagesContainer.scrollHeight;
    },

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.style.position = 'fixed';
        toast.style.top = '20px';
        toast.style.right = '20px';
        toast.style.background = 'rgba(24, 27, 33, 0.95)';
        toast.style.color = '#fff';
        toast.style.padding = '12px 20px';
        toast.style.borderRadius = '8px';
        toast.style.borderLeft = type === 'error' ? '4px solid var(--danger)' : '4px solid var(--accent)';
        toast.style.zIndex = '3000';
        toast.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)';
        toast.innerHTML = message;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
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
        // (Keep existing canvas code)
        const canvas = document.getElementById('neural-canvas');
        const ctx = canvas.getContext('2d');
        let width, height;
        let particles = [];
        function resize() { width = canvas.width = window.innerWidth; height = canvas.height = window.innerHeight; }
        window.addEventListener('resize', resize);
        resize();
        class Particle {
            constructor() {
                this.x = Math.random() * width; this.y = Math.random() * height;
                this.vx = (Math.random() - 0.5) * 0.5; this.vy = (Math.random() - 0.5) * 0.5;
                this.size = Math.random() * 2 + 1;
            }
            update() { this.x += this.vx; this.y += this.vy; if(this.x<0||this.x>width) this.vx*=-1; if(this.y<0||this.y>height) this.vy*=-1; }
            draw() { ctx.beginPath(); ctx.arc(this.x,this.y,this.size,0,Math.PI*2); ctx.fillStyle='rgba(0,206,201,0.5)'; ctx.fill(); }
        }
        for(let i=0;i<60;i++) particles.push(new Particle());
        function animate() {
            ctx.clearRect(0,0,width,height);
            particles.forEach((p,i) => {
                p.update(); p.draw();
                for(let j=i+1;j<particles.length;j++){
                    const p2 = particles[j];
                    const dist = Math.hypot(p.x-p2.x, p.y-p2.y);
                    if(dist<150) { ctx.beginPath(); ctx.strokeStyle=`rgba(108,92,231,${1-dist/150})`; ctx.lineWidth=0.5; ctx.moveTo(p.x,p.y); ctx.lineTo(p2.x,p2.y); ctx.stroke(); }
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
