const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Port from Render or default 10000
const port = process.env.PORT || 10000;

// Serve static files
app.use(express.static(__dirname));

// Store messages in memory (simple demo storage)
// Structure: { chatId: [ { sender, text, time } ] }
const chatHistory = {};

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // 1. User joins a specific chat room (based on contact ID)
    socket.on('join', (data) => {
        const { username, chatId } = data;
        socket.join(chatId);
        socket.username = username;
        socket.currentChatId = chatId;
        
        console.log(`${username} joined room ${chatId}`);

        // Send existing history to the new joiner
        if (chatHistory[chatId]) {
            socket.emit('load_history', chatHistory[chatId]);
        }
    });

    // 2. User sends a message
    socket.on('send_message', (data) => {
        const { chatId, text, sender } = data;
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const messageData = { text, sender, time };

        // Save to history
        if (!chatHistory[chatId]) chatHistory[chatId] = [];
        chatHistory[chatId].push(messageData);

        // Broadcast to everyone in this room (including sender)
        io.to(chatId).emit('receive_message', messageData);
        
        console.log(`Message in ${chatId}: ${text}`);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Fallback for routes (SPA handling)
app.get('*', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

server.listen(port, '0.0.0.0', () => {
    console.log(`Neurochat server listening on port ${port}`);
});
