// ĮPROČIŲ LENTELĖ: mėnesio lentelė kaip skaičiuoklėje – įpročiai eilutėse, dienos stulpeliuose,
// apačioje dienos progresas, šone – kiekvieno įpročio tikslas ir faktas.
window.LU = window.LU || {};
LU.screens = LU.screens || {};

LU.screens.habits = (() => {
  const { icon, esc, toast } = LU.ui;
  const S = LU.store;
  const C = LU.config;
  const { today, addDays, weekday } = S.util;

  const MONTHS_NOM = ['sausis', 'vasaris', 'kovas', 'balandis', 'gegužė', 'birželis', 'liepa', 'rugpjūtis', 'rugsėjis', 'spalis', 'lapkritis', 'gruodis'];
  const MONTHS_SHORT = ['Sau', 'Vas', 'Kov', 'Bal', 'Geg', 'Bir', 'Lie', 'Rgp', 'Rgs', 'Spa', 'Lap', 'Gru'];
  const pad = (n) => String(n).padStart(2, '0');

  const ui = { month: null, scroll: null, scrollKey: null };
  const month = () => ui.month || today().slice(0, 7); // 'YYYY-MM'

  function shiftMonth(m, n) {
    let y = Number(m.slice(0, 4));
    let mo = Number(m.slice(5, 7)) - 1 + n;
    y += Math.floor(mo / 12);
    mo = ((mo % 12) + 12) % 12;
    return `${y}-${pad(mo + 1)}`;
  }
  const daysOf = (m) => {
    const n = new Date(Number(m.slice(0, 4)), Number(m.slice(5, 7)), 0).getDate();
    return [...Array(n)].map((_, i) => `${m}-${pad(i + 1)}`);
  };
  const habits = () => S.state.tasks.filter((t) => t.type === 'habit').sort((a, b) => a.order - b.order);
  const isDone = (t, d) => !!(S.state.completions[d] && S.state.completions[d][t.id]);
  const scheduled = (t, d) => t.days.includes(weekday(d));
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

  /** Mėnesio skaičiai: kiekvienam įpročiui ir kiekvienai dienai. */
  function compute(m) {
    const days = daysOf(m);
    const list = habits();
    const rows = list.map((t) => {
      const goal = days.filter((d) => scheduled(t, d)).length;
      const actual = days.filter((d) => scheduled(t, d) && isDone(t, d)).length;
      return { t, goal, actual };
    });
    const perDay = days.map((d) => {
      const sch = list.filter((t) => scheduled(t, d));
      const done = sch.filter((t) => isDone(t, d)).length;
      return { d, sch: sch.length, done };
    });
    const goal = rows.reduce((s, r) => s + r.goal, 0);
    const actual = rows.reduce((s, r) => s + r.actual, 0);
    return { days, rows, perDay, goal, actual };
  }

  // ---------- dalys ----------
  function toolbar(m) {
    const y = m.slice(0, 4);
    return `
    <section class="mb-5">
      <div class="flex items-center gap-1.5">
        <button data-action="hb-today" class="btn btn-sm bg-card2 border border-line text-white hover:border-line2 !h-10 shrink-0">Šis mėnuo</button>
        <button data-action="hb-month" data-dir="-1" class="icon-btn w-10 h-10 shrink-0" aria-label="Ankstesnis mėnuo">${icon('chevron-left', 'w-5 h-5')}</button>
        <button data-action="hb-month" data-dir="1" class="icon-btn w-10 h-10 shrink-0" aria-label="Kitas mėnuo">${icon('chevron-right', 'w-5 h-5')}</button>
        <h1 class="ml-1.5 text-[22px] sm:text-3xl font-black truncate first-letter:uppercase">${MONTHS_NOM[Number(m.slice(5, 7)) - 1]} <span class="text-muted font-bold text-lg sm:text-2xl">${y}</span></h1>
      </div>
      <div class="mt-3 flex gap-1.5 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0" data-month-chips>
        ${MONTHS_SHORT.map((n, i) => {
          const key = `${y}-${pad(i + 1)}`;
          return `<button data-action="hb-goto" data-month="${key}" class="seg !h-8 !px-3 !text-[13px] shrink-0 ${key === m ? 'active' : ''}">${n}</button>`;
        }).join('')}
      </div>
    </section>`;
  }

  function stats(c) {
    const p = pct(c.actual, c.goal);
    return `
    <section class="grid grid-cols-3 gap-2.5 sm:gap-4 mb-4">
      <div class="tile p-3.5 sm:p-5"><p class="text-[11px] sm:text-xs font-bold tracking-wider uppercase text-muted">Įpročių</p><p class="mt-1 text-2xl sm:text-3xl font-black tabular-nums">${c.rows.length}</p></div>
      <div class="tile p-3.5 sm:p-5"><p class="text-[11px] sm:text-xs font-bold tracking-wider uppercase text-muted">Atlikta</p><p class="mt-1 text-2xl sm:text-3xl font-black tabular-nums">${c.actual}<span class="text-sm sm:text-base text-muted font-bold"> / ${c.goal}</span></p></div>
      <div class="tile p-3.5 sm:p-5"><p class="text-[11px] sm:text-xs font-bold tracking-wider uppercase text-muted">Progresas</p><p class="mt-1 text-2xl sm:text-3xl font-black tabular-nums text-gold">${p}%</p></div>
      <div class="col-span-3 bar !h-2.5"><i style="width:${p}%"></i></div>
    </section>`;
  }

  function cell(t, d, t0) {
    if (!scheduled(t, d)) return '<span class="text-dim text-xs">–</span>';
    const done = isDone(t, d);
    const box = `<span class="grid place-items-center w-[22px] h-[22px] rounded-[7px] border-2 transition ${done ? 'bg-gold border-gold text-black' : 'border-white/25'}">${done ? icon('check', 'w-3.5 h-3.5', 3.5) : ''}</span>`;
    if (d > t0) return `<span class="inline-grid opacity-25">${box}</span>`;
    const auto = S.isAutoHabit(t);
    return `<button data-action="${auto ? 'hb-auto' : 'hb-toggle'}" data-id="${t.id}" data-date="${d}" class="inline-grid place-items-center w-8 h-8 rounded-lg ${auto ? 'cursor-default' : 'hover:bg-white/[0.06]'}" aria-pressed="${done}" aria-label="${esc(t.title)}, ${d}">${box}</button>`;
  }

  function table(c) {
    const t0 = today();
    // savaitės (pirmadienis – sekmadienis) – grupės viršuje ir pakaitinis fonas
    const weeks = [];
    c.days.forEach((d, i) => {
      if (i === 0 || weekday(d) === 1) weeks.push({ n: weeks.length + 1, count: 0 });
      weeks[weeks.length - 1].count++;
    });
    const weekIdx = (() => { let w = -1; return c.days.map((d, i) => { if (i === 0 || weekday(d) === 1) w++; return w; }); })();
    const shade = (i) => (weekIdx[i] % 2 ? 'bg-white/[0.025]' : '');
    const name = 'sticky left-0 z-10 bg-card w-[128px] min-w-[128px] max-w-[128px] sm:w-[190px] sm:min-w-[190px] sm:max-w-[190px] px-3 sm:px-4 text-left border-r border-line overflow-hidden';
    const td = 'p-0 text-center';

    return `
    <div class="card overflow-hidden -mx-4 sm:mx-0 rounded-none sm:!rounded-3xl border-x-0 sm:border-x">
      <div class="overflow-x-auto overscroll-x-contain" data-hb-scroll>
        <table class="border-collapse text-sm w-max min-w-full">
          <thead>
            <tr class="border-b border-line">
              <th rowspan="3" class="${name} align-bottom pb-3"><span class="text-base sm:text-lg font-extrabold">Mano įpročiai</span></th>
              ${weeks.map((w, i) => `<th colspan="${w.count}" class="py-2 text-[11px] font-bold tracking-wider uppercase text-muted whitespace-nowrap ${i % 2 ? 'bg-white/[0.025]' : ''} ${i ? 'border-l border-line' : ''}">${w.count < 2 ? w.n : `${w.n} sav.`}</th>`).join('')}
            </tr>
            <tr>
              ${c.days.map((d, i) => `<th class="${td} w-9 min-w-[36px] pt-2 text-[10px] font-bold uppercase ${d === t0 ? 'text-gold' : 'text-muted'} ${shade(i)}">${C.WEEKDAYS[weekday(d) - 1].short}</th>`).join('')}
            </tr>
            <tr class="border-b border-line">
              ${c.days.map((d, i) => `<th class="${td} pb-2 pt-0.5 ${shade(i)}" ${d === t0 ? 'data-today' : ''}><span class="inline-grid place-items-center w-6 h-6 rounded-full text-xs font-bold tabular-nums ${d === t0 ? 'bg-gold text-black' : 'text-white/85'}">${Number(d.slice(8))}</span></th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${c.rows.map((r) => `
            <tr class="border-b border-line">
              <th class="${name} py-1 font-semibold">
                <button data-action="edit-task" data-id="${r.t.id}" class="flex items-center gap-2 w-full min-w-0 text-left hover:text-gold transition">
                  <span class="text-muted shrink-0">${icon(r.t.icon, 'w-4 h-4')}</span><span class="truncate text-[13px] sm:text-sm">${esc(r.t.title)}</span>
                </button>
              </th>
              ${c.days.map((d, i) => `<td class="${td} ${shade(i)}">${cell(r.t, d, t0)}</td>`).join('')}
            </tr>`).join('')}
          </tbody>
          <tfoot class="text-xs tabular-nums">
            <tr>
              <th class="${name} pt-3 pb-1 font-bold text-muted">Progresas</th>
              ${c.perDay.map((x, i) => `<td class="${td} pt-3 pb-1 font-bold ${x.d > t0 ? 'text-dim' : x.sch && x.done === x.sch ? 'text-gold' : 'text-white/80'} ${shade(i)}">${pct(x.done, x.sch)}%</td>`).join('')}
            </tr>
            <tr>
              <th class="${name} py-1 font-bold text-muted">Atlikta</th>
              ${c.perDay.map((x, i) => `<td class="${td} py-1 ${x.d > t0 ? 'text-dim' : 'text-white/80'} ${shade(i)}">${x.done}</td>`).join('')}
            </tr>
            <tr>
              <th class="${name} pt-1 pb-3 font-bold text-muted">Neatlikta</th>
              ${c.perDay.map((x, i) => `<td class="${td} pt-1 pb-3 ${x.d > t0 ? 'text-dim' : 'text-white/50'} ${shade(i)}">${x.sch - x.done}</td>`).join('')}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>`;
  }

  function analysis(c) {
    return `
    <section class="card card-pad !p-5">
      <div class="flex items-center gap-3 mb-4">
        <span class="text-gold">${icon('target', 'w-6 h-6')}</span>
        <h2 class="flex-1 text-xl font-extrabold">Analizė</h2>
      </div>
      <div class="grid grid-cols-[1fr_auto_auto] gap-x-3 gap-y-3 items-center text-sm">
        <span class="text-[11px] font-bold tracking-wider uppercase text-muted">Įprotis</span>
        <span class="text-[11px] font-bold tracking-wider uppercase text-muted text-right">Tikslas</span>
        <span class="text-[11px] font-bold tracking-wider uppercase text-muted text-right">Faktas</span>
        ${c.rows.map((r) => `
          <div class="min-w-0">
            <p class="truncate font-semibold">${esc(r.t.title)}</p>
            <div class="bar !h-1.5 mt-1.5"><i style="width:${pct(r.actual, r.goal)}%"></i></div>
          </div>
          <span class="text-right tabular-nums text-muted">${r.goal}</span>
          <span class="text-right tabular-nums font-bold">${r.actual} <span class="text-xs text-muted font-semibold">${pct(r.actual, r.goal)}%</span></span>`).join('')}
      </div>
    </section>`;
  }

  // ---------- ekranas ----------
  function render() {
    // atėjus iš kito ekrano – rodom šį mėnesį
    if (LU.app.lastRoute !== 'iprociai') { ui.month = null; ui.scrollKey = null; }
    const m = month();
    const c = compute(m);
    return `
    ${toolbar(m)}
    ${stats(c)}
    <div class="grid xl:grid-cols-[1fr_300px] gap-4 items-start">
      <div class="min-w-0">
        ${c.rows.length ? table(c) : `<div class="card card-pad text-muted">Įpročių dar nėra.</div>`}
        <div class="mt-4 flex flex-wrap gap-2.5">
          <button data-action="add-task" data-type="habit" data-lock="1" class="btn btn-sm !h-11 bg-card2 border border-line text-white hover:border-line2">${icon('plus', 'w-4 h-4')} Naujas įprotis</button>
          <button data-action="manage-habits" class="btn btn-sm !h-11 bg-card2 border border-line text-white hover:border-line2">${icon('pencil', 'w-4 h-4')} Valdyti įpročius</button>
        </div>
        <p class="mt-3 text-xs text-muted flex items-start gap-2">${icon('info', 'w-4 h-4 shrink-0')} Gali pažymėti ir praėjusias dienas – XP skaičiuojamas tą dieną. „–" – tą dieną įprotis nesuplanuotas.</p>
      </div>
      ${c.rows.length ? analysis(c) : ''}
    </div>`;
  }

  function mount(el) {
    const box = el.querySelector('[data-hb-scroll]');
    if (!box) return;
    const key = month();
    if (ui.scrollKey === key && ui.scroll != null) box.scrollLeft = ui.scroll;
    else {
      // šiandiena matoma (ne prie pat krašto)
      const th = box.querySelector('[data-today]');
      const nameW = box.querySelector('thead th').offsetWidth;
      if (th) box.scrollLeft = Math.max(0, th.offsetLeft - nameW - (box.clientWidth - nameW) / 2 + th.offsetWidth / 2);
    }
    ui.scrollKey = key;
    ui.scroll = box.scrollLeft;
    box.addEventListener('scroll', () => { ui.scroll = box.scrollLeft; }, { passive: true });
    const chip = el.querySelector('[data-month-chips] .active');
    if (chip) chip.scrollIntoView({ block: 'nearest', inline: 'center' });
  }

  // ---------- veiksmai ----------
  LU.actions['hb-month'] = (el) => { ui.month = shiftMonth(month(), Number(el.dataset.dir)); LU.app.render(); };
  LU.actions['hb-goto'] = (el) => { ui.month = el.dataset.month; LU.app.render(); };
  LU.actions['hb-today'] = () => { ui.month = null; ui.scrollKey = null; LU.app.render(); };
  LU.actions['hb-auto'] = () => toast('Pasižymi automatiškai, kai atlieki visas žvaigždute pažymėtas užduotis', { icon: 'star', ms: 3200 });
  LU.actions['hb-toggle'] = (el) => {
    const rect = el.getBoundingClientRect();
    const res = S.toggleHabitDay(el.dataset.id, el.dataset.date);
    if (!res || res.blocked) return;
    if (navigator.vibrate) navigator.vibrate(res.done ? 15 : 8);
    LU.sound.play(res.done ? 'done' : 'undo');
    LU.ui.xpFloat(`${res.xp > 0 ? '+' : ''}${res.xp} XP`, { getBoundingClientRect: () => rect }, res.xp < 0);
    LU.app.afterChange(res);
  };

  return { render, mount };
})();
