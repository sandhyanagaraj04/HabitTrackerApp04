'use strict';

/* ── FIREBASE ───────────────────────────────────────────── */
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db   = firebase.firestore();

const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const SADHANA_IDS = [
  'guru_pooja','upa_yoga','yoga_namaskar','surya_kriya','angamardana','asanas',
  'sck_morning','shambhavi_morning','breath_watching','samyama','aum_namah_shivaya',
  'shoonya_mid','miracle_of_mind','devi_stuti','achala_arpanam','infinity_meditation',
  'sukha_kriya','aum_chanting','nadi_shuddhi','bhuta_shuddhi','shoonya_evening',
  'presence_time','iecc','sck_evening','shambhavi_evening'
];

function countPoints(sadhana) {
  if (!sadhana) return 0;
  return SADHANA_IDS.filter(id => sadhana[id] === true && !sadhana[id + '_na']).length;
}

function weekStart(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const dow = d.getDay();
  d.setDate(d.getDate() + (dow === 0 ? -6 : 1 - dow));
  return d.toISOString().slice(0, 10);
}

function formatWeekRange(mondayStr) {
  const d = new Date(mondayStr + 'T00:00:00');
  const sun = new Date(d); sun.setDate(d.getDate() + 6);
  const fmt = dt => dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  return `${fmt(d)} – ${fmt(sun)}`;
}

/* ── ADMIN ACCESS ───────────────────────────────────────── */
const ADMIN_EMAILS = [
  'sandhyanagaraj04@gmail.com',
  // add more emails here
];
const ADMIN_UIDS = [
  // add UIDs here for extra security e.g. 'abc123uid'
];

function isAdmin(user) {
  return ADMIN_EMAILS.includes(user.email) || ADMIN_UIDS.includes(user.uid);
}
function todayStr() { return new Date().toISOString().slice(0,10); }

function offsetDate(str, days) {
  const [y,m,d] = str.split('-').map(Number);
  const dt = new Date(y, m-1, d);
  dt.setDate(dt.getDate() + days);
  return dt.toISOString().slice(0,10);
}

function calcHours(from, to) {
  if (!from || !to) return null;
  const [fh,fm] = from.split(':').map(Number);
  const [th,tm] = to.split(':').map(Number);
  let diff = (th*60+tm) - (fh*60+fm);
  if (diff < 0) diff += 1440;
  return Math.round(diff / 60 * 10) / 10;
}

function avg(arr) {
  const nums = arr.filter(n => n != null && !isNaN(n) && n > 0);
  return nums.length ? (nums.reduce((a,b) => a+b, 0) / nums.length) : null;
}

function formatDate(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' });
}

function calcStreak(days) {
  let streak = 0;
  let d = todayStr();
  const sorted = Object.keys(days).sort();
  if (!sorted.length) return 0;
  while (days[d]) {
    const h = days[d].health || {};
    const s = days[d].sadhana || {};
    if (h.sleep_time || h.steps || Object.values(s).some(Boolean)) {
      streak++; d = offsetDate(d, -1);
    } else break;
  }
  return streak;
}


/* ── LOAD ALL DATA ──────────────────────────────────────── */
async function loadAdminData() {
  // Load all user profiles
  const usersSnap = await db.collection('users').get();
  const users = {};
  usersSnap.forEach(doc => { users[doc.id] = { ...doc.data(), uid: doc.id, days: {} }; });

  // Load all days via collection group query
  const daysSnap = await db.collectionGroup('days').get();
  daysSnap.forEach(doc => {
    const uid = doc.ref.parent.parent.id;
    if (users[uid]) users[uid].days[doc.id] = doc.data();
  });

  return Object.values(users);
}

/* ── ANALYTICS ──────────────────────────────────────────── */
function computeAnalytics(users) {
  const today = todayStr();
  const weekAgo = offsetDate(today, -7);

  let totalSleepHrs = [], totalSteps = [], totalSadhana = [];
  let sadhanaFields = { guru_pooja:0, upa_yoga:0, yoga_namaskar:0, surya_kriya:0, angamardana:0, asanas:0, sck_morning:0, shambhavi_morning:0, breath_watching:0, samyama:0, aum_namah_shivaya:0, shoonya_mid:0, miracle_of_mind:0, devi_stuti:0, achala_arpanam:0, infinity_meditation:0, sukha_kriya:0, aum_chanting:0, nadi_shuddhi:0, bhuta_shuddhi:0, shoonya_evening:0, sck_evening:0, shambhavi_evening:0 };
  let sadhanaTotal  = 0;
  let qualityCounts = [0,0,0,0,0]; // indices 0-4 = stars 1-5
  let mealSources   = { home:0, outside:0, ordered:0, canteen:0, skipped:0 };
  let stepsByDay    = [0,0,0,0,0,0,0]; // Sun-Sat
  let stepsByDayCount = [0,0,0,0,0,0,0];
  let activeThisWeek = 0;
  let topStreak = 0;

  const userStats = users.map(u => {
    const days  = u.days || {};
    const dates = Object.keys(days).sort();
    let userSleep=[], userSteps=[], userSadhana=[];
    let lastActiveDate = null;

    dates.forEach(dateStr => {
      const day  = days[dateStr];
      const h    = day.health  || {};
      const s    = day.sadhana || {};
      const dt   = new Date(...dateStr.split('-').map((v,i)=>i===1?v-1:+v));
      const dow  = dt.getDay();

      // Sleep
      const sh = calcHours(h.sleep_time, h.wake_time);
      if (sh && sh > 2 && sh < 14) {
        userSleep.push(sh);
        totalSleepHrs.push(sh);
      }

      // Steps
      const steps = parseInt(h.steps) || 0;
      if (steps > 0) {
        userSteps.push(steps);
        totalSteps.push(steps);
        stepsByDay[dow] += steps;
        stepsByDayCount[dow]++;
      }

      // Sleep quality
      const sq = parseInt(h.sleep_quality) || 0;
      if (sq >= 1 && sq <= 5) qualityCounts[sq-1]++;

      // Meal sources
      ['breakfast_source','lunch_source','snack_source','dinner_source'].forEach(f => {
        const src = h[f];
        if (src && mealSources[src] !== undefined) mealSources[src]++;
      });

      // Sadhana
      const done = Object.values(s).filter(Boolean).length;
      const total = Object.keys(s).length || 5;
      const pct = total ? Math.round(done/total*100) : 0;
      userSadhana.push(pct);
      totalSadhana.push(pct);
      Object.keys(sadhanaFields).forEach(k => {
        if (s[k]) sadhanaFields[k]++;
      });
      sadhanaTotal++;

      if (!lastActiveDate || dateStr > lastActiveDate) lastActiveDate = dateStr;
    });

    // Active this week
    if (lastActiveDate && lastActiveDate >= weekAgo) activeThisWeek++;

    const streak = calcStreak(days);
    if (streak > topStreak) topStreak = streak;

    return {
      uid:        u.uid,
      name:       u.name       || 'Unknown',
      email:      u.email      || '—',
      photoURL:   u.photoURL   || '',
      createdAt:  u.createdAt,
      lastActive: u.lastActive,
      lastActiveDate,
      daysLogged: dates.length,
      avgSleep:   avg(userSleep),
      avgSteps:   avg(userSteps),
      avgSadhana: avg(userSadhana),
      streak
    };
  });

  // Steps by day of week averages
  const avgStepsByDay = stepsByDay.map((s,i) =>
    stepsByDayCount[i] ? Math.round(s / stepsByDayCount[i]) : 0
  );

  // Sadhana completion %
  const sadhanaCompletionPct = Object.fromEntries(
    Object.entries(sadhanaFields).map(([k,v]) => [k, sadhanaTotal ? Math.round(v/sadhanaTotal*100) : 0])
  );

  // ── Centre weekly leaderboard ──
  const centreMap = {};
  users.forEach(u => {
    if (!u.region) return;
    const key = u.centre ? `${u.region}||${u.centre}` : u.region;
    if (!centreMap[key]) centreMap[key] = { region: u.region, centre: u.centre || '', weekData: {} };
    Object.entries(u.days || {}).forEach(([dateStr, day]) => {
      const ws = weekStart(dateStr);
      centreMap[key].weekData[ws] = (centreMap[key].weekData[ws] || 0) + countPoints(day.sadhana);
    });
  });

  const recentWeeks = [];
  let wk = weekStart(today);
  for (let i = 0; i < 4; i++) { recentWeeks.push(wk); wk = offsetDate(wk, -7); }

  const centreLeaderboard = Object.values(centreMap)
    .map(c => ({ region: c.region, centre: c.centre, pts: recentWeeks.map(w => c.weekData[w] || 0) }))
    .sort((a, b) => b.pts[0] - a.pts[0]);

  return {
    totalUsers:   users.length,
    activeThisWeek,
    avgSleep:     avg(totalSleepHrs),
    avgSteps:     avg(totalSteps),
    avgSadhana:   avg(totalSadhana),
    topStreak,
    qualityCounts,
    mealSources,
    sadhanaCompletionPct,
    avgStepsByDay,
    userStats,
    centreLeaderboard,
    recentWeeks
  };
}

/* ── RENDER STATS ───────────────────────────────────────── */
function renderStats(a) {
  document.getElementById('statTotalUsers').textContent  = a.totalUsers;
  document.getElementById('statActiveWeek').textContent  = a.activeThisWeek;
  document.getElementById('statTopStreak').textContent   = a.topStreak  ? `${a.topStreak} days`   : '—';
  document.getElementById('statAvgSadhana').textContent  = a.avgSadhana ? `${Math.round(a.avgSadhana)}%` : '—';
}

/* ── CHARTS ─────────────────────────────────────────────── */
const CHART_DEFAULTS = {
  color: '#7c8db5',
  plugins: { legend: { display: false } },
  scales: {
    x: { ticks: { color:'#7c8db5', font:{ family:'Inter', size:11 } }, grid: { color:'rgba(255,255,255,0.05)' } },
    y: { ticks: { color:'#7c8db5', font:{ family:'Inter', size:11 } }, grid: { color:'rgba(255,255,255,0.05)' } }
  }
};

function makeChart(id, type, data, options={}) {
  const ctx = document.getElementById(id).getContext('2d');
  return new Chart(ctx, { type, data, options: { ...CHART_DEFAULTS, ...options, responsive:true, maintainAspectRatio: type!=='doughnut' } });
}

let charts = {};

function renderCharts(a) {
  Object.values(charts).forEach(c => c.destroy());
  charts = {};

  // Sadhana horizontal bar
  const sadhanaLabels = ['Guru Pooja','Upa Yoga','Yoga Namaskar','Surya Kriya','Angamardana','Asanas','SCK (Morning)','Shambhavi (Morning)','Breath Watching','Samyama','Aum Namah Shivaya','Shoonya (Mid)','Miracle of Mind','Devi Stuti','Achala Arpanam','Infinity Meditation','Sukha Kriya','Aum Chanting','Nadi Shuddhi','Bhuta Shuddhi','Shoonya (Evening)','SCK (Evening)','Shambhavi (Evening)'];
  const sadhanaKeys   = ['guru_pooja','upa_yoga','yoga_namaskar','surya_kriya','angamardana','asanas','sck_morning','shambhavi_morning','breath_watching','samyama','aum_namah_shivaya','shoonya_mid','miracle_of_mind','devi_stuti','achala_arpanam','infinity_meditation','sukha_kriya','aum_chanting','nadi_shuddhi','bhuta_shuddhi','shoonya_evening','sck_evening','shambhavi_evening'];
  charts.sadhana = makeChart('sadhanaChart', 'bar', {
    labels: sadhanaLabels,
    datasets: [{ data: sadhanaKeys.map(k => a.sadhanaCompletionPct[k]),
      backgroundColor: 'rgba(167,139,250,0.7)', borderColor: '#a78bfa',
      borderWidth: 1, borderRadius: 6 }]
  }, { indexAxis:'y', scales: { ...CHART_DEFAULTS.scales,
      x: { ...CHART_DEFAULTS.scales.x, max:100, ticks: { ...CHART_DEFAULTS.scales.x.ticks, callback: v => v+'%' } }
  }});

  // Sleep quality bar
  charts.sleepQ = makeChart('sleepQualityChart', 'bar', {
    labels: ['⭐','⭐⭐','⭐⭐⭐','⭐⭐⭐⭐','⭐⭐⭐⭐⭐'],
    datasets: [{ data: a.qualityCounts,
      backgroundColor: ['rgba(248,113,113,0.7)','rgba(251,191,36,0.7)','rgba(96,165,250,0.7)','rgba(52,211,153,0.5)','rgba(52,211,153,0.9)'],
      borderRadius: 6 }]
  });

  // Meal source doughnut
  const mealLabels = ['Home 🏠','Outside 🏪','Ordered 📦','Canteen 🏢','Skipped ⏭️'];
  const mealKeys   = ['home','outside','ordered','canteen','skipped'];
  const mealVals   = mealKeys.map(k => a.mealSources[k]);
  if (mealVals.some(v => v > 0)) {
    charts.meal = makeChart('mealSourceChart', 'doughnut', {
      labels: mealLabels,
      datasets: [{ data: mealVals,
        backgroundColor: ['rgba(52,211,153,0.8)','rgba(251,191,36,0.8)','rgba(96,165,250,0.8)','rgba(167,139,250,0.8)','rgba(248,113,113,0.8)'],
        borderColor: 'rgba(0,0,0,0.3)', borderWidth: 1 }]
    }, { plugins: { legend: { display:true, position:'right',
        labels: { color:'#7c8db5', font:{ family:'Inter', size:11 }, padding:12 } } } });
  }

  // Steps by day of week
  charts.dayOfWeek = makeChart('dayOfWeekChart', 'bar', {
    labels: DAY_NAMES,
    datasets: [{ data: a.avgStepsByDay,
      backgroundColor: 'rgba(96,165,250,0.7)', borderColor:'#60a5fa',
      borderWidth: 1, borderRadius: 6 }]
  }, { scales: { ...CHART_DEFAULTS.scales,
      y: { ...CHART_DEFAULTS.scales.y, ticks: { ...CHART_DEFAULTS.scales.y.ticks, callback: v => v.toLocaleString() } }
  }});
}

/* ── RENDER USERS TABLE ─────────────────────────────────── */
let allUserStats = [];

function renderUsersTable(users, filter='') {
  const tbody = document.getElementById('usersTableBody');
  const low   = filter.toLowerCase();
  const filtered = users.filter(u =>
    !filter || u.name.toLowerCase().includes(low) || u.email.toLowerCase().includes(low)
  );

  document.getElementById('userCount').textContent = `${filtered.length} of ${users.length} users`;

  tbody.innerHTML = filtered.map(u => `
    <tr>
      <td>
        <div class="user-cell">
          ${u.photoURL ? `<img class="table-avatar" src="${u.photoURL}" alt="">` : `<div class="table-avatar table-avatar-placeholder">${(u.name[0]||'?').toUpperCase()}</div>`}
          <span class="user-cell-name">${u.name}</span>
        </div>
      </td>
      <td class="cell-muted">${u.email}</td>
      <td class="cell-muted">${formatDate(u.createdAt)}</td>
      <td class="cell-muted">${u.lastActiveDate || '—'}</td>
      <td><span class="badge">${u.daysLogged}</span></td>
      <td>
        <div class="sadhana-bar-wrap">
          <div class="sadhana-bar" style="width:${u.avgSadhana||0}%"></div>
          <span>${u.avgSadhana ? Math.round(u.avgSadhana)+'%' : '—'}</span>
        </div>
      </td>
      <td>${u.streak ? `<span class="streak-badge">🔥 ${u.streak}</span>` : '—'}</td>
    </tr>
  `).join('');
}

/* ── STREAK VIEW ────────────────────────────────────────── */
const MAIN_PRACTICE_IDS = [
  'guru_pooja','surya_kriya','angamardana','asanas','sck_morning',
  'shambhavi_morning','breath_watching','samyama','aum_namah_shivaya',
  'shoonya_mid','miracle_of_mind','devi_stuti','bhuta_shuddhi',
  'shoonya_evening'
];

function renderStreakView(users) {
  const container = document.getElementById('streakView');
  if (!container) return;
  const today = todayStr();

  // Build last-30 date array oldest → newest
  const dates = Array.from({ length: 30 }, (_, i) => offsetDate(today, -(29 - i)));

  // Column headers: day-of-month + short month on 1st
  const headerCells = dates.map(d => {
    const dt  = new Date(d + 'T00:00:00');
    const day = dt.getDate();
    const mon = dt.toLocaleDateString('en-GB', { month: 'short' });
    return `<div class="streak-col-hdr">${day === 1 ? mon : day}</div>`;
  }).join('');

  const rows = users.map(u => {
    const days = u.days || {};
    const cells = dates.map(d => {
      const s     = days[d]?.sadhana || {};
      const done  = MAIN_PRACTICE_IDS.filter(id => s[id]).length;
      const total = MAIN_PRACTICE_IDS.length;
      const pct   = done / total;
      const alpha = pct === 0 ? 0.07 : 0.18 + pct * 0.82;
      const dt    = new Date(d + 'T00:00:00');
      const label = dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      return `<div class="streak-cell" style="background:var(--sadhana);opacity:${alpha.toFixed(2)}" title="${label}: ${done}/${total} practices"></div>`;
    }).join('');

    const avatar = u.photoURL
      ? `<img class="streak-avatar" src="${u.photoURL}" alt="">`
      : `<div class="streak-avatar streak-avatar-ph">${(u.name||'?')[0].toUpperCase()}</div>`;

    return `
      <div class="streak-row">
        <div class="streak-user">${avatar}<span class="streak-name">${u.name || 'Unknown'}</span></div>
        <div class="streak-cells">${cells}</div>
      </div>`;
  }).join('');

  container.innerHTML = `
    <div class="streak-header-row">
      <div class="streak-user-spacer"></div>
      <div class="streak-cells">${headerCells}</div>
    </div>
    ${rows}`;
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

/* ── MAIN ───────────────────────────────────────────────── */
/* ── CENTRE LEADERBOARD ─────────────────────────────────── */
function renderCentreLeaderboard(a) {
  const { centreLeaderboard, recentWeeks } = a;
  const weekLabels = ['This Week', 'Last Week', '2 Weeks Ago', '3 Weeks Ago'];
  recentWeeks.forEach((w, i) => {
    const el = document.getElementById(`centreWeek${i}`);
    if (el) el.innerHTML = `${weekLabels[i]}<br><span class="week-range">${formatWeekRange(w)}</span>`;
  });

  const tbody = document.getElementById('centreTableBody');
  if (!centreLeaderboard.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="centre-empty">No centre data yet — users need to select their centre in the app.</td></tr>';
    return;
  }

  const medals = ['🥇', '🥈', '🥉'];
  tbody.innerHTML = centreLeaderboard.map((c, i) => {
    const name   = c.centre || c.region;
    const region = c.centre ? c.region : '';
    const rank   = medals[i] || `${i + 1}.`;
    return `
      <tr>
        <td><span class="centre-rank">${rank}</span> <strong>${name}</strong></td>
        <td class="cell-muted">${region}</td>
        ${c.pts.map((p, j) => `<td><span class="centre-pts${j === 0 ? ' centre-pts-now' : ''}">${p}</span></td>`).join('')}
      </tr>`;
  }).join('');
}

async function loadDashboard() {
  try {
    const users    = await loadAdminData();
    const analytics = computeAnalytics(users);
    allUserStats   = analytics.userStats;

    renderStats(analytics);
    renderCharts(analytics);
    renderUsersTable(allUserStats);
    renderStreakView(users);
    renderCentreLeaderboard(analytics);

    document.getElementById('lastUpdated').textContent =
      `Last updated: ${new Date().toLocaleTimeString()}`;
  } catch (err) {
    console.error(err);
    showToast('⚠️ Error loading data: ' + err.message);
  }
}

auth.onAuthStateChanged(async user => {
  if (!user) { window.location.href = 'index.html'; return; }

  document.getElementById('adminAvatar').src = user.photoURL || '';
  document.getElementById('loadingScreen').style.display = 'none';

  if (!isAdmin(user)) {
    console.log('%c Your UID (add to ADMIN_UIDS in admin.js):', 'color:#34d399;font-weight:bold', user.uid);
    document.getElementById('accessDenied').style.display = 'flex';
    return;
  }

  document.getElementById('adminSidebar').style.display = 'flex';
  document.getElementById('dashboard').style.display = 'block';
  await loadDashboard();

  // Sidebar nav
  document.querySelectorAll('.admin-nav-item[data-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.admin-nav-item').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.admin-view').forEach(v => v.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`view-${btn.dataset.view}`).classList.add('active');
    });
  });

  // Search
  document.getElementById('userSearch').addEventListener('input', e => {
    renderUsersTable(allUserStats, e.target.value);
  });

  // Refresh
  document.getElementById('refreshBtn').addEventListener('click', async () => {
    document.getElementById('refreshBtn').disabled = true;
    await loadDashboard();
    document.getElementById('refreshBtn').disabled = false;
    showToast('✅ Data refreshed');
  });
});
