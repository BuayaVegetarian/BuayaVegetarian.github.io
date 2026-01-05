# Santan STG Priority Decision Support Demo

A web application for managing batch prioritization based on pH monitoring and risk scoring.

## Project Structure

```
santan-demo/
├── frontend/              # Frontend static files
│   ├── index.html        # Main HTML page
│   ├── css/
│   │   └── style.css     # Styling
│   └── js/
│       ├── app.js        # Application initialization
│       ├── state.js      # State management & API calls
│       ├── ui.js         # UI rendering functions
│       └── scoring.js    # (Client-side copy - validation only)
├── backend/              # Node.js/Express backend
│   ├── server.js         # Main server & API routes
│   ├── database.js       # SQLite3 database management
│   ├── scoring.js        # Scoring algorithm
│   └── santan.db         # SQLite database (created on first run)
├── package.json          # Node dependencies
└── README.md            # This file
```

## Features

- **Batch Management**: Create and track fermentation batches (STG 01-06)
- **pH Monitoring**: Log pH measurements with sensory assessments
- **Dynamic Prioritization**: Automatic priority scoring based on pH trends and batch age
- **Risk Assessment**: Hard gates and soft scoring for proactive QA decisions
- **History Tracking**: Archive and review processed batches

## Setup & Installation

### Prerequisites
- Node.js 14+ and npm
- Windows, macOS, or Linux

### Installation Steps

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the server**:
   ```bash
   npm start
   ```

3. **Open the application**:
   - Navigate to `http://localhost:3000` in your web browser
   - The database will be auto-initialized on first run

## API Endpoints

All endpoints require JSON request/response bodies.

### Batches
- `GET /api/batches` - Get all active batches
- `POST /api/batches` - Create a new batch
  - Body: `{ stgNum: "01", startTime?: number }`
- `POST /api/batches/:id/ph` - Add pH log to batch
  - Body: `{ ph: number, sensory: "NORMAL"|"ABNORMAL", time: number }`
- `POST /api/batches/:id/confirm` - Confirm and archive batch
  - Returns: `{ success: true, finalScore: number }`

### History
- `GET /api/history` - Get all archived batches
- `DELETE /api/history` - Clear all history

### State
- `GET /api/state` - Get complete application state (batches + history)

## Scoring Algorithm

The priority system uses a multi-factor risk assessment:

### Hard Gates (Immediate Fail/Hold)
- Sensory assessment = "ABNORMAL" → **HOLD** (score: 999)
- pH > 6.40 → **HOLD** (score: 999)
- pH ≤ 5.90 → **URGENT** (score: 1.0)

### Soft Scoring (0.0 - 0.999)
Combines three normalized factors:
1. **Age Severity**: Batch age over 6-hour horizon
2. **pH Severity**: Deviation from safe pH zones
3. **Velocity Risk**: Rate of pH change over time

The algorithm adjusts weighting based on pH zones:
- **Safe Zone** (pH > 6.05): 60% age + 40% pH
- **Caution Zone** (6.05 ≥ pH > 5.95): 70% pH + 30% age  
- **Risk Zone** (pH ≤ 5.95): 80% pH + 20% age

### Ranking
Batches are ranked by:
1. Score (descending - highest priority first)
2. Start time (ascending - FEFO for tied scores)
3. Batch ID (alphabetical for absolute tiebreaker)

## Database Schema

### batches
- `id` (TEXT, PRIMARY KEY): Unique batch identifier
- `name` (TEXT): Display name (e.g., "STG 01")
- `stgNum` (TEXT): STG number (01-06)
- `startTime` (INTEGER): Batch creation timestamp
- `confirmTime` (INTEGER): When batch was confirmed/archived
- `finalScore` (REAL): Final priority score
- `isActive` (INTEGER): 1 = active, 0 = archived
- `createdAt` (INTEGER): Server-side creation timestamp

### pH_logs
- `id` (INTEGER, PRIMARY KEY): Auto-increment
- `batchId` (TEXT, FK): Foreign key to batches
- `ph` (REAL): pH measurement value
- `sensory` (TEXT): "NORMAL" or "ABNORMAL"
- `time` (INTEGER): Measurement timestamp
- `createdAt` (INTEGER): Server-side creation timestamp

### history
- `id` (TEXT, PRIMARY KEY): Unique batch identifier
- `name` (TEXT): Display name
- `stgNum` (TEXT): STG number
- `startTime` (INTEGER): Original start time
- `confirmTime` (INTEGER): Confirmation timestamp
- `finalScore` (REAL): Final score
- `archivedAt` (INTEGER): Archive timestamp

## Development

### Running in development mode (with auto-reload)
```bash
npm run dev
```

This requires `nodemon` to be installed (already in devDependencies).

### Project Files

**Frontend** (`frontend/js/`):
- `state.js` - API client & state synchronization
- `ui.js` - DOM rendering & event handlers
- `app.js` - Application initialization
- `scoring.js` - Client-side copy of scoring logic (for reference)

**Backend** (`backend/`):
- `server.js` - Express app & route definitions
- `database.js` - SQLite3 wrapper with async helpers
- `scoring.js` - Core priority scoring logic

## Performance Notes

- SQLite database handles all persistent storage
- API responses include full batch data with pH logs for consistency
- Frontend state mirrors backend state after each operation
- No caching - always fresh data from server

## License

ISC
