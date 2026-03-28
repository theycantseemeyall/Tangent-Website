// ═════════════════════════════════════════════
// CONFIGURATION
// ═════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  'https://fcoahfwvrpgkrchcaeft.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjb2FoZnd2cnBna3JjaGNhZWZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MjQ1ODYsImV4cCI6MjA5MDIwMDU4Nn0.y849sbQ4-DW1g-kqIMvRirmFN8E8sCLoF-YmzftuLNk'
)
const { data: { session } } = await supabase.auth.getSession()
if (!session) window.location.href = 'index.html'
const user = session.user
console.log('Logged in as:', user.email)

document.getElementById('signOutBtn').addEventListener('click', async () => {
  await supabase.auth.signOut()
  window.location.href = 'index.html'
})

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
  { id:4, name:'Revision',  emoji:'📘',  colour:'#9b6fd4', panel:'revision', image: null },
  { id:5, name:'Notes',     emoji:'📓',  colour:'#e8a030', panel:'notes',    image: null },
  { id:6, name:'Exams',     emoji:'🎓',  colour:'#e05050', panel:'exams',    image: null },
];

let nextId = 7;

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
  if (f.panel === 'notes')    renderNotesSubjectView();
  if (f.panel === 'exams')    renderExams();
  if (f.panel === 'calendar') calRender();
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

const FS_CIRCUM = 741.42;

function pomUpdateRing() {
  const fmt = pomFmt(pomTime);
  const ratio = pomTime / pomFull;
  const offset = FS_CIRCUM * (1 - ratio);

  document.getElementById('pomDisplay').textContent = fmt;
  const circle = document.querySelector('#pomRing .progress');
  if (circle) {
    circle.style.strokeDasharray  = CIRCUM;
    circle.style.strokeDashoffset = CIRCUM * (1 - ratio);
  }

  const fsDisplay = document.getElementById('pomFsDisplay');
  const fsCircle  = document.getElementById('pomFsProgressCircle');
  if (fsDisplay) fsDisplay.textContent = fmt;
  if (fsCircle)  fsCircle.style.strokeDashoffset = offset;

  const isBreak = pomFull <= 15 * 60;
  const labelTxt = isBreak ? 'break' : 'focus';
  document.getElementById('pomRingLabel').textContent = labelTxt;
  const fsLabel = document.getElementById('pomFsLabel');
  if (fsLabel) fsLabel.textContent = labelTxt;
}

function pomEnterFullscreen() {
  const subj = pomSubjects.find(s => s.id === pomActiveId);
  const label = document.getElementById('pomFsSubject');
  if (label) label.textContent = subj ? `📚 ${subj.name}` : '📚 Untracked Session';
  pomFsRefreshStats();
  document.getElementById('pomFullscreen').classList.add('active');
  document.getElementById('pomFsToggle').textContent = '⏸ Pause';
}

function pomExitFullscreen() {
  document.getElementById('pomFullscreen').classList.remove('active');
}

function pomFsRefreshStats() {
  const todayTotal = pomSubjects.reduce((sum, s) => {
    return sum + s.sessions
      .filter(ses => ses.date === todayStr())
      .reduce((a, ses) => a + ses.dur, 0);
  }, 0);
  const h = Math.floor(todayTotal / 3600);
  const m = Math.floor((todayTotal % 3600) / 60);
  const totalSessions = pomSubjects.reduce((sum, s) =>
    sum + s.sessions.filter(ses => ses.date === todayStr()).length, 0);
  const hEl = document.getElementById('pomFsHours');
  const mEl = document.getElementById('pomFsMins');
  const sEl = document.getElementById('pomFsSessions');
  if (hEl) hEl.textContent = h;
  if (mEl) mEl.textContent = m;
  if (sEl) sEl.textContent = totalSessions;
}

function pomFsDoToggle() {
  const btn = document.getElementById('pomFsToggle');
  if (pomRunning) {
    clearInterval(pomTimer);
    pomRunning = false;
    pomTimer = null;
    if (btn) btn.textContent = '▶ Resume';
  } else {
    pomRunning = true;
    pomTimer = setInterval(() => {
      if (pomTime > 0) {
        pomTime--; pomElapsed++; pomUpdateRing();
        const liveSubj = pomSubjects.find(s => s.id === pomActiveId);
        if (liveSubj) pomLiveOffset = pomElapsed;
        renderPomStats();
        pomFsRefreshStats();
      } else {
        pomSessionComplete(pomElapsed);
        pomExitFullscreen();
      }
    }, 1000);
    if (btn) btn.textContent = '⏸ Pause';
  }
}

function pomFsDoReset() {
  clearInterval(pomTimer);
  pomRunning = false; pomTimer = null;
  pomElapsed = 0; pomLiveOffset = 0;
  pomTime = pomFull;
  pomUpdateRing(); renderPomStats();
  pomExitFullscreen();
}

function pomFsDoSkip() {
  const elapsed = pomElapsed > 0 ? pomElapsed : pomFull - pomTime;
  clearInterval(pomTimer); pomRunning = false; pomTimer = null;
  pomSessionComplete(elapsed);
  pomExitFullscreen();
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
  if (pomRunning) { pomEnterFullscreen(); return; }
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
      pomFsRefreshStats();
    } else {
      pomSessionComplete(pomElapsed);
      pomExitFullscreen();
    }
  }, 1000);
  pomEnterFullscreen();
});

document.getElementById('pomReset').addEventListener('click', () => {
  clearInterval(pomTimer);
  pomRunning = false; pomTimer = null; pomElapsed = 0; pomLiveOffset = 0;
  pomTime = pomFull; pomUpdateRing(); renderPomStats();
});

document.getElementById('pomSkip').addEventListener('click', () => {
  if (!pomRunning && pomElapsed === 0) return;
  const elapsed = pomElapsed > 0 ? pomElapsed : pomFull - pomTime;
  clearInterval(pomTimer); pomRunning = false; pomTimer = null;
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
  renderSbSubjects();
  renderSubjectFolders();
  renderRevSubjectPicker();
  renderNotesSubjectView();
};

document.getElementById('pomSubjectConfirm').addEventListener('click', addSubjectFn);
document.getElementById('pomSubjectNameInput').addEventListener('keypress', e => { if (e.key === 'Enter') addSubjectFn(); });

pomUpdateRing();
renderPomStats();

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
let calYear  = new Date().getFullYear();
let calMonth = new Date().getMonth();

function calRender() {
  const grid  = document.getElementById('calDays');
  const wdBar = document.getElementById('calWd');
  const title = document.getElementById('calMonth');
  if (!grid) return;

  title.textContent = `${MONTHS[calMonth]} ${calYear}`;

  wdBar.innerHTML = '';
  ['Su','Mo','Tu','We','Th','Fr','Sa'].forEach(d => {
    const el = document.createElement('div');
    el.className = 'cal-wd'; el.textContent = d; wdBar.appendChild(el);
  });

  grid.innerHTML = '';
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const lastDate = new Date(calYear, calMonth + 1, 0).getDate();
  const todayD   = new Date();

  for (let i = 0; i < firstDay; i++) {
    const blank = document.createElement('div'); grid.appendChild(blank);
  }
  for (let d = 1; d <= lastDate; d++) {
    const cell = document.createElement('div');
    cell.textContent = d;
    const isToday = d === todayD.getDate() && calMonth === todayD.getMonth() && calYear === todayD.getFullYear();
    if (isToday) cell.classList.add('today');
    grid.appendChild(cell);
  }
}

calRender();

// ═════════════════════════════════════════════
// SEARCH
// ═════════════════════════════════════════════
document.getElementById('searchInput').addEventListener('input', () => {
  if (document.getElementById('homeView').style.display === 'none') showHome();
  renderFolders();
});

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
      renderSbSubjects(); renderPomStats(); renderSubjectFolders(); renderRevSubjectPicker();
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
  renderPomTabs();
  renderSbSubjects();
  renderRevSubjectPicker();
  renderSubjectFolders();
  renderNotesSubjectView();
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

// ═════════════════════════════════════════════
// LIGHTBOX — shared by Revision + Notes panels
// ═════════════════════════════════════════════
function revFullscreen(id) {
  const n = revisionNotes.find(x => x.id === parseInt(id));
  if (!n || n.type !== 'image') return;
  // Remove any existing lightbox first
  const existing = document.getElementById('revLightbox');
  if (existing) existing.remove();

  const box = document.createElement('div');
  box.id = 'revLightbox';
  box.style.cssText = [
    'position:fixed','inset:0','z-index:3000',
    'background:rgba(0,0,0,0.93)',
    'display:flex','align-items:center','justify-content:center',
    'cursor:zoom-out'
  ].join(';');
  box.addEventListener('click', () => box.remove());

  const img = document.createElement('img');
  img.src = n.data;
  img.style.cssText = [
    'max-width:95vw','max-height:95vh',
    'width:auto','height:auto',
    'object-fit:contain',
    'border-radius:3px',
    'box-shadow:0 8px 40px rgba(0,0,0,0.6)',
    'display:block'
  ].join(';');
  // Stop click on image bubbling so only background click closes
  img.addEventListener('click', e => e.stopPropagation());

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕';
  closeBtn.style.cssText = [
    'position:absolute','top:1rem','right:1.2rem',
    'background:rgba(255,255,255,0.12)','border:none','color:white',
    'font-size:1.3rem','width:36px','height:36px',
    'border-radius:6px','cursor:pointer','line-height:1'
  ].join(';');
  closeBtn.addEventListener('click', e => { e.stopPropagation(); box.remove(); });

  box.appendChild(img);
  box.appendChild(closeBtn);
  document.body.appendChild(box);
}

// Close lightbox on Escape key
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    const lb = document.getElementById('revLightbox');
    if (lb) lb.remove();
  }
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
  if (shown.length === 0) {
    container.innerHTML = '<div style="font-size:0.78rem;color:var(--ink-muted);font-style:italic;padding:0.5rem 0">No notes yet — upload above</div>';
    return;
  }

  shown.forEach(n => {
    const card = document.createElement('div');
    card.className = 'rev-index-card';

    const subjTag = n.subject  ? `<span class="rev-note-tag subject">${n.subject}</span>`   : '';
    const catTag  = n.category ? `<span class="rev-note-tag category">${n.category}</span>` : '';

    let bodyHTML = '';
    if (n.type === 'image') {
      // ── Natural size, no fixed height box, click to fullscreen ──
      bodyHTML = `
        <div class="rev-index-card-img-wrap">
          <img class="rev-index-card-img"
               src="${n.data}"
               alt="${n.name}"
               loading="lazy"
               onclick="revFullscreen(${n.id})"
               style="cursor:zoom-in" />
        </div>`;
    } else if (n.type === 'written') {
      bodyHTML = `
        <div class="rev-index-card-img-wrap">
          <div class="rev-index-card-pdf">
            <span style="font-size:2rem">✏️</span>
            <span style="font-weight:600;color:var(--ink)">${n.name}</span>
            <span style="font-size:0.7rem;color:var(--ink-muted)">${n.date}</span>
          </div>
        </div>`;
    } else {
      bodyHTML = `
        <div class="rev-index-card-img-wrap">
          <div class="rev-index-card-pdf">
            <span style="font-size:2.5rem">📄</span>
            <span style="font-weight:600;color:var(--ink)">${n.name}</span>
            <button class="t-btn primary" onclick="viewNote(${n.id})"
                    style="margin-top:0.7rem;font-size:0.76rem">Open PDF</button>
          </div>
        </div>`;
    }

    card.innerHTML = `
      <div class="rev-index-card-label">
        <span>${n.name}</span>
        <div style="display:flex;align-items:center;gap:0.5rem">
          <div class="rev-index-card-tags">${subjTag}${catTag}</div>
          <span style="font-size:0.62rem;color:var(--ink-muted)">${n.date}</span>
          <div class="rev-index-card-actions">
            ${n.type === 'image' ? `<button class="rev-note-btn" onclick="revFullscreen(${n.id})" title="Fullscreen">⛶</button>` : ''}
            <button class="rev-note-btn" onclick="viewNote(${n.id})" title="Open in new tab">⤢</button>
            <button class="rev-note-btn del" onclick="deleteNote(${n.id})" title="Delete">🗑</button>
          </div>
        </div>
      </div>
      ${bodyHTML}
    `;
    container.appendChild(card);
  });
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
      revisionNotes.push({
        id: revNextNoteId++,
        name: titleBase || file.name.replace(/\.[^/.]+$/, ''),
        type: file.type.includes('pdf') ? 'pdf' : 'image',
        data: ev.target.result,
        subject: subjName,
        subjId: matchSubj ? matchSubj.id : null,
        category,
        date: todayStr()
      });
      if (fi === files.length - 1) {
        renderRevNotesList();
        renderRevSubjectPicker();
        renderRevCategoryFilter();
        document.getElementById('revTitleInput').value = '';
        document.getElementById('revCategoryInput').value = '';
        document.getElementById('noteUpload').value = '';
        if (currentSubjectId) renderSubjectPanel(currentSubjectId);
        renderNotesSubjectView();
      }
    };
    reader.readAsDataURL(file);
  });
});

window.viewNote = function(id) {
  const n = revisionNotes.find(x => x.id === id); if (!n) return;
  const win = window.open();
  if (n.type === 'image') win.document.write(`<img src="${n.data}" style="max-width:100%;height:auto;display:block" />`);
  else if (n.type === 'written') win.document.write(`<div style="font-family:Georgia,serif;padding:2rem;max-width:800px;margin:auto">${n.htmlContent || ''}</div>`);
  else win.document.write(`<iframe src="${n.data}" style="width:100%;height:100vh;border:none"></iframe>`);
};

window.deleteNote = function(id) {
  revisionNotes = revisionNotes.filter(x => x.id !== id);
  renderRevNotesList(); renderRevCategoryFilter();
  if (currentSubjectId) renderSubjectPanel(currentSubjectId);
  renderNotesSubjectView();
};

document.getElementById('revFilterSubject')?.addEventListener('change',  renderRevNotesList);
document.getElementById('revFilterCategory')?.addEventListener('change', renderRevNotesList);

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

  const startCard = makeCard('▶', 'Quick Start', false);
  startCard.innerHTML += `<div class="subj-empty" style="margin-bottom:0.5rem">Start a Pomodoro session for ${subj.name}</div><button class="t-btn primary" style="width:100%;padding:0.5rem" onclick="quickStartSubject(${id})">⏱ Start Session for ${subj.name}</button>`;
}

window.quickUploadForSubject = function(subjName) {
  const picker = document.getElementById('revSubjectPicker'); if (picker) picker.value = subjName;
  const f = folders.find(x => x.panel === 'revision');
  if (f) openFolder(f.id);
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

// ═════════════════════════════════════════════════════════
// NOTES NOTEBOOK SYSTEM
// ═════════════════════════════════════════════════════════

let ntActiveSubject  = null;
let ntActiveTopic    = null;
let ntFlashcardNotes = [];
let ntFcIndex        = 0;
let ntEditingNoteId  = null;

const NT_TOPIC_COLOURS = [
  '#539ec4','#3aab6e','#e8a030','#9b6fd4','#e067a0',
  '#5bc8ac','#e05050','#2a8bbc','#ffe066','#8b5a2b'
];

function ntShowView(view) {
  document.getElementById('notesSubjectView').style.display   = view === 'subject'   ? '' : 'none';
  document.getElementById('notesTopicView').style.display     = view === 'topic'     ? '' : 'none';

  const stackEl = document.getElementById('notesStackView');
  stackEl.style.display = view === 'stack' ? 'flex' : 'none';

  const fcEl = document.getElementById('notesFlashcardView');
  fcEl.style.display = view === 'flashcard' ? 'flex' : 'none';

  const wrEl = document.getElementById('notesWriterView');
  wrEl.style.display = view === 'writer' ? 'flex' : 'none';

  document.getElementById('notesBackBtn').style.display       = view !== 'subject' ? '' : 'none';
  document.getElementById('notesFlashcardBtn').style.display  = view === 'stack' ? '' : 'none';

  const bc = document.getElementById('notesBreadcrumb');
  if (view === 'subject') {
    bc.style.display = 'none';
    bc.innerHTML = '';
  } else {
    bc.style.display = 'flex';
    let html = `<span style="color:var(--accent);cursor:pointer" onclick="renderNotesSubjectView()">Notebooks</span>`;
    if (ntActiveSubject) {
      html += `<span style="color:var(--rule)">›</span>
               <span style="color:var(--accent);cursor:pointer" onclick="openNotesSubject('${ntActiveSubject.replace(/'/g,"\\'")}')">
                 ${ntActiveSubject}
               </span>`;
    }
    if (ntActiveTopic && view !== 'topic') {
      html += `<span style="color:var(--rule)">›</span>
               <span style="color:var(--ink-light)">${ntActiveTopic}</span>`;
    }
    if (view === 'flashcard') {
      html += `<span style="color:var(--rule)">›</span>
               <span style="color:var(--ink-light)">Flashcards</span>`;
    }
    bc.innerHTML = html;
  }
}

function renderNotesSubjectView() {
  ntActiveSubject = null;
  ntActiveTopic   = null;
  ntShowView('subject');

  const grid = document.getElementById('notesSubjectGrid');
  grid.innerHTML = '';

  const allSubjects = [
    { name: 'General', emoji: '📝', colour: '#539ec4' },
    ...pomSubjects.map((s, i) => ({
      name:   s.name,
      emoji:  SUBJ_EMOJIS[i % SUBJ_EMOJIS.length],
      colour: NT_TOPIC_COLOURS[i % NT_TOPIC_COLOURS.length],
    })),
  ];

  allSubjects.forEach(({ name: subjName, emoji, colour }) => {
    const notes = subjName === 'General'
      ? revisionNotes.filter(n => !n.subject)
      : revisionNotes.filter(n => n.subject === subjName);

    const topics     = [...new Set(notes.map(n => n.category || 'General'))];
    const coverNote  = notes.find(n => n.type === 'image');
    const noteCount  = notes.length;
    const topicCount = noteCount > 0 ? topics.length : 0;

    const card = document.createElement('div');
    card.className = 'nt-subject-card';
    card.style.setProperty('--nt-colour', colour);

    card.innerHTML = `
      <div class="nt-subject-cover">
        ${coverNote
          ? `<img src="${coverNote.data}" alt="" class="nt-subject-cover-img" />`
          : `<div class="nt-subject-cover-placeholder" style="background:${colour}22">
               <span style="font-size:2.5rem">${emoji}</span>
             </div>`
        }
        <div class="nt-subject-cover-bar" style="background:${colour}">
          <span class="nt-subject-cover-name">${subjName}</span>
          <span class="nt-subject-cover-count">${noteCount > 0 ? `${noteCount} note${noteCount !== 1 ? 's' : ''}` : 'Empty'}</span>
        </div>
      </div>
      <div class="nt-subject-meta">
        ${topicCount > 0
          ? `<span class="nt-subject-topics">${topicCount} topic${topicCount !== 1 ? 's' : ''}</span>`
          : `<span class="nt-subject-topics" style="color:var(--ink-muted);border-style:dashed">No notes yet — click to start</span>`
        }
      </div>
    `;

    card.addEventListener('click', () => openNotesSubject(subjName));
    grid.appendChild(card);
  });
}

function openNotesSubject(subjName) {
  ntActiveSubject = subjName;
  ntActiveTopic   = null;
  ntShowView('topic');

  const grid = document.getElementById('notesTopicGrid');
  grid.innerHTML = '';

  const notes = subjName === 'General'
    ? revisionNotes.filter(n => !n.subject)
    : revisionNotes.filter(n => n.subject === subjName);

  const topics = [...new Set(notes.map(n => n.category || 'General'))];

  const allCard = buildTopicCard('All Notes', notes, '#539ec4', '📚');
  grid.appendChild(allCard);

  topics.forEach((topic, i) => {
    const topicNotes = notes.filter(n => (n.category || 'General') === topic);
    const colour = NT_TOPIC_COLOURS[(i + 1) % NT_TOPIC_COLOURS.length];
    const card = buildTopicCard(topic, topicNotes, colour, '📁');
    grid.appendChild(card);
  });
}

function buildTopicCard(topicName, notes, colour, emoji) {
  const card = document.createElement('div');
  card.className = 'nt-topic-card';

  const imageNotes = notes.filter(n => n.type === 'image').slice(0, 4);

  let thumbsHTML = '';
  if (imageNotes.length > 0) {
    thumbsHTML = `<div class="nt-topic-thumbs">
      ${imageNotes.map(n => `<img src="${n.data}" class="nt-topic-thumb" alt="" />`).join('')}
    </div>`;
  } else {
    thumbsHTML = `<div class="nt-topic-thumbs nt-topic-thumbs-empty">
      <span style="font-size:1.8rem;color:${colour}88">${emoji}</span>
    </div>`;
  }

  card.innerHTML = `
    <div class="nt-topic-folder" style="--nt-colour:${colour}">
      <div class="nt-topic-folder-tab" style="background:${colour}"></div>
      <div class="nt-topic-folder-body" style="border-color:${colour}44;background:${colour}0d">
        ${thumbsHTML}
      </div>
    </div>
    <div class="nt-topic-name">${topicName}</div>
    <div class="nt-topic-count">${notes.length} note${notes.length !== 1 ? 's' : ''}</div>
  `;

  card.addEventListener('click', () => openNotesTopic(topicName, notes));
  return card;
}

function openNotesTopic(topicName, notes) {
  ntActiveTopic    = topicName;
  ntFlashcardNotes = notes.filter(n => n.type !== 'written');
  ntShowView('stack');

  document.getElementById('notesStackCount').textContent =
    `${notes.length} note${notes.length !== 1 ? 's' : ''} · ${ntActiveSubject} › ${topicName}`;

  const scroll = document.getElementById('notesStackScroll');
  scroll.innerHTML = '';

  if (notes.length === 0) {
    scroll.innerHTML = `
      <div class="nt-empty-state">
        <div style="font-size:2.5rem;margin-bottom:0.8rem">📭</div>
        <div style="font-size:0.9rem;font-weight:600;color:var(--ink);margin-bottom:0.3rem">No notes yet</div>
        <div style="font-size:0.78rem;color:var(--ink-muted);margin-bottom:1.2rem">Write a note or upload an image to get started</div>
        <div style="display:flex;gap:0.6rem;justify-content:center">
          <button class="t-btn primary" onclick="ntOpenWrittenNoteEditor()" style="font-size:0.78rem">✏️ Write a Note</button>
          <button class="t-btn" onclick="notesQuickUpload()" style="font-size:0.78rem">📎 Upload Image</button>
        </div>
      </div>`;
    return;
  }

  notes.forEach(n => {
    const card = document.createElement('div');
    card.className = 'nt-stack-card';

    if (n.type === 'written') {
      card.innerHTML = `
        <div class="nt-written-card">
          <div class="nt-written-card-header">
            <span class="nt-written-icon">📝</span>
            <span class="nt-written-title">${n.name}</span>
            <span class="nt-written-date">${n.date}</span>
            <button class="nt-written-edit-btn" onclick="ntOpenWrittenNoteEditor(${n.id})">Edit</button>
            <button class="nt-written-del-btn" onclick="deleteNote(${n.id})">🗑</button>
          </div>
          <div class="nt-written-body nt-writer-editor">${n.htmlContent || ''}</div>
        </div>
      `;
    } else if (n.type === 'image') {
      // ── FIX: natural size + fullscreen on click ──
      card.innerHTML = `
        <div class="nt-stack-img-label">
          <span>${n.name}</span>
          <div style="display:flex;gap:0.4rem">
            <button class="nt-img-action-btn" onclick="revFullscreen(${n.id})" title="Fullscreen">⛶</button>
            <button class="nt-img-action-btn" onclick="viewNote(${n.id})" title="Open in new tab">⤢</button>
            <button class="nt-img-action-btn nt-del" onclick="deleteNote(${n.id})" title="Delete">🗑</button>
          </div>
        </div>
        <div class="nt-stack-img-wrap">
          <img src="${n.data}"
               class="nt-stack-img"
               alt="${n.name}"
               loading="lazy"
               onclick="revFullscreen(${n.id})"
               style="cursor:zoom-in" />
        </div>
      `;
    } else {
      card.innerHTML = `
        <div class="nt-stack-img-label">
          <span>${n.name}</span>
          <button class="nt-img-action-btn nt-del" onclick="deleteNote(${n.id})" title="Delete">🗑</button>
        </div>
        <div class="nt-stack-pdf-preview">
          <div style="font-size:3rem;margin-bottom:0.6rem">📄</div>
          <div style="font-size:0.82rem;font-weight:600;color:var(--ink)">${n.name}</div>
          <div style="font-size:0.7rem;color:var(--ink-muted);margin-top:0.2rem">${n.date}</div>
          <button class="t-btn primary" onclick="viewNote(${n.id})" style="margin-top:0.9rem;font-size:0.76rem">📂 Open PDF</button>
        </div>
      `;
    }

    scroll.appendChild(card);
  });
}

function enterFlashcardMode() {
  if (ntFlashcardNotes.length === 0) return;
  ntFcIndex = 0;
  ntShowView('flashcard');
  renderFlashcard();
}

function renderFlashcard() {
  const notes  = ntFlashcardNotes;
  const n      = notes[ntFcIndex];
  const scroll = document.getElementById('notesFlashcardScroll');

  document.getElementById('fcCounter').textContent = `${ntFcIndex + 1} / ${notes.length}`;
  document.getElementById('fcPrev').disabled = ntFcIndex === 0;
  document.getElementById('fcNext').disabled = ntFcIndex === notes.length - 1;

  scroll.innerHTML = '';

  const card = document.createElement('div');
  card.className = 'nt-fc-card';

  if (n.type === 'image') {
    // ── FIX: natural size, no crop, click to fullscreen ──
    card.innerHTML = `
      <div class="nt-fc-label">${ntFcIndex + 1} / ${notes.length} — ${n.name}</div>
      <img src="${n.data}"
           class="nt-stack-img"
           alt="${n.name}"
           loading="lazy"
           onclick="revFullscreen(${n.id})"
           style="cursor:zoom-in;border-radius:0 0 6px 6px" />
    `;
  } else {
    card.innerHTML = `
      <div class="nt-fc-label">${ntFcIndex + 1} / ${notes.length}</div>
      <div class="nt-stack-pdf-preview">
        <div style="font-size:3rem;margin-bottom:0.6rem">📄</div>
        <div style="font-size:0.9rem;font-weight:600;color:var(--ink)">${n.name}</div>
        <button class="t-btn primary" onclick="viewNote(${n.id})" style="margin-top:1rem">📂 Open PDF</button>
      </div>
    `;
  }

  scroll.appendChild(card);
}

function fcStep(dir) {
  const newIdx = ntFcIndex + dir;
  if (newIdx < 0 || newIdx >= ntFlashcardNotes.length) return;
  ntFcIndex = newIdx;
  renderFlashcard();
}

function fcShuffle() {
  const arr = [...ntFlashcardNotes];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  ntFlashcardNotes = arr;
  ntFcIndex = 0;
  renderFlashcard();
}

function notesGoBack() {
  const stackVisible  = document.getElementById('notesStackView').style.display !== 'none';
  const fcVisible     = document.getElementById('notesFlashcardView').style.display !== 'none';
  const writerVisible = document.getElementById('notesWriterView').style.display !== 'none';

  if (fcVisible) {
    ntShowView('stack');
    openNotesTopic(ntActiveTopic, ntFlashcardNotes);
  } else if (writerVisible) {
    openNotesTopic(ntActiveTopic, revisionNotes.filter(n =>
      ntActiveSubject === 'General' ? !n.subject : n.subject === ntActiveSubject
    ).filter(n => ntActiveTopic === 'All Notes' ? true : (n.category || 'General') === ntActiveTopic));
  } else if (stackVisible) {
    openNotesSubject(ntActiveSubject);
  } else {
    renderNotesSubjectView();
  }
}

function notesQuickUpload() {
  const picker = document.getElementById('revSubjectPicker');
  const catInp = document.getElementById('revCategoryInput');
  if (picker && ntActiveSubject && ntActiveSubject !== 'General') picker.value = ntActiveSubject;
  if (catInp && ntActiveTopic && ntActiveTopic !== 'All Notes' && ntActiveTopic !== 'General') catInp.value = ntActiveTopic;
  const f = folders.find(x => x.panel === 'revision');
  if (f) openFolder(f.id);
}

let ntWriterAutoSaveTimer = null;

function ntOpenWrittenNoteEditor(existingId) {
  ntEditingNoteId = existingId || null;
  ntShowView('writer');

  const titleInp = document.getElementById('ntWriterTitle');
  const editor   = document.getElementById('ntWriterEditor');
  const status   = document.getElementById('ntWriterStatus');

  if (existingId) {
    const n = revisionNotes.find(x => x.id === existingId);
    if (n) {
      titleInp.value   = n.name;
      editor.innerHTML = n.htmlContent || '';
    }
  } else {
    titleInp.value   = '';
    editor.innerHTML = '';
  }

  status.textContent = 'Unsaved';
  status.style.color = 'var(--ink-muted)';
  titleInp.focus();
}

function ntWExec(cmd, val) {
  document.getElementById('ntWriterEditor').focus();
  document.execCommand(cmd, false, val || null);
}

function ntInsertCallout(type) {
  const icons = { info: '💡', warning: '⚠️', success: '✅' };
  document.getElementById('ntWriterEditor').focus();
  document.execCommand('insertHTML', false,
    `<div data-callout="${type}" contenteditable="true">${icons[type]} Write here…</div><p></p>`
  );
}

function ntSaveWrittenNote() {
  const title   = document.getElementById('ntWriterTitle').value.trim() || 'Untitled Note';
  const content = document.getElementById('ntWriterEditor').innerHTML.trim();
  const status  = document.getElementById('ntWriterStatus');

  if (!content || content === '') {
    status.textContent = 'Nothing to save';
    return;
  }

  const subjName = ntActiveSubject && ntActiveSubject !== 'General' ? ntActiveSubject : '';
  const matchSubj = pomSubjects.find(s => s.name === subjName);
  const category  = ntActiveTopic === 'All Notes' ? '' : (ntActiveTopic || '');

  if (ntEditingNoteId) {
    const n = revisionNotes.find(x => x.id === ntEditingNoteId);
    if (n) {
      n.name        = title;
      n.htmlContent = content;
      n.date        = todayStr();
    }
  } else {
    revisionNotes.push({
      id:          revNextNoteId++,
      name:        title,
      type:        'written',
      htmlContent: content,
      data:        null,
      subject:     subjName,
      subjId:      matchSubj ? matchSubj.id : null,
      category:    category,
      date:        todayStr()
    });
  }

  status.textContent = '✓ Saved';
  status.style.color = 'var(--green)';
  ntEditingNoteId = null;

  renderRevNotesList();
  renderNotesSubjectView();

  setTimeout(() => {
    const allSubjNotes = ntActiveSubject === 'General'
      ? revisionNotes.filter(n => !n.subject)
      : revisionNotes.filter(n => n.subject === ntActiveSubject);
    const topicNotes = ntActiveTopic === 'All Notes'
      ? allSubjNotes
      : allSubjNotes.filter(n => (n.category || 'General') === ntActiveTopic);
    openNotesTopic(ntActiveTopic, topicNotes);
  }, 600);
}

function ntCancelWrittenNote() {
  ntEditingNoteId = null;
  const allSubjNotes = ntActiveSubject === 'General'
    ? revisionNotes.filter(n => !n.subject)
    : revisionNotes.filter(n => n.subject === ntActiveSubject);
  const topicNotes = ntActiveTopic === 'All Notes'
    ? allSubjNotes
    : allSubjNotes.filter(n => (n.category || 'General') === ntActiveTopic);
  openNotesTopic(ntActiveTopic, topicNotes);
}

document.addEventListener('keydown', e => {
  if (e.ctrlKey && e.key === 's') {
    const wrVisible = document.getElementById('notesWriterView')?.style.display !== 'none';
    if (wrVisible) { e.preventDefault(); ntSaveWrittenNote(); }
  }
});

setTimeout(() => {
  const editor = document.getElementById('ntWriterEditor');
  if (!editor) return;
  editor.addEventListener('input', () => {
    const status = document.getElementById('ntWriterStatus');
    status.textContent = 'Unsaved';
    status.style.color = 'var(--ink-muted)';
  });
}, 0);

window.openNotesFromRevision = function() {
  const f = folders.find(x => x.panel === 'notes');
  if (f) openFolder(f.id);
};

// ═════════════════════════════════════════════════════════
// EXAM TIMETABLE SYSTEM
// ═════════════════════════════════════════════════════════

let exams         = [];
let examNextId    = 1;
let examCalYear   = new Date().getFullYear();
let examCalMonth  = new Date().getMonth();
let examActiveTab = 'upcoming';

const EXAM_COLOURS = [
  '#e05050','#e8a030','#3aab6e','#539ec4','#9b6fd4',
  '#e067a0','#5bc8ac','#2a8bbc','#f0c040','#8b5a2b'
];
let examPickerColour = EXAM_COLOURS[0];

function examDaysUntil(dateStr) {
  const now  = new Date(); now.setHours(0,0,0,0);
  const exam = new Date(dateStr); exam.setHours(0,0,0,0);
  return Math.round((exam - now) / 86400000);
}

function examUrgencyClass(days) {
  if (days < 0)  return 'exam-past';
  if (days === 0) return 'exam-today';
  if (days <= 7)  return 'exam-soon';
  if (days <= 21) return 'exam-near';
  return 'exam-far';
}

function examCountdownText(days) {
  if (days < 0)  return `${Math.abs(days)}d ago`;
  if (days === 0) return 'TODAY';
  if (days === 1) return 'TOMORROW';
  return `${days} days`;
}

function examFmtDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short', year:'numeric' });
}

function examFmtTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const hr = parseInt(h);
  return `${hr > 12 ? hr-12 : hr || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
}

function examSwitchTab(tab) {
  examActiveTab = tab;
  ['upcoming','all','calendar'].forEach(t => {
    document.getElementById('examTab' + t.charAt(0).toUpperCase() + t.slice(1)).classList.toggle('active', t === tab);
    document.getElementById('examView' + t.charAt(0).toUpperCase() + t.slice(1)).style.display = t === tab ? '' : 'none';
  });
  if (tab === 'upcoming')  renderExamUpcoming();
  if (tab === 'all')       renderExamAll();
  if (tab === 'calendar')  renderExamCalendar();
}

function renderExamUpcoming() {
  const strip = document.getElementById('examCountdownStrip');
  const list  = document.getElementById('examUpcomingList');
  const empty = document.getElementById('examUpcomingEmpty');

  const sorted = [...exams]
    .filter(e => examDaysUntil(e.date) >= 0)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  strip.innerHTML = '';
  list.innerHTML  = '';

  if (exams.length === 0) { empty.style.display = ''; return; }
  empty.style.display = 'none';

  sorted.slice(0, 5).forEach(e => {
    const days = examDaysUntil(e.date);
    const chip = document.createElement('div');
    chip.className = `exam-chip ${examUrgencyClass(days)}`;
    chip.style.borderColor = e.colour;
    chip.innerHTML = `
      <div class="exam-chip-count" style="color:${e.colour}">${examCountdownText(days)}</div>
      <div class="exam-chip-name">${e.name}</div>
    `;
    chip.addEventListener('click', () => examScrollTo(e.id));
    strip.appendChild(chip);
  });

  sorted.forEach(e => renderExamCard(e, list));

  const past = [...exams].filter(e => examDaysUntil(e.date) < 0)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  if (past.length > 0) {
    const heading = document.createElement('div');
    heading.className = 'exam-section-heading';
    heading.textContent = `Past Exams (${past.length})`;
    list.appendChild(heading);
    past.forEach(e => renderExamCard(e, list, true));
  }
}

function renderExamAll() {
  const list = document.getElementById('examAllList');
  list.innerHTML = '';
  if (exams.length === 0) {
    list.innerHTML = '<div class="exam-empty"><div style="font-size:2rem;margin-bottom:0.5rem">🎓</div>No exams added yet.</div>';
    return;
  }
  const sorted = [...exams].sort((a, b) => new Date(a.date) - new Date(b.date));
  sorted.forEach(e => renderExamCard(e, list));
}

function renderExamCard(e, container, muted) {
  const days = examDaysUntil(e.date);
  const card = document.createElement('div');
  card.className = `exam-card ${examUrgencyClass(days)}${muted ? ' exam-card-muted' : ''}`;
  card.id = `exam-card-${e.id}`;
  card.innerHTML = `
    <div class="exam-card-stripe" style="background:${e.colour}"></div>
    <div class="exam-card-body">
      <div class="exam-card-top">
        <div>
          <div class="exam-card-name">${e.name}</div>
          <div class="exam-card-meta">
            📅 ${examFmtDate(e.date)}
            ${e.time     ? ` · 🕐 ${examFmtTime(e.time)}` : ''}
            ${e.duration && e.duration != '0' ? ` · ⏱ ${parseInt(e.duration)/60}h` : ''}
            ${e.board    ? ` · ${e.board}` : ''}
          </div>
          ${e.location ? `<div class="exam-card-location">📍 ${e.location}</div>` : ''}
          ${e.notes    ? `<div class="exam-card-notes">${e.notes}</div>` : ''}
        </div>
        <div class="exam-card-right">
          <div class="exam-countdown-badge ${examUrgencyClass(days)}" style="border-color:${e.colour};color:${e.colour}">
            ${examCountdownText(days)}
          </div>
          <div class="exam-card-actions">
            <button onclick="examOpenForm(${e.id})" title="Edit">✏️</button>
            <button onclick="examDelete(${e.id})" title="Delete">🗑</button>
          </div>
        </div>
      </div>
    </div>
  `;
  container.appendChild(card);
}

function examScrollTo(id) {
  const el = document.getElementById(`exam-card-${id}`);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function renderExamCalendar() {
  const yr  = examCalYear;
  const mo  = examCalMonth;
  const grid = document.getElementById('examCalGrid');
  const title = document.getElementById('examCalTitle');

  title.textContent = `${MONTHS[mo]} ${yr}`;
  grid.innerHTML = '';

  const firstDay  = new Date(yr, mo, 1).getDay();
  const lastDate  = new Date(yr, mo + 1, 0).getDate();
  const todayDate = new Date();

  for (let i = 0; i < firstDay; i++) {
    const blank = document.createElement('div'); blank.className = 'exam-cal-cell blank';
    grid.appendChild(blank);
  }

  for (let d = 1; d <= lastDate; d++) {
    const dateStr = `${yr}-${String(mo+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const dayExams = exams.filter(e => e.date === dateStr);
    const isToday  = (d === todayDate.getDate() && mo === todayDate.getMonth() && yr === todayDate.getFullYear());

    const cell = document.createElement('div');
    cell.className = `exam-cal-cell${isToday ? ' today' : ''}${dayExams.length ? ' has-exam' : ''}`;
    cell.innerHTML = `<div class="exam-cal-day-num">${d}</div>`;
    dayExams.slice(0, 3).forEach(e => {
      const dot = document.createElement('div');
      dot.className = 'exam-cal-dot';
      dot.style.background = e.colour;
      dot.title = e.name;
      cell.appendChild(dot);
    });
    if (dayExams.length > 3) {
      const more = document.createElement('div');
      more.className = 'exam-cal-more';
      more.textContent = `+${dayExams.length - 3}`;
      cell.appendChild(more);
    }
    if (dayExams.length) {
      cell.addEventListener('click', () => examCalShowDay(dateStr, dayExams));
    }
    grid.appendChild(cell);
  }
}

function examCalShowDay(dateStr, dayExams) {
  const detail = document.getElementById('examCalDayDetail');
  const title  = document.getElementById('examCalDetailTitle');
  const list   = document.getElementById('examCalDetailList');
  title.textContent = examFmtDate(dateStr);
  list.innerHTML = '';
  dayExams.forEach(e => {
    const row = document.createElement('div');
    row.className = 'exam-cal-detail-row';
    row.style.borderLeftColor = e.colour;
    row.innerHTML = `
      <span class="exam-cal-detail-name">${e.name}</span>
      ${e.time ? `<span class="exam-cal-detail-time">${examFmtTime(e.time)}</span>` : ''}
      ${e.location ? `<span class="exam-cal-detail-loc">📍 ${e.location}</span>` : ''}
    `;
    list.appendChild(row);
  });
  detail.style.display = '';
}

function examCalPrev() {
  examCalMonth--;
  if (examCalMonth < 0) { examCalMonth = 11; examCalYear--; }
  renderExamCalendar();
  document.getElementById('examCalDayDetail').style.display = 'none';
}
function examCalNext() {
  examCalMonth++;
  if (examCalMonth > 11) { examCalMonth = 0; examCalYear++; }
  renderExamCalendar();
  document.getElementById('examCalDayDetail').style.display = 'none';
}

function examOpenForm(id) {
  const modal   = document.getElementById('examModal');
  const titleEl = document.getElementById('examModalTitle');
  const picker  = document.getElementById('examColourPicker');

  picker.innerHTML = '';
  EXAM_COLOURS.forEach(c => {
    const btn = document.createElement('button');
    btn.className = 'exam-colour-swatch' + (c === examPickerColour ? ' selected' : '');
    btn.style.background = c;
    btn.addEventListener('click', () => {
      examPickerColour = c;
      picker.querySelectorAll('.exam-colour-swatch').forEach(b => b.classList.toggle('selected', b.style.background === c || b.style.backgroundColor === c));
    });
    picker.appendChild(btn);
  });

  if (id) {
    const e = exams.find(x => x.id === id);
    if (!e) return;
    titleEl.textContent = 'Edit Exam';
    document.getElementById('examEditId').value   = id;
    document.getElementById('examName').value     = e.name;
    document.getElementById('examDate').value     = e.date;
    document.getElementById('examTime').value     = e.time || '';
    document.getElementById('examDuration').value = e.duration || '120';
    document.getElementById('examBoard').value    = e.board || '';
    document.getElementById('examLocation').value = e.location || '';
    document.getElementById('examNotes').value    = e.notes || '';
    examPickerColour = e.colour;
  } else {
    titleEl.textContent = 'Add Exam';
    document.getElementById('examEditId').value   = '';
    document.getElementById('examName').value     = '';
    document.getElementById('examDate').value     = '';
    document.getElementById('examTime').value     = '';
    document.getElementById('examDuration').value = '120';
    document.getElementById('examBoard').value    = '';
    document.getElementById('examLocation').value = '';
    document.getElementById('examNotes').value    = '';
    examPickerColour = EXAM_COLOURS[exams.length % EXAM_COLOURS.length];
  }

  modal.style.display = 'flex';
  document.getElementById('examName').focus();
}

function examCloseForm() {
  document.getElementById('examModal').style.display = 'none';
}

function examSaveForm() {
  const name = document.getElementById('examName').value.trim();
  const date = document.getElementById('examDate').value;
  if (!name || !date) { alert('Please enter at least a name and date.'); return; }

  const data = {
    name, date,
    time:     document.getElementById('examTime').value,
    duration: document.getElementById('examDuration').value,
    board:    document.getElementById('examBoard').value.trim(),
    location: document.getElementById('examLocation').value.trim(),
    notes:    document.getElementById('examNotes').value.trim(),
    colour:   examPickerColour,
  };

  const editId = document.getElementById('examEditId').value;
  if (editId) {
    const idx = exams.findIndex(e => e.id === parseInt(editId));
    if (idx > -1) exams[idx] = { ...exams[idx], ...data };
  } else {
    exams.push({ id: examNextId++, ...data });
  }

  examCloseForm();
  renderExams();
}

function examDelete(id) {
  if (!confirm('Delete this exam?')) return;
  exams = exams.filter(e => e.id !== id);
  renderExams();
}

function renderExams() {
  if (examActiveTab === 'upcoming')  renderExamUpcoming();
  if (examActiveTab === 'all')       renderExamAll();
  if (examActiveTab === 'calendar')  renderExamCalendar();
}

function examOpenImport() {
  document.getElementById('examImportModal').style.display = 'flex';
}
function examCloseImport() {
  document.getElementById('examImportModal').style.display = 'none';
}
function examImportTab(btn, src) {
  document.querySelectorAll('.import-src-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  ['google','apple','notion'].forEach(s => {
    document.getElementById('importSrc' + s.charAt(0).toUpperCase() + s.slice(1)).style.display = s === src ? '' : 'none';
  });
}

async function examImportGCal() {
  const url    = document.getElementById('gcalUrl').value.trim();
  const status = document.getElementById('gcalStatus');
  if (!url) { status.textContent = '⚠️ Please paste a calendar URL.'; return; }
  status.textContent = '⏳ Fetching…';
  try {
    const proxy = `https://corsproxy.io/?${encodeURIComponent(url)}`;
    const res   = await fetch(proxy);
    const text  = await res.text();
    const count = parseICS(text);
    status.textContent = count > 0 ? `✅ Imported ${count} event${count > 1 ? 's' : ''}.` : '⚠️ No events found.';
    renderExams();
  } catch(err) {
    status.textContent = '❌ Could not fetch — check the URL and try again.';
  }
}

function examImportICS(input) {
  const file = input.files[0]; if (!file) return;
  const status = document.getElementById('icsStatus');
  status.textContent = '⏳ Reading…';
  const reader = new FileReader();
  reader.onload = e => {
    const count = parseICS(e.target.result);
    status.textContent = count > 0 ? `✅ Imported ${count} event${count > 1 ? 's' : ''}.` : '⚠️ No events found.';
    renderExams();
  };
  reader.readAsText(file);
}

function parseICS(text) {
  const lines = text.replace(/\r\n /g, '').replace(/\r\n/g, '\n').split('\n');
  let count = 0, inEvent = false, cur = {};
  lines.forEach(line => {
    if (line === 'BEGIN:VEVENT')  { inEvent = true; cur = {}; return; }
    if (line === 'END:VEVENT' && inEvent) {
      inEvent = false;
      if (cur.name && cur.date) {
        exams.push({ id: examNextId++, name: cur.name, date: cur.date, time: cur.time || '', duration: '120', board: '', location: cur.location || '', notes: cur.description || '', colour: EXAM_COLOURS[exams.length % EXAM_COLOURS.length] });
        count++;
      }
      return;
    }
    if (!inEvent) return;
    const [key, ...rest] = line.split(':');
    const val = rest.join(':').trim();
    const keyBase = key.split(';')[0];
    if (keyBase === 'SUMMARY')     cur.name        = val;
    if (keyBase === 'LOCATION')    cur.location    = val;
    if (keyBase === 'DESCRIPTION') cur.description = val.replace(/\\n/g, ' ');
    if (keyBase === 'DTSTART') {
      const raw = val.replace(/[TZ]/g, '');
      const d   = raw.slice(0,8);
      cur.date  = `${d.slice(0,4)}-${d.slice(4,6)}-${d.slice(6,8)}`;
      if (val.includes('T')) { const t = raw.slice(8,12); cur.time = `${t.slice(0,2)}:${t.slice(2,4)}`; }
    }
  });
  return count;
}

function examImportNotion() {
  const csv    = document.getElementById('notionCsv').value.trim();
  const status = document.getElementById('notionStatus');
  if (!csv) { status.textContent = '⚠️ Paste your CSV first.'; return; }
  const lines  = csv.split('\n').map(l => l.trim()).filter(Boolean);
  const header = lines[0].toLowerCase().split(',').map(h => h.replace(/"/g,'').trim());
  const iName  = header.findIndex(h => h.includes('name') || h.includes('exam') || h.includes('subject'));
  const iDate  = header.findIndex(h => h.includes('date'));
  const iTime  = header.findIndex(h => h.includes('time'));
  const iLoc   = header.findIndex(h => h.includes('location') || h.includes('room') || h.includes('venue'));
  if (iName < 0 || iDate < 0) { status.textContent = '⚠️ Could not find Name and Date columns.'; return; }
  let count = 0;
  lines.slice(1).forEach(line => {
    const cols = line.split(',').map(c => c.replace(/^"|"$/g,'').trim());
    const name = cols[iName]; const date = cols[iDate];
    if (!name || !date) return;
    let normDate = date;
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(date)) { const [d,m,y] = date.split('/'); normDate = `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`; }
    exams.push({ id: examNextId++, name, date: normDate, time: iTime >= 0 ? (cols[iTime] || '') : '', duration: '120', board: '', location: iLoc >= 0 ? (cols[iLoc] || '') : '', notes: '', colour: EXAM_COLOURS[exams.length % EXAM_COLOURS.length] });
    count++;
  });
  status.textContent = count > 0 ? `✅ Imported ${count} exam${count > 1 ? 's' : ''}.` : '⚠️ No valid rows found.';
  renderExams();
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return `rgb(${r}, ${g}, ${b})`;
}

// ═════════════════════════════════════════════
// INITIAL RENDER
// ═════════════════════════════════════════════
showHome();
renderSbSubjects();
renderRevSubjectPicker();
renderNotesSubjectView();
