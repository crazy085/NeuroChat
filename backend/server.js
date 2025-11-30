const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');

const { initDB } = require('./database');
const { registerUser, loginUser } = require('./auth');
const { createGroup, getGroups } = require('./groups');
const { sendNotification } = require('./notifications');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(express.static(path.join(__dirname, '../frontend')));

// Initialize DB
initDB();

// File upload setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Routes
app.post('/api/register', registerUser);
app.post('/api/login', loginUser);
app.post('/api/group', createGroup);
app.get('/api/groups', getGroups);
app.post('/api/upload', upload.single('file'), (req, res) => {
  res.json({ url: `/uploads/${req.file.filename}` });
});

// WebSocket chat
let clients = [];
wss.on('connection', ws => {
  clients.push(ws);
  ws.on('message', msg => {
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) client.send(msg);
    });
  });
  ws.on('close', () => {
    clients = clients.filter(c => c !== ws);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`NeuroChat running on port ${PORT}`));
