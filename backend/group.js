const { db } = require('./database');
const { v4: uuidv4 } = require('uuid');

function createGroup(req, res) {
  const { name } = req.body;
  const id = uuidv4();
  db.run('INSERT INTO groups (id, name) VALUES (?, ?)', [id, name], err => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id, name });
  });
}

function getGroups(req, res) {
  db.all('SELECT * FROM groups', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
}

module.exports = { createGroup, getGroups };
