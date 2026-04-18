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

let mealOptions = {
  breakfast: ['Oats & Banana', 'Poha', 'Idli & Sambar', 'Dosa', 'Paratha', 'Bread & Eggs'],
  lunch:     ['Rice & Dal', 'Roti & Sabzi', 'Salad Bowl', 'Pulao', 'Biryani'],
  snack:     ['Fruits', 'Nuts & Seeds', 'Tea & Biscuits', 'Yogurt', 'Protein Bar'],
  dinner:    ['Chapati & Sabzi', 'Rice & Curry', 'Khichdi', 'Dal & Rice', 'Soup & Salad']
};
let mealPlanWeekStart  = null;
let pendingAddMealType = null;

let userSections    = [];    // [{ id, name, icon, type, order, visible }]
let activeRecognition = null; // Web Speech API instance

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
    t: {},
    plan: { breakfast: '', lunch: '', snack: '', dinner: '' },
    reading: { did_read: false, book_title: '', author: '', pages_read: 0, duration_mins: 0, notes: '' },
    tracker: {}
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
    try {
      const stored = JSON.parse(localStorage.getItem('habitTracker_mealOptions') || 'null');
      if (stored) mealOptions = { ...mealOptions, ...stored };
    } catch {}
    return;
  }
  try {
    const [snap, userDoc] = await Promise.all([
      db.collection('users').doc(currentUser.uid).collection('days').get(),
      db.collection('users').doc(currentUser.uid).get()
    ]);
    data = {};
    snap.forEach(doc => { data[doc.id] = doc.data(); });
    if (userDoc.exists && userDoc.data().mealOptions) {
      mealOptions = { ...mealOptions, ...userDoc.data().mealOptions };
    }
  } catch (err) {
    console.error('Firestore load error:', err);
    data = {};
  }
}

/* ── MEAL OPTIONS SAVE ──────────────────────────────────── */
function saveMealOptions() {
  if (!currentUser) return;
  if (!FIREBASE_CONFIGURED) {
    localStorage.setItem('habitTracker_mealOptions', JSON.stringify(mealOptions));
    return;
  }
  db.collection('users').doc(currentUser.uid)
    .set({ mealOptions }, { merge: true })
    .catch(err => console.error('Meal options save error:', err));
}

/* ── MEAL PLAN DAY SAVE ─────────────────────────────────── */
function saveMealPlanDay(dateStr) {
  if (!currentUser) return;
  if (!FIREBASE_CONFIGURED) {
    localStorage.setItem('habitTracker_v1', JSON.stringify(data));
    return;
  }
  const dayData = data[dateStr] || defaultDay();
  db.collection('users').doc(currentUser.uid)
    .collection('days').doc(dateStr)
    .set(dayData, { merge: true })
    .catch(err => console.error('Meal plan save error:', err));
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

function readingCompletion(r) {
  const fields = [r.did_read, r.book_title, (r.pages_read || 0) > 0 || (r.duration_mins || 0) > 0];
  return Math.round(fields.filter(Boolean).length / fields.length * 100);
}

function dayHasData(dateStr) {
  if (!data[dateStr]) return false;
  const h = data[dateStr].health  || {};
  const s = data[dateStr].sadhana || {};
  const r = data[dateStr].reading || {};
  return !!(h.sleep_time || h.wake_time || h.steps || Object.values(s).some(Boolean) || r.did_read);
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
  document.getElementById('streakDisplay').textContent = calcStreak();
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
  const rPct = readingCompletion(d.reading || {});

  document.getElementById('healthBadge').textContent  = `${hPct}%`;
  document.getElementById('sadhanaBadge').textContent = `${sPct}%`;
  document.getElementById('readingBadge').textContent = `${rPct}%`;
  document.getElementById('healthBadge').style.color  = hPct === 100 ? '#34d399' : '';
  document.getElementById('sadhanaBadge').style.color = sPct === 100 ? '#a78bfa' : '';
  document.getElementById('readingBadge').style.color = rPct === 100 ? '#f472b6' : '';
  updateRing('sleepRing',    'sleepPct',   hPct);
  updateRing('sadhanaRing',  'sadhanaPct', sPct);
  updateRing('readingRing',  'readingPct', rPct);
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

/* ── RENDER — READING FORM ──────────────────────────────── */
function renderReading() {
  const r = getDayData(currentDate).reading || {};
  const didRead = document.getElementById('didRead');
  if (didRead) didRead.checked = !!r.did_read;
  setVal('readingTitle',    r.book_title);
  setVal('readingAuthor',   r.author);
  setVal('readingPages',    r.pages_read  || '');
  setVal('readingDuration', r.duration_mins || '');
  const notes = document.getElementById('readingNotes');
  if (notes) notes.value = r.notes || '';
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

/* ── PLANNER — STREAK HELPERS ───────────────────────────── */
function calcHabitStreak(checker) {
  let streak = 0;
  let d = todayStr();
  while (checker(d)) { streak++; d = offsetDate(d, -1); }
  return streak;
}

function getLast7Dots(checker) {
  const today = todayStr();
  return Array.from({ length: 7 }, (_, i) => checker(offsetDate(today, i - 6)));
}

function setHabitCard(key, streak, dots) {
  const streakEl = document.getElementById(`hstreak-${key}`);
  const dotsEl   = document.getElementById(`hdots-${key}`);
  if (streakEl) streakEl.textContent = streak > 0 ? `🔥 ${streak}` : '—';
  if (dotsEl) {
    const today = todayStr();
    dotsEl.innerHTML = dots.map((done, i) => {
      const d  = offsetDate(today, i - 6);
      const dt = dateObj(d);
      return `<span class="habit-dot${done ? ' done' : ''}" title="${DAY_NAMES[dt.getDay()]} ${dt.getDate()}"></span>`;
    }).join('');
  }
}

/* ── PLANNER RENDER ─────────────────────────────────────── */
function renderPlanner() {
  const HEALTH_HABITS = [
    { key: 'sleep',    check: d => !!(data[d]?.health?.sleep_time && data[d]?.health?.wake_time) },
    { key: 'phone',    check: d => !!(data[d]?.health?.greyscale_on) },
    { key: 'activity', check: d => (parseInt(data[d]?.health?.steps) || 0) > 0 },
    { key: 'meals',    check: d => !!(data[d]?.health?.breakfast || data[d]?.health?.lunch || data[d]?.health?.dinner) }
  ];

  const SADHANA_PRACTICES = ['guru_pooja', 'upa_yoga', 'surya_kriya', 'yoga_namaskar', 'sck'];

  HEALTH_HABITS.forEach(({ key, check }) => {
    setHabitCard(key, calcHabitStreak(check), getLast7Dots(check));
  });

  const healthSectionStreak = calcHabitStreak(d => {
    const h = data[d]?.health || {};
    return !!(h.sleep_time || (parseInt(h.steps) || 0) > 0 || h.breakfast || h.lunch || h.dinner);
  });
  const psh = document.getElementById('pstreak-health');
  if (psh) psh.textContent = healthSectionStreak > 0 ? `🔥 ${healthSectionStreak}` : '';

  SADHANA_PRACTICES.forEach(p => {
    const check = d => !!(data[d]?.sadhana?.[p]);
    setHabitCard(p, calcHabitStreak(check), getLast7Dots(check));
  });

  const sadhanaSectionStreak = calcHabitStreak(d => {
    const s = data[d]?.sadhana || {};
    return Object.values(s).some(Boolean);
  });
  const pss = document.getElementById('pstreak-sadhana');
  if (pss) pss.textContent = sadhanaSectionStreak > 0 ? `🔥 ${sadhanaSectionStreak}` : '';

  // Reading
  const readingCheck = d => !!(data[d]?.reading?.did_read);
  setHabitCard('reading', calcHabitStreak(readingCheck), getLast7Dots(readingCheck));
  const readingSectionStreak = calcHabitStreak(readingCheck);
  const psr = document.getElementById('pstreak-reading');
  if (psr) psr.textContent = readingSectionStreak > 0 ? `🔥 ${readingSectionStreak}` : '';
}

/* ── MEAL PLANNER RENDER ────────────────────────────────── */
function getMealPlanDay(dateStr) {
  if (!data[dateStr]) data[dateStr] = defaultDay();
  if (!data[dateStr].plan) data[dateStr].plan = { breakfast: '', lunch: '', snack: '', dinner: '' };
  return data[dateStr].plan;
}

function renderMealSelect(date, meal, icon, currentVal) {
  const labels = { breakfast: 'Breakfast', lunch: 'Lunch', snack: 'Snack', dinner: 'Dinner' };
  const opts   = (mealOptions[meal] || [])
    .map(o => `<option value="${o.replace(/"/g,'&quot;')}"${currentVal === o ? ' selected' : ''}>${o}</option>`)
    .join('');
  return `<div class="mp-meal-row">
    <span class="mp-meal-icon">${icon}</span>
    <select class="input-select mp-meal-select" data-date="${date}" data-meal="${meal}">
      <option value="">— ${labels[meal]} —</option>
      ${opts}
      <option value="__add__">＋ Add option…</option>
    </select>
  </div>`;
}

function renderMealPlanner() {
  if (!mealPlanWeekStart) mealPlanWeekStart = getWeekDates(todayStr())[0];

  const weekDates  = getWeekDates(mealPlanWeekStart);
  const todayWeekMon = getWeekDates(todayStr())[0];
  const mon = weekDates[0];
  const sun = weekDates[6];

  // Week label
  const fmt = d => {
    const dt = dateObj(d);
    return `${dt.getDate()} ${MONTH_NAMES[dt.getMonth()].slice(0,3)}`;
  };
  document.getElementById('mpWeekLabel').textContent = `${fmt(mon)} – ${fmt(sun)}`;
  document.getElementById('mpNextWeek').disabled = mon >= todayWeekMon;

  const MEAL_ICONS = { breakfast: '🌅', lunch: '☀️', snack: '🌤️', dinner: '🌙' };
  const container  = document.getElementById('mpDays');

  container.innerHTML = weekDates.map(d => {
    const dt   = dateObj(d);
    const plan = getMealPlanDay(d);
    const isT  = isToday(d);
    return `<div class="mp-day-card${isT ? ' mp-today' : ''}" data-date="${d}">
      <div class="mp-day-header">
        <span class="mp-day-name">${DAY_NAMES[dt.getDay()]}</span>
        <span class="mp-day-date">${dt.getDate()} ${MONTH_NAMES[dt.getMonth()].slice(0,3)}</span>
        ${isT ? '<span class="mp-today-badge">Today</span>' : ''}
      </div>
      <div class="mp-meals">
        ${renderMealSelect(d, 'breakfast', MEAL_ICONS.breakfast, plan.breakfast)}
        ${renderMealSelect(d, 'lunch',     MEAL_ICONS.lunch,     plan.lunch)}
        ${renderMealSelect(d, 'snack',     MEAL_ICONS.snack,     plan.snack)}
        ${renderMealSelect(d, 'dinner',    MEAL_ICONS.dinner,    plan.dinner)}
      </div>
    </div>`;
  }).join('');

  container.querySelectorAll('.mp-meal-select').forEach(sel => {
    sel.addEventListener('change', () => {
      const { date, meal } = sel.dataset;
      if (sel.value === '__add__') {
        sel.value = getMealPlanDay(date)[meal] || '';
        showAddOptionModal(meal);
        return;
      }
      getMealPlanDay(date)[meal] = sel.value;
      saveMealPlanDay(date);
    });
  });
}

/* ── ADD MEAL OPTION MODAL ──────────────────────────────── */
function showAddOptionModal(mealType) {
  pendingAddMealType = mealType;
  const labels = { breakfast: 'Breakfast', lunch: 'Lunch', snack: 'Snack', dinner: 'Dinner' };
  document.getElementById('addOptionMealType').textContent = labels[mealType] || mealType;
  document.getElementById('addOptionInput').value = '';
  document.getElementById('addOptionOverlay').style.display = 'flex';
  setTimeout(() => document.getElementById('addOptionInput').focus(), 50);
}

function hideAddOptionModal() {
  document.getElementById('addOptionOverlay').style.display = 'none';
  pendingAddMealType = null;
}

function confirmAddOption() {
  const val = document.getElementById('addOptionInput').value.trim();
  if (!val) { showToast('⚠️ Please enter an option name'); return; }
  if (!mealOptions[pendingAddMealType].includes(val)) {
    mealOptions[pendingAddMealType].push(val);
    saveMealOptions();
  }
  const mealType = pendingAddMealType;
  hideAddOptionModal();
  renderMealPlanner();
  showToast(`✅ Added "${val}" to ${mealType} options`);
}

/* ── DAILY TRACKER RENDER ───────────────────────────────── */
function renderDailyTracker() {
  const label = document.getElementById('trackerDateLabel');
  if (label) label.textContent = formatDateFull(currentDate);

  renderPendingHabits();

  const container = document.getElementById('trackerSlots');
  if (!container) return;

  const now    = new Date();
  const nowKey = isToday(currentDate)
    ? `${String(now.getHours()).padStart(2,'0')}${String(Math.floor(now.getMinutes()/15)*15).padStart(2,'0')}`
    : null;

  const tracker = getDayData(currentDate).tracker || {};
  const slots   = [];
  for (let h = 5; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      const key  = `${String(h).padStart(2,'0')}${String(m).padStart(2,'0')}`;
      const disp = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
      slots.push({ key, disp });
    }
  }

  container.innerHTML = slots.map(({ key, disp }) => {
    const isCurrent = key === nowKey;
    const val = tracker[key] || '';
    return `<div class="tracker-slot${isCurrent ? ' current-slot' : ''}" data-key="${key}">
      <span class="slot-time">${disp}</span>
      <textarea class="slot-input${val ? ' has-content' : ''}" rows="1"
        data-slot="${key}" placeholder="${isCurrent ? 'What are you doing now?' : ''}"
        >${val}</textarea>
      <button class="slot-mic-btn" data-slot="${key}" title="Speak to fill">🎤</button>
    </div>`;
  }).join('');

  container.querySelectorAll('.slot-input').forEach(ta => {
    autoResizeTextarea(ta);
    ta.addEventListener('input', () => {
      autoResizeTextarea(ta);
      saveTrackerSlot(ta.dataset.slot, ta.value);
    });
    ta.addEventListener('blur', () => {
      if (ta.value.trim()) parseTrackerEntry(ta.value, currentDate);
    });
  });

  container.querySelectorAll('.slot-mic-btn').forEach(btn => {
    btn.addEventListener('click', () => startSpeechInput(btn.dataset.slot));
  });

  if (nowKey && isToday(currentDate)) {
    const cur = container.querySelector('.current-slot');
    if (cur) setTimeout(() => cur.scrollIntoView({ behavior:'smooth', block:'center' }), 100);
  }
}

function autoResizeTextarea(ta) {
  ta.style.height = 'auto';
  ta.style.height = Math.max(36, ta.scrollHeight) + 'px';
}

function saveTrackerSlot(slotKey, value) {
  if (!data[currentDate]) data[currentDate] = defaultDay();
  if (!data[currentDate].tracker) data[currentDate].tracker = {};
  if (value.trim()) data[currentDate].tracker[slotKey] = value;
  else delete data[currentDate].tracker[slotKey];
  saveData();
}

function parseTrackerEntry(text, date) {
  const lower = text.toLowerCase();
  const d = getDayData(date);
  let changed = false;

  // Sadhana practices (keyword match)
  const SADHANA_MAP = {
    surya_kriya:    /surya kriya|surya-kriya/,
    guru_pooja:     /guru pooja|guru-pooja/,
    upa_yoga:       /upa yoga|upa-yoga/,
    yoga_namaskar:  /yoga namaskar|yoga-namaskar/,
    sck:            /\bsck\b|shakti chalana/
  };
  Object.entries(SADHANA_MAP).forEach(([k, rx]) => {
    if (rx.test(lower) && !d.sadhana[k]) { d.sadhana[k] = true; changed = true; }
  });

  // Steps
  const stepsM = lower.match(/(\d[\d,]*)\s*steps/);
  if (stepsM) { d.health.steps = parseInt(stepsM[1].replace(/,/g,'')); changed = true; }

  // Heart points
  const hpM = lower.match(/(\d+)\s*heart/);
  if (hpM) { d.health.heart_points = parseInt(hpM[1]); changed = true; }

  // Reading
  if (/\bread\b|reading|book|pages/.test(lower)) {
    d.reading.did_read = true; changed = true;
  }
  const pagesM = lower.match(/(\d+)\s*pages?/);
  if (pagesM) { d.reading.pages_read = parseInt(pagesM[1]); changed = true; }
  const durM = lower.match(/(\d+)\s*min(?:utes?)?\s*(?:of\s+)?read|read\s+for\s+(\d+)/);
  if (durM) { d.reading.duration_mins = parseInt(durM[1] || durM[2]); changed = true; }

  // Breakfast / lunch / snack / dinner
  const mealRx = { breakfast: /breakfast[:\s]+(.+)/, lunch: /lunch[:\s]+(.+)/, snack: /snack[:\s]+(.+)/, dinner: /dinner[:\s]+(.+)/ };
  Object.entries(mealRx).forEach(([meal, rx]) => {
    const m = lower.match(rx);
    if (m && !d.health[meal]) { d.health[meal] = m[1].trim(); changed = true; }
  });

  if (changed) {
    saveData(); renderAll();
    showToast('✨ Habits auto-populated from tracker');
  }
}

/* ── PENDING HABITS PANEL ───────────────────────────────── */
function renderPendingHabits() {
  const panel = document.getElementById('pendingPanel');
  const chips = document.getElementById('pendingChips');
  if (!panel || !chips) return;

  const d     = getDayData(currentDate);
  const h     = d.health  || {};
  const s     = d.sadhana || {};
  const r     = d.reading || {};
  const items = [];

  if (!h.sleep_time) items.push({ label: '😴 Sleep', tab: 'health' });
  if (!(parseInt(h.steps) > 0)) items.push({ label: '🏃 Steps', tab: 'health' });
  if (!h.breakfast) items.push({ label: '🌅 Breakfast', tab: 'health' });
  if (!h.lunch)     items.push({ label: '☀️ Lunch', tab: 'health' });
  if (!h.dinner)    items.push({ label: '🌙 Dinner', tab: 'health' });
  if (!s.guru_pooja)    items.push({ label: '🪔 Guru Pooja', tab: 'sadhana' });
  if (!s.surya_kriya)   items.push({ label: '☀️ Surya Kriya', tab: 'sadhana' });
  if (!s.yoga_namaskar) items.push({ label: '🧘 Yoga Namaskar', tab: 'sadhana' });
  if (!s.upa_yoga)      items.push({ label: '🌀 Upa Yoga', tab: 'sadhana' });
  if (!s.sck)           items.push({ label: '⚡ SCK', tab: 'sadhana' });
  if (!r.did_read) items.push({ label: '📚 Reading', tab: 'reading' });

  if (!items.length) {
    panel.classList.add('empty');
    return;
  }
  panel.classList.remove('empty');
  chips.innerHTML = items.map(it =>
    `<span class="pending-chip" data-tab="${it.tab}">${it.label}</span>`
  ).join('');
  chips.querySelectorAll('.pending-chip').forEach(c =>
    c.addEventListener('click', () => switchTab(c.dataset.tab))
  );
}

/* ── SPEECH-TO-TEXT ─────────────────────────────────────── */
function startSpeechInput(slotKey) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) { showToast('⚠️ Speech recognition not supported in this browser'); return; }

  if (activeRecognition) { activeRecognition.stop(); activeRecognition = null; return; }

  const btn = document.querySelector(`.slot-mic-btn[data-slot="${slotKey}"]`);
  const ta  = document.querySelector(`.slot-input[data-slot="${slotKey}"]`);

  const recognition = new SpeechRecognition();
  recognition.lang             = 'en-US';
  recognition.interimResults   = false;
  recognition.maxAlternatives  = 1;
  activeRecognition = recognition;

  if (btn) btn.classList.add('recording');

  recognition.onresult = e => {
    const transcript = e.results[0][0].transcript;
    if (ta) {
      ta.value = (ta.value ? ta.value + ' ' : '') + transcript;
      ta.classList.add('has-content');
      autoResizeTextarea(ta);
      saveTrackerSlot(slotKey, ta.value);
      parseTrackerEntry(ta.value, currentDate);
    }
  };

  recognition.onerror  = () => { if (btn) btn.classList.remove('recording'); activeRecognition = null; };
  recognition.onend    = () => { if (btn) btn.classList.remove('recording'); activeRecognition = null; };
  recognition.start();
}

/* ── USER SECTIONS (Firestore per-user) ─────────────────── */
const DEFAULT_SECTIONS = [
  { id: 'health',  name: 'Health',         icon: '💚', type: 'builtin', order: 0, visible: true },
  { id: 'sadhana', name: 'Sadhana',        icon: '🔮', type: 'builtin', order: 1, visible: true },
  { id: 'reading', name: 'Reading Habits', icon: '📚', type: 'builtin', order: 2, visible: true }
];

async function loadUserSections() {
  if (!FIREBASE_CONFIGURED) {
    try {
      const stored = JSON.parse(localStorage.getItem('habitTracker_sections') || 'null');
      userSections = stored || [...DEFAULT_SECTIONS];
    } catch { userSections = [...DEFAULT_SECTIONS]; }
    return;
  }
  try {
    const snap = await db.collection('users').doc(currentUser.uid).collection('sections').get();
    if (snap.empty) {
      userSections = [...DEFAULT_SECTIONS];
      await seedDefaultSections();
    } else {
      userSections = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => a.order - b.order);
    }
  } catch { userSections = [...DEFAULT_SECTIONS]; }
}

async function seedDefaultSections() {
  if (!FIREBASE_CONFIGURED) {
    localStorage.setItem('habitTracker_sections', JSON.stringify(userSections));
    return;
  }
  const batch = db.batch();
  DEFAULT_SECTIONS.forEach(s => {
    batch.set(db.collection('users').doc(currentUser.uid).collection('sections').doc(s.id), s);
  });
  await batch.commit().catch(() => {});
}

async function saveSection(section) {
  if (!FIREBASE_CONFIGURED) {
    localStorage.setItem('habitTracker_sections', JSON.stringify(userSections));
    return;
  }
  await db.collection('users').doc(currentUser.uid).collection('sections').doc(section.id)
    .set(section).catch(() => {});
}

async function deleteSection(sectionId) {
  userSections = userSections.filter(s => s.id !== sectionId);
  if (!FIREBASE_CONFIGURED) {
    localStorage.setItem('habitTracker_sections', JSON.stringify(userSections));
    return;
  }
  await db.collection('users').doc(currentUser.uid).collection('sections').doc(sectionId)
    .delete().catch(() => {});
}

/* ── ONBOARDING ─────────────────────────────────────────── */
async function checkFirstLogin() {
  if (!currentUser) return;
  if (!FIREBASE_CONFIGURED) {
    if (!localStorage.getItem('habitTracker_onboarded')) {
      showOnboarding();
      localStorage.setItem('habitTracker_onboarded', '1');
    }
    return;
  }
  const doc = await db.collection('users').doc(currentUser.uid).get().catch(() => null);
  if (doc && !doc.data()?.onboarded) {
    showOnboarding();
    db.collection('users').doc(currentUser.uid).set({ onboarded: true }, { merge: true }).catch(() => {});
  }
}

function showOnboarding() {
  document.getElementById('onboardingModal').style.display = 'flex';
}
function hideOnboarding() {
  document.getElementById('onboardingModal').style.display = 'none';
}

/* ── SECTIONS MANAGEMENT MODAL ──────────────────────────── */
function renderSectionsList() {
  const list = document.getElementById('sectionsList');
  const count = document.getElementById('sectionsCount');
  if (!list) return;

  list.innerHTML = userSections.map(s => `
    <div class="section-item" data-id="${s.id}">
      <span class="section-item-icon">${s.icon}</span>
      <span class="section-item-name">${s.name}</span>
      <span class="section-item-type">${s.type}</span>
      ${s.type === 'custom' ? `<button class="section-delete-btn" data-id="${s.id}">✕</button>` : ''}
    </div>
  `).join('');

  list.querySelectorAll('.section-delete-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      await deleteSection(btn.dataset.id);
      renderSectionsList();
      renderCustomSections();
      showToast('Section removed');
    });
  });

  if (count) count.textContent = `${userSections.length} / 10 sections`;
  const addForm = document.getElementById('addSectionForm');
  if (addForm) addForm.style.display = userSections.length >= 10 ? 'none' : 'flex';
}

function renderCustomSections() {
  const container = document.getElementById('customSectionsContainer');
  if (!container) return;

  const custom = userSections.filter(s => s.type === 'custom');
  container.innerHTML = custom.map(s => `
    <div class="planner-section" style="--ps-accent:#818cf8;--ps-soft:rgba(129,140,248,0.1)" id="ps-${s.id}">
      <div class="ps-header" data-section="ps-${s.id}">
        <div class="ps-left">
          <span>${s.icon}</span>
          <span class="ps-title" style="color:var(--planner)">${s.name}</span>
        </div>
        <div class="ps-right">
          <svg class="ps-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      </div>
      <div class="ps-body" id="psbody-${s.id}">
        <div class="habit-card">
          <span class="habit-icon">${s.icon}</span>
          <div class="habit-info">
            <div class="habit-name">${s.name}</div>
            <div class="habit-dots" id="hdots-${s.id}"></div>
          </div>
          <div class="habit-streak-badge" id="hstreak-${s.id}">—</div>
        </div>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.ps-header').forEach(hdr => {
    hdr.addEventListener('click', () => {
      const section = document.getElementById(hdr.dataset.section);
      if (section) section.classList.toggle('collapsed');
    });
  });
}

/* ── TRENDS ─────────────────────────────────────────────── */
function renderHeatmap(containerId, scorer, color) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const today = todayStr();
  const cells = [];
  for (let i = 90; i >= 0; i--) {
    const d = offsetDate(today, -i);
    const score = Math.min(1, Math.max(0, scorer(d)));
    const alpha = score < 0.01 ? 0.06 : 0.18 + score * 0.72;
    cells.push(`<div class="heatmap-cell" style="background:${color};opacity:${alpha.toFixed(2)}" title="${d}"></div>`);
  }
  el.innerHTML = cells.join('');
}

function renderTrendBars(containerId, checker, color) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const today = todayStr();
  const bars = [];
  for (let i = 29; i >= 0; i--) {
    const d = offsetDate(today, -i);
    const done = checker(d);
    bars.push(`<div class="trend-bar${done ? ' done' : ''}" style="${done ? `background:${color}` : ''}" title="${d}"></div>`);
  }
  el.innerHTML = bars.join('');
}

function renderTrends() {
  const SADHANA_PRACTICES = ['guru_pooja', 'upa_yoga', 'surya_kriya', 'yoga_namaskar', 'sck'];

  renderHeatmap('heatmap-health', d => {
    const h = data[d]?.health || {};
    let done = 0;
    if (h.sleep_time && h.wake_time) done++;
    if ((parseInt(h.steps) || 0) >= STEPS_GOAL) done++;
    if (h.breakfast || h.lunch || h.dinner) done++;
    if (h.greyscale_on) done++;
    return done / 4;
  }, 'var(--health)');
  renderTrendBars('bars-sleep',  d => !!(data[d]?.health?.sleep_time && data[d]?.health?.wake_time), 'var(--health)');
  renderTrendBars('bars-steps',  d => (parseInt(data[d]?.health?.steps) || 0) >= STEPS_GOAL, 'var(--health)');
  renderTrendBars('bars-meals',  d => !!(data[d]?.health?.breakfast || data[d]?.health?.lunch || data[d]?.health?.dinner), 'var(--health)');
  renderTrendBars('bars-phone',  d => !!(data[d]?.health?.greyscale_on), 'var(--health)');

  renderHeatmap('heatmap-sadhana', d => {
    const s = data[d]?.sadhana || {};
    return SADHANA_PRACTICES.filter(p => s[p]).length / SADHANA_PRACTICES.length;
  }, 'var(--sadhana)');
  SADHANA_PRACTICES.forEach(p =>
    renderTrendBars(`bars-${p}`, d => !!(data[d]?.sadhana?.[p]), 'var(--sadhana)')
  );

  renderHeatmap('heatmap-reading', d => data[d]?.reading?.did_read ? 1 : 0, 'var(--reading)');
  renderTrendBars('bars-reading-did', d => !!(data[d]?.reading?.did_read), 'var(--reading)');
}

/* ── FULL RENDER ────────────────────────────────────────── */
function renderAll() {
  renderHeader();
  renderHealth();
  renderSadhana();
  renderReading();
  renderBadges();
  updateExportSummary();
  renderPlanner();
  renderMealPlanner();
  renderDailyTracker();
  renderTrends();
}

/* ── NAVIGATION ─────────────────────────────────────────── */
function navigateTo(dateStr) {
  currentDate = dateStr;
  renderAll();
}

/* ── TAB SWITCHING ──────────────────────────────────────── */
function switchTab(tabName) {
  document.querySelectorAll('.nav-item[data-tab]').forEach(t =>
    t.classList.toggle('active', t.dataset.tab === tabName)
  );
  document.querySelectorAll('.tab-section').forEach(s =>
    s.classList.toggle('active', s.id === `tab-${tabName}`)
  );
}

function toggleSidebar() {
  const sidebar  = document.getElementById('appSidebar');
  const overlay  = document.getElementById('sidebarOverlay');
  const header   = document.querySelector('.app-header');
  const main     = document.querySelector('.main-content');
  const isHiding = !sidebar.classList.contains('collapsed');
  sidebar.classList.toggle('collapsed', isHiding);
  overlay.classList.toggle('visible',   isHiding);
  if (isHiding) {
    if (header) header.style.marginLeft = '0';
    if (main)   main.style.marginLeft   = '0';
  } else {
    if (header) header.style.marginLeft = '';
    if (main)   main.style.marginLeft   = '';
  }
}

function openSidebar() {
  const sidebar = document.getElementById('appSidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const header  = document.querySelector('.app-header');
  const main    = document.querySelector('.main-content');
  sidebar.classList.remove('collapsed');
  overlay.classList.remove('visible');
  if (header) header.style.marginLeft = '';
  if (main)   main.style.marginLeft   = '';
}

function closeSidebar() {
  /* no-op — sidebar stays visible; overlay only closes via toggleSidebar */
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
  provider.setCustomParameters({ prompt: 'select_account' });
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
  await loadUserSections();
  renderCustomSections();
  renderUserMenu(currentUser);
  renderAll();
  showLoading(false);
}

if (!FIREBASE_CONFIGURED) {
  // No Firebase — boot straight into the app using localStorage
} else {
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
        createdAt:  firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true }).catch(() => {});
      await loadAllData();
      await loadUserSections();
      renderCustomSections();
      renderUserMenu(user);
      renderAll();
      showLoading(false);
      showToast(`👋 Welcome back, ${user.displayName?.split(' ')[0] || 'there'}!`);
    } else {
      currentUser = null;
      data        = {};
      userSections = [];
      showLoading(false);
      showLogin(true);
      renderUserMenu(null);
    }
  });
}

/* ── INIT ───────────────────────────────────────────────── */
function init() {
  /* Sidebar nav switching */
  document.getElementById('sidebarNav').addEventListener('click', e => {
    const item = e.target.closest('[data-tab]');
    if (item) switchTab(item.dataset.tab);
  });
  /* Export in sidebar footer also triggers tab switch */
  document.querySelector('.sidebar-footer .nav-item[data-tab="export"]')
    ?.addEventListener('click', () => switchTab('export'));

  /* Hamburger — collapses sidebar on mobile; overlay restores it */
  document.getElementById('sidebarToggle').addEventListener('click', toggleSidebar);
  document.getElementById('sidebarOverlay').addEventListener('click', openSidebar);

  /* Planner — collapsible sections */
  document.querySelectorAll('.ps-header').forEach(hdr => {
    hdr.addEventListener('click', () => {
      const section = document.getElementById(hdr.dataset.section);
      if (section) section.classList.toggle('collapsed');
    });
  });

  /* Meal planner — week navigation */
  mealPlanWeekStart = getWeekDates(todayStr())[0];
  document.getElementById('mpPrevWeek').addEventListener('click', () => {
    mealPlanWeekStart = offsetDate(mealPlanWeekStart, -7);
    renderMealPlanner();
  });
  document.getElementById('mpNextWeek').addEventListener('click', () => {
    const todayWeekMon = getWeekDates(todayStr())[0];
    if (mealPlanWeekStart < todayWeekMon) {
      mealPlanWeekStart = offsetDate(mealPlanWeekStart, 7);
      renderMealPlanner();
    }
  });

  /* Reading Habits events */
  const didRead = document.getElementById('didRead');
  if (didRead) {
    didRead.addEventListener('change', () => {
      getDayData(currentDate).reading.did_read = didRead.checked;
      saveData(); renderBadges(); renderWeekStrip();
    });
  }
  ['readingTitle','readingAuthor'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => {
      getDayData(currentDate).reading[el.dataset.field] = el.value;
      saveData(); renderBadges();
    });
  });
  ['readingPages','readingDuration'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => {
      getDayData(currentDate).reading[el.dataset.field] = parseInt(el.value) || 0;
      saveData(); renderBadges();
    });
  });
  const readingNotes = document.getElementById('readingNotes');
  if (readingNotes) {
    readingNotes.addEventListener('input', () => {
      getDayData(currentDate).reading.notes = readingNotes.value;
      saveData();
    });
  }

  /* Reading ± buttons (reuse existing .num-btn logic, handled by existing handler) */

  /* Onboarding */
  document.getElementById('onboardingStart').addEventListener('click', hideOnboarding);

  /* Sections modal — opened from planner or sidebar */
  const openSectionsModal = () => {
    renderSectionsList();
    document.getElementById('sectionsModal').style.display = 'flex';
  };
  document.getElementById('manageSectionsBtn').addEventListener('click', openSectionsModal);
  const addSectionNavBtn = document.getElementById('addSectionNavBtn');
  if (addSectionNavBtn) addSectionNavBtn.addEventListener('click', openSectionsModal);
  document.getElementById('sectionsMgrClose').addEventListener('click', () => {
    document.getElementById('sectionsModal').style.display = 'none';
  });
  document.getElementById('sectionsModal').addEventListener('click', e => {
    if (e.target.id === 'sectionsModal') document.getElementById('sectionsModal').style.display = 'none';
  });
  document.getElementById('addSectionBtn').addEventListener('click', async () => {
    const icon = document.getElementById('newSectionIcon').value.trim() || '📝';
    const name = document.getElementById('newSectionName').value.trim();
    if (!name) { showToast('⚠️ Enter a section name'); return; }
    if (userSections.length >= 10) { showToast('⚠️ Maximum 10 sections reached'); return; }
    const id = 'custom_' + Date.now();
    const section = { id, name, icon, type: 'custom', order: userSections.length, visible: true };
    userSections.push(section);
    await saveSection(section);
    document.getElementById('newSectionIcon').value = '';
    document.getElementById('newSectionName').value = '';
    renderSectionsList();
    renderCustomSections();
    showToast(`✅ "${name}" section added`);
  });

  /* Add meal option modal */
  document.getElementById('addOptionCancel').addEventListener('click', hideAddOptionModal);
  document.getElementById('addOptionConfirm').addEventListener('click', confirmAddOption);
  document.getElementById('addOptionOverlay').addEventListener('click', e => {
    if (e.target.id === 'addOptionOverlay') hideAddOptionModal();
  });
  document.getElementById('addOptionInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') confirmAddOption();
    if (e.key === 'Escape') hideAddOptionModal();
  });

  /* Date navigation */
  document.getElementById('prevDay').addEventListener('click', () =>
    navigateTo(offsetDate(currentDate, -1))
  );
  document.getElementById('nextDay').addEventListener('click', () => {
    if (currentDate < todayStr()) navigateTo(offsetDate(currentDate, 1));
  });

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
