/* ═══════════════════════════════════════════════════════════
   HABIT TRACKER — APPLICATION LOGIC
   ═══════════════════════════════════════════════════════════ */

'use strict';

/* ── CONSTANTS ──────────────────────────────────────────── */
const STORAGE_KEY = 'habitTracker_v1';
const STEPS_GOAL  = 10000;
const DAY_NAMES   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTH_NAMES = ['January','February','March','April','May','June',
                     'July','August','September','October','November','December'];

/* ── STATE ──────────────────────────────────────────────── */
let currentDate = todayStr();
let data        = loadData();

/* ── UTILITY — DATE ─────────────────────────────────────── */
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function dateObj(str) {
  // Parse YYYY-MM-DD as local date
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
  const d = dateObj(str);
  const day = d.getDay(); // 0=Sun
  const monday = new Date(d);
  monday.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
  return Array.from({ length: 7 }, (_, i) => {
    const t = new Date(monday);
    t.setDate(monday.getDate() + i);
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
  if (diff < 0) diff += 1440; // crosses midnight
  return Math.round((diff / 60) * 10) / 10;
}

/* ── DATA STORAGE ───────────────────────────────────────── */
function loadData() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch { return {}; }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getDayData(dateStr) {
  if (!data[dateStr]) data[dateStr] = defaultDay();
  return data[dateStr];
}

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

/* ── COMPLETENESS ───────────────────────────────────────── */
function healthCompletion(h) {
  const fields = [
    h.sleep_time, h.wake_time, h.sleep_quality > 0,
    h.greyscale_on,
    h.steps > 0, h.heart_points > 0,
    h.breakfast_source, h.lunch_source, h.dinner_source,
    h.breakfast, h.lunch, h.dinner
  ];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}

function sadhanaCompletion(s) {
  const fields = Object.values(s);
  const done   = fields.filter(Boolean).length;
  return Math.round((done / fields.length) * 100);
}

function dayHasData(dateStr) {
  if (!data[dateStr]) return false;
  const d = data[dateStr];
  const h = d.health || {};
  const s = d.sadhana || {};
  return !!(h.sleep_time || h.wake_time || h.steps || Object.values(s).some(Boolean));
}

/* ── STREAK ─────────────────────────────────────────────── */
function calcStreak() {
  let streak = 0;
  let d = todayStr();
  // Don't count today itself if it has no data
  while (true) {
    if (dayHasData(d)) { streak++; d = offsetDate(d, -1); }
    else break;
  }
  return streak;
}

/* ── RENDER — HEADER ────────────────────────────────────── */
function renderHeader() {
  const today = todayStr();
  document.getElementById('dateLabel').textContent = isToday(currentDate) ? 'Today' :
    currentDate === offsetDate(today, -1) ? 'Yesterday' :
    currentDate === offsetDate(today, 1) ? 'Tomorrow' : '';
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
    const dt      = dateObj(d);
    const cls     = [
      'week-day',
      d === today        ? 'today'    : '',
      d === currentDate  ? 'selected' : '',
      dayHasData(d)      ? 'has-data' : ''
    ].filter(Boolean).join(' ');

    return `<div class="${cls}" data-date="${d}">
      <span class="wday-name">${DAY_NAMES[dt.getDay()]}</span>
      <span class="wday-num">${dt.getDate()}</span>
      <span class="wday-dot"></span>
    </div>`;
  }).join('');

  strip.querySelectorAll('.week-day').forEach(el => {
    el.addEventListener('click', () => navigateTo(el.dataset.date));
  });
}

/* ── RENDER — TABS BADGES ───────────────────────────────── */
function renderBadges() {
  const d   = getDayData(currentDate);
  const hPct = healthCompletion(d.health);
  const sPct = sadhanaCompletion(d.sadhana);

  document.getElementById('healthBadge').textContent  = `${hPct}%`;
  document.getElementById('sadhanaBadge').textContent = `${sPct}%`;
  updateRing('sleepRing',   'sleepPct',   hPct);
  updateRing('sadhanaRing', 'sadhanaPct', sPct);

  // Tab badges
  document.getElementById('healthBadge').style.color  = hPct === 100 ? '#34d399' : '';
  document.getElementById('sadhanaBadge').style.color = sPct === 100 ? '#a78bfa' : '';
}

function updateRing(ringId, pctId, pct) {
  const circ = 2 * Math.PI * 15.9; // circumference
  const fill  = (pct / 100) * circ;
  document.getElementById(ringId).setAttribute('stroke-dasharray', `${fill.toFixed(1)} ${(circ - fill).toFixed(1)}`);
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

  // Selects
  document.querySelectorAll('[data-field$="_source"]').forEach(el => {
    el.value = h[el.dataset.field] || '';
  });

  // Text fields (meals)
  ['breakfast','lunch','snack','dinner'].forEach(m => {
    const el = document.querySelector(`[data-field="${m}"]`);
    if (el) el.value = h[m] || '';
  });

  // Stars
  setStars(h.sleep_quality || 0);

  // Computed fields
  updateComputed();
}

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val || '';
}

function setStars(val) {
  document.querySelectorAll('#sleepQuality .star').forEach(s => {
    s.classList.toggle('active', parseInt(s.dataset.val) <= val);
  });
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
  const s    = getDayData(currentDate).sadhana;
  const all  = Object.values(s).every(Boolean);
  document.getElementById('sadhanaBanner').style.display = all ? 'block' : 'none';
}

/* ── COMPUTED FIELDS ────────────────────────────────────── */
function updateComputed() {
  const h = getDayData(currentDate).health;

  // Sleep hours
  const sh = calcHours(h.sleep_time, h.wake_time);
  const shEl = document.getElementById('sleepHours');
  shEl.querySelector('.computed-value').textContent = sh !== null ? sh : '—';
  shEl.querySelector('.computed-unit').textContent  = sh !== null ? 'hrs' : '';

  // Greyscale hours (greyscale_on → wake_time)
  const gh = calcHours(h.greyscale_on, h.wake_time);
  const ghEl = document.getElementById('greyscaleHours');
  ghEl.querySelector('.computed-value').textContent = gh !== null ? gh : '—';
  ghEl.querySelector('.computed-unit').textContent  = gh !== null ? 'hrs' : '';

  // Steps bar
  const steps   = parseInt(h.steps) || 0;
  const stepsPct = Math.min(100, Math.round((steps / STEPS_GOAL) * 100));
  document.getElementById('stepsBar').style.width = stepsPct + '%';
  document.getElementById('stepsGoalPct').textContent = stepsPct + '%';
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
  document.querySelectorAll('.tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tabName);
  });
  document.querySelectorAll('.tab-section').forEach(s => {
    s.classList.toggle('active', s.id === `tab-${tabName}`);
  });
}

/* ── EVENT HANDLERS — HEALTH ────────────────────────────── */
function initHealthEvents() {
  // Time inputs
  ['sleepTime', 'wakeTime', 'greyscaleOn'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('change', () => {
      getDayData(currentDate).health[el.dataset.field] = el.value;
      saveData();
      updateComputed();
      renderBadges();
      renderWeekStrip();
    });
  });

  // Steps / Heart points inputs
  ['stepsInput', 'heartInput'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => {
      getDayData(currentDate).health[el.dataset.field] = el.value ? parseInt(el.value) : '';
      saveData();
      updateComputed();
      renderBadges();
      renderWeekStrip();
    });
  });

  // +/- buttons
  document.querySelectorAll('.num-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = document.getElementById(btn.dataset.target);
      if (!target) return;
      const delta = parseInt(btn.dataset.delta);
      const cur   = parseInt(target.value) || 0;
      const val   = Math.max(0, cur + delta);
      target.value = val;
      getDayData(currentDate).health[target.dataset.field] = val;
      saveData();
      updateComputed();
      renderBadges();
      renderWeekStrip();
    });
  });

  // Select / text fields
  document.querySelectorAll('.card-health [data-field]').forEach(el => {
    if (el.tagName === 'SELECT' || (el.tagName === 'INPUT' && el.type === 'text')) {
      el.addEventListener('change', () => {
        getDayData(currentDate).health[el.dataset.field] = el.value;
        saveData();
        renderBadges();
        renderWeekStrip();
      });
    }
  });

  // Stars
  document.querySelectorAll('#sleepQuality .star').forEach(star => {
    star.addEventListener('click', () => {
      const val = parseInt(star.dataset.val);
      getDayData(currentDate).health.sleep_quality = val;
      saveData();
      setStars(val);
      renderBadges();
      renderWeekStrip();
    });
  });
}

/* ── EVENT HANDLERS — SADHANA ───────────────────────────── */
function initSadhanaEvents() {
  document.querySelectorAll('.sadhana-check').forEach(el => {
    el.addEventListener('change', () => {
      getDayData(currentDate).sadhana[el.dataset.field] = el.checked;
      saveData();
      updateSadhanaBanner();
      renderBadges();
      renderWeekStrip();
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
    'Date':                dateStr,
    'Day':                 DAY_NAMES[dateObj(dateStr).getDay()],
    'Sleeping Time':       h.sleep_time || '',
    'Waking Time':         h.wake_time  || '',
    'Hours of Sleep':      sh != null ? sh : '',
    'Sleep Quality (1-5)': h.sleep_quality || '',
    'Greyscale On At':     h.greyscale_on  || '',
    'Greyscale Hours':     gh != null ? gh : '',
    'Steps':               h.steps         || '',
    'Heart Points':        h.heart_points  || '',
    'Breakfast Source':    h.breakfast_source || '',
    'Breakfast':           h.breakfast        || '',
    'Lunch Source':        h.lunch_source     || '',
    'Lunch':               h.lunch            || '',
    'Snack Source':        h.snack_source     || '',
    'Snack':               h.snack            || '',
    'Dinner Source':       h.dinner_source    || '',
    'Dinner':              h.dinner           || ''
  };
}

function buildSadhanaRow(dateStr, s) {
  return {
    'Date':          dateStr,
    'Day':           DAY_NAMES[dateObj(dateStr).getDay()],
    'Guru Pooja':    s.guru_pooja    ? 'Yes' : 'No',
    'Upa Yoga':      s.upa_yoga      ? 'Yes' : 'No',
    'Surya Kriya':   s.surya_kriya   ? 'Yes' : 'No',
    'Yoga Namaskar': s.yoga_namaskar ? 'Yes' : 'No',
    'SCK':           s.sck           ? 'Yes' : 'No',
    'Total Done':    Object.values(s).filter(Boolean).length
  };
}

function updateExportSummary() {
  const keys  = Object.keys(data).sort();
  const count = keys.length;
  const el    = document.getElementById('dataSummary');
  if (count === 0) { el.textContent = 'No data recorded yet.'; return; }
  el.textContent = `${count} day${count > 1 ? 's' : ''} of data recorded · ${keys[0]} → ${keys[keys.length - 1]}`;
}

function doExport(format) {
  const dates = getExportRange();
  if (!dates || dates.length === 0) {
    showToast('⚠️ Please select a valid date range');
    return;
  }
  const cats = getSelectedCats();
  if (cats.length === 0) {
    showToast('⚠️ Please select at least one category');
    return;
  }

  const healthRows   = [];
  const sadhanaRows  = [];

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
  const a    = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportCSV(healthRows, sadhanaRows, cats) {
  const parts = [];
  if (cats.includes('health') && healthRows.length) {
    parts.push('=== HEALTH ===\n' + rowsToCSV(healthRows));
  }
  if (cats.includes('sadhana') && sadhanaRows.length) {
    parts.push('=== SADHANA ===\n' + rowsToCSV(sadhanaRows));
  }
  const content  = parts.join('\n\n');
  const filename = `habit-tracker-${todayStr()}.csv`;
  downloadFile('\uFEFF' + content, filename, 'text/csv;charset=utf-8');
  showToast('✅ CSV exported!');
}

function exportXLSX(healthRows, sadhanaRows, cats) {
  if (typeof XLSX === 'undefined') {
    showToast('⚠️ Excel library not loaded. Try CSV instead.');
    return;
  }
  const wb = XLSX.utils.book_new();
  if (cats.includes('health') && healthRows.length) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(healthRows), 'Health');
  }
  if (cats.includes('sadhana') && sadhanaRows.length) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sadhanaRows), 'Sadhana');
  }
  if (!wb.SheetNames.length) { showToast('⚠️ No data to export'); return; }
  XLSX.writeFile(wb, `habit-tracker-${todayStr()}.xlsx`);
  showToast('✅ Excel file exported!');
}

/* ── QUICK DATE RANGES ──────────────────────────────────── */
function setQuickRange(days) {
  const to = todayStr();
  let from;
  if (days === 'all') {
    const keys = Object.keys(data).sort();
    from = keys.length ? keys[0] : to;
  } else {
    from = offsetDate(to, -(parseInt(days) - 1));
  }
  document.getElementById('exportFrom').value = from;
  document.getElementById('exportTo').value   = to;

  document.querySelectorAll('.range-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.range === String(days));
  });
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
function showConfirm(title, body, onOk) {
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmBody').textContent  = body;
  document.getElementById('confirmModal').style.display = 'flex';
  document.getElementById('confirmOk').onclick = () => {
    hideConfirm(); onOk();
  };
}
function hideConfirm() {
  document.getElementById('confirmModal').style.display = 'none';
}

/* ── INIT ───────────────────────────────────────────────── */
function init() {
  // Tab switching
  document.getElementById('categoryTabs').addEventListener('click', e => {
    const tab = e.target.closest('[data-tab]');
    if (tab) switchTab(tab.dataset.tab);
  });

  // Date navigation
  document.getElementById('prevDay').addEventListener('click', () => {
    navigateTo(offsetDate(currentDate, -1));
  });
  document.getElementById('nextDay').addEventListener('click', () => {
    if (currentDate < todayStr()) navigateTo(offsetDate(currentDate, 1));
  });

  // Header export button -> switch to export tab
  document.getElementById('exportBtn').addEventListener('click', () => switchTab('export'));

  // Health events
  initHealthEvents();

  // Sadhana events
  initSadhanaEvents();

  // Export buttons
  document.getElementById('exportCSV').addEventListener('click',  () => doExport('csv'));
  document.getElementById('exportXLSX').addEventListener('click', () => doExport('xlsx'));

  // Quick ranges
  document.querySelectorAll('.range-btn').forEach(btn => {
    btn.addEventListener('click', () => setQuickRange(btn.dataset.range));
  });

  // Default export range
  setQuickRange(7);

  // Clear all
  document.getElementById('clearAllBtn').addEventListener('click', () => {
    showConfirm(
      'Clear all data?',
      'This will permanently delete all your habit data. This cannot be undone.',
      () => {
        data = {};
        saveData();
        renderAll();
        showToast('🗑️ All data cleared');
      }
    );
  });

  // Confirm modal cancel
  document.getElementById('confirmCancel').addEventListener('click', hideConfirm);
  document.getElementById('confirmModal').addEventListener('click', e => {
    if (e.target === document.getElementById('confirmModal')) hideConfirm();
  });

  // Keyboard navigation
  document.addEventListener('keydown', e => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === 'ArrowLeft')  navigateTo(offsetDate(currentDate, -1));
    if (e.key === 'ArrowRight' && currentDate < todayStr()) navigateTo(offsetDate(currentDate, 1));
  });

  // Touch swipe on main content
  let touchStartX = 0;
  const mc = document.querySelector('.main-content');
  mc.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  mc.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 60) {
      if (dx > 0) navigateTo(offsetDate(currentDate, -1));
      else if (currentDate < todayStr()) navigateTo(offsetDate(currentDate, 1));
    }
  }, { passive: true });

  // Initial render
  renderAll();
}

document.addEventListener('DOMContentLoaded', init);
