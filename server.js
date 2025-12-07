const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('.'));

// API Routes
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        message: 'NeuroChat API is running'
    });
});

app.get('/api/users', (req, res) => {
    res.json([
        { id: 1, name: 'Alice Neural', status: 'online' },
        { id: 2, name: 'Bob Synapse', status: 'offline' },
        { id: 3, name: 'Neural Collective', status: 'online' }
    ]);
});

// Serve the main app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🧠 NeuroChat server running on port ${PORT}`);
    console.log(`🌐 Visit: http://localhost:${PORT}`);
});
