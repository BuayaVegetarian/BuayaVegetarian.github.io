const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'santan.db');

let db = null;

function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        reject(err);
        return;
      }

      // Create tables
      db.serialize(() => {
        // Batches table
        db.run(`
          CREATE TABLE IF NOT EXISTS batches (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            stgNum TEXT NOT NULL,
            startTime INTEGER NOT NULL,
            confirmTime INTEGER,
            finalScore REAL,
            isActive INTEGER DEFAULT 1,
            createdAt INTEGER NOT NULL
          )
        `);

        // pH Logs table
        db.run(`
          CREATE TABLE IF NOT EXISTS pH_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            batchId TEXT NOT NULL,
            ph REAL NOT NULL,
            sensory TEXT NOT NULL,
            time INTEGER NOT NULL,
            createdAt INTEGER NOT NULL,
            FOREIGN KEY (batchId) REFERENCES batches(id) ON DELETE CASCADE
          )
        `);

        // History table (archived batches)
        db.run(`
          CREATE TABLE IF NOT EXISTS history (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            stgNum TEXT NOT NULL,
            startTime INTEGER NOT NULL,
            confirmTime INTEGER NOT NULL,
            finalScore REAL NOT NULL,
            archivedAt INTEGER NOT NULL
          )
        `);
      });
      
      // Wait for all tables to be created
      db.all("SELECT name FROM sqlite_master WHERE type='table'", (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(db);
        }
      });
    });
  });
}

function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function getAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function allAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

module.exports = {
  initializeDatabase,
  getDatabase,
  runAsync,
  getAsync,
  allAsync
};
