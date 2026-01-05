function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleString();
}

function renderCollectionPage() {
  const section = document.getElementById("page-collection");


  section.innerHTML = `
    <div class="card">
      <h3>Create New Batch</h3>
      <div class="form-group">
        <label>Batch Name</label>
        <select id="stgSelect">
          <option value="01">STG 01</option>
          <option value="02">STG 02</option>
          <option value="03">STG 03</option>
          <option value="04">STG 04</option>
          <option value="05">STG 05</option>
          <option value="06">STG 06</option>
        </select>
      </div>

      <div class="form-group">
        <label>Start Time (jam:menit)</label>
        <input type="time" id="startTime">
      </div>

      <button class="primary" onclick="handleCreateBatch()" style="width: 100%; padding: 12px 16px; font-weight: 600;">Create Batch</button>
    </div>

    <div class="card">
      <h3>Active Batches</h3>
      <table>
        <thead>
          <tr>
            <th>Batch</th>
            <th>Tank</th>
            <th>Start Time</th>
            <th>pH Logs</th>
          </tr>
        </thead>
        <tbody>
          ${
            state.batches.map(b => `
              <tr>
                <td>${b.id}</td>
                <td>${b.name}</td>
                <td>${formatTime(b.startTime)}</td>
                <td>${b.phLogs.length}</td>
              </tr>
            `).join("")
          }
        </tbody>
      </table>
    </div>
  `;
}

function renderQaPage() {
  const section = document.getElementById("page-qa");

  section.innerHTML = `
    <div class="card">
      <h3>QA – pH Input</h3>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Batch</th>
              <th>Tank</th>
              <th>pH</th>
              <th>Sensory</th>
              <th>Time</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${
              state.batches.map(b => `
                <tr>
                  <td>${b.id}</td>
                  <td>${b.name}</td>
                  <td>
                    <input type="number" step="0.01" id="ph-${b.id}" placeholder="e.g. 5.95">
                  </td>
                  <td>
                    <select id="sens-${b.id}">
                      <option value="NORMAL">NORMAL</option>
                      <option value="ABNORMAL">ABNORMAL</option>
                    </select>
                  </td>
                  <td>
                    <input type="datetime-local" id="time-${b.id}">
                  </td>
                  <td>
                    <button class="primary" onclick="handleAddPH('${b.id}')">
                      Submit
                    </button>
                  </td>
                </tr>
              `).join("")
            }
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderPriorityPage() {
  const section = document.getElementById("page-priority");

  const ranked = state.batches
    .map(b => {
      const scoreResult = calculateScore(b);
      return { ...b, score: scoreResult.score, rankKey: scoreResult.rankKey };
    })
    .sort((a, b) => {
      // Primary: score (desc)
      if (b.score !== a.score) return b.score - a.score;
      // Tie-breaker 1: older startTime first (asc)
      if (a.startTime !== b.startTime) return a.startTime - b.startTime;
      // Tie-breaker 2: stable id ordering
      return a.id.localeCompare(b.id);
    });

  section.innerHTML = `
    <div class="card">
      <h3>Priority Board</h3>

      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Batch</th>
            <th>Tank</th>
            <th>Age (h)</th>
            <th>Last pH</th>
            <th>Score</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${
            ranked.map((b, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${b.id}</td>
                <td>${b.name}</td>
                <td>${((Date.now() - b.startTime)/3600000).toFixed(2)}</td>
                <td>${b.phLogs.at(-1)?.ph ?? "-"}</td>
                <td>${b.score}</td>
                <td>
                  <button class="primary"
                    onclick="handleConfirm('${b.id}')">
                    Confirm
                  </button>
                </td>
              </tr>
            `).join("")
          }
        </tbody>
      </table>
    </div>
  `;
}

function renderHistoryPage() {
  const section = document.getElementById("page-history");

  // Group history by STG name
  const grouped = state.history.reduce((acc, item) => {
    const key = item.name || item.id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  let html = `
    <div class="card">
      <h3>Processed Batches</h3>
      ${state.history.length > 0 ? `<button class="danger" onclick="handleClearHistory()">Delete All History</button>` : ""}
  `;

  if (state.history.length === 0) {
    html += `<p>No processed batches yet.</p>`;
  } else {
    Object.keys(grouped).forEach(stgName => {
      html += `
        <h4>${stgName} (${grouped[stgName].length})</h4>
        <table>
          <thead>
            <tr>
              <th>Batch</th>
              <th>Start</th>
              <th>Confirmed</th>
              <th>Final Score</th>
            </tr>
          </thead>
          <tbody>
            ${grouped[stgName].map(b => `
              <tr>
                <td>${b.id}</td>
                <td>${formatTime(b.startTime)}</td>
                <td>${formatTime(b.confirmTime)}</td>
                <td>${b.finalScore}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      `;
    });
  }

  html += `</div>`;

  section.innerHTML = html;
}

// ----- Global handlers used by inline onclicks -----
function handleCreateBatch() {
  const stgNum = document.getElementById("stgSelect")?.value || "01";
  const timeVal = document.getElementById("startTime")?.value;
  let startTs = Date.now();
  if (timeVal) {
    const [hh, mm] = timeVal.split(":");
    const d = new Date();
    d.setHours(Number(hh), Number(mm), 0, 0);
    startTs = d.getTime();
  }
  createBatch(stgNum, startTs);
  renderAll();
}

function handleAddPH(batchId) {
  const phEl = document.getElementById(`ph-${batchId}`);
  const sensEl = document.getElementById(`sens-${batchId}`);
  const timeEl = document.getElementById(`time-${batchId}`);

  const batch = state.batches.find(b => b.id === batchId);
  if (!batch) return;

  // Require time input
  if (!timeEl || !timeEl.value) {
    alert("Please input Time before submitting pH.");
    return;
  }

  const ph = phEl ? phEl.value : "";
  if (ph === "" || isNaN(Number(ph))) {
    alert("Please enter a valid pH value.");
    return;
  }

  const sensory = sensEl ? sensEl.value : "NORMAL";
  const time = new Date(timeEl.value).getTime();
  addPH(batchId, ph, sensory, time);
  renderAll();
}

function handleConfirm(batchId) {
  const batch = state.batches.find(b => b.id === batchId);
  if (!batch) return;
  
  const scoreResult = calculateScore(batch);
  confirmBatch(batchId, scoreResult.score);
  renderAll();
}

function handleClearHistory() {
  if (confirm("Are you sure you want to delete all history? This action cannot be undone.")) {
    clearHistory();
    renderAll();
  }
}

// ----- Render all pages -----
function renderAll() {
  renderCollectionPage();
  renderQaPage();
  renderPriorityPage();
  renderHistoryPage();
}
