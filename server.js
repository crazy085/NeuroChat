const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
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

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/neurochat', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('🗄️ Connected to MongoDB');
}).catch(err => {
    console.error('❌ MongoDB connection error:', err);
});

// User Schema
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 30
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Invalid email']
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    avatar: {
        type: String,
        default: function() {
            return `https://picsum.photos/seed/${this.username}/200/200`;
        }
    },
    status: {
        type: String,
        default: 'Active',
        enum: ['Active', 'Away', 'Busy', 'Offline']
    },
    about: {
        type: String,
        default: 'Exploring the neural network',
        maxlength: 200
    },
    isOnline: {
        type: Boolean,
        default: false
    },
    lastSeen: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Message Schema
const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true,
        maxlength: 1000
    },
    messageType: {
        type: String,
        default: 'text',
        enum: ['text', 'image', 'file']
    },
    isRead: {
        type: Boolean,
        default: false
    },
    readAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Chat Schema (for tracking conversations)
const chatSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    },
    unreadCount: {
        type: Map,
        of: Number,
        default: {}
    }
}, {
    timestamps: true
});

const User = mongoose.model('User', userSchema);
const Message = mongoose.model('Message', messageSchema);
const Chat = mongoose.model('Chat', chatSchema);

// Store connected users
const connectedUsers = new Map();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret', (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// API Routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        message: 'NeuroChat API is running',
        connectedUsers: connectedUsers.size
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

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const user = new User({
            username,
            email,
            password: hashedPassword
        });

        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, username: user.username },
            process.env.JWT_SECRET || 'fallback-secret',
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'User created successfully',
            token,
            user: {
                id: user._id,
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
        const user = await User.findOne({ email });
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
            { userId: user._id, username: user.username },
            process.env.JWT_SECRET || 'fallback-secret',
            { expiresIn: '7d' }
        );

        // Update last seen
        user.lastSeen = new Date();
        await user.save();

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
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
app.get('/api/user/me', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ user });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update user profile
app.put('/api/user/profile', authenticateToken, async (req, res) => {
    try {
        const { status, about } = req.body;
        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (status) user.status = status;
        if (about) user.about = about;

        await user.save();

        res.json({
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                status: user.status,
                about: user.about
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all users (for chat list)
app.get('/api/users', authenticateToken, async (req, res) => {
    try {
        const users = await User.find({ _id: { $ne: req.user.userId } })
            .select('username avatar status isOnline lastSeen')
            .sort({ isOnline: -1, lastSeen: -1 });

        res.json({ users });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get messages between two users
app.get('/api/messages/:userId', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user.userId;

        const messages = await Message.find({
            $or: [
                { sender: currentUserId, receiver: userId },
                { sender: userId, receiver: currentUserId }
            ]
        })
        .populate('sender', 'username avatar')
        .populate('receiver', 'username avatar')
        .sort({ createdAt: 1 });

        // Mark messages as read
        await Message.updateMany(
            { sender: userId, receiver: currentUserId, isRead: false },
            { isRead: true, readAt: new Date() }
        );

        res.json({ messages });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// WebSocket connection handling
io.on('connection', (socket) => {
    console.log('🔌 User connected:', socket.id);

    // User authentication
    socket.on('authenticate', async (token) => {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
            const user = await User.findById(decoded.userId);
            
            if (user) {
                socket.userId = user._id;
                socket.username = user.username;
                connectedUsers.set(user._id.toString(), socket);
                
                // Update user online status
                user.isOnline = true;
                user.lastSeen = new Date();
                await user.save();

                // Broadcast to all users that this user is online
                io.emit('user-online', {
                    userId: user._id,
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
    socket.on('send-message', async (data) => {
        try {
            if (!socket.userId) {
                return socket.emit('error', 'Not authenticated');
            }

            const { receiverId, content, messageType = 'text' } = data;

            // Create and save message
            const message = new Message({
                sender: socket.userId,
                receiver: receiverId,
                content,
                messageType
            });

            await message.save();
            await message.populate('sender', 'username avatar');
            await message.populate('receiver', 'username avatar');

            // Send to receiver if online
            const receiverSocket = connectedUsers.get(receiverId);
            if (receiverSocket) {
                receiverSocket.emit('receive-message', message);
            }

            // Send confirmation to sender
            socket.emit('message-sent', message);

            console.log(`📨 Message from ${socket.username} to ${receiverId}`);
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
    socket.on('disconnect', async () => {
        if (socket.userId) {
            connectedUsers.delete(socket.userId.toString());
            
            // Update user offline status
            await User.findByIdAndUpdate(socket.userId, {
                isOnline: false,
                lastSeen: new Date()
            });

            // Broadcast to all users that this user is offline
            io.emit('user-offline', {
                userId: socket.userId,
                username: socket.username
            });

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
});
