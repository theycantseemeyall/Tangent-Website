// ═════════════════════════════════════════════
// CONFIGURATION
// ═════════════════════════════════════════════

const EMOJIS = [
  '⏱','📝','📊','📅','📘','🧬','📐','⚗️','⚡','📖',
  '🎯','💡','🔬','🗒️','📌','🏆','✏️','📚','🖊️','🗂️',
  '🧪','📈','🌍','🗺️','🔭','💻','🎓','📋','🧠','⭐',
  '🎨','🌸','🦋','🔥','❄️','🎵','🌈','🏅','🔑','📿'
];

const FOLDER_COLOURS = [
  '#539ec4','#A9DEF9','#2a8bbc','#3aab6e','#e8a030',
  '#e05050','#9b6fd4','#e067a0','#5bc8ac','#ffe066'
];

const PALETTES = [
  { name: 'Ocean',    colours: ['#539ec4','#A9DEF9','#2a8bbc','#7ec8e8','#4a7fb5'] },
  { name: 'Forest',   colours: ['#3aab6e','#a8d8a8','#2d7a4f','#6fcf97','#1b4332'] },
  { name: 'Sunset',   colours: ['#e8a030','#ffce6e','#e05050','#ff8c69','#b5451b'] },
  { name: 'Lavender', colours: ['#9b6fd4','#d4b8f0','#7b4fb8','#c77dff','#5a2d82'] },
  { name: 'Casio',    colours: ['#3b9eff','#00d0f0','#1a6fd4','#7ec0ff','#0a4fa3'] },
  { name: 'Rose',     colours: ['#e067a0','#f7b8d8','#c0396c','#ff9ec4','#8c1a4b'] }
];

let folders = [
  { id:1, name:'Pomodoro',  emoji:'⏱',  colour:'#539ec4', panel:'pomodoro', image: null },
  { id:2, name:'To-Do',     emoji:'📝',  colour:'#A9DEF9', panel:'todo',     image: null },
  { id:3, name:'Grades',    emoji:'📊',  colour:'#3aab6e', panel:'grades',   image: null },
  { id:4, name:'Calendar',  emoji:'📅',  colour:'#e8a030', panel:'calendar', image: null },
  { id:5, name:'Revision',  emoji:'📘',  colour:'#9b6fd4', panel:'revision', image: null },
];

let nextId = 6;

// ═════════════════════════════════════════════
// STATE
// ═════════════════════════════════════════════
let selectedId    = null;
let ctxTargetId   = null;
let pickerId      = null;
let pickerEmoji   = '📁';
let pickerColour  = FOLDER_COLOURS[0];
let pickerImage   = null;
let viewMode      = 'grid';
let activePalette = null;
let applyToSite   = false;

// ═════════════════════════════════════════════
// FOLDER SVG GENERATOR
// ═════════════════════════════════════════════
function folderSVG(colour) {
  return `<svg class="folder-svg" viewBox="0 0 100 82" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 16C3 12.7 5.7 10 9 10H37L46 22H91C94.3 22 97 24.7 97 28V72C97 75.3 94.3 78 91 78H9C5.7 78 3 75.3 3 72V16Z"
          fill="${colour}" opacity="0.20"/>
    <path d="M3 28C3 24.7 5.7 22 9 22H91C94.3 22 97 24.7 97 28V72C97 75.3 94.3 78 91 78H9C5.7 78 3 75.3 3 72V28Z"
          fill="${colour}" opacity="0.35"/>
    <path d="M3 28C3 24.7 5.7 22 9 22H91C94.3 22 97 24.7 97 28V72C97 75.3 94.3 78 91 78H9C5.7 78 3 75.3 3 72V28Z"
          stroke="${colour}" stroke-width="2" fill="none"/>
    <path d="M3 16C3 12.7 5.7 10 9 10H37L46 22H3V16Z"
          stroke="${colour}" stroke-width="2" fill="${colour}" opacity="0.45"/>
  </svg>`;
}

// ═════════════════════════════════════════════
// RENDER FOLDERS (Quick Access)
// ═════════════════════════════════════════════
function renderFolders() {
  const grid  = document.getElementById('folderGrid');
  const query = document.getElementById('searchInput').value.toLowerCase();
  const shown = folders.filter(f => f.name.toLowerCase().includes(query));

  grid.className = viewMode === 'list' ? 'folder-grid list-view' : 'folder-grid';
  grid.innerHTML = '';
  shown.forEach(f => buildFolderEl(f, grid, false));

  const el = document.getElementById('qaCount');
  if (el) el.textContent = shown.length;

  const total = shown.length + pomSubjects.length;
  document.getElementById('viewLabel').textContent = `${total} item${total !== 1 ? 's' : ''}`;
  document.getElementById('statusMsg').textContent = `${total} item${total !== 1 ? 's' : ''}`;

  renderSubjectFolders();
}

// ═════════════════════════════════════════════
// SUBJECT FOLDERS
// ═════════════════════════════════════════════
const subjFolderMeta = {};
const SUBJ_FOLDER_COLOURS = [
  '#539ec4','#3aab6e','#e8a030','#9b6fd4','#e067a0',
  '#5bc8ac','#e05050','#A9DEF9','#ffe066','#2a8bbc'
];

function getSubjMeta(s) {
  if (!subjFolderMeta[s.id]) {
    const i = pomSubjects.indexOf(s);
    subjFolderMeta[s.id] = {
      colour: SUBJ_FOLDER_COLOURS[i % SUBJ_FOLDER_COLOURS.length],
      emoji:  SUBJ_EMOJIS[i % SUBJ_EMOJIS.length],
      image:  null
    };
  }
  return subjFolderMeta[s.id];
}

function renderSubjectFolders() {
  const grid  = document.getElementById('subjectFolderGrid');
  const empty = document.getElementById('subjectFolderEmpty');
  const query = (document.getElementById('searchInput').value || '').toLowerCase();
  if (!grid) return;

  const shown = pomSubjects.filter(s => s.name.toLowerCase().includes(query));
  grid.className = viewMode === 'list' ? 'folder-grid list-view' : 'folder-grid';
  grid.innerHTML = '';

  if (shown.length === 0) {
    empty.style.display = '';
  } else {
    empty.style.display = 'none';
    shown.forEach(s => {
      const meta = getSubjMeta(s);
      const fakeFolder = {
        id: 'subj_' + s.id, name: s.name,
        emoji: meta.emoji, colour: meta.colour, image: meta.image,
        _subjId: s.id
      };
      buildFolderEl(fakeFolder, grid, true);
    });
  }

  const el = document.getElementById('subjCount');
  if (el) el.textContent = pomSubjects.length;
}

function buildFolderEl(f, grid, isSubject) {
  const div = document.createElement('div');
  div.className = 'folder-item'
    + (selectedId === f.id ? ' selected' : '')
    + (f.image ? ' has-image' : '');
  div.dataset.id = f.id;

  div.innerHTML = `
    <div class="folder-icon-wrap">
      ${folderSVG(f.colour)}
      <img class="folder-img-cover" src="${f.image || ''}" alt="" />
      <div class="folder-emoji">${f.emoji}</div>
    </div>
    <div class="folder-name">${f.name}</div>
  `;

  div.addEventListener('click', e => { e.stopPropagation(); selectFolder(f.id); });
  div.addEventListener('dblclick', e => {
    e.stopPropagation();
    if (isSubject) openSubjectPanel(f._subjId);
    else openFolder(f.id);
  });
  div.addEventListener('contextmenu', e => {
    e.preventDefault();
    if (isSubject) showSubjCtx(e, f._subjId);
    else showCtx(e, f.id);
  });

  let lastTap = 0;
  div.addEventListener('touchend', e => {
    const now = Date.now();
    if (now - lastTap < 350) {
      e.preventDefault();
      if (isSubject) openSubjectPanel(f._subjId);
      else openFolder(f.id);
    } else selectFolder(f.id);
    lastTap = now;
  });

  grid.appendChild(div);
}

// Subject folder context menu
let ctxSubjTarget = null;

function showSubjCtx(e, subjId) {
  ctxSubjTarget = subjId;
  const subj = pomSubjects.find(s => s.id === subjId);
  if (!subj) return;
  selectedId = 'subj_' + subjId;
  renderSubjectFolders();
  ctxMenu.innerHTML = `
    <div class="ctx-item" onclick="openSubjectPanel(${subjId})">📂 Open</div>
    <div class="ctx-item" onclick="openSubjFolderCustomise(${subjId})">🎨 Customise Folder</div>
    <div class="ctx-sep"></div>
    <div class="ctx-item" onclick="ctxRenameSubj(${subjId})">✏️ Rename</div>
    <div class="ctx-item ctx-danger" onclick="ctxDeleteSubj(${subjId})">🗑️ Delete Subject</div>
  `;
  ctxMenu.style.left = e.clientX + 'px';
  ctxMenu.style.top  = e.clientY + 'px';
  ctxMenu.classList.add('open');
}

function ctxRenameSubj(id) {
  hideCtx();
  const s = pomSubjects.find(x => x.id === id);
  if (!s) return;
  const n = prompt('Rename subject:', s.name);
  if (n && n.trim()) { s.name = n.trim(); renderSbSubjects(); renderSubjectFolders(); }
}

function ctxDeleteSubj(id) {
  hideCtx();
  const s = pomSubjects.find(x => x.id === id);
  if (!s || !confirm(`Delete "${s.name}" and all its data?`)) return;
  pomSubjects = pomSubjects.filter(x => x.id !== id);
  delete subjFolderMeta[id];
  if (currentSubjectId === id) { currentSubjectId = null; showHome(); }
  if (pomActiveId === id) { pomActiveId = null; updatePomBadge(); renderPomTabs(); }
  renderSbSubjects(); renderSubjectFolders(); renderPomStats();
  renderRevSubjectPicker();
}

function openSubjFolderCustomise(id) {
  hideCtx();
  const meta = getSubjMeta(pomSubjects.find(s => s.id === id));
  pickerId     = 'subj_' + id;
  pickerEmoji  = meta.emoji;
  pickerColour = meta.colour;
  pickerImage  = meta.image;
  const subj = pomSubjects.find(s => s.id === id);
  document.getElementById('modalTitle').textContent     = `Customise "${subj?.name}" Folder`;
  document.getElementById('folderNameInput').value      = subj?.name || '';
  document.getElementById('hexInput').value             = meta.colour;
  document.getElementById('hexPreviewDot').style.background = meta.colour;
  openCustomise('subj_' + id);
}

// ═════════════════════════════════════════════
// NAVIGATION
// ═════════════════════════════════════════════
function showHome() {
  document.getElementById('homeView').style.display  = '';
  document.querySelectorAll('.tool-panel').forEach(p => p.classList.remove('visible'));
  document.getElementById('addressText').textContent = 'Tangent / Dashboard';
  document.getElementById('pathLabel').textContent   = 'Dashboard';
  document.querySelector('.main-area').classList.remove('panel-active');
  setActiveSb('home');
  renderFolders();
}

function openFolder(id) {
  const f = folders.find(x => x.id === id);
  if (!f) return;
  document.getElementById('homeView').style.display = 'none';
  document.querySelectorAll('.tool-panel').forEach(p => p.classList.remove('visible'));
  document.querySelector('.main-area').classList.add('panel-active');
  const panel = document.getElementById('panel-' + f.panel);
  if (panel) panel.classList.add('visible');
  document.getElementById('addressText').textContent = `Tangent / Dashboard / ${f.name}`;
  document.getElementById('pathLabel').textContent   = f.name;
  setActiveSb(f.panel);
  showDetail(f);
}

function selectFolder(id) {
  selectedId = id;
  renderFolders();
  showDetail(folders.find(x => x.id === id));
}

function sideNav(el, panelId) {
  document.querySelectorAll('.sb-item').forEach(i => i.classList.remove('active'));
  el.classList.add('active');
  if (panelId === 'home') { showHome(); return; }
  const f = folders.find(x => x.panel === panelId);
  if (f) openFolder(f.id);
}

function setActiveSb(panelId) {
  document.querySelectorAll('.sb-item[data-nav]').forEach(i => {
    i.classList.toggle('active', i.dataset.nav === panelId);
  });
}

// ═════════════════════════════════════════════
// DETAIL PANEL
// ═════════════════════════════════════════════
function toggleDetail() {
  document.getElementById('detailPanel').classList.toggle('open');
}

function showDetail(f) {
  if (!f) return;
  const panel = document.getElementById('detailPanel');
  panel.classList.add('open');
  document.getElementById('detailInner').innerHTML = `
    <div style="text-align:center;margin-bottom:1rem">
      ${f.image
        ? `<img src="${f.image}" style="width:70px;height:56px;object-fit:cover;border-radius:5px;border:1px solid var(--rule);margin-bottom:0.5rem" />`
        : `<div style="font-size:2.8rem;margin-bottom:0.4rem">${f.emoji}</div>`
      }
      <div class="detail-title">${f.name}</div>
      <div class="detail-meta">Study tool · Double-click to open</div>
    </div>
    <div style="display:flex;flex-direction:column;gap:0.45rem">
      <button class="t-btn primary" onclick="openFolder(${f.id})" style="width:100%">📂 Open</button>
      <button class="t-btn" onclick="openCustomise(${f.id})" style="width:100%">🎨 Customise</button>
    </div>
    <div style="margin-top:1rem;padding-top:0.8rem;border-top:1px solid var(--rule)">
      <div style="font-size:0.6rem;letter-spacing:0.1em;text-transform:uppercase;color:var(--ink-muted);margin-bottom:0.4rem">Info</div>
      <div style="font-size:0.73rem;color:var(--ink-muted);line-height:1.7">
        <div>Icon: ${f.emoji}</div>
        <div>Colour: <span style="color:${f.colour}">■</span> ${f.colour}</div>
        <div>Type: Tool Folder</div>
      </div>
    </div>
  `;
}

// ═════════════════════════════════════════════
// VIEW TOGGLE
// ═════════════════════════════════════════════
function setView(mode) {
  viewMode = mode;
  document.getElementById('vGrid').classList.toggle('active', mode === 'grid');
  document.getElementById('vList').classList.toggle('active', mode === 'list');
  renderFolders();
}

// ═════════════════════════════════════════════
// CONTEXT MENU
// ═════════════════════════════════════════════
const ctxMenu = document.getElementById('ctxMenu');

function showCtx(e, id) {
  ctxTargetId = id;
  selectedId  = id;
  renderFolders();
  ctxMenu.style.left = e.clientX + 'px';
  ctxMenu.style.top  = e.clientY + 'px';
  ctxMenu.classList.add('open');
}

function hideCtx() { ctxMenu.classList.remove('open'); }
document.addEventListener('click', hideCtx);

function ctxOpen()      { hideCtx(); openFolder(ctxTargetId); }
function ctxCustomise() { hideCtx(); openCustomise(ctxTargetId); }
function ctxRename() {
  hideCtx();
  const f = folders.find(x => x.id === ctxTargetId);
  if (!f) return;
  const n = prompt('Rename folder:', f.name);
  if (n && n.trim()) { f.name = n.trim(); renderFolders(); }
}
function ctxDelete() {
  hideCtx();
  const f = folders.find(x => x.id === ctxTargetId);
  if (!f) return;
  if (!confirm(`Delete "${f.name}"?`)) return;
  folders = folders.filter(x => x.id !== ctxTargetId);
  if (document.getElementById('panel-' + f.panel)?.classList.contains('visible')) showHome();
  selectedId = null;
  renderFolders();
}

document.getElementById('contentScroll').addEventListener('click', e => {
  if (['contentScroll','homeView','folderGrid'].includes(e.target.id)) {
    selectedId = null; renderFolders();
  }
});

// ═════════════════════════════════════════════
// CUSTOMISE FOLDER MODAL
// ═════════════════════════════════════════════
function openCustomise(id) {
  pickerId     = id;
  const f      = id ? folders.find(x => x.id === id) : null;
  pickerEmoji  = f ? f.emoji  : '📁';
  pickerColour = f ? f.colour : FOLDER_COLOURS[0];
  pickerImage  = f ? f.image  : null;

  document.getElementById('modalTitle').textContent     = f ? `Customise "${f.name}"` : 'New Folder';
  document.getElementById('folderNameInput').value      = f ? f.name : '';
  document.getElementById('hexInput').value             = f ? f.colour : FOLDER_COLOURS[0];
  document.getElementById('hexPreviewDot').style.background = pickerColour;

  const eg = document.getElementById('emojiGrid');
  eg.innerHTML = '';
  EMOJIS.forEach(em => {
    const btn = document.createElement('div');
    btn.className   = 'emoji-opt' + (em === pickerEmoji ? ' sel' : '');
    btn.textContent = em;
    btn.addEventListener('click', () => {
      pickerEmoji = em;
      eg.querySelectorAll('.emoji-opt').forEach(b => b.classList.toggle('sel', b.textContent === em));
    });
    eg.appendChild(btn);
  });

  const cg = document.getElementById('colourGrid');
  cg.innerHTML = '';
  FOLDER_COLOURS.forEach(c => {
    const sw = document.createElement('div');
    sw.className  = 'colour-sw' + (c === pickerColour ? ' sel' : '');
    sw.style.background = c;
    sw.addEventListener('click', () => {
      pickerColour = c;
      cg.querySelectorAll('.colour-sw').forEach(s => s.classList.toggle('sel', s.style.background === sw.style.background));
      document.getElementById('hexInput').value = c;
      document.getElementById('hexPreviewDot').style.background = c;
    });
    cg.appendChild(sw);
  });

  const thumb    = document.getElementById('imgThumb');
  const clearBtn = document.getElementById('clearImgBtn');
  if (pickerImage) {
    thumb.src = pickerImage; thumb.classList.add('visible'); clearBtn.style.display = '';
  } else {
    thumb.classList.remove('visible'); clearBtn.style.display = 'none';
  }

  document.getElementById('customModal').classList.add('open');
}

document.getElementById('hexInput').addEventListener('input', e => {
  const val = e.target.value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(val)) {
    pickerColour = val;
    document.getElementById('hexPreviewDot').style.background = val;
    document.querySelectorAll('#colourGrid .colour-sw').forEach(s => s.classList.remove('sel'));
  }
});

document.getElementById('folderImgInput').addEventListener('change', e => {
  const file = e.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    pickerImage = ev.target.result;
    const thumb = document.getElementById('imgThumb');
    thumb.src = pickerImage; thumb.classList.add('visible');
    document.getElementById('clearImgBtn').style.display = '';
  };
  reader.readAsDataURL(file);
});

document.getElementById('clearImgBtn').addEventListener('click', () => {
  pickerImage = null;
  document.getElementById('imgThumb').classList.remove('visible');
  document.getElementById('clearImgBtn').style.display = 'none';
  document.getElementById('folderImgInput').value = '';
});

function applyCustomise() {
  const name = document.getElementById('folderNameInput').value.trim() || 'New Folder';

  if (typeof pickerId === 'string' && pickerId.startsWith('subj_')) {
    const subjId = parseInt(pickerId.replace('subj_', ''));
    const meta   = getSubjMeta(pomSubjects.find(s => s.id === subjId));
    meta.emoji   = pickerEmoji;
    meta.colour  = pickerColour;
    meta.image   = pickerImage;
    const subj = pomSubjects.find(s => s.id === subjId);
    if (subj && name) subj.name = name;
    renderSubjectFolders(); renderSbSubjects();
  } else if (pickerId) {
    const f = folders.find(x => x.id === pickerId);
    if (f) { f.name = name; f.emoji = pickerEmoji; f.colour = pickerColour; f.image = pickerImage; }
    renderFolders();
  } else {
    folders.push({ id: nextId++, name, emoji: pickerEmoji, colour: pickerColour, panel: 'home', image: pickerImage });
    renderFolders();
  }
  closeModal();
}

function closeModal() {
  document.getElementById('customModal').classList.remove('open');
  document.getElementById('folderImgInput').value = '';
}

// ═════════════════════════════════════════════
// GLOBAL PALETTE SYSTEM
// ═════════════════════════════════════════════
function renderPalettePresets() {
  const container = document.getElementById('palettePresets');
  container.innerHTML = '';
  PALETTES.forEach((p, i) => {
    const row = document.createElement('div');
    row.className = 'palette-preset' + (activePalette === i ? ' active' : '');
    const dots = document.createElement('div');
    dots.className = 'palette-dots';
    p.colours.forEach(c => {
      const d = document.createElement('div');
      d.className = 'palette-dot'; d.style.background = c; dots.appendChild(d);
    });
    const label = document.createElement('span');
    label.className = 'palette-preset-name'; label.textContent = p.name;
    row.appendChild(dots); row.appendChild(label);
    row.addEventListener('click', () => applyPalette(i));
    container.appendChild(row);
  });
}

function applyPalette(idx) {
  activePalette = idx;
  const p = PALETTES[idx];
  folders.forEach((f, i) => { f.colour = p.colours[i % p.colours.length]; });
  if (applyToSite) applySiteAccent(p.colours[0], p.colours[1] || p.colours[0]);
  renderFolders(); renderPalettePresets();
  if (selectedId) showDetail(folders.find(x => x.id === selectedId));
}

function applySiteAccent(primary, dark) {
  const root = document.documentElement;
  root.style.setProperty('--accent',      primary);
  root.style.setProperty('--accent-dark', dark);
  root.style.setProperty('--secondary',   dark);
}

function resetSiteAccent() {
  const root = document.documentElement;
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';
  root.style.setProperty('--accent',      dark ? '#3b9eff' : '#539ec4');
  root.style.setProperty('--accent-dark', dark ? '#1a6fd4' : '#2a8bbc');
  root.style.setProperty('--secondary',   dark ? '#1a6fd4' : '#2a8bbc');
}

document.getElementById('siteThemeToggle').addEventListener('change', e => {
  applyToSite = e.target.checked;
  if (applyToSite && activePalette !== null) {
    const p = PALETTES[activePalette];
    applySiteAccent(p.colours[0], p.colours[1] || p.colours[0]);
  } else {
    resetSiteAccent();
  }
});

renderPalettePresets();

// ═════════════════════════════════════════════
// DARK / LIGHT THEME
// ═════════════════════════════════════════════
(function initTheme() {
  const saved = localStorage.getItem('tangent-theme') || 'light';
  if (saved === 'dark') {
    document.documentElement.setAttribute('data-theme','dark');
    document.getElementById('themeToggle').textContent = '☀️';
  }
})();

document.getElementById('themeToggle').addEventListener('click', () => {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  if (isDark) {
    document.documentElement.removeAttribute('data-theme');
    document.getElementById('themeToggle').textContent = '🌙';
    localStorage.setItem('tangent-theme','light');
  } else {
    document.documentElement.setAttribute('data-theme','dark');
    document.getElementById('themeToggle').textContent = '☀️';
    localStorage.setItem('tangent-theme','dark');
  }
  if (applyToSite && activePalette !== null) {
    const p = PALETTES[activePalette];
    applySiteAccent(p.colours[0], p.colours[1] || p.colours[0]);
  } else {
    resetSiteAccent();
  }
});

// ═════════════════════════════════════════════
// CLOCK
// ═════════════════════════════════════════════
let is24h = false;

const MONTHS   = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const WEEKDAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

function updateClock() {
  const n = new Date();
  let h   = n.getHours();
  const m = String(n.getMinutes()).padStart(2,'0');
  const s = String(n.getSeconds()).padStart(2,'0');
  if (is24h) {
    document.getElementById('clock').textContent = `${String(h).padStart(2,'0')}:${m}:${s}`;
  } else {
    const ap = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    document.getElementById('clock').textContent = `${h}:${m}:${s} ${ap}`;
  }
}

document.getElementById('fmtToggle').addEventListener('click', () => {
  is24h = !is24h;
  document.getElementById('fmtToggle').textContent = is24h ? '12H' : '24H';
  updateClock();
});

updateClock();
setInterval(updateClock, 1000);

const today = new Date();
document.getElementById('statusDate').textContent =
  `${WEEKDAYS[today.getDay()]}, ${today.getDate()} ${MONTHS[today.getMonth()]} ${today.getFullYear()}`;

// ═════════════════════════════════════════════
// POMODORO
// ═════════════════════════════════════════════
const CIRCUM = 2 * Math.PI * 80;

let pomSubjects    = [];
let pomActiveId    = null;
let pomNextSubjId  = 1;
let pomTime        = 25 * 60;
let pomFull        = 25 * 60;
let pomTimer       = null;
let pomRunning     = false;
let pomElapsed     = 0;
let pomLiveOffset  = 0;

function pomFmt(t) {
  const m = Math.floor(t / 60), s = t % 60;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function durFmt(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function todayStr() {
  const d = new Date();
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

function pomGrandTotal() {
  return pomSubjects.reduce((sum, s) => sum + s.totalSec, 0) + pomLiveOffset;
}

function renderPomStats() {
  const total = pomGrandTotal();
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  document.getElementById('statHours').textContent = String(h).padStart(2,'0');
  document.getElementById('statMins').textContent  = String(m).padStart(2,'0');
  document.getElementById('statSecs').textContent  = String(s).padStart(2,'0');
}

function renderPomTabs() {
  const bar    = document.getElementById('pomSubjectBar');
  const addBtn = document.getElementById('pomAddSubjectBtn');
  bar.querySelectorAll('.pom-subject-tab').forEach(t => t.remove());
  pomSubjects.forEach(s => {
    const tab = document.createElement('button');
    tab.className   = 'pom-subject-tab' + (pomActiveId === s.id ? ' active' : '');
    tab.textContent = s.name;
    tab.addEventListener('click', () => {
      pomActiveId = s.id;
      renderPomTabs(); renderPomDetail(); updatePomBadge();
      if (typeof renderSbSubjects === 'function') renderSbSubjects();
    });
    bar.insertBefore(tab, addBtn);
  });
}

function updatePomBadge() {
  const el   = document.getElementById('pomActiveSubjectBadge');
  const subj = pomSubjects.find(s => s.id === pomActiveId);
  el.textContent = subj ? `Studying: ${subj.name}` : '';
}

function renderPomDetail() {
  const col    = document.getElementById('pomDetailCol');
  const noSubj = document.getElementById('pomNoSubject');
  const subj   = pomSubjects.find(s => s.id === pomActiveId);

  if (!subj) { noSubj.style.display = ''; col.querySelectorAll('.pom-subject-content').forEach(e => e.remove()); return; }
  noSubj.style.display = 'none';
  col.querySelectorAll('.pom-subject-content').forEach(e => e.remove());

  const wrap = document.createElement('div');
  wrap.className = 'pom-subject-content';
  wrap.style.cssText = 'display:flex;flex-direction:column;gap:0.8rem';

  const header = document.createElement('div');
  header.className = 'pom-subject-header';
  header.innerHTML = `<div class="pom-subject-name">${subj.name}</div><div class="pom-subject-total">${durFmt(subj.totalSec)} total</div>`;
  wrap.appendChild(header);

  const todoSection = document.createElement('div');
  todoSection.innerHTML = `<div class="pom-detail-section">Linked Tasks</div>`;
  if (subj.todos.length === 0) {
    const empty = document.createElement('div');
    empty.style.cssText = 'font-size:0.74rem;color:var(--ink-muted);font-style:italic;padding:0.2rem 0';
    empty.textContent = 'No tasks linked yet';
    todoSection.appendChild(empty);
  } else {
    const todoList = document.createElement('div');
    todoList.className = 'pom-linked-todos';
    subj.todos.forEach((t, ti) => {
      const row = document.createElement('div');
      row.className = 'pom-linked-todo' + (t.done ? ' done' : '');
      const chk = document.createElement('div'); chk.className = 'pom-linked-chk';
      chk.addEventListener('click', () => { subj.todos[ti].done = !subj.todos[ti].done; renderPomDetail(); });
      const label = document.createElement('span'); label.style.flex = '1'; label.textContent = t.text;
      const del = document.createElement('button');
      del.style.cssText = 'background:none;border:none;font-size:0.7rem;color:var(--ink-muted)';
      del.textContent = '✕';
      del.addEventListener('click', () => { subj.todos.splice(ti, 1); renderPomDetail(); });
      row.appendChild(chk); row.appendChild(label); row.appendChild(del);
      todoList.appendChild(row);
    });
    todoSection.appendChild(todoList);
  }

  const addTodoRow = document.createElement('div');
  addTodoRow.style.cssText = 'display:flex;gap:0.35rem;margin-top:0.35rem';
  addTodoRow.innerHTML = `
    <input type="text" class="t-input" placeholder="Add task for ${subj.name}…"
           id="pomTodoInput_${subj.id}" style="flex:1;height:26px;font-size:0.74rem;padding:0.25rem 0.5rem" />
    <button class="t-btn primary" id="pomTodoAdd_${subj.id}" style="height:26px;font-size:0.7rem;padding:0 0.55rem">+</button>
  `;
  todoSection.appendChild(addTodoRow);
  wrap.appendChild(todoSection);

  setTimeout(() => {
    const inp = document.getElementById(`pomTodoInput_${subj.id}`);
    const btn = document.getElementById(`pomTodoAdd_${subj.id}`);
    if (btn && inp) {
      const addFn = () => { const v = inp.value.trim(); if (v) { subj.todos.push({ text: v, done: false }); inp.value = ''; renderPomDetail(); } };
      btn.addEventListener('click', addFn);
      inp.addEventListener('keypress', e => { if (e.key === 'Enter') addFn(); });
    }
  }, 0);

  const logSection = document.createElement('div');
  logSection.innerHTML = `<div class="pom-detail-section">Session Log</div>`;
  if (subj.sessions.length === 0) {
    const empty = document.createElement('div');
    empty.style.cssText = 'font-size:0.74rem;color:var(--ink-muted);font-style:italic;padding:0.2rem 0';
    empty.textContent = 'No sessions recorded yet — start the timer!';
    logSection.appendChild(empty);
  } else {
    const logList = document.createElement('ul'); logList.className = 'pom-session-log';
    [...subj.sessions].reverse().forEach((sess, ri) => {
      const realIdx = subj.sessions.length - 1 - ri;
      const li = document.createElement('li'); li.className = 'pom-session-entry';
      li.innerHTML = `
        <div style="display:flex;flex-direction:column;flex:1;gap:0.1rem">
          <span class="pom-session-note">${sess.note || '—'}</span>
          <span style="font-size:0.62rem;color:var(--ink-muted)">${sess.date}</span>
        </div>
        <span class="pom-session-dur">${durFmt(sess.dur)}</span>
        <button class="pom-session-del" data-idx="${realIdx}">🗑</button>
      `;
      li.querySelector('.pom-session-del').addEventListener('click', () => {
        subj.totalSec -= subj.sessions[realIdx].dur;
        if (subj.totalSec < 0) subj.totalSec = 0;
        subj.sessions.splice(realIdx, 1);
        renderPomDetail(); renderPomStats();
      });
      logList.appendChild(li);
    });
    logSection.appendChild(logList);
  }
  wrap.appendChild(logSection);
  col.appendChild(wrap);
}

function pomUpdateRing() {
  document.getElementById('pomDisplay').textContent = pomFmt(pomTime);
  const circle = document.querySelector('#pomRing .progress');
  if (circle) {
    circle.style.strokeDasharray  = CIRCUM;
    circle.style.strokeDashoffset = CIRCUM * (1 - pomTime / pomFull);
  }
}

function pomSessionComplete(elapsed) {
  clearInterval(pomTimer);
  pomRunning = false; pomLiveOffset = 0;
  const subj = pomSubjects.find(s => s.id === pomActiveId);
  if (!subj) { pomTime = pomFull; pomElapsed = 0; pomUpdateRing(); alert('🎉 Session done! Select a subject next time.'); return; }
  const note = prompt(`✅ ${durFmt(elapsed)} session complete!\n\nWhat did you study for ${subj.name}?\n(Leave blank to skip)`, '');
  subj.sessions.push({ note: note || '', dur: elapsed, date: todayStr() });
  subj.totalSec += elapsed;
  pomTime = pomFull; pomElapsed = 0; pomUpdateRing();
  renderPomStats(); renderPomDetail(); updatePomBadge();
}

document.getElementById('pomStart').addEventListener('click', () => {
  if (pomRunning) return;
  if (!pomActiveId && pomSubjects.length > 0) {
    const ok = confirm('No subject selected. Start untracked session anyway?');
    if (!ok) return;
  }
  pomRunning = true;
  pomTimer = setInterval(() => {
    if (pomTime > 0) {
      pomTime--; pomElapsed++; pomUpdateRing();
      const liveSubj = pomSubjects.find(s => s.id === pomActiveId);
      if (liveSubj) pomLiveOffset = pomElapsed;
      renderPomStats();
    } else {
      pomSessionComplete(pomElapsed);
    }
  }, 1000);
});

document.getElementById('pomReset').addEventListener('click', () => {
  clearInterval(pomTimer);
  pomRunning = false; pomElapsed = 0; pomLiveOffset = 0;
  pomTime = pomFull; pomUpdateRing(); renderPomStats();
});

document.getElementById('pomSkip').addEventListener('click', () => {
  if (!pomRunning && pomElapsed === 0) return;
  const elapsed = pomElapsed > 0 ? pomElapsed : pomFull - pomTime;
  clearInterval(pomTimer); pomRunning = false;
  pomSessionComplete(elapsed);
});

document.getElementById('pomDuration').addEventListener('change', e => {
  const mins = parseInt(e.target.value);
  pomFull = mins * 60; pomTime = pomFull; pomElapsed = 0;
  clearInterval(pomTimer); pomRunning = false; pomUpdateRing();
  document.getElementById('pomRingLabel').textContent = mins <= 15 ? 'break' : 'focus';
});

document.getElementById('pomAddSubjectBtn').addEventListener('click', () => {
  const form = document.getElementById('pomAddSubjectForm');
  form.style.display = form.style.display === 'none' ? 'flex' : 'none';
  if (form.style.display === 'flex') document.getElementById('pomSubjectNameInput').focus();
});

document.getElementById('pomSubjectCancel').addEventListener('click', () => {
  document.getElementById('pomAddSubjectForm').style.display = 'none';
  document.getElementById('pomSubjectNameInput').value = '';
});

const addSubjectFn = () => {
  const inp  = document.getElementById('pomSubjectNameInput');
  const name = inp.value.trim();
  if (!name) return;
  const newSubj2 = { id: pomNextSubjId++, name, totalSec: 0, sessions: [], todos: [] };
  pomSubjects.push(newSubj2);
  inp.value = '';
  document.getElementById('pomAddSubjectForm').style.display = 'none';
  pomActiveId = newSubj2.id;
  renderPomTabs(); renderPomDetail(); updatePomBadge();
  if (typeof renderSbSubjects === 'function') renderSbSubjects();
};

document.getElementById('pomSubjectConfirm').addEventListener('click', addSubjectFn);
document.getElementById('pomSubjectNameInput').addEventListener('keypress', e => { if (e.key === 'Enter') addSubjectFn(); });

pomUpdateRing();
renderPomStats();
renderRevSubjectPicker();

// ═════════════════════════════════════════════
// TO-DO
// ═════════════════════════════════════════════
let tasks = ['Finish homework', 'Study Biology'];

function renderTasks() {
  const ul = document.getElementById('todoList');
  ul.innerHTML = '';
  tasks.forEach((t, i) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="tl-spacer">${t}</span>
      <button class="tl-ren" data-i="${i}">✏️</button>
      <button class="tl-del" data-i="${i}">🗑️</button>
    `;
    li.querySelector('.tl-del').addEventListener('click', () => { tasks.splice(i,1); renderTasks(); });
    li.querySelector('.tl-ren').addEventListener('click', () => { const n = prompt('Rename task:', tasks[i]); if (n) { tasks[i] = n; renderTasks(); } });
    ul.appendChild(li);
  });
}

const addTask = () => {
  const inp = document.getElementById('taskInput');
  const v   = inp.value.trim();
  if (v) { tasks.push(v); inp.value = ''; renderTasks(); }
};
document.getElementById('addTaskBtn').addEventListener('click', addTask);
document.getElementById('taskInput').addEventListener('keypress', e => { if (e.key === 'Enter') addTask(); });
renderTasks();

// ═════════════════════════════════════════════
// GRADES
// ═════════════════════════════════════════════
let grades = [];

function gcls(g) { return g >= 75 ? 'high' : g >= 50 ? 'mid' : 'low'; }
function gavg() { return grades.length ? Math.round(grades.reduce((a,g) => a + g.grade, 0) / grades.length) : null; }

function renderGrades() {
  const el = document.getElementById('gradeList');
  el.innerHTML = '';
  grades.forEach((g, i) => {
    const row = document.createElement('div'); row.className = 'grade-row';
    row.innerHTML = `
      <span style="color:var(--ink-light)">${g.subject}</span>
      <div style="display:flex;align-items:center;gap:0.6rem">
        <span class="gscore ${gcls(g.grade)}">${g.grade}%</span>
        <button onclick="delGrade(${i})" style="background:none;border:none;font-size:0.75rem;color:var(--ink-muted)">🗑️</button>
      </div>
    `;
    el.appendChild(row);
  });
  const avg = gavg();
  document.getElementById('gradeAvgNum').textContent  = avg !== null ? avg + '%' : '—';
  document.getElementById('gradeAvgMeta').textContent = avg !== null ? `Avg across ${grades.length} subject${grades.length > 1 ? 's' : ''}` : 'No grades yet';
  if (avg !== null) {
    const c = gcls(avg);
    document.getElementById('gradeAvgNum').style.color = c==='high' ? 'var(--green)' : c==='mid' ? 'var(--accent)' : '#e05050';
  }
}

window.delGrade = i => { grades.splice(i,1); renderGrades(); };

const addGrade = () => {
  const s = document.getElementById('subjectInput').value.trim();
  const g = parseFloat(document.getElementById('gradeInput').value);
  if (!s || isNaN(g) || g < 0 || g > 100) return;
  grades.push({ subject: s, grade: g });
  document.getElementById('subjectInput').value = '';
  document.getElementById('gradeInput').value   = '';
  renderGrades();
};
document.getElementById('addGradeBtn').addEventListener('click', addGrade);
document.getElementById('gradeInput').addEventListener('keypress', e => { if (e.key==='Enter') addGrade(); });
renderGrades();

// ═════════════════════════════════════════════
// CALENDAR
// ═════════════════════════════════════════════
function buildCalendar() {
  const wd = document.getElementById('calWd'), days = document.getElementById('calDays'), mname = document.getElementById('calMonth');
  const now = new Date(), yr = now.getFullYear(), mo = now.getMonth();
  wd.innerHTML = '';
  ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(d => {
    const div = document.createElement('div'); div.className = 'cal-wd'; div.textContent = d; wd.appendChild(div);
  });
  mname.textContent = `${MONTHS[mo]} ${yr}`;
  days.innerHTML = '';
  const firstDay = new Date(yr, mo, 1).getDay();
  const lastDate = new Date(yr, mo+1, 0).getDate();
  for (let i = 0; i < firstDay; i++) days.appendChild(document.createElement('div'));
  for (let d = 1; d <= lastDate; d++) {
    const div = document.createElement('div'); div.textContent = d;
    if (d === now.getDate()) div.classList.add('today');
    days.appendChild(div);
  }
}
buildCalendar();

// ═════════════════════════════════════════════
// SEARCH
// ═════════════════════════════════════════════
document.getElementById('searchInput').addEventListener('input', () => {
  if (document.getElementById('homeView').style.display === 'none') showHome();
  renderFolders();
});

// ═════════════════════════════════════════════
// REVISION NOTES
// ═════════════════════════════════════════════
let revisionNotes  = [];
let revNextNoteId  = 1;

function renderRevSubjectPicker() {
  ['revSubjectPicker','revFilterSubject'].forEach(id => {
    const sel = document.getElementById(id); if (!sel) return;
    const val = sel.value;
    while (sel.options.length > 1) sel.remove(1);
    pomSubjects.forEach(s => { const opt = document.createElement('option'); opt.value = s.name; opt.textContent = s.name; sel.appendChild(opt); });
    sel.value = val;
  });
}

function renderRevCategoryFilter() {
  const sel = document.getElementById('revFilterCategory'); if (!sel) return;
  const val = sel.value;
  while (sel.options.length > 1) sel.remove(1);
  const cats = [...new Set(revisionNotes.map(n => n.category).filter(Boolean))];
  cats.forEach(c => { const opt = document.createElement('option'); opt.value = c; opt.textContent = c; sel.appendChild(opt); });
  sel.value = val;
}

document.getElementById('noteUpload').addEventListener('change', e => {
  const files = Array.from(e.target.files); if (!files.length) return;
  const subjName  = document.getElementById('revSubjectPicker').value;
  const category  = document.getElementById('revCategoryInput').value.trim();
  const titleBase = document.getElementById('revTitleInput').value.trim();
  const matchSubj = pomSubjects.find(s => s.name === subjName);
  files.forEach((file, fi) => {
    const reader = new FileReader();
    reader.onload = ev => {
      revisionNotes.push({ id: revNextNoteId++, name: titleBase || file.name.replace(/\.[^/.]+$/, ''), type: file.type.includes('pdf') ? 'pdf' : 'image', data: ev.target.result, subject: subjName, subjId: matchSubj ? matchSubj.id : null, category, date: todayStr() });
      if (fi === files.length - 1) {
        renderRevNotesList(); renderRevSubjectPicker(); renderRevCategoryFilter();
        document.getElementById('revTitleInput').value = '';
        document.getElementById('revCategoryInput').value = '';
        document.getElementById('noteUpload').value = '';
        if (currentSubjectId) renderSubjectPanel(currentSubjectId);
      }
    };
    reader.readAsDataURL(file);
  });
});

function renderRevNotesList() {
  const container = document.getElementById('revNotesList'); if (!container) return;
  const filterSubj = document.getElementById('revFilterSubject')?.value || '';
  const filterCat  = document.getElementById('revFilterCategory')?.value || '';
  const shown = revisionNotes.filter(n => {
    if (filterSubj && n.subject !== filterSubj) return false;
    if (filterCat  && n.category !== filterCat)  return false;
    return true;
  });
  container.innerHTML = '';
  const countEl = document.getElementById('revNoteCount');
  if (countEl) countEl.textContent = `${shown.length} note${shown.length !== 1 ? 's' : ''}`;
  if (shown.length === 0) { container.innerHTML = '<div style="font-size:0.78rem;color:var(--ink-muted);font-style:italic;padding:0.5rem 0">No notes yet — upload above</div>'; return; }
  shown.forEach(n => {
    const row = document.createElement('div'); row.className = 'rev-note-row';
    const thumbHTML = n.type === 'image' ? `<img class="rev-note-thumb" src="${n.data}" alt="${n.name}" />` : `<div class="rev-note-type-badge">📄</div>`;
    const subjTag = n.subject ? `<span class="rev-note-tag subject">${n.subject}</span>` : '';
    const catTag  = n.category ? `<span class="rev-note-tag category">${n.category}</span>` : '';
    row.innerHTML = `
      ${thumbHTML}
      <div class="rev-note-meta">
        <div class="rev-note-title">${n.name}</div>
        <div class="rev-note-tags">${subjTag}${catTag}</div>
        <div class="rev-note-date">${n.date}</div>
      </div>
      <div class="rev-note-actions">
        <button class="rev-note-btn" onclick="viewNote(${n.id})">👁</button>
        <button class="rev-note-btn del" onclick="deleteNote(${n.id})">🗑</button>
      </div>
    `;
    container.appendChild(row);
  });
}

window.viewNote = function(id) {
  const n = revisionNotes.find(x => x.id === id); if (!n) return;
  const win = window.open();
  if (n.type === 'image') win.document.write(`<img src="${n.data}" style="max-width:100%;height:auto" />`);
  else win.document.write(`<iframe src="${n.data}" style="width:100%;height:100vh;border:none"></iframe>`);
};

window.deleteNote = function(id) {
  revisionNotes = revisionNotes.filter(x => x.id !== id);
  renderRevNotesList(); renderRevCategoryFilter();
  if (currentSubjectId) renderSubjectPanel(currentSubjectId);
};

document.getElementById('revFilterSubject')?.addEventListener('change',  renderRevNotesList);
document.getElementById('revFilterCategory')?.addEventListener('change', renderRevNotesList);

// ═════════════════════════════════════════════
// SIDEBAR SUBJECTS
// ═════════════════════════════════════════════
const SUBJ_EMOJIS = ['🧬','📐','⚗️','📖','🌍','🎵','💻','🏛️','🎨','📜','🔬','📊'];
let currentSubjectId = null;

function renderSbSubjects() {
  const list = document.getElementById('sbSubjectList'); if (!list) return;
  list.innerHTML = '';
  pomSubjects.forEach(s => {
    const el = document.createElement('div');
    el.className = 'sb-item' + (currentSubjectId === s.id ? ' active' : '');
    el.dataset.subjectId = s.id;
    const emoji = SUBJ_EMOJIS[pomSubjects.indexOf(s) % SUBJ_EMOJIS.length];
    el.innerHTML = `
      <span class="si">${emoji}</span>
      <span style="flex:1;overflow:hidden;text-overflow:ellipsis">${s.name}</span>
      <button class="subj-sb-del" data-id="${s.id}"
        style="background:none;border:none;font-size:0.6rem;color:var(--ink-muted);opacity:0;transition:opacity 0.15s;margin-left:auto"
        title="Remove subject">✕</button>
    `;
    el.addEventListener('mouseenter', () => el.querySelector('.subj-sb-del').style.opacity = '1');
    el.addEventListener('mouseleave', () => el.querySelector('.subj-sb-del').style.opacity = '0');
    el.addEventListener('click', e => { if (e.target.classList.contains('subj-sb-del')) return; openSubjectPanel(s.id); });
    el.querySelector('.subj-sb-del').addEventListener('click', e => {
      e.stopPropagation();
      if (!confirm(`Remove "${s.name}" and all its data?`)) return;
      pomSubjects = pomSubjects.filter(x => x.id !== s.id);
      if (currentSubjectId === s.id) { currentSubjectId = null; showHome(); }
      if (pomActiveId === s.id) { pomActiveId = null; updatePomBadge(); renderPomTabs(); }
      renderSbSubjects(); renderPomStats();
    });
    list.appendChild(el);
  });
  if (pomSubjects.length === 0) {
    const ph = document.createElement('div');
    ph.style.cssText = 'padding:0.3rem 0.9rem;font-size:0.72rem;color:var(--ink-muted);font-style:italic';
    ph.textContent = 'No subjects yet — press ＋';
    list.appendChild(ph);
  }
}

function openAddSubjectSidebar() {
  const form = document.getElementById('sbAddSubjectForm');
  form.style.display = form.style.display === 'none' ? 'flex' : 'none';
  if (form.style.display === 'flex') document.getElementById('sbSubjectInput').focus();
}

function confirmAddSubjectSidebar() {
  const inp  = document.getElementById('sbSubjectInput');
  const name = inp.value.trim(); if (!name) return;
  const newSubj = { id: pomNextSubjId++, name, totalSec: 0, sessions: [], todos: [] };
  pomSubjects.push(newSubj);
  inp.value = '';
  document.getElementById('sbAddSubjectForm').style.display = 'none';
  renderPomTabs(); renderSbSubjects(); renderRevSubjectPicker(); renderSubjectFolders();
  openSubjectPanel(newSubj.id);
}

function cancelAddSubjectSidebar() {
  document.getElementById('sbAddSubjectForm').style.display = 'none';
  document.getElementById('sbSubjectInput').value = '';
}

document.getElementById('sbSubjectInput').addEventListener('keypress', e => { if (e.key === 'Enter') confirmAddSubjectSidebar(); });

function openSubjectPanel(id) {
  currentSubjectId = id;
  const subj = pomSubjects.find(s => s.id === id); if (!subj) return;
  const emoji = SUBJ_EMOJIS[pomSubjects.indexOf(subj) % SUBJ_EMOJIS.length];
  document.getElementById('subjectPanelEmoji').textContent = emoji;
  document.getElementById('subjectPanelTitle').textContent = subj.name;
  document.getElementById('subjectPanelSub').textContent   = 'All tracked data for ' + subj.name;
  document.getElementById('homeView').style.display = 'none';
  document.querySelectorAll('.tool-panel').forEach(p => p.classList.remove('visible'));
  document.querySelector('.main-area').classList.add('panel-active');
  document.getElementById('panel-subject').classList.add('visible');
  document.getElementById('addressText').textContent = `Tangent / Dashboard / ${subj.name}`;
  document.getElementById('pathLabel').textContent   = subj.name;
  document.querySelectorAll('.sb-item[data-subject-id]').forEach(el => el.classList.toggle('active', parseInt(el.dataset.subjectId) === id));
  document.querySelectorAll('.sb-item[data-nav]').forEach(el => el.classList.remove('active'));
  renderSubjectPanel(id); renderSbSubjects();
}

// ═════════════════════════════════════════════
// SUBJECT PANEL RENDERER
// ═════════════════════════════════════════════
function renderSubjectPanel(id) {
  const subj    = pomSubjects.find(s => s.id === id);
  const content = document.getElementById('subjectPanelContent');
  if (!subj || !content) return;
  content.innerHTML = '';

  function makeCard(titleIcon, titleText, wide) {
    const card = document.createElement('div');
    card.className = 'subj-card' + (wide ? ' wide' : '');
    card.innerHTML = `<div class="subj-card-title"><span>${titleIcon}</span>${titleText}</div>`;
    content.appendChild(card); return card;
  }
  function emptyRow(card, msg) { const d = document.createElement('div'); d.className = 'subj-empty'; d.textContent = msg; card.appendChild(d); }

  // Time card
  const timeCard = makeCard('⏱', 'Study Time');
  const h = Math.floor(subj.totalSec / 3600), m = Math.floor((subj.totalSec % 3600) / 60), s = subj.totalSec % 60;
  const statEl = document.createElement('div'); statEl.className = 'subj-card-stat';
  statEl.textContent = subj.totalSec > 0 ? (h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`) : '0m';
  timeCard.appendChild(statEl);
  const metaEl = document.createElement('div'); metaEl.className = 'subj-card-meta';
  metaEl.textContent = subj.sessions.length > 0 ? `${subj.sessions.length} session${subj.sessions.length > 1 ? 's' : ''} recorded` : 'No sessions yet';
  timeCard.appendChild(metaEl);
  if (subj.sessions.length > 0) {
    const ul = document.createElement('ul'); ul.className = 'subj-list'; ul.style.marginTop = '0.6rem';
    [...subj.sessions].reverse().slice(0, 3).forEach(sess => {
      const li = document.createElement('li');
      li.innerHTML = `<span>${sess.note || '—'}</span><span class="subj-li-val">${durFmt(sess.dur)}</span>`;
      ul.appendChild(li);
    });
    timeCard.appendChild(ul);
  }

  // Grade card
  const gradeCard = makeCard('📊', 'Grade');
  const matchedGrade = grades.find(g => g.subject.toLowerCase().includes(subj.name.toLowerCase()) || subj.name.toLowerCase().includes(g.subject.toLowerCase()));
  if (matchedGrade) {
    const cls = gcls(matchedGrade.grade);
    const gStat = document.createElement('div'); gStat.className = 'subj-card-stat';
    gStat.style.color = cls === 'high' ? 'var(--green)' : cls === 'mid' ? 'var(--accent)' : '#e05050';
    gStat.textContent = matchedGrade.grade + '%'; gradeCard.appendChild(gStat);
    const gMeta = document.createElement('div'); gMeta.className = 'subj-card-meta'; gMeta.textContent = matchedGrade.subject; gradeCard.appendChild(gMeta);
    const row = document.createElement('div'); row.style.cssText = 'display:flex;gap:0.35rem;margin-top:0.6rem';
    row.innerHTML = `<input type="number" class="t-input" id="subjGradeInp_${id}" placeholder="Update %" min="0" max="100" style="height:26px;font-size:0.75rem;padding:0.2rem 0.5rem;flex:1" /><button class="t-btn primary" style="height:26px;font-size:0.7rem;padding:0 0.5rem" onclick="updateSubjGrade(${id}, '${matchedGrade.subject}')">Save</button>`;
    gradeCard.appendChild(row);
  } else {
    emptyRow(gradeCard, 'No grade logged — add one in Grade Tracker');
    const row = document.createElement('div'); row.style.cssText = 'display:flex;gap:0.35rem;margin-top:0.5rem';
    row.innerHTML = `<input type="number" class="t-input" id="subjGradeInp_${id}" placeholder="Add grade %" min="0" max="100" style="height:26px;font-size:0.75rem;padding:0.2rem 0.5rem;flex:1" /><button class="t-btn primary" style="height:26px;font-size:0.7rem;padding:0 0.5rem" onclick="addSubjGrade(${id}, '${subj.name}')">Add</button>`;
    gradeCard.appendChild(row);
  }

  // Tasks card
  const taskCard = makeCard('📝', 'Tasks for ' + subj.name, false);
  if (subj.todos.length === 0) emptyRow(taskCard, 'No tasks linked yet');
  else {
    const ul = document.createElement('ul'); ul.className = 'subj-list';
    subj.todos.forEach((t, ti) => {
      const li = document.createElement('li');
      li.innerHTML = `<span style="${t.done ? 'text-decoration:line-through;color:var(--ink-muted)' : ''}">${t.text}</span><span class="subj-li-val" style="color:${t.done ? 'var(--green)' : 'var(--ink-muted)'}">${t.done ? '✓' : '○'}</span>`;
      li.style.cursor = 'pointer';
      li.addEventListener('click', () => { subj.todos[ti].done = !subj.todos[ti].done; renderSubjectPanel(id); });
      ul.appendChild(li);
    });
    taskCard.appendChild(ul);
  }
  const addTaskRow = document.createElement('div'); addTaskRow.style.cssText = 'display:flex;gap:0.35rem;margin-top:0.5rem';
  addTaskRow.innerHTML = `<input type="text" class="t-input" id="subjTaskInp_${id}" placeholder="Add task…" style="height:26px;font-size:0.75rem;padding:0.2rem 0.5rem;flex:1" /><button class="t-btn primary" id="subjTaskBtn_${id}" style="height:26px;font-size:0.7rem;padding:0 0.5rem">+</button>`;
  taskCard.appendChild(addTaskRow);
  setTimeout(() => {
    const inp = document.getElementById(`subjTaskInp_${id}`), btn = document.getElementById(`subjTaskBtn_${id}`);
    if (!inp || !btn) return;
    const fn = () => { const v = inp.value.trim(); if (v) { subj.todos.push({ text: v, done: false }); inp.value = ''; renderSubjectPanel(id); renderPomDetail(); } };
    btn.addEventListener('click', fn); inp.addEventListener('keypress', e => { if (e.key === 'Enter') fn(); });
  }, 0);

  // Session log card
  const sessCard = makeCard('📋', 'Session Log', false);
  if (subj.sessions.length === 0) emptyRow(sessCard, 'Complete a Pomodoro session to see logs here');
  else {
    const ul = document.createElement('ul'); ul.className = 'subj-list';
    [...subj.sessions].reverse().slice(0, 5).forEach(sess => {
      const li = document.createElement('li');
      li.innerHTML = `<div style="display:flex;flex-direction:column;gap:0.05rem;flex:1"><span>${sess.note || '—'}</span><span style="font-size:0.6rem;color:var(--ink-muted)">${sess.date}</span></div><span class="subj-li-val" style="color:var(--accent)">${durFmt(sess.dur)}</span>`;
      ul.appendChild(li);
    });
    sessCard.appendChild(ul);
    if (subj.sessions.length > 5) { const more = document.createElement('div'); more.className = 'subj-empty'; more.style.marginTop = '0.3rem'; more.textContent = `+${subj.sessions.length - 5} more in Pomodoro tab`; sessCard.appendChild(more); }
  }

  // Notes card
  const notesCard = makeCard('📘', 'Notes', true);
  const subjNotes = revisionNotes.filter(n => n.subjId === id || n.subject === subj.name);
  if (subjNotes.length === 0) { const emp = document.createElement('div'); emp.className = 'subj-empty'; emp.innerHTML = 'No notes yet — upload in Revision and tag this subject'; notesCard.appendChild(emp); }
  else {
    const cats = [...new Set(subjNotes.map(n => n.category || 'General'))];
    cats.forEach(cat => {
      const catNotes = subjNotes.filter(n => (n.category || 'General') === cat);
      const catHead = document.createElement('div');
      catHead.style.cssText = 'font-size:0.62rem;letter-spacing:0.1em;text-transform:uppercase;color:var(--ink-muted);margin:0.6rem 0 0.3rem;padding-top:0.3rem;border-top:1px solid var(--rule)';
      catHead.textContent = cat; notesCard.appendChild(catHead);
      const noteGrid = document.createElement('div'); noteGrid.style.cssText = 'display:flex;flex-wrap:wrap;gap:0.5rem';
      catNotes.forEach(n => {
        const tile = document.createElement('div'); tile.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:0.3rem;cursor:pointer'; tile.title = n.name;
        let thumbEl;
        if (n.type === 'image') { thumbEl = document.createElement('img'); thumbEl.src = n.data; thumbEl.style.cssText = 'width:56px;height:48px;object-fit:cover;border-radius:4px;border:1px solid var(--rule)'; }
        else { thumbEl = document.createElement('div'); thumbEl.style.cssText = 'width:56px;height:48px;display:flex;align-items:center;justify-content:center;font-size:1.5rem;background:var(--bg-inset);border-radius:4px;border:1px solid var(--rule)'; thumbEl.textContent = '📄'; }
        const label = document.createElement('div'); label.style.cssText = 'font-size:0.6rem;color:var(--ink-muted);max-width:60px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:center'; label.textContent = n.name;
        tile.appendChild(thumbEl); tile.appendChild(label); tile.addEventListener('click', () => viewNote(n.id));
        noteGrid.appendChild(tile);
      });
      notesCard.appendChild(noteGrid);
    });
  }
  const uploadShortcut = document.createElement('div'); uploadShortcut.style.cssText = 'display:flex;gap:0.4rem;margin-top:0.7rem;align-items:center';
  uploadShortcut.innerHTML = `<button class="t-btn" style="font-size:0.72rem;padding:0.25rem 0.6rem" onclick="quickUploadForSubject('${subj.name}')">📎 Add Note to ${subj.name}</button>`;
  notesCard.appendChild(uploadShortcut);

  // Quick start card
  const startCard = makeCard('▶', 'Quick Start', false);
  startCard.innerHTML += `<div class="subj-empty" style="margin-bottom:0.5rem">Start a Pomodoro session for ${subj.name}</div><button class="t-btn primary" style="width:100%;padding:0.5rem" onclick="quickStartSubject(${id})">⏱ Start Session for ${subj.name}</button>`;
}

window.quickUploadForSubject = function(subjName) {
  const picker = document.getElementById('revSubjectPicker'); if (picker) picker.value = subjName;
  const f = folders.find(x => x.panel === 'revision');
  if (f) openFolder(f.id);
  else {
    document.getElementById('homeView').style.display = 'none';
    document.querySelectorAll('.tool-panel').forEach(p => p.classList.remove('visible'));
    document.querySelector('.main-area').classList.add('panel-active');
    document.getElementById('panel-revision').classList.add('visible');
    document.getElementById('addressText').textContent = 'Tangent / Dashboard / Revision';
    document.getElementById('pathLabel').textContent = 'Revision';
  }
};

function quickStartSubject(id) {
  pomActiveId = id;
  document.getElementById('homeView').style.display = 'none';
  document.querySelectorAll('.tool-panel').forEach(p => p.classList.remove('visible'));
  document.querySelector('.main-area').classList.add('panel-active');
  document.getElementById('panel-pomodoro').classList.add('visible');
  document.getElementById('addressText').textContent = 'Tangent / Dashboard / Pomodoro';
  document.getElementById('pathLabel').textContent   = 'Pomodoro';
  setActiveSb('pomodoro');
  renderPomTabs(); renderPomDetail(); updatePomBadge();
}

window.addSubjGrade = function(subjId, name) {
  const inp = document.getElementById('subjGradeInp_' + subjId);
  const g = parseFloat(inp?.value); if (isNaN(g) || g < 0 || g > 100) return;
  grades.push({ subject: name, grade: g }); renderGrades(); renderSubjectPanel(subjId);
};

window.updateSubjGrade = function(subjId, subjectName) {
  const inp = document.getElementById('subjGradeInp_' + subjId);
  const g = parseFloat(inp?.value); if (isNaN(g) || g < 0 || g > 100) return;
  const existing = grades.find(x => x.subject === subjectName);
  if (existing) existing.grade = g; else grades.push({ subject: subjectName, grade: g });
  renderGrades(); renderSubjectPanel(subjId);
};

document.getElementById('pomSubjectConfirm').addEventListener('click', () => { renderSbSubjects(); });

// ═════════════════════════════════════════════
// CUSTOM THEME EDITOR
// ═════════════════════════════════════════════
const THEME_VARS = [
  { key:'ink',        label:'Main text',        desc:'Headings, body text',           group:'Text' },
  { key:'ink-light',  label:'Secondary text',   desc:'Labels, folder names',          group:'Text' },
  { key:'ink-muted',  label:'Muted text',       desc:'Placeholders, hints',           group:'Text' },
  { key:'bg',         label:'Page background',  desc:'Main window background',        group:'Backgrounds' },
  { key:'bg-card',    label:'Card background',  desc:'Panels, view toolbar',          group:'Backgrounds' },
  { key:'bg-inset',   label:'Inset background', desc:'Inputs, wells, palette panel',  group:'Backgrounds' },
  { key:'sidebar-bg', label:'Sidebar',          desc:'Left navigation panel',         group:'Backgrounds' },
  { key:'titlebar',   label:'Title bar',        desc:'Top bar + status bar',          group:'Backgrounds' },
  { key:'accent',      label:'Accent colour',   desc:'Buttons, active states, rings', group:'Accent' },
  { key:'accent-dark', label:'Accent dark',     desc:'Hover / pressed accent',        group:'Accent' },
  { key:'primary',     label:'Primary blue',    desc:'Soft highlight (A9DEF9)',        group:'Accent' },
  { key:'secondary',   label:'Secondary blue',  desc:'Brand blue, links',             group:'Accent' },
  { key:'rule',   label:'Borders / dividers', desc:'All border and rule lines',       group:'Utility' },
  { key:'green',  label:'Success / high grade', desc:'Grade colours, status dot',    group:'Utility' },
];

const THEME_PRESETS = [
  { name: '☀️ Default Light', colours: { 'ink':'#4c4c4c','ink-light':'#6a6a6a','ink-muted':'#9a9a9a','bg':'#fffdfb','bg-card':'#f5f2ee','bg-inset':'#ece8e3','sidebar-bg':'#edeae5','titlebar':'#e6e2dc','accent':'#539ec4','accent-dark':'#2a8bbc','primary':'#A9DEF9','secondary':'#2a8bbc','rule':'#dcd8d2','green':'#3aab6e' } },
  { name: '🌙 Casio Dark',    colours: { 'ink':'#d4e8f8','ink-light':'#8bb5d4','ink-muted':'#4a7190','bg':'#071624','bg-card':'#0c2035','bg-inset':'#091b2e','sidebar-bg':'#050e1b','titlebar':'#040d1a','accent':'#3b9eff','accent-dark':'#1a6fd4','primary':'#3b9eff','secondary':'#1a6fd4','rule':'#122840','green':'#00e080' } },
  { name: '🌸 Blossom',       colours: { 'ink':'#3d2b35','ink-light':'#7a4f62','ink-muted':'#b08898','bg':'#fff5f8','bg-card':'#ffe8ef','bg-inset':'#ffd6e4','sidebar-bg':'#fce3eb','titlebar':'#f7cdd9','accent':'#e06f95','accent-dark':'#c04570','primary':'#f7b8d0','secondary':'#c04570','rule':'#f0c0cf','green':'#5aab7e' } },
  { name: '🌿 Sage',          colours: { 'ink':'#1e2e22','ink-light':'#3d5c44','ink-muted':'#7a9980','bg':'#f4faf5','bg-card':'#e6f2e8','bg-inset':'#d4e8d8','sidebar-bg':'#dceede','titlebar':'#cce4d0','accent':'#3aab6e','accent-dark':'#2d7a4f','primary':'#a8d8a8','secondary':'#2d7a4f','rule':'#bcd8c0','green':'#3aab6e' } },
  { name: '🌑 Void',          colours: { 'ink':'#e8e8e8','ink-light':'#aaaaaa','ink-muted':'#555555','bg':'#0a0a0a','bg-card':'#141414','bg-inset':'#1a1a1a','sidebar-bg':'#0f0f0f','titlebar':'#050505','accent':'#ffffff','accent-dark':'#cccccc','primary':'#cccccc','secondary':'#bbbbbb','rule':'#2a2a2a','green':'#44dd88' } },
  { name: '☕ Mocha',         colours: { 'ink':'#2e1f0e','ink-light':'#6b4226','ink-muted':'#a07850','bg':'#fdf6ee','bg-card':'#f5e9d8','bg-inset':'#ecdcc6','sidebar-bg':'#ede0cc','titlebar':'#dfd0b4','accent':'#8b5a2b','accent-dark':'#5c3317','primary':'#d4a574','secondary':'#5c3317','rule':'#d8c4a0','green':'#4e8c3a' } },
];

let editorValues = {};

function openThemeEditor() {
  const style = getComputedStyle(document.documentElement);
  THEME_VARS.forEach(v => { editorValues[v.key] = style.getPropertyValue('--' + v.key).trim(); });
  renderThemeEditor();
  document.getElementById('themeModal').classList.add('open');
}

function closeThemeEditor() { document.getElementById('themeModal').classList.remove('open'); }

function renderThemeEditor() {
  const strip = document.getElementById('themePreviewStrip');
  strip.querySelectorAll('.theme-preview-dot').forEach(d => d.remove());
  ['bg','sidebar-bg','bg-card','bg-inset','accent','primary','secondary','green','rule'].forEach(k => {
    const dot = document.createElement('div'); dot.className = 'theme-preview-dot';
    dot.style.background = editorValues[k] || '#ccc'; dot.title = '--' + k;
    strip.insertBefore(dot, strip.querySelector('.theme-preview-label'));
  });

  const presetBar = document.getElementById('themePresetBar'); presetBar.innerHTML = '';
  THEME_PRESETS.forEach(p => {
    const btn = document.createElement('button'); btn.className = 'theme-preset-btn'; btn.textContent = p.name;
    btn.addEventListener('click', () => { Object.assign(editorValues, p.colours); renderThemeEditor(); });
    presetBar.appendChild(btn);
  });

  const container = document.getElementById('themeVarRows'); container.innerHTML = '';
  let lastGroup = null;
  THEME_VARS.forEach(v => {
    if (v.group !== lastGroup) {
      const gh = document.createElement('div'); gh.className = 'theme-group'; gh.textContent = v.group; container.appendChild(gh); lastGroup = v.group;
    }
    const row = document.createElement('div'); row.className = 'theme-row';
    const labelWrap = document.createElement('div');
    labelWrap.innerHTML = `<div class="theme-var-label">${v.label}</div><div class="theme-var-desc">--${v.key}</div>`;
    const colourInput = document.createElement('input'); colourInput.type = 'color'; colourInput.className = 'theme-colour-input'; colourInput.value = rgbToHex(editorValues[v.key] || '#888888');
    const hexInput = document.createElement('input'); hexInput.type = 'text'; hexInput.className = 'theme-hex-input'; hexInput.value = rgbToHex(editorValues[v.key] || '#888888'); hexInput.placeholder = '#rrggbb';
    colourInput.addEventListener('input', () => { hexInput.value = colourInput.value; editorValues[v.key] = colourInput.value; refreshPreviewStrip(); });
    hexInput.addEventListener('input', () => { const val = hexInput.value.trim(); if (/^#[0-9a-fA-F]{6}$/.test(val)) { colourInput.value = val; editorValues[v.key] = val; refreshPreviewStrip(); } });
    row.appendChild(labelWrap); row.appendChild(colourInput); row.appendChild(hexInput);
    container.appendChild(row);
  });
}

function refreshPreviewStrip() {
  document.querySelectorAll('.theme-preview-dot').forEach(dot => {
    const key = dot.title.replace('--',''); if (editorValues[key]) dot.style.background = editorValues[key];
  });
}

function applyTheme() {
  const root = document.documentElement;
  THEME_VARS.forEach(v => { if (editorValues[v.key]) root.style.setProperty('--' + v.key, editorValues[v.key]); });
  localStorage.setItem('tangent-custom-theme', JSON.stringify(editorValues));
  closeThemeEditor();
}

function resetTheme() {
  const root = document.documentElement;
  THEME_VARS.forEach(v => root.style.removeProperty('--' + v.key));
  localStorage.removeItem('tangent-custom-theme');
  const style = getComputedStyle(root);
  THEME_VARS.forEach(v => { editorValues[v.key] = style.getPropertyValue('--' + v.key).trim(); });
  renderThemeEditor();
}

(function restoreSavedTheme() {
  const saved = localStorage.getItem('tangent-custom-theme'); if (!saved) return;
  try {
    const vals = JSON.parse(saved); const root = document.documentElement;
    Object.entries(vals).forEach(([k, v]) => root.style.setProperty('--' + k, v));
  } catch(e) {}
})();

function rgbToHex(str) {
  if (!str || str.startsWith('#')) return str || '#888888';
  const m = str.match(/\d+/g); if (!m || m.length < 3) return '#888888';
  return '#' + m.slice(0,3).map(n => parseInt(n).toString(16).padStart(2,'0')).join('');
}

// ═════════════════════════════════════════════
// INITIAL RENDER
// ═════════════════════════════════════════════
showHome();
renderSbSubjects();
renderRevSubjectPicker();