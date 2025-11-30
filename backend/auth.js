const { db } = require('./database');
const { v4: uuidv4 } = require('uuid');

function registerUser(req, res) {
  const { name, password } = req.body;
  const id = uuidv4();
  db.run('INSERT INTO users (id, name, password) VALUES (?, ?, ?)', [id, name, password], err => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id, name });
  });
}

function loginUser(req, res) {
  const { name, password } = req.body;
  db.get('SELECT * FROM users WHERE name=? AND password=?', [name, password], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(401).json({ error: 'Invalid credentials' });
    res.json(row);
  });
}

module.exports = { registerUser, loginUser };
