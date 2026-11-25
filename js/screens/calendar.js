// KALENDORIUS: Google Calendar tipo vaizdai – mėnuo, savaitė, 3 dienos, diena ir darbotvarkė.
// Įvykiai (susitikimai, renginiai) saugomi state.events; vienkartinės užduotys rodomos savo dieną.
window.LU = window.LU || {};
LU.screens = LU.screens || {};

LU.screens.calendar = (() => {
  const { icon, esc, modal, modalHeader, confirm, toast, dayLabel } = LU.ui;
  const S = LU.store;
  const C = LU.config;
  const { today, addDays, parseKey, dateKey, weekday } = S.util;

  const MONTHS_NOM = ['sausis', 'vasaris', 'kovas', 'balandis', 'gegužė', 'birželis', 'liepa', 'rugpjūtis', 'rugsėjis', 'spalis', 'lapkritis', 'gruodis'];
  const MONTHS_GEN = ['sausio', 'vasario', 'kovo', 'balandžio', 'gegužės', 'birželio', 'liepos', 'rugpjūčio', 'rugsėjo', 'spalio', 'lapkričio', 'gruodžio'];
  const VIEWS = [
    { key: 'agenda', label: 'Darbotvarkė', short: 'Sąrašas' },
    { key: 'day', label: 'Diena', short: 'Diena' },
    { key: '3day', label: '3 dienos', short: '3 d.' },
    { key: 'week', label: 'Savaitė', short: 'Savaitė' },
    { key: 'month', label: 'Mėnuo', short: 'Mėnuo' },
  ];

  // Ekrano būsena (tik šiai sesijai; pasirinktas vaizdas įsimenamas nustatymuose)
  const cal = { view: null, cursor: null, mini: null, scroll: null, scrollKey: null, agendaDays: 60, timer: null };

  // ---------- pagalbinės ----------
  const pad = (n) => String(n).padStart(2, '0');
  const isDesktop = () => window.matchMedia('(min-width: 1024px)').matches;
  const view = () => cal.view || S.state.settings.calView || (isDesktop() ? 'week' : 'month');
  const cursor = () => cal.cursor || today();
  const hourH = () => (isDesktop() ? 52 : 48);
  const mins = (hm) => { const [h, m] = String(hm || '0:0').split(':').map(Number); return h * 60 + m; };
  const hm = (m) => `${pad(Math.floor(m / 60) % 24)}:${pad(m % 60)}`;
  const colorOf = (key) => C.CAL_COLORS.find((c) => c.key === key) || C.CAL_COLORS[0];
  const startOfWeek = (k) => addDays(k, -(weekday(k) - 1));
  const wdShort = (k) => C.WEEKDAYS[weekday(k) - 1].short;
  const wdLong = (k) => C.WEEKDAYS[weekday(k) - 1].long;
  const dayNum = (k) => Number(k.slice(8));
  const monthTitle = (k) => `${k.slice(0, 4)} m. ${MONTHS_NOM[Number(k.slice(5, 7)) - 1]}`;
  const longDay = (k) => `${wdLong(k)}, ${MONTHS_GEN[Number(k.slice(5, 7)) - 1]} ${dayNum(k)} d.`;
  const range = (ev) => (ev.allDay ? 'Visą dieną' : `${ev.start}–${ev.end}`);

  function addMonths(k, n) {
    const d = parseKey(k);
    const day = d.getDate();
    d.setDate(1);
    d.setMonth(d.getMonth() + n);
    d.setDate(Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()));
    return dateKey(d);
  }

  /** Matomos dienos pagal vaizdą. */
  function visibleDays(v = view()) {
    const c = cursor();
    if (v === 'day') return [c];
    if (v === '3day') return [c, addDays(c, 1), addDays(c, 2)];
    if (v === 'week') { const s = startOfWeek(c); return [...Array(7)].map((_, i) => addDays(s, i)); }
    return [];
  }

  function repeatText(ev, date = ev.date) {
    const d = date;
    switch (ev.repeat) {
      case 'daily': return 'Kasdien';
      case 'weekdays': return 'Darbo dienomis (Pr–Pn)';
      case 'weekly': return `Kas savaitę, ${wdLong(d).toLowerCase().slice(0, -2)}į`;
      case 'monthly': return `Kas mėnesį, ${dayNum(d)} d.`;
      case 'yearly': return `Kasmet, ${MONTHS_GEN[Number(d.slice(5, 7)) - 1]} ${dayNum(d)} d.`;
      default: return 'Nesikartoja';
    }
  }

  function title() {
    const v = view();
    if (v === 'week' || v === '3day') {
      const days = visibleDays(v);
      const a = days[0];
      const b = days[days.length - 1];
      if (a.slice(0, 7) === b.slice(0, 7)) return monthTitle(a);
      const y = a.slice(0, 4) === b.slice(0, 4) ? `${a.slice(0, 4)} m. ` : '';
      return `${y}${MONTHS_NOM[Number(a.slice(5, 7)) - 1].slice(0, 4)}. – ${MONTHS_NOM[Number(b.slice(5, 7)) - 1].slice(0, 4)}.`;
    }
    return monthTitle(cursor());
  }

  // ---------- mažos dalys ----------
  function evChip(ev, date, cls = '') {
    const c = colorOf(ev.color);
    const time = !ev.allDay && isDesktop() ? `<span class="opacity-75 font-medium">${ev.start}</span> ` : '';
    return `<div data-action="cal-event" data-id="${ev.id}" data-date="${date}" role="button" tabindex="0" class="truncate rounded-[5px] px-1 text-[10px] lg:text-[11px] leading-[15px] lg:leading-[18px] font-semibold cursor-pointer ${cls}" style="background:${c.hex};color:${c.ink}" title="${esc(ev.title)}">${time}${esc(ev.title)}</div>`;
  }

  function taskChip(t, cls = '') {
    const done = !!t.doneDate;
    return `<div data-action="cal-task" data-id="${t.id}" role="button" tabindex="0" class="flex items-center gap-0.5 truncate rounded-[5px] border border-gold/40 bg-gold/10 px-1 text-[10px] lg:text-[11px] leading-[13px] lg:leading-[16px] font-semibold text-gold cursor-pointer ${done ? 'opacity-55' : ''} ${cls}" title="${esc(t.title)}">
      ${icon(done ? 'circle-check' : 'circle', 'w-2.5 h-2.5 lg:w-3 lg:h-3 shrink-0')}<span class="truncate ${done ? 'line-through' : ''}">${esc(t.title)}</span></div>`;
  }

  function taskRow(t) {
    const done = !!t.doneDate;
    const canToggle = S.isDue(t, today());
    const box = done
      ? `<span class="grid place-items-center w-6 h-6 rounded-full bg-gold text-black">${icon('check', 'w-3.5 h-3.5', 3)}</span>`
      : '<span class="block w-6 h-6 rounded-full border-2 border-white/30"></span>';
    return `
    <div class="flex items-center gap-3 rounded-xl border border-line bg-card2 px-3 py-2">
      ${canToggle ? `<button data-action="toggle" data-id="${t.id}" class="chk shrink-0" aria-label="${done ? 'Atšaukti' : 'Pažymėti atlikta'}">${box}</button>` : `<span class="shrink-0 opacity-50">${box}</span>`}
      <button data-action="cal-task" data-id="${t.id}" class="flex-1 min-w-0 text-left">
        <p class="font-semibold truncate ${done ? 'line-through text-white/45' : ''}">${esc(t.title)}</p>
        <p class="text-xs text-muted">Užduotis · <span class="text-gold font-bold">+${C.TASK_XP} XP</span></p>
      </button>
      ${t.important ? `<span class="text-gold shrink-0"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round" class="w-4 h-4">${LU.ICONS.star}</svg></span>` : ''}
    </div>`;
  }

  // ---------- įrankių juosta ----------
  function toolbar() {
    const v = view();
    return `
    <section class="flex flex-col 2xl:flex-row 2xl:items-center gap-3 mb-4 lg:mb-5">
      <div class="flex items-center gap-1.5 min-w-0 flex-1">
        <button data-action="cal-today" class="btn btn-sm bg-card2 border border-line text-white hover:border-line2 !h-10 shrink-0">Šiandien</button>
        <button data-action="cal-prev" class="icon-btn w-10 h-10 shrink-0" aria-label="Atgal">${icon('chevron-left', 'w-5 h-5')}</button>
        <button data-action="cal-next" class="icon-btn w-10 h-10 shrink-0" aria-label="Pirmyn">${icon('chevron-right', 'w-5 h-5')}</button>
        <h1 class="ml-1.5 text-[19px] sm:text-2xl font-extrabold truncate first-letter:uppercase">${esc(title())}</h1>
      </div>
      <div class="grid grid-cols-5 gap-1.5 sm:flex" role="tablist" aria-label="Vaizdas">
        ${VIEWS.map((x) => `<button data-action="cal-view" data-view="${x.key}" role="tab" aria-selected="${x.key === v}" class="seg !h-9 !px-1 sm:!px-3.5 justify-center !text-[13px] sm:!text-sm ${x.key === v ? 'active' : ''}"><span class="sm:hidden">${x.short}</span><span class="hidden sm:inline">${x.label}</span></button>`).join('')}
      </div>
    </section>`;
  }

  // ---------- MĖNUO ----------
  function monthView() {
    const c = cursor();
    const first = `${c.slice(0, 8)}01`;
    const start = startOfWeek(first);
    const month = c.slice(0, 7);
    const dim = new Date(Number(c.slice(0, 4)), Number(c.slice(5, 7)), 0).getDate();
    const rows = Math.ceil((weekday(first) - 1 + dim) / 7);
    const t = today();
    const max = isDesktop() ? 4 : 3;
    const cells = [];
    for (let i = 0; i < rows * 7; i++) {
      const d = addDays(start, i);
      const inMonth = d.slice(0, 7) === month;
      const items = [...S.eventsOn(d).map((ev) => evChip(ev, d)), ...S.tasksOn(d).map((tk) => taskChip(tk))];
      const shown = items.length > max ? items.slice(0, max - 1) : items;
      const more = items.length - shown.length;
      cells.push(`
        <div data-action="cal-day" data-date="${d}" role="button" tabindex="0" aria-label="${esc(longDay(d))}" class="min-w-0 min-h-[88px] lg:min-h-[118px] border-b border-r border-line p-[3px] lg:p-1.5 flex flex-col gap-[3px] cursor-pointer hover:bg-white/[0.025] transition ${inMonth ? '' : 'bg-white/[0.015]'}">
          <span class="self-center grid place-items-center w-6 h-6 lg:w-7 lg:h-7 rounded-full text-[11px] lg:text-xs font-bold ${d === t ? 'bg-gold text-black' : inMonth ? 'text-white/85' : 'text-white/30'}">${dayNum(d)}</span>
          <div class="flex flex-col gap-[3px] min-w-0 ${inMonth ? '' : 'opacity-50'}">
            ${shown.join('')}
            ${more ? `<span class="px-1 text-[10px] lg:text-[11px] font-bold text-muted">dar ${more}</span>` : ''}
          </div>
        </div>`);
    }
    return `
    <div class="card overflow-hidden -mx-4 sm:mx-0 rounded-none sm:!rounded-3xl border-x-0 sm:border-x">
      <div class="grid grid-cols-7 border-b border-line">
        ${C.WEEKDAYS.map((w) => `<div class="py-2 text-center text-[10px] lg:text-[11px] font-bold tracking-wider uppercase text-muted">${w.short}</div>`).join('')}
      </div>
      <div class="grid grid-cols-7 [&>*:nth-child(7n)]:border-r-0">${cells.join('')}</div>
    </div>`;
  }

  // ---------- DIENA / 3 DIENOS / SAVAITĖ ----------
  /** Persidengiančių įvykių išdėstymas stulpeliais (kaip Google). */
  function layout(evs) {
    const items = evs.map((ev) => ({ ev, s: mins(ev.start), e: Math.max(mins(ev.end), mins(ev.start) + 20) }))
      .sort((a, b) => a.s - b.s || b.e - a.e);
    let group = [];
    let cols = [];
    let groupEnd = -1;
    const close = () => { group.forEach((it) => { it.n = cols.length; }); group = []; cols = []; };
    items.forEach((it) => {
      if (it.s >= groupEnd) { close(); groupEnd = -1; }
      let c = cols.findIndex((end) => end <= it.s);
      if (c < 0) { c = cols.length; cols.push(it.e); } else cols[c] = it.e;
      it.col = c;
      group.push(it);
      groupEnd = Math.max(groupEnd, it.e);
    });
    close();
    return items;
  }

  function nowTop() {
    const d = new Date();
    return ((d.getHours() * 60 + d.getMinutes()) / 60) * hourH();
  }

  function gridView(v) {
    const days = visibleDays(v);
    const t = today();
    const H = hourH();
    const gutter = 'w-11 lg:w-14 shrink-0';
    const allDay = days.map((d) => [...S.eventsOn(d).filter((e) => e.allDay).map((ev) => evChip(ev, d, '!text-[11px] !leading-[18px]')), ...S.tasksOn(d).map((tk) => taskChip(tk, '!text-[11px] !leading-[16px] py-px'))]);
    const hasAllDay = allDay.some((x) => x.length);

    const columns = days.map((d) => {
      const blocks = layout(S.eventsOn(d).filter((e) => !e.allDay)).map((it) => {
        const c = colorOf(it.ev.color);
        const top = (it.s / 60) * H;
        const h = Math.max(((it.e - it.s) / 60) * H, 18);
        const w = 100 / it.n;
        const tall = h >= 34;
        return `<div data-action="cal-event" data-id="${it.ev.id}" data-date="${d}" role="button" tabindex="0" class="absolute rounded-md px-1.5 py-[3px] overflow-hidden text-[11px] leading-[14px] font-semibold cursor-pointer hover:brightness-110" style="top:${top + 1}px;height:${h - 2}px;left:calc(${it.col * w}% + 1px);width:calc(${w}% - 3px);background:${c.hex};color:${c.ink};box-shadow:0 0 0 1px #121214">
          <p class="${tall ? 'line-clamp-2' : 'truncate'}">${esc(it.ev.title)}${tall ? '' : `<span class="font-medium opacity-80">, ${it.ev.start}</span>`}</p>
          ${tall ? `<p class="truncate font-medium opacity-80">${it.ev.start}–${it.ev.end}</p>` : ''}
        </div>`;
      }).join('');
      const now = d === t ? `<div data-now class="absolute inset-x-0 z-10 pointer-events-none" style="top:${nowTop()}px"><div class="relative h-[2px] bg-red-500"><span class="absolute -left-[5px] -top-[4px] w-2.5 h-2.5 rounded-full bg-red-500"></span></div></div>` : '';
      return `<div data-cal-col data-date="${d}" class="relative flex-1 min-w-0 border-l border-line">${blocks}${now}</div>`;
    }).join('');

    return `
    <div class="card overflow-hidden -mx-4 sm:mx-0 rounded-none sm:!rounded-3xl border-x-0 sm:border-x">
      <div class="flex border-b border-line">
        <div class="${gutter}"></div>
        ${days.map((d) => `
          <button data-action="cal-day" data-date="${d}" class="flex-1 min-w-0 py-2 flex flex-col items-center gap-0.5 border-l border-transparent" aria-label="${esc(longDay(d))}">
            <span class="text-[10px] lg:text-[11px] font-bold tracking-wider uppercase ${d === t ? 'text-gold' : 'text-muted'}">${wdShort(d)}</span>
            <span class="grid place-items-center w-8 h-8 lg:w-10 lg:h-10 rounded-full text-[15px] lg:text-xl font-bold ${d === t ? 'bg-gold text-black' : 'text-white/90'}">${dayNum(d)}</span>
          </button>`).join('')}
      </div>
      ${hasAllDay ? `
      <div class="flex border-b border-line">
        <div class="${gutter} flex justify-end pr-1.5 pt-1.5 text-[9px] lg:text-[10px] text-dim">visą d.</div>
        ${allDay.map((items) => `<div class="flex-1 min-w-0 border-l border-line p-[3px] flex flex-col gap-[3px]">${items.join('')}</div>`).join('')}
      </div>` : ''}
      <div data-cal-scroll class="relative overflow-y-auto overscroll-contain no-scrollbar" style="height:60vh">
        <div class="relative flex" style="height:${24 * H}px">
          <div class="${gutter} relative">
            ${[...Array(23)].map((_, i) => `<span class="absolute right-1.5 lg:right-2 -translate-y-1/2 text-[10px] text-dim tabular-nums" style="top:${(i + 1) * H}px">${pad(i + 1)}:00</span>`).join('')}
          </div>
          <div class="relative flex-1 flex">
            <div class="absolute inset-0 pointer-events-none">
              ${[...Array(23)].map((_, i) => `<div class="absolute inset-x-0 border-t border-line" style="top:${(i + 1) * H}px"></div>`).join('')}
            </div>
            ${columns}
          </div>
        </div>
      </div>
    </div>`;
  }

  // ---------- DARBOTVARKĖ ----------
  function agendaView() {
    const start = cursor();
    const t = today();
    let lastMonth = null;
    const out = [];
    for (let i = 0; i < cal.agendaDays; i++) {
      const d = addDays(start, i);
      const evs = S.eventsOn(d);
      const tks = S.tasksOn(d);
      if (!evs.length && !tks.length && d !== t) continue;
      if (d.slice(0, 7) !== lastMonth) {
        out.push(`<h3 class="${lastMonth ? 'mt-7' : 'mt-1'} mb-1 text-sm font-extrabold tracking-wider uppercase text-muted">${esc(monthTitle(d))}</h3>`);
        lastMonth = d.slice(0, 7);
      }
      out.push(`
      <div class="flex gap-3 py-3 border-b border-line">
        <button data-action="cal-day" data-date="${d}" class="w-11 shrink-0 flex flex-col items-center pt-0.5" aria-label="${esc(longDay(d))}">
          <span class="text-[10px] font-bold uppercase tracking-wider ${d === t ? 'text-gold' : 'text-muted'}">${wdShort(d)}</span>
          <span class="grid place-items-center w-9 h-9 rounded-full text-lg font-bold ${d === t ? 'bg-gold text-black' : ''}">${dayNum(d)}</span>
        </button>
        <div class="flex-1 min-w-0 space-y-1.5">
          ${evs.map((ev) => {
            const c = colorOf(ev.color);
            return `<div data-action="cal-event" data-id="${ev.id}" data-date="${d}" role="button" tabindex="0" class="rounded-xl px-3 py-2 cursor-pointer hover:brightness-110" style="background:${c.hex};color:${c.ink}">
              <p class="font-bold truncate">${esc(ev.title)}</p>
              <p class="text-xs font-medium opacity-80 truncate">${range(ev)}${ev.location ? ` · ${esc(ev.location)}` : ''}</p>
            </div>`;
          }).join('')}
          ${tks.map(taskRow).join('')}
          ${!evs.length && !tks.length ? '<p class="text-sm text-muted pt-2.5">Šiandien nieko nesuplanuota</p>' : ''}
        </div>
      </div>`);
    }
    return `
    <div class="max-w-3xl">
      ${out.join('')}
      <button data-action="cal-more" class="btn-ghost w-full mt-5 !h-12 text-sm">${icon('chevron-down', 'w-5 h-5')} Rodyti daugiau</button>
    </div>`;
  }

  // ---------- mažas mėnuo (kompiuteryje) ----------
  function miniMonth() {
    const m = cal.mini || cursor().slice(0, 7);
    const first = `${m}-01`;
    const start = startOfWeek(first);
    const t = today();
    const sel = new Set(view() === 'month' ? [] : view() === 'agenda' ? [cursor()] : visibleDays());
    return `
    <div class="mt-6">
      <div class="flex items-center justify-between mb-2 pl-1">
        <p class="font-bold text-sm first-letter:uppercase">${esc(monthTitle(first))}</p>
        <div class="flex">
          <button data-action="cal-mini" data-dir="-1" class="grid place-items-center w-8 h-8 rounded-lg text-white/70 hover:bg-white/5" aria-label="Ankstesnis mėnuo">${icon('chevron-left', 'w-4 h-4')}</button>
          <button data-action="cal-mini" data-dir="1" class="grid place-items-center w-8 h-8 rounded-lg text-white/70 hover:bg-white/5" aria-label="Kitas mėnuo">${icon('chevron-right', 'w-4 h-4')}</button>
        </div>
      </div>
      <div class="grid grid-cols-7 gap-y-0.5 text-center">
        ${C.WEEKDAYS.map((w) => `<span class="text-[10px] font-bold text-dim py-1">${w.short}</span>`).join('')}
        ${[...Array(42)].map((_, i) => {
          const d = addDays(start, i);
          const cls = d === t ? 'bg-gold text-black font-bold' : sel.has(d) ? 'bg-gold/15 text-gold font-bold' : d.slice(0, 7) === m ? 'text-white/80 hover:bg-white/5' : 'text-white/25 hover:bg-white/5';
          return `<button data-action="cal-goto" data-date="${d}" class="mx-auto grid place-items-center w-8 h-8 rounded-full text-xs transition ${cls}">${dayNum(d)}</button>`;
        }).join('')}
      </div>
    </div>`;
  }

  // ---------- ekranas ----------
  function render() {
    // atėjus į kalendorių iš kito ekrano – pradedam nuo šiandienos
    if (LU.app.lastRoute !== 'kalendorius') { cal.cursor = null; cal.mini = null; cal.scrollKey = null; cal.agendaDays = 60; }
    const v = view();
    const body = v === 'month' ? monthView() : v === 'agenda' ? agendaView() : gridView(v);
    return `
    <div class="lg:grid lg:grid-cols-[232px_1fr] lg:gap-8">
      <aside class="hidden lg:block">
        <button data-action="cal-create" class="btn-gold w-full !h-12">${icon('plus', 'w-5 h-5', 2.5)} Sukurti</button>
        ${miniMonth()}
        <p class="mt-6 text-xs text-muted leading-relaxed flex gap-2">${icon('info', 'w-4 h-4 shrink-0')} Užduotys (auksiniai rėmeliai) duoda +${C.TASK_XP} XP. Įvykiai – tavo susitikimai ir planai.</p>
      </aside>
      <div class="min-w-0" data-cal-view>
        ${toolbar()}
        ${body}
      </div>
    </div>
    <button data-action="cal-create" class="lg:hidden fixed right-4 z-30 bottom-[calc(92px+env(safe-area-inset-bottom))] w-14 h-14 rounded-2xl bg-gold text-black shadow-glow grid place-items-center active:scale-95 transition" aria-label="Sukurti">${icon('plus', 'w-7 h-7', 2.5)}</button>`;
  }

  function mount(el) {
    const box = el.querySelector('[data-cal-scroll]');
    const key = `${view()}|${cursor()}`;
    if (box) {
      // tinklelis užpildo ekraną iki apatinės navigacijos
      const fit = () => {
        const nav = document.querySelector('nav');
        const bottom = isDesktop() ? 32 : ((nav && nav.offsetHeight) || 84) + 12;
        const top = box.getBoundingClientRect().top + window.scrollY;
        box.style.height = `${Math.max(300, window.innerHeight - top - bottom)}px`;
      };
      fit();
      const H = hourH();
      if (cal.scrollKey === key && cal.scroll != null) box.scrollTop = cal.scroll;
      else if (visibleDays().includes(today())) box.scrollTop = Math.max(0, nowTop() - box.clientHeight / 3);
      else box.scrollTop = 7 * H;
      cal.scrollKey = key;
      cal.scroll = box.scrollTop;
      box.addEventListener('scroll', () => { cal.scroll = box.scrollTop; }, { passive: true });

      // paspaudus tuščią vietą – naujas įvykis tuo laiku
      box.querySelectorAll('[data-cal-col]').forEach((col) => col.addEventListener('click', (e) => {
        if (e.target.closest('[data-action]')) return;
        const y = e.clientY - col.getBoundingClientRect().top;
        const m = Math.min(23 * 60, Math.max(0, Math.floor(((y / H) * 60) / 30) * 30));
        openEventForm(null, { date: col.dataset.date, start: hm(m) });
      }));

      clearInterval(cal.timer);
      cal.timer = setInterval(() => {
        const n = document.querySelector('[data-now]');
        if (!n) { clearInterval(cal.timer); return; }
        n.style.top = `${nowTop()}px`;
      }, 60000);
    }

    // braukimas kairėn / dešinėn – kitas / ankstesnis laikotarpis
    const area = el.querySelector('[data-cal-view]');
    let sx = null;
    let sy = 0;
    area.addEventListener('touchstart', (e) => { if (e.touches.length === 1) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; } }, { passive: true });
    area.addEventListener('touchend', (e) => {
      if (sx == null) return;
      const dx = e.changedTouches[0].clientX - sx;
      const dy = e.changedTouches[0].clientY - sy;
      sx = null;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5 && view() !== 'agenda') navigate(dx < 0 ? 1 : -1);
    }, { passive: true });
  }

  function rerender() { LU.app.render(); }

  function navigate(dir) {
    const v = view();
    const c = cursor();
    if (v === 'month' || v === 'agenda') cal.cursor = addMonths(c, dir);
    else cal.cursor = addDays(c, dir * (v === 'week' ? 7 : v === '3day' ? 3 : 1));
    cal.mini = null;
    rerender();
  }

  // ---------- įvykio langas ----------
  function openEvent(id, date) {
    const ev = S.state.events.find((e) => e.id === id);
    if (!ev) return;
    const c = colorOf(ev.color);
    modal(`
      <div class="flex items-center justify-end gap-1.5 px-4 pt-4">
        <button data-edit class="icon-btn w-10 h-10" aria-label="Redaguoti">${icon('pencil', 'w-4 h-4')}</button>
        <button data-del class="icon-btn w-10 h-10 hover:text-red-400" aria-label="Ištrinti">${icon('trash-2', 'w-4 h-4')}</button>
        <button data-close class="icon-btn w-10 h-10" aria-label="Uždaryti">${icon('x', 'w-5 h-5')}</button>
      </div>
      <div class="px-6 pb-8 pt-1 space-y-5">
        <div class="flex gap-4">
          <span class="mt-2 w-4 h-4 rounded-[5px] shrink-0" style="background:${c.hex}"></span>
          <div class="min-w-0">
            <h2 class="text-2xl font-extrabold break-words">${esc(ev.title)}</h2>
            <p class="mt-1 text-white/80">${esc(longDay(date))}${ev.allDay ? '' : ` · ${ev.start} – ${ev.end}`}</p>
            ${ev.repeat !== 'none' ? `<p class="mt-0.5 text-sm text-muted">${esc(repeatText(ev))}</p>` : ''}
          </div>
        </div>
        ${ev.location ? `<div class="flex gap-4 text-white/85">${icon('map-pin', 'w-4 h-4 mt-1 shrink-0 text-muted')}<p class="break-words">${esc(ev.location)}</p></div>` : ''}
        ${ev.note ? `<div class="flex gap-4 text-white/85">${icon('align-left', 'w-4 h-4 mt-1 shrink-0 text-muted')}<p class="whitespace-pre-wrap break-words">${esc(ev.note)}</p></div>` : ''}
      </div>`, {
      onMount: (el, close) => {
        el.querySelector('[data-edit]').addEventListener('click', () => { close(); setTimeout(() => openEventForm(ev), 200); });
        el.querySelector('[data-del]').addEventListener('click', () => { close(); setTimeout(() => askDeleteEvent(ev, date), 200); });
      },
    });
  }

  function askDeleteEvent(ev, date) {
    if (ev.repeat === 'none') {
      confirm({ title: 'Ištrinti įvykį?', text: `„<b class="text-white">${esc(ev.title)}</b>" bus ištrintas.`, confirmLabel: 'Ištrinti', danger: true, icon: 'trash-2' })
        .then((ok) => { if (ok) { S.deleteEvent(ev.id); toast('Įvykis ištrintas', { icon: 'trash-2' }); } });
      return;
    }
    modal(`
      ${modalHeader('Ištrinti pasikartojantį įvykį', 'trash-2')}
      <div class="px-5 sm:px-6 pb-6 space-y-3">
        <button data-one class="btn-ghost w-full">Tik šį (${esc(dayLabel(date).toLowerCase())})</button>
        <button data-all class="btn-danger w-full">Visus pasikartojimus</button>
      </div>`, {
      onMount: (el, close) => {
        el.querySelector('[data-one]').addEventListener('click', () => { S.deleteEvent(ev.id, date); close(); toast('Įvykis ištrintas', { icon: 'trash-2' }); });
        el.querySelector('[data-all]').addEventListener('click', () => { S.deleteEvent(ev.id); close(); toast('Visi pasikartojimai ištrinti', { icon: 'trash-2' }); });
      },
    });
  }

  function openEventForm(ev, preset = {}) {
    const t = today();
    let f;
    if (ev) f = { ...ev };
    else {
      const date = preset.date || cursor();
      let start = preset.start;
      if (!start) {
        // šiandien – artimiausias pusvalandis, kitomis dienomis – 09:00
        const now = new Date();
        start = date === t ? hm(Math.min(22 * 60 + 30, Math.ceil((now.getHours() * 60 + now.getMinutes() + 1) / 30) * 30)) : '09:00';
      }
      f = { title: '', date, allDay: false, start, end: hm(Math.min(mins(start) + 60, 23 * 60 + 59)), color: 'gold', repeat: 'none', location: '', note: '' };
    }
    const repeatOpts = (d) => [
      ['none', 'Nesikartoja'], ['daily', 'Kasdien'], ['weekdays', 'Darbo dienomis (Pr–Pn)'],
      ['weekly', `Kas savaitę (${wdLong(d).toLowerCase().slice(0, -2)}į)`], ['monthly', `Kas mėnesį (${dayNum(d)} d.)`],
      ['yearly', `Kasmet (${MONTHS_GEN[Number(d.slice(5, 7)) - 1]} ${dayNum(d)} d.)`],
    ].map(([k, l]) => `<option value="${k}" ${f.repeat === k ? 'selected' : ''}>${l}</option>`).join('');

    const dateCls = 'field text-left [&::-webkit-date-and-time-value]:text-left';
    modal(`
      ${modalHeader(ev ? 'Redaguoti įvykį' : 'Naujas įvykis', 'calendar-plus')}
      <form class="px-5 sm:px-6 pb-6 space-y-5" novalidate>
        <input id="ef-title" class="field !h-14 !text-lg font-semibold" maxlength="100" placeholder="Pridėk pavadinimą" value="${esc(f.title)}" autofocus enterkeyhint="done">

        <button type="button" data-allday class="w-full flex items-center gap-3 rounded-2xl border border-line2 bg-well px-4 h-12">
          ${icon('clock', 'w-5 h-5 text-muted')}<span class="flex-1 text-left font-semibold">Visą dieną</span><span data-switch></span>
        </button>

        <div>
          <label class="label" for="ef-date">Data</label>
          <input id="ef-date" type="date" class="${dateCls}" value="${f.date}">
        </div>
        <div data-times class="grid grid-cols-2 gap-3">
          <div><label class="label" for="ef-start">Pradžia</label><input id="ef-start" type="time" step="300" class="${dateCls}" value="${f.start || '09:00'}"></div>
          <div><label class="label" for="ef-end">Pabaiga</label><input id="ef-end" type="time" step="300" class="${dateCls}" value="${f.end || '10:00'}"></div>
        </div>
        <p data-time-err class="hidden -mt-2 text-sm text-red-400">Pabaiga turi būti vėliau nei pradžia.</p>

        <div>
          <label class="label" for="ef-repeat">Kartojimas</label>
          <div class="relative">
            <select id="ef-repeat" class="field appearance-none pr-10">${repeatOpts(f.date)}</select>
            <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted">${icon('chevron-down', 'w-5 h-5')}</span>
          </div>
        </div>

        <div>
          <span class="label">Spalva</span>
          <div class="flex flex-wrap gap-2.5" data-colors>
            ${C.CAL_COLORS.map((c) => `<button type="button" data-color="${c.key}" title="${c.name}" aria-label="${c.name}" class="w-8 h-8 rounded-full grid place-items-center transition" style="background:${c.hex};color:${c.ink}"></button>`).join('')}
          </div>
        </div>

        <div class="relative">
          <span class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted">${icon('map-pin', 'w-5 h-5')}</span>
          <input id="ef-loc" class="field !pl-12" maxlength="120" placeholder="Pridėk vietą" value="${esc(f.location)}">
        </div>
        <textarea id="ef-note" class="field" rows="3" maxlength="1000" placeholder="Pridėk aprašymą">${esc(f.note)}</textarea>

        <div class="flex gap-3 pt-1">
          ${ev ? `<button type="button" data-del class="btn-ghost !px-4 text-red-400" aria-label="Ištrinti">${icon('trash-2', 'w-5 h-5')}</button>` : ''}
          <button type="submit" class="btn-gold flex-1">${icon('check', 'w-5 h-5', 2.5)} ${ev ? 'Išsaugoti' : 'Sukurti'}</button>
        </div>
      </form>`, {
      onMount: (el, close) => {
        const $ = (s) => el.querySelector(s);
        function paint() {
          $('[data-switch]').innerHTML = `<span class="relative block w-11 h-6 rounded-full transition ${f.allDay ? 'bg-gold' : 'bg-white/15'}"><span class="absolute top-0.5 ${f.allDay ? 'left-[22px]' : 'left-0.5'} w-5 h-5 rounded-full bg-white shadow transition-all"></span></span>`;
          $('[data-times]').classList.toggle('hidden', f.allDay);
          el.querySelectorAll('[data-color]').forEach((b) => {
            const on = b.dataset.color === f.color;
            b.innerHTML = on ? icon('check', 'w-4 h-4', 3) : '';
            b.style.boxShadow = on ? '0 0 0 2px #121214, 0 0 0 4px rgba(255,255,255,.85)' : 'none';
          });
        }
        paint();
        if (!ev) setTimeout(() => $('#ef-title').focus(), 80);
        el.querySelectorAll('input[type=date], input[type=time]').forEach((inp) => inp.addEventListener('click', () => { try { inp.showPicker(); } catch (err) { /* nepalaikoma */ } }));
        $('#ef-date').addEventListener('change', () => {
          if (!$('#ef-date').value) return;
          f.date = $('#ef-date').value;
          f.repeat = $('#ef-repeat').value;
          $('#ef-repeat').innerHTML = repeatOpts(f.date);
        });
        $('#ef-start').addEventListener('change', () => {
          // kaip Google: pakeitus pradžią, trukmė išlieka
          const old = mins(f.start);
          const dur = Math.max(15, mins($('#ef-end').value) - old);
          f.start = $('#ef-start').value || f.start;
          $('#ef-end').value = hm(Math.min(mins(f.start) + dur, 23 * 60 + 59));
        });
        el.addEventListener('click', (e) => {
          const b = e.target.closest('button');
          if (!b) return;
          if (b.hasAttribute('data-allday')) f.allDay = !f.allDay;
          else if (b.dataset.color) f.color = b.dataset.color;
          else if (b.hasAttribute('data-del')) { close(); setTimeout(() => askDeleteEvent(ev, ev.date), 200); return; } else return;
          paint();
        });
        el.querySelector('form').addEventListener('submit', (e) => {
          e.preventDefault();
          f.title = $('#ef-title').value.trim();
          f.date = $('#ef-date').value || f.date;
          f.start = $('#ef-start').value || f.start;
          f.end = $('#ef-end').value || f.end;
          f.repeat = $('#ef-repeat').value;
          f.location = $('#ef-loc').value;
          f.note = $('#ef-note').value;
          const bad = !f.allDay && mins(f.end) <= mins(f.start);
          $('[data-time-err]').classList.toggle('hidden', !bad);
          if (bad) return;
          if (ev) S.updateEvent(ev.id, f);
          else S.addEvent(f);
          // parodom dieną, kurioje yra įvykis
          if (!visibleDays().includes(f.date) && !(view() === 'month' && f.date.slice(0, 7) === cursor().slice(0, 7))) { cal.cursor = f.date; cal.mini = null; rerender(); }
          toast(ev ? 'Įvykis atnaujintas' : `Įvykis sukurtas: ${dayLabel(f.date).toLowerCase()}`, { icon: 'calendar-check' });
          close();
        });
      },
    });
  }

  // ---------- užduoties langas ----------
  function openTask(id) {
    const tk = S.state.tasks.find((x) => x.id === id);
    if (!tk) return;
    const done = !!tk.doneDate;
    const dueToday = S.isDue(tk, today());
    modal(`
      ${modalHeader('Užduotis', 'list-todo')}
      <div class="px-5 sm:px-6 pb-6">
        <div class="flex items-start gap-3">
          <h2 class="flex-1 text-2xl font-extrabold break-words ${done ? 'line-through text-white/50' : ''}">${esc(tk.title)}</h2>
          ${tk.important ? `<span class="text-gold mt-1.5"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round" class="w-5 h-5">${LU.ICONS.star}</svg></span>` : ''}
        </div>
        <p class="mt-1 text-muted">${done ? `Atlikta ${esc(dayLabel(tk.doneDate).toLowerCase())}` : esc(dayLabel(tk.date < today() ? today() : tk.date))} · <span class="text-gold font-bold">+${C.TASK_XP} XP</span></p>
        ${!dueToday && !done ? `<p class="mt-4 text-sm text-muted flex gap-2">${icon('info', 'w-4 h-4 mt-0.5 shrink-0')} Pažymėti atlikta galėsi tą dieną – užduotis atsiras šiandienos misijose.</p>` : ''}
        <div class="mt-6 flex gap-3">
          <button data-del class="btn-ghost !px-4 text-red-400" aria-label="Ištrinti">${icon('trash-2', 'w-5 h-5')}</button>
          <button data-edit class="btn-ghost flex-1 !px-3">${icon('pencil', 'w-5 h-5')} Redaguoti</button>
          ${dueToday ? `<button data-done data-id="${tk.id}" class="btn-gold flex-1 !px-3">${icon(done ? 'x' : 'check', 'w-5 h-5', 2.5)} ${done ? 'Atšaukti' : 'Atlikta'}</button>` : ''}
        </div>
      </div>`, {
      onMount: (el, close) => {
        el.querySelector('[data-edit]').addEventListener('click', () => { close(); setTimeout(() => LU.screens.tasks.openForm(tk), 200); });
        el.querySelector('[data-del]').addEventListener('click', () => { close(); setTimeout(() => LU.actions['delete-task']({ dataset: { id: tk.id } }), 200); });
        const d = el.querySelector('[data-done]');
        if (d) d.addEventListener('click', () => { LU.actions.toggle(d); close(); });
      },
    });
  }

  // ---------- kūrimas ----------
  function openCreate(date) {
    modal(`
      ${modalHeader('Sukurti', 'plus')}
      <div class="px-5 sm:px-6 pb-6 space-y-3">
        <button data-new-ev class="w-full flex items-center gap-4 rounded-2xl border border-line bg-card2 hover:border-line2 p-4 text-left transition">
          <div class="icon-box-gold w-12 h-12">${icon('calendar-plus', 'w-6 h-6')}</div>
          <div class="min-w-0"><p class="font-bold">Įvykis</p><p class="text-sm text-muted">Susitikimas, renginys ar planas su laiku</p></div>
        </button>
        <button data-new-task class="w-full flex items-center gap-4 rounded-2xl border border-line bg-card2 hover:border-line2 p-4 text-left transition">
          <div class="icon-box-gold w-12 h-12">${icon('list-todo', 'w-6 h-6')}</div>
          <div class="min-w-0"><p class="font-bold">Užduotis <span class="text-gold text-sm">+${C.TASK_XP} XP</span></p><p class="text-sm text-muted">Misija tai dienai – atsiras šiandienos misijose</p></div>
        </button>
      </div>`, {
      onMount: (el, close) => {
        el.querySelector('[data-new-ev]').addEventListener('click', () => { close(); setTimeout(() => openEventForm(null, { date }), 200); });
        el.querySelector('[data-new-task]').addEventListener('click', () => { close(); setTimeout(() => LU.screens.tasks.openForm(null, { type: 'once', date }), 200); });
      },
    });
  }

  // ---------- veiksmai ----------
  LU.actions['cal-view'] = (el) => {
    cal.view = el.dataset.view;
    S.state.settings.calView = cal.view;
    S.save();
    rerender();
  };
  LU.actions['cal-prev'] = () => navigate(-1);
  LU.actions['cal-next'] = () => navigate(1);
  LU.actions['cal-today'] = () => { cal.cursor = null; cal.mini = null; cal.agendaDays = 60; rerender(); };
  LU.actions['cal-day'] = (el) => { cal.cursor = el.dataset.date; cal.view = 'day'; cal.mini = null; rerender(); };
  LU.actions['cal-goto'] = (el) => { cal.cursor = el.dataset.date; rerender(); };
  LU.actions['cal-mini'] = (el) => {
    const m = cal.mini || cursor().slice(0, 7);
    cal.mini = addMonths(`${m}-01`, Number(el.dataset.dir)).slice(0, 7);
    rerender();
  };
  LU.actions['cal-more'] = () => { cal.agendaDays += 60; rerender(); };
  LU.actions['cal-create'] = () => openCreate(cursor());
  LU.actions['cal-event'] = (el) => openEvent(el.dataset.id, el.dataset.date);
  LU.actions['cal-task'] = (el) => openTask(el.dataset.id);

  // pasikeitus ekrano pločiui (telefonas ↔ kompiuteris) – perpiešiam
  let rt = null;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => { if (LU.app.route() === 'kalendorius' && !document.querySelector('.modal-wrap')) rerender(); }, 250);
  });

  return { render, mount, openEventForm };
})();
