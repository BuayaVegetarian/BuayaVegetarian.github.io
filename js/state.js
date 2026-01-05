const API_BASE = 'http://localhost:3000/api';

let state = {
  batches: [],
  history: []
};

// Load initial state from server
async function loadState() {
  try {
    const response = await fetch(`${API_BASE}/state`);
    if (response.ok) {
      state = await response.json();
      renderAll();
    }
  } catch (err) {
    console.error('Failed to load state:', err);
  }
}

async function createBatch(stgNum, startTime) {
  try {
    const ts = typeof startTime === "number" ? startTime : Date.now();

    const response = await fetch(`${API_BASE}/batches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stgNum, startTime: ts })
    });

    if (response.ok) {
      const batch = await response.json();
      state.batches.push(batch);
      renderAll();
    } else {
      alert('Failed to create batch');
    }
  } catch (err) {
    console.error('Failed to create batch:', err);
    alert('Error creating batch: ' + err.message);
  }
}

async function addPH(batchId, ph, sensory, time) {
  try {
    const response = await fetch(`${API_BASE}/batches/${batchId}/ph`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ph: Number(ph), sensory, time })
    });

    if (response.ok) {
      // Refresh batch data
      const batchesResponse = await fetch(`${API_BASE}/batches`);
      const batches = await batchesResponse.json();
      state.batches = batches;
      renderAll();
    } else {
      alert('Failed to add pH log');
    }
  } catch (err) {
    console.error('Failed to add pH log:', err);
    alert('Error adding pH log: ' + err.message);
  }
}

async function confirmBatch(batchId, finalScore) {
  try {
    const response = await fetch(`${API_BASE}/batches/${batchId}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.ok) {
      // Refresh all data
      const stateResponse = await fetch(`${API_BASE}/state`);
      state = await stateResponse.json();
      renderAll();
    } else {
      alert('Failed to confirm batch');
    }
  } catch (err) {
    console.error('Failed to confirm batch:', err);
    alert('Error confirming batch: ' + err.message);
  }
}

async function clearHistory() {
  try {
    const response = await fetch(`${API_BASE}/history`, {
      method: 'DELETE'
    });

    if (response.ok) {
      state.history = [];
      renderAll();
    } else {
      alert('Failed to clear history');
    }
  } catch (err) {
    console.error('Failed to clear history:', err);
    alert('Error clearing history: ' + err.message);
  }
}
