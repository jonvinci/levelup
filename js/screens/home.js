// 1. PAGRINDINIS: šiandienos misijos, statistika, įpročiai.
window.LU = window.LU || {};
LU.screens = LU.screens || {};

LU.screens.home = (() => {
  const { icon, esc, fmt, ring, avatar, dayLabel } = LU.ui;
  const S = LU.store;

  /** hex -> rgba() su nurodytu permatomumu. */
  function rgba(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }

  /** Lygio kortelė, nuspalvinta dabartinio titulo spalva (aukštesni titulai – ryškesni). */
  function levelCard(st) {
    const li = st.levelInfo;
    const T = LU.config.TITLES;
    const next = T.find((t) => t.from > li.level);
    const c = li.title.color || '#E8E1D5';
    const tier = Math.max(0, T.indexOf(li.title)) / (T.length - 1); // 0 – Naujokas, 1 – Čempionas
    const cardStyle = [
      `border:1px solid ${rgba(c, 0.25 + 0.2 * tier)}`,
      `background:radial-gradient(120% 140% at 0% 0%, ${rgba(c, 0.08 + 0.12 * tier)}, transparent 55%), linear-gradient(180deg, ${rgba(c, 0.04 + 0.04 * tier)}, rgba(18,18,20,1))`,
      tier > 0.85 ? `box-shadow:0 0 40px ${rgba(c, 0.18)}` : '',
    ].filter(Boolean).join(';');
    const boxStyle = `background:${rgba(c, 0.12)};border:1px solid ${rgba(c, 0.35)};color:${c}`;
    return `
    <div class="rounded-4xl h-full p-5 sm:p-6 lg:p-8 flex flex-col justify-center gap-7" style="${cardStyle}">
      <div class="flex items-center gap-5">
      <div class="relative w-[84px] h-[84px] sm:w-[96px] sm:h-[96px] shrink-0">
        <span class="sm:hidden">${ring(li.pct, 84, 5, 'rgba(255,255,255,0.08)', c)}</span>
        <span class="hidden sm:block">${ring(li.pct, 96, 5, 'rgba(255,255,255,0.08)', c)}</span>
        <div class="absolute inset-[17px] sm:inset-[14px] rounded-xl sm:rounded-2xl grid place-items-center" style="${boxStyle}">${LU.emblem(T.indexOf(li.title), 'w-[45px] h-[45px] sm:w-[62px] sm:h-[62px]')}</div>
      </div>
      <div class="flex-1 min-w-0">
        <p class="eyebrow tracking-[0.25em]" style="color:${c}">Lygis ${li.level}</p>
        <h2 class="mt-1 ${li.title.name.length > 11 ? 'text-[21px] sm:text-[26px]' : 'text-2xl sm:text-[28px]'} font-extrabold leading-tight truncate">${esc(li.title.name)}</h2>
        <p class="mt-1.5 text-sm text-muted">
          ${li.max ? 'Pasiekei aukščiausią lygį!' : `Dar <b style="color:${c}">${fmt(li.remaining)} XP</b> iki ${li.level + 1} lygio`}
        </p>
      </div>
      </div>
      <div class="hidden lg:block">
        <div class="flex items-center justify-between text-sm">
          <span class="text-muted tabular-nums">${fmt(li.xp)} / ${fmt(li.max ? li.xp : li.next)} XP</span>
          <b class="tabular-nums">${li.pct} %</b>
        </div>
        <div class="bar mt-2.5 h-3"><i style="width:${li.pct}%;background:${c}"></i></div>
        ${next ? `<div class="mt-5 flex items-center gap-3 rounded-2xl border border-line bg-black/20 px-4 py-3">
          <span class="text-white/40">${icon('lock', 'w-4 h-4')}</span>
          <span class="text-sm text-muted">Kitas titulas</span>
          <span class="ml-auto text-sm"><b class="text-white">${esc(next.name)}</b> <span class="text-muted">· ${next.from} lygis</span></span>
        </div>` : ''}
      </div>
    </div>`;
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

  function missions() {
    // Dienos pažanga ir premija skaičiuojamos iš visko (užduotys + šiandienos įpročiai),
    // bet sąraše rodomos tik vienkartinės užduotys – įpročiai žymimi „Įpročiai" lentelėje.
    const all = S.requiredDue();
    // svarbios (su žvaigždute) – viršuje, kitaip išlaikoma įprasta tvarka
    const due = all.filter((d) => d.task.type === 'once').sort((a, b) => !!b.task.important - !!a.task.important);
    const done = all.filter((d) => d.done).length;
    const allDone = all.length && done === all.length;
    // atliktos misijos iš sąrašo dingsta
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

      <button data-action="add-task" data-type="once" data-lock="1" class="mt-4 w-full h-12 rounded-2xl border border-dashed border-line2 text-white/60 hover:text-gold hover:border-gold/40 font-semibold inline-flex items-center justify-center gap-2 transition">
        ${icon('plus', 'w-5 h-5')} Pridėti užduotį
      </button>
    </section>`;
  }


  function render() {
    return `
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
      <div class="lg:col-span-12">${levelCard(S.stats())}</div>
      <div class="lg:col-span-12">${missions()}</div>
    </div>`;
  }

  LU.actions.star = (el) => {
    const res = S.toggleImportant(el.dataset.id);
    if (!res) return;
    LU.sound.play('star');
    LU.ui.toast(res.important ? 'Pažymėta kaip svarbi' : 'Nebežymima kaip svarbi', { icon: 'star', ms: 1600 });
    LU.app.afterChange(res);
  };


  return { render, levelCard, profileCard };
})();
