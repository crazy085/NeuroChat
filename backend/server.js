const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const { initDB } = require('./database');
const { registerUser, loginUser, updateProfile } = require('./auth');
const { createGroup, getGroups } = require('./groups');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(express.static(path.join(__dirname, '../frontend')));

initDB();

// File upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

app.post('/api/register', registerUser);
app.post('/api/login', loginUser);
app.post('/api/update-profile', updateProfile);
app.post('/api/group', createGroup);
app.get('/api/groups', getGroups);
app.post('/api/upload', upload.single('file'), (req, res) => {
  res.json({ url: `/uploads/${req.file.filename}` });
});

// WebSocket chat
const clients = [];
const { db } = require('./database');
const { v4: uuidv4 } = require('uuid');

wss.on('connection', ws => {
  clients.push(ws);
  ws.on('message', msg => {
    const data = JSON.parse(msg);
    const id = uuidv4();
    const timestamp = Date.now();
    const disappearTime = data.disappearTime || null;

    db.run(`INSERT INTO messages (id, sender, groupId, content, type, timestamp, disappearTime)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, data.sender, data.groupId || null, data.content, data.type || 'text', timestamp, disappearTime]);

    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) client.send(JSON.stringify({ id, ...data, timestamp, disappearTime }));
    });

    if (disappearTime) {
      setTimeout(() => {
        db.run('DELETE FROM messages WHERE id=?', [id]);
        clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) client.send(JSON.stringify({ id, deleted: true }));
        });
      }, disappearTime * 1000);
    }
  });

  ws.on('close', () => {
    clients.splice(clients.indexOf(ws), 1);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`NeuroChat running on port ${PORT}`));
