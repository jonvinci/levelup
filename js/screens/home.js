// 1. PAGRINDINIS: šiandienos misijos, statistika, įpročiai.
window.LU = window.LU || {};
LU.screens = LU.screens || {};

LU.screens.home = (() => {
  const { icon, esc, fmt, time, scheduleText, dayLabel } = LU.ui;
  const S = LU.store;

  function levelCard(st) {
    const li = st.levelInfo;
    return `
    <a href="#/lygiai" class="card card-pad block h-full">
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="text-sm text-muted">Lygis ${li.level}</p>
          <h2 class="mt-0.5 text-xl font-semibold">${esc(li.title.name)}</h2>
        </div>
        <span class="text-sm text-muted tabular-nums">${li.max ? fmt(li.xp) : `${fmt(li.into)} / ${fmt(li.need)}`} XP</span>
      </div>
      <div class="bar mt-4"><i style="width:${li.pct}%"></i></div>
      <p class="mt-2.5 text-sm text-muted">${li.max ? 'Aukščiausias lygis' : `Dar ${fmt(li.remaining)} XP iki ${li.level + 1} lygio`}</p>
    </a>`;
  }

  function stats(st) {
    const cell = (value, label) => `
      <div class="px-1 text-center">
        <div class="text-xl font-semibold tabular-nums leading-none">${value}</div>
        <div class="mt-1.5 text-xs text-muted">${label}</div>
      </div>`;
    return `
    <div class="card h-full grid grid-cols-4 items-center divide-x divide-line py-4">
      ${cell(fmt(st.totalXp), 'XP')}
      ${cell(`<span class="inline-flex items-center gap-1">${st.streak ? `<span class="text-flame">${icon('flame', 'w-4 h-4')}</span>` : ''}${st.streak}</span>`, 'Serija')}
      ${cell(fmt(st.tasksDone), 'Atlikta')}
      ${cell(st.activeDays, 'Dienos')}
    </div>`;
  }

  /** Apskritas žymimasis langelis (bendras užduotims ir įpročiams). */
  const check = (done) => `<span class="chk w-[22px] h-[22px] rounded-full grid place-items-center shrink-0 ${done ? 'bg-gold text-black' : 'border-[1.5px] border-white/25'}">${done ? icon('check', 'w-3.5 h-3.5', 3) : ''}</span>`;

  function missionRow(d) {
    const t = d.task;
    const just = LU.app.justToggled === t.id;
    return `
    <li>
      <button data-action="toggle" data-id="${t.id}" class="mission ${d.done ? 'done' : ''} ${just ? 'just' : ''} w-full flex items-center gap-3 py-3 text-left" aria-pressed="${d.done}">
        ${check(d.done)}
        <span class="flex-1 min-w-0">
          <span class="m-title block leading-snug">${esc(t.title)}${t.note ? `<span class="text-muted"> · ${esc(t.note)}</span>` : ''}</span>
          ${d.carried ? `<span class="block text-xs text-muted mt-0.5">Perkelta iš ${dayLabel(t.date).toLowerCase()}</span>` : ''}
        </span>
        <span class="shrink-0 text-xs text-muted tabular-nums">${d.done ? time(d.doneAt) : `+${t.xp} XP`}</span>
      </button>
    </li>`;
  }

  function missions() {
    // Dienos pažanga ir premija skaičiuojamos iš visko (užduotys + šiandienos įpročiai),
    // bet sąraše rodomos tik vienkartinės užduotys – įpročiai yra „Mano įpročiai" kortelėje.
    const all = S.dueTasks();
    const due = all.filter((d) => d.task.type === 'once');
    const habitsDue = all.filter((d) => d.task.type === 'habit');
    const done = all.filter((d) => d.done).length;
    const pct = all.length ? Math.round((done / all.length) * 100) : 0;
    const allDone = all.length && done === all.length;
    const cnt = (list) => `${list.filter((d) => d.done).length}/${list.length}`;
    return `
    <section class="card card-pad">
      <div class="flex items-baseline justify-between gap-3">
        <h2 class="h-section">Šiandienos misijos</h2>
        <span class="text-sm text-muted tabular-nums">${done}/${all.length} · ${pct} %</span>
      </div>
      <div class="bar mt-3"><i style="width:${pct}%"></i></div>
      <p class="mt-2.5 text-xs text-muted">
        ${allDone
          ? `<span class="text-gold">Visos užduotys atliktos. Šaunuolis! +${LU.config.ALL_DONE_BONUS} XP</span>`
          : `Užduotys ${cnt(due)} · <button data-action="scroll-habits" class="hover:text-white">Įpročiai ${cnt(habitsDue)}</button>${all.length ? ` · Už viską +${LU.config.ALL_DONE_BONUS} XP` : ''}`}
      </p>
      ${due.length
        ? `<ul class="mt-2 divide-y divide-line">${due.map(missionRow).join('')}</ul>`
        : '<p class="mt-4 text-sm text-muted">Šiandien vienkartinių užduočių nėra.</p>'}
      <button data-action="add-task" data-type="once" data-lock="1" class="link mt-3">${icon('plus', 'w-4 h-4')} Pridėti užduotį</button>
    </section>`;
  }

  function habitRow(t) {
    const hist = S.habitHistory(t, 7);
    const streak = S.habitStreak(t);
    const doneToday = hist[hist.length - 1].done;
    const WD = LU.config.WEEKDAYS;
    const just = LU.app.justToggled === t.id;
    // Visa eilutė – mygtukas: paspaudus įprotis pažymimas atliktu šiandien (arba atšaukiamas)
    return `
    <button data-action="toggle" data-id="${t.id}" class="mission ${just ? 'just' : ''} w-full flex items-center gap-3 py-3 text-left" aria-pressed="${doneToday}" aria-label="${esc(t.title)} – ${doneToday ? 'atlikta šiandien' : 'pažymėti atlikta šiandien'}">
      ${check(doneToday)}
      <span class="flex-1 min-w-0">
        <span class="block truncate ${doneToday ? 'text-white/50' : ''}">${esc(t.title)}${t.note ? `<span class="text-muted"> · ${esc(t.note)}</span>` : ''}</span>
        <span class="block mt-0.5 text-xs text-muted truncate">${scheduleText(t.days)} · ${t.xp} XP</span>
      </span>
      <span class="flex gap-1" aria-label="Paskutinės 7 dienos">
        ${hist.map((h) => `<span title="${WD[h.wd - 1].long}" class="block w-1.5 h-1.5 rounded-full ${h.done ? 'bg-gold' : h.scheduled ? 'bg-white/20' : 'bg-white/[0.06]'}"></span>`).join('')}
      </span>
      <span class="w-8 shrink-0 text-right text-sm tabular-nums ${streak ? 'text-flame' : 'text-dim'}">${streak}</span>
    </button>`;
  }

  function habits() {
    const list = S.state.tasks.filter((t) => t.type === 'habit').sort((a, b) => a.order - b.order);
    return `
    <section id="habits-card" class="card card-pad scroll-mt-20">
      <div class="flex items-baseline justify-between gap-3">
        <h2 class="h-section">Mano įpročiai</h2>
        <button data-action="manage-habits" class="text-sm text-gold">Valdyti</button>
      </div>
      ${list.length
        ? `<div class="mt-2 divide-y divide-line">${list.map(habitRow).join('')}</div>`
        : '<p class="mt-4 text-sm text-muted">Įpročių dar nėra.</p>'}
    </section>`;
  }

  function render() {
    const st = S.stats();
    return `
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-5">
      <div class="lg:col-span-7">${levelCard(st)}</div>
      <div class="lg:col-span-5">${stats(st)}</div>
      <div class="lg:col-span-7 lg:self-start">${missions()}</div>
      <div class="lg:col-span-5 lg:self-start">${habits()}</div>
    </div>`;
  }

  LU.actions['scroll-habits'] = () => {
    const el = document.getElementById('habits-card');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return { render };
})();
