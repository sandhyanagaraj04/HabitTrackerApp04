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

const DEFAULT_SADHANA_PRACTICES = [
  { id: 'guru_pooja',          name: 'Guru Pooja',                      icon: '🪔', desc: 'An invitation to the Divine' },
  { id: 'upa_yoga',            name: 'Upa Yoga',                        icon: '🌀', desc: '', section: 'other' },
  { id: 'yoga_namaskar',       name: 'Yoga Namaskar',                   icon: '🧘', desc: '', section: 'other', extra: [{ id: 'yoga_namaskar_cycles', label: 'Cycles' }] },
  { id: 'surya_kriya',         name: 'Surya Kriya',                     icon: '☀️', desc: '', extra: [{ id: 'surya_kriya_cycles', label: 'Cycles' }, { id: 'surya_kriya_mins', label: 'Total mins' }] },
  { id: 'angamardana',         name: 'Angamardana',                     icon: '💪', desc: '', extra: [{ id: 'angamardana_cycles', label: 'Cycles' }] },
  { id: 'asanas',              name: 'Asanas',                          icon: '🤸', desc: '' },
  { id: 'sck_morning',         name: 'Shakti Chalana Kriya (Morning)',  icon: '⚡', desc: '', extra: [{ id: 'sck_morning_kapalabhatis', label: 'Kapalabhatis / cycle' }] },
  { id: 'shambhavi_morning',   name: 'Shambhavi (Morning)',             icon: '🌅', desc: '' },
  { id: 'breath_watching',     name: 'Breath Watching',                 icon: '🫁', desc: '', extra: [{ id: 'breath_watching_mins', label: 'Minutes' }] },
  { id: 'samyama',             name: 'Samyama',                         icon: '🔮', desc: '', extra: [{ id: 'samyama_mins', label: 'Minutes' }] },
  { id: 'aum_namah_shivaya',   name: 'Aum Namah Shivaya Chanting',     icon: '🕉️', desc: '', extra: [{ id: 'aum_namah_shivaya_mins', label: 'Minutes' }] },
  { id: 'shoonya_mid',         name: 'Shoonya (Mid Morning)',           icon: '🌌', desc: '' },
  { id: 'miracle_of_mind',     name: 'Miracle of Mind',                 icon: '🧠', desc: '', extra: [{ id: 'miracle_of_mind_mins', label: 'Minutes' }] },
  { id: 'devi_stuti',          name: 'Devi Stuti',                      icon: '🌸', desc: '', extra: [{ id: 'devi_stuti_cycles', label: 'Cycles' }] },
  { id: 'achala_arpanam',      name: 'Achala Arpanam',                  icon: '🏔️', desc: '', section: 'other' },
  { id: 'infinity_meditation', name: 'Infinity Meditation',             icon: '♾️', desc: '', section: 'other' },
  { id: 'sukha_kriya',         name: 'Sukha Kriya',                     icon: '😌', desc: '', section: 'other' },
  { id: 'aum_chanting',        name: 'Aum Chanting',                    icon: '🔔', desc: '', section: 'other' },
  { id: 'nadi_shuddhi',        name: 'Nadi Shuddhi',                    icon: '🌬️', desc: '', section: 'other' },
  { id: 'bhuta_shuddhi',       name: 'Bhuta Shuddhi',                   icon: '🔥', desc: '' },
  { id: 'shoonya_evening',     name: 'Shoonya (Evening)',               icon: '🌙', desc: '' },
  { id: 'presence_time',       name: 'Presence Time',                   icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" style="vertical-align:middle"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.5"/><line x1="12" y1="2.5" x2="12" y2="4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="21.5" y1="12" x2="19.5" y2="12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="12" y1="21.5" x2="12" y2="19.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="2.5" y1="12" x2="4.5" y2="12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="12" y1="12" x2="11" y2="17.4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="12" y1="12" x2="18.5" y2="15.8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/></svg>', desc: '' },
  { id: 'iecc',                name: 'Inner Engineering Crash Course',  icon: '🌟', desc: '', textField: { id: 'iecc_notes', placeholder: 'Rule applied:\nScenario:' } },
  { id: 'sck_evening',         name: 'Shakti Chalana Kriya (Evening)',  icon: '⚡', desc: '', section: 'other', extra: [{ id: 'sck_evening_kapalabhatis', label: 'Kapalabhatis / cycle' }] },
  { id: 'shambhavi_evening',   name: 'Shambhavi (Evening)',             icon: '🌅', desc: '', section: 'other' },
];

let userRecipes        = [];
let currentEditRecipeId = null;
let mealOptions        = {}; // legacy compat — kept for loadAllData

/* ── NEW MEAL PLANNER STATE ─────────────────────────────── */
let mpWeekStart       = null;   // Monday string for current planning week
let mpDefaultServings = 2;
let mpActivePicker    = null;   // { date, mealType }
let mpActiveIngSlot   = null;   // { date, mealType }
let mpPickerQuery     = '';
let mpRecipeServings  = 2;      // servings counter in the recipe/meal modal

const MP_MEAL_SLOTS = [
  { key: 'breakfast', icon: '🌅', label: 'Breakfast' },
  { key: 'lunch',     icon: '☀️', label: 'Lunch'     },
  { key: 'snack',     icon: '🌤️', label: 'Snack'     },
  { key: 'dinner',    icon: '🌙', label: 'Dinner'    },
];

let userSections      = [];   // [{ id, name, icon, type, order, visible }]
let userHealthHabits  = [];   // [{ id, name, icon, type, order }]
const healthCollapseState = {}; // { habitId: bool } — false = expanded
let currentEditHabitId = null;
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
      breakfast: '', lunch: '', snack: '', dinner: '',
      customHabits: {}
    },
    sadhana: (() => {
      const s = Object.fromEntries(DEFAULT_SADHANA_PRACTICES.map(p => [p.id, false]));
      DEFAULT_SADHANA_PRACTICES.forEach(p => (p.extra || []).forEach(e => { s[e.id] = 0; }));
      return s;
    })(),
    t: {},
    plan: { breakfast: '', lunch: '', snack: '', dinner: '' },
    reading:   { did_read: false, book_title: '', author: '', pages_read: 0, duration_mins: 0, notes: '' },
    tracker:   {},
    priorities: ['', '', ''],
    mealSlots: {}
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
  userHealthHabits.filter(habit => habit.type === 'custom').forEach(habit => {
    fields.push(!!(h.customHabits?.[habit.id]?.done));
  });
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

/* ── RENDER — HEALTH HABITS ─────────────────────────────── */
function renderHealth() { renderHealthHabits(); }

/* ── HEALTH HABITS — DATA & RENDERING ───────────────────── */
const DEFAULT_HEALTH_HABITS = [
  { id: 'sleep',    name: 'Sleep',       icon: '😴', type: 'builtin', order: 0 },
  { id: 'phone',    name: 'Phone Usage', icon: '📱', type: 'builtin', order: 1 },
  { id: 'activity', name: 'Activity',    icon: '🏃', type: 'builtin', order: 2 },
  { id: 'meals',    name: 'Meals',       icon: '🍽️', type: 'builtin', order: 3 },
];

async function loadHealthHabits() {
  if (!currentUser) return;
  try {
    const snap = await db.collection('users').doc(currentUser.uid)
      .collection('healthHabits').orderBy('order').get();
    if (snap.empty) {
      await seedDefaultHealthHabits();
    } else {
      userHealthHabits = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
  } catch (err) {
    console.error('loadHealthHabits error:', err);
    if (!userHealthHabits.length) userHealthHabits = DEFAULT_HEALTH_HABITS.map(h => ({ ...h }));
  }
}

async function seedDefaultHealthHabits() {
  const batch = db.batch();
  const col = db.collection('users').doc(currentUser.uid).collection('healthHabits');
  DEFAULT_HEALTH_HABITS.forEach(h => {
    batch.set(col.doc(h.id), { name: h.name, icon: h.icon, type: h.type, order: h.order });
  });
  await batch.commit();
  userHealthHabits = DEFAULT_HEALTH_HABITS.map(h => ({ ...h }));
}

async function saveHealthHabit(habit) {
  await db.collection('users').doc(currentUser.uid)
    .collection('healthHabits').doc(habit.id).set(
      { name: habit.name, icon: habit.icon, type: habit.type, order: habit.order }, { merge: true });
}

async function deleteHealthHabit(id) {
  await db.collection('users').doc(currentUser.uid)
    .collection('healthHabits').doc(id).delete();
  userHealthHabits = userHealthHabits.filter(h => h.id !== id);
  renderHealthHabits();
}

function getHabitStatusText(habitId, h) {
  if (habitId === 'sleep') {
    if (h.sleep_time && h.wake_time) return `${h.sleep_time} → ${h.wake_time}`;
    if (h.sleep_time) return `Slept at ${h.sleep_time}`;
    return '';
  }
  if (habitId === 'phone') {
    return h.greyscale_on ? `Greyscale: ${h.greyscale_on}` : '';
  }
  if (habitId === 'activity') {
    const parts = [];
    if (h.steps) parts.push(`${h.steps} steps`);
    if (h.heart_points) parts.push(`${h.heart_points} HP`);
    return parts.join(' · ');
  }
  if (habitId === 'meals') {
    const done = [h.breakfast, h.lunch, h.snack, h.dinner].filter(Boolean).length;
    return done ? `${done}/4 meals logged` : '';
  }
  return '';
}

function mealSelectHTML(mealKey, sourceKey, h) {
  const src = h[sourceKey] || '';
  const val = h[mealKey] || '';
  return `
    <div class="hs-field-group">
      <label class="hs-field-label">${mealKey.charAt(0).toUpperCase() + mealKey.slice(1)}</label>
      <select class="hs-select" data-field="${sourceKey}">
        <option value="">Source…</option>
        <option value="home" ${src==='home'?'selected':''}>Home</option>
        <option value="outside" ${src==='outside'?'selected':''}>Outside</option>
        <option value="skipped" ${src==='skipped'?'selected':''}>Skipped</option>
      </select>
      <input type="text" class="hs-input" data-field="${mealKey}" placeholder="What did you eat?" value="${escapeHtml(val)}">
    </div>`;
}

function builtinHabitBodyHTML(habitId, h) {
  if (habitId === 'sleep') {
    return `
      <div class="hs-body-grid">
        <div class="hs-field-group">
          <label class="hs-field-label">Sleep time</label>
          <input type="time" class="hs-input" data-field="sleep_time" value="${h.sleep_time||''}">
        </div>
        <div class="hs-field-group">
          <label class="hs-field-label">Wake time</label>
          <input type="time" class="hs-input" data-field="wake_time" value="${h.wake_time||''}">
        </div>
        <div class="hs-field-group">
          <label class="hs-field-label">Quality</label>
          <div class="stars" id="sleepQuality" data-field="sleep_quality">
            ${[1,2,3,4,5].map(v=>`<span class="star${(h.sleep_quality||0)>=v?' active':''}" data-val="${v}">★</span>`).join('')}
          </div>
        </div>
        <div class="hs-computed" id="sleepHours">
          <span class="computed-value">—</span>
          <span class="computed-unit"></span>
        </div>
      </div>`;
  }
  if (habitId === 'phone') {
    return `
      <div class="hs-body-grid">
        <div class="hs-field-group">
          <label class="hs-field-label">Greyscale on at</label>
          <input type="time" class="hs-input" data-field="greyscale_on" value="${h.greyscale_on||''}">
        </div>
        <div class="hs-computed" id="greyscaleHours">
          <span class="computed-value">—</span>
          <span class="computed-unit"></span>
        </div>
      </div>`;
  }
  if (habitId === 'activity') {
    return `
      <div class="hs-body-grid">
        <div class="hs-field-group">
          <label class="hs-field-label">Steps</label>
          <input type="number" class="hs-input" data-field="steps" placeholder="e.g. 8000" value="${h.steps||''}">
        </div>
        <div class="hs-field-group">
          <label class="hs-field-label">Heart Points</label>
          <input type="number" class="hs-input" data-field="heart_points" placeholder="e.g. 30" value="${h.heart_points||''}">
        </div>
        <div class="hs-progress-wrap">
          <div class="hs-progress-bar" id="stepsBar">
            <div class="hs-progress-fill" id="stepsBarFill" style="width:0%"></div>
          </div>
          <span class="hs-progress-label" id="stepsGoalPct">0%</span>
        </div>
      </div>`;
  }
  if (habitId === 'meals') {
    return `
      <div class="hs-body-grid hs-meals-grid">
        ${mealSelectHTML('breakfast','breakfast_source',h)}
        ${mealSelectHTML('lunch','lunch_source',h)}
        ${mealSelectHTML('snack','snack_source',h)}
        ${mealSelectHTML('dinner','dinner_source',h)}
      </div>`;
  }
  return '';
}

function customHabitBodyHTML(habitId, h) {
  const done = !!(h.customHabits?.[habitId]?.done);
  const note = h.customHabits?.[habitId]?.note || '';
  return `
    <div class="hs-body-grid">
      <div class="hs-field-group hs-custom-row">
        <label class="hs-toggle-label">
          <input type="checkbox" class="hs-checkbox" data-custom-done="${habitId}" ${done?'checked':''}>
          <span>Done today</span>
        </label>
      </div>
      <div class="hs-field-group">
        <label class="hs-field-label">Note</label>
        <input type="text" class="hs-input" data-custom-note="${habitId}" placeholder="Optional note…" value="${escapeHtml(note)}">
      </div>
    </div>`;
}

function renderHealthHabits() {
  const container = document.getElementById('healthHabitsContainer');
  if (!container) return;
  const h = getDayData(currentDate).health;

  container.innerHTML = userHealthHabits.map(habit => {
    const collapsed = !healthCollapseState[habit.id];
    const statusText = habit.type === 'builtin'
      ? getHabitStatusText(habit.id, h)
      : (h.customHabits?.[habit.id]?.done ? 'Done ✓' : '');
    const bodyHTML = habit.type === 'builtin'
      ? builtinHabitBodyHTML(habit.id, h)
      : customHabitBodyHTML(habit.id, h);

    return `
      <div class="hs-section" data-habit-id="${habit.id}" data-habit-type="${habit.type}">
        <div class="hs-header">
          <span class="hs-chevron">${collapsed ? '▶' : '▼'}</span>
          <span class="hs-icon">${escapeHtml(habit.icon)}</span>
          <span class="hs-name">${escapeHtml(habit.name)}</span>
          ${statusText ? `<span class="hs-status">${escapeHtml(statusText)}</span>` : ''}
          <div class="hs-header-actions">
            <button class="hs-edit-btn" data-habit-id="${habit.id}" title="Edit habit">✏️</button>
            <button class="hs-delete-btn" data-habit-id="${habit.id}" title="Delete habit">🗑️</button>
          </div>
        </div>
        <div class="hs-body" style="${collapsed ? 'display:none' : ''}">
          ${bodyHTML}
        </div>
      </div>`;
  }).join('');

  updateComputed();
  const h2 = getDayData(currentDate).health;
  setStars(h2.sleep_quality || 0);
  const pct = healthCompletion(h2);
  const ring = document.getElementById('sleepRing');
  if (ring) ring.setAttribute('stroke-dasharray', `${pct} ${100 - pct}`);
  const pctEl = document.getElementById('sleepPct');
  if (pctEl) pctEl.textContent = `${pct}%`;
}

function updateHabitStatus(habitId) {
  const section = document.querySelector(`.hs-section[data-habit-id="${habitId}"]`);
  if (!section) return;
  const h = getDayData(currentDate).health;
  const statusText = section.dataset.habitType === 'builtin'
    ? getHabitStatusText(habitId, h)
    : (h.customHabits?.[habitId]?.done ? 'Done ✓' : '');
  let statusEl = section.querySelector('.hs-status');
  if (statusText) {
    if (!statusEl) {
      statusEl = document.createElement('span');
      statusEl.className = 'hs-status';
      section.querySelector('.hs-header').insertBefore(statusEl, section.querySelector('.hs-header-actions'));
    }
    statusEl.textContent = statusText;
  } else if (statusEl) {
    statusEl.remove();
  }
}

function initHealthContainerEvents() {
  const container = document.getElementById('healthHabitsContainer');
  if (!container) return;

  // Toggle collapse
  container.addEventListener('click', e => {
    const header = e.target.closest('.hs-header');
    if (!header) return;
    // Don't collapse when clicking buttons
    if (e.target.closest('.hs-edit-btn') || e.target.closest('.hs-delete-btn')) return;
    const section = header.closest('.hs-section');
    const id = section.dataset.habitId;
    healthCollapseState[id] = !healthCollapseState[id];
    const chevron = header.querySelector('.hs-chevron');
    const body = section.querySelector('.hs-body');
    if (healthCollapseState[id]) {
      body.style.display = '';
      chevron.textContent = '▼';
    } else {
      body.style.display = 'none';
      chevron.textContent = '▶';
    }
  });

  // Edit habit button
  container.addEventListener('click', e => {
    const btn = e.target.closest('.hs-edit-btn');
    if (!btn) return;
    const id = btn.dataset.habitId;
    const habit = userHealthHabits.find(h => h.id === id);
    if (habit) openHealthHabitModal(habit);
  });

  // Delete habit button
  container.addEventListener('click', async e => {
    const btn = e.target.closest('.hs-delete-btn');
    if (!btn) return;
    const id = btn.dataset.habitId;
    if (!confirm('Delete this habit?')) return;
    await deleteHealthHabit(id);
  });

  // Built-in input changes
  container.addEventListener('change', e => {
    const field = e.target.dataset.field;
    if (!field) return;
    const section = e.target.closest('.hs-section');
    if (!section) return;
    const habitId = section.dataset.habitId;
    const day = getDayData(currentDate);
    day.health[field] = e.target.value;
    saveDayData(currentDate, day);
    updateComputed();
    updateHabitStatus(habitId);
  });

  container.addEventListener('input', e => {
    const field = e.target.dataset.field;
    if (!field) return;
    const section = e.target.closest('.hs-section');
    if (!section) return;
    const habitId = section.dataset.habitId;
    const day = getDayData(currentDate);
    day.health[field] = e.target.value;
    saveDayData(currentDate, day);
    updateComputed();
    updateHabitStatus(habitId);
  });

  // Stars (sleep quality)
  container.addEventListener('click', e => {
    const star = e.target.closest('.star');
    if (!star) return;
    const val = parseInt(star.dataset.val);
    const day = getDayData(currentDate);
    day.health.sleep_quality = val;
    saveDayData(currentDate, day);
    setStars(val);
    updateHabitStatus('sleep');
  });

  // Custom habit done checkbox
  container.addEventListener('change', e => {
    const habitId = e.target.dataset.customDone;
    if (!habitId) return;
    const day = getDayData(currentDate);
    if (!day.health.customHabits) day.health.customHabits = {};
    if (!day.health.customHabits[habitId]) day.health.customHabits[habitId] = {};
    day.health.customHabits[habitId].done = e.target.checked;
    saveDayData(currentDate, day);
    updateHabitStatus(habitId);
    renderPendingHabits();
  });

  // Custom habit note
  container.addEventListener('input', e => {
    const habitId = e.target.dataset.customNote;
    if (!habitId) return;
    const day = getDayData(currentDate);
    if (!day.health.customHabits) day.health.customHabits = {};
    if (!day.health.customHabits[habitId]) day.health.customHabits[habitId] = {};
    day.health.customHabits[habitId].note = e.target.value;
    saveDayData(currentDate, day);
  });
}

function openHealthHabitModal(habit) {
  currentEditHabitId = habit ? habit.id : null;
  document.getElementById('hhModalTitle').textContent = habit ? 'Edit Habit' : 'Add Habit';
  document.getElementById('hhIcon').value = habit ? habit.icon : '';
  document.getElementById('hhName').value = habit ? habit.name : '';
  document.getElementById('healthHabitModal').style.display = 'flex';
}

async function saveHealthHabitModal() {
  const icon = document.getElementById('hhIcon').value.trim() || '✅';
  const name = document.getElementById('hhName').value.trim();
  if (!name) return;

  if (currentEditHabitId) {
    const habit = userHealthHabits.find(h => h.id === currentEditHabitId);
    if (habit) {
      habit.icon = icon;
      habit.name = name;
      await saveHealthHabit(habit);
    }
  } else {
    const id = 'custom_' + Date.now();
    const order = userHealthHabits.length;
    const habit = { id, name, icon, type: 'custom', order };
    userHealthHabits.push(habit);
    await saveHealthHabit(habit);
  }

  document.getElementById('healthHabitModal').style.display = 'none';
  renderHealthHabits();
}

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val || '';
}

/* ── RENDER — SADHANA UI (once on init) ─────────────────── */
function renderSadhanaUI() {
  const practiceList = document.getElementById('practiceList');
  if (practiceList) {
    practiceList.innerHTML = DEFAULT_SADHANA_PRACTICES.map(p => `
      <div class="practice-item" data-practice="${p.id}">
        <div class="practice-info">
          <span class="practice-icon">${p.icon}</span>
          <div>
            <div class="practice-name">${p.name}</div>
            ${p.desc ? `<div class="practice-desc">${p.desc}</div>` : ''}
            ${(p.extra || []).map(e => `<div class="practice-extra">
              <input type="number" class="practice-num sadhana-extra" data-extra="${e.id}" placeholder="0" min="0">
              <span class="practice-extra-label">${e.label}</span>
            </div>`).join('')}
          </div>
        </div>
        <label class="toggle">
          <input type="checkbox" class="sadhana-check" data-field="${p.id}">
          <span class="toggle-slider"></span>
        </label>
      </div>`).join('');
  }
  const trendHabits = document.getElementById('sadhana-trend-habits');
  if (trendHabits) {
    trendHabits.innerHTML = DEFAULT_SADHANA_PRACTICES.map(p => `
      <div class="trend-habit-row">
        <span class="trend-habit-label">${p.icon} ${p.name}</span>
        <div class="trend-bars" id="bars-${p.id}"></div>
      </div>`).join('');
  }
}

/* ── RENDER — SADHANA FORM ──────────────────────────────── */
function renderSadhana() {
  const s = getDayData(currentDate).sadhana;
  document.querySelectorAll('.sadhana-check').forEach(el => {
    el.checked = s[el.dataset.field] || false;
  });
  document.querySelectorAll('.sadhana-extra').forEach(el => {
    el.value = s[el.dataset.extra] || '';
  });
  updateSadhanaBanner();
}

function updateSadhanaBanner() {
  const s   = getDayData(currentDate).sadhana;
  const all = DEFAULT_SADHANA_PRACTICES.every(p => s[p.id]);
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

  const sh   = calcHours(h.sleep_time, h.wake_time);
  const shEl = document.getElementById('sleepHours');
  if (shEl) {
    shEl.querySelector('.computed-value').textContent = sh !== null ? sh : '—';
    shEl.querySelector('.computed-unit').textContent  = sh !== null ? 'hrs' : '';
  }

  const gh   = calcHours(h.greyscale_on, h.wake_time);
  const ghEl = document.getElementById('greyscaleHours');
  if (ghEl) {
    ghEl.querySelector('.computed-value').textContent = gh !== null ? gh : '—';
    ghEl.querySelector('.computed-unit').textContent  = gh !== null ? 'hrs' : '';
  }

  const steps    = parseInt(h.steps) || 0;
  const stepsPct = Math.min(100, Math.round(steps / STEPS_GOAL * 100));
  const stepsBarFill = document.getElementById('stepsBarFill');
  const stepsGoalPct = document.getElementById('stepsGoalPct');
  if (stepsBarFill)  stepsBarFill.style.width  = stepsPct + '%';
  if (stepsGoalPct)  stepsGoalPct.textContent  = stepsPct + '%';
}

function setStars(val) {
  const sq = document.getElementById('sleepQuality');
  if (!sq) return;
  sq.querySelectorAll('.star').forEach(s =>
    s.classList.toggle('active', parseInt(s.dataset.val) <= val)
  );
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

  HEALTH_HABITS.forEach(({ key, check }) => {
    setHabitCard(key, calcHabitStreak(check), getLast7Dots(check));
  });

  const healthSectionStreak = calcHabitStreak(d => {
    const h = data[d]?.health || {};
    return !!(h.sleep_time || (parseInt(h.steps) || 0) > 0 || h.breakfast || h.lunch || h.dinner);
  });
  const psh = document.getElementById('pstreak-health');
  if (psh) psh.textContent = healthSectionStreak > 0 ? `🔥 ${healthSectionStreak}` : '';

  const psSadhanaBody = document.getElementById('ps-sadhana-body');
  if (psSadhanaBody && !psSadhanaBody.dataset.rendered) {
    psSadhanaBody.innerHTML = DEFAULT_SADHANA_PRACTICES.map(p => `
      <div class="habit-card">
        <span class="habit-icon">${p.icon}</span>
        <div class="habit-info">
          <div class="habit-name">${p.name}</div>
          <div class="habit-dots" id="hdots-${p.id}"></div>
        </div>
        <div class="habit-streak-badge" id="hstreak-${p.id}">—</div>
      </div>`).join('');
    psSadhanaBody.dataset.rendered = '1';
  }
  DEFAULT_SADHANA_PRACTICES.forEach(p => {
    const check = d => !!(data[d]?.sadhana?.[p.id]);
    setHabitCard(p.id, calcHabitStreak(check), getLast7Dots(check));
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

/* ── MEAL PLANNER v2 — DATA HELPERS ────────────────────── */
function getMpSlot(dateStr, mealType) {
  const d = getDayData(dateStr);
  if (!d.mealSlots) d.mealSlots = {};
  if (!d.mealSlots[mealType]) {
    d.mealSlots[mealType] = { mealId: null, servingsOverride: null, ingredientsState: [] };
  }
  return d.mealSlots[mealType];
}

function getMpMeal(mealId) {
  return userRecipes.find(r => r.id === mealId) || null;
}

function isMpMealRecent(mealId) {
  const today = todayStr();
  for (let i = 1; i <= 7; i++) {
    const d = offsetDate(today, -i);
    if (Object.values(data[d]?.mealSlots || {}).some(s => s.mealId === mealId)) return true;
  }
  return false;
}

function selectMpMeal(dateStr, mealType, mealId) {
  const slot = getMpSlot(dateStr, mealType);
  const meal = getMpMeal(mealId);
  slot.mealId = mealId;
  slot.servingsOverride = null;
  const baseServings = meal?.defaultServings || 2;
  const scale = mpDefaultServings / Math.max(1, baseServings);
  slot.ingredientsState = (meal?.ingredients || []).map(ing => ({
    name:     ing.name,
    qty:      ing.qty ? String(Math.round(parseFloat(ing.qty) * scale * 10) / 10) : '',
    unit:     ing.unit || '',
    category: ing.category || 'General',
    checked:  false,
  }));
  saveData();
  renderMpDays();
}

function rescaleMpIngredients(dateStr, mealType) {
  const slot = getMpSlot(dateStr, mealType);
  const meal = getMpMeal(slot.mealId);
  if (!meal?.ingredients?.length) return;
  const targetServings = slot.servingsOverride ?? mpDefaultServings;
  const scale = targetServings / Math.max(1, meal.defaultServings || 2);
  slot.ingredientsState = meal.ingredients.map((ing, i) => ({
    name:     ing.name,
    qty:      ing.qty ? String(Math.round(parseFloat(ing.qty) * scale * 10) / 10) : '',
    unit:     ing.unit || '',
    category: ing.category || 'General',
    checked:  slot.ingredientsState[i]?.checked || false,
  }));
}

function buildMpGroceryList() {
  if (!mpWeekStart) return [];
  const weekDates = getWeekDates(mpWeekStart);
  const map = {};
  weekDates.forEach(d => {
    MP_MEAL_SLOTS.forEach(({ key }) => {
      const slot = data[d]?.mealSlots?.[key];
      if (!slot?.ingredientsState?.length) return;
      slot.ingredientsState.forEach(ing => {
        if (ing.checked) return;
        const cat = ing.category || 'General';
        const k   = `${ing.name.toLowerCase().trim()}||${(ing.unit || '').toLowerCase()}`;
        if (!map[cat]) map[cat] = {};
        if (!map[cat][k]) map[cat][k] = { name: ing.name, qty: 0, unit: ing.unit || '', category: cat };
        map[cat][k].qty += parseFloat(ing.qty) || 0;
      });
    });
  });
  const result = [];
  Object.keys(map).sort().forEach(cat => {
    Object.values(map[cat]).forEach(item => {
      result.push({ ...item, qty: item.qty > 0 ? String(Math.round(item.qty * 10) / 10) : '' });
    });
  });
  return result;
}

async function loadRecipes() {
  if (!currentUser) return;
  const snap = await db.collection('users').doc(currentUser.uid)
    .collection('recipes').orderBy('name').get().catch(() => ({ docs: [] }));
  userRecipes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function saveRecipeToFirestore(recipe) {
  if (!currentUser) return;
  const ref = recipe.id
    ? db.collection('users').doc(currentUser.uid).collection('recipes').doc(recipe.id)
    : db.collection('users').doc(currentUser.uid).collection('recipes').doc();
  const { id, ...data_ } = recipe;
  await ref.set(data_, { merge: true });
  return ref.id;
}

async function deleteRecipeFromFirestore(id) {
  if (!currentUser) return;
  await db.collection('users').doc(currentUser.uid).collection('recipes').doc(id).delete();
  userRecipes = userRecipes.filter(r => r.id !== id);
}

/* ── MEAL PLANNER v2 — RENDER ───────────────────────────── */
function renderMealPlannerV2() {
  if (!mpWeekStart) mpWeekStart = getWeekDates(todayStr())[0];
  const weekDates = getWeekDates(mpWeekStart);
  const fmt = d => { const dt = dateObj(d); return `${dt.getDate()} ${MONTH_NAMES[dt.getMonth()].slice(0,3)}`; };
  const wl = document.getElementById('mppWeekLabel');
  if (wl) wl.textContent = `${fmt(weekDates[0])} – ${fmt(weekDates[6])}`;
  const nb = document.getElementById('mppNextWeek');
  if (nb) nb.disabled = weekDates[0] >= getWeekDates(todayStr())[0];
  const sv = document.getElementById('mppServingsVal');
  if (sv) sv.textContent = mpDefaultServings;
  renderMpDays();
}

function renderMpDays() {
  const container = document.getElementById('mppDays');
  if (!container || !mpWeekStart) return;
  const weekDates = getWeekDates(mpWeekStart);

  container.innerHTML = weekDates.map(d => {
    const dt  = dateObj(d);
    const isT = isToday(d);
    const slots = MP_MEAL_SLOTS.map(({ key, icon, label }) => {
      const slot   = data[d]?.mealSlots?.[key];
      const meal   = slot?.mealId ? getMpMeal(slot.mealId) : null;
      const total  = slot?.ingredientsState?.length || 0;
      const needed = total - (slot?.ingredientsState?.filter(i => i.checked).length || 0);
      return `
        <div class="mpp-slot">
          <span class="mpp-slot-icon">${icon}</span>
          <div class="mpp-slot-body">
            <span class="mpp-slot-label">${label}</span>
            ${meal
              ? `<div class="mpp-slot-filled">
                  <span class="mpp-slot-meal-name" data-date="${d}" data-meal="${key}">${escapeHtml(meal.name)}</span>
                  <div class="mpp-slot-chips">
                    ${total ? `<button class="mpp-ing-chip${needed ? ' mpp-ing-chip-warn' : ' mpp-ing-chip-ok'}" data-date="${d}" data-meal="${key}">${needed ? needed + ' needed' : '✓ set'}</button>` : ''}
                    <button class="mpp-slot-x" data-date="${d}" data-meal="${key}">✕</button>
                  </div>
                </div>`
              : `<button class="mpp-slot-add" data-date="${d}" data-meal="${key}">＋ Add</button>`
            }
          </div>
        </div>`;
    }).join('');

    return `<div class="mpp-day-card${isT ? ' mpp-today' : ''}">
      <div class="mpp-day-hdr">
        <span class="mpp-day-name">${DAY_NAMES[dt.getDay()]}</span>
        <span class="mpp-day-date">${dt.getDate()} ${MONTH_NAMES[dt.getMonth()].slice(0,3)}</span>
        ${isT ? '<span class="mpp-today-pill">Today</span>' : ''}
      </div>
      <div class="mpp-day-slots">${slots}</div>
    </div>`;
  }).join('');

  container.querySelectorAll('.mpp-slot-add').forEach(btn =>
    btn.addEventListener('click', () => openMpPicker(btn.dataset.date, btn.dataset.meal)));
  container.querySelectorAll('.mpp-slot-meal-name').forEach(el =>
    el.addEventListener('click', () => openMpPicker(el.dataset.date, el.dataset.meal)));
  container.querySelectorAll('.mpp-slot-x').forEach(btn =>
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const slot = getMpSlot(btn.dataset.date, btn.dataset.meal);
      slot.mealId = null; slot.ingredientsState = [];
      saveData(); renderMpDays();
    }));
  container.querySelectorAll('.mpp-ing-chip').forEach(btn =>
    btn.addEventListener('click', e => { e.stopPropagation(); openMpIngSheet(btn.dataset.date, btn.dataset.meal); }));
}

/* ── MEAL PICKER SHEET ───────────────────────────────────── */
function openMpPicker(date, mealType) {
  mpActivePicker = { date, mealType };
  mpPickerQuery  = '';
  const LABELS = { breakfast: 'Breakfast', lunch: 'Lunch', snack: 'Snack', dinner: 'Dinner' };
  const titleEl = document.getElementById('mppPickerTitle');
  if (titleEl) titleEl.textContent = `Choose ${LABELS[mealType] || mealType}`;
  const searchEl = document.getElementById('mppPickerSearch');
  if (searchEl) searchEl.value = '';
  renderMpPickerList();
  document.getElementById('mppPickerOverlay').classList.add('mpp-open');
  setTimeout(() => document.getElementById('mppPickerSearch')?.focus(), 320);
}

function closeMpPicker() {
  document.getElementById('mppPickerOverlay').classList.remove('mpp-open');
  mpActivePicker = null;
}

function renderMpPickerList() {
  const list = document.getElementById('mppPickerList');
  if (!list) return;
  const q = mpPickerQuery.toLowerCase().trim();
  const meals = userRecipes.filter(r =>
    !q || r.name.toLowerCase().includes(q) || (r.cuisine || '').toLowerCase().includes(q));
  if (!meals.length) {
    list.innerHTML = `<div class="mpp-picker-empty">${q ? 'No meals found.' : 'No meals added yet. Tap "＋ New meal" below.'}</div>`;
    return;
  }
  const curId = mpActivePicker ? data[mpActivePicker.date]?.mealSlots?.[mpActivePicker.mealType]?.mealId : null;
  list.innerHTML = meals.map(m => {
    const recent = isMpMealRecent(m.id);
    const sel    = m.id === curId;
    const meta   = [m.cuisine, m.prepTime ? `⏱ ${m.prepTime} min` : '', `${m.ingredients?.length || 0} ing`]
                    .filter(Boolean).join(' · ');
    return `<div class="mpp-picker-row${recent ? ' mpp-picker-recent' : ''}${sel ? ' mpp-picker-sel' : ''}" data-id="${m.id}">
      <div class="mpp-picker-row-info">
        <span class="mpp-picker-name">${escapeHtml(m.name)}</span>
        ${meta ? `<span class="mpp-picker-meta">${escapeHtml(meta)}</span>` : ''}
      </div>
      ${recent ? '<span class="mpp-recent-tag">Recent</span>' : ''}
      ${sel    ? '<span class="mpp-sel-check">✓</span>' : ''}
    </div>`;
  }).join('');
  list.querySelectorAll('.mpp-picker-row').forEach(row =>
    row.addEventListener('click', () => {
      if (!mpActivePicker) return;
      selectMpMeal(mpActivePicker.date, mpActivePicker.mealType, row.dataset.id);
      closeMpPicker();
    }));
}

/* ── INGREDIENT SHEET ────────────────────────────────────── */
function openMpIngSheet(date, mealType) {
  mpActiveIngSlot = { date, mealType };
  const slot    = getMpSlot(date, mealType);
  const meal    = getMpMeal(slot.mealId);
  const ICONS   = { breakfast: '🌅', lunch: '☀️', snack: '🌤️', dinner: '🌙' };
  const dt      = dateObj(date);
  const titleEl = document.getElementById('mppIngTitle');
  if (titleEl) titleEl.textContent = `${meal?.name || 'Ingredients'} · ${DAY_NAMES[dt.getDay()]} ${ICONS[mealType] || ''}`;
  const servEl = document.getElementById('mppIngServVal');
  if (servEl) servEl.textContent = slot.servingsOverride ?? mpDefaultServings;
  renderMpIngList();
  document.getElementById('mppIngOverlay').classList.add('mpp-open');
}

function closeMpIngSheet() {
  document.getElementById('mppIngOverlay').classList.remove('mpp-open');
  mpActiveIngSlot = null;
}

function renderMpIngList() {
  const list = document.getElementById('mppIngList');
  if (!list || !mpActiveIngSlot) return;
  const slot = getMpSlot(mpActiveIngSlot.date, mpActiveIngSlot.mealType);
  if (!slot.ingredientsState.length) {
    list.innerHTML = '<div class="mpp-ing-empty">No ingredients listed for this meal.</div>';
    return;
  }
  const groups = {};
  slot.ingredientsState.forEach((ing, idx) => {
    const cat = ing.category || 'General';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push({ ...ing, idx });
  });
  list.innerHTML = Object.entries(groups).map(([cat, ings]) => `
    <div class="mpp-ing-group">
      <div class="mpp-ing-cat-label">${escapeHtml(cat)}</div>
      ${ings.map(ing => `
        <label class="mpp-ing-row${ing.checked ? ' mpp-ing-row-done' : ''}">
          <input type="checkbox" class="mpp-ing-cb" data-idx="${ing.idx}" ${ing.checked ? 'checked' : ''}>
          <span class="mpp-ing-name">${escapeHtml(ing.name)}</span>
          ${ing.qty ? `<span class="mpp-ing-qty">${escapeHtml(ing.qty)}${ing.unit ? ' ' + escapeHtml(ing.unit) : ''}</span>` : ''}
        </label>`).join('')}
    </div>`).join('');
  list.querySelectorAll('.mpp-ing-cb').forEach(cb =>
    cb.addEventListener('change', () => {
      getMpSlot(mpActiveIngSlot.date, mpActiveIngSlot.mealType).ingredientsState[parseInt(cb.dataset.idx)].checked = cb.checked;
      cb.closest('label').classList.toggle('mpp-ing-row-done', cb.checked);
      saveData(); renderMpDays();
    }));
}

/* ── GROCERY SHEET ───────────────────────────────────────── */
function openMpGrocerySheet() {
  renderMpGroceryList();
  document.getElementById('mppGroceryOverlay').classList.add('mpp-open');
}

function closeMpGrocerySheet() {
  document.getElementById('mppGroceryOverlay').classList.remove('mpp-open');
}

function renderMpGroceryList() {
  const weekDates = getWeekDates(mpWeekStart || todayStr());
  const fmt = d => { const dt = dateObj(d); return `${dt.getDate()} ${MONTH_NAMES[dt.getMonth()].slice(0,3)}`; };
  const wl  = document.getElementById('mppGroceryWeekLabel');
  if (wl) wl.textContent = `${fmt(weekDates[0])} – ${fmt(weekDates[6])}`;
  const listEl = document.getElementById('mppGroceryList');
  if (!listEl) return;
  const items = buildMpGroceryList();
  if (!items.length) {
    listEl.innerHTML = '<div class="mpp-grocery-empty">✅ All ingredients at home, or no meals planned yet.</div>';
    return;
  }
  const groups = {};
  items.forEach(item => { const c = item.category || 'General'; if (!groups[c]) groups[c] = []; groups[c].push(item); });
  listEl.innerHTML = Object.entries(groups).map(([cat, its]) => `
    <div class="mpp-grocery-group">
      <div class="mpp-grocery-cat">${escapeHtml(cat)}</div>
      ${its.map(item => `
        <div class="mpp-grocery-row">
          <span class="mpp-grocery-bullet">•</span>
          <span class="mpp-grocery-name">${escapeHtml(item.name)}</span>
          ${item.qty ? `<span class="mpp-grocery-qty">${escapeHtml(item.qty)}${item.unit ? ' ' + escapeHtml(item.unit) : ''}</span>` : ''}
        </div>`).join('')}
    </div>`).join('');
}

/* ── ORDER SHEET ─────────────────────────────────────────── */
const MP_PROVIDERS = [
  { name: 'Instamart',   emoji: '🟠', url: 'https://www.swiggy.com/instamart' },
  { name: 'Zepto',       emoji: '🟣', url: 'https://zeptonow.com/' },
  { name: 'Blinkit',     emoji: '🟡', url: 'https://blinkit.com/' },
  { name: 'BigBasket',   emoji: '🟢', url: 'https://www.bigbasket.com/' },
  { name: 'Amazon Fresh',emoji: '🔵', url: 'https://www.amazon.in/alm/storefront' },
  { name: 'Amazon',      emoji: '🛒', url: 'https://www.amazon.in/s?k=groceries' },
];

function openMpOrderSheet() {
  const list = document.getElementById('mppProviderList');
  if (list) {
    list.innerHTML = MP_PROVIDERS.map(p => `
      <button class="mpp-provider-btn" data-url="${p.url}">
        <span class="mpp-prov-emoji">${p.emoji}</span>
        <span class="mpp-prov-name">${p.name}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
      </button>`).join('');
    list.querySelectorAll('.mpp-provider-btn').forEach(btn =>
      btn.addEventListener('click', () => { window.open(btn.dataset.url, '_blank', 'noopener'); closeMpOrderSheet(); }));
  }
  document.getElementById('mppOrderOverlay').classList.add('mpp-open');
}

function closeMpOrderSheet() {
  document.getElementById('mppOrderOverlay').classList.remove('mpp-open');
}

function copyMpGroceryList() {
  const items = buildMpGroceryList();
  if (!items.length) { showToast('⚠️ Grocery list is empty'); return; }
  const text = items.map(i => `${i.name}${i.qty ? ': ' + i.qty + (i.unit ? ' ' + i.unit : '') : ''}`).join('\n');
  navigator.clipboard?.writeText(text).then(() => showToast('📋 Copied!')).catch(() => showToast('⚠️ Could not copy'));
}

/* ── MEAL MODAL (add / edit meal) ────────────────────────── */
function openRecipeModal(recipe) {
  currentEditRecipeId = recipe?.id || null;
  mpRecipeServings    = recipe?.defaultServings || 2;
  document.getElementById('recipeModalTitle').textContent = recipe ? 'Edit Meal' : 'Add Meal';
  document.getElementById('recipeName').value    = recipe?.name     || '';
  document.getElementById('recipeCuisine').value = recipe?.cuisine  || '';
  document.getElementById('recipePrepTime').value= recipe?.prepTime || '';
  document.getElementById('recipeServVal').textContent = mpRecipeServings;
  const rows = document.getElementById('recipeIngredientRows');
  rows.innerHTML = '';
  (recipe?.ingredients || [{ name: '', qty: '', unit: '', category: '' }]).forEach(ing => addIngredientRow(ing));
  document.getElementById('recipeModal').style.display = 'flex';
  setTimeout(() => document.getElementById('recipeName').focus(), 50);
}

function addIngredientRow(ing = { name: '', qty: '', unit: '', category: '' }) {
  const rows = document.getElementById('recipeIngredientRows');
  const div  = document.createElement('div');
  div.className = 'ing-row-edit';
  div.innerHTML = `
    <input type="text"   class="ing-input ing-name-input"     placeholder="Ingredient"  value="${escapeHtml(ing.name)}"            maxlength="60">
    <input type="text"   class="ing-input ing-qty-input"      placeholder="Qty"         value="${escapeHtml(ing.qty  || '')}"       style="width:52px">
    <input type="text"   class="ing-input ing-unit-input"     placeholder="Unit"        value="${escapeHtml(ing.unit || '')}"       style="width:60px">
    <input type="text"   class="ing-input ing-cat-input"      placeholder="Category"    value="${escapeHtml(ing.category || '')}"   style="width:90px">
    <button class="ing-remove-btn" title="Remove">✕</button>`;
  div.querySelector('.ing-remove-btn').addEventListener('click', () => div.remove());
  rows.appendChild(div);
}

async function saveRecipeModal() {
  const name = document.getElementById('recipeName').value.trim();
  if (!name) { showToast('⚠️ Meal name required'); return; }
  const cuisine    = document.getElementById('recipeCuisine').value.trim();
  const prepTime   = parseInt(document.getElementById('recipePrepTime').value) || null;
  const defServings = mpRecipeServings;
  const ingredients = [...document.getElementById('recipeIngredientRows').querySelectorAll('.ing-row-edit')]
    .map(row => ({
      name:     row.querySelector('.ing-name-input').value.trim(),
      qty:      row.querySelector('.ing-qty-input').value.trim(),
      unit:     row.querySelector('.ing-unit-input').value.trim(),
      category: row.querySelector('.ing-cat-input').value.trim() || 'General',
    }))
    .filter(ing => ing.name);
  const recipe = { name, cuisine, prepTime, defaultServings: defServings, ingredients };
  if (currentEditRecipeId) recipe.id = currentEditRecipeId;
  const savedId = await saveRecipeToFirestore(recipe);
  if (currentEditRecipeId) {
    const idx = userRecipes.findIndex(r => r.id === currentEditRecipeId);
    if (idx >= 0) userRecipes[idx] = { ...recipe, id: currentEditRecipeId };
  } else {
    userRecipes.push({ ...recipe, id: savedId });
    userRecipes.sort((a, b) => a.name.localeCompare(b.name));
  }
  document.getElementById('recipeModal').style.display = 'none';
  showToast(`✅ "${name}" saved`);
}

function renderMealPlanner() { renderMealPlannerV2(); }

/* ── DAILY TRACKER RENDER ───────────────────────────────── */
function renderDailyTracker() {
  const label = document.getElementById('trackerDateLabel');
  if (label) label.textContent = formatDateFull(currentDate);

  renderPriorities();
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
    return `<div class="tracker-slot${isCurrent ? ' current-slot' : ''}${val ? ' has-value' : ''}" data-key="${key}">
      <span class="slot-time">${disp}</span>
      <div class="slot-body">
        <div class="slot-display">${escapeHtml(val)}</div>
        <textarea class="slot-input" rows="1" data-slot="${key}"
          placeholder="${isCurrent ? 'What are you doing now?' : ''}">${val}</textarea>
      </div>
      <button class="slot-edit-btn" title="Edit entry" data-slot="${key}">✏️</button>
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
      const slot = ta.closest('.tracker-slot');
      const val  = ta.value.trim();
      if (val) {
        slot.querySelector('.slot-display').textContent = val;
        slot.classList.add('has-value');
        slot.classList.remove('editing');
        parseTrackerEntry(val, currentDate);
        renderPendingHabits();
      } else {
        slot.classList.remove('has-value', 'editing');
      }
    });
  });

  container.querySelectorAll('.slot-edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const slot = btn.closest('.tracker-slot');
      slot.classList.add('editing');
      slot.querySelector('.slot-input').focus();
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

function escapeHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
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
    guru_pooja:          /guru pooja|guru-pooja/,
    upa_yoga:            /upa yoga|upa-yoga/,
    yoga_namaskar:       /yoga namaskar|yoga-namaskar/,
    surya_kriya:         /surya kriya|surya-kriya/,
    asanas:              /\basanas?\b/,
    sck_morning:         /sck morning|morning sck|shakti chalana.*morning|morning.*shakti chalana/,
    shambhavi_morning:   /shambhavi.*morning|morning.*shambhavi/,
    shoonya_mid:         /shoonya.*mid|mid.*shoonya/,
    miracle_of_mind:     /miracle of mind/,
    devi_stuti:          /devi stuti/,
    achala_arpanam:      /achala arpanam/,
    infinity_meditation: /infinity meditation/,
    sukha_kriya:         /sukha kriya/,
    aum_chanting:        /aum chanting|\baum\b/,
    nadi_shuddhi:        /nadi shuddhi/,
    shoonya_evening:     /shoonya.*evening|evening.*shoonya/,
    sck_evening:         /sck evening|evening sck|shakti chalana.*evening|evening.*shakti chalana/,
    shambhavi_evening:   /shambhavi.*evening|evening.*shambhavi/,
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
  DEFAULT_SADHANA_PRACTICES.forEach(p => {
    if (!s[p.id]) items.push({ label: `${p.icon} ${p.name}`, tab: 'sadhana' });
  });
  if (!r.did_read) items.push({ label: '📚 Reading', tab: 'reading' });

  // Custom health habits
  userHealthHabits.filter(hb => hb.type === 'custom').forEach(hb => {
    if (!(h.customHabits?.[hb.id]?.done)) {
      items.push({ label: `${hb.icon} ${hb.name}`, tab: 'health' });
    }
  });

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
      const newVal = (ta.value ? ta.value + ' ' : '') + transcript;
      ta.value = newVal;
      autoResizeTextarea(ta);
      saveTrackerSlot(slotKey, newVal);
      parseTrackerEntry(newVal, currentDate);
      // Update display in case parseTrackerEntry didn't trigger a full re-render
      const slotEl = document.querySelector(`.tracker-slot[data-key="${slotKey}"]`);
      if (slotEl) {
        const dispEl = slotEl.querySelector('.slot-display');
        if (dispEl) dispEl.textContent = newVal;
        slotEl.classList.add('has-value');
        slotEl.classList.remove('editing');
      }
      renderPendingHabits();
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

/* ── TOP 3 PRIORITIES ───────────────────────────────────── */
function renderPriorities() {
  const p = getDayData(currentDate).priorities || ['', '', ''];
  document.querySelectorAll('.priority-input').forEach(inp => {
    // Only update if not focused (avoid clobbering active typing)
    if (document.activeElement !== inp) {
      inp.value = p[parseInt(inp.dataset.idx)] || '';
    }
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
  for (let i = 89; i >= 0; i--) {
    const d = offsetDate(today, -i);
    const done = checker(d);
    bars.push(`<div class="trend-bar${done ? ' done' : ''}" style="${done ? `background:${color}` : ''}" title="${d}"></div>`);
  }
  el.innerHTML = bars.join('');
}

function renderTrends() {

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
    return DEFAULT_SADHANA_PRACTICES.filter(p => s[p.id]).length / DEFAULT_SADHANA_PRACTICES.length;
  }, 'var(--sadhana)');
  DEFAULT_SADHANA_PRACTICES.forEach(p =>
    renderTrendBars(`bars-${p.id}`, d => !!(data[d]?.sadhana?.[p.id]), 'var(--sadhana)')
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
  renderPriorities();
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
  const sidebar = document.getElementById('appSidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const isOpen  = sidebar.classList.contains('sidebar-open');
  sidebar.classList.toggle('sidebar-open', !isOpen);
  overlay.classList.toggle('sidebar-open', !isOpen);
}

function closeSidebar() {
  const sidebar = document.getElementById('appSidebar');
  const overlay = document.getElementById('sidebarOverlay');
  sidebar.classList.remove('sidebar-open');
  overlay.classList.remove('sidebar-open');
}

/* ── EVENT HANDLERS — HEALTH ────────────────────────────── */
function initHealthEvents() {
  ['sleepTime','wakeTime','greyscaleOn'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('change', () => {
      getDayData(currentDate).health[el.dataset.field] = el.value;
      saveData(); updateComputed(); renderBadges(); renderWeekStrip(); renderPendingHabits();
    });
  });

  ['stepsInput','heartInput'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => {
      getDayData(currentDate).health[el.dataset.field] = el.value ? parseInt(el.value) : '';
      saveData(); updateComputed(); renderBadges(); renderWeekStrip(); renderPendingHabits();
    });
  });

  document.querySelectorAll('.num-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = document.getElementById(btn.dataset.target);
      if (!target) return;
      const val = Math.max(0, (parseInt(target.value) || 0) + parseInt(btn.dataset.delta));
      target.value = val;
      getDayData(currentDate).health[target.dataset.field] = val;
      saveData(); updateComputed(); renderBadges(); renderWeekStrip(); renderPendingHabits();
    });
  });

  document.querySelectorAll('.card-health [data-field]').forEach(el => {
    if (el.tagName === 'SELECT' || (el.tagName === 'INPUT' && el.type === 'text')) {
      el.addEventListener('change', () => {
        getDayData(currentDate).health[el.dataset.field] = el.value;
        saveData(); renderBadges(); renderWeekStrip(); renderPendingHabits();
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
      saveData(); updateSadhanaBanner(); renderBadges(); renderWeekStrip(); renderPendingHabits();
    });
  });
  document.querySelectorAll('.sadhana-extra').forEach(el => {
    el.addEventListener('input', () => {
      getDayData(currentDate).sadhana[el.dataset.extra] = parseInt(el.value) || 0;
      saveData();
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
  const row = { 'Date': dateStr, 'Day': DAY_NAMES[dateObj(dateStr).getDay()] };
  DEFAULT_SADHANA_PRACTICES.forEach(p => {
    row[p.name] = s[p.id] ? 'Yes' : 'No';
    (p.extra || []).forEach(e => { if (s[e.id]) row[`${p.name} — ${e.label}`] = s[e.id]; });
  });
  row['Total Done'] = DEFAULT_SADHANA_PRACTICES.filter(p => s[p.id]).length;
  return row;
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
  await loadHealthHabits();
  await loadRecipes();
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
      await loadHealthHabits();
      await loadRecipes();
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
  /* Sidebar nav switching — close drawer on mobile after tap */
  document.getElementById('sidebarNav').addEventListener('click', e => {
    const item = e.target.closest('[data-tab]');
    if (item) { switchTab(item.dataset.tab); closeSidebar(); }
  });
  /* Export in sidebar footer also triggers tab switch */
  document.querySelector('.sidebar-footer .nav-item[data-tab="export"]')
    ?.addEventListener('click', () => switchTab('export'));

  /* Hamburger — collapses sidebar on mobile; overlay restores it */
  document.getElementById('sidebarToggle').addEventListener('click', toggleSidebar);
  document.getElementById('sidebarOverlay').addEventListener('click', closeSidebar);

  /* Planner — collapsible sections */
  document.querySelectorAll('.ps-header').forEach(hdr => {
    hdr.addEventListener('click', () => {
      const section = document.getElementById(hdr.dataset.section);
      if (section) section.classList.toggle('collapsed');
    });
  });

  /* Meal planner v2 — week navigation */
  mpWeekStart = getWeekDates(todayStr())[0];
  document.getElementById('mppPrevWeek').addEventListener('click', () => {
    mpWeekStart = offsetDate(mpWeekStart, -7);
    renderMealPlannerV2();
  });
  document.getElementById('mppNextWeek').addEventListener('click', () => {
    const todayMon = getWeekDates(todayStr())[0];
    if (mpWeekStart < todayMon) { mpWeekStart = offsetDate(mpWeekStart, 7); renderMealPlannerV2(); }
  });

  /* Meal planner v2 — servings */
  document.getElementById('mppServingsDown').addEventListener('click', () => {
    if (mpDefaultServings > 1) { mpDefaultServings--; document.getElementById('mppServingsVal').textContent = mpDefaultServings; }
  });
  document.getElementById('mppServingsUp').addEventListener('click', () => {
    if (mpDefaultServings < 20) { mpDefaultServings++; document.getElementById('mppServingsVal').textContent = mpDefaultServings; }
  });

  /* Meal planner v2 — grocery sheet */
  document.getElementById('mppGroceryBtn').addEventListener('click', openMpGrocerySheet);
  document.getElementById('mppGroceryClose').addEventListener('click', closeMpGrocerySheet);
  document.getElementById('mppGroceryOverlay').addEventListener('click', e => { if (e.target.id === 'mppGroceryOverlay') closeMpGrocerySheet(); });

  /* Meal planner v2 — order sheet */
  document.getElementById('mppOrderBtn').addEventListener('click', openMpOrderSheet);
  document.getElementById('mppOrderClose').addEventListener('click', closeMpOrderSheet);
  document.getElementById('mppOrderOverlay').addEventListener('click', e => { if (e.target.id === 'mppOrderOverlay') closeMpOrderSheet(); });
  document.getElementById('mppCopyListBtn').addEventListener('click', copyMpGroceryList);

  /* Meal planner v2 — picker sheet */
  document.getElementById('mppPickerClose').addEventListener('click', closeMpPicker);
  document.getElementById('mppPickerOverlay').addEventListener('click', e => { if (e.target.id === 'mppPickerOverlay') closeMpPicker(); });
  document.getElementById('mppPickerSearch').addEventListener('input', e => { mpPickerQuery = e.target.value; renderMpPickerList(); });
  document.getElementById('mppAddMealFromPicker').addEventListener('click', () => { closeMpPicker(); openRecipeModal(null); });

  /* Meal planner v2 — ingredient sheet */
  document.getElementById('mppIngClose').addEventListener('click', closeMpIngSheet);
  document.getElementById('mppIngOverlay').addEventListener('click', e => { if (e.target.id === 'mppIngOverlay') closeMpIngSheet(); });
  document.getElementById('mppIngServDown').addEventListener('click', () => {
    if (!mpActiveIngSlot) return;
    const slot = getMpSlot(mpActiveIngSlot.date, mpActiveIngSlot.mealType);
    const cur = slot.servingsOverride ?? mpDefaultServings;
    if (cur > 1) { slot.servingsOverride = cur - 1; rescaleMpIngredients(mpActiveIngSlot.date, mpActiveIngSlot.mealType); document.getElementById('mppIngServVal').textContent = slot.servingsOverride; renderMpIngList(); saveData(); }
  });
  document.getElementById('mppIngServUp').addEventListener('click', () => {
    if (!mpActiveIngSlot) return;
    const slot = getMpSlot(mpActiveIngSlot.date, mpActiveIngSlot.mealType);
    const cur = slot.servingsOverride ?? mpDefaultServings;
    if (cur < 20) { slot.servingsOverride = cur + 1; rescaleMpIngredients(mpActiveIngSlot.date, mpActiveIngSlot.mealType); document.getElementById('mppIngServVal').textContent = slot.servingsOverride; renderMpIngList(); saveData(); }
  });

  /* Meal planner v2 — manage meals */
  document.getElementById('mppManageMealsBtn').addEventListener('click', () => openRecipeModal(null));

  /* Meal modal */
  document.getElementById('addIngredientRowBtn').addEventListener('click', () => addIngredientRow());
  document.getElementById('recipeSaveBtn').addEventListener('click', saveRecipeModal);
  document.getElementById('recipeCancelBtn').addEventListener('click', () => { document.getElementById('recipeModal').style.display = 'none'; });
  document.getElementById('recipeModal').addEventListener('click', e => { if (e.target.id === 'recipeModal') document.getElementById('recipeModal').style.display = 'none'; });

  /* Meal modal — servings stepper */
  document.getElementById('recipeServDown').addEventListener('click', () => {
    if (mpRecipeServings > 1) { mpRecipeServings--; document.getElementById('recipeServVal').textContent = mpRecipeServings; }
  });
  document.getElementById('recipeServUp').addEventListener('click', () => {
    if (mpRecipeServings < 20) { mpRecipeServings++; document.getElementById('recipeServVal').textContent = mpRecipeServings; }
  });

  /* Reading Habits events */
  const didRead = document.getElementById('didRead');
  if (didRead) {
    didRead.addEventListener('change', () => {
      getDayData(currentDate).reading.did_read = didRead.checked;
      saveData(); renderBadges(); renderWeekStrip(); renderPendingHabits();
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

  /* Top 3 priorities — shared inputs across tracker and planner cards */
  document.querySelectorAll('.priority-input').forEach(inp => {
    inp.addEventListener('input', () => {
      const d = getDayData(currentDate);
      if (!d.priorities) d.priorities = ['', '', ''];
      const idx = parseInt(inp.dataset.idx);
      d.priorities[idx] = inp.value;
      saveData();
      // Sync the same index in the other priorities card
      document.querySelectorAll(`.priority-input[data-idx="${idx}"]`).forEach(other => {
        if (other !== inp) other.value = inp.value;
      });
    });
  });

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



  /* Date navigation */
  document.getElementById('prevDay').addEventListener('click', () =>
    navigateTo(offsetDate(currentDate, -1))
  );
  document.getElementById('nextDay').addEventListener('click', () => {
    if (currentDate < todayStr()) navigateTo(offsetDate(currentDate, 1));
  });

  /* Sadhana UI & events */
  renderSadhanaUI();
  initHealthContainerEvents();
  initSadhanaEvents();

  /* Export */
  document.getElementById('exportCSV').addEventListener('click',  () => doExport('csv'));
  document.getElementById('exportXLSX').addEventListener('click', () => doExport('xlsx'));
  document.querySelectorAll('.range-btn').forEach(btn =>
    btn.addEventListener('click', () => setQuickRange(btn.dataset.range))
  );
  setQuickRange(7);


  /* Health habit modal */
  document.getElementById('addHealthHabitBtn').addEventListener('click', () => openHealthHabitModal(null));
  document.getElementById('hhSave').addEventListener('click', saveHealthHabitModal);
  document.getElementById('hhCancel').addEventListener('click', () => {
    document.getElementById('healthHabitModal').style.display = 'none';
  });
  document.getElementById('healthHabitModal').addEventListener('click', e => {
    if (e.target.id === 'healthHabitModal') document.getElementById('healthHabitModal').style.display = 'none';
  });

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
