// Main Application Controller
class NeuroChatApp {
    constructor() {
        this.currentScreen = 'loading';
        this.isInitialized = false;
        this.init();
    }

    // Initialize application
    async init() {
        try {
            // Show loading screen
            this.showScreen('loading');
            
            // Initialize services
            await this.initializeServices();
            
            // Initialize components
            this.initializeComponents();
            
            // Setup global event listeners
            this.setupGlobalEventListeners();
            
            // Check authentication
            await this.checkAuthentication();
            
            this.isInitialized = true;
            
        } catch (error) {
            console.error('App initialization error:', error);
            this.showError('Failed to initialize application');
        }
    }

    // Initialize services
    async initializeServices() {
        console.log('Initializing services...');
        
        // Services are already initialized as singletons
        // Just ensure they're ready
        if (!window.storageService) {
            throw new Error('Storage service not loaded');
        }
        
        if (!window.authService) {
            throw new Error('Auth service not loaded');
        }
        
        if (!window.chatService) {
            throw new Error('Chat service not loaded');
        }
        
        if (!window.realtimeService) {
            throw new Error('Realtime service not loaded');
        }
        
        console.log('Services initialized');
    }

    // Initialize components
    initializeComponents() {
        console.log('Initializing components...');
        
        // Initialize notification system
        if (window.notificationSystem) {
            console.log('Notification system ready');
        }
        
        // Initialize modal system
        if (window.modalSystem) {
            console.log('Modal system ready');
        }
        
        // Initialize login screen
        if (window.loginScreen) {
            console.log('Login screen ready');
        }
        
        // Initialize chat list
        if (window.chatList) {
            console.log('Chat list ready');
        }
        
        // Initialize chat window
        if (window.chatWindow) {
            console.log('Chat window ready');
        }
        
        console.log('Components initialized');
    }

    // Setup global event listeners
    setupGlobalEventListeners() {
        // Handle window resize
        window.addEventListener('resize', 
            Helpers.debounce(() => this.handleResize(), 250)
        );
        
        // Handle online/offline status
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());
        
        // Handle visibility change
        document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
        
        // Handle keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
        
        // Handle before unload
        window.addEventListener('beforeunload', () => this.handleBeforeUnload());
        
        // Setup button listeners
        this.setupButtonListeners();
    }

    // Setup button listeners
    setupButtonListeners() {
        // New chat button
        const newChatBtn = document.getElementById('newChatBtn');
        if (newChatBtn) {
            newChatBtn.addEventListener('click', () => {
                modalSystem.showNewChatModal();
            });
        }
        
        // Welcome new chat button
        const welcomeNewChatBtn = document.getElementById('welcomeNewChatBtn');
        if (welcomeNewChatBtn) {
            welcomeNewChatBtn.addEventListener('click', () => {
                modalSystem.showNewChatModal();
            });
        }
        
        // Settings button
        const settingsBtn = document.getElementById('settingsBtn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                modalSystem.showSettingsModal();
            });
        }
        
        // Profile button
        const profileBtn = document.getElementById('profileBtn');
        if (profileBtn) {
            profileBtn.addEventListener('click', () => {
                modalSystem.showProfileModal();
            });
        }
        
        // User menu button
        const userMenuBtn = document.getElementById('userMenuBtn');
        if (userMenuBtn) {
            userMenuBtn.addEventListener('click', () => {
                this.showUserMenu();
            });
        }
        
        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.handleLogout();
            });
        }
        
        // Dark mode toggle
        const darkModeToggle = document.getElementById('darkModeToggle');
        if (darkModeToggle) {
            darkModeToggle.addEventListener('click', () => {
                this.toggleDarkMode();
            });
        }
        
        // Back button (mobile)
        const backToChatList = document.getElementById('backToChatList');
        if (backToChatList) {
            backToChatList.addEventListener('click', () => {
                this.showSidebar();
            });
        }
        
        // Attach button
        const attachBtn = document.getElementById('attachBtn');
        if (attachBtn) {
            attachBtn.addEventListener('click', () => {
                this.handleFileAttach();
            });
        }
        
        // Voice button
        const voiceBtn = document.getElementById('voiceBtn');
        if (voiceBtn) {
            voiceBtn.addEventListener('click', () => {
                this.handleVoiceMessage();
            });
        }
    }

    // Check authentication
    async checkAuthentication() {
        try {
            if (authService.isAuthenticated()) {
                await this.showChatScreen();
            } else {
                this.showLoginScreen();
            }
        } catch (error) {
            console.error('Auth check error:', error);
            this.showLoginScreen();
        }
    }

    // Show loading screen
    showScreen(screenName) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show target screen
        const screen = document.getElementById(`${screenName}Screen`);
        if (screen) {
            screen.classList.add('active');
            this.currentScreen = screenName;
        }
    }

    // Show login screen
    showLoginScreen() {
        this.showScreen('login');
        if (window.loginScreen) {
            loginScreen.show();
        }
    }

    // Show chat screen
    async showChatScreen() {
        this.showScreen('chat');
        
        // Update user info in sidebar
        this.updateUserInfo();
        
        // Load chats
        if (window.chatList) {
            chatList.loadChats();
        }
        
        // Apply user settings
        this.applyUserSettings();
        
        // Show welcome view if no chats
        const chats = chatService.getChats();
        if (chats.length === 0) {
            document.getElementById('welcomeView').classList.add('active');
            document.getElementById('chatView').classList.remove('active');
        }
    }

    // Update user info in sidebar
    updateUserInfo() {
        const currentUser = authService.getCurrentUser();
        if (!currentUser) return;
        
        const userName = document.getElementById('currentUserName');
        const userStatus = document.getElementById('currentUserStatus');
        const userAvatar = document.getElementById('currentUserAvatar');
        
        if (userName) {
            userName.textContent = currentUser.username;
        }
        
        if (userStatus) {
            userStatus.textContent = currentUser.getStatusText();
        }
        
        if (userAvatar) {
            const img = userAvatar.querySelector('img');
            if (img) {
                img.src = currentUser.avatar;
            }
        }
    }

    // Apply user settings
    applyUserSettings() {
        const currentUser = authService.getCurrentUser();
        if (!currentUser || !currentUser.settings) return;
        
        const settings = currentUser.settings;
        
        // Apply dark mode
        if (settings.darkMode) {
            document.body.classList.add('dark-mode');
            const darkModeToggle = document.getElementById('darkModeToggle');
            if (darkModeToggle) {
                const icon = darkModeToggle.querySelector('i');
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            }
        }
    }

    // Handle logout
    async handleLogout() {
        try {
            await authService.logout();
            
            // Clear current chat
            chatService.setCurrentChat(null);
            
            // Show login screen
            this.showLoginScreen();
            
            // Show notification
            if (window.notificationSystem) {
                notificationSystem.success('Logged out successfully');
            }
            
        } catch (error) {
            console.error('Logout error:', error);
            if (window.notificationSystem) {
                notificationSystem.error('Failed to logout');
            }
        }
    }

    // Toggle dark mode
    toggleDarkMode() {
        const isDarkMode = document.body.classList.toggle('dark-mode');
        
        // Update icon
        const darkModeToggle = document.getElementById('darkModeToggle');
        if (darkModeToggle) {
            const icon = darkModeToggle.querySelector('i');
            if (isDarkMode) {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            } else {
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
            }
        }
        
        // Update user settings
        authService.updateSettings({ darkMode: isDarkMode });
        
        // Update settings modal if open
        const darkModeSetting = document.getElementById('darkModeSetting');
        if (darkModeSetting) {
            if (isDarkMode) {
                darkModeSetting.classList.add('active');
            } else {
                darkModeSetting.classList.remove('active');
            }
        }
    }

    // Show user menu
    showUserMenu() {
        // Create dropdown menu
        const existingMenu = document.querySelector('.user-menu');
        if (existingMenu) {
            existingMenu.remove();
            return;
        }
        
        const menu = document.createElement('div');
        menu.className = 'user-menu';
        menu.innerHTML = `
            <div class="user-menu-item" data-action="profile">
                <i class="fas fa-user"></i>
                <span>Profile</span>
            </div>
            <div class="user-menu-item" data-action="settings">
                <i class="fas fa-cog"></i>
                <span>Settings</span>
            </div>
            <div class="user-menu-item" data-action="logout">
                <i class="fas fa-sign-out-alt"></i>
                <span>Logout</span>
            </div>
        `;
        
        // Add styles
        menu.style.cssText = `
            position: absolute;
            top: 70px;
            right: 20px;
            background: var(--bg-secondary);
            border: 1px solid var(--border-light);
            border-radius: 8px;
            box-shadow: var(--shadow-lg);
            z-index: 1000;
            min-width: 150px;
            animation: fadeIn 0.2s ease;
        `;
        
        // Add menu items styles
        const style = document.createElement('style');
        style.textContent = `
            .user-menu-item {
                padding: 10px 15px;
                display: flex;
                align-items: center;
                gap: 10px;
                cursor: pointer;
                transition: background-color 0.2s;
            }
            .user-menu-item:hover {
                background-color: var(--bg-hover);
            }
            .user-menu-item i {
                width: 20px;
                color: var(--text-muted);
            }
        `;
        document.head.appendChild(style);
        
        // Add to document
        document.body.appendChild(menu);
        
        // Add event listeners
        menu.querySelectorAll('.user-menu-item').forEach(item => {
            item.addEventListener('click', () => {
                const action = item.dataset.action;
                menu.remove();
                
                switch (action) {
                    case 'profile':
                        modalSystem.showProfileModal();
                        break;
                    case 'settings':
                        modalSystem.showSettingsModal();
                        break;
                    case 'logout':
                        this.handleLogout();
                        break;
                }
            });
        });
        
        // Close on outside click
        setTimeout(() => {
            document.addEventListener('click', function closeMenu(e) {
                if (!menu.contains(e.target)) {
                    menu.remove();
                    document.removeEventListener('click', closeMenu);
                }
            });
        }, 100);
    }

    // Handle file attach
    handleFileAttach() {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = 'image/*,video/*,audio/*,.pdf,.doc,.docx,.txt';
        
        input.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            files.forEach(file => {
                this.handleFileUpload(file);
            });
        });
        
        input.click();
    }

    // Handle file upload
    async handleFileUpload(file) {
        try {
            // Show loading
            notificationSystem.info(`Uploading ${file.name}...`);
            
            // In a real app, you would upload to server
            // For demo, we'll create a local URL
            const fileUrl = URL.createObjectURL(file);
            
            // Send file message
            const currentChat = chatService.getCurrentChat();
            if (currentChat) {
                await chatService.sendMessage(
                    currentChat.id,
                    file.name,
                    this.getFileType(file.type),
                    {
                        url: fileUrl,
                        name: file.name,
                        size: file.size
                    }
                );
                
                notificationSystem.success(`${file.name} uploaded successfully`);
            }
            
        } catch (error) {
            console.error('File upload error:', error);
            notificationSystem.error(`Failed to upload ${file.name}`);
        }
    }

    // Get file type
    getFileType(mimeType) {
        if (mimeType.startsWith('image/')) return 'image';
        if (mimeType.startsWith('video/')) return 'video';
        if (mimeType.startsWith('audio/')) return 'audio';
        return 'file';
    }

    // Handle voice message
    handleVoiceMessage() {
        if (this.isRecording) {
            this.stopRecording();
        } else {
            this.startRecording();
        }
    }

    // Start recording
    startRecording() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            notificationSystem.error('Voice recording not supported');
            return;
        }
        
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                this.mediaRecorder = new MediaRecorder(stream);
                this.audioChunks = [];
                
                this.mediaRecorder.ondataavailable = (event) => {
                    this.audioChunks.push(event.data);
                };
                
                this.mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
                    const audioUrl = URL.createObjectURL(audioBlob);
                    
                    // Send voice message
                    const currentChat = chatService.getCurrentChat();
                    if (currentChat) {
                        chatService.sendMessage(
                            currentChat.id,
                            'Voice message',
                            'audio',
                            {
                                url: audioUrl,
                                name: `Voice ${Date.now()}.wav`,
                                size: audioBlob.size
                            }
                        );
                    }
                };
                
                this.mediaRecorder.start();
                this.isRecording = true;
                
                // Update button
                const voiceBtn = document.getElementById('voiceBtn');
                if (voiceBtn) {
                    voiceBtn.innerHTML = '<i class="fas fa-stop"></i>';
                    voiceBtn.style.color = '#ff5252';
                }
                
                notificationSystem.info('Recording... Click stop when done');
            })
            .catch(error => {
                console.error('Microphone access error:', error);
                notificationSystem.error('Failed to access microphone');
            });
    }

    // Stop recording
    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            
            // Update button
            const voiceBtn = document.getElementById('voiceBtn');
            if (voiceBtn) {
                voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
                voiceBtn.style.color = '';
            }
            
            // Stop all tracks
            if (this.mediaRecorder.stream) {
                this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
            }
        }
    }

    // Handle window resize
    handleResize() {
        // Handle responsive layout
        if (window.innerWidth > 768) {
            // Desktop: show sidebar
            document.getElementById('sidebar').classList.remove('hidden');
        }
    }

    // Handle online status
    handleOnline() {
        console.log('App is online');
        if (window.notificationSystem) {
            notificationSystem.success('Connection restored');
        }
        
        // Reconnect realtime service
        if (window.realtimeService) {
            realtimeService.connect();
        }
    }

    // Handle offline status
    handleOffline() {
        console.log('App is offline');
        if (window.notificationSystem) {
            notificationSystem.warning('Connection lost');
        }
        
        // Disconnect realtime service
        if (window.realtimeService) {
            realtimeService.disconnect();
        }
    }

    // Handle visibility change
    handleVisibilityChange() {
        if (document.hidden) {
            // App is hidden
            console.log('App is hidden');
            // Pause real-time updates
            if (window.realtimeService) {
                realtimeService.sendPresence(USER_STATUS.AWAY);
            }
        } else {
            // App is visible
            console.log('App is visible');
            // Resume real-time updates
            if (window.realtimeService) {
                realtimeService.sendPresence(USER_STATUS.ONLINE);
            }
            
            // Mark messages as read
            const currentChat = chatService.getCurrentChat();
            if (currentChat) {
                chatService.markAsRead(currentChat.id);
            }
        }
    }

    // Handle keyboard shortcuts
    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + K: Search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.focus();
            }
        }
        
        // Ctrl/Cmd + N: New chat
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            modalSystem.showNewChatModal();
        }
        
        // Ctrl/Cmd + ,: Settings
        if ((e.ctrlKey || e.metaKey) && e.key === ',') {
            e.preventDefault();
            modalSystem.showSettingsModal();
        }
        
        // Escape: Close modals
        if (e.key === 'Escape') {
            if (window.modalSystem) {
                modalSystem.close();
            }
        }
    }

    // Handle before unload
    handleBeforeUnload() {
        // Save any pending data
        if (window.chatService) {
            chatService.saveChats();
            chatService.saveMessages();
        }
    }

    // Show sidebar (mobile)
    showSidebar() {
        document.getElementById('sidebar').classList.remove('hidden');
        document.getElementById('welcomeView').classList.add('active');
        document.getElementById('chatView').classList.remove('active');
    }

    // Show error
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #ff5252;
            color: white;
            padding: 20px;
            border-radius: 8px;
            z-index: 9999;
            text-align: center;
        `;
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    // Get app info
    getAppInfo() {
        return {
            name: APP_CONFIG.NAME,
            version: APP_CONFIG.VERSION,
            userAgent: navigator.userAgent,
            isOnline: navigator.onLine,
            isMobile: Helpers.isMobile(),
            storage: storageService.getSize()
        };
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Create global app instance
    window.app = new NeuroChatApp();
    
    // Make app globally accessible
    console.log('NeuroChat initialized');
    console.log('App info:', window.app.getAppInfo());
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NeuroChatApp;
}
