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
    if (t.type === 'habit') {
      const streak = S.habitStreak(t);
      meta = scheduleText(t.days) + (streak ? ` · serija ${streak}` : '');
    } else if (t.doneDate) {
      meta = `Atlikta ${dayLabel(t.doneDate).toLowerCase()}`;
    } else {
      meta = t.date < today ? `Vėluoja · ${dayLabel(t.date).toLowerCase()}` : dayLabel(t.date);
    }
    return `
    <div class="flex items-center gap-3 pl-4 pr-2 py-3 ${t.doneDate ? 'opacity-50' : ''}">
      <span class="text-white/45 shrink-0">${icon(t.icon, 'w-[18px] h-[18px]', 1.75)}</span>
      <button data-action="edit-task" data-id="${t.id}" class="flex-1 min-w-0 text-left">
        <p class="truncate ${t.doneDate ? 'line-through' : ''}">${esc(t.title)}${t.note ? `<span class="text-muted"> · ${esc(t.note)}</span>` : ''}</p>
        <p class="text-xs text-muted mt-0.5 truncate">${meta} · ${t.xp} XP</p>
      </button>
      <button data-action="edit-task" data-id="${t.id}" class="icon-btn" aria-label="Redaguoti">${icon('pencil', 'w-4 h-4', 1.75)}</button>
      <button data-action="delete-task" data-id="${t.id}" class="icon-btn hover:!text-red-400" aria-label="Ištrinti">${icon('trash-2', 'w-4 h-4', 1.75)}</button>
    </div>`;
  }

  function render() {
    const tasks = [...S.state.tasks].sort((a, b) => a.order - b.order);
    const weekAgo = S.util.addDays(S.util.today(), -7);
    const once = tasks.filter((t) => t.type === 'once' && (!t.doneDate || t.doneDate >= weekAgo))
      .sort((a, b) => (!!a.doneDate - !!b.doneDate) || (a.date < b.date ? -1 : 1));
    return `
    <div class="max-w-2xl">
      <div class="flex items-center justify-between gap-4 mb-5">
        <h1 class="page-title">Užduotys</h1>
        <button data-action="add-task" data-type="once" data-lock="1" class="btn-gold btn-sm">${icon('plus', 'w-4 h-4')} Nauja</button>
      </div>
      ${once.length
        ? `<div class="list-group">${once.map(row).join('')}</div>`
        : '<p class="text-sm text-muted">Vienkartinių užduočių nėra. Neatliktos užduotys persikelia į kitą dieną.</p>'}
      <button data-action="manage-habits" class="link mt-5">${icon('repeat', 'w-4 h-4')} Valdyti įpročius</button>
    </div>`;
  }

  // ---------- Forma ----------
  function openForm(task, preset = {}) {
    const today = S.util.today();
    const f = task
      ? { ...task, days: [...task.days], date: task.date || today }
      : { title: '', note: '', icon: 'target', xp: 10, type: preset.type || 'once', days: [1, 2, 3, 4, 5, 6, 7], date: today };
    if (!C.XP_CHOICES.includes(f.xp)) f.custom = true;
    // Tipas nustatomas pagal vietą, iš kur kuriama (misijos/užduotys – vienkartinė, įpročiai – įprotis)
    const isHabit = f.type === 'habit';

    const html = `
      ${modalHeader(task ? (isHabit ? 'Redaguoti įprotį' : 'Redaguoti užduotį') : (isHabit ? 'Naujas įprotis' : 'Nauja užduotis'))}
      <form class="px-5 sm:px-6 pb-6 space-y-5" novalidate>


        <div>
          <label class="label" for="tf-title">Pavadinimas</label>
          <input id="tf-title" name="title" class="field" maxlength="60" placeholder="pvz. Ryto bėgimas" value="${esc(f.title)}" autofocus>
          <p data-err class="hidden mt-2 text-sm text-red-400">Įrašyk pavadinimą.</p>
        </div>

        <div>
          <label class="label" for="tf-note">Trukmė / pastaba (nebūtina)</label>
          <input id="tf-note" name="note" class="field" maxlength="30" placeholder="pvz. 10 min" value="${esc(f.note)}">
        </div>

        <div>
          <span class="label">XP vertė</span>
          <div class="grid grid-cols-5 gap-2" data-xp>
            ${C.XP_CHOICES.map((x) => `<button type="button" data-xp-val="${x}" class="opt h-11 tabular-nums">${x}</button>`).join('')}
            <input type="number" min="1" max="500" inputmode="numeric" data-xp-custom class="field !h-11 !px-1 text-center font-semibold placeholder:text-sm placeholder:font-normal" placeholder="Kita" value="${f.custom ? f.xp : ''}">
          </div>
        </div>

        <div data-days-wrap>
          <div class="flex items-center justify-between mb-2">
            <span class="label !mb-0">Savaitės dienos</span>
            <div class="flex gap-3 text-xs text-muted">
              <button type="button" data-preset="1,2,3,4,5,6,7" class="hover:text-white">Kasdien</button>
              <button type="button" data-preset="1,2,3,4,5" class="hover:text-white">Darbo d.</button>
              <button type="button" data-preset="6,7" class="hover:text-white">Savaitg.</button>
            </div>
          </div>
          <div class="grid grid-cols-7 gap-1.5">
            ${C.WEEKDAYS.map((d) => `<button type="button" data-day="${d.n}" title="${d.long}" class="opt h-10 text-sm">${d.short}</button>`).join('')}
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
            ${C.TASK_ICONS.map((n) => `<button type="button" data-icon="${n}" aria-label="${n}" class="opt aspect-square grid place-items-center">${icon(n, 'w-5 h-5', 1.75)}</button>`).join('')}
          </div>
        </div>

        <div class="flex gap-2.5 pt-1">
          ${task ? `<button type="button" data-del class="btn-ghost !px-4 text-red-400" aria-label="Ištrinti">${icon('trash-2', 'w-5 h-5', 1.75)}</button>` : ''}
          <button type="submit" class="btn-gold flex-1">${task ? (isHabit ? 'Išsaugoti įprotį' : 'Išsaugoti užduotį') : 'Sukurti'}</button>
        </div>
      </form>`;

    modal(html, {
      onMount: (el, close) => {
        const form = el.querySelector('form');
        const setCls = (b, active) => b.setAttribute('aria-pressed', active ? 'true' : 'false');

        function paint() {
          el.querySelector('[data-days-wrap]').classList.toggle('hidden', f.type !== 'habit');
          el.querySelector('[data-date-wrap]').classList.toggle('hidden', f.type !== 'once');
          el.querySelectorAll('[data-xp-val]').forEach((b) => setCls(b, !f.custom && Number(b.dataset.xpVal) === f.xp));
          el.querySelector('[data-xp-custom]').classList.toggle('!border-gold/50', !!f.custom);
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
          if (b.dataset.xpVal) { f.xp = Number(b.dataset.xpVal); f.custom = false; el.querySelector('[data-xp-custom]').value = ''; }
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
            toast(f.type === 'habit' ? 'Įprotis atnaujintas' : 'Užduotis atnaujinta', { icon: 'check' });
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
      title: task.type === 'habit' ? 'Ištrinti įprotį?' : 'Ištrinti užduotį?',
      text: `„${esc(task.title)}" bus ${task.type === 'habit' ? 'ištrintas' : 'ištrinta'}. Jau uždirbtas XP liks.`,
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
        ? `<div class="rounded-2xl bg-white/[0.03] divide-y divide-line">${habits.map(row).join('')}</div>`
        : '<p class="text-sm text-muted px-1">Įpročių dar nėra.</p>';
    };
    let unsub = null;
    modal(`
      ${modalHeader('Įpročiai')}
      <div class="px-4 sm:px-6 pb-6">
        <div data-habits>${body()}</div>
        <button data-action="add-task" data-type="habit" data-lock="1" class="btn-gold w-full mt-4">Naujas įprotis</button>
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
