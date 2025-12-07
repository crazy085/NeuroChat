// Authentication Module
class AuthManager {
    constructor() {
        this.token = null;
        this.user = null;
        this.socket = null;
        this.init();
    }

    init() {
        this.checkExistingAuth();
    }

    checkExistingAuth() {
        const savedToken = localStorage.getItem('neurochat_token');
        const savedUser = localStorage.getItem('neurochat_user');
        
        if (savedToken && savedUser) {
            this.token = savedToken;
            this.user = JSON.parse(savedUser);
            this.showApp();
        } else {
            this.showAuth();
        }
    }

    async register(username, email, password) {
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();

            if (response.ok) {
                this.token = data.token;
                this.user = data.user;
                this.saveAuth();
                this.showApp();
                ui.showToast('Successfully joined Neural Network!');
                return { success: true };
            } else {
                ui.showToast(data.error || 'Registration failed');
                return { success: false, error: data.error };
            }
        } catch (error) {
            console.error('Registration error:', error);
            ui.showToast('Network error. Please try again.');
            return { success: false, error: 'Network error' };
        }
    }

    async login(email, password) {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                this.token = data.token;
                this.user = data.user;
                this.saveAuth();
                this.showApp();
                ui.showToast('Connected to Neural Network!');
                return { success: true };
            } else {
                ui.showToast(data.error || 'Login failed');
                return { success: false, error: data.error };
            }
        } catch (error) {
            console.error('Login error:', error);
            ui.showToast('Network error. Please try again.');
            return { success: false, error: 'Network error' };
        }
    }

    logout() {
        this.token = null;
        this.user = null;
        this.clearAuth();
        this.showAuth();
        
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        
        ui.showToast('Disconnected from Neural Network');
    }

    saveAuth() {
        localStorage.setItem('neurochat_token', this.token);
        localStorage.setItem('neurochat_user', JSON.stringify(this.user));
    }

    clearAuth() {
        localStorage.removeItem('neurochat_token');
        localStorage.removeItem('neurochat_user');
    }

    showAuth() {
        document.getElementById('authContainer').classList.remove('hide');
        document.getElementById('appContainer').classList.remove('show');
    }

    showApp() {
        document.getElementById('authContainer').classList.add('hide');
        document.getElementById('appContainer').classList.add('show');
        
        // Initialize the main app
        if (window.app) {
            window.app.initWithAuth(this.token, this.user);
        }
    }

    async updateProfile(status, about) {
        try {
            const response = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ status, about })
            });

            const data = await response.json();

            if (response.ok) {
                this.user = data.user;
                this.saveAuth();
                ui.showToast('Profile updated successfully!');
                return { success: true };
            } else {
                ui.showToast(data.error || 'Update failed');
                return { success: false, error: data.error };
            }
        } catch (error) {
            console.error('Profile update error:', error);
            ui.showToast('Network error. Please try again.');
            return { success: false, error: 'Network error' };
        }
    }

    getAuthHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`
        };
    }

    initializeSocket() {
        if (!this.token) return;

        this.socket = io();
        
        this.socket.on('connect', () => {
            console.log('Socket connected');
            this.socket.emit('authenticate', this.token);
        });

        this.socket.on('authenticated', () => {
            console.log('Socket authenticated');
        });

        this.socket.on('error', (error) => {
            console.error('Socket error:', error);
            ui.showToast('Connection error');
        });

        return this.socket;
    }
}

// Global auth instance
window.auth = new AuthManager();

// Global auth functions for HTML
window.switchToRegister = () => {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
};

window.switchToLogin = () => {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
};

window.handleRegister = async (event) => {
    event.preventDefault();
    
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    
    await auth.register(username, email, password);
};

window.handleLogin = async (event) => {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    await auth.login(email, password);
};

window.logout = () => auth.logout();
window.updateProfile = (event) => {
    event.preventDefault();
    const status = document.getElementById('profileStatus').value;
    const about = document.getElementById('profileAbout').value;
    auth.updateProfile(status, about);
    ui.toggleModal(ui.elements.profileModal);
};
