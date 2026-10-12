// 1. PAGRINDINIS: šiandienos misijos, statistika, įpročiai.
window.LU = window.LU || {};
LU.screens = LU.screens || {};

LU.screens.home = (() => {
  const { icon, esc, fmt, ring, avatar, scheduleText, dayLabel } = LU.ui;
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

  /** „Svarbi" žvaigždutė: tuščia, pažymėjus – auksinė. Atlikimui ir XP įtakos neturi. */
  function star(on) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${on ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" class="w-[18px] h-[18px]" aria-hidden="true">${LU.ICONS.star}</svg>`;
  }

  /** Profilio kortelė (avataras su lygio žiedu, vardas, lygis) – Meniu viršuje. */
  function profileCard() {
    const p = S.state.profile;
    const li = S.levelInfo();
    return `
      <a href="#/profilis" class="card-gold flex items-center gap-5 p-5 sm:p-6 group">
        <span class="relative w-[92px] h-[92px] shrink-0">
          ${ring(li.pct, 92, 5)}
          <span class="absolute inset-[9px]">${avatar(p, 'w-full h-full text-2xl')}</span>
        </span>
        <span class="flex-1 min-w-0">
          <span class="block text-2xl font-extrabold truncate">${esc(p.name)}</span>
          <span class="block text-gold font-bold mt-0.5">Lygis ${li.level}</span>
          <span class="block text-muted text-sm mt-1">Peržiūrėti profilį</span>
        </span>
        <span class="text-gold group-hover:translate-x-1 transition">${icon('chevron-right', 'w-6 h-6')}</span>
      </a>`;
  }

  function missionRow(d) {
    const t = d.task;
    const just = LU.app.justToggled === t.id;
    // Visa eilutė pažymi atlikimą; žvaigždutė (atskiras mygtukas) – tik „svarbi"
    return `
    <li>
      <div role="button" tabindex="0" data-action="toggle" data-id="${t.id}" class="mission ${d.done ? 'done' : ''} ${just ? 'just' : ''} cursor-pointer w-full flex items-center gap-2.5 sm:gap-3 rounded-2xl border px-3 sm:px-4 py-3.5 text-left ${d.done ? 'bg-gold/[0.07] border-gold/25' : t.important ? 'bg-well border-gold/30' : 'bg-well border-line hover:border-line2'}" aria-pressed="${d.done}">
        <span class="chk w-7 h-7 rounded-full grid place-items-center shrink-0 ${d.done ? 'bg-gold text-black' : 'border-2 border-white/20'}">${d.done ? icon('check', 'w-4 h-4', 3) : ''}</span>
        <span class="flex-1 min-w-0">
          <span class="m-title block font-semibold leading-snug text-[15px] sm:text-base">${esc(t.title)}${t.note ? ` – ${esc(t.note)}` : ''}</span>
          ${d.carried ? `<span class="block text-xs text-flame mt-0.5">Perkelta iš ${dayLabel(t.date).toLowerCase()}</span>` : ''}
        </span>
        <button data-action="star" data-id="${t.id}" class="shrink-0 -m-1.5 p-1.5 rounded-lg ${t.important ? 'text-gold' : 'text-white/30 hover:text-white/60'}" aria-pressed="${!!t.important}" aria-label="${t.important ? 'Nebežymėti kaip svarbios' : 'Pažymėti kaip svarbią'}">${star(t.important)}</button>
      </div>
    </li>`;
  }

  let showFinished = false;

  function missions() {
    // Dienos pažanga ir premija skaičiuojamos iš visko (užduotys + šiandienos įpročiai),
    // bet sąraše rodomos tik vienkartinės užduotys – įpročiai yra „Mano įpročiai" kortelėje.
    const all = S.requiredDue();
    // svarbios (su žvaigždute) – viršuje, kitaip išlaikoma įprasta tvarka
    const due = all.filter((d) => d.task.type === 'once').sort((a, b) => !!b.task.important - !!a.task.important);
    const done = all.filter((d) => d.done).length;
    const allDone = all.length && done === all.length;
    // atliktos misijos iš sąrašo dingsta; jas galima parodyti (ir atšaukti) per „Atliktos šiandien"
    const open = due.filter((d) => !d.done);
    const finished = due.filter((d) => d.done);
    return `
    <section class="card card-pad">
      <div class="flex items-center gap-3">
        <div class="icon-box w-11 h-11 sm:w-12 sm:h-12 ${allDone ? 'text-gold' : 'text-flame'}">${icon('flame', 'w-6 h-6')}</div>
        <h2 class="flex-1 min-w-0 text-[19px] sm:text-2xl font-extrabold leading-tight">Šiandienos misijos</h2>
      </div>
      ${allDone ? `<p class="mt-4 text-gold font-semibold flex items-center gap-2">Visos užduotys atliktos. Šaunuolis! <span class="pill-outline text-[10px] py-0.5">+${LU.config.ALL_DONE_BONUS} XP</span></p>` : ''}
      ${open.length ? `<ul class="mt-4 space-y-2.5">${open.map(missionRow).join('')}</ul>` : `
        <div class="mt-4 rounded-2xl border border-dashed border-line2 p-5 text-center">
          <p class="text-white/70 text-sm">${finished.length ? 'Visos šiandienos užduotys atliktos.' : 'Šiandien vienkartinių užduočių nėra.'}</p>
        </div>`}
      ${finished.length ? `
        <button data-action="toggle-finished" class="mt-3 inline-flex items-center gap-1.5 text-sm text-muted hover:text-white">
          ${icon(showFinished ? 'chevron-down' : 'chevron-right', 'w-4 h-4')} Atliktos šiandien (${finished.length})
        </button>
        ${showFinished ? `<ul class="mt-2.5 space-y-2.5">${finished.map(missionRow).join('')}</ul>` : ''}` : ''}
      <button data-action="add-task" data-type="once" data-lock="1" class="mt-4 w-full h-12 rounded-2xl border border-dashed border-line2 text-white/60 hover:text-gold hover:border-gold/40 font-semibold inline-flex items-center justify-center gap-2 transition">
        ${icon('plus', 'w-5 h-5')} Pridėti užduotį
      </button>
    </section>`;
  }

  function habitRow(t) {
    const hist = S.habitHistory(t, 7);
    const streak = S.habitStreak(t);
    const doneToday = hist[hist.length - 1].done;
    const just = LU.app.justToggled === t.id;
    // Visa eilutė – mygtukas: paspaudus įprotis pažymimas atliktu šiandien (arba atšaukiamas)
    return `
    <button data-action="toggle" data-id="${t.id}" class="mission ${just ? 'just' : ''} w-full flex items-center gap-2.5 sm:gap-3 py-3.5 text-left rounded-xl" aria-pressed="${doneToday}" aria-label="${esc(t.title)} – ${doneToday ? 'atlikta šiandien, paspausk, kad atšauktum' : 'pažymėti atlikta šiandien'}">
      <span class="chk w-8 h-8 rounded-full grid place-items-center shrink-0 ${doneToday ? 'bg-gold text-black' : 'border-2 border-white/20'}">${doneToday ? icon('check', 'w-4 h-4', 3) : ''}</span>
      <span class="flex-1 min-w-0">
        <span class="block font-semibold truncate ${doneToday ? 'text-white/60' : ''}">${esc(t.title)}${t.note ? `<span class="font-normal text-muted"> – ${esc(t.note)}</span>` : ''}</span>
        <span class="mt-0.5 flex items-center gap-1 text-xs text-muted min-w-0">${icon(t.icon, 'w-3.5 h-3.5 shrink-0')}<span class="truncate">${S.isAutoHabit(t) ? 'Automatiškai · svarbios užduotys' : `${scheduleText(t.days)} · ${LU.config.TASK_XP} XP`}</span></span>
      </span>
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
        ? `<div class="mt-3 divide-y divide-line">${list.map(habitRow).join('')}</div>`
        : `<p class="mt-5 text-muted text-sm">Įpročių dar nėra. Pridėk pasikartojančią užduotį ir sek savo seriją.</p>`}
    </section>`;
  }

  function render() {
    return `
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
      <div class="lg:col-span-12">${levelCard(S.stats())}</div>
      <div class="lg:col-span-7 lg:self-start">${missions()}</div>
      <div class="lg:col-span-5 lg:self-start">${habits()}</div>
    </div>`;
  }

  LU.actions['toggle-finished'] = () => { showFinished = !showFinished; LU.app.render(); };

  LU.actions.star = (el) => {
    const res = S.toggleImportant(el.dataset.id);
    if (!res) return;
    LU.ui.toast(res.important ? 'Pažymėta kaip svarbi' : 'Nebežymima kaip svarbi', { icon: 'star', ms: 1600 });
    LU.app.afterChange(res);
  };

  LU.actions['scroll-habits'] = () => {
    const el = document.getElementById('habits-card');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return { render, levelCard, profileCard };
})();
