// UI pagalbinės funkcijos: ikonos, formatavimas, modalai, toast'ai, šventės animacija.
window.LU = window.LU || {};

LU.ui = (() => {
  const MONTHS_GEN = ['sausio', 'vasario', 'kovo', 'balandžio', 'gegužės', 'birželio', 'liepos', 'rugpjūčio', 'rugsėjo', 'spalio', 'lapkričio', 'gruodžio'];
  const MONTHS_NOM = ['sausis', 'vasaris', 'kovas', 'balandis', 'gegužė', 'birželis', 'liepa', 'rugpjūtis', 'rugsėjis', 'spalis', 'lapkritis', 'gruodis'];
  const WEEKDAYS = ['Sekmadienis', 'Pirmadienis', 'Antradienis', 'Trečiadienis', 'Ketvirtadienis', 'Penktadienis', 'Šeštadienis'];

  function icon(name, cls = 'w-5 h-5', sw = 2) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" class="${cls}" aria-hidden="true">${LU.ICONS[name] || LU.ICONS.circle}</svg>`;
  }

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (n) => Number(n).toLocaleString('lt-LT');
  const initials = (name) => String(name || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';

  const time = (iso) => { const d = new Date(iso); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
  const longDate = (d = new Date()) => `${WEEKDAYS[d.getDay()]}, ${MONTHS_GEN[d.getMonth()]} ${d.getDate()} d.`;
  const dayLabel = (key) => {
    const { today, addDays, parseKey } = LU.store.util;
    if (key === today()) return 'Šiandien';
    if (key === addDays(today(), -1)) return 'Vakar';
    const d = parseKey(key);
    const y = d.getFullYear() !== new Date().getFullYear() ? `${d.getFullYear()} m. ` : '';
    return `${y}${MONTHS_GEN[d.getMonth()]} ${d.getDate()} d.`;
  };
  const monthYear = (iso) => { const d = new Date(iso); return `${d.getFullYear()} m. ${MONTHS_NOM[d.getMonth()]}`; };
  function ago(iso) {
    const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60) return 'ką tik';
    if (s < 3600) return `prieš ${Math.floor(s / 60)} min.`;
    if (s < 86400) return `prieš ${Math.floor(s / 3600)} val.`;
    return `prieš ${Math.floor(s / 86400)} d.`;
  }
  /** Lietuviškos daugiskaitos formos: plural(n, 'diena', 'dienos', 'dienų') */
  function plural(n, one, few, many) {
    const m10 = n % 10;
    const m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 9 && (m100 < 11 || m100 > 19)) return few;
    return many;
  }

  function scheduleText(days) {
    if (!days || days.length === 7) return 'Kasdien';
    const s = [...days].sort().join(',');
    if (s === '1,2,3,4,5') return 'Darbo dienomis';
    if (s === '6,7') return 'Savaitgaliais';
    return [...days].sort().map((n) => LU.config.WEEKDAYS[n - 1].short).join(', ');
  }

  /** Avataras: nuotrauka arba inicialai. */
  function avatar(profile, cls = 'w-10 h-10 text-sm') {
    if (profile && profile.avatar) return `<img src="${profile.avatar}" alt="" class="${cls} rounded-full object-cover">`;
    return `<div class="${cls} rounded-full bg-white/[0.08] grid place-items-center font-semibold text-white/85">${esc(initials(profile && profile.name))}</div>`;
  }

  /** Apskritas progresas (SVG). */
  function ring(pct, size = 48, stroke = 4, track = 'rgba(255,255,255,0.08)') {
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const off = c * (1 - Math.max(0, Math.min(100, pct)) / 100);
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" class="absolute inset-0 -rotate-90" aria-hidden="true">
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${track}" stroke-width="${stroke}"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="url(#lu-gold)" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${off}" class="transition-[stroke-dashoffset] duration-700"/>
    </svg>`;
  }

  // ---------- Toast ----------
  function toast(text, opts = {}) {
    const root = document.getElementById('toast-root');
    const el = document.createElement('div');
    el.className = `toast rounded-xl bg-[#232326] px-4 py-2.5 shadow-lg text-sm font-medium ${opts.tone === 'error' ? 'text-red-300' : 'text-white'}`;
    el.textContent = text;
    root.appendChild(el);
    setTimeout(() => { el.classList.add('toast-out'); setTimeout(() => el.remove(), 300); }, opts.ms || 2600);
  }

  /** „+10 XP" užrašas, kylantis nuo elemento. */
  function xpFloat(text, anchor, negative) {
    if (!anchor) return;
    const r = anchor.getBoundingClientRect();
    const el = document.createElement('div');
    el.className = `xp-float ${negative ? 'text-muted' : 'text-gold'}`;
    el.textContent = text;
    el.style.left = `${r.left + r.width / 2}px`;
    el.style.top = `${r.top}px`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1100);
  }

  // ---------- Modalai ----------
  let modalStack = [];
  /**
   * Atidaro modalą. html – turinys; opts.onMount(el, close); opts.wide.
   * Telefone – iš apačios iškylantis lapas, kompiuteryje – centre.
   */
  function modal(html, opts = {}) {
    const root = document.getElementById('modal-root');
    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6';
    wrap.innerHTML = `
      <div class="modal-backdrop absolute inset-0 bg-black/70"></div>
      <div class="modal-panel relative w-full ${opts.wide ? 'sm:max-w-2xl' : 'sm:max-w-md'} max-h-[92vh] overflow-y-auto overscroll-contain bg-card rounded-t-3xl sm:rounded-3xl shadow-2xl pb-[env(safe-area-inset-bottom)]" role="dialog" aria-modal="true">
        ${html}
      </div>`;
    root.appendChild(wrap);
    document.body.classList.add('overflow-hidden');
    const close = () => {
      if (!wrap.isConnected) return;
      wrap.classList.add('closing');
      modalStack = modalStack.filter((m) => m !== close);
      setTimeout(() => {
        wrap.remove();
        if (!modalStack.length) document.body.classList.remove('overflow-hidden');
        if (opts.onClose) opts.onClose();
      }, 180);
    };
    modalStack.push(close);
    wrap.querySelector('.modal-backdrop').addEventListener('click', close);
    wrap.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', close));
    if (opts.onMount) opts.onMount(wrap.querySelector('.modal-panel'), close);
    const first = wrap.querySelector('[autofocus]');
    if (first && window.matchMedia('(min-width: 640px)').matches) setTimeout(() => first.focus(), 50);
    return close;
  }
  const closeTopModal = () => { const c = modalStack[modalStack.length - 1]; if (c) { c(); return true; } return false; };

  function modalHeader(title) {
    return `<div class="sticky top-0 z-10 flex items-center justify-between gap-3 bg-card px-5 sm:px-6 pt-5 pb-3">
      <h2 class="text-lg font-semibold truncate">${esc(title)}</h2>
      <button data-close class="icon-btn -mr-2" aria-label="Uždaryti">${icon('x', 'w-5 h-5')}</button>
    </div>`;
  }

  /**
   * Patvirtinimo langas. opts.typeWord – jei nurodyta, reikia įrašyti žodį (pvz. „TRINTI").
   * Grąžina Promise<boolean>.
   */
  function confirm(opts) {
    return new Promise((resolve) => {
      let ok = false;
      const html = `
        <div class="p-6">
          <h2 class="text-lg font-semibold mb-2">${esc(opts.title)}</h2>
          <p class="text-sm text-muted leading-relaxed">${opts.text || ''}</p>
          ${opts.typeWord ? `
            <label class="block mt-5 text-sm text-muted">Patvirtinimui įrašyk <b class="text-white">${esc(opts.typeWord)}</b></label>
            <input data-word class="field mt-2 uppercase" autocomplete="off" autocapitalize="characters" spellcheck="false">` : ''}
          <div class="grid grid-cols-2 gap-2.5 mt-6">
            <button data-close class="btn-ghost">${esc(opts.cancelLabel || 'Atšaukti')}</button>
            <button data-ok class="${opts.danger ? 'btn-danger' : 'btn-gold'}" ${opts.typeWord ? 'disabled' : ''}>${esc(opts.confirmLabel || 'Patvirtinti')}</button>
          </div>
        </div>`;
      modal(html, {
        onClose: () => resolve(ok),
        onMount: (el, close) => {
          const btn = el.querySelector('[data-ok]');
          const inp = el.querySelector('[data-word]');
          if (inp) inp.addEventListener('input', () => { btn.disabled = inp.value.trim().toUpperCase() !== opts.typeWord; });
          btn.addEventListener('click', () => { ok = true; close(); });
        },
      });
    });
  }

  // ---------- Lygio pakilimo šventė ----------
  let celebration = null;
  function celebrateLevel(level) {
    if (celebration) celebration(); // keli lygiai iš eilės – rodom tik naujausią

    const title = LU.store.titleFor(level);
    const isNewTitle = title.from === level;
    const close = modal(`
      <div class="px-6 pt-9 pb-6 text-center">
        <div class="levelup-badge mx-auto w-24 h-24 rounded-full grid place-items-center bg-gold text-black text-4xl font-bold tabular-nums">${level}</div>
        <h2 class="mt-6 text-2xl font-bold">Pasiekei ${level} lygį</h2>
        <p class="mt-1.5 text-muted">${isNewTitle ? 'Naujas titulas' : 'Titulas'}: <span class="text-white">${esc(title.name)}</span></p>
        ${isNewTitle ? `<p class="mt-4 text-sm text-white/60 leading-relaxed">${esc(title.text)}</p>` : ''}
        <button data-close class="btn-gold w-full mt-7">Tęsti</button>
      </div>`, { onClose: () => { if (celebration === close) celebration = null; } });
    celebration = close;
    return close;
  }

  return {
    icon, esc, fmt, initials, time, longDate, dayLabel, monthYear, ago, plural, scheduleText,
    avatar, ring, toast, xpFloat, modal, modalHeader, closeTopModal, confirm, celebrateLevel,
  };
})();
