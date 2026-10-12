// Programėlės karkasas: maršrutai, viršutinė juosta, navigacija, veiksmų delegavimas, dienos keitimasis.
window.LU = window.LU || {};
LU.actions = LU.actions || {};

LU.app = (() => {
  const { icon, esc, fmt, avatar } = LU.ui;
  const S = LU.store;

  const NAV = [
    { route: '', label: 'Pagrindinis', icon: 'house' },
    { route: 'uzduotys', label: 'Užduotys', icon: 'list-checks' },
    { route: 'lygiai', label: 'Lygiai', icon: 'sparkles' },
    { route: 'draugai', label: 'Draugai', icon: 'users' },
    { route: 'meniu', label: 'Meniu', icon: 'menu' },
  ];

  const app = {
    justToggled: null,
    installPrompt: null,
    bellOpen: false,
    lastRoute: null,
  };

  const screens = () => ({
    '': LU.screens.home,
    uzduotys: LU.screens.tasks,
    lygiai: LU.screens.levels,
    draugai: LU.screens.friends,
    meniu: LU.screens.menu,
    profilis: LU.screens.profile,
  });

  const route = () => location.hash.replace(/^#\/?/, '').split('?')[0];
  const go = (r) => { location.hash = `#/${r}`; };

  function logo(size = 'md') {
    const words = LU.config.APP_NAME.split(' ');
    const last = words.pop();
    return `<a href="#/" class="${size === 'lg' ? 'text-3xl' : 'text-lg'} font-bold tracking-tight select-none" aria-label="${esc(LU.config.APP_NAME)}">${esc(words.join(' '))}${words.length ? ' ' : ''}<span class="text-gold">${esc(last)}</span></a>`;
  }

  /** Avataras su mažu lygio skaičiumi kampe. */
  function avatarBadge(li, size = 36) {
    return `<span class="relative block shrink-0" style="width:${size}px;height:${size}px">
      ${avatar(S.state.profile, 'w-full h-full text-xs')}
      <span class="absolute -bottom-1 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-gold text-black text-[10px] font-bold grid place-items-center ring-2 ring-bg tabular-nums">${li.level}</span>
    </span>`;
  }

  function bellButton() {
    const n = S.unreadCount();
    return `<button data-action="bell" class="icon-btn relative !w-10 !h-10" aria-label="Pranešimai">
      ${icon('bell', 'w-5 h-5', 1.75)}
      ${n ? '<span class="absolute top-2 right-2 w-2 h-2 rounded-full bg-gold"></span>' : ''}
    </button>`;
  }

  function bellPanel() {
    if (!app.bellOpen) return '';
    const list = S.state.notifications;
    return `<div data-bell-panel class="fade-in fixed z-40 right-3 top-[60px] lg:right-8 lg:top-[68px] w-[min(360px,calc(100vw-24px))] card shadow-2xl">
      <h3 class="px-4 pt-4 pb-2 text-sm font-semibold">Pranešimai</h3>
      <div class="max-h-[60vh] overflow-y-auto divide-y divide-line">
        ${list.length ? list.map((n) => `
          <div class="px-4 py-3 ${n.read ? '' : 'bg-white/[0.03]'}">
            <p class="text-sm font-medium">${esc(n.title)}</p>
            <p class="text-sm text-muted">${esc(n.text)}</p>
            <p class="text-xs text-dim mt-1">${LU.ui.ago(n.at)}</p>
          </div>`).join('') : '<p class="px-4 pb-4 text-sm text-muted">Pranešimų nėra.</p>'}
      </div>
    </div>`;
  }

  function shell(r, content) {
    const li = S.levelInfo();
    const navActive = (x) => (x === r || (x === 'meniu' && r === 'profilis'));
    const sideActive = (x) => x === r;
    return `
    <!-- Mobilus viršus -->
    <header class="lg:hidden sticky top-0 z-30 bg-bg/95 backdrop-blur pt-[env(safe-area-inset-top)]">
      <div class="h-14 px-4 flex items-center justify-between">
        ${logo()}
        <div class="flex items-center gap-2">
          ${bellButton()}
          <a href="#/profilis" aria-label="Profilis">${avatarBadge(li, 32)}</a>
        </div>
      </div>
    </header>

    <!-- Kompiuterio viršus -->
    <header class="hidden lg:flex fixed top-0 inset-x-0 z-30 h-16 items-center justify-between px-8 bg-bg/95 backdrop-blur border-b border-line">
      ${logo()}
      <div class="flex items-center gap-5">
        <a href="#/lygiai" class="w-48">
          <span class="flex items-center justify-between text-xs text-muted">
            <span>Lygis ${li.level}</span><span class="tabular-nums">${fmt(li.xp)} XP</span>
          </span>
          <span class="bar block mt-1.5 !h-1"><i style="width:${li.pct}%"></i></span>
        </a>
        <div class="flex items-center gap-1">
          ${bellButton()}
          <a href="#/meniu" class="icon-btn !w-10 !h-10" aria-label="Nustatymai">${icon('settings', 'w-5 h-5', 1.75)}</a>
        </div>
        <a href="#/profilis" aria-label="Profilis">${avatarBadge(li, 34)}</a>
      </div>
    </header>

    <!-- Kompiuterio šoninė juosta -->
    <aside class="hidden lg:flex fixed left-0 top-16 bottom-0 z-20 w-20 flex-col items-center gap-2 py-5 border-r border-line bg-bg">
      ${NAV.map((n) => `<a href="#/${n.route}" class="side-item ${sideActive(n.route) ? 'active' : ''}" aria-label="${n.label}">${icon(n.icon, 'w-[22px] h-[22px]', 1.75)}<span class="tip">${n.label}</span></a>`).join('')}
      <a href="#/profilis" class="side-item ${r === 'profilis' ? 'active' : ''}" aria-label="Profilis">${icon('user', 'w-[22px] h-[22px]', 1.75)}<span class="tip">Profilis</span></a>
    </aside>

    <main id="view" class="lg:pl-20 lg:pt-16 pb-[calc(84px+env(safe-area-inset-bottom))] lg:pb-12">
      <div class="${app.lastRoute !== r ? 'fade-in' : ''} mx-auto max-w-5xl px-4 sm:px-6 lg:px-10 pt-2 pb-6 sm:py-6 lg:py-10">
        ${content}
      </div>
    </main>

    <!-- Mobili apatinė navigacija -->
    <nav class="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-bg/95 backdrop-blur border-t border-line pb-[env(safe-area-inset-bottom)]">
      <div class="grid grid-cols-5 pt-1.5 pb-1.5">
        ${NAV.map((n) => `<a href="#/${n.route}" class="nav-item ${navActive(n.route) ? 'active' : ''}">${icon(n.icon, 'w-[22px] h-[22px]', navActive(n.route) ? 2 : 1.75)}${n.label}</a>`).join('')}
      </div>
    </nav>
    ${bellPanel()}`;
  }

  function render() {
    const root = document.getElementById('app');
    if (!S.state.profile) {
      root.innerHTML = LU.screens.onboarding.render();
      LU.screens.onboarding.mount(root);
      app.lastRoute = '__onboarding';
      return;
    }
    const r = route();
    const scr = screens()[r] || screens()[''];
    const fresh = app.lastRoute !== r;
    root.innerHTML = shell(r, scr.render());
    if (scr.mount) scr.mount(root.querySelector('#view'), { fresh });
    app.lastRoute = r;
    app.justToggled = null;
  }

  // ---------- Veiksmai (delegavimas) ----------
  document.addEventListener('click', (e) => {
    const go_ = e.target.closest('[data-go]');
    if (go_) { e.preventDefault(); go(go_.dataset.go); return; }
    const a = e.target.closest('[data-action]');
    if (a && LU.actions[a.dataset.action]) {
      e.preventDefault();
      LU.actions[a.dataset.action](a, e);
      return;
    }
    if (app.bellOpen && !e.target.closest('[data-bell-panel]')) {
      app.bellOpen = false;
      render();
    }
  });

  LU.actions.bell = () => {
    app.bellOpen = !app.bellOpen;
    render();
    // atidarius – pažymim perskaitytais (paryškinimas sąraše lieka iki kito atidarymo)
    if (app.bellOpen && S.unreadCount()) {
      S.state.notifications.forEach((n) => { n.read = true; });
      S.save();
    }
  };

  /** Pažymėti / atšaukti užduotį (naudojama keliuose ekranuose). */
  LU.actions.toggle = (el) => {
    const id = el.dataset.id;
    // ta pati užduotis gali būti ir misijose, ir įpročiuose – „+XP" rodom ten, kur paspausta
    const rect = (el.querySelector('.chk') || el).getBoundingClientRect();
    const anchor = { getBoundingClientRect: () => rect };
    app.justToggled = id;
    const res = S.toggleTask(id);
    if (!res) return;
    if (navigator.vibrate) navigator.vibrate(res.done ? 15 : 8);
    LU.ui.xpFloat(`${res.xp > 0 ? '+' : ''}${res.xp} XP`, anchor, res.xp < 0);
    if (res.bonus > 0) {
      setTimeout(() => LU.ui.toast(`Visos misijos atliktos! +${res.bonus} XP premija`, { icon: 'sparkles', ms: 3200 }), 350);
    } else if (res.bonus < 0) {
      LU.ui.toast(`Premija nuimta (${res.bonus} XP)`, { icon: 'info' });
    }
    res.achievements.forEach((a, i) => setTimeout(() => LU.ui.toast(`Naujas pasiekimas: ${a.name}`, { icon: a.icon, ms: 3500 }), 700 + i * 400));
    if (res.levelUp) setTimeout(() => LU.ui.celebrateLevel(res.levelUp), 550);
  };

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (LU.ui.closeTopModal()) return;
    if (app.bellOpen) { app.bellOpen = false; render(); }
  });

  // ---------- Dienos keitimasis ----------
  function checkDay() {
    if (!S.state || !S.state.profile) return;
    if (S.touchDay()) {
      S.syncBonus(S.util.today());
      S.commit();
      LU.ui.toast('Nauja diena – naujos misijos!', { icon: 'sunrise' });
    }
  }

  // ---------- Paleidimas ----------
  async function boot() {
    await S.load();
    LU.db.persist();
    if (S.state.profile) {
      S.touchDay();
      S.syncBonus(S.util.today());
      S.checkAchievements();
    }
    S.subscribe(render);
    window.addEventListener('hashchange', () => { app.bellOpen = false; render(); window.scrollTo(0, 0); });
    render();

    setInterval(checkDay, 20000);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') checkDay();
      else S.flush();
    });
    window.addEventListener('pagehide', () => S.flush());

    window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); app.installPrompt = e; });
    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
      // Kai įsidiegia nauja versija – perkraunam vieną kartą, kad atnaujinimas matytųsi iš karto.
      const hadController = !!navigator.serviceWorker.controller;
      let reloading = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!hadController || reloading) return;
        reloading = true;
        S.flush().then(() => location.reload());
      });
      navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' })
        .then((reg) => reg.update())
        .catch((err) => console.warn('SW nepavyko', err));
    }
  }

  app.render = render;
  app.go = go;
  app.route = route;
  app.logo = logo;
  app.boot = boot;
  return app;
})();

document.addEventListener('DOMContentLoaded', () => LU.app.boot());
