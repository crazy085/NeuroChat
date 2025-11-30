const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./chat.db');

function initDB() {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      password TEXT,
      avatar TEXT,
      status TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS groups (
      id TEXT PRIMARY KEY,
      name TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS group_members (
      id TEXT PRIMARY KEY,
      groupId TEXT,
      userId TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      sender TEXT,
      groupId TEXT,
      content TEXT,
      type TEXT,
      timestamp INTEGER,
      disappearTime INTEGER
    )`);
  });
}

module.exports = { db, initDB };
