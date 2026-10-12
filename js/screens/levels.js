// 3. LYGIŲ SISTEMA: progresas, gyvatėlės takas („Kelias") ir XP istorija.
window.LU = window.LU || {};
LU.screens = LU.screens || {};

LU.screens.levels = (() => {
  const { icon, esc, fmt, time, dayLabel, modal, modalHeader } = LU.ui;
  const S = LU.store;
  const C = LU.config;

  const view = { tab: 'path', selected: null, historyLimit: 60 };
  const isDesktop = () => window.matchMedia('(min-width: 1024px)').matches;

  // ---------- Viršus ----------
  function header(li) {
    return `
    <div class="flex items-center justify-between mb-5">
      <h1 class="page-title">Lygiai</h1>
      <a href="#/" class="icon-btn" aria-label="Uždaryti">${icon('x', 'w-5 h-5')}</a>
    </div>
    <div class="card card-pad">
      <div class="flex items-end justify-between gap-4">
        <div>
          <p class="text-sm text-muted">Lygis</p>
          <p class="text-5xl font-semibold leading-none mt-1 tabular-nums">${li.level}</p>
        </div>
        <div class="text-right">
          <p class="text-lg font-semibold">${esc(li.title.name)}</p>
          <p class="text-sm text-muted tabular-nums">${fmt(li.xp)} / ${li.max ? fmt(li.xp) : fmt(li.next)} XP</p>
        </div>
      </div>
      <div class="bar mt-4"><i style="width:${li.pct}%"></i></div>
      <p class="mt-2.5 text-sm text-muted">${li.max ? 'Aukščiausias lygis' : `${fmt(li.remaining)} XP iki ${li.level + 1} lygio`}</p>
    </div>`;
  }

  function tabs() {
    return `
    <div class="flex gap-6 mt-6 mb-6 border-b border-line">
      <button data-action="lv-tab" data-tab="path" class="tab ${view.tab === 'path' ? 'active' : ''}">Kelias</button>
      <button data-action="lv-tab" data-tab="history" class="tab ${view.tab === 'history' ? 'active' : ''}">XP istorija</button>
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
      ? { perRow: 5, rowH: 150, top: 50, node: 52, cur: 72, seg: 4, ico: 'w-6 h-6', icoCur: 'w-8 h-8', lbl: 'text-xs', gap: 8 }
      // telefone – 3 per eilę ir stambesni mazgai, kad takas būtų „priartintas"
      : { perRow: 3, rowH: 140, top: 50, node: 60, cur: 80, seg: 4, ico: 'w-6 h-6', icoCur: 'w-8 h-8', lbl: 'text-[13px]', gap: 8 };
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
        <button data-action="lv-node" data-level="${L}" ${state === 'current' ? 'data-current' : ''} class="path-node ${state} ${sel} absolute rounded-full grid place-items-center" style="left:${p.x}%;top:${y(p.row)}px;width:${sz}px;height:${sz}px;transform:translate(-50%,-50%)" aria-label="${L} lygis – ${esc(title)}">
          ${icon(S.levelIcon(L), state === 'current' ? M.icoCur : M.ico, 1.75)}
        </button>
        <div class="absolute pointer-events-none text-center leading-tight bg-bg px-1.5 py-0.5 rounded-md" style="left:${p.x}%;top:${y(p.row) + sz / 2 + M.gap}px;transform:translateX(-50%);max-width:${100 / PER_ROW - 1}%">
          <span class="block ${M.lbl} tabular-nums ${state === 'future' ? 'text-dim' : 'text-muted'}">${L}</span>
          <span class="block ${M.lbl} truncate ${state === 'future' ? 'text-white/40' : 'text-white'} ${state === 'current' ? 'font-semibold' : ''}">${esc(title)}</span>
        </div>`;
    }

    return `<div class="relative w-full select-none" style="height:${height}px">${segs}${nodes}</div>`;
  }

  // ---------- Titulo panelė ----------
  function panel(level, li) {
    const t = S.titleFor(level);
    const start = S.levelStartXp(level);
    const state = level < li.level ? 'reached' : level === li.level ? 'current' : 'future';
    const status = state === 'current' ? 'Esi čia' : state === 'reached' ? 'Pasiekta' : `Dar ${fmt(start - li.xp)} XP`;
    return `
      <p class="text-sm text-muted">Lygis ${level} · ${status}</p>
      <h3 class="mt-1 text-2xl font-semibold">${esc(t.name)}</h3>
      <p class="mt-0.5 text-sm text-muted tabular-nums">${t.from}–${t.to} lygiai · nuo ${fmt(S.levelStartXp(t.from))} XP</p>
      <p class="mt-4 text-sm text-white/75 leading-relaxed">${esc(t.text)}</p>`;
  }

  // ---------- XP istorija ----------
  function history() {
    const log = [...S.state.xpLog].sort((a, b) => (a.at < b.at ? 1 : -1));
    if (!log.length) return '<p class="text-sm text-muted">Istorija tuščia. Atlik pirmą užduotį ir čia atsiras tavo XP.</p>';
    const shown = log.slice(0, view.historyLimit);
    const groups = [];
    shown.forEach((l) => {
      let g = groups[groups.length - 1];
      if (!g || g.date !== l.date) { g = { date: l.date, items: [] }; groups.push(g); }
      g.items.push(l);
    });
    const dayTotal = (date) => S.state.xpLog.filter((l) => l.date === date).reduce((s, l) => s + l.amount, 0);
    return `
    <div class="space-y-6">
      ${groups.map((g) => `
        <section>
          <div class="flex items-center justify-between px-1 mb-2 text-sm">
            <h3 class="text-muted">${dayLabel(g.date)}</h3>
            <span class="text-muted tabular-nums">+${fmt(dayTotal(g.date))} XP</span>
          </div>
          <div class="list-group">
            ${g.items.map((l) => `
              <div class="flex items-center gap-3 px-4 py-3">
                <div class="flex-1 min-w-0">
                  <p class="truncate">${esc(l.label)}</p>
                  <p class="text-xs text-muted mt-0.5">${l.kind === 'bonus' ? 'Premija' : 'Užduotis'} · ${time(l.at)}</p>
                </div>
                <span class="text-sm text-gold tabular-nums">+${l.amount}</span>
              </div>`).join('')}
          </div>
        </section>`).join('')}
      ${log.length > shown.length ? '<button data-action="lv-more" class="btn-ghost w-full">Rodyti daugiau</button>' : ''}
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
      modal(`${modalHeader(`${L} lygis`)}<div class="px-5 sm:px-6 pb-7">${panel(L, S.levelInfo())}</div>`);
    }
  };

  return { render, mount };
})();
