const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./database');
const { calculateScore } = require('./scoring');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve static frontend files from root
app.use(express.static(path.join(__dirname, '..')));

// ===== API ROUTES =====

// GET /api/batches - Get all active batches
app.get('/api/batches', async (req, res) => {
  try {
    const batches = await db.allAsync(
      'SELECT * FROM batches WHERE isActive = 1 ORDER BY startTime DESC'
    );
    
    // Enrich with pH logs
    const enrichedBatches = await Promise.all(
      batches.map(async (batch) => {
        const phLogs = await db.allAsync(
          'SELECT * FROM pH_logs WHERE batchId = ? ORDER BY time ASC',
          [batch.id]
        );
        return { ...batch, phLogs };
      })
    );

    res.json(enrichedBatches);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/history - Get all archived batches
app.get('/api/history', async (req, res) => {
  try {
    const history = await db.allAsync(
      'SELECT * FROM history ORDER BY archivedAt DESC'
    );
    res.json(history);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/batches - Create a new batch
app.post('/api/batches', async (req, res) => {
  try {
    console.log('POST /api/batches - Request received:', req.body);
    const { stgNum, startTime } = req.body;

    if (!stgNum) {
      return res.status(400).json({ error: 'stgNum is required' });
    }

    const ts = startTime || Date.now();
    const d = new Date(ts);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');

    const id = `STG${stgNum}_${hh}:${mm}`;
    const name = `STG ${stgNum}`;
    const now = Date.now();

    await db.runAsync(
      `INSERT INTO batches (id, name, stgNum, startTime, isActive, createdAt)
       VALUES (?, ?, ?, ?, 1, ?)`,
      [id, name, stgNum, ts, now]
    );

    console.log('Batch created successfully:', id);
    res.json({ id, name, stgNum, startTime: ts, phLogs: [] });
  } catch (err) {
    console.error('Error creating batch:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/batches/:id/ph - Add pH log to a batch
app.post('/api/batches/:id/ph', async (req, res) => {
  try {
    const { id: batchId } = req.params;
    const { ph, sensory, time } = req.body;

    if (ph === undefined || sensory === undefined || time === undefined) {
      return res.status(400).json({ error: 'ph, sensory, and time are required' });
    }

    const batch = await db.getAsync('SELECT * FROM batches WHERE id = ?', [batchId]);
    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    const now = Date.now();
    await db.runAsync(
      `INSERT INTO pH_logs (batchId, ph, sensory, time, createdAt)
       VALUES (?, ?, ?, ?, ?)`,
      [batchId, Number(ph), sensory, time, now]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/batches/:id/confirm - Confirm and archive a batch
app.post('/api/batches/:id/confirm', async (req, res) => {
  try {
    const { id: batchId } = req.params;

    const batch = await db.getAsync('SELECT * FROM batches WHERE id = ?', [batchId]);
    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    // Get pH logs for scoring
    const phLogs = await db.allAsync(
      'SELECT * FROM pH_logs WHERE batchId = ? ORDER BY time ASC',
      [batchId]
    );

    // Calculate final score
    const { score: finalScore } = calculateScore(batch, phLogs);

    // Archive to history
    const confirmTime = Date.now();
    const now = Date.now();

    await db.runAsync(
      `INSERT INTO history (id, name, stgNum, startTime, confirmTime, finalScore, archivedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [batch.id, batch.name, batch.stgNum, batch.startTime, confirmTime, finalScore, now]
    );

    // Deactivate from active batches
    await db.runAsync('UPDATE batches SET isActive = 0 WHERE id = ?', [batchId]);

    res.json({ success: true, finalScore });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/history - Clear all history
app.delete('/api/history', async (req, res) => {
  try {
    await db.runAsync('DELETE FROM history');
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/state - Get complete application state (for compatibility)
app.get('/api/state', async (req, res) => {
  try {
    const batches = await db.allAsync(
      'SELECT * FROM batches WHERE isActive = 1 ORDER BY startTime DESC'
    );
    
    const enrichedBatches = await Promise.all(
      batches.map(async (batch) => {
        const phLogs = await db.allAsync(
          'SELECT * FROM pH_logs WHERE batchId = ? ORDER BY time ASC',
          [batch.id]
        );
        return { ...batch, phLogs };
      })
    );

    const history = await db.allAsync(
      'SELECT * FROM history ORDER BY archivedAt DESC'
    );

    res.json({
      batches: enrichedBatches,
      history: history
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ===== SERVER STARTUP =====

async function startServer() {
  try {
    await db.initializeDatabase();
    console.log('Database initialized');

    app.listen(PORT, () => {
      console.log(`Santan Demo server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
