const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// API Routes
app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/api/users', (req, res) => {
    res.json([
        { id: 1, name: 'Alice Neural', status: 'online' },
        { id: 2, name: 'Bob Synapse', status: 'offline' },
        { id: 3, name: 'Neural Collective', status: 'online' }
    ]);
});

// WebSocket connection handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    socket.on('join-room', (roomId) => {
        socket.join(roomId);
        socket.to(roomId).emit('user-joined', socket.id);
    });
    
    socket.on('send-message', (data) => {
        socket.to(data.room).emit('receive-message', {
            id: Date.now(),
            text: data.message,
            sender: data.sender,
            timestamp: new Date().toISOString()
        });
    });
    
    socket.on('typing', (data) => {
        socket.to(data.room).emit('user-typing', data.user);
    });
    
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Serve the main app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`NeuroChat server running on port ${PORT}`);
});
