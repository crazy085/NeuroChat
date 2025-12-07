// Storage Management Module
class StorageManager {
    constructor() {
        this.keys = {
            chats: 'neurochats',
            messages: 'neuromessages',
            profile: 'neuroprofile',
            theme: 'neurotheme',
            settings: 'neurosettings'
        };
    }

    // Load data from localStorage
    load(key) {
        try {
            const data = localStorage.getItem(this.keys[key]);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error(`Error loading ${key}:`, error);
            return null;
        }
    }

    // Save data to localStorage
    save(key, data) {
        try {
            localStorage.setItem(this.keys[key], JSON.stringify(data));
            return true;
        } catch (error) {
            console.error(`Error saving ${key}:`, error);
            return false;
        }
    }

    // Remove data from localStorage
    remove(key) {
        try {
            localStorage.removeItem(this.keys[key]);
            return true;
        } catch (error) {
            console.error(`Error removing ${key}:`, error);
            return false;
        }
    }

    // Clear all data
    clear() {
        try {
            Object.values(this.keys).forEach(key => {
                localStorage.removeItem(key);
            });
            return true;
        } catch (error) {
            console.error('Error clearing storage:', error);
            return false;
        }
    }

    // Get storage size
    getSize() {
        let total = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                total += localStorage[key].length;
            }
        }
        return (total / 1024).toFixed(2) + ' KB';
    }
}

// Export for use in other modules
window.storage = new StorageManager();
