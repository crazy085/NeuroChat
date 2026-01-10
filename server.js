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

// --- IN-MEMORY DATABASE ---
const users = {}; 
const chatHistory = {};

// --- AUTH ROUTES ---

app.post('/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ success: false, message: "Username and password required" });
    if (users[username]) return res.status(409).json({ success: false, message: "Username already taken" });

    users[username] = { password: password };
    console.log(`User registered: ${username}`);
    res.json({ success: true, message: "Registration successful." });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (!users[username] || users[username].password !== password) {
        return res.status(401).json({ success: false, message: "Invalid credentials" });
    }
    res.json({ success: true, username });
});

// NEW: Get list of registered users (for searching)
app.get('/users', (req, res) => {
    // Return just the usernames (keys of the users object)
    const userList = Object.keys(users);
    res.json({ users: userList });
});

// --- SOCKET.IO LOGIC ---

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // User joins a specific private chat room
    socket.on('join', (data) => {
        const { username, chatId } = data;
        socket.join(chatId);
        socket.username = username;
        socket.currentChatId = chatId;
        
        console.log(`${username} joined private chat: ${chatId}`);

        // Send history
        if (chatHistory[chatId]) {
            socket.emit('load_history', chatHistory[chatId]);
        } else {
            chatHistory[chatId] = [];
        }
    });

    socket.on('send_message', (data) => {
        const { chatId, text, sender } = data;
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const messageData = { text, sender, time };

        // Save history
        if (!chatHistory[chatId]) chatHistory[chatId] = [];
        chatHistory[chatId].push(messageData);

        // Broadcast only to the specific private room
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
server.listen(port, '0.0.0.0', () => {
    console.log(`Neurochat Private Server listening on port ${port}`);
});
