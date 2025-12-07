const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const validator = require('validator');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "*",
        methods: ["GET", "POST"]
    }
});

// Security middleware
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.static('.'));

// In-memory storage (for demo - replace with MongoDB later)
let users = [];
let messages = [];
let connectedUsers = new Map();

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'neurochat-secret-key-2024';

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// Helper functions
const findUserByEmail = (email) => users.find(user => user.email === email);
const findUserById = (id) => users.find(user => user.id === id);
const findUserByUsername = (username) => users.find(user => user.username === username);
const generateId = () => Math.random().toString(36).substr(2, 9);

// API Routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        message: 'NeuroChat API is running',
        connectedUsers: connectedUsers.size,
        totalUsers: users.length,
        totalMessages: messages.length
    });
});

// User Registration
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validation
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        if (username.length < 3 || username.length > 30) {
            return res.status(400).json({ error: 'Username must be 3-30 characters' });
        }

        // Check if user already exists
        if (findUserByEmail(email) || findUserByUsername(username)) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const user = {
            id: generateId(),
            username,
            email,
            password: hashedPassword,
            avatar: `https://picsum.photos/seed/${username}/200/200`,
            status: 'Active',
            about: 'Exploring neural network',
            isOnline: false,
            lastSeen: new Date(),
            createdAt: new Date()
        };

        users.push(user);

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        console.log(`👤 New user registered: ${username}`);

        res.status(201).json({
            message: 'User created successfully',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                status: user.status
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// User Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user
        const user = findUserByEmail(email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Update last seen
        user.lastSeen = new Date();

        console.log(`🔑 User logged in: ${user.username}`);

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                status: user.status
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get current user info
app.get('/api/user/me', authenticateToken, (req, res) => {
    try {
        const user = findUserById(req.user.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const { password, ...userWithoutPassword } = user;
        res.json({ user: userWithoutPassword });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update user profile
app.put('/api/user/profile', authenticateToken, (req, res) => {
    try {
        const { status, about } = req.body;
        const user = findUserById(req.user.userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (status) user.status = status;
        if (about) user.about = about;

        console.log(`📝 Profile updated: ${user.username}`);

        const { password, ...userWithoutPassword } = user;
        res.json({
            message: 'Profile updated successfully',
            user: userWithoutPassword
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all users (for chat list)
app.get('/api/users', authenticateToken, (req, res) => {
    try {
        const currentUserId = req.user.userId;
        const otherUsers = users
            .filter(user => user.id !== currentUserId)
            .map(({ password, ...userWithoutPassword }) => userWithoutPassword)
            .sort((a, b) => b.isOnline - a.isOnline);

        res.json({ users: otherUsers });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get messages between two users
app.get('/api/messages/:userId', authenticateToken, (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user.userId;

        const userMessages = messages.filter(msg => 
            (msg.sender === currentUserId && msg.receiver === userId) ||
            (msg.sender === userId && msg.receiver === currentUserId)
        ).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        // Mark messages as read
        messages.forEach(msg => {
            if (msg.sender === userId && msg.receiver === currentUserId && !msg.isRead) {
                msg.isRead = true;
                msg.readAt = new Date();
            }
        });

        // Add user info to messages
        const messagesWithUsers = userMessages.map(msg => ({
            ...msg,
            sender: findUserById(msg.sender),
            receiver: findUserById(msg.receiver)
        }));

        res.json({ messages: messagesWithUsers });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// WebSocket connection handling
io.on('connection', (socket) => {
    console.log('🔌 User connected:', socket.id);

    // User authentication
    socket.on('authenticate', (token) => {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            const user = findUserById(decoded.userId);
            
            if (user) {
                socket.userId = user.id;
                socket.username = user.username;
                connectedUsers.set(user.id, socket);
                
                // Update user online status
                user.isOnline = true;
                user.lastSeen = new Date();

                // Broadcast to all users that this user is online
                io.emit('user-online', {
                    userId: user.id,
                    username: user.username
                });

                console.log(`✅ ${user.username} authenticated`);
            }
        } catch (error) {
            console.error('Authentication error:', error);
            socket.disconnect();
        }
    });

    // Send message
    socket.on('send-message', (data) => {
        try {
            if (!socket.userId) {
                return socket.emit('error', 'Not authenticated');
            }

            const { receiverId, content, messageType = 'text' } = data;

            // Create message
            const message = {
                id: generateId(),
                sender: socket.userId,
                receiver: receiverId,
                content,
                messageType,
                isRead: false,
                createdAt: new Date()
            };

            messages.push(message);

            // Add user info
            const messageWithUsers = {
                ...message,
                sender: findUserById(socket.userId),
                receiver: findUserById(receiverId)
            };

            // Send to receiver if online
            const receiverSocket = connectedUsers.get(receiverId);
            if (receiverSocket) {
                receiverSocket.emit('receive-message', messageWithUsers);
            }

            // Send confirmation to sender
            socket.emit('message-sent', messageWithUsers);

            console.log(`📨 Message from ${socket.username} to ${findUserById(receiverId)?.username}`);
        } catch (error) {
            console.error('Send message error:', error);
            socket.emit('error', 'Failed to send message');
        }
    });

    // Typing indicator
    socket.on('typing', (data) => {
        const { receiverId, isTyping } = data;
        const receiverSocket = connectedUsers.get(receiverId);
        
        if (receiverSocket) {
            receiverSocket.emit('user-typing', {
                userId: socket.userId,
                username: socket.username,
                isTyping
            });
        }
    });

    // Disconnect
    socket.on('disconnect', () => {
        if (socket.userId) {
            connectedUsers.delete(socket.userId);
            
            // Update user offline status
            const user = findUserById(socket.userId);
            if (user) {
                user.isOnline = false;
                user.lastSeen = new Date();

                // Broadcast to all users that this user is offline
                io.emit('user-offline', {
                    userId: user.id,
                    username: user.username
                });
            }

            console.log(`❌ ${socket.username} disconnected`);
        }
    });
});

// Serve the main app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🧠 NeuroChat server running on port ${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});
