/* ═══════════════════════════════════════════════════════════
   SADHANA SUPPORT — Core JS (auth + data + practices)
   ═══════════════════════════════════════════════════════════ */

/* ── PRACTICES LIST ─────────────────────────────────────── */
const PRACTICES = [
  { id: 'guru_pooja',          name: 'Guru Pooja',                      icon: '🪔', desc: 'An invitation to the Divine' },
  { id: 'upa_yoga',            name: 'Upa Yoga',                        icon: '🌀', desc: '' },
  { id: 'yoga_namaskar',       name: 'Yoga Namaskar',                   icon: '🧘', desc: '' },
  { id: 'surya_kriya',         name: 'Surya Kriya',                     icon: '☀️', desc: '', extra: { id: 'surya_kriya_cycles', label: 'Cycles' } },
  { id: 'asanas',              name: 'Asanas',                          icon: '🤸', desc: '' },
  { id: 'sck_morning',         name: 'Shakti Chalana Kriya (Morning)',  icon: '⚡', desc: '', extra: { id: 'sck_morning_kapalabhatis', label: 'Kapalabhatis / cycle' } },
  { id: 'shambhavi_morning',   name: 'Shambhavi (Morning)',             icon: '🌅', desc: '' },
  { id: 'shoonya_mid',         name: 'Shoonya (Mid Morning)',           icon: '🌌', desc: '' },
  { id: 'miracle_of_mind',     name: 'Miracle of Mind',                 icon: '🧠', desc: '', extra: { id: 'miracle_of_mind_mins', label: 'Minutes' } },
  { id: 'devi_stuti',          name: 'Devi Stuti',                      icon: '🌸', desc: '', extra: { id: 'devi_stuti_cycles', label: 'Cycles' } },
  { id: 'achala_arpanam',      name: 'Achala Arpanam',                  icon: '🏔️', desc: '' },
  { id: 'infinity_meditation', name: 'Infinity Meditation',             icon: '♾️', desc: '' },
  { id: 'sukha_kriya',         name: 'Sukha Kriya',                     icon: '😌', desc: '' },
  { id: 'aum_chanting',        name: 'Aum Chanting',                    icon: '🔔', desc: '' },
  { id: 'nadi_shuddhi',        name: 'Nadi Shuddhi',                    icon: '🌬️', desc: '' },
  { id: 'shoonya_evening',     name: 'Shoonya (Evening)',               icon: '🌙', desc: '' },
  { id: 'sck_evening',         name: 'Shakti Chalana Kriya (Evening)',  icon: '⚡', desc: '', extra: { id: 'sck_evening_kapalabhatis', label: 'Kapalabhatis / cycle' } },
  { id: 'shambhavi_evening',   name: 'Shambhavi (Evening)',             icon: '🌅', desc: '' },
];

/* ── STATE ───────────────────────────────────────────────── */
let currentUser = null;
let currentDate = todayStr();
let data        = {};   // { [dateStr]: { sadhana: { [id]: bool } } }
let saveTimer   = null;

/* ── DATE HELPERS ────────────────────────────────────────── */
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function offsetDate(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function formatDateLabel(dateStr) {
  const today = todayStr();
  const yesterday = offsetDate(today, -1);
  if (dateStr === today)     return 'Today';
  if (dateStr === yesterday) return 'Yesterday';
  return '';
}

function formatDateFull(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

/* ── FIREBASE ────────────────────────────────────────────── */
const app = firebase.initializeApp(firebaseConfig, 'sadhana-support');
const auth = app.auth();
const db   = app.firestore();

/* ── LOADING / SCREEN HELPERS ────────────────────────────── */
function showLoading(on) {
  document.getElementById('loadingOverlay').style.display = on ? 'flex' : 'none';
}
function showLogin(on) {
  document.getElementById('loginScreen').style.display  = on  ? 'flex'  : 'none';
  document.getElementById('appScreen').style.display    = on  ? 'none'  : 'block';
}

/* ── DATA LAYER ──────────────────────────────────────────── */
function defaultSadhana() {
  return {
    ...Object.fromEntries(PRACTICES.map(p => [p.id, false])),
    ...Object.fromEntries(PRACTICES.filter(p => p.extra).map(p => [p.extra.id, 0]))
  };
}

function getDayData(dateStr) {
  if (!data[dateStr])                data[dateStr] = { sadhana: defaultSadhana() };
  if (!data[dateStr].sadhana)        data[dateStr].sadhana = defaultSadhana();
  return data[dateStr];
}

async function loadAllData() {
  if (!currentUser) return;
  try {
    const snap = await db.collection('users').doc(currentUser.uid)
      .collection('days').get();
    snap.forEach(doc => {
      data[doc.id] = doc.data();
      if (!data[doc.id].sadhana) data[doc.id].sadhana = defaultSadhana();
    });
  } catch (e) { console.error('Load error:', e); }
}

function saveData() {
  if (!currentUser) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const dayData = data[currentDate] || { sadhana: defaultSadhana() };
    db.collection('users').doc(currentUser.uid)
      .collection('days').doc(currentDate)
      .set(dayData, { merge: true })
      .catch(e => console.error('Save error:', e));
  }, 800);
}

/* ── RENDER — PRACTICE LIST (once) ──────────────────────── */
function renderPracticeList() {
  const list = document.getElementById('practiceList');
  if (!list) return;
  list.innerHTML = PRACTICES.map(p => `
    <div class="practice-item" data-practice="${p.id}">
      <div class="practice-info">
        <span class="practice-icon">${p.icon}</span>
        <div>
          <div class="practice-name">${p.name}</div>
          ${p.desc ? `<div class="practice-desc">${p.desc}</div>` : ''}
          ${p.extra ? `<div class="practice-extra">
            <input type="number" class="practice-num practice-extra-inp" data-extra="${p.extra.id}" placeholder="0" min="0">
            <span class="practice-extra-label">${p.extra.label}</span>
          </div>` : ''}
        </div>
      </div>
      <label class="toggle">
        <input type="checkbox" class="practice-check" data-field="${p.id}">
        <span class="toggle-slider"></span>
      </label>
    </div>`).join('');

  /* Attach events */
  list.querySelectorAll('.practice-check').forEach(el => {
    el.addEventListener('change', () => {
      getDayData(currentDate).sadhana[el.dataset.field] = el.checked;
      saveData(); updateRing(); updateBanner(); renderTrends();
    });
  });
  list.querySelectorAll('.practice-extra-inp').forEach(el => {
    el.addEventListener('input', () => {
      getDayData(currentDate).sadhana[el.dataset.extra] = parseInt(el.value) || 0;
      saveData();
    });
  });
}

/* ── RENDER — SADHANA STATE ──────────────────────────────── */
function renderSadhana() {
  const s = getDayData(currentDate).sadhana;
  document.querySelectorAll('.practice-check').forEach(el => {
    el.checked = s[el.dataset.field] || false;
  });
  document.querySelectorAll('.practice-extra-inp').forEach(el => {
    el.value = s[el.dataset.extra] || '';
  });
  updateRing();
  updateBanner();
}

function updateRing() {
  const s    = getDayData(currentDate).sadhana;
  const done = PRACTICES.filter(p => s[p.id]).length;
  const pct  = Math.round(done / PRACTICES.length * 100);
  const ring = document.getElementById('sadhanaRing');
  const pctEl = document.getElementById('sadhanaPct');
  if (ring)  ring.setAttribute('stroke-dasharray', `${pct} 100`);
  if (pctEl) pctEl.textContent = `${pct}%`;
}

function updateBanner() {
  const s   = getDayData(currentDate).sadhana;
  const all = PRACTICES.every(p => s[p.id]);
  document.getElementById('completionBanner').style.display = all ? 'block' : 'none';
}

/* ── RENDER — TRENDS ─────────────────────────────────────── */
function renderTrends() {
  renderHeatmap();
  renderTrendRows();
}

function renderHeatmap() {
  const el = document.getElementById('heatmapSadhana');
  if (!el) return;
  const today = todayStr();
  const cells = [];
  for (let i = 90; i >= 0; i--) {
    const d     = offsetDate(today, -i);
    const s     = data[d]?.sadhana || {};
    const done  = PRACTICES.filter(p => s[p.id]).length;
    const score = done / PRACTICES.length;
    const alpha = score < 0.01 ? 0.05 : 0.15 + score * 0.75;
    cells.push(`<div class="heatmap-cell" style="background:var(--primary);opacity:${alpha.toFixed(2)}" title="${d}: ${done}/${PRACTICES.length}"></div>`);
  }
  el.innerHTML = cells.join('');
}

function renderTrendRows() {
  const container = document.getElementById('trendHabits');
  if (!container) return;

  /* Build rows HTML once (labels + bar containers) */
  if (!container.dataset.built) {
    container.innerHTML = PRACTICES.map(p => `
      <div class="trend-habit-row">
        <span class="trend-habit-label">${p.icon} ${p.name}</span>
        <div class="trend-bars" id="tbars-${p.id}"></div>
      </div>`).join('');
    container.dataset.built = '1';
  }

  /* Fill bar content */
  const today = todayStr();
  PRACTICES.forEach(p => {
    const el = document.getElementById(`tbars-${p.id}`);
    if (!el) return;
    const bars = [];
    for (let i = 89; i >= 0; i--) {
      const d    = offsetDate(today, -i);
      const done = !!(data[d]?.sadhana?.[p.id]);
      bars.push(`<div class="trend-bar${done ? ' done' : ''}" style="${done ? 'background:var(--primary)' : ''}" title="${d}"></div>`);
    }
    el.innerHTML = bars.join('');
  });
}

/* ── RENDER — DATE HEADER ────────────────────────────────── */
function renderDateHeader() {
  const label = document.getElementById('dateLabel');
  const full  = document.getElementById('dateFull');
  const next  = document.getElementById('nextDay');
  const lbl   = formatDateLabel(currentDate);
  if (label) label.textContent = lbl || formatDateFull(currentDate).split(',')[0];
  if (full)  full.textContent  = lbl ? formatDateFull(currentDate) : '';
  if (next)  next.disabled = currentDate >= todayStr();
}

/* ── NAVIGATION ──────────────────────────────────────────── */
function navigateTo(dateStr) {
  currentDate = dateStr;
  renderDateHeader();
  renderSadhana();
  renderTrends();
}

/* ── VIEW SWITCHING ──────────────────────────────────────── */
function switchView(viewName) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const view = document.getElementById(`view-${viewName}`);
  const nav  = document.querySelector(`.nav-item[data-view="${viewName}"]`);
  if (view) view.classList.add('active');
  if (nav)  nav.classList.add('active');
  if (viewName === 'trends') renderTrends();
}

/* ── SIDEBAR (mobile drawer) ─────────────────────────────── */
function toggleSidebar() {
  const sidebar = document.getElementById('appSidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const isOpen  = sidebar.classList.contains('sidebar-open');
  sidebar.classList.toggle('sidebar-open', !isOpen);
  overlay.classList.toggle('sidebar-open', !isOpen);
}
function closeSidebar() {
  document.getElementById('appSidebar').classList.remove('sidebar-open');
  document.getElementById('sidebarOverlay').classList.remove('sidebar-open');
}

/* ── USER INFO ───────────────────────────────────────────── */
function renderUserMenu(user) {
  const info  = document.getElementById('userInfo');
  const photo = document.getElementById('userPhoto');
  const name  = document.getElementById('userName');
  const email = document.getElementById('userEmail');
  if (!user) { if (info) info.style.display = 'none'; return; }
  if (info)  info.style.display  = 'flex';
  if (photo) photo.src           = user.photoURL || '';
  if (name)  name.textContent    = user.displayName || '';
  if (email) email.textContent   = user.email || '';
}

/* ── INIT ────────────────────────────────────────────────── */
function init() {
  renderPracticeList();

  /* Sidebar nav */
  document.querySelectorAll('.nav-item[data-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      switchView(btn.dataset.view);
      closeSidebar();
    });
  });

  /* Hamburger + overlay */
  document.getElementById('hamburgerBtn').addEventListener('click', toggleSidebar);
  document.getElementById('sidebarOverlay').addEventListener('click', closeSidebar);

  /* Date nav */
  document.getElementById('prevDay').addEventListener('click', () =>
    navigateTo(offsetDate(currentDate, -1))
  );
  document.getElementById('nextDay').addEventListener('click', () => {
    if (currentDate < todayStr()) navigateTo(offsetDate(currentDate, 1));
  });

  /* Auth */
  document.getElementById('googleSignIn').addEventListener('click', () => {
    auth.signInWithPopup(new firebase.auth.GoogleAuthProvider())
      .catch(e => console.error('Sign-in error:', e));
  });
  document.getElementById('signOutBtn').addEventListener('click', () => auth.signOut());
}

/* ── AUTH STATE ──────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  init();

  auth.onAuthStateChanged(async user => {
    if (user) {
      currentUser = user;
      showLoading(true);
      showLogin(false);
      db.collection('users').doc(user.uid).set({
        name:       user.displayName || '',
        email:      user.email || '',
        photoURL:   user.photoURL || '',
        lastActive: firebase.firestore.FieldValue.serverTimestamp(),
      }, { merge: true }).catch(() => {});
      await loadAllData();
      renderUserMenu(user);
      renderDateHeader();
      renderSadhana();
      renderTrends();
      showLoading(false);
    } else {
      currentUser = null;
      data = {};
      showLoading(false);
      showLogin(true);
      renderUserMenu(null);
    }
  });
});
