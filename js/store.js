// =====================================================================
//  Būsena ir žaidimo logika (XP, lygiai, serijos, pasiekimai, draugai).
// =====================================================================
window.LU = window.LU || {};

/*
  DUOMENŲ MODELIS (vienas dokumentas IndexedDB'e, raktas "state"):
  {
    version: 1,
    profile: { id, name, avatar (dataURL|null), goal, tags: [], createdAt },
    tasks: [{ id, title, note, icon, xp, type: 'habit'|'once',
              days: [1..7],            // įpročiui: savaitės dienos (1 = pirmadienis)
              date: 'YYYY-MM-DD',      // vienkartinei: kuriai dienai skirta
              doneDate: 'YYYY-MM-DD'|null, // vienkartinei: kada atlikta
              createdKey, createdAt, order }],
    completions: { 'YYYY-MM-DD': { [taskId]: { at: ISO, xp } } },
    xpLog: [{ id, at: ISO, date, amount, kind: 'task'|'bonus', taskId?, label, icon? }],
    activeDays: ['YYYY-MM-DD'],        // dienos, kai app'as buvo atidarytas
    achievements: { [id]: ISO },       // atrakinti pasiekimai
    maxLevel: number,                  // aukščiausias pasiektas lygis (kad šventė nesikartotų)
    friends: [{ id, name, xp, level, streak, best, tasks, updatedAt, addedAt }],
    notifications: [{ id, at, icon, title, text, read }],
    lastSeen: 'YYYY-MM-DD'
  }
*/

LU.store = (() => {
  const C = LU.config;
  let state = null;
  const subs = new Set();

  // ---------- pagalbinės ----------
  const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  const pad = (n) => String(n).padStart(2, '0');
  const dateKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseKey = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (k, n) => { const d = parseKey(k); d.setDate(d.getDate() + n); return dateKey(d); };
  const weekday = (k) => ((parseKey(k).getDay() + 6) % 7) + 1;
  const today = () => dateKey();

  function emptyState() {
    return {
      version: 1, profile: null, tasks: [], completions: {}, xpLog: [], activeDays: [],
      achievements: {}, maxLevel: 1, friends: [], notifications: [], lastSeen: null,
    };
  }

  // ---------- saugojimas ----------
  async function load() {
    const saved = await LU.db.load();
    state = Object.assign(emptyState(), saved || {});
    // visos užduotys ir įpročiai duoda vienodai XP (C.TASK_XP)
    state.tasks.forEach((t) => { t.xp = C.TASK_XP; });
    return state;
  }
  /** Įrašo iš karto (be uždelsimo), kad nieko neprarastume telefonui uždarius programėlę. */
  function save() {
    return state ? LU.db.save(state) : Promise.resolve();
  }
  const flush = save;
  function commit() {
    save();
    subs.forEach((fn) => fn());
  }
  const subscribe = (fn) => { subs.add(fn); return () => subs.delete(fn); };

  // ---------- profilis ----------
  function createProfile(name) {
    state.profile = { id: uid(), name: name.trim(), avatar: null, goal: '', tags: [], createdAt: new Date().toISOString() };
    if (!state.tasks.length) seedTasks();
    touchDay();
    commit();
  }
  function updateProfile(patch) {
    Object.assign(state.profile, patch);
    commit();
  }
  function seedTasks() {
    C.SEED_TASKS.forEach((t) => addTask({ ...t, type: 'habit', days: [1, 2, 3, 4, 5, 6, 7] }, true));
  }

  // ---------- dienos ----------
  /** Pažymi šiandieną kaip aktyvią. Grąžina true, jei diena pasikeitė nuo paskutinio karto. */
  function touchDay() {
    const t = today();
    const changed = state.lastSeen !== t;
    if (!state.activeDays.includes(t)) state.activeDays.push(t);
    state.lastSeen = t;
    if (changed) save();
    return changed;
  }

  // ---------- užduotys ----------
  function isDue(task, date) {
    if (task.type === 'habit') {
      return task.days.includes(weekday(date)) && (!task.createdKey || task.createdKey <= date);
    }
    // vienkartinė: jei atlikta – rodoma tik tą dieną, kai atlikta; neatlikta persikelia į šiandieną
    if (task.doneDate) return task.doneDate === date;
    return task.date === date || (date === today() && task.date < date);
  }

  /** Šiandienos (ar kitos dienos) misijos su atlikimo informacija. */
  function dueTasks(date = today()) {
    const day = state.completions[date] || {};
    return state.tasks
      .filter((t) => isDue(t, date))
      .sort((a, b) => a.order - b.order)
      .map((t) => ({
        task: t,
        done: !!day[t.id],
        doneAt: day[t.id] ? day[t.id].at : null,
        carried: t.type === 'once' && !t.doneDate && t.date < date,
      }));
  }

  function addTask(data, silent) {
    const order = state.tasks.reduce((m, t) => Math.max(m, t.order), 0) + 1;
    const task = {
      id: uid(), title: data.title.trim(), note: (data.note || '').trim(), icon: data.icon || 'circle-check',
      xp: C.TASK_XP, type: data.type === 'once' ? 'once' : 'habit',
      days: data.type === 'once' ? [] : (data.days && data.days.length ? data.days : [1, 2, 3, 4, 5, 6, 7]),
      date: data.type === 'once' ? (data.date || today()) : null, doneDate: null,
      createdKey: today(), createdAt: new Date().toISOString(), order,
    };
    state.tasks.push(task);
    if (!silent) { syncBonus(today()); commit(); }
    return task;
  }

  function updateTask(id, data) {
    const t = state.tasks.find((x) => x.id === id);
    if (!t) return;
    t.title = data.title.trim();
    t.note = (data.note || '').trim();
    t.icon = data.icon;
    t.type = data.type === 'once' ? 'once' : 'habit';
    t.days = t.type === 'habit' ? (data.days && data.days.length ? data.days : [1, 2, 3, 4, 5, 6, 7]) : [];
    t.date = t.type === 'once' ? (data.date || t.date || today()) : null;
    if (t.type === 'habit') t.doneDate = null;
    t.xp = C.TASK_XP;
    syncBonus(today());
    commit();
  }

  /** Ištrina užduotį. Jau uždirbtas XP ir istorija lieka. */
  function deleteTask(id) {
    state.tasks = state.tasks.filter((t) => t.id !== id);
    syncBonus(today());
    commit();
  }

  /**
   * Pažymi / atšaukia šiandienos užduotį.
   * Grąžina { done, xp, bonus, levelUp, achievements }.
   */
  function toggleTask(id) {
    const date = today();
    const task = state.tasks.find((t) => t.id === id);
    if (!task) return null;
    const before = levelInfo().level;
    const day = (state.completions[date] = state.completions[date] || {});
    const res = { done: false, xp: 0, bonus: 0, levelUp: null, achievements: [] };

    if (day[id]) {
      res.xp = -day[id].xp;
      delete day[id];
      if (!Object.keys(day).length) delete state.completions[date];
      state.xpLog = state.xpLog.filter((l) => !(l.kind === 'task' && l.taskId === id && l.date === date));
      if (task.type === 'once') task.doneDate = null;
    } else {
      const at = new Date().toISOString();
      day[id] = { at, xp: C.TASK_XP };
      state.xpLog.push({ id: uid(), at, date, amount: C.TASK_XP, kind: 'task', taskId: id, label: task.title, icon: task.icon });
      if (task.type === 'once') task.doneDate = date;
      res.done = true;
      res.xp = C.TASK_XP;
    }
    res.bonus = syncBonus(date);
    touchDay();

    const after = levelInfo().level;
    if (after > before && after > state.maxLevel) {
      state.maxLevel = after;
      res.levelUp = after;
      notify('trophy', `Pasiekei ${after} lygį!`, `Tavo titulas: ${titleFor(after).name}.`);
    }
    res.achievements = checkAchievements();
    commit();
    return res;
  }

  /** Pažymi / nuima „svarbi" žymę (žvaigždutė). XP ir atlikimui įtakos neturi. Grąžina naują būseną. */
  function toggleImportant(id) {
    const t = state.tasks.find((x) => x.id === id);
    if (!t) return false;
    t.important = !t.important;
    commit();
    return t.important;
  }

  /** Užtikrina, kad „visos misijos atliktos" premija atitiktų dabartinę būseną. Grąžina XP pokytį. */
  function syncBonus(date) {
    const due = dueTasks(date);
    const allDone = due.length > 0 && due.every((d) => d.done);
    const idx = state.xpLog.findIndex((l) => l.kind === 'bonus' && l.date === date);
    if (allDone && idx === -1) {
      state.xpLog.push({ id: uid(), at: new Date().toISOString(), date, amount: C.ALL_DONE_BONUS, kind: 'bonus', label: 'Visos dienos misijos atliktos', icon: 'sparkles' });
      return C.ALL_DONE_BONUS;
    }
    if (!allDone && idx !== -1) {
      const amount = state.xpLog[idx].amount;
      state.xpLog.splice(idx, 1);
      return -amount;
    }
    return 0;
  }

  // ---------- XP ir lygiai ----------
  const totalXp = () => state.xpLog.reduce((s, l) => s + l.amount, 0);

  function titleFor(level) {
    return C.TITLES.find((t) => level >= t.from && level <= t.to) || C.TITLES[C.TITLES.length - 1];
  }
  const levelIcon = (level) => C.LEVEL_ICONS[(level - 1) % C.LEVEL_ICONS.length];

  /** Kiek iš viso XP reikia, kad pasiektum `level` lygį. */
  function levelStartXp(level) {
    let xp = 0;
    for (let n = 1; n < level; n++) xp += C.xpToNext(n);
    return xp;
  }

  function levelInfo(xp = totalXp()) {
    let level = 1;
    let start = 0;
    while (level < C.MAX_LEVEL && xp >= start + C.xpToNext(level)) {
      start += C.xpToNext(level);
      level++;
    }
    const max = level >= C.MAX_LEVEL;
    const need = max ? 0 : C.xpToNext(level);
    const into = xp - start;
    return {
      xp, level, start, need, into, max,
      next: start + need,
      remaining: max ? 0 : need - into,
      pct: max ? 100 : Math.min(100, Math.floor((into / need) * 100)),
      title: titleFor(level),
    };
  }

  // ---------- serijos ir statistika ----------
  const doneDates = () => Object.keys(state.completions).filter((k) => Object.keys(state.completions[k]).length).sort();

  function currentStreak() {
    const set = new Set(doneDates());
    let d = today();
    if (!set.has(d)) d = addDays(d, -1); // šiandiena dar nesibaigė – serija nenutrūko
    let n = 0;
    while (set.has(d)) { n++; d = addDays(d, -1); }
    return n;
  }

  function longestRun(dates) {
    let best = 0;
    let run = 0;
    let prev = null;
    dates.forEach((d) => {
      run = prev && addDays(prev, 1) === d ? run + 1 : 1;
      best = Math.max(best, run);
      prev = d;
    });
    return best;
  }

  function stats() {
    const xp = totalXp();
    const li = levelInfo(xp);
    let tasksDone = 0;
    let earlyBird = false;
    Object.values(state.completions).forEach((day) => Object.values(day).forEach((c) => {
      tasksDone++;
      if (new Date(c.at).getHours() < 7) earlyBird = true;
    }));
    const dd = doneDates();
    const bonusDates = state.xpLog.filter((l) => l.kind === 'bonus').map((l) => l.date).sort();
    return {
      totalXp: xp,
      level: li.level,
      levelInfo: li,
      streak: currentStreak(),
      streakToday: !!(state.completions[today()] && Object.keys(state.completions[today()]).length),
      longestStreak: longestRun(dd),
      tasksDone,
      activeDays: new Set([...state.activeDays, ...dd]).size,
      perfectRun: longestRun(bonusDates),
      earlyBird,
    };
  }

  // ---------- įpročių statistika ----------
  function habitHistory(task, days = 7) {
    const t = today();
    const out = [];
    for (let i = days - 1; i >= 0; i--) {
      const k = addDays(t, -i);
      out.push({
        key: k,
        wd: weekday(k),
        scheduled: task.days.includes(weekday(k)) && (!task.createdKey || task.createdKey <= k),
        done: !!(state.completions[k] && state.completions[k][task.id]),
        isToday: k === t,
      });
    }
    return out;
  }

  function habitStreak(task) {
    let d = today();
    let n = 0;
    const done = (k) => !!(state.completions[k] && state.completions[k][task.id]);
    if (task.days.includes(weekday(d)) && !done(d)) d = addDays(d, -1);
    for (let i = 0; i < 2000; i++) {
      if (task.createdKey && d < task.createdKey) break;
      if (task.days.includes(weekday(d))) {
        if (done(d)) n++;
        else break;
      }
      d = addDays(d, -1);
    }
    return n;
  }

  // ---------- pasiekimai ----------
  function checkAchievements() {
    const s = stats();
    const unlocked = [];
    C.ACHIEVEMENTS.forEach((a) => {
      if (!state.achievements[a.id] && a.check(s)) {
        state.achievements[a.id] = new Date().toISOString();
        unlocked.push(a);
        notify(a.icon, `Naujas pasiekimas: ${a.name}`, a.text);
      }
    });
    return unlocked;
  }

  // ---------- pranešimai ----------
  function notify(icon, title, text) {
    state.notifications.unshift({ id: uid(), at: new Date().toISOString(), icon, title, text, read: false });
    state.notifications = state.notifications.slice(0, 50);
  }
  const unreadCount = () => state.notifications.filter((n) => !n.read).length;
  function markAllRead() {
    if (!unreadCount()) return;
    state.notifications.forEach((n) => { n.read = true; });
    commit();
  }

  // ---------- draugai (profilio kodas) ----------
  const CODE_PREFIX = 'LU1';
  function b64urlEncode(str) {
    const bytes = new TextEncoder().encode(str);
    let bin = '';
    bytes.forEach((b) => { bin += String.fromCharCode(b); });
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function b64urlDecode(s) {
    const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4));
    return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
  }
  function checksum(s) {
    let h = 7;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 46656;
    return h.toString(36).padStart(3, '0');
  }

  /** Mano profilio kodas: vardas, XP, lygis, serija, ilgiausia serija, atliktos užduotys, laikas. */
  function myCode() {
    const s = stats();
    const name = state.profile.name.replace(/\|/g, '/').slice(0, 30);
    const payload = [state.profile.id, name, s.totalXp, s.level, s.streak, s.longestStreak, s.tasksDone, Math.floor(Date.now() / 60000)].join('|');
    const body = b64urlEncode(payload);
    return `${CODE_PREFIX}-${body}-${checksum(body)}`;
  }

  function parseCode(raw) {
    const clean = String(raw || '').replace(/\s+/g, '');
    const m = clean.match(/LU1-([A-Za-z0-9_-]+)-([0-9a-z]{3})/);
    if (!m) throw new Error('Kodas neatpažintas. Patikrink, ar nukopijavai visą kodą.');
    if (checksum(m[1]) !== m[2]) throw new Error('Kodas sugadintas – trūksta simbolių.');
    const p = b64urlDecode(m[1]).split('|');
    if (p.length < 8) throw new Error('Kodas neatpažintas.');
    return {
      id: p[0], name: p[1], xp: Number(p[2]) || 0, level: Number(p[3]) || 1, streak: Number(p[4]) || 0,
      best: Number(p[5]) || 0, tasks: Number(p[6]) || 0, updatedAt: new Date(Number(p[7]) * 60000).toISOString(),
    };
  }

  function addFriend(raw) {
    const f = parseCode(raw);
    if (f.id === state.profile.id) throw new Error('Tai tavo paties kodas.');
    const existing = state.friends.find((x) => x.id === f.id);
    if (existing) Object.assign(existing, f);
    else state.friends.push({ ...f, addedAt: new Date().toISOString() });
    commit();
    return { friend: f, updated: !!existing };
  }
  function removeFriend(id) {
    state.friends = state.friends.filter((f) => f.id !== id);
    commit();
  }

  // ---------- eksportas / importas ----------
  function exportJson() {
    return JSON.stringify({ app: 'LEVEL UP', format: 1, exportedAt: new Date().toISOString(), state }, null, 2);
  }
  function importJson(text) {
    let data;
    try { data = JSON.parse(text); } catch (e) { throw new Error('Failas nėra tinkamas JSON.'); }
    const s = data && data.state;
    if (!s || !s.profile || !Array.isArray(s.tasks) || !Array.isArray(s.xpLog) || typeof s.completions !== 'object') {
      throw new Error('Šis failas nėra LEVEL UP atsarginė kopija.');
    }
    state = Object.assign(emptyState(), s);
    touchDay();
    syncBonus(today());
    commit();
    return flush();
  }
  async function resetAll() {
    await LU.db.clear();
    state = emptyState();
    subs.forEach((fn) => fn());
  }

  return {
    get state() { return state; },
    load, save, flush, commit, subscribe,
    createProfile, updateProfile, touchDay,
    dueTasks, addTask, updateTask, deleteTask, toggleTask, toggleImportant, syncBonus,
    totalXp, levelInfo, levelStartXp, titleFor, levelIcon, stats,
    habitHistory, habitStreak, checkAchievements,
    unreadCount, markAllRead,
    myCode, parseCode, addFriend, removeFriend,
    exportJson, importJson, resetAll,
    util: { today, dateKey, parseKey, addDays, weekday, uid },
  };
})();
