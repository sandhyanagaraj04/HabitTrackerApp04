/* ═══════════════════════════════════════════════════════════
   SADHANA SUPPORT — Core JS (auth + data + practices)
   ═══════════════════════════════════════════════════════════ */

/* ── PRACTICES LIST ─────────────────────────────────────── */
const PRACTICES = [
  { id: 'guru_pooja',          name: 'Guru Pooja',                      icon: '🪔', desc: 'An invitation to the Divine' },
  { id: 'upa_yoga',            name: 'Upa Yoga',                        icon: '🌀', desc: '', section: 'other' },
  { id: 'yoga_namaskar',       name: 'Yoga Namaskar',                   icon: '🧘', desc: '', section: 'other', extra: [{ id: 'yoga_namaskar_cycles', label: 'Cycles' }] },
  { id: 'surya_kriya',         name: 'Surya Kriya',                     icon: '☀️', desc: '', extra: [{ id: 'surya_kriya_cycles', label: 'Cycles' }, { id: 'surya_kriya_mins', label: 'Total mins' }] },
  { id: 'angamardana',         name: 'Angamardana',                     icon: '💪', desc: '', extra: [{ id: 'angamardana_cycles', label: 'Cycles' }] },
  { id: 'asanas',              name: 'Asanas',                          icon: '🤸', desc: '' },
  { id: 'sck_morning',         name: 'Shakti Chalana Kriya (Morning)',  icon: '⚡', desc: '', extra: [{ id: 'sck_morning_kapalabhatis', label: 'KPs / cycle' }] },
  { id: 'shambhavi_morning',   name: 'Shambhavi (Morning)',             icon: '🌅', desc: '' },
  { id: 'breath_watching',     name: 'Breath Watching',                 icon: '🫁', desc: '', extra: [{ id: 'breath_watching_mins', label: 'Minutes' }] },
  { id: 'samyama',             name: 'Samyama',                         icon: '🔮', desc: '', extra: [{ id: 'samyama_mins', label: 'Minutes' }] },
  { id: 'aum_namah_shivaya',   name: 'Aum Namah Shivaya Chanting',     icon: '🕉️', desc: '', extra: [{ id: 'aum_namah_shivaya_mins', label: 'Minutes' }] },
  { id: 'shoonya_mid',         name: 'Shoonya (Mid Morning)',           icon: '🌌', desc: '' },
  { id: 'miracle_of_mind',     name: 'Miracle of Mind',                 icon: '🧠', desc: '', extra: [{ id: 'miracle_of_mind_mins', label: 'Minutes' }] },
  { id: 'devi_stuti',          name: 'Devi Stuti',                      icon: '🌸', desc: '', section: 'other', extra: [{ id: 'devi_stuti_cycles', label: 'Cycles' }] },
  { id: 'achala_arpanam',      name: 'Achala Arpanam',                  icon: '🏔️', desc: '', section: 'other', extra: [{ id: 'achala_arpanam_mins', label: 'Minutes' }] },
  { id: 'infinity_meditation', name: 'Infinity Meditation',             icon: '♾️', desc: '', section: 'other' },
  { id: 'sukha_kriya',         name: 'Sukha Kriya',                     icon: '😌', desc: '', section: 'other', extra: [{ id: 'sukha_kriya_mins', label: 'Minutes' }] },
  { id: 'aum_chanting',        name: 'Aum Chanting',                    icon: '🔔', desc: '', section: 'other', extra: [{ id: 'aum_chanting_mins', label: 'Minutes' }, { id: 'aum_chanting_times', label: 'Times' }] },
  { id: 'nadi_shuddhi',        name: 'Nadi Shuddhi',                    icon: '🌬️', desc: '', section: 'other', extra: [{ id: 'nadi_shuddhi_mins', label: 'Minutes' }] },
  { id: 'bhuta_shuddhi',       name: 'Bhuta Shuddhi',                   icon: '🔥', desc: '' },
  { id: 'shoonya_evening',     name: 'Shoonya (Evening)',               icon: '🌙', desc: '' },
  { id: 'presence_time',       name: 'Presence Time',                   icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" style="vertical-align:middle"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.5"/><line x1="12" y1="2.5" x2="12" y2="4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="21.5" y1="12" x2="19.5" y2="12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="12" y1="21.5" x2="12" y2="19.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="2.5" y1="12" x2="4.5" y2="12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="12" y1="12" x2="11" y2="17.4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="12" y1="12" x2="18.5" y2="15.8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/></svg>', desc: '' },
  { id: 'iecc',                name: 'Inner Engineering Crash Course',  icon: '🌟', desc: '', textField: { id: 'iecc_notes', placeholder: 'Rule applied:\nScenario:' } },
  { id: 'sck_evening',         name: 'Shakti Chalana Kriya (Evening)',  icon: '⚡', desc: '', section: 'other', extra: [{ id: 'sck_evening_kapalabhatis', label: 'KPs / cycle' }] },
  { id: 'shambhavi_evening',   name: 'Shambhavi (Evening)',             icon: '🌅', desc: '', section: 'other' },
];

/* ── STATE ───────────────────────────────────────────────── */
let currentUser      = null;
let currentDate      = todayStr();
let data             = {};   // { [dateStr]: { sadhana: { [id]: bool } } }
let saveTimer        = null;
let streakPeriod     = 7;
let streakPracticeId = 'shambhavi_morning';

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

/* ── CENTRE OPTIONS ──────────────────────────────────────── */
const CENTRE_OPTIONS = {
  'KA - Bengaluru': [
    'Banaswadi', 'Bannerghatta Road', 'Budigere cross', 'Electronic City',
    'Hebbal', 'Indiranagar', 'Malleshwaram', 'Jayanagar', 'Girinagar',
    'Koramangala/HSR layout', 'Marathahalli', 'Whitefield', 'Vijayanagar', 'Yelahanka',
  ],
  'KA - Outside Bengaluru': [
    'Mysuru', 'Mandya', 'Mangaluru', 'Udupi', 'Chikkaballapura', 'Doddaballapura',
    'Kolar', 'Tumkur', 'Chikkamagalur', 'Hassan', 'Belagavi', 'Hubli Dharwad',
    'Kalaburgi', 'Bidar', 'Vijayapura', 'Others',
  ],
};

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
  const s = Object.fromEntries(PRACTICES.map(p => [p.id, false]));
  PRACTICES.forEach(p => {
    (p.extra || []).forEach(e => { s[e.id] = 0; });
    if (p.textField) s[p.textField.id] = '';
    s[`${p.id}_na`] = false;
  });
  s.benefits_seen = '';
  return s;
}

function getDayData(dateStr) {
  if (!data[dateStr])                data[dateStr] = { sadhana: defaultSadhana() };
  if (!data[dateStr].sadhana)        data[dateStr].sadhana = defaultSadhana();
  return data[dateStr];
}

function lsKey() { return `sadhana_data_${currentUser?.uid}`; }

function saveToLocalStorage() {
  try { localStorage.setItem(lsKey(), JSON.stringify(data)); } catch(e) {}
}

function loadFromLocalStorage() {
  try {
    const raw = localStorage.getItem(lsKey());
    if (raw) Object.assign(data, JSON.parse(raw));
  } catch(e) {}
}

async function loadAllData() {
  if (!currentUser) return;
  loadFromLocalStorage();          // instant — paint from cache first
  try {
    const snap = await db.collection('users').doc(currentUser.uid)
      .collection('days').get();
    snap.forEach(doc => {
      data[doc.id] = doc.data();
      if (!data[doc.id].sadhana) data[doc.id].sadhana = defaultSadhana();
    });
    saveToLocalStorage();          // keep cache in sync with Firestore
  } catch (e) { console.error('Load error:', e); }
}

function saveData() {
  if (!currentUser) return;
  saveToLocalStorage();            // immediate local write
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
function practiceItemHTML(p) {
  const actions = `
    <div class="practice-actions">
      <label class="toggle">
        <input type="checkbox" class="practice-check" data-field="${p.id}">
        <span class="toggle-slider"></span>
      </label>
      <label class="na-label" title="Not applicable today">
        <input type="checkbox" class="na-check" data-field="${p.id}">
        <span class="na-text">N/A</span>
      </label>
    </div>`;
  const info = `
    <div class="practice-info">
      <span class="practice-icon">${p.icon}</span>
      <div>
        <div class="practice-name">${p.name}</div>
        ${p.desc ? `<div class="practice-desc">${p.desc}</div>` : ''}
        ${(p.extra || []).map(e => `<div class="practice-extra">
          <input type="number" class="practice-num practice-extra-inp" data-extra="${e.id}" placeholder="0" min="0">
          <span class="practice-extra-label">${e.label}</span>
        </div>`).join('')}
      </div>
    </div>`;
  if (p.textField) {
    return `
      <div class="practice-item practice-item-tall" data-practice="${p.id}">
        <div class="practice-row">${info}${actions}</div>
        <textarea class="practice-textarea practice-text-inp" data-text="${p.textField.id}"
          placeholder="${p.textField.placeholder}" rows="4"></textarea>
      </div>`;
  }
  return `<div class="practice-item" data-practice="${p.id}">${info}${actions}</div>`;
}

function renderPracticeList() {
  const list = document.getElementById('practiceList');
  if (!list) return;
  const main  = PRACTICES.filter(p => p.section !== 'other');
  const other = PRACTICES.filter(p => p.section === 'other');
  list.innerHTML =
    main.map(practiceItemHTML).join('') +
    `<div class="benefits-wrap">
       <div class="benefits-label-row">
         <label class="benefits-label" for="benefitsSeen">Benefits experienced so far</label>
         <button class="mic-btn" id="micBtn" title="Speak to fill" type="button">
           <svg class="mic-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
             <rect x="9" y="2" width="6" height="12" rx="3"/>
             <path d="M5 10a7 7 0 0 0 14 0"/>
             <line x1="12" y1="17" x2="12" y2="21"/>
             <line x1="8" y1="21" x2="16" y2="21"/>
           </svg>
           <span class="mic-label">Speak</span>
         </button>
       </div>
       <textarea class="practice-textarea benefits-inp" id="benefitsSeen" placeholder="Share what you've noticed…" rows="3"></textarea>
     </div>` +
    `<div class="other-section-header">Other Practices</div>` +
    other.map(practiceItemHTML).join('');

  /* Attach events */
  list.querySelectorAll('.na-check').forEach(el => {
    el.addEventListener('change', () => {
      const key = `${el.dataset.field}_na`;
      getDayData(currentDate).sadhana[key] = el.checked;
      el.closest('.practice-item').classList.toggle('practice-na', el.checked);
      saveData(); updateRing(); updateBanner();
    });
  });
  list.querySelectorAll('.practice-check').forEach(el => {
    el.addEventListener('change', () => {
      getDayData(currentDate).sadhana[el.dataset.field] = el.checked;
      saveData(); updateRing(); updateBanner(); renderTrends();
    });
  });
  list.querySelectorAll('.practice-extra-inp').forEach(el => {
    el.addEventListener('input', () => {
      const val = parseInt(el.value) || 0;
      getDayData(currentDate).sadhana[el.dataset.extra] = val;
      if (val > 0) {
        const practiceItem = el.closest('.practice-item');
        const toggle = practiceItem?.querySelector('.practice-check');
        if (toggle && !toggle.checked) {
          toggle.checked = true;
          getDayData(currentDate).sadhana[toggle.dataset.field] = true;
          updateRing(); updateBanner(); renderTrends();
        }
      }
      saveData();
    });
  });
  list.querySelectorAll('.practice-text-inp').forEach(el => {
    el.addEventListener('input', () => {
      getDayData(currentDate).sadhana[el.dataset.text] = el.value;
      saveData();
    });
  });
  document.getElementById('benefitsSeen').addEventListener('input', function() {
    getDayData(currentDate).sadhana.benefits_seen = this.value;
    saveData();
  });

  /* Speech-to-text for benefits */
  const micBtn = document.getElementById('micBtn');
  const benArea = document.getElementById('benefitsSeen');
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    micBtn.style.display = 'none';
  } else {
    let recognition = null;
    let recording = false;

    micBtn.addEventListener('click', () => {
      if (recording) {
        recognition.stop();
        return;
      }
      recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = true;
      recognition.continuous = false;

      const baseText = benArea.value;

      recognition.onstart = () => {
        recording = true;
        micBtn.classList.add('mic-active');
        micBtn.querySelector('.mic-label').textContent = 'Stop';
      };

      recognition.onresult = (e) => {
        const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
        benArea.value = baseText + (baseText && !baseText.endsWith(' ') ? ' ' : '') + transcript;
        getDayData(currentDate).sadhana.benefits_seen = benArea.value;
        saveData();
      };

      recognition.onend = () => {
        recording = false;
        micBtn.classList.remove('mic-active');
        micBtn.querySelector('.mic-label').textContent = 'Speak';
        recognition = null;
      };

      recognition.onerror = () => {
        recording = false;
        micBtn.classList.remove('mic-active');
        micBtn.querySelector('.mic-label').textContent = 'Speak';
        recognition = null;
      };

      recognition.start();
    });
  }
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
  document.querySelectorAll('.practice-text-inp').forEach(el => {
    el.value = s[el.dataset.text] || '';
  });
  const ben = document.getElementById('benefitsSeen');
  if (ben) ben.value = s.benefits_seen || '';
  document.querySelectorAll('.na-check').forEach(el => {
    const na = s[`${el.dataset.field}_na`] || false;
    el.checked = na;
    el.closest('.practice-item').classList.toggle('practice-na', na);
  });
  updateRing();
  updateBanner();
}

function updateRing() {
  const s       = getDayData(currentDate).sadhana;
  const active  = PRACTICES.filter(p => p.section !== 'other' && !s[`${p.id}_na`]);
  const done    = active.filter(p => s[p.id]).length;
  const pct     = active.length ? Math.round(done / active.length * 100) : 0;
  const ring = document.getElementById('sadhanaRing');
  const pctEl = document.getElementById('sadhanaPct');
  if (ring)  ring.setAttribute('stroke-dasharray', `${pct} 100`);
  if (pctEl) pctEl.textContent = `${pct}%`;
}

function updateBanner() {
  const s      = getDayData(currentDate).sadhana;
  const active = PRACTICES.filter(p => p.section !== 'other' && !s[`${p.id}_na`]);
  const all    = active.length > 0 && active.every(p => s[p.id]);
  document.getElementById('completionBanner').style.display = all ? 'block' : 'none';
}

/* ── STREAK HELPERS ──────────────────────────────────────── */
function calcStreak(practiceId, numDays) {
  const today = todayStr();
  const results = Array.from({ length: numDays }, (_, i) => {
    const d = offsetDate(today, -(numDays - 1 - i));
    const s = data[d]?.sadhana || {};
    return { date: d, done: !!s[practiceId], na: !!s[`${practiceId}_na`] };
  });

  let currentStreak = 0;
  for (let i = results.length - 1; i >= 0; i--) {
    if (results[i].na) continue;
    if (results[i].done) currentStreak++;
    else break;
  }

  let bestStreak = 0, run = 0;
  for (const r of results) {
    if (r.na) continue;
    if (r.done) { run++; bestStreak = Math.max(bestStreak, run); }
    else run = 0;
  }

  const daysDone       = results.filter(r => !r.na && r.done).length;
  const daysApplicable = results.filter(r => !r.na).length;
  return { currentStreak, bestStreak, daysDone, daysApplicable, results };
}

function renderStreakDisplay() {
  const el = document.getElementById('streakDisplay');
  if (!el) return;
  const practice = PRACTICES.find(p => p.id === streakPracticeId) || PRACTICES[0];
  const { currentStreak, bestStreak, daysDone, daysApplicable, results } = calcStreak(practice.id, streakPeriod);
  const pct = daysApplicable > 0 ? Math.round(daysDone / daysApplicable * 100) : 0;

  const dots = results.map(r => {
    const dt = new Date(r.date + 'T00:00:00');
    const label = dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    if (r.na)   return `<div class="streak-dot na"     title="${label}: N/A"></div>`;
    if (r.done) return `<div class="streak-dot done"   title="${label}: Done ✓"></div>`;
    return              `<div class="streak-dot missed" title="${label}: Not done"></div>`;
  }).join('');

  el.innerHTML = `
    <div class="streak-stats">
      <div class="streak-stat-card">
        <div class="streak-stat-value">${currentStreak}</div>
        <div class="streak-stat-label">Current streak</div>
        <div class="streak-stat-sub">days in a row</div>
      </div>
      <div class="streak-stat-card">
        <div class="streak-stat-value">${bestStreak}</div>
        <div class="streak-stat-label">Best in period</div>
        <div class="streak-stat-sub">days</div>
      </div>
      <div class="streak-stat-card">
        <div class="streak-stat-value">${pct}%</div>
        <div class="streak-stat-label">Completion</div>
        <div class="streak-stat-sub">${daysDone} of ${daysApplicable} days</div>
      </div>
    </div>
    <div class="streak-dots-wrap">${dots}</div>
    <div class="streak-legend">
      <span class="streak-legend-item"><span class="streak-legend-dot done"></span>Done</span>
      <span class="streak-legend-item"><span class="streak-legend-dot missed"></span>Missed</span>
      <span class="streak-legend-item"><span class="streak-legend-dot na"></span>N/A</span>
    </div>`;
}

/* ── RENDER — ANALYTICS ──────────────────────────────────── */
function renderAnalytics() {
  const el = document.getElementById('analyticsContent');
  if (!el) return;
  const today = todayStr();

  function daysRange(n, offset = 0) {
    return Array.from({ length: n }, (_, i) => offsetDate(today, -(i + offset)));
  }
  function fmtShort(d) {
    const dt = new Date(d + 'T00:00:00');
    return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }
  const labelToday = `(${fmtShort(today)})`;
  const labelWeek  = `(${fmtShort(offsetDate(today, -6))} – ${fmtShort(today)})`;
  const labelMonth = `(${fmtShort(offsetDate(today, -29))} – ${fmtShort(today)})`;
  function avg(vals) {
    const v = vals.filter(x => x > 0);
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
  }
  function fmt(n, unit = '') {
    return n > 0 ? `${Number.isInteger(n) ? n : n.toFixed(1)}${unit ? ' ' + unit : ''}` : '—';
  }
  function diffLabel(diff) {
    if (diff === null || diff === 0) return { txt: '—', cls: '' };
    const sign = diff > 0 ? '↑' : '↓';
    const abs  = Math.abs(Number.isInteger(diff) ? diff : parseFloat(diff.toFixed(1)));
    return { txt: `${sign} ${abs}`, cls: diff > 0 ? 'stat-up' : 'stat-down' };
  }

  /* ── Time-tracked practice minutes ── */
  function dayTotalMins(d) {
    const s = data[d]?.sadhana || {};
    return (parseInt(s.miracle_of_mind_mins) || 0) + (parseInt(s.surya_kriya_mins) || 0);
  }
  const totalToday = dayTotalMins(today);
  const avgWeekMins  = avg(daysRange(7).map(dayTotalMins));
  const avgMonthMins = avg(daysRange(30).map(dayTotalMins));

  /* ── Surya Kriya ── */
  function suryaPerCycle(d) {
    const s = data[d]?.sadhana || {};
    const c = parseInt(s.surya_kriya_cycles) || 0;
    const m = parseInt(s.surya_kriya_mins)   || 0;
    return c > 0 && m > 0 ? m / c : 0;
  }
  const suryaCyclesToday = parseInt(data[today]?.sadhana?.surya_kriya_cycles) || 0;
  const suryaAvgCyclesWeek = avg(daysRange(7).map(d => parseInt(data[d]?.sadhana?.surya_kriya_cycles) || 0));
  const suryaAvgCyclesMonth = avg(daysRange(30).map(d => parseInt(data[d]?.sadhana?.surya_kriya_cycles) || 0));
  const suryaTimeThis  = avg(daysRange(7).map(suryaPerCycle));
  const suryaTimePrev  = avg(daysRange(7, 7).map(suryaPerCycle));
  const suryaTimeDiff  = suryaTimeThis > 0 && suryaTimePrev > 0 ? suryaTimeThis - suryaTimePrev : null;

  /* ── SCK Kapalabhatis ── */
  function sckVal(d) { return parseInt(data[d]?.sadhana?.sck_morning_kapalabhatis) || 0; }
  const sckToday    = sckVal(today);
  const sckAvgThis  = avg(daysRange(7).map(sckVal));
  const sckAvgPrev  = avg(daysRange(7, 7).map(sckVal));
  const sckDiff     = sckAvgThis > 0 && sckAvgPrev > 0 ? sckAvgThis - sckAvgPrev : null;

  /* ── Miracle of Mind ── */
  function momVal(d) { return parseInt(data[d]?.sadhana?.miracle_of_mind_mins) || 0; }
  const momToday     = momVal(today);
  const momAvgWeek   = avg(daysRange(7).map(momVal));
  const momAvgMonth  = avg(daysRange(30).map(momVal));

  /* ── Devi Stuti ── */
  function deviVal(d) { return parseInt(data[d]?.sadhana?.devi_stuti_cycles) || 0; }
  const deviToday    = deviVal(today);
  const deviAvgWeek  = avg(daysRange(7).map(deviVal));
  const deviAvgMonth = avg(daysRange(30).map(deviVal));

  const suryaTimeDiffLbl = diffLabel(suryaTimeDiff !== null ? parseFloat(suryaTimeDiff.toFixed(1)) : null);
  const sckDiffLbl       = diffLabel(sckDiff !== null ? Math.round(sckDiff) : null);

  const practiceOptions = PRACTICES.map(p =>
    `<option value="${p.id}" ${p.id === streakPracticeId ? 'selected' : ''}>${p.name}</option>`
  ).join('');

  el.innerHTML = `
    <div class="analytics-section">
      <div class="streak-head">
        <div class="analytics-section-title">🔥 Practice Streak</div>
        <div class="streak-filters">
          <div class="streak-period-toggle">
            <button class="streak-period-btn ${streakPeriod === 7 ? 'active' : ''}" data-days="7">Last 7 days</button>
            <button class="streak-period-btn ${streakPeriod === 30 ? 'active' : ''}" data-days="30">Last 30 days</button>
          </div>
          <select class="streak-practice-select" id="streakPracticeSelect">${practiceOptions}</select>
        </div>
      </div>
      <div id="streakDisplay"></div>
    </div>

    <div class="analytics-section">
      <div class="analytics-section-title">⏱️ Total Practice Time</div>
      <div class="analytics-grid">
        <div class="stat-card"><div class="stat-value">${fmt(totalToday, 'min')}</div><div class="stat-label">Today<br><span class="stat-date">${labelToday}</span></div></div>
        <div class="stat-card"><div class="stat-value">${fmt(Math.round(avgWeekMins), 'min')}</div><div class="stat-label">Avg — past week<br><span class="stat-date">${labelWeek}</span></div></div>
        <div class="stat-card"><div class="stat-value">${fmt(Math.round(avgMonthMins), 'min')}</div><div class="stat-label">Avg — past month<br><span class="stat-date">${labelMonth}</span></div></div>
      </div>
    </div>

    <div class="analytics-section">
      <div class="analytics-section-title">☀️ Surya Kriya</div>
      <div class="analytics-grid">
        <div class="stat-card"><div class="stat-value">${fmt(suryaCyclesToday)}</div><div class="stat-label">Cycles today<br><span class="stat-date">${labelToday}</span></div></div>
        <div class="stat-card"><div class="stat-value">${fmt(parseFloat(suryaAvgCyclesWeek.toFixed(1)))}</div><div class="stat-label">Avg cycles — week<br><span class="stat-date">${labelWeek}</span></div></div>
        <div class="stat-card"><div class="stat-value">${fmt(parseFloat(suryaAvgCyclesMonth.toFixed(1)))}</div><div class="stat-label">Avg cycles — month<br><span class="stat-date">${labelMonth}</span></div></div>
      </div>
      <div class="analytics-improvement">
        <span class="improvement-label">Time per cycle vs last week</span>
        <span class="improvement-value ${suryaTimeDiffLbl.cls}">${suryaTimeDiffLbl.txt !== '—' ? suryaTimeDiffLbl.txt + ' min' : '—'}</span>
      </div>
    </div>

    <div class="analytics-section">
      <div class="analytics-section-title">⚡ Shakti Chalana Kriya</div>
      <div class="analytics-grid">
        <div class="stat-card"><div class="stat-value">${fmt(sckToday)}</div><div class="stat-label">KPs today<br><span class="stat-date">${labelToday}</span></div></div>
        <div class="stat-card"><div class="stat-value">${fmt(Math.round(sckAvgThis))}</div><div class="stat-label">Avg — past week<br><span class="stat-date">${labelWeek}</span></div></div>
        <div class="stat-card"><div class="stat-value">${fmt(Math.round(avg(daysRange(30).map(sckVal))))}</div><div class="stat-label">Avg — past month<br><span class="stat-date">${labelMonth}</span></div></div>
      </div>
      <div class="analytics-improvement">
        <span class="improvement-label">KPs/cycle vs last week</span>
        <span class="improvement-value ${sckDiffLbl.cls}">${sckDiffLbl.txt}</span>
      </div>
    </div>

    <div class="analytics-section">
      <div class="analytics-section-title">🧠 Miracle of Mind</div>
      <div class="analytics-grid">
        <div class="stat-card"><div class="stat-value">${fmt(momToday, 'min')}</div><div class="stat-label">Today<br><span class="stat-date">${labelToday}</span></div></div>
        <div class="stat-card"><div class="stat-value">${fmt(Math.round(momAvgWeek), 'min')}</div><div class="stat-label">Avg — past week<br><span class="stat-date">${labelWeek}</span></div></div>
        <div class="stat-card"><div class="stat-value">${fmt(Math.round(momAvgMonth), 'min')}</div><div class="stat-label">Avg — past month<br><span class="stat-date">${labelMonth}</span></div></div>
      </div>
    </div>

    <div class="analytics-section">
      <div class="analytics-section-title">🌸 Devi Stuti</div>
      <div class="analytics-grid">
        <div class="stat-card"><div class="stat-value">${fmt(deviToday)}</div><div class="stat-label">Cycles today<br><span class="stat-date">${labelToday}</span></div></div>
        <div class="stat-card"><div class="stat-value">${fmt(parseFloat(deviAvgWeek.toFixed(1)))}</div><div class="stat-label">Avg — past week<br><span class="stat-date">${labelWeek}</span></div></div>
        <div class="stat-card"><div class="stat-value">${fmt(parseFloat(deviAvgMonth.toFixed(1)))}</div><div class="stat-label">Avg — past month<br><span class="stat-date">${labelMonth}</span></div></div>
      </div>
    </div>
  `;

  el.querySelectorAll('.streak-period-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      streakPeriod = parseInt(btn.dataset.days);
      el.querySelectorAll('.streak-period-btn').forEach(b =>
        b.classList.toggle('active', parseInt(b.dataset.days) === streakPeriod)
      );
      renderStreakDisplay();
    });
  });

  const practiceSelect = el.querySelector('#streakPracticeSelect');
  if (practiceSelect) {
    practiceSelect.addEventListener('change', e => {
      streakPracticeId = e.target.value;
      renderStreakDisplay();
    });
  }

  renderStreakDisplay();
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

/* ── RENDER — BEST TEN DAYS ──────────────────────────────── */
function renderBestTenDays() {
  const el = document.getElementById('bestTenContent');
  if (!el) return;

  const mainPractices  = PRACTICES.filter(p => p.section !== 'other');
  const otherPractices = PRACTICES.filter(p => p.section === 'other');
  const maxMain  = mainPractices.length;
  const maxOther = otherPractices.length;
  const maxTotal = maxMain + maxOther;

  const scored = Object.entries(data).map(([dateStr, dayData]) => {
    const s = dayData.sadhana || {};
    const mainDone  = mainPractices.filter(p => s[p.id]  && !s[`${p.id}_na`]).length;
    const otherDone = otherPractices.filter(p => s[p.id] && !s[`${p.id}_na`]).length;
    return { dateStr, mainDone, otherDone, total: mainDone + otherDone };
  }).filter(d => d.total > 0);

  scored.sort((a, b) => b.total - a.total || b.dateStr.localeCompare(a.dateStr));
  const top10 = scored.slice(0, 10);

  if (!top10.length) {
    el.innerHTML = `<div class="best-empty">No data yet — start tracking to see your best days!</div>`;
    return;
  }

  const medals = ['🥇', '🥈', '🥉'];
  el.innerHTML = top10.map((d, i) => {
    const rank  = i < 3 ? medals[i] : `#${i + 1}`;
    const pct   = Math.round(d.total / maxTotal * 100);
    const dt    = new Date(d.dateStr + 'T00:00:00');
    const label = dt.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    return `
      <div class="best-day-card">
        <div class="best-day-rank">${rank}</div>
        <div class="best-day-info">
          <div class="best-day-date">${label}</div>
          <div class="best-day-meta">
            <span class="best-day-score">${d.total} pts</span>
            <span class="best-day-max">/ ${maxTotal}</span>
          </div>
          <div class="best-day-bar-wrap">
            <div class="best-day-bar" style="width:${pct}%"></div>
          </div>
          <div class="best-day-breakdown">
            <span>Core: ${d.mainDone}/${maxMain}</span>
            <span class="best-day-dot">·</span>
            <span>Other: ${d.otherDone}/${maxOther}</span>
          </div>
        </div>
      </div>`;
  }).join('');
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
  if (viewName === 'trends')    renderTrends();
  if (viewName === 'analytics') renderAnalytics();
  if (viewName === 'best')      renderBestTenDays();
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

/* ── CENTRE MODAL ────────────────────────────────────────── */
function showCentreModal(on) {
  document.getElementById('centreModal').style.display = on ? 'flex' : 'none';
}

function initCentreModal() {
  const regionEl      = document.getElementById('regionSelect');
  const dropdownGroup = document.getElementById('centreDropdownGroup');
  const centreEl      = document.getElementById('centreSelect');
  const customGroup   = document.getElementById('customCentreGroup');
  const customInput   = document.getElementById('customCentreInput');
  const notListed     = document.getElementById('centreNotListed');
  const notListedBtn  = document.getElementById('centreNotListedBtn');
  const continueBtn   = document.getElementById('centreContinueBtn');

  let customMode = false;

  function resetSub() {
    dropdownGroup.style.display = 'none';
    customGroup.style.display   = 'none';
    notListed.style.display     = 'none';
    centreEl.value              = '';
    customInput.value           = '';
    customMode                  = false;
  }

  function validate() {
    const region = regionEl.value;
    if (!region) { continueBtn.disabled = true; return; }
    if (CENTRE_OPTIONS[region]) {
      continueBtn.disabled = customMode ? !customInput.value.trim() : !centreEl.value;
    } else {
      continueBtn.disabled = false;
    }
  }

  regionEl.addEventListener('change', () => {
    const region = regionEl.value;
    resetSub();
    if (region && CENTRE_OPTIONS[region]) {
      centreEl.innerHTML =
        '<option value="">Select your centre…</option>' +
        CENTRE_OPTIONS[region].map(c => `<option>${c}</option>`).join('');
      dropdownGroup.style.display = 'block';
      if (region === 'KA - Bengaluru') notListed.style.display = 'block';
    }
    validate();
  });

  centreEl.addEventListener('change', () => {
    if (centreEl.value === 'Others') {
      customGroup.style.display = 'block';
      customMode = true;
    } else {
      customGroup.style.display = 'none';
      customMode = false;
      customInput.value = '';
    }
    validate();
  });

  notListedBtn.addEventListener('click', () => {
    customMode = true;
    dropdownGroup.style.display = 'none';
    notListed.style.display     = 'none';
    customGroup.style.display   = 'block';
    centreEl.value              = '';
    customInput.focus();
    validate();
  });

  customInput.addEventListener('input', validate);

  continueBtn.addEventListener('click', async () => {
    const region = regionEl.value;
    if (!region) return;
    const centre = CENTRE_OPTIONS[region]
      ? (customMode ? customInput.value.trim() : centreEl.value)
      : region;
    if (CENTRE_OPTIONS[region] && !centre) return;

    continueBtn.disabled = true;
    continueBtn.textContent = 'Saving…';
    try {
      await db.collection('users').doc(currentUser.uid).set(
        { region, centre },
        { merge: true }
      );
      showCentreModal(false);
    } catch (e) {
      console.error('Centre save error:', e);
      continueBtn.disabled = false;
      continueBtn.textContent = 'Continue';
    }
  });
}

/* ── INIT ────────────────────────────────────────────────── */
function init() {
  renderPracticeList();
  initCentreModal();

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

      let hasRegion = false;
      try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        hasRegion = !!(userDoc.data()?.region);
      } catch(e) {
        hasRegion = true;
      }

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
      renderAnalytics();
      showLoading(false);

      if (!hasRegion) showCentreModal(true);
    } else {
      try { localStorage.removeItem(lsKey()); } catch(e) {}
      currentUser = null;
      data = {};
      showLoading(false);
      showLogin(true);
      renderUserMenu(null);
    }
  });
});
