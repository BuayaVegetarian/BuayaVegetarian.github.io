const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'santan.db');

let db = null;

function initializeDatabase() {
  return new Promise((resolve, reject) => {
    console.log('Opening database:', DB_PATH);
    
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Failed to open database:', err);
        reject(err);
        return;
      }

      console.log('Database connection opened');
      
      // Set timeout for busy database
      db.configure('busyTimeout', 10000);
      
      // Create tables one by one (not using serialize)
      createTables()
        .then(() => {
          console.log('All tables initialized');
          resolve(db);
        })
        .catch((err) => {
          console.error('Failed to create tables:', err);
          reject(err);
        });
    });
  });
}

async function createTables() {
  const tables = [
    {
      name: 'batches',
      sql: `CREATE TABLE IF NOT EXISTS batches (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        stgNum TEXT NOT NULL,
        startTime INTEGER NOT NULL,
        confirmTime INTEGER,
        finalScore REAL,
        isActive INTEGER DEFAULT 1,
        createdAt INTEGER NOT NULL
      )`
    },
    {
      name: 'pH_logs',
      sql: `CREATE TABLE IF NOT EXISTS pH_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        batchId TEXT NOT NULL,
        ph REAL NOT NULL,
        sensory TEXT NOT NULL,
        time INTEGER NOT NULL,
        createdAt INTEGER NOT NULL,
        FOREIGN KEY (batchId) REFERENCES batches(id) ON DELETE CASCADE
      )`
    },
    {
      name: 'history',
      sql: `CREATE TABLE IF NOT EXISTS history (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        stgNum TEXT NOT NULL,
        startTime INTEGER NOT NULL,
        confirmTime INTEGER NOT NULL,
        finalScore REAL NOT NULL,
        archivedAt INTEGER NOT NULL
      )`
    }
  ];

  for (const table of tables) {
    await new Promise((resolve, reject) => {
      db.run(table.sql, (err) => {
        if (err) {
          console.error(`Error creating ${table.name}:`, err);
          reject(err);
        } else {
          console.log(`✓ Created table: ${table.name}`);
          resolve();
        }
      });
    });
  }
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
