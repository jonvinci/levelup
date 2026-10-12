// 4. UŽDUOTYS: įpročių ir vienkartinių užduočių valdymas + forma.
window.LU = window.LU || {};
LU.screens = LU.screens || {};

LU.screens.tasks = (() => {
  const { icon, esc, scheduleText, dayLabel, modal, modalHeader, confirm, toast } = LU.ui;
  const S = LU.store;
  const C = LU.config;

  function row(t) {
    const today = S.util.today();
    let meta;
    let status = '';
    if (t.type === 'habit') {
      meta = scheduleText(t.days);
      const streak = S.habitStreak(t);
      if (streak) status = `<span class="inline-flex items-center gap-0.5 text-flame font-bold">${icon('flame', 'w-3.5 h-3.5')}${streak}</span>`;
    } else if (t.doneDate) {
      meta = `Atlikta ${dayLabel(t.doneDate).toLowerCase()}`;
    } else {
      meta = t.date < today ? `Vėluoja · ${dayLabel(t.date).toLowerCase()}` : dayLabel(t.date);
    }
    return `
    <div class="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 ${t.doneDate ? 'opacity-60' : ''}">
      <div class="icon-box w-11 h-11 text-white/80">${icon(t.icon, 'w-5 h-5')}</div>
      <button data-action="edit-task" data-id="${t.id}" class="flex-1 min-w-0 text-left">
        <p class="font-semibold truncate ${t.doneDate ? 'line-through' : ''}">${esc(t.title)}${t.note ? `<span class="text-muted font-normal"> – ${esc(t.note)}</span>` : ''}</p>
        <p class="text-xs text-muted mt-1 flex items-center gap-2 flex-wrap">
          <span class="${t.type === 'once' && !t.doneDate && t.date < today ? 'text-flame' : ''}">${meta}</span>
          <span class="text-gold font-bold">+${C.TASK_XP} XP</span>
          ${status}
        </p>
      </button>
      ${t.type === 'once' && !t.doneDate ? `<button data-action="star" data-id="${t.id}" class="icon-btn w-10 h-10 ${t.important ? '!text-gold' : ''}" aria-pressed="${!!t.important}" aria-label="${t.important ? 'Nebežymėti kaip svarbios' : 'Pažymėti kaip svarbią'}"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${t.important ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" class="w-4 h-4">${LU.ICONS.star}</svg></button>` : ''}
      <button data-action="edit-task" data-id="${t.id}" class="icon-btn w-10 h-10" aria-label="Redaguoti">${icon('pencil', 'w-4 h-4')}</button>
      <button data-action="delete-task" data-id="${t.id}" class="icon-btn w-10 h-10 hover:text-red-400" aria-label="Ištrinti">${icon('trash-2', 'w-4 h-4')}</button>
    </div>`;
  }

  function section(title, iconName, items, empty, type) {
    return `
    <section class="card overflow-hidden">
      <div class="flex items-center gap-3 px-5 sm:px-6 pt-5 sm:pt-6 pb-4">
        <div class="icon-box-gold w-11 h-11">${icon(iconName, 'w-5 h-5')}</div>
        <h2 class="flex-1 text-xl font-extrabold">${title}</h2>
        <span class="text-muted font-semibold tabular-nums">${items.length}</span>
      </div>
      ${items.length ? `<div class="divide-y divide-line border-t border-line">${items.map(row).join('')}</div>`
        : `<p class="px-6 pb-6 text-sm text-muted">${empty}</p>`}
      <div class="px-5 sm:px-6 pb-5 pt-1">
        <button data-action="add-task" data-type="${type}" data-lock="1" class="w-full h-11 rounded-2xl border border-dashed border-line2 text-white/60 hover:text-gold hover:border-gold/40 text-sm font-semibold inline-flex items-center justify-center gap-2 transition">${icon('plus', 'w-4 h-4')} Pridėti</button>
      </div>
    </section>`;
  }

  function render() {
    const tasks = [...S.state.tasks].sort((a, b) => a.order - b.order);
    const weekAgo = S.util.addDays(S.util.today(), -7);
    const once = tasks.filter((t) => t.type === 'once' && (!t.doneDate || t.doneDate >= weekAgo))
      .sort((a, b) => (!!a.doneDate - !!b.doneDate) || (a.date < b.date ? -1 : 1));
    return `
    <section class="flex items-end justify-between gap-4 mb-6 lg:mb-8">
      <div>
        <p class="eyebrow text-gold">Valdymas</p>
        <h1 class="mt-2 text-[30px] sm:text-4xl lg:text-5xl font-black tracking-tight uppercase leading-none">Užduotys</h1>
      </div>
      <button data-action="add-task" data-type="once" data-lock="1" class="btn-gold h-12 px-5 shrink-0">${icon('plus', 'w-5 h-5')}<span>Nauja</span></button>
    </section>
    <div class="max-w-3xl">
      ${section('Vienkartinės užduotys', 'circle-check', once, 'Vienkartinės užduotys skirtos konkrečiai dienai. Neatliktos persikelia į kitą dieną.', 'once')}
      <p class="mt-6 text-sm text-muted flex items-start gap-2">${icon('info', 'w-4 h-4 mt-0.5 shrink-0')} Ištrynus užduotį, jau uždirbtas XP ir istorija išlieka.</p>
      <div class="mt-4 tile p-4 sm:p-5 flex items-center gap-4">
        <div class="icon-box-gold w-11 h-11">${icon('repeat', 'w-5 h-5')}</div>
        <p class="flex-1 text-sm text-white/80">Pasikartojantys įpročiai valdomi atskirai.</p>
        <button data-action="manage-habits" class="btn btn-sm border border-gold/40 bg-gold/10 text-gold hover:bg-gold/20">Įpročiai</button>
      </div>
    </div>`;
  }

  // ---------- Forma ----------
  function openForm(task, preset = {}) {
    const today = S.util.today();
    const f = task
      ? { ...task, days: [...task.days], date: task.date && task.date > today ? task.date : today }
      : { title: '', note: '', icon: 'target', type: preset.type || 'once', days: [1, 2, 3, 4, 5, 6, 7], date: today };
    // Tipas nustatomas pagal vietą, iš kur kuriama (misijos/užduotys – vienkartinė, įpročiai – įprotis).
    // Užduočiai – tik tekstas; įpročiui – dar trukmė, savaitės dienos ir ikona. XP visada vienodas (C.TASK_XP).
    const isHabit = f.type === 'habit';

    const html = `
      ${modalHeader(task ? (isHabit ? 'Redaguoti įprotį' : 'Redaguoti užduotį') : (isHabit ? 'Naujas įprotis' : 'Nauja užduotis'), isHabit ? 'repeat' : 'list-todo')}
      <form class="px-5 sm:px-6 pb-6 space-y-6" novalidate>
        <div>
          <label class="${isHabit ? 'label' : 'sr-only'}" for="tf-title">Pavadinimas</label>
          <input id="tf-title" name="title" class="field" maxlength="80" placeholder="${isHabit ? 'pvz. Ryto bėgimas' : 'Ką reikia padaryti?'}" value="${esc(f.title)}" autofocus enterkeyhint="done">
          <p data-err class="hidden mt-2 text-sm text-red-400">Įrašyk pavadinimą.</p>
        </div>
        ${!isHabit ? `
        <div class="grid grid-cols-2 gap-2" role="group" aria-label="Kada">
          <button type="button" data-when="today" class="day-opt h-11 rounded-xl border text-sm font-bold transition">Šiandien</button>
          <button type="button" data-when="tomorrow" class="day-opt h-11 rounded-xl border text-sm font-bold transition">Rytoj</button>
        </div>
        <button type="button" data-important class="day-opt w-full h-11 rounded-xl border text-sm font-bold transition inline-flex items-center justify-center gap-2">
          <span data-star-ico></span> Svarbi užduotis
        </button>` : ''}
        ${isHabit ? `
        <div>
          <label class="label" for="tf-note">Trukmė / pastaba <span class="normal-case tracking-normal font-medium text-dim">(nebūtina)</span></label>
          <input id="tf-note" name="note" class="field" maxlength="30" placeholder="pvz. 10 min" value="${esc(f.note)}">
        </div>

        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="label !mb-0">Savaitės dienos</span>
            <div class="flex gap-1.5 text-xs font-bold">
              <button type="button" data-preset="1,2,3,4,5,6,7" class="text-gold/80 hover:text-gold">Kasdien</button><span class="text-dim">·</span>
              <button type="button" data-preset="1,2,3,4,5" class="text-gold/80 hover:text-gold">Darbo d.</button><span class="text-dim">·</span>
              <button type="button" data-preset="6,7" class="text-gold/80 hover:text-gold">Savaitg.</button>
            </div>
          </div>
          <div class="grid grid-cols-7 gap-1.5">
            ${C.WEEKDAYS.map((d) => `<button type="button" data-day="${d.n}" title="${d.long}" class="day-opt h-11 rounded-xl border text-sm font-bold transition">${d.short}</button>`).join('')}
          </div>
          <p data-days-err class="hidden mt-2 text-sm text-red-400">Pasirink bent vieną dieną.</p>
        </div>

        <div>
          <span class="label">Ikona</span>
          <div class="grid grid-cols-7 sm:grid-cols-8 gap-1.5 max-h-[188px] overflow-y-auto pr-1 no-scrollbar" data-icons>
            ${C.TASK_ICONS.map((n) => `<button type="button" data-icon="${n}" aria-label="${n}" class="icon-opt aspect-square rounded-xl border grid place-items-center transition">${icon(n, 'w-5 h-5')}</button>`).join('')}
          </div>
        </div>` : ''}

        <div class="flex gap-3 pt-1">
          ${task ? `<button type="button" data-del class="btn-ghost !px-4 text-red-400" aria-label="Ištrinti">${icon('trash-2', 'w-5 h-5')}</button>` : ''}
          <button type="submit" class="btn-gold flex-1">${icon('check', 'w-5 h-5', 2.5)} ${task ? 'Išsaugoti' : (isHabit ? 'Sukurti' : 'Pridėti')}</button>
        </div>
      </form>`;

    modal(html, {
      onMount: (el, close) => {
        const form = el.querySelector('form');
        const on = 'bg-gold/15 border-gold/60 text-gold';
        const off = 'bg-well border-line text-white/70';
        const setCls = (b, active) => { b.className = b.className.replace(/\b(bg-gold\/15|border-gold\/60|text-gold|bg-well|border-line|text-white\/70)\b/g, '').trim() + ' ' + (active ? on : off); };

        const tomorrow = S.util.addDays(today, 1);
        function paint() {
          el.querySelectorAll('[data-when]').forEach((b) => setCls(b, (b.dataset.when === 'tomorrow') === (f.date === tomorrow)));
          const imp = el.querySelector('[data-important]');
          if (imp) {
            setCls(imp, !!f.important);
            imp.querySelector('[data-star-ico]').innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${f.important ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" class="w-[18px] h-[18px]">${LU.ICONS.star}</svg>`;
          }
          el.querySelectorAll('[data-day]').forEach((b) => setCls(b, f.days.includes(Number(b.dataset.day))));
          el.querySelectorAll('[data-icon]').forEach((b) => setCls(b, b.dataset.icon === f.icon));
        }
        paint();
        // pažymėtą ikoną parodom sąraše, neslinkdami viso modalo
        const sel = el.querySelector(`[data-icon="${f.icon}"]`);
        const grid = el.querySelector('[data-icons]');
        if (sel && grid && task) grid.scrollTop = sel.offsetTop - grid.offsetTop - 6;
        // užduočiai – iškart rašymui (ir telefone)
        if (!isHabit) setTimeout(() => el.querySelector('#tf-title').focus(), 80);

        el.addEventListener('click', (e) => {
          const b = e.target.closest('button');
          if (!b) return;
          if (b.dataset.when) f.date = b.dataset.when === 'tomorrow' ? tomorrow : today;
          else if (b.hasAttribute('data-important')) f.important = !f.important;
          else if (b.dataset.day) {
            const n = Number(b.dataset.day);
            f.days = f.days.includes(n) ? f.days.filter((x) => x !== n) : [...f.days, n].sort();
          } else if (b.dataset.preset) f.days = b.dataset.preset.split(',').map(Number);
          else if (b.dataset.icon) f.icon = b.dataset.icon;
          else if (b.hasAttribute('data-del')) {
            close();
            setTimeout(() => askDelete(task), 200);
            return;
          } else return;
          paint();
        });

        form.addEventListener('submit', (e) => {
          e.preventDefault();
          f.title = el.querySelector('#tf-title').value.trim();
          const note = el.querySelector('#tf-note');
          if (note) f.note = note.value.trim();
          const titleErr = !f.title;
          const daysErr = isHabit && !f.days.length;
          el.querySelector('[data-err]').classList.toggle('hidden', !titleErr);
          const de = el.querySelector('[data-days-err]');
          if (de) de.classList.toggle('hidden', !daysErr);
          if (titleErr) { el.querySelector('#tf-title').focus(); return; }
          if (daysErr) return;
          if (task) {
            S.updateTask(task.id, f);
            toast(isHabit ? 'Įprotis atnaujintas' : 'Užduotis atnaujinta', { icon: 'check' });
          } else {
            S.addTask(f);
            toast(isHabit ? 'Įprotis sukurtas' : f.date === tomorrow ? 'Užduotis pridėta rytojui' : 'Užduotis pridėta', { icon: 'plus' });
          }
          close();
        });
      },
    });
  }

  async function askDelete(task) {
    const ok = await confirm({
      title: task.type === 'habit' ? 'Ištrinti įprotį?' : 'Ištrinti užduotį?',
      text: `„<b class="text-white">${esc(task.title)}</b>" bus ${task.type === 'habit' ? 'ištrintas' : 'ištrinta'}. Jau uždirbtas XP liks.`,
      confirmLabel: 'Ištrinti',
      danger: true,
      icon: 'trash-2',
    });
    if (ok) {
      S.deleteTask(task.id);
      toast(task.type === 'habit' ? 'Įprotis ištrintas' : 'Užduotis ištrinta', { icon: 'trash-2' });
    }
  }

  LU.actions['add-task'] = (el) => openForm(null, { type: el.dataset.type, lock: !!el.dataset.lock });

  /** „Valdyti" prie „Mano įpročiai": įpročių valdymo langas tiesiog pagrindiniame ekrane. */
  function openHabitsManager() {
    const list = () => S.state.tasks.filter((t) => t.type === 'habit').sort((a, b) => a.order - b.order);
    const body = () => {
      const habits = list();
      return habits.length
        ? `<div class="list-group">${habits.map(row).join('')}</div>`
        : '<p class="text-sm text-muted px-1">Įpročių dar nėra. Pridėk pirmą ir sek savo seriją.</p>';
    };
    let unsub = null;
    modal(`
      ${modalHeader('Valdyti įpročius', 'repeat')}
      <div class="px-4 sm:px-6 pb-6">
        <div data-habits>${body()}</div>
        <button data-action="add-task" data-type="habit" data-lock="1" class="btn-gold w-full mt-4">${icon('plus', 'w-5 h-5')} Naujas įprotis</button>
        <p class="mt-4 text-xs text-muted flex items-start gap-2">${icon('info', 'w-4 h-4 shrink-0')} Pieštukas – redaguoti, šiukšliadėžė – ištrinti. Jau uždirbtas XP lieka.</p>
      </div>`, {
      wide: true,
      onMount: (el) => {
        // pasikeitus duomenims (redagavus, pridėjus, ištrynus) – atnaujinam sąrašą lange
        unsub = S.subscribe(() => { const box = el.querySelector('[data-habits]'); if (box) box.innerHTML = body(); });
      },
      onClose: () => { if (unsub) unsub(); },
    });
  }
  LU.actions['manage-habits'] = openHabitsManager;
  LU.actions['edit-task'] = (el) => {
    const t = S.state.tasks.find((x) => x.id === el.dataset.id);
    if (t) openForm(t);
  };
  LU.actions['delete-task'] = (el) => {
    const t = S.state.tasks.find((x) => x.id === el.dataset.id);
    if (t) askDelete(t);
  };

  return { render, openForm };
})();
