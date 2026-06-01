/* ═══════════════════════════════════════════════════════════
   MEAL TRACKER — APPLICATION LOGIC
   ═══════════════════════════════════════════════════════════ */
'use strict';

const MT_KEY  = 'meal_tracker_v1';
const DAY_SHORT  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTH_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTH_SHORT= ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const SLOTS = [
  { id:'breakfast', label:'Breakfast', icon:'🌅', iconClass:'icon-breakfast' },
  { id:'lunch',     label:'Lunch',     icon:'☀️',  iconClass:'icon-lunch'     },
  { id:'snack',     label:'Snack',     icon:'🌤️',  iconClass:'icon-snack'     },
  { id:'dinner',    label:'Dinner',    icon:'🌙',  iconClass:'icon-dinner'    }
];

/* ── STATE ── */
let data        = {};
let currentDate = todayStr();
let activeTab   = 'log';
let expandedSlot= null;

/* ── DATE UTILS ── */
function todayStr()        { return new Date().toISOString().slice(0,10); }
function dateObj(s)        { const[y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d); }
function offsetDate(s,n)   { const d=dateObj(s);d.setDate(d.getDate()+n);return d.toISOString().slice(0,10); }
function isToday(s)        { return s===todayStr(); }
function fmtShort(s)       { const d=dateObj(s);return DAY_SHORT[d.getDay()]+', '+d.getDate()+' '+MONTH_SHORT[d.getMonth()]; }
function fmtFull(s)        { const d=dateObj(s);return DAY_SHORT[d.getDay()]+', '+d.getDate()+' '+MONTH_FULL[d.getMonth()]+' '+d.getFullYear(); }

function getWeekDates(s) {
  const d=dateObj(s),day=d.getDay();
  const mon=new Date(d); mon.setDate(d.getDate()-day+(day===0?-6:1));
  return Array.from({length:7},(_,i)=>{ const t=new Date(mon);t.setDate(mon.getDate()+i);return t.toISOString().slice(0,10); });
}

function getLast90Days() {
  const days=[];let d=todayStr();
  for(let i=0;i<90;i++){ days.unshift(d); d=offsetDate(d,-1); }
  return days;
}

/* ── DATA ── */
function loadData() {
  try { data=JSON.parse(localStorage.getItem(MT_KEY)||'{}'); } catch { data={}; }
  // also pull in habit tracker meal data as a seed for existing users
  try {
    const ht=JSON.parse(localStorage.getItem('habitTracker_v1')||'{}');
    Object.entries(ht).forEach(([date,day]) => {
      if(!data[date]) data[date]={};
      const h=day.health||{};
      ['breakfast','lunch','snack','dinner'].forEach(slot=>{
        if(h[slot]&&!data[date][slot]){
          data[date][slot]={ name:h[slot], notes:'', rating:0, logged:true };
        }
      });
    });
  } catch {}
}

function saveData() { localStorage.setItem(MT_KEY,JSON.stringify(data)); }

function getDayData(date) {
  if(!data[date]) data[date]={};
  return data[date];
}

function getSlotData(date,slot) {
  const day=getDayData(date);
  if(!day[slot]) day[slot]={ name:'', notes:'', rating:0, logged:false };
  return day[slot];
}

/* ── STREAK CALC ── */
function calcCurrentStreak() {
  let streak=0,d=todayStr();
  // if today has no meals yet, start counting from yesterday
  if(!hasAnyMeal(d)) d=offsetDate(d,-1);
  while(true){
    if(hasAnyMeal(d)){ streak++; d=offsetDate(d,-1); } else break;
  }
  return streak;
}

function calcFullDayStreak() {
  let streak=0,d=todayStr();
  if(!isFullDay(d)) d=offsetDate(d,-1);
  while(true){
    if(isFullDay(d)){ streak++; d=offsetDate(d,-1); } else break;
  }
  return streak;
}

function calcLongestStreak() {
  let longest=0,current=0,d=offsetDate(todayStr(),-89);
  for(let i=0;i<90;i++){
    if(hasAnyMeal(d)){ current++; if(current>longest)longest=current; }
    else current=0;
    d=offsetDate(d,1);
  }
  return longest;
}

function hasAnyMeal(date) {
  const day=data[date]||{};
  return SLOTS.some(s=>day[s.id]&&day[s.id].logged);
}

function isFullDay(date) {
  const day=data[date]||{};
  return ['breakfast','lunch','dinner'].every(s=>day[s]&&day[s].logged);
}

function mealsLoggedCount(date) {
  const day=data[date]||{};
  return SLOTS.filter(s=>day[s.id]&&day[s.id].logged).length;
}

function weekMealPct(dates) {
  if(!dates.length) return 0;
  const total=dates.reduce((a,d)=>a+mealsLoggedCount(d),0);
  return Math.round(total/(dates.length*4)*100);
}

/* ── RENDER HEADER ── */
function renderHeader() {
  const today=todayStr(),d=dateObj(currentDate);
  document.getElementById('dateLabel').textContent=
    isToday(currentDate)?'Today':currentDate===offsetDate(today,-1)?'Yesterday':currentDate===offsetDate(today,1)?'Tomorrow':'';
  document.getElementById('dateFull').textContent=fmtFull(currentDate);
  document.getElementById('nextDay').disabled=currentDate>=today;
  renderWeekStrip();
}

function renderWeekStrip() {
  const strip=document.getElementById('weekStrip');
  const week=getWeekDates(currentDate);
  const today=todayStr();
  strip.innerHTML=week.map(d=>{
    const dt=dateObj(d);
    const cnt=mealsLoggedCount(d);
    const cls=['wday',d===today?'today':'',d===currentDate?'selected':'',cnt>0?'has-data':'',cnt>=3?'full-day':''].filter(Boolean).join(' ');
    return`<div class="${cls}" data-date="${d}">
      <span class="wday-name">${DAY_SHORT[dt.getDay()]}</span>
      <span class="wday-num">${dt.getDate()}</span>
      <div class="wday-pip"></div>
    </div>`;
  }).join('');
  strip.querySelectorAll('.wday').forEach(el=>el.addEventListener('click',()=>navigateTo(el.dataset.date)));
}

/* ── RENDER STREAKS ── */
function renderStreaks() {
  document.getElementById('streakCurrent').textContent=calcCurrentStreak();
  document.getElementById('streakBest').textContent=calcLongestStreak();
  const wk=getWeekDates(currentDate);
  document.getElementById('streakWeek').textContent=weekMealPct(wk)+'%';
}

/* ── RENDER MEAL LOG ── */
function renderMealLog() {
  const logged=mealsLoggedCount(currentDate);
  document.getElementById('dayScore').textContent=logged+'/4 meals';

  SLOTS.forEach(slot=>{
    const sd=getSlotData(currentDate,slot.id);
    const card=document.getElementById('card-'+slot.id);
    if(!card) return;

    card.classList.toggle('logged',sd.logged);
    card.classList.toggle('expanded',expandedSlot===slot.id);

    // header summary
    card.querySelector('.meal-logged-name').textContent=sd.logged&&sd.name?sd.name:'';
    card.querySelector('.meal-logged-name').style.display=sd.logged&&sd.name?'block':'none';
    card.querySelector('.meal-empty-hint').style.display=!sd.logged||!sd.name?'block':'none';
    card.querySelector('.meal-check').textContent=sd.logged?'✓':'';

    // body fields
    if(expandedSlot===slot.id){
      const nameEl=card.querySelector('.meal-name-input');
      const notesEl=card.querySelector('.meal-notes-input');
      const timeEl=card.querySelector('.meal-time-input');
      if(nameEl&&nameEl!==document.activeElement)  nameEl.value=sd.name||'';
      if(notesEl&&notesEl!==document.activeElement) notesEl.value=sd.notes||'';
      if(timeEl&&timeEl!==document.activeElement)   timeEl.value=sd.time||'';
      renderStars(card,sd.rating||0);
    }
  });
}

function renderStars(card,val) {
  card.querySelectorAll('.star').forEach(s=>s.classList.toggle('active',parseInt(s.dataset.val)<=val));
}

/* ── RENDER HEATMAP ── */
function renderHeatmap() {
  const days=getLast90Days();
  const grid=document.getElementById('heatmapGrid');
  grid.innerHTML=days.map(d=>{
    const cnt=mealsLoggedCount(d);
    const lvl=cnt===0?0:cnt===1?1:cnt===2?2:cnt===3?3:4;
    const dt=dateObj(d);
    return`<div class="hm-cell level-${lvl}" title="${fmtShort(d)}: ${cnt} meals logged"></div>`;
  }).join('');
}

/* ── RENDER HISTORY ── */
function renderHistory() {
  const list=document.getElementById('historyList');
  const days=getLast90Days().filter(d=>hasAnyMeal(d)).reverse();
  if(!days.length){ list.innerHTML='<div style="color:var(--text3);text-align:center;padding:2rem;font-size:.85rem;">No meals logged yet. Start tracking today!</div>';return; }
  list.innerHTML=days.slice(0,30).map(d=>{
    const day=data[d]||{};
    const pills=SLOTS.map(s=>{
      const sd=day[s.id];
      const logged=sd&&sd.logged;
      const name=logged&&sd.name?sd.name:s.label;
      return`<span class="history-pill${logged?'':' empty'}">${s.icon} ${name}</span>`;
    }).join('');
    return`<div class="history-day"><div class="history-day-top"><span class="history-date">${fmtShort(d)}${isToday(d)?' · Today':''}</span><span class="history-score">${mealsLoggedCount(d)}/4</span></div><div class="history-meals">${pills}</div></div>`;
  }).join('');
}

/* ── RENDER WEEKLY SUMMARY ── */
function renderWeeklySummary() {
  const wk=getWeekDates(currentDate);
  const container=document.getElementById('weeklySummary');

  const barData=SLOTS.map(slot=>{
    const logged=wk.filter(d=>{ const s=data[d]&&data[d][slot.id]; return s&&s.logged; }).length;
    return { label:slot.label, icon:slot.icon, logged, pct:Math.round(logged/7*100) };
  });

  const totalMeals=wk.reduce((a,d)=>a+mealsLoggedCount(d),0);
  const fullDays=wk.filter(d=>isFullDay(d)).length;
  const bestSlot=barData.reduce((a,b)=>b.logged>a.logged?b:a);
  const worstSlot=barData.reduce((a,b)=>b.logged<a.logged?b:a);

  container.innerHTML=`
    ${barData.map(b=>`<div class="weekly-bar-row">
      <span class="weekly-bar-label">${b.icon} ${b.label}</span>
      <div class="weekly-bar-track"><div class="weekly-bar-fill" style="width:${b.pct}%"></div></div>
      <span class="weekly-bar-pct">${b.logged}/7</span>
    </div>`).join('')}
    <div class="weekly-insight">
      This week: <strong>${totalMeals} meals</strong> logged across <strong>${fullDays} full days</strong>.
      ${bestSlot.logged>0?`Most consistent: <strong>${bestSlot.icon} ${bestSlot.label}</strong>.`:''}
      ${worstSlot.logged<7&&worstSlot.logged<bestSlot.logged?`Try not to skip <strong>${worstSlot.icon} ${worstSlot.label}</strong>.`:''}
    </div>`;
}

/* ── TAB SWITCHING ── */
function switchTab(tab) {
  activeTab=tab;
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
  document.querySelectorAll('.tab-panel').forEach(p=>p.style.display=p.dataset.panel===tab?'block':'none');
  if(tab==='history')  renderHistory();
  if(tab==='heatmap')  renderHeatmap();
  if(tab==='summary')  renderWeeklySummary();
}

/* ── NAVIGATION ── */
function navigateTo(date) {
  currentDate=date;
  expandedSlot=null;
  renderHeader();
  renderStreaks();
  renderMealLog();
}

/* ── SAVE SLOT ── */
function saveSlot(slotId) {
  const card=document.getElementById('card-'+slotId);
  const sd=getSlotData(currentDate,slotId);
  sd.name   = card.querySelector('.meal-name-input')?.value.trim()||'';
  sd.notes  = card.querySelector('.meal-notes-input')?.value.trim()||'';
  sd.time   = card.querySelector('.meal-time-input')?.value||'';
  sd.logged = true;
  saveData();
  renderHeader();
  renderStreaks();
  renderMealLog();
  showToast('✅ '+SLOTS.find(s=>s.id===slotId).label+' logged!');
}

function clearSlot(slotId) {
  if(data[currentDate]) delete data[currentDate][slotId];
  if(expandedSlot===slotId) expandedSlot=null;
  saveData();
  renderHeader();
  renderStreaks();
  renderMealLog();
  showToast('🗑️ Cleared');
}

/* ── TOAST ── */
let toastTimer;
function showToast(msg) {
  const t=document.getElementById('toast');
  t.textContent=msg;t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>t.classList.remove('show'),2500);
}

/* ── BUILD MEAL CARDS ── */
function buildMealCards() {
  const container=document.getElementById('mealCards');
  container.innerHTML=SLOTS.map(slot=>`
    <div class="meal-card" id="card-${slot.id}">
      <div class="meal-card-header" data-slot="${slot.id}">
        <div class="meal-icon-wrap ${slot.iconClass}">${slot.icon}</div>
        <div class="meal-card-info">
          <div class="meal-slot-name">${slot.label}</div>
          <div class="meal-logged-name" style="display:none"></div>
          <div class="meal-empty-hint">Tap to log</div>
        </div>
        <div class="meal-status">
          <div class="meal-check"></div>
          <div class="meal-chevron">▾</div>
        </div>
      </div>
      <div class="meal-card-body">
        <div class="field-row">
          <div class="field">
            <label class="field-label">What did you eat?</label>
            <input type="text" class="input-text meal-name-input" placeholder="e.g. Oats with banana…">
          </div>
          <div class="field">
            <label class="field-label">Time</label>
            <input type="time" class="input-text meal-time-input">
          </div>
        </div>
        <div class="field">
          <label class="field-label">Notes</label>
          <textarea class="input-text meal-notes-input" placeholder="How did it feel? Any reflections…" rows="2"></textarea>
        </div>
        <div class="field">
          <label class="field-label">Rating</label>
          <div class="star-row">
            ${[1,2,3,4,5].map(v=>`<span class="star" data-val="${v}">★</span>`).join('')}
          </div>
        </div>
        <button class="log-btn log-btn-add">✓ Log ${slot.label}</button>
        <button class="log-btn log-btn-clear" style="margin-top:.4rem">Clear</button>
      </div>
    </div>`).join('');

  // Bind events
  SLOTS.forEach(slot=>{
    const card=document.getElementById('card-'+slot.id);

    card.querySelector('.meal-card-header').addEventListener('click',()=>{
      expandedSlot=expandedSlot===slot.id?null:slot.id;
      renderMealLog();
    });

    card.querySelector('.log-btn-add').addEventListener('click',e=>{ e.stopPropagation(); saveSlot(slot.id); });
    card.querySelector('.log-btn-clear').addEventListener('click',e=>{ e.stopPropagation(); clearSlot(slot.id); });

    card.querySelectorAll('.star').forEach(star=>{
      star.addEventListener('click',e=>{ e.stopPropagation();
        getSlotData(currentDate,slot.id).rating=parseInt(star.dataset.val);
        renderStars(card,getSlotData(currentDate,slot.id).rating);
      });
    });

    // Save on input blur
    ['meal-name-input','meal-notes-input','meal-time-input'].forEach(cls=>{
      card.querySelector('.'+cls)?.addEventListener('change',()=>{
        const sd=getSlotData(currentDate,slot.id);
        if(cls==='meal-name-input') sd.name=card.querySelector('.meal-name-input').value.trim();
        if(cls==='meal-notes-input') sd.notes=card.querySelector('.meal-notes-input').value.trim();
        if(cls==='meal-time-input') sd.time=card.querySelector('.meal-time-input').value;
      });
    });
  });
}

/* ── INIT ── */
function init() {
  loadData();
  buildMealCards();

  // Date nav
  document.getElementById('prevDay').addEventListener('click',()=>navigateTo(offsetDate(currentDate,-1)));
  document.getElementById('nextDay').addEventListener('click',()=>{ if(currentDate<todayStr())navigateTo(offsetDate(currentDate,1)); });
  document.getElementById('todayBtn').addEventListener('click',()=>navigateTo(todayStr()));

  // Tabs
  document.querySelectorAll('.tab-btn').forEach(btn=>btn.addEventListener('click',()=>switchTab(btn.dataset.tab)));

  // Touch swipe
  let tx=0;
  document.querySelector('.main').addEventListener('touchstart',e=>{tx=e.touches[0].clientX;},{passive:true});
  document.querySelector('.main').addEventListener('touchend',e=>{
    const dx=e.changedTouches[0].clientX-tx;
    if(Math.abs(dx)>60){ if(dx>0)navigateTo(offsetDate(currentDate,-1)); else if(currentDate<todayStr())navigateTo(offsetDate(currentDate,1)); }
  },{passive:true});

  // Keyboard
  document.addEventListener('keydown',e=>{
    if(e.altKey||e.ctrlKey||e.metaKey) return;
    if(e.key==='ArrowLeft') navigateTo(offsetDate(currentDate,-1));
    if(e.key==='ArrowRight'&&currentDate<todayStr()) navigateTo(offsetDate(currentDate,1));
  });

  renderHeader();
  renderStreaks();
  renderMealLog();
  switchTab('log');
}

document.addEventListener('DOMContentLoaded',init);
