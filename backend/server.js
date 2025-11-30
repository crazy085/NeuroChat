const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const { initDB, db } = require('./database');
const { registerUser, loginUser, updateProfile } = require('./auth');
const { createGroup, getGroups } = require('./groups');

const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(express.static(path.join(__dirname, '../frontend')));

initDB();

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'))
});
const upload = multer({ storage });

// API routes
app.post('/api/register', registerUser);
app.post('/api/login', loginUser);
app.post('/api/update-profile', updateProfile);
app.post('/api/group', createGroup);
app.get('/api/groups', getGroups);

// Return user list for contacts/search
app.get('/api/users', (req, res) => {
  const q = req.query.q ? `%${req.query.q}%` : '%';
  db.all('SELECT id, name, avatar, status FROM users WHERE name LIKE ? LIMIT 100', [q], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Upload endpoint returns full absolute URL for uploaded file
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  // Build full URL
  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

// WebSocket chat with private messaging support
// clientsMap: userId -> ws
const clientsMap = new Map();

// Helper to broadcast to all (or with filter)
function broadcast(obj, filterFn = null) {
  const msg = JSON.stringify(obj);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      if (!filterFn || filterFn(client)) client.send(msg);
    }
  });
}

wss.on('connection', ws => {
  // Attach userId to ws after init
  ws.userId = null;

  ws.on('message', message => {
    let data;
    try { data = JSON.parse(message); } catch (e) { return; }

    // init message from client to register userId
    if (data.type === 'init' && data.userId) {
      ws.userId = data.userId;
      clientsMap.set(data.userId, ws);
      // Optionally send a list of online users or confirmation
      ws.send(JSON.stringify({ type: 'init_ok', userId: data.userId }));
      return;
    }

    // Normal chat message
    if (data.type === 'chat') {
      const id = uuidv4();
      const timestamp = Date.now();
      const disappearTime = data.disappearTime || null;
      const sender = data.sender || null;
      const to = data.to || null;       // optional: single user id for private messages
      const groupId = data.groupId || null; // optional: group id
      const content = data.content || '';
      const msgType = data.msgType || (data.content && data.content.startsWith('http') ? 'file' : 'text');

      // Save to DB
      db.run(`INSERT INTO messages (id, sender, groupId, content, type, timestamp, disappearTime)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, sender, groupId, content, msgType, timestamp, disappearTime], err => {
          if (err) console.error('DB save message error:', err.message);
        });

      const payload = { type: 'chat', id, sender, to, groupId, content, msgType, timestamp, disappearTime };

      if (to) {
        // private message: deliver only to target and sender
        const targetWs = clientsMap.get(to);
        const senderWs = ws;
        if (targetWs && targetWs.readyState === WebSocket.OPEN) targetWs.send(JSON.stringify(payload));
        if (senderWs && senderWs.readyState === WebSocket.OPEN) senderWs.send(JSON.stringify(payload));
      } else if (groupId) {
        // For group messages broadcast to all (clients can filter by groupId)
        broadcast(payload);
      } else {
        // public room broadcast
        broadcast(payload);
      }

      // Schedule delete if disappearTime given
      if (disappearTime) {
        setTimeout(() => {
          db.run('DELETE FROM messages WHERE id=?', [id], err => {
            if (err) console.error('DB delete message error:', err.message);
            // notify clients to remove message
            broadcast({ type: 'delete', id });
          });
        }, disappearTime * 1000);
      }
    }
  });

  ws.on('close', () => {
    if (ws.userId) clientsMap.delete(ws.userId);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`NeuroChat running on port ${PORT}`));
