let allSamples = [];
let usedIds = JSON.parse(localStorage.getItem('usedPerfumeIds')) || [];
let currentSample = null;
let lastMarkedId = null;

// load samples.json on startup
async function init() {
  try {
    const res = await fetch('samples.json');
    allSamples = await res.json();
    renderSearch();
  } catch (err) {
    document.getElementById('result-container').innerHTML = 
      `<div class="card">error loading samples.json. make sure it is in the same folder.</div>`;
  }
}

function saveUsed() {
  localStorage.setItem('usedPerfumeIds', JSON.stringify(usedIds));
}

// navigation toggle
function switchView(viewName, btn) {
  document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
  
  document.getElementById(`view-${viewName}`).classList.add('active');
  if (btn) btn.classList.add('active');
  
  if (viewName === 'find') renderSearch();
}

// pick random scent (optional group filter)
function pickRandom(group = null) {
  document.getElementById('undo-container').innerHTML = '';
  
  let pool = allSamples.filter(s => !usedIds.includes(s.id));
  if (group) {
    pool = pool.filter(s => s.group.toLowerCase() === group.toLowerCase());
  }

  const container = document.getElementById('result-container');
  
  if (pool.length === 0) {
    container.innerHTML = `<div class="card">no unused samples left${group ? ` in "${group.toLowerCase()}"` : ''}!</div>`;
    return;
  }

  currentSample = pool[Math.floor(Math.random() * pool.length)];
  const loc = currentSample.location;

  container.innerHTML = `
    <div class="card">
      <span class="location-pill">rack ${loc.rack} • row ${loc.row} • col ${loc.col}</span>
      <h2 class="perfume-title">${currentSample.name}</h2>
      <p class="perfume-history">${currentSample.history}</p>
      <button class="btn-used" onclick="markAsUsed('${currentSample.id}')">mark as used up</button>
    </div>
  `;
}

// mark sample used + undo option
function markAsUsed(id) {
  if (!usedIds.includes(id)) {
    usedIds.push(id);
    saveUsed();
  }
  lastMarkedId = id;
  document.getElementById('result-container').innerHTML = '';
  document.getElementById('undo-container').innerHTML = `
    <div class="undo-bar">
      <span>marked as empty!</span>
      <button onclick="undoMark()">undo</button>
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
    const loc = currentSample.location;
    document.getElementById('result-container').innerHTML = `
      <div class="card">
        <span class="location-pill">rack ${loc.rack} • row ${loc.row} • col ${loc.col}</span>
        <h2 class="perfume-title">${currentSample.name}</h2>
        <p class="perfume-history">${currentSample.history}</p>
        <button class="btn-used" onclick="markAsUsed('${currentSample.id}')">mark as used up</button>
      </div>
    `;
  }
}

// search & lookup view
function renderSearch() {
  const query = document.getElementById('search-box').value.toLowerCase();
  const resultsEl = document.getElementById('search-results');
  
  const filtered = allSamples.filter(s => s.name.toLowerCase().includes(query));
  
  resultsEl.innerHTML = filtered.slice(0, 50).map(s => {
    const isEmpty = usedIds.includes(s.id);
    return `
      <div class="list-item">
        <div>
          <strong style="font-family: 'Fraunces', Georgia, serif;">${s.name}</strong>
          ${isEmpty ? '<span class="badge-empty">empty</span>' : ''}
          <div style="font-size:12px; color:#685B4F; margin-top:2px;">${s.group}</div>
        </div>
        <div style="font-size:13px; font-weight:600; white-space:nowrap;">
          r:${s.location.rack} • ${s.location.row}-${s.location.col}
        </div>
      </div>
    `;
  }).join('');
}

// copy / restore backup
function copyBackup() {
  const data = JSON.stringify(usedIds);
  navigator.clipboard.writeText(data).then(() => {
    alert(`copied ${usedIds.length} used ids to clipboard!`);
  });
}

function restoreBackup() {
  const input = prompt('paste your saved used ids list (e.g. ["001","014"]):');
  if (!input) return;
  try {
    const parsed = JSON.parse(input);
    if (Array.isArray(parsed)) {
      usedIds = parsed;
      saveUsed();
      renderSearch();
      alert(`restored ${usedIds.length} used samples!`);
    }
  } catch (e) {
    alert("invalid format. make sure you paste the exact list copied earlier.");
  }
}

init();
