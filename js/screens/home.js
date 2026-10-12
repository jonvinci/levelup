// 1. PAGRINDINIS: šiandienos misijos, statistika, įpročiai.
window.LU = window.LU || {};
LU.screens = LU.screens || {};

LU.screens.home = (() => {
  const { icon, esc, fmt, time, ring, scheduleText, dayLabel } = LU.ui;
  const S = LU.store;

  function levelCard(st) {
    const li = st.levelInfo;
    const next = LU.config.TITLES.find((t) => t.from > li.level);
    return `
    <a href="#/lygiai" class="card-gold h-full p-5 sm:p-6 lg:p-8 flex flex-col justify-center gap-7 group">
      <div class="flex items-center gap-5">
      <div class="relative w-[84px] h-[84px] sm:w-[96px] sm:h-[96px] shrink-0">
        <span class="sm:hidden">${ring(li.pct, 84, 5)}</span>
        <span class="hidden sm:block">${ring(li.pct, 96, 5)}</span>
        <div class="absolute inset-[13px] sm:inset-[15px] icon-box-gold rounded-2xl">${icon(S.levelIcon(li.level), 'w-7 h-7 sm:w-8 sm:h-8')}</div>
      </div>
      <div class="flex-1 min-w-0">
        <p class="eyebrow text-gold tracking-[0.25em]">Lygis ${li.level}</p>
        <h2 class="mt-1 text-2xl sm:text-[28px] font-extrabold leading-tight">${esc(li.title.name)}</h2>
        <p class="mt-1.5 text-sm text-muted">
          ${li.max ? 'Pasiekei aukščiausią lygį!' : `Dar <b class="text-gold">${fmt(li.remaining)} XP</b> iki ${li.level + 1} lygio`}
        </p>
      </div>
      <span class="text-gold group-hover:translate-x-1 transition">${icon('chevron-right', 'w-6 h-6')}</span>
      </div>
      <div class="hidden lg:block">
        <div class="flex items-center justify-between text-sm">
          <span class="text-muted tabular-nums">${fmt(li.xp)} / ${fmt(li.max ? li.xp : li.next)} XP</span>
          <b class="tabular-nums">${li.pct} %</b>
        </div>
        <div class="bar mt-2.5 h-3"><i style="width:${li.pct}%"></i></div>
        ${next ? `<div class="mt-5 flex items-center gap-3 rounded-2xl border border-line bg-black/20 px-4 py-3">
          <span class="text-white/40">${icon('lock', 'w-4 h-4')}</span>
          <span class="text-sm text-muted">Kitas titulas</span>
          <span class="ml-auto text-sm"><b class="text-white">${esc(next.name)}</b> <span class="text-muted">· ${next.from} lygis</span></span>
        </div>` : ''}
      </div>
    </a>`;
  }

  function missionRow(d) {
    const t = d.task;
    const just = LU.app.justToggled === t.id;
    return `
    <li>
      <button data-action="toggle" data-id="${t.id}" class="mission ${d.done ? 'done' : ''} ${just ? 'just' : ''} w-full flex items-center gap-2.5 sm:gap-3 rounded-2xl border px-3 sm:px-4 py-3.5 text-left ${d.done ? 'bg-gold/[0.07] border-gold/25' : 'bg-well border-line hover:border-line2'}" aria-pressed="${d.done}">
        <span class="chk w-7 h-7 rounded-full grid place-items-center shrink-0 ${d.done ? 'bg-gold text-black' : 'border-2 border-white/20'}">${d.done ? icon('check', 'w-4 h-4', 3) : ''}</span>
        <span class="flex-1 min-w-0">
          <span class="m-title block font-semibold leading-snug text-[15px] sm:text-base">${esc(t.title)}${t.note ? ` – ${esc(t.note)}` : ''}</span>
          ${d.carried ? `<span class="block text-xs text-flame mt-0.5">Perkelta iš ${dayLabel(t.date).toLowerCase()}</span>` : ''}
        </span>
        <span class="${d.done ? 'text-white/50' : 'text-white/60'} shrink-0">${icon(t.icon, 'w-[18px] h-[18px] sm:w-5 sm:h-5')}</span>
        ${d.done
          ? `<span class="shrink-0 inline-flex items-center gap-1 rounded-lg bg-gold/15 text-gold text-sm font-bold px-2 py-1 tabular-nums">${icon('check', 'w-3.5 h-3.5', 3)}${time(d.doneAt)}</span>`
          : `<span class="shrink-0 rounded-lg border border-gold/25 text-gold/90 text-xs font-bold px-2 py-1 tabular-nums">+${t.xp} XP</span>`}
      </button>
    </li>`;
  }

  function missions() {
    // Dienos pažanga ir premija skaičiuojamos iš visko (užduotys + šiandienos įpročiai),
    // bet sąraše rodomos tik vienkartinės užduotys – įpročiai yra „Mano įpročiai" kortelėje.
    const all = S.dueTasks();
    const due = all.filter((d) => d.task.type === 'once');
    const done = all.filter((d) => d.done).length;
    const allDone = all.length && done === all.length;
    return `
    <section class="card card-pad">
      <div class="flex items-center gap-3">
        <div class="icon-box w-11 h-11 sm:w-12 sm:h-12 ${allDone ? 'text-gold' : 'text-flame'}">${icon('flame', 'w-6 h-6')}</div>
        <h2 class="flex-1 min-w-0 text-[19px] sm:text-2xl font-extrabold leading-tight">Šiandienos misijos</h2>
      </div>
      ${allDone ? `<p class="mt-4 text-gold font-semibold flex items-center gap-2">Visos užduotys atliktos. Šaunuolis! <span class="pill-outline text-[10px] py-0.5">+${LU.config.ALL_DONE_BONUS} XP</span></p>` : ''}
      ${due.length ? `<ul class="mt-4 space-y-2.5">${due.map(missionRow).join('')}</ul>` : `
        <div class="mt-4 rounded-2xl border border-dashed border-line2 p-5 text-center">
          <p class="text-white/70 text-sm">Šiandien vienkartinių užduočių nėra.</p>
        </div>`}
      <button data-action="add-task" data-type="once" data-lock="1" class="mt-4 w-full h-12 rounded-2xl border border-dashed border-line2 text-white/60 hover:text-gold hover:border-gold/40 font-semibold inline-flex items-center justify-center gap-2 transition">
        ${icon('plus', 'w-5 h-5')} Pridėti užduotį
      </button>
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
    <button data-action="toggle" data-id="${t.id}" class="mission ${just ? 'just' : ''} w-full flex items-center gap-2.5 sm:gap-3 py-3.5 text-left rounded-xl" aria-pressed="${doneToday}" aria-label="${esc(t.title)} – ${doneToday ? 'atlikta šiandien, paspausk, kad atšauktum' : 'pažymėti atlikta šiandien'}">
      <span class="chk w-8 h-8 rounded-full grid place-items-center shrink-0 ${doneToday ? 'bg-gold text-black' : 'border-2 border-white/20'}">${doneToday ? icon('check', 'w-4 h-4', 3) : ''}</span>
      <span class="flex-1 min-w-0">
        <span class="block font-semibold truncate ${doneToday ? 'text-white/60' : ''}">${esc(t.title)}${t.note ? `<span class="font-normal text-muted"> – ${esc(t.note)}</span>` : ''}</span>
        <span class="mt-0.5 flex items-center gap-1 text-xs text-muted min-w-0">${icon(t.icon, 'w-3.5 h-3.5 shrink-0')}<span class="truncate">${scheduleText(t.days)} · ${t.xp} XP</span></span>
      </span>
      <div class="flex gap-[3px] sm:gap-1 items-end" aria-label="Paskutinės 7 dienos">
        ${hist.map((h) => `
          <span class="flex flex-col items-center gap-1" title="${WD[h.wd - 1].long}${h.scheduled ? (h.done ? ' – atlikta' : ' – neatlikta') : ' – nesuplanuota'}">
            <span class="block w-[7px] sm:w-2 h-5 rounded-full ${h.done ? 'bg-gold' : h.scheduled ? (h.isToday ? 'bg-white/10 ring-1 ring-gold/60' : 'bg-white/10') : 'bg-transparent border border-white/10'}"></span>
            <span class="text-[9px] leading-none ${h.isToday ? 'text-gold font-bold' : 'text-dim'}">${WD[h.wd - 1].short.charAt(0)}</span>
          </span>`).join('')}
      </div>
      <div class="w-9 sm:w-11 shrink-0 flex items-center justify-end gap-0.5 font-extrabold tabular-nums ${streak ? 'text-flame' : 'text-dim'}">
        ${icon('flame', 'w-4 h-4')}${streak}
      </div>
    </button>`;
  }

  function habits() {
    const list = S.state.tasks.filter((t) => t.type === 'habit').sort((a, b) => a.order - b.order);
    return `
    <section id="habits-card" class="card card-pad scroll-mt-24">
      <div class="flex items-center gap-3">
        <div class="icon-box-gold w-12 h-12">${icon('repeat', 'w-6 h-6')}</div>
        <h2 class="flex-1 text-xl sm:text-2xl font-extrabold">Mano įpročiai</h2>
        <button data-action="manage-habits" class="text-gold font-bold text-sm inline-flex items-center gap-1">Valdyti ${icon('chevron-right', 'w-4 h-4')}</button>
      </div>
      ${list.length
        ? `<p class="mt-3 text-xs text-muted">Paspausk įprotį, kad pažymėtum jį atliktu šiandien.</p>
           <div class="mt-1 divide-y divide-line">${list.map(habitRow).join('')}</div>`
        : `<p class="mt-5 text-muted text-sm">Įpročių dar nėra. Pridėk pasikartojančią užduotį ir sek savo seriją.</p>`}
    </section>`;
  }

  function render() {
    const st = S.stats();
    return `
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
      <div class="lg:col-span-12">${levelCard(st)}</div>
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
