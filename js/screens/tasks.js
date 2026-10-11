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
          <span class="text-gold font-bold">+${t.xp} XP</span>
          ${status}
        </p>
      </button>
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
        <button data-action="add-task" data-type="${type}" class="w-full h-11 rounded-2xl border border-dashed border-line2 text-white/60 hover:text-gold hover:border-gold/40 text-sm font-semibold inline-flex items-center justify-center gap-2 transition">${icon('plus', 'w-4 h-4')} Pridėti</button>
      </div>
    </section>`;
  }

  function render() {
    const tasks = [...S.state.tasks].sort((a, b) => a.order - b.order);
    const habits = tasks.filter((t) => t.type === 'habit');
    const weekAgo = S.util.addDays(S.util.today(), -7);
    const once = tasks.filter((t) => t.type === 'once' && (!t.doneDate || t.doneDate >= weekAgo))
      .sort((a, b) => (!!a.doneDate - !!b.doneDate) || (a.date < b.date ? -1 : 1));
    return `
    <section class="flex items-end justify-between gap-4 mb-6 lg:mb-8">
      <div>
        <p class="eyebrow text-gold">Valdymas</p>
        <h1 class="mt-2 text-[30px] sm:text-4xl lg:text-5xl font-black tracking-tight uppercase leading-none">Užduotys</h1>
      </div>
      <button data-action="add-task" class="btn-gold h-12 px-5 shrink-0">${icon('plus', 'w-5 h-5')}<span>Nauja</span></button>
    </section>
    <div class="grid lg:grid-cols-2 gap-4 lg:gap-6 items-start">
      ${section('Įpročiai', 'repeat', habits, 'Pasikartojančios užduotys tam tikromis savaitės dienomis. Jos kasdien atsinaujina.', 'habit')}
      ${section('Vienkartinės', 'circle-check', once, 'Vienkartinės užduotys skirtos konkrečiai dienai. Neatliktos persikelia į kitą dieną.', 'once')}
    </div>
    <p class="mt-6 text-sm text-muted flex items-start gap-2">${icon('info', 'w-4 h-4 mt-0.5 shrink-0')} Ištrynus užduotį, jau uždirbtas XP ir istorija išlieka.</p>`;
  }

  // ---------- Forma ----------
  function openForm(task, preset = {}) {
    const today = S.util.today();
    const f = task
      ? { ...task, days: [...task.days], date: task.date || today }
      : { title: '', note: '', icon: 'target', xp: 10, type: preset.type || 'habit', days: [1, 2, 3, 4, 5, 6, 7], date: today };
    if (!C.XP_CHOICES.includes(f.xp)) f.custom = true;

    const html = `
      ${modalHeader(task ? 'Redaguoti užduotį' : 'Nauja užduotis', 'list-todo')}
      <form class="px-5 sm:px-6 pb-6 space-y-6" novalidate>
        <div class="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-well border border-line" role="tablist">
          <button type="button" data-type="habit" class="seg justify-center !h-11 !rounded-xl">${icon('repeat', 'w-4 h-4')} Įprotis</button>
          <button type="button" data-type="once" class="seg justify-center !h-11 !rounded-xl">${icon('circle-check', 'w-4 h-4')} Vienkartinė</button>
        </div>

        <div>
          <label class="label" for="tf-title">Pavadinimas</label>
          <input id="tf-title" name="title" class="field" maxlength="60" placeholder="pvz. Ryto bėgimas" value="${esc(f.title)}" autofocus>
          <p data-err class="hidden mt-2 text-sm text-red-400">Įrašyk pavadinimą.</p>
        </div>

        <div>
          <label class="label" for="tf-note">Trukmė / pastaba <span class="normal-case tracking-normal font-medium text-dim">(nebūtina)</span></label>
          <input id="tf-note" name="note" class="field" maxlength="30" placeholder="pvz. 10 min" value="${esc(f.note)}">
        </div>

        <div>
          <span class="label">XP vertė</span>
          <div class="grid grid-cols-5 gap-2" data-xp>
            ${C.XP_CHOICES.map((x) => `<button type="button" data-xp-val="${x}" class="xp-opt h-12 rounded-2xl border font-extrabold tabular-nums transition">${x}</button>`).join('')}
            <input type="number" min="1" max="500" inputmode="numeric" data-xp-custom class="field !h-12 !px-1 text-center font-extrabold placeholder:text-sm placeholder:font-semibold" placeholder="Kita" value="${f.custom ? f.xp : ''}">
          </div>
        </div>

        <div data-days-wrap>
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

        <div data-date-wrap>
          <label class="label" for="tf-date">Data</label>
          <input id="tf-date" type="date" class="field" value="${f.date}" min="${today}">
        </div>

        <div>
          <span class="label">Ikona</span>
          <div class="grid grid-cols-7 sm:grid-cols-8 gap-1.5 max-h-[188px] overflow-y-auto pr-1 no-scrollbar" data-icons>
            ${C.TASK_ICONS.map((n) => `<button type="button" data-icon="${n}" aria-label="${n}" class="icon-opt aspect-square rounded-xl border grid place-items-center transition">${icon(n, 'w-5 h-5')}</button>`).join('')}
          </div>
        </div>

        <div class="flex gap-3 pt-1">
          ${task ? `<button type="button" data-del class="btn-ghost !px-4 text-red-400" aria-label="Ištrinti">${icon('trash-2', 'w-5 h-5')}</button>` : ''}
          <button type="submit" class="btn-gold flex-1">${icon('check', 'w-5 h-5', 2.5)} ${task ? 'Išsaugoti' : 'Sukurti užduotį'}</button>
        </div>
      </form>`;

    modal(html, {
      onMount: (el, close) => {
        const form = el.querySelector('form');
        const on = 'bg-gold/15 border-gold/60 text-gold';
        const off = 'bg-well border-line text-white/70';
        const setCls = (b, active) => { b.className = b.className.replace(/\b(bg-gold\/15|border-gold\/60|text-gold|bg-well|border-line|text-white\/70)\b/g, '').trim() + ' ' + (active ? on : off); };

        function paint() {
          el.querySelectorAll('[data-type]').forEach((b) => b.classList.toggle('active', b.dataset.type === f.type));
          el.querySelector('[data-days-wrap]').classList.toggle('hidden', f.type !== 'habit');
          el.querySelector('[data-date-wrap]').classList.toggle('hidden', f.type !== 'once');
          el.querySelectorAll('[data-xp-val]').forEach((b) => setCls(b, !f.custom && Number(b.dataset.xpVal) === f.xp));
          el.querySelector('[data-xp-custom]').classList.toggle('!border-gold/60', !!f.custom);
          el.querySelectorAll('[data-day]').forEach((b) => setCls(b, f.days.includes(Number(b.dataset.day))));
          el.querySelectorAll('[data-icon]').forEach((b) => setCls(b, b.dataset.icon === f.icon));
        }
        paint();
        // pažymėtą ikoną parodom sąraše, neslinkdami viso modalo
        const sel = el.querySelector(`[data-icon="${f.icon}"]`);
        const grid = el.querySelector('[data-icons]');
        if (sel && task) grid.scrollTop = sel.offsetTop - grid.offsetTop - 6;

        el.addEventListener('click', (e) => {
          const b = e.target.closest('button');
          if (!b) return;
          if (b.dataset.type && b.closest('[role=tablist]')) f.type = b.dataset.type;
          else if (b.dataset.xpVal) { f.xp = Number(b.dataset.xpVal); f.custom = false; el.querySelector('[data-xp-custom]').value = ''; }
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
        el.querySelector('[data-xp-custom]').addEventListener('input', (e) => {
          const v = parseInt(e.target.value, 10);
          if (v > 0) { f.xp = Math.min(500, v); f.custom = true; } else { f.custom = false; f.xp = 10; }
          paint();
        });

        form.addEventListener('submit', (e) => {
          e.preventDefault();
          f.title = el.querySelector('#tf-title').value.trim();
          f.note = el.querySelector('#tf-note').value.trim();
          f.date = el.querySelector('#tf-date').value || today;
          const titleErr = !f.title;
          const daysErr = f.type === 'habit' && !f.days.length;
          el.querySelector('[data-err]').classList.toggle('hidden', !titleErr);
          el.querySelector('[data-days-err]').classList.toggle('hidden', !daysErr);
          if (titleErr) { el.querySelector('#tf-title').focus(); return; }
          if (daysErr) return;
          if (task) {
            S.updateTask(task.id, f);
            toast('Užduotis atnaujinta', { icon: 'check' });
          } else {
            S.addTask(f);
            toast(f.type === 'habit' ? 'Įprotis sukurtas' : 'Užduotis sukurta', { icon: 'plus' });
          }
          close();
        });
      },
    });
  }

  async function askDelete(task) {
    const ok = await confirm({
      title: 'Ištrinti užduotį?',
      text: `„<b class="text-white">${esc(task.title)}</b>" bus ištrinta. Jau uždirbtas XP liks.`,
      confirmLabel: 'Ištrinti',
      danger: true,
      icon: 'trash-2',
    });
    if (ok) {
      S.deleteTask(task.id);
      toast('Užduotis ištrinta', { icon: 'trash-2' });
    }
  }

  LU.actions['add-task'] = (el) => openForm(null, { type: el.dataset.type });
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
