// Modal System
class ModalSystem {
    constructor() {
        this.activeModal = null;
        this.modals = {};
        this.init();
    }

    // Initialize modal system
    init() {
        // Register all modals
        this.registerModal('newChatModal');
        this.registerModal('settingsModal');
        this.registerModal('profileModal');
        
        // Setup overlay click handler
        this.setupOverlayHandler();
    }

    // Register modal
    registerModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) {
            console.warn(`Modal with ID ${modalId} not found`);
            return;
        }
        
        this.modals[modalId] = modal;
        
        // Setup close buttons
        const closeButtons = modal.querySelectorAll('[id^="close"], [class*="close"]');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.close(modalId);
            });
        });
        
        // Setup escape key handler
        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.close(modalId);
            }
        });
    }

    // Setup overlay handler
    setupOverlayHandler() {
        const overlay = document.getElementById('modalOverlay');
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.close();
                }
            });
        }
    }

    // Open modal
    open(modalId, options = {}) {
        const modal = this.modals[modalId];
        if (!modal) {
            console.warn(`Modal with ID ${modalId} not found`);
            return false;
        }
        
        // Close current modal if any
        if (this.activeModal && this.activeModal !== modalId) {
            this.close(this.activeModal);
        }
        
        // Show overlay
        const overlay = document.getElementById('modalOverlay');
        if (overlay) {
            overlay.classList.add('active');
        }
        
        // Show modal
        modal.classList.add('active');
        this.activeModal = modalId;
        
        // Focus management
        this.manageFocus(modal);
        
        // Trigger open event
        this.triggerEvent(modal, 'modal:open', options);
        
        return true;
    }

    // Close modal
    close(modalId = null) {
        const idToClose = modalId || this.activeModal;
        const modal = this.modals[idToClose];
        
        if (!modal) return false;
        
        // Hide modal
        modal.classList.remove('active');
        
        // Hide overlay if no active modals
        const overlay = document.getElementById('modalOverlay');
        if (overlay && !this.hasActiveModals()) {
            overlay.classList.remove('active');
        }
        
        // Clear active modal
        if (this.activeModal === idToClose) {
            this.activeModal = null;
        }
        
        // Trigger close event
        this.triggerEvent(modal, 'modal:close');
        
        return true;
    }

    // Close all modals
    closeAll() {
        Object.keys(this.modals).forEach(modalId => {
            this.close(modalId);
        });
    }

    // Check if any modals are active
    hasActiveModals() {
        return Object.values(this.modals).some(modal => modal.classList.contains('active'));
    }

    // Get active modal
    getActiveModal() {
        return this.activeModal ? this.modals[this.activeModal] : null;
    }

    // Manage focus in modal
    manageFocus(modal) {
        // Find focusable elements
        const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length > 0) {
            // Focus first element
            focusableElements[0].focus();
            
            // Trap focus within modal
            modal.addEventListener('keydown', (e) => {
                if (e.key === 'Tab') {
                    const firstElement = focusableElements[0];
                    const lastElement = focusableElements[focusableElements.length - 1];
                    
                    if (e.shiftKey) {
                        if (document.activeElement === firstElement) {
                            e.preventDefault();
                            lastElement.focus();
                        }
                    } else {
                        if (document.activeElement === lastElement) {
                            e.preventDefault();
                            firstElement.focus();
                        }
                    }
                }
            });
        }
    }

    // Trigger custom event
    triggerEvent(modal, eventName, data = {}) {
        const event = new CustomEvent(eventName, {
            detail: { modal, ...data }
        });
        modal.dispatchEvent(event);
    }

    // Show new chat modal
    showNewChatModal() {
        this.open('newChatModal');
        this.setupNewChatModal();
    }

    // Setup new chat modal
    setupNewChatModal() {
        const modal = this.modals.newChatModal;
        if (!modal) return;
        
        // Chat type buttons
        const typeButtons = modal.querySelectorAll('.chat-type-btn');
        typeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                typeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const type = btn.dataset.type;
                const participantsContainer = document.getElementById('groupParticipantsContainer');
                const nameInput = document.getElementById('newChatName');
                
                if (type === 'group') {
                    participantsContainer.classList.remove('hidden');
                    nameInput.placeholder = 'Enter group name';
                } else {
                    participantsContainer.classList.add('hidden');
                    nameInput.placeholder = 'Enter username';
                }
            });
        });
        
        // Create chat button
        const createBtn = document.getElementById('createChatBtn');
        if (createBtn) {
            createBtn.onclick = () => this.handleCreateChat();
        }
    }

    // Handle create chat
    async handleCreateChat() {
        const type = document.querySelector('.chat-type-btn.active').dataset.type;
        const name = document.getElementById('newChatName').value.trim();
        const participants = document.getElementById('groupParticipants').value
            .split(',')
            .map(p => p.trim())
            .filter(p => p);
        
        if (!name) {
            notificationSystem.error('Please enter a name');
            return;
        }
        
        try {
            if (type === 'direct') {
                // Find user by username
                const users = authService.searchUsers(name);
                if (users.length === 0) {
                    notificationSystem.error('User not found');
                    return;
                }
                
                await chatService.createChat(null, CHAT_TYPES.DIRECT, [users[0].id]);
            } else {
                if (participants.length === 0) {
                    notificationSystem.error('Please add at least one participant');
                    return;
                }
                
                await chatService.createChat(name, CHAT_TYPES.GROUP, participants);
            }
            
            this.close('newChatModal');
            notificationSystem.success('Chat created successfully');
            
            // Clear form
            document.getElementById('newChatName').value = '';
            document.getElementById('groupParticipants').value = '';
            
        } catch (error) {
            notificationSystem.error(error.message);
        }
    }

    // Show settings modal
    showSettingsModal() {
        this.open('settingsModal');
        this.setupSettingsModal();
    }

    // Setup settings modal
    setupSettingsModal() {
        const modal = this.modals.settingsModal;
        if (!modal) return;
        
        const currentUser = authService.getCurrentUser();
        if (!currentUser) return;
        
        // Load current settings
        const settings = currentUser.settings;
        
        // Setup toggle switches
        this.setupToggleSwitch('darkModeSetting', settings.darkMode);
        this.setupToggleSwitch('desktopNotifications', settings.desktopNotifications);
        this.setupToggleSwitch('soundNotifications', settings.soundNotifications);
        this.setupToggleSwitch('readReceipts', settings.readReceipts);
        this.setupToggleSwitch('lastSeen', settings.lastSeen);
    }

    // Setup toggle switch
    setupToggleSwitch(switchId, initialState) {
        const toggle = document.getElementById(switchId);
        if (!toggle) return;
        
        if (initialState) {
            toggle.classList.add('active');
        }
        
        toggle.addEventListener('click', () => {
            toggle.classList.toggle('active');
            const isActive = toggle.classList.contains('active');
            
            // Handle specific settings
            switch (switchId) {
                case 'darkModeSetting':
                    this.toggleDarkMode(isActive);
                    break;
                case 'desktopNotifications':
                    if (isActive) {
                        notificationSystem.requestPermission();
                    }
                    break;
            }
            
            // Update user settings
            const settingName = switchId.replace('Setting', '');
            authService.updateSettings({ [settingName]: isActive });
        });
    }

    // Toggle dark mode
    toggleDarkMode(enabled) {
        document.body.classList.toggle('dark-mode', enabled);
        
        // Update icon
        const darkModeToggle = document.getElementById('darkModeToggle');
        if (darkModeToggle) {
            const icon = darkModeToggle.querySelector('i');
            if (enabled) {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            } else {
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
            }
        }
    }

    // Show profile modal
    showProfileModal() {
        this.open('profileModal');
        this.setupProfileModal();
    }

    // Setup profile modal
    setupProfileModal() {
        const modal = this.modals.profileModal;
        if (!modal) return;
        
        const currentUser = authService.getCurrentUser();
        if (!currentUser) return;
        
        // Load user data
        document.getElementById('profileAvatar').src = currentUser.avatar;
        document.getElementById('profileName').textContent = currentUser.username;
        document.getElementById('profileStatusText').textContent = currentUser.email || 'No email set';
        document.getElementById('profileUsername').textContent = currentUser.username;
        document.getElementById('profileEmail').textContent = currentUser.email || 'No email set';
        document.getElementById('profileStatus').value = currentUser.customStatus;
        
        // Setup save button
        const saveBtn = document.getElementById('saveProfileBtn');
        if (saveBtn) {
            saveBtn.onclick = () => this.handleSaveProfile();
        }
    }

    // Handle save profile
    handleSaveProfile() {
        const customStatus = document.getElementById('profileStatus').value.trim();
        const email = document.getElementById('profileEmailInput')?.value.trim();
        
        const updates = { customStatus };
        
        // Only update email if changed and valid
        if (email && email !== authService.getCurrentUser().email) {
            if (!Helpers.validateEmail(email)) {
                notificationSystem.error('Please enter a valid email address');
                return;
            }
            updates.email = email;
        }
        
        authService.updateUser(updates);
        notificationSystem.success('Profile updated successfully');
        this.close('profileModal');
    }
}

// Export singleton instance
window.modalSystem = new ModalSystem();
