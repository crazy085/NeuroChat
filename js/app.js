// Main Application Module
class NeuroChat {
    constructor() {
        this.currentChat = null;
        this.chats = [];
        this.messages = {};
        this.userProfile = {
            name: 'Neural User',
            status: 'Connected',
            about: 'Exploring the neural network'
        };
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        this.loadData();
        this.initializeChats();
        this.renderChatList();
        this.startRealtimeSimulation();
        
        // Initialize neural background
        if (window.neuralBg) {
            neuralBg.init('neuralBg');
        }

        // Check server connection
        this.checkServerConnection();
    }

    async checkServerConnection() {
        try {
            const response = await fetch('/api/health');
            const data = await response.json();
            console.log('Server status:', data);
            ui.showToast('Connected to neural network');
        } catch (error) {
            console.log('Server connection failed, using local mode');
            ui.showToast('Running in offline mode');
        }
    }

    loadData() {
        // Try to load from localStorage first
        const savedChats = localStorage.getItem('neurochats');
        const savedMessages = localStorage.getItem('neuromessages');
        const savedProfile = localStorage.getItem('neuroprofile');
        
        if (savedChats) this.chats = JSON.parse(savedChats);
        if (savedMessages) this.messages = JSON.parse(savedMessages);
        if (savedProfile) this.userProfile = JSON.parse(savedProfile);
    }

    saveData() {
        localStorage.setItem('neurochats', JSON.stringify(this.chats));
        localStorage.setItem('neuromessages', JSON.stringify(this.messages));
        localStorage.setItem('neuroprofile', JSON.stringify(this.userProfile));
    }

    initializeChats() {
        if (this.chats.length === 0) {
            this.chats = [
                {
                    id: 1,
                    name: 'Alice Neural',
                    avatar: 'alice',
                    lastMessage: 'Neural connection established!',
                    time: '10:30 AM',
                    unread: 2,
                    online: true,
                    typing: false,
                    category: 'recent'
                },
                {
                    id: 2,
                    name: 'Bob Synapse',
                    avatar: 'bob',
                    lastMessage: 'Transmitting data packet...',
                    time: 'Yesterday',
                    unread: 0,
                    online: false,
                    typing: false,
                    category: 'recent'
                },
                {
                    id: 3,
                    name: 'Neural Collective',
                    avatar: 'team',
                    lastMessage: 'Syncing neural pathways',
                    time: '2:15 PM',
                    unread: 5,
                    online: true,
                    typing: false,
                    category: 'groups'
                },
                {
                    id: 4,
                    name: 'Emma Cortex',
                    avatar: 'emma',
                    lastMessage: 'Signal strength: optimal',
                    time: 'Monday',
                    unread: 0,
                    online: true,
                    typing: false,
                    category: 'recent'
                },
                {
                    id: 5,
                    name: 'AI Assistant',
                    avatar: 'ai',
                    lastMessage: 'Processing your request...',
                    time: 'Just now',
                    unread: 1,
                    online: true,
                    typing: true,
                    category: 'recent'
                }
            ];
            
            // Initialize messages for each chat
            this.chats.forEach(chat => {
                if (!this.messages[chat.id]) {
                    this.messages[chat.id] = [
                        {
                            id: 1,
                            text: 'Neural link initiated! 🧠',
                            sent: false,
                            time: '10:00 AM',
                            status: 'read'
                        },
                        {
                            id: 2,
                            text: 'Connection stable. Ready for data transmission.',
                            sent: true,
                            time: '10:01 AM',
                            status: 'read'
                        }
                    ];
                }
            });
            
            this.saveData();
        }
    }

    renderChatList(filter = this.currentFilter) {
        let filteredChats = this.chats;
        
        if (filter === 'recent') {
            filteredChats = this.chats.filter(chat => chat.category === 'recent');
        } else if (filter === 'groups') {
            filteredChats = this.chats.filter(chat => chat.category === 'groups');
        } else if (filter === 'unread') {
            filteredChats = this.chats.filter(chat => chat.unread > 0);
        }
        
        ui.renderChatList(filteredChats, this.currentChat?.id);
    }

    selectChat(chat) {
        this.currentChat = chat;
        chat.unread = 0;
        
        ui.showChatArea();
        ui.updateChatHeader(chat);
        this.renderMessages();
        this.renderChatList();
        
        // Simulate typing indicator
        if (Math.random() > 0.7) {
            setTimeout(() => this.simulateTyping(), 2000);
        }
    }

    renderMessages() {
        const chatMessages = this.messages[this.currentChat.id] || [];
        ui.renderMessages(chatMessages);
    }

    sendMessage() {
        const text = ui.getInputValue();
        
        if (!text || !this.currentChat) return;
        
        const newMessage = {
            id: Date.now(),
            text: text,
            sent: true,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'sent'
        };
        
        if (!this.messages[this.currentChat.id]) {
            this.messages[this.currentChat.id] = [];
        }
        
        this.messages[this.currentChat.id].push(newMessage);
        
        // Update chat's last message
        this.currentChat.lastMessage = text;
        this.currentChat.time = 'Just now';
        
        ui.clearInput();
        this.renderMessages();
        this.renderChatList();
        this.saveData();
        
        // Simulate message status updates
        setTimeout(() => {
            newMessage.status = 'delivered';
            this.renderMessages();
        }, 1000);
        
        setTimeout(() => {
            newMessage.status = 'read';
            this.renderMessages();
            this.simulateReply();
        }, 2000);
        
        ui.showToast('Neural signal transmitted!');
    }

    simulateReply() {
        const replies = [
            'Neural pathway activated! 🧠',
            'Signal received and processed.',
            'Transmitting response packet...',
            'Connection strength: optimal.',
            'Neural sync complete.',
            'Data packet decoded successfully.',
            'Quantum entanglement established.',
            'Synaptic response initiated.'
        ];
        
        setTimeout(() => {
            const replyMessage = {
                id: Date.now(),
                text: replies[Math.floor(Math.random() * replies.length)],
                sent: false,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                status: 'read'
            };
            
            this.messages[this.currentChat.id].push(replyMessage);
            this.currentChat.lastMessage = replyMessage.text;
            this.currentChat.time = 'Just now';
            
            this.renderMessages();
            this.renderChatList();
            this.saveData();
            
            ui.showToast('Incoming neural signal!');
        }, 1500);
    }

    simulateTyping() {
        if (!this.currentChat) return;
        
        const chat = this.chats.find(c => c.id === this.currentChat.id);
        if (chat) {
            chat.typing = true;
            this.renderChatList();
            
            setTimeout(() => {
                chat.typing = false;
                this.renderChatList();
                this.simulateReply();
            }, 3000);
        }
    }

    createNewChat() {
        const name = prompt('Enter neural connection name:');
        if (name) {
            const newChat = {
                id: Date.now(),
                name: name,
                avatar: name.toLowerCase().replace(' ', ''),
                lastMessage: 'Neural link initiated',
                time: 'Now',
                unread: 0,
                online: Math.random() > 0.5,
                typing: false,
                category: 'recent'
            };
            
            this.chats.unshift(newChat);
            this.messages[newChat.id] = [];
            
            this.saveData();
            this.renderChatList();
            this.selectChat(newChat);
            
            ui.showToast(`Neural connection established with ${name}`);
        }
    }

    searchChats() {
        const searchTerm = ui.elements.searchInput.value.toLowerCase();
        const filteredChats = this.chats.filter(chat => 
            chat.name.toLowerCase().includes(searchTerm)
        );
        
        ui.renderChatList(filteredChats, this.currentChat?.id);
    }

    filterChats(category) {
        this.currentFilter = category;
        this.renderChatList(category);
    }

    saveProfile(event) {
        event.preventDefault();
        
        this.userProfile.name = document.getElementById('profileName').value;
        this.userProfile.status = document.getElementById('profileStatus').value;
        this.userProfile.about = document.getElementById('profileAbout').value;
        
        this.saveData();
        ui.toggleModal(ui.elements.profileModal);
        ui.showToast('Neural profile updated!');
    }

    startRealtimeSimulation() {
        setInterval(() => {
            // Randomly update online status
            if (Math.random() > 0.9) {
                const randomChat = this.chats[Math.floor(Math.random() * this.chats.length)];
                randomChat.online = !randomChat.online;
                this.renderChatList();
            }
            
            // Randomly add unread messages
            if (Math.random() > 0.95 && this.currentChat) {
                const otherChat = this.chats.find(c => c.id !== this.currentChat.id);
                if (otherChat) {
                    otherChat.unread = Math.floor(Math.random() * 5) + 1;
                    otherChat.time = 'Just now';
                    this.renderChatList();
                }
            }
        }, 10000);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new NeuroChat();
    window.currentChat = window.app;
});

// Global functions for HTML event handlers
window.sendMessage = () => app.sendMessage();
window.handleKeyPress = (event) => {
    if (event.key === 'Enter') {
        app.sendMessage();
    }
};
window.searchChats = () => app.searchChats();
window.filterChats = (category) => app.filterChats(category);
window.createNewChat = () => app.createNewChat();
window.toggleProfileModal = () => {
    ui.toggleModal(ui.elements.profileModal);
    if (ui.elements.profileModal.classList.contains('show')) {
        ui.updateProfileModal(app.userProfile);
    }
};
window.saveProfile = (event) => app.saveProfile(event);
window.toggleEmojiPicker = () => ui.toggleEmojiPicker();
window.insertEmoji = (emoji) => ui.insertEmoji(emoji);
window.attachFile = () => ui.showToast('Neural file transfer coming soon!');
window.toggleNotifications = () => ui.showToast('No new neural signals');
window.toggleVideoCall = () => ui.showToast('Neural video call coming soon!');
window.toggleVoiceCall = () => ui.showToast('Neural voice call coming soon!');
window.toggleChatInfo = () => ui.showToast('Neural connection info coming soon!');
window.selectChat = (chat) => app.selectChat(chat);
