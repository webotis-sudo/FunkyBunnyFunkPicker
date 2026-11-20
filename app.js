let allSamples = [];
let usedIds = JSON.parse(localStorage.getItem('usedPerfumeIds')) || [];
let currentSample = null;
let lastMarkedId = null;

// Load samples.json on startup
async function init() {
  try {
    const res = await fetch('samples.json');
    allSamples = await res.json();
    renderSearch();
  } catch (err) {
    document.getElementById('result-container').innerHTML = 
      `<div class="card">Error loading samples.json. Make sure it is in the same folder.</div>`;
  }
}

function saveUsed() {
  localStorage.setItem('usedPerfumeIds', JSON.stringify(usedIds));
}

// Navigation Toggle
function switchView(viewName) {
  document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
  
  document.getElementById(`view-${viewName}`).classList.add('active');
  event.target.classList.add('active');
  
  if (viewName === 'find') renderSearch();
}

// Pick Random Scent (Optional Group Filter)
function pickRandom(group = null) {
  document.getElementById('undo-container').innerHTML = '';
  
  let pool = allSamples.filter(s => !usedIds.includes(s.id));
  if (group) {
    pool = pool.filter(s => s.group.toLowerCase() === group.toLowerCase());
  }

  const container = document.getElementById('result-container');
  
  if (pool.length === 0) {
    container.innerHTML = `<div class="card">No unused samples left${group ? ` in "${group}"` : ''}!</div>`;
    return;
  }

  currentSample = pool[Math.floor(Math.random() * pool.length)];
  const loc = currentSample.location;

  container.innerHTML = `
    <div class="card">
      <span class="location-pill">Rack ${loc.rack} • Row ${loc.row} • Col ${loc.col}</span>
      <h2 class="perfume-title">${currentSample.name}</h2>
      <p class="perfume-history">${currentSample.history}</p>
      <button class="btn-used" onclick="markAsUsed('${currentSample.id}')">Mark as Used Up</button>
    </div>
  `;
}

// Mark Sample Used + Undo Option
function markAsUsed(id) {
  if (!usedIds.includes(id)) {
    usedIds.push(id);
    saveUsed();
  }
  lastMarkedId = id;
  document.getElementById('result-container').innerHTML = '';
  document.getElementById('undo-container').innerHTML = `
    <div class="undo-bar">
      <span>Marked as empty!</span>
      <button onclick="undoMark()">Undo</button>
    </div>
  `;
}

function undoMark() {
  if (!lastMarkedId) return;
  usedIds = usedIds.filter(id => id !== lastMarkedId);
  saveUsed();
  lastMarkedId = null;
  document.getElementById('undo-container').innerHTML = '';
  if (currentSample) {
    // Re-display the restored card
    const loc = currentSample.location;
    document.getElementById('result-container').innerHTML = `
      <div class="card">
        <span class="location-pill">Rack ${loc.rack} • Row ${loc.row} • Col ${loc.col}</span>
        <h2 class="perfume-title">${currentSample.name}</h2>
        <p class="perfume-history">${currentSample.history}</p>
        <button class="btn-used" onclick="markAsUsed('${currentSample.id}')">Mark as Used Up</button>
      </div>
    `;
  }
}

// Search & Lookup View
function renderSearch() {
  const query = document.getElementById('search-box').value.toLowerCase();
  const resultsEl = document.getElementById('search-results');
  
  const filtered = allSamples.filter(s => s.name.toLowerCase().includes(query));
  
  resultsEl.innerHTML = filtered.slice(0, 50).map(s => {
    const isEmpty = usedIds.includes(s.id);
    return `
      <div class="list-item">
        <div>
          <strong>${s.name}</strong>
          ${isEmpty ? '<span class="badge-empty">EMPTY</span>' : ''}
          <div style="font-size:12px; color:#6b7280; margin-top:2px;">${s.group}</div>
        </div>
        <div style="font-size:13px; font-weight:600; white-space:nowrap;">
          R:${s.location.rack} • ${s.location.row}-${s.location.col}
        </div>
      </div>
    `;
  }).join('');
}

// Copy / Restore Backup
function copyBackup() {
  const data = JSON.stringify(usedIds);
  navigator.clipboard.writeText(data).then(() => {
    alert(`Copied ${usedIds.length} used IDs to clipboard!`);
  });
}

function restoreBackup() {
  const input = prompt("Paste your saved used IDs list (e.g. [\"001\",\"014\"]):");
  if (!input) return;
  try {
    const parsed = JSON.parse(input);
    if (Array.isArray(parsed)) {
      usedIds = parsed;
      saveUsed();
      renderSearch();
      alert(`Restored ${usedIds.length} used samples!`);
    }
  } catch (e) {
    alert("Invalid format. Make sure you paste the exact list copied earlier.");
  }
}

init();

