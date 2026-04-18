/* ═══════════════════════════════════════════════════════════
   HABIT TRACKER — APPLICATION LOGIC
   Firebase Auth + Firestore multi-user version
   ═══════════════════════════════════════════════════════════ */

'use strict';

/* ── CONSTANTS ──────────────────────────────────────────── */
const STEPS_GOAL  = 10000;
const DAY_NAMES   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTH_NAMES = ['January','February','March','April','May','June',
                     'July','August','September','October','November','December'];

/* ── FIREBASE INIT ──────────────────────────────────────── */
// If the config still has placeholder values, run in offline/localStorage mode
const FIREBASE_CONFIGURED = firebaseConfig.apiKey !== 'PASTE_YOUR_API_KEY';

let auth = null;
let db   = null;

if (FIREBASE_CONFIGURED) {
  firebase.initializeApp(firebaseConfig);
  auth = firebase.auth();
  db   = firebase.firestore();
}

/* ── STATE ──────────────────────────────────────────────── */
let currentUser = FIREBASE_CONFIGURED ? null : { uid: 'local', displayName: 'You' };
let currentDate = todayStr();
let data        = {};        // in-memory cache: { [dateStr]: dayObject }
let saveTimer   = null;      // debounce handle for Firestore writes

/* ── UTILITY — DATE ─────────────────────────────────────── */
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function dateObj(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function offsetDate(str, days) {
  const d = dateObj(str);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatDateFull(str) {
  const d = dateObj(str);
  return `${DAY_NAMES[d.getDay()]}, ${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

function isToday(str) { return str === todayStr(); }

function getWeekDates(str) {
  const d   = dateObj(str);
  const day = d.getDay();
  const mon = new Date(d);
  mon.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
  return Array.from({ length: 7 }, (_, i) => {
    const t = new Date(mon);
    t.setDate(mon.getDate() + i);
    return t.toISOString().slice(0, 10);
  });
}

/* ── UTILITY — TIME MATH ────────────────────────────────── */
function timeToMinutes(t) {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function calcHours(fromTime, toTime) {
  const from = timeToMinutes(fromTime);
  const to   = timeToMinutes(toTime);
  if (from == null || to == null) return null;
  let diff = to - from;
  if (diff < 0) diff += 1440;
  return Math.round((diff / 60) * 10) / 10;
}

/* ── DEFAULT DAY ────────────────────────────────────────── */
function defaultDay() {
  return {
    health: {
      sleep_time: '', wake_time: '', sleep_quality: 0,
      greyscale_on: '',
      steps: '', heart_points: '',
      breakfast_source: '', lunch_source: '', snack_source: '', dinner_source: '',
      breakfast: '', lunch: '', snack: '', dinner: ''
    },
    sadhana: {
      guru_pooja: false, upa_yoga: false,
      surya_kriya: false, yoga_namaskar: false, sck: false
    },
    t: {}
  };
}

function getDayData(dateStr) {
  if (!data[dateStr]) data[dateStr] = defaultDay();
  return data[dateStr];
}

/* ── SAVE (localStorage or Firestore) ───────────────────── */
function saveData() {
  if (!currentUser) return;
  if (!FIREBASE_CONFIGURED) {
    localStorage.setItem('habitTracker_v1', JSON.stringify(data));
    return;
  }
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const dayData = data[currentDate] || defaultDay();
    db.collection('users').doc(currentUser.uid)
      .collection('days').doc(currentDate)
      .set(dayData)
      .catch(err => console.error('Firestore save error:', err));
  }, 800);
}

/* ── LOAD (localStorage or Firestore) ───────────────────── */
async function loadAllData() {
  if (!FIREBASE_CONFIGURED) {
    try { data = JSON.parse(localStorage.getItem('habitTracker_v1') || '{}'); }
    catch { data = {}; }
    return;
  }
  try {
    const snap = await db.collection('users').doc(currentUser.uid)
                         .collection('days').get();
    data = {};
    snap.forEach(doc => { data[doc.id] = doc.data(); });
  } catch (err) {
    console.error('Firestore load error:', err);
    data = {};
  }
}

/* ── COMPLETENESS ───────────────────────────────────────── */
function healthCompletion(h) {
  const fields = [
    h.sleep_time, h.wake_time, h.sleep_quality > 0,
    h.greyscale_on, h.steps > 0, h.heart_points > 0,
    h.breakfast_source, h.lunch_source, h.dinner_source,
    h.breakfast, h.lunch, h.dinner
  ];
  return Math.round(fields.filter(Boolean).length / fields.length * 100);
}

function sadhanaCompletion(s) {
  const vals = Object.values(s);
  return Math.round(vals.filter(Boolean).length / vals.length * 100);
}

function dayHasData(dateStr) {
  if (!data[dateStr]) return false;
  const h = data[dateStr].health  || {};
  const s = data[dateStr].sadhana || {};
  return !!(h.sleep_time || h.wake_time || h.steps || Object.values(s).some(Boolean));
}

/* ── STREAK ─────────────────────────────────────────────── */
function calcStreak() {
  let streak = 0;
  let d = todayStr();
  while (dayHasData(d)) { streak++; d = offsetDate(d, -1); }
  return streak;
}

/* ── RENDER — HEADER ────────────────────────────────────── */
function renderHeader() {
  const today = todayStr();
  document.getElementById('dateLabel').textContent =
    isToday(currentDate)                    ? 'Today'     :
    currentDate === offsetDate(today, -1)   ? 'Yesterday' :
    currentDate === offsetDate(today,  1)   ? 'Tomorrow'  : '';
  document.getElementById('dateFull').textContent = formatDateFull(currentDate);
  document.getElementById('nextDay').disabled = currentDate >= today;
  document.getElementById('streakDisplay').textContent = `🔥 ${calcStreak()}`;
  renderWeekStrip();
}

/* ── RENDER — WEEK STRIP ────────────────────────────────── */
function renderWeekStrip() {
  const strip = document.getElementById('weekStrip');
  const week  = getWeekDates(currentDate);
  const today = todayStr();

  strip.innerHTML = week.map(d => {
    const dt  = dateObj(d);
    const cls = ['week-day',
      d === today       ? 'today'    : '',
      d === currentDate ? 'selected' : '',
      dayHasData(d)     ? 'has-data' : ''
    ].filter(Boolean).join(' ');

    return `<div class="${cls}" data-date="${d}">
      <span class="wday-name">${DAY_NAMES[dt.getDay()]}</span>
      <span class="wday-num">${dt.getDate()}</span>
      <span class="wday-dot"></span>
    </div>`;
  }).join('');

  strip.querySelectorAll('.week-day').forEach(el =>
    el.addEventListener('click', () => navigateTo(el.dataset.date))
  );
}

/* ── RENDER — BADGES & RINGS ────────────────────────────── */
function renderBadges() {
  const d    = getDayData(currentDate);
  const hPct = healthCompletion(d.health);
  const sPct = sadhanaCompletion(d.sadhana);

  document.getElementById('healthBadge').textContent  = `${hPct}%`;
  document.getElementById('sadhanaBadge').textContent = `${sPct}%`;
  document.getElementById('healthBadge').style.color  = hPct === 100 ? '#34d399' : '';
  document.getElementById('sadhanaBadge').style.color = sPct === 100 ? '#a78bfa' : '';
  updateRing('sleepRing',   'sleepPct',   hPct);
  updateRing('sadhanaRing', 'sadhanaPct', sPct);
}

function updateRing(ringId, pctId, pct) {
  const circ = 2 * Math.PI * 15.9;
  const fill = (pct / 100) * circ;
  document.getElementById(ringId).setAttribute(
    'stroke-dasharray', `${fill.toFixed(1)} ${(circ - fill).toFixed(1)}`
  );
  document.getElementById(pctId).textContent = `${pct}%`;
}

/* ── RENDER — HEALTH FORM ───────────────────────────────── */
function renderHealth() {
  const h = getDayData(currentDate).health;

  setVal('sleepTime',   h.sleep_time);
  setVal('wakeTime',    h.wake_time);
  setVal('greyscaleOn', h.greyscale_on);
  setVal('stepsInput',  h.steps);
  setVal('heartInput',  h.heart_points);

  document.querySelectorAll('[data-field$="_source"]').forEach(el => {
    el.value = h[el.dataset.field] || '';
  });
  ['breakfast','lunch','snack','dinner'].forEach(m => {
    const el = document.querySelector(`[data-field="${m}"]`);
    if (el) el.value = h[m] || '';
  });

  setStars(h.sleep_quality || 0);
  updateComputed();
}

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val || '';
}

function setStars(val) {
  document.querySelectorAll('#sleepQuality .star').forEach(s =>
    s.classList.toggle('active', parseInt(s.dataset.val) <= val)
  );
}

/* ── RENDER — SADHANA FORM ──────────────────────────────── */
function renderSadhana() {
  const s = getDayData(currentDate).sadhana;
  document.querySelectorAll('.sadhana-check').forEach(el => {
    el.checked = s[el.dataset.field] || false;
  });
  updateSadhanaBanner();
}

function updateSadhanaBanner() {
  const s   = getDayData(currentDate).sadhana;
  const all = Object.values(s).every(Boolean);
  document.getElementById('sadhanaBanner').style.display = all ? 'block' : 'none';
}

/* ── COMPUTED FIELDS ────────────────────────────────────── */
function updateComputed() {
  const h = getDayData(currentDate).health;

  const sh  = calcHours(h.sleep_time, h.wake_time);
  const shEl = document.getElementById('sleepHours');
  shEl.querySelector('.computed-value').textContent = sh !== null ? sh : '—';
  shEl.querySelector('.computed-unit').textContent  = sh !== null ? 'hrs' : '';

  const gh  = calcHours(h.greyscale_on, h.wake_time);
  const ghEl = document.getElementById('greyscaleHours');
  ghEl.querySelector('.computed-value').textContent = gh !== null ? gh : '—';
  ghEl.querySelector('.computed-unit').textContent  = gh !== null ? 'hrs' : '';

  const steps    = parseInt(h.steps) || 0;
  const stepsPct = Math.min(100, Math.round(steps / STEPS_GOAL * 100));
  document.getElementById('stepsBar').style.width         = stepsPct + '%';
  document.getElementById('stepsGoalPct').textContent     = stepsPct + '%';
}

/* ── FULL RENDER ────────────────────────────────────────── */
function renderAll() {
  renderHeader();
  renderHealth();
  renderSadhana();
  renderBadges();
  updateExportSummary();
}

/* ── NAVIGATION ─────────────────────────────────────────── */
function navigateTo(dateStr) {
  currentDate = dateStr;
  renderAll();
}

/* ── TAB SWITCHING ──────────────────────────────────────── */
function switchTab(tabName) {
  document.querySelectorAll('.tab').forEach(t =>
    t.classList.toggle('active', t.dataset.tab === tabName)
  );
  document.querySelectorAll('.tab-section').forEach(s =>
    s.classList.toggle('active', s.id === `tab-${tabName}`)
  );
}

/* ── EVENT HANDLERS — HEALTH ────────────────────────────── */
function initHealthEvents() {
  ['sleepTime','wakeTime','greyscaleOn'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('change', () => {
      getDayData(currentDate).health[el.dataset.field] = el.value;
      saveData(); updateComputed(); renderBadges(); renderWeekStrip();
    });
  });

  ['stepsInput','heartInput'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => {
      getDayData(currentDate).health[el.dataset.field] = el.value ? parseInt(el.value) : '';
      saveData(); updateComputed(); renderBadges(); renderWeekStrip();
    });
  });

  document.querySelectorAll('.num-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = document.getElementById(btn.dataset.target);
      if (!target) return;
      const val = Math.max(0, (parseInt(target.value) || 0) + parseInt(btn.dataset.delta));
      target.value = val;
      getDayData(currentDate).health[target.dataset.field] = val;
      saveData(); updateComputed(); renderBadges(); renderWeekStrip();
    });
  });

  document.querySelectorAll('.card-health [data-field]').forEach(el => {
    if (el.tagName === 'SELECT' || (el.tagName === 'INPUT' && el.type === 'text')) {
      el.addEventListener('change', () => {
        getDayData(currentDate).health[el.dataset.field] = el.value;
        saveData(); renderBadges(); renderWeekStrip();
      });
    }
  });

  document.querySelectorAll('#sleepQuality .star').forEach(star => {
    star.addEventListener('click', () => {
      const val = parseInt(star.dataset.val);
      getDayData(currentDate).health.sleep_quality = val;
      saveData(); setStars(val); renderBadges(); renderWeekStrip();
    });
  });
}

/* ── EVENT HANDLERS — SADHANA ───────────────────────────── */
function initSadhanaEvents() {
  document.querySelectorAll('.sadhana-check').forEach(el => {
    el.addEventListener('change', () => {
      getDayData(currentDate).sadhana[el.dataset.field] = el.checked;
      saveData(); updateSadhanaBanner(); renderBadges(); renderWeekStrip();
    });
  });
}

/* ── EXPORT ─────────────────────────────────────────────── */
function getExportRange() {
  const from = document.getElementById('exportFrom').value;
  const to   = document.getElementById('exportTo').value;
  if (!from || !to) return null;
  const dates = [];
  let d = from;
  while (d <= to) { dates.push(d); d = offsetDate(d, 1); }
  return dates;
}

function getSelectedCats() {
  return [...document.querySelectorAll('.export-cat-check input:checked')].map(el => el.value);
}

function buildHealthRow(dateStr, h) {
  const sh = calcHours(h.sleep_time, h.wake_time);
  const gh = calcHours(h.greyscale_on, h.wake_time);
  return {
    'Date': dateStr, 'Day': DAY_NAMES[dateObj(dateStr).getDay()],
    'Sleeping Time': h.sleep_time || '', 'Waking Time': h.wake_time || '',
    'Hours of Sleep': sh ?? '', 'Sleep Quality (1-5)': h.sleep_quality || '',
    'Greyscale On At': h.greyscale_on || '', 'Greyscale Hours': gh ?? '',
    'Steps': h.steps || '', 'Heart Points': h.heart_points || '',
    'Breakfast Source': h.breakfast_source || '', 'Breakfast': h.breakfast || '',
    'Lunch Source': h.lunch_source || '',     'Lunch': h.lunch || '',
    'Snack Source': h.snack_source || '',     'Snack': h.snack || '',
    'Dinner Source': h.dinner_source || '',   'Dinner': h.dinner || ''
  };
}

function buildSadhanaRow(dateStr, s) {
  return {
    'Date': dateStr, 'Day': DAY_NAMES[dateObj(dateStr).getDay()],
    'Guru Pooja': s.guru_pooja    ? 'Yes' : 'No',
    'Upa Yoga':   s.upa_yoga      ? 'Yes' : 'No',
    'Surya Kriya': s.surya_kriya  ? 'Yes' : 'No',
    'Yoga Namaskar': s.yoga_namaskar ? 'Yes' : 'No',
    'SCK': s.sck                  ? 'Yes' : 'No',
    'Total Done': Object.values(s).filter(Boolean).length
  };
}

function updateExportSummary() {
  const keys  = Object.keys(data).sort();
  const count = keys.length;
  const el    = document.getElementById('dataSummary');
  if (!el) return;
  el.textContent = count === 0
    ? 'No data recorded yet.'
    : `${count} day${count > 1 ? 's' : ''} of data · ${keys[0]} → ${keys[keys.length - 1]}`;
}

function doExport(format) {
  const dates = getExportRange();
  if (!dates?.length) { showToast('⚠️ Please select a valid date range'); return; }
  const cats = getSelectedCats();
  if (!cats.length)   { showToast('⚠️ Please select at least one category'); return; }

  const healthRows  = [];
  const sadhanaRows = [];
  dates.forEach(d => {
    const day = data[d] || defaultDay();
    if (cats.includes('health'))  healthRows.push(buildHealthRow(d, day.health || {}));
    if (cats.includes('sadhana')) sadhanaRows.push(buildSadhanaRow(d, day.sadhana || {}));
  });

  if (format === 'csv') exportCSV(healthRows, sadhanaRows, cats);
  else                  exportXLSX(healthRows, sadhanaRows, cats);
}

function rowsToCSV(rows) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escape  = v => `"${String(v).replace(/"/g, '""')}"`;
  return [headers.map(escape).join(','),
    ...rows.map(r => headers.map(h => escape(r[h] ?? '')).join(','))
  ].join('\n');
}

function downloadFile(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

function exportCSV(healthRows, sadhanaRows, cats) {
  const parts = [];
  if (cats.includes('health')  && healthRows.length)  parts.push('=== HEALTH ===\n'  + rowsToCSV(healthRows));
  if (cats.includes('sadhana') && sadhanaRows.length) parts.push('=== SADHANA ===\n' + rowsToCSV(sadhanaRows));
  downloadFile('\uFEFF' + parts.join('\n\n'), `habit-tracker-${todayStr()}.csv`, 'text/csv;charset=utf-8');
  showToast('✅ CSV exported!');
}

function exportXLSX(healthRows, sadhanaRows, cats) {
  if (typeof XLSX === 'undefined') { showToast('⚠️ Excel library not loaded. Try CSV.'); return; }
  const wb = XLSX.utils.book_new();
  if (cats.includes('health')  && healthRows.length)  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(healthRows),  'Health');
  if (cats.includes('sadhana') && sadhanaRows.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sadhanaRows), 'Sadhana');
  if (!wb.SheetNames.length) { showToast('⚠️ No data to export'); return; }
  XLSX.writeFile(wb, `habit-tracker-${todayStr()}.xlsx`);
  showToast('✅ Excel file exported!');
}

function setQuickRange(days) {
  const to   = todayStr();
  const keys = Object.keys(data).sort();
  const from = days === 'all'
    ? (keys.length ? keys[0] : to)
    : offsetDate(to, -(parseInt(days) - 1));
  document.getElementById('exportFrom').value = from;
  document.getElementById('exportTo').value   = to;
  document.querySelectorAll('.range-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.range === String(days))
  );
}

/* ── TOAST ──────────────────────────────────────────────── */
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

/* ── CONFIRM MODAL ──────────────────────────────────────── */
function showConfirm(title, body, onOk, okLabel = 'Confirm') {
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmBody').textContent  = body;
  document.getElementById('confirmOk').textContent    = okLabel;
  document.getElementById('confirmModal').style.display = 'flex';
  document.getElementById('confirmOk').onclick = () => { hideConfirm(); onOk(); };
}
function hideConfirm() {
  document.getElementById('confirmModal').style.display = 'none';
}

/* ── LOADING / LOGIN OVERLAYS ───────────────────────────── */
function showLoading(visible) {
  document.getElementById('loadingOverlay').style.display = visible ? 'flex' : 'none';
}

function showLogin(visible) {
  document.getElementById('loginOverlay').style.display = visible ? 'flex' : 'none';
}

/* ── AUTH — USER MENU ───────────────────────────────────── */
function renderUserMenu(user) {
  const menu  = document.getElementById('userMenu');
  const photo = document.getElementById('userPhoto');
  const name  = document.getElementById('userName');
  const email = document.getElementById('userEmail');

  if (user) {
    menu.style.display  = 'flex';
    photo.src           = user.photoURL || '';
    photo.alt           = user.displayName || 'User';
    photo.title         = user.displayName || '';
    name.textContent    = user.displayName || 'User';
    email.textContent   = user.email || '';
  } else {
    menu.style.display  = 'none';
  }
}

/* ── AUTH — GOOGLE SIGN-IN ──────────────────────────────── */
function signInWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).catch(err => {
    console.error('Sign-in error:', err);
    showToast('⚠️ Sign-in failed. Please try again.');
  });
}

function signOut() {
  auth.signOut().catch(err => console.error('Sign-out error:', err));
}

/* ── AUTH STATE LISTENER ────────────────────────────────── */
async function startApp() {
  showLoading(true);
  await loadAllData();
  renderUserMenu(currentUser);
  renderAll();
  showLoading(false);
}

if (!FIREBASE_CONFIGURED) {
  // No Firebase — boot straight into the app using localStorage
  // (init() is called via DOMContentLoaded below; startApp is called inside init)
} else {
  auth.onAuthStateChanged(async user => {
    if (user) {
      currentUser = user;
      showLoading(true);
      showLogin(false);
      // Save/update user profile so admin dashboard can see all users
      db.collection('users').doc(user.uid).set({
        name:       user.displayName || '',
        email:      user.email || '',
        photoURL:   user.photoURL || '',
        lastActive: firebase.firestore.FieldValue.serverTimestamp(),
        createdAt:  firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true }).catch(() => {});
      await loadAllData();
      renderUserMenu(user);
      renderAll();
      showLoading(false);
      showToast(`👋 Welcome back, ${user.displayName?.split(' ')[0] || 'there'}!`);
    } else {
      currentUser = null;
      data        = {};
      showLoading(false);
      showLogin(true);
      renderUserMenu(null);
    }
  });
}

/* ── INIT ───────────────────────────────────────────────── */
function init() {
  /* Tab switching */
  document.getElementById('categoryTabs').addEventListener('click', e => {
    const tab = e.target.closest('[data-tab]');
    if (tab) switchTab(tab.dataset.tab);
  });

  /* Date navigation */
  document.getElementById('prevDay').addEventListener('click', () =>
    navigateTo(offsetDate(currentDate, -1))
  );
  document.getElementById('nextDay').addEventListener('click', () => {
    if (currentDate < todayStr()) navigateTo(offsetDate(currentDate, 1));
  });

  /* Export shortcut */
  document.getElementById('exportBtn').addEventListener('click', () => switchTab('export'));

  /* Health & Sadhana events */
  initHealthEvents();
  initSadhanaEvents();

  /* Export */
  document.getElementById('exportCSV').addEventListener('click',  () => doExport('csv'));
  document.getElementById('exportXLSX').addEventListener('click', () => doExport('xlsx'));
  document.querySelectorAll('.range-btn').forEach(btn =>
    btn.addEventListener('click', () => setQuickRange(btn.dataset.range))
  );
  setQuickRange(7);


  /* Confirm modal */
  document.getElementById('confirmCancel').addEventListener('click', hideConfirm);
  document.getElementById('confirmModal').addEventListener('click', e => {
    if (e.target.id === 'confirmModal') hideConfirm();
  });

  /* Google sign-in */
  document.getElementById('googleSignInBtn').addEventListener('click', signInWithGoogle);

  /* Sign-out */
  document.getElementById('signOutBtn').addEventListener('click', () => {
    showConfirm('Sign out?', 'Your data is safely saved in the cloud.', signOut, 'Sign out');
  });

  /* User avatar toggles dropdown */
  document.getElementById('userPhoto').addEventListener('click', () => {
    const dd = document.getElementById('userDropdown');
    dd.style.display = dd.style.display === 'none' ? 'block' : 'none';
  });

  /* Close dropdown when clicking outside */
  document.addEventListener('click', e => {
    if (!e.target.closest('#userMenu')) {
      const dd = document.getElementById('userDropdown');
      if (dd) dd.style.display = 'none';
    }
  });

  /* Keyboard navigation */
  document.addEventListener('keydown', e => {
    if (e.altKey || e.ctrlKey || e.metaKey || !currentUser) return;
    if (e.key === 'ArrowLeft')  navigateTo(offsetDate(currentDate, -1));
    if (e.key === 'ArrowRight' && currentDate < todayStr()) navigateTo(offsetDate(currentDate, 1));
  });

  /* Touch swipe */
  let touchStartX = 0;
  const mc = document.querySelector('.main-content');
  mc.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  mc.addEventListener('touchend',   e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (!currentUser || Math.abs(dx) < 60) return;
    if (dx > 0) navigateTo(offsetDate(currentDate, -1));
    else if (currentDate < todayStr()) navigateTo(offsetDate(currentDate, 1));
  }, { passive: true });
}

document.addEventListener('DOMContentLoaded', async () => {
  init();
  if (!FIREBASE_CONFIGURED) await startApp();
});
