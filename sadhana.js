/* ═══════════════════════════════════════════════════════════
   SADHANA SUPPORT — Core JS (auth + data + practices)
   ═══════════════════════════════════════════════════════════ */

/* ── PRACTICES LIST ─────────────────────────────────────── */
const PRACTICES = [
  { id: 'guru_pooja',          name: 'Guru Pooja',                      icon: '🪔', desc: 'Daily reverence & offering' },
  { id: 'upa_yoga',            name: 'Upa Yoga',                        icon: '🌀', desc: 'Activating the system' },
  { id: 'yoga_namaskar',       name: 'Yoga Namaskar',                   icon: '🧘', desc: 'Salutation to the sun' },
  { id: 'surya_kriya',         name: 'Surya Kriya',                     icon: '☀️', desc: 'Solar energy alignment' },
  { id: 'asanas',              name: 'Asanas',                          icon: '🤸', desc: 'Physical postures' },
  { id: 'sck_morning',         name: 'Shakti Chalana Kriya (Morning)',  icon: '⚡', desc: 'Morning energy activation' },
  { id: 'shambhavi_morning',   name: 'Shambhavi (Morning)',             icon: '🌅', desc: 'Morning inner vision practice' },
  { id: 'shoonya_mid',         name: 'Shoonya (Mid Morning)',           icon: '🌌', desc: 'Emptiness meditation' },
  { id: 'miracle_of_mind',     name: 'Miracle of Mind',                 icon: '🧠', desc: 'Mind training practice' },
  { id: 'devi_stuti',          name: 'Devi Stuti',                      icon: '🌸', desc: 'Devotional chanting' },
  { id: 'achala_arpanam',      name: 'Achala Arpanam',                  icon: '🏔️', desc: 'Offering to the stillness' },
  { id: 'infinity_meditation', name: 'Infinity Meditation',             icon: '♾️', desc: 'Boundless awareness' },
  { id: 'sukha_kriya',         name: 'Sukha Kriya',                     icon: '😌', desc: 'Effortless action' },
  { id: 'aum_chanting',        name: 'Aum Chanting',                    icon: '🔔', desc: 'Sacred sound vibration' },
  { id: 'nadi_shuddhi',        name: 'Nadi Shuddhi',                    icon: '🌬️', desc: 'Energy channel purification' },
  { id: 'shoonya_evening',     name: 'Shoonya (Evening)',               icon: '🌙', desc: 'Evening emptiness meditation' },
  { id: 'sck_evening',         name: 'Shakti Chalana Kriya (Evening)',  icon: '⚡', desc: 'Evening energy activation' },
  { id: 'shambhavi_evening',   name: 'Shambhavi (Evening)',             icon: '🌅', desc: 'Evening inner vision practice' },
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
  return Object.fromEntries(PRACTICES.map(p => [p.id, false]));
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
          <div class="practice-desc">${p.desc}</div>
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
      saveData();
      updateRing();
      updateBanner();
    });
  });
}

/* ── RENDER — SADHANA STATE ──────────────────────────────── */
function renderSadhana() {
  const s = getDayData(currentDate).sadhana;
  document.querySelectorAll('.practice-check').forEach(el => {
    el.checked = s[el.dataset.field] || false;
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
}

/* ── USER MENU ───────────────────────────────────────────── */
function renderUserMenu(user) {
  const btn   = document.getElementById('userBtn');
  const photo = document.getElementById('userPhoto');
  const name  = document.getElementById('userName');
  const email = document.getElementById('userEmail');
  if (!user) { if (btn) btn.style.display = 'none'; return; }
  if (btn)   btn.style.display  = 'flex';
  if (photo) photo.src          = user.photoURL || '';
  if (name)  name.textContent   = user.displayName || '';
  if (email) email.textContent  = user.email || '';
}

/* ── INIT ────────────────────────────────────────────────── */
function init() {
  renderPracticeList();

  document.getElementById('prevDay').addEventListener('click', () =>
    navigateTo(offsetDate(currentDate, -1))
  );
  document.getElementById('nextDay').addEventListener('click', () => {
    if (currentDate < todayStr()) navigateTo(offsetDate(currentDate, 1));
  });

  document.getElementById('googleSignIn').addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch(e => console.error('Sign-in error:', e));
  });

  document.getElementById('userBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    const menu = document.getElementById('userDropdown');
    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
  });

  document.getElementById('signOutBtn').addEventListener('click', () => {
    auth.signOut();
  });

  document.addEventListener('click', () => {
    const menu = document.getElementById('userDropdown');
    if (menu) menu.style.display = 'none';
  });
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
