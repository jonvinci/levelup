// 3. LYGIŲ SISTEMA: progresas, gyvatėlės takas („Kelias") ir XP istorija.
window.LU = window.LU || {};
LU.screens = LU.screens || {};

LU.screens.levels = (() => {
  const { icon, esc, fmt, ring, time, dayLabel, modal, modalHeader } = LU.ui;
  const S = LU.store;
  const C = LU.config;

  const view = { tab: 'path', selected: null, historyLimit: 60 };
  const isDesktop = () => window.matchMedia('(min-width: 1024px)').matches;

  // ---------- Viršus ----------
  function header(li) {
    return `
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <div class="icon-box w-10 h-10 text-white/80">${icon('sparkles', 'w-5 h-5')}</div>
        <h1 class="text-sm font-extrabold tracking-[0.2em]">LYGIŲ SISTEMA</h1>
      </div>
      <a href="#/" class="icon-btn w-10 h-10" aria-label="Uždaryti">${icon('x', 'w-5 h-5')}</a>
    </div>
    <div class="flex items-center gap-5 sm:gap-7">
      <div class="relative w-[92px] h-[92px] sm:w-[112px] sm:h-[112px] shrink-0">
        <span class="sm:hidden">${ring(li.pct, 92, 7)}</span>
        <span class="hidden sm:block">${ring(li.pct, 112, 8)}</span>
        <div class="absolute inset-0 grid place-items-center text-center">
          <div><div class="text-4xl sm:text-5xl font-black leading-none">${li.level}</div><div class="text-[9px] font-bold tracking-[0.2em] text-muted mt-1">LYGIS</div></div>
        </div>
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-3 flex-wrap">
          <h2 class="text-[26px] sm:text-4xl font-black leading-none">${esc(li.title.name)}</h2>
          <span class="pill-gold">DABAR</span>
        </div>
        <div class="hidden sm:block">${progressLine(li)}</div>
      </div>
    </div>
    <div class="sm:hidden mt-5">${progressLine(li)}</div>`;
  }

  function progressLine(li) {
    return `
      <div class="flex items-center justify-between mt-3 text-sm">
        <span class="text-muted tabular-nums">${fmt(li.xp)} / ${li.max ? fmt(li.xp) : fmt(li.next)} XP</span>
        <span class="text-gold font-extrabold">${li.max ? 'Aukščiausias lygis!' : `${fmt(li.remaining)} XP iki ${li.level + 1} lygio`}</span>
      </div>
      <div class="bar mt-2.5"><i style="width:${li.pct}%"></i></div>`;
  }

  function tabs() {
    return `
    <div class="flex gap-2 mt-7 mb-6">
      <button data-action="lv-tab" data-tab="path" class="seg ${view.tab === 'path' ? 'active' : ''}">${icon('map', 'w-4 h-4')} Kelias</button>
      <button data-action="lv-tab" data-tab="history" class="seg ${view.tab === 'history' ? 'active' : ''}">${icon('history', 'w-4 h-4')} XP istorija</button>
    </div>`;
  }

  // ---------- Takas ----------
  /** Mazgo vieta gyvatėlėje: eilės kryptis keičiasi kas eilę. perRow – mazgų eilėje. */
  function pos(level, perRow) {
    const idx = level - 1;
    const row = Math.floor(idx / perRow);
    const p = idx % perRow;
    const col = row % 2 === 0 ? p : perRow - 1 - p;
    return { row, col, x: ((col + 0.5) / perRow) * 100 };
  }

  /** Takas pieštas dviem dydžiais: telefonui (sm) ir kompiuteriui (lg). */
  function path(li, size) {
    const M = size === 'lg'
      ? { perRow: 5, rowH: 168, top: 56, node: 58, cur: 88, seg: 10, num: 'w-6 h-6 text-[11px]', ico: 'w-6 h-6', icoCur: 'w-9 h-9', lbl: 'text-xs', gap: 10 }
      : { perRow: 5, rowH: 116, top: 44, node: 42, cur: 60, seg: 7, num: 'w-[18px] h-[18px] text-[9px]', ico: 'w-[18px] h-[18px]', icoCur: 'w-7 h-7', lbl: 'text-[9px]', gap: 6 };
    const PER_ROW = M.perRow;
    const rows = Math.ceil(C.MAX_LEVEL / PER_ROW);
    const height = M.top + (rows - 1) * M.rowH + 70;
    const y = (row) => M.top + row * M.rowH;
    const cur = li.level;
    let segs = '';
    let nodes = '';

    for (let L = 1; L < C.MAX_LEVEL; L++) {
      const a = pos(L, PER_ROW);
      const b = pos(L + 1, PER_ROW);
      // užpildymas: pasiekta – 100 %, nuo dabartinio iki kito – pagal XP progresą
      const fill = L + 1 <= cur ? 1 : L === cur ? li.pct / 100 : 0;
      if (a.row === b.row) {
        const left = Math.min(a.x, b.x);
        const w = Math.abs(a.x - b.x);
        const top = y(a.row) - M.seg / 2;
        segs += `<div class="path-seg" style="left:${left}%;width:${w}%;top:${top}px;height:${M.seg}px"></div>`;
        if (fill > 0) {
          const fw = w * fill;
          const fl = a.x < b.x ? a.x : a.x - fw; // pildoma nuo dabartinio mazgo pusės
          segs += `<div class="path-seg gold" style="left:${fl}%;width:${fw}%;top:${top}px;height:${M.seg}px"></div>`;
        }
      } else {
        const top = y(a.row);
        segs += `<div class="path-seg" style="left:calc(${a.x}% - ${M.seg / 2}px);width:${M.seg}px;top:${top}px;height:${M.rowH}px"></div>`;
        if (fill > 0) segs += `<div class="path-seg gold" style="left:calc(${a.x}% - ${M.seg / 2}px);width:${M.seg}px;top:${top}px;height:${M.rowH * fill}px"></div>`;
      }
    }

    for (let L = 1; L <= C.MAX_LEVEL; L++) {
      const p = pos(L, PER_ROW);
      const state = L < cur ? 'reached' : L === cur ? 'current' : 'future';
      const sz = state === 'current' ? M.cur : M.node;
      const title = S.titleFor(L).name;
      const sel = view.selected === L && L !== cur ? 'selected' : '';
      nodes += `
        <button data-action="lv-node" data-level="${L}" ${state === 'current' ? 'data-current' : ''} class="path-node ${state} ${state === 'current' ? 'pulse-gold' : ''} ${sel} absolute rounded-full grid place-items-center" style="left:${p.x}%;top:${y(p.row)}px;width:${sz}px;height:${sz}px;transform:translate(-50%,-50%)" aria-label="${L} lygis – ${esc(title)}">
          ${icon(S.levelIcon(L), state === 'current' ? M.icoCur : M.ico, state === 'future' ? 1.75 : 2.1)}
          <span class="absolute -top-0.5 -left-0.5 ${M.num} rounded-full grid place-items-center font-black bg-black ${state === 'future' ? 'text-white/80 border border-white/15' : 'text-white border border-gold/70'}">${L}</span>
        </button>
        <div class="absolute pointer-events-none flex flex-col items-center gap-1" style="left:${p.x}%;top:${y(p.row) + sz / 2 + M.gap}px;transform:translateX(-50%);max-width:${100 / PER_ROW - 1}%">
          <span class="${M.lbl} max-w-full truncate font-bold rounded-md px-1.5 py-0.5 bg-black/80 ${state === 'future' ? 'text-white/55' : 'text-white'}">${esc(title)}</span>
          ${state === 'current' ? `<span class="pill-gold !text-[9px] !px-2">DABAR</span>` : ''}
        </div>`;
    }

    return `<div class="relative w-full select-none" style="height:${height}px">${segs}${nodes}</div>`;
  }

  // ---------- Titulo panelė ----------
  function panel(level, li) {
    const t = S.titleFor(level);
    const start = S.levelStartXp(level);
    const state = level < li.level ? 'reached' : level === li.level ? 'current' : 'future';
    const badge = state === 'current'
      ? '<span class="pill-outline text-[10px]">ESI ČIA</span>'
      : state === 'reached'
        ? `<span class="pill-outline text-[10px]">${icon('check', 'w-3 h-3 mr-1', 3)}PASIEKTA</span>`
        : `<span class="inline-flex items-center gap-1 rounded-lg border border-line2 text-white/60 text-[10px] font-extrabold tracking-wider px-2.5 py-1">${icon('lock', 'w-3 h-3')}UŽRAKINTA</span>`;
    return `
      <div class="flex items-center justify-between">
        <p class="eyebrow text-muted">Lygis ${level}</p>
        ${badge}
      </div>
      <h3 class="mt-3 text-3xl font-black">${esc(t.name)}</h3>
      <p class="mt-1 text-sm text-muted tabular-nums">${fmt(start)} XP${state === 'future' ? ` <span class="text-white/30">·</span> <span class="text-gold font-bold">dar ${fmt(start - li.xp)} XP</span>` : ''}</p>
      <div class="mt-6 rounded-3xl border border-line2 bg-white/[0.02] p-5">
        <p class="flex items-center gap-2 text-[11px] font-extrabold tracking-[0.15em] text-white/70">${icon('crown', 'w-4 h-4 text-gold')} KĄ REIŠKIA ŠIS TITULAS</p>
        <div class="mt-4 flex gap-4">
          <div class="icon-box-gold w-12 h-12">${icon(S.levelIcon(level), 'w-6 h-6')}</div>
          <div>
            <p class="font-extrabold text-lg leading-tight">${esc(t.name)}</p>
            <p class="text-xs text-gold/80 font-semibold mt-0.5">${t.from}–${t.to} lygiai</p>
            <p class="mt-2 text-sm text-white/70 leading-relaxed">${esc(t.text)}</p>
          </div>
        </div>
      </div>`;
  }

  // ---------- XP istorija ----------
  function history() {
    const log = [...S.state.xpLog].sort((a, b) => (a.at < b.at ? 1 : -1));
    if (!log.length) {
      return `<div class="card card-pad text-center py-12">
        <div class="icon-box-gold w-14 h-14 mx-auto">${icon('history', 'w-7 h-7')}</div>
        <p class="mt-4 font-bold text-lg">Istorija tuščia</p>
        <p class="mt-1 text-muted text-sm">Atlik pirmą užduotį ir čia atsiras tavo XP.</p>
      </div>`;
    }
    const shown = log.slice(0, view.historyLimit);
    const groups = [];
    shown.forEach((l) => {
      let g = groups[groups.length - 1];
      if (!g || g.date !== l.date) { g = { date: l.date, items: [] }; groups.push(g); }
      g.items.push(l);
    });
    const dayTotal = (date) => S.state.xpLog.filter((l) => l.date === date).reduce((s, l) => s + l.amount, 0);
    return `
    <div class="space-y-5">
      ${groups.map((g) => `
        <section>
          <div class="flex items-center justify-between px-1 mb-2">
            <h3 class="eyebrow text-muted">${dayLabel(g.date)}</h3>
            <span class="text-sm font-extrabold text-gold tabular-nums">+${fmt(dayTotal(g.date))} XP</span>
          </div>
          <div class="list-group">
            ${g.items.map((l) => `
              <div class="flex items-center gap-3.5 px-4 sm:px-5 py-3.5">
                <div class="${l.kind === 'bonus' ? 'icon-box-gold' : 'icon-box text-white/70'} w-10 h-10">${icon(l.icon || (l.kind === 'bonus' ? 'sparkles' : 'circle-check'), 'w-5 h-5')}</div>
                <div class="flex-1 min-w-0">
                  <p class="font-semibold truncate">${esc(l.label)}</p>
                  <p class="text-xs text-muted mt-0.5">${l.kind === 'bonus' ? 'Premija' : 'Užduotis'} · ${time(l.at)}</p>
                </div>
                <span class="font-extrabold text-gold tabular-nums">+${l.amount} XP</span>
              </div>`).join('')}
          </div>
        </section>`).join('')}
      ${log.length > shown.length ? `<button data-action="lv-more" class="btn-ghost w-full">Rodyti daugiau ${icon('chevron-down', 'w-4 h-4')}</button>` : ''}
    </div>`;
  }

  function render() {
    const li = S.levelInfo();
    const sel = view.selected || li.level;
    return `
    ${header(li)}
    ${tabs()}
    ${view.tab === 'history' ? `<div class="max-w-3xl">${history()}</div>` : `
      <div class="grid lg:grid-cols-[minmax(0,1fr)_340px] gap-6 lg:gap-10 items-start">
        <div class="-mx-1 sm:mx-0">
          <div class="lg:hidden">${path(li, 'sm')}</div>
          <div class="hidden lg:block">${path(li, 'lg')}</div>
        </div>
        <aside class="card card-pad lg:sticky lg:top-[100px]" data-panel>${panel(sel, li)}</aside>
      </div>`}`;
  }

  function mount(el, { fresh }) {
    if (fresh) {
      view.selected = null;
      if (view.tab === 'path') {
        requestAnimationFrame(() => {
          const node = [...el.querySelectorAll('[data-current]')].find((n) => n.offsetParent);
          if (node && node.getBoundingClientRect().top > window.innerHeight * 0.7) node.scrollIntoView({ block: 'center' });
        });
      }
    }
  }

  LU.actions['lv-tab'] = (b) => { view.tab = b.dataset.tab; LU.app.render(); };
  LU.actions['lv-more'] = () => { view.historyLimit += 100; LU.app.render(); };
  LU.actions['lv-node'] = (b) => {
    const L = Number(b.dataset.level);
    if (isDesktop()) {
      view.selected = L;
      LU.app.render();
    } else {
      modal(`${modalHeader(`${L} lygis`, S.levelIcon(L))}<div class="px-5 sm:px-6 pb-7">${panel(L, S.levelInfo())}</div>`);
    }
  };

  return { render, mount };
})();
