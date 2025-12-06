// Notification System
class NotificationSystem {
    constructor() {
        this.container = document.getElementById('notificationContainer');
        this.notifications = [];
        this.maxNotifications = 5;
        this.defaultDuration = 5000;
        this.init();
    }

    // Initialize notification system
    init() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'notificationContainer';
            this.container.className = 'notification-container';
            document.body.appendChild(this.container);
        }
        
        // Request notification permission
        this.requestPermission();
    }

    // Request notification permission
    async requestPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            await Notification.requestPermission();
        }
    }

    // Show notification
    show(options) {
        const {
            type = 'info',
            title = 'Notification',
            message = '',
            duration = this.defaultDuration,
            icon = this.getIcon(type),
            desktop = false
        } = options;
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="${icon}"></i>
            <div class="notification-content">
                <div class="notification-title">${title}</div>
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add to container
        this.container.appendChild(notification);
        
        // Add to notifications array
        const notificationData = {
            element: notification,
            id: Helpers.generateId(),
            timestamp: Date.now()
        };
        this.notifications.push(notificationData);
        
        // Limit notifications
        this.limitNotifications();
        
        // Add event listeners
        this.addEventListeners(notification, notificationData);
        
        // Animate in
        setTimeout(() => {
            notification.classList.add('animate-fadeIn');
        }, 10);
        
        // Show desktop notification
        if (desktop && 'Notification' in window && Notification.permission === 'granted') {
            this.showDesktopNotification(title, message, type);
        }
        
        // Auto remove
        if (duration > 0) {
            setTimeout(() => {
                this.remove(notificationData.id);
            }, duration);
        }
        
        return notificationData.id;
    }

    // Get icon for notification type
    getIcon(type) {
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    // Add event listeners
    addEventListeners(notification, notificationData) {
        // Close button
        const closeBtn = notification.querySelector('.notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.remove(notificationData.id);
            });
        }
        
        // Click on notification
        notification.addEventListener('click', () => {
            this.remove(notificationData.id);
        });
    }

    // Remove notification
    remove(notificationId) {
        const index = this.notifications.findIndex(n => n.id === notificationId);
        if (index === -1) return;
        
        const notificationData = this.notifications[index];
        const notification = notificationData.element;
        
        // Animate out
        notification.classList.remove('animate-fadeIn');
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        
        // Remove after animation
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
        
        // Remove from array
        this.notifications.splice(index, 1);
    }

    // Limit notifications
    limitNotifications() {
        if (this.notifications.length > this.maxNotifications) {
            const oldest = this.notifications.shift();
            this.remove(oldest.id);
        }
    }

    // Show desktop notification
    showDesktopNotification(title, message, type) {
        const icon = `/icons/${type}.png`; // You would need to create these icons
        
        const notification = new Notification(title, {
            body: message,
            icon,
            badge: '/icons/badge.png',
            tag: 'neurochat',
            requireInteraction: false
        });
        
        notification.onclick = () => {
            window.focus();
            notification.close();
        };
        
        // Auto close
        setTimeout(() => {
            notification.close();
        }, this.defaultDuration);
    }

    // Show success notification
    success(message, title = 'Success') {
        return this.show({
            type: 'success',
            title,
            message
        });
    }

    // Show error notification
    error(message, title = 'Error') {
        return this.show({
            type: 'error',
            title,
            message,
            duration: 0 // Don't auto-close errors
        });
    }

    // Show warning notification
    warning(message, title = 'Warning') {
        return this.show({
            type: 'warning',
            title,
            message
        });
    }

    // Show info notification
    info(message, title = 'Info') {
        return this.show({
            type: 'info',
            title,
            message
        });
    }

    // Clear all notifications
    clear() {
        this.notifications.forEach(notification => {
            this.remove(notification.id);
        });
    }

    // Show message notification
    showMessage(message, chat) {
        const currentUser = authService.getCurrentUser();
        const isFromMe = message.senderId === currentUser?.id;
        
        if (isFromMe) return;
        
        return this.show({
            type: 'info',
            title: chat.getDisplayName(currentUser.id),
            message: message.getDisplayText(),
            desktop: true
        });
    }
}

// Export singleton instance
window.notificationSystem = new NotificationSystem();
