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
