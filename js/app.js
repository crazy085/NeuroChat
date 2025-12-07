// Main Application Module with WebSocket support
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
        this.socket = null;
        this.init();
    }

    init() {
        this.initializeWebSocket();
        this.loadData();
        this.initializeChats();
        this.renderChatList();
        this.startRealtimeSimulation();
        
        // Initialize neural background
        if (window.neuralBg) {
            neuralBg.init('neuralBg');
        }
    }

    initializeWebSocket() {
        // Connect to WebSocket server
        this.socket = io();
        
        this.socket.on('connect', () => {
            console.log('Connected to NeuroChat server');
            ui.showToast('Connected to neural network');
        });
        
        this.socket.on('receive-message', (data) => {
            this.handleIncomingMessage(data);
        });
        
        this.socket.on('user-typing', (user) => {
            this.handleUserTyping(user);
        });
        
        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
            ui.showToast('Connection lost');
        });
    }

    handleIncomingMessage(data) {
        if (!this.currentChat) return;
        
        const message = {
            id: data.id,
            text: data.text,
            sent: false,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'read'
        };
        
        if (!this.messages[this.currentChat.id]) {
            this.messages[this.currentChat.id] = [];
        }
        
        this.messages[this.currentChat.id].push(message);
        this.currentChat.lastMessage = data.text;
        this.currentChat.time = 'Just now';
        
        this.renderMessages();
        this.renderChatList();
        this.saveData();
        
        ui.showToast(`${data.sender}: ${data.text}`);
    }

    handleUserTyping(user) {
        if (!this.currentChat) return;
        
        const chat = this.chats.find(c => c.name === user);
        if (chat) {
            chat.typing = true;
            this.renderChatList();
            
            setTimeout(() => {
                chat.typing = false;
                this.renderChatList();
            }, 3000);
        }
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
        
        // Send via WebSocket
        if (this.socket && this.socket.connected) {
            this.socket.emit('send-message', {
                message: text,
                room: this.currentChat.id,
                sender: this.userProfile.name
            });
        }
        
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
        }, 2000);
        
        ui.showToast('Neural signal transmitted!');
    }

    // ... rest of the existing methods remain the same
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new NeuroChat();
    window.currentChat = window.app;
});
