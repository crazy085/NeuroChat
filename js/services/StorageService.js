// Storage Service - Handles all localStorage operations
class StorageService {
    constructor() {
        this.prefix = 'neurochat_';
    }

    // Save data to localStorage
    save(key, data) {
        try {
            const storageKey = this.prefix + key;
            const serializedData = JSON.stringify(data);
            localStorage.setItem(storageKey, serializedData);
            return true;
        } catch (error) {
            console.error('Storage save error:', error);
            return false;
        }
    }

    // Get data from localStorage
    get(key, defaultValue = null) {
        try {
            const storageKey = this.prefix + key;
            const data = localStorage.getItem(storageKey);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error('Storage get error:', error);
            return defaultValue;
        }
    }

    // Remove data from localStorage
    remove(key) {
        try {
            const storageKey = this.prefix + key;
            localStorage.removeItem(storageKey);
            return true;
        } catch (error) {
            console.error('Storage remove error:', error);
            return false;
        }
    }

    // Clear all app data
    clear() {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.prefix)) {
                    localStorage.removeItem(key);
                }
            });
            return true;
        } catch (error) {
            console.error('Storage clear error:', error);
            return false;
        }
    }

    // Get all app data
    getAll() {
        try {
            const data = {};
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.prefix)) {
                    const cleanKey = key.replace(this.prefix, '');
                    data[cleanKey] = JSON.parse(localStorage.getItem(key));
                }
            });
            return data;
        } catch (error) {
            console.error('Storage getAll error:', error);
            return {};
        }
    }

    // Check if key exists
    exists(key) {
        const storageKey = this.prefix + key;
        return localStorage.getItem(storageKey) !== null;
    }

    // Get storage size
    getSize() {
        let total = 0;
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(this.prefix)) {
                total += localStorage.getItem(key).length;
            }
        });
        return total;
    }
}

// Export singleton instance
window.storageService = new StorageService();
