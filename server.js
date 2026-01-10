const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Middleware to parse JSON
app.use(express.json());

// Static Files
app.use(express.static(__dirname));

// --- IN-MEMORY DATABASE (For Demo Purposes) ---
// In a production app, you would use MongoDB or PostgreSQL here.
const users = {}; 
const chatHistory = {};

// --- AUTH ROUTES ---

// Register Route
app.post('/register', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: "Username and password required" });
    }

    if (users[username]) {
        return res.status(409).json({ success: false, message: "Username already taken" });
    }

    // Store user
    users[username] = { password: password };
    console.log(`User registered: ${username}`);
    
    res.json({ success: true, message: "Registration successful. Please login." });
});

// Login Route
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!users[username] || users[username].password !== password) {
        return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    res.json({ success: true, message: "Login successful", username });
});

// --- SOCKET.IO LOGIC ---

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join', (data) => {
        const { username, chatId } = data;
        socket.join(chatId);
        socket.username = username;
        socket.currentChatId = chatId;
        
        console.log(`${username} joined room ${chatId}`);

        // Send existing history to the joiner
        if (chatHistory[chatId]) {
            socket.emit('load_history', chatHistory[chatId]);
        } else {
            // Initialize history if empty
            chatHistory[chatId] = [];
        }
    });

    socket.on('send_message', (data) => {
        const { chatId, text, sender } = data;
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const messageData = { text, sender, time };

        // Save to history
        if (!chatHistory[chatId]) chatHistory[chatId] = [];
        chatHistory[chatId].push(messageData);

        // Broadcast to everyone in this room
        io.to(chatId).emit('receive_message', messageData);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Fallback for SPA
app.get('*', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

const port = process.env.PORT || 10000;
server.listen(port, '0.0.0.
