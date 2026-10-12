// Programėlės karkasas: maršrutai, viršutinė juosta, navigacija, veiksmų delegavimas, dienos keitimasis.
window.LU = window.LU || {};
LU.actions = LU.actions || {};

LU.app = (() => {
  const { icon, esc, fmt, avatar, ring } = LU.ui;
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
    const big = size === 'lg' ? 'text-4xl' : 'text-[22px] lg:text-[26px]';
    return `<a href="#/" class="inline-flex flex-col leading-none select-none" aria-label="${esc(LU.config.APP_NAME)}">
      <span class="${big} font-black tracking-tight">${esc(words.join(' '))}${words.length ? ' ' : ''}<span class="text-gold">${esc(last)}</span></span>
      ${size === 'lg' ? '<span class="mt-1 text-[11px] font-bold tracking-[0.42em] text-gold">ĮPROČIŲ ŽAIDIMAS</span>' : ''}
    </a>`;
  }

  function avatarBadge(li, size = 44) {
    const p = S.state.profile;
    return `<span class="relative block shrink-0" style="width:${size}px;height:${size}px">
      ${ring(li.pct, size, 3)}
      <span class="absolute inset-[4px]">${avatar(p, 'w-full h-full text-xs')}</span>
      <span class="absolute -bottom-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-gold text-black text-[10px] font-black grid place-items-center ring-2 ring-bg">${li.level}</span>
    </span>`;
  }

  function bellButton() {
    const n = S.unreadCount();
    return `<button data-action="bell" class="relative grid place-items-center w-10 h-10 rounded-xl text-white/80 hover:text-white" aria-label="Pranešimai">
      ${icon('bell', 'w-[22px] h-[22px]')}
      ${n ? `<span class="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-gold ring-2 ring-bg"></span>` : ''}
    </button>`;
  }

  function bellPanel() {
    if (!app.bellOpen) return '';
    const list = S.state.notifications;
    return `<div data-bell-panel class="fade-in fixed z-40 right-3 top-[68px] lg:right-8 lg:top-[80px] w-[min(380px,calc(100vw-24px))] card p-2 shadow-2xl">
      <div class="flex items-center justify-between px-3 pt-2 pb-3">
        <h3 class="font-extrabold">Pranešimai</h3>
        <span class="text-xs text-muted">${list.length ? `${list.length}` : ''}</span>
      </div>
      <div class="max-h-[60vh] overflow-y-auto">
        ${list.length ? list.map((n) => `
          <div class="flex gap-3 rounded-2xl px-3 py-3 ${n.read ? '' : 'bg-gold/[0.06]'}">
            <div class="icon-box-gold w-10 h-10">${icon(n.icon, 'w-5 h-5')}</div>
            <div class="min-w-0">
              <p class="font-bold text-sm">${esc(n.title)}</p>
              <p class="text-sm text-muted">${esc(n.text)}</p>
              <p class="text-xs text-dim mt-1">${LU.ui.ago(n.at)}</p>
            </div>
          </div>`).join('') : `<p class="px-3 pb-4 text-sm text-muted">Kol kas tylu. Atlik užduotį ir pasiek naują lygį – pranešimai atsiras čia.</p>`}
      </div>
    </div>`;
  }

  function shell(r, content) {
    const li = S.levelInfo();
    const navActive = (x) => (x === r || (x === 'meniu' && r === 'profilis'));
    const sideActive = (x) => x === r;
    return `
    <!-- Mobilus viršus -->
    <header class="lg:hidden sticky top-0 z-30 bg-bg/90 backdrop-blur-md border-b border-line pt-[env(safe-area-inset-top)]">
      <div class="h-16 px-4 flex items-center justify-between">
        ${logo()}
        <div class="flex items-center gap-1.5">
          <a href="#/lygiai" class="flex items-center gap-1 px-2 text-gold font-extrabold">${icon('zap', 'w-5 h-5')}<span>${fmt(li.xp)}</span><span class="text-xs text-gold/70 font-bold">XP</span></a>
          ${bellButton()}
          <a href="#/profilis" class="ml-1" aria-label="Profilis">${avatarBadge(li, 44)}</a>
        </div>
      </div>
    </header>

    <!-- Kompiuterio viršus -->
    <header class="hidden lg:flex fixed top-0 inset-x-0 z-30 h-[76px] items-center justify-between px-8 bg-bg/90 backdrop-blur-md border-b border-line">
      ${logo()}
      <div class="flex items-center gap-6">
        <a href="#/profilis" class="flex items-center gap-4 group">
          ${avatarBadge(li, 48)}
          <span class="w-64">
            <span class="flex items-center justify-between text-xs font-extrabold tracking-[0.15em]">
              <span class="text-gold">LYGIS ${li.level}</span>
              <span class="text-white/80 tracking-normal">${fmt(li.xp)} XP</span>
            </span>
            <span class="bar block mt-2 h-2"><i style="width:${li.pct}%"></i></span>
          </span>
        </a>
        <span class="w-px h-9 bg-line2"></span>
        <div class="flex items-center gap-2">
          <a href="#/meniu" class="grid place-items-center w-10 h-10 rounded-xl text-white/80 hover:text-white" aria-label="Nustatymai">${icon('settings', 'w-[22px] h-[22px]')}</a>
          ${bellButton()}
        </div>
      </div>
    </header>

    <!-- Kompiuterio šoninė juosta -->
    <aside class="hidden lg:flex fixed left-0 top-[76px] bottom-0 z-20 w-[104px] flex-col items-center gap-3 py-6 border-r border-line bg-bg">
      ${NAV.map((n) => `<a href="#/${n.route}" class="side-item ${sideActive(n.route) ? 'active' : ''}" aria-label="${n.label}">${icon(n.icon, 'w-6 h-6')}<span class="tip">${n.label}</span></a>`).join('')}
      <span class="w-8 h-px bg-line2 my-2"></span>
      <a href="#/profilis" class="side-item ${r === 'profilis' ? 'active' : ''}" aria-label="Profilis">${icon('user', 'w-6 h-6')}<span class="tip">Profilis</span></a>
      <span class="mt-auto text-[10px] text-dim font-mono">v${LU.config.VERSION}</span>
    </aside>

    <main id="view" class="lg:pl-[104px] lg:pt-[76px] pb-[calc(96px+env(safe-area-inset-bottom))] lg:pb-12">
      <div class="${app.lastRoute !== r ? 'fade-in' : ''} mx-auto max-w-6xl px-4 sm:px-6 lg:px-10 py-5 sm:py-7 lg:py-9">
        ${content}
      </div>
    </main>

    <!-- Mobili apatinė navigacija -->
    <nav class="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-bg/95 backdrop-blur-md border-t border-line pb-[env(safe-area-inset-bottom)]">
      <div class="grid grid-cols-5 px-1 pt-2 pb-2">
        ${NAV.map((n) => `<a href="#/${n.route}" class="nav-item ${navActive(n.route) ? 'active' : ''}"><span class="nav-ico">${icon(n.icon, 'w-6 h-6')}</span>${n.label}</a>`).join('')}
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
  /** Bendri pranešimai po pakeitimo: automatinis įprotis, premija, pasiekimai, lygis. */
  function afterChange(res) {
    const auto = S.state.tasks.find(S.isAutoHabit);
    if (res.auto > 0 && auto) {
      LU.sound.play('done', 250);
      setTimeout(() => LU.ui.toast(`Visos svarbios užduotys atliktos – „${auto.title}" įvykdytas! +${LU.config.TASK_XP} XP`, { icon: 'star', ms: 3200 }), 300);
    } else if (res.auto < 0 && auto) {
      LU.ui.toast(`„${auto.title}" atšauktas (-${LU.config.TASK_XP} XP)`, { icon: 'info' });
    }
    if (res.bonus > 0) {
      LU.sound.play('bonus', 450);
      setTimeout(() => LU.ui.toast(`Visos misijos atliktos! +${res.bonus} XP premija`, { icon: 'sparkles', ms: 3200 }), 650);
    } else if (res.bonus < 0) {
      LU.ui.toast(`Premija nuimta (${res.bonus} XP)`, { icon: 'info' });
    }
    res.achievements.forEach((a, i) => setTimeout(() => { LU.sound.play('achievement'); LU.ui.toast(`Naujas pasiekimas: ${a.name}`, { icon: a.icon, ms: 3500 }); }, 900 + i * 400));
    if (res.levelUp) setTimeout(() => { LU.sound.play('levelup'); LU.ui.celebrateLevel(res.levelUp); }, 550);
  }
  app.afterChange = afterChange;

  LU.actions.toggle = (el) => {
    const id = el.dataset.id;
    // ta pati užduotis gali būti ir misijose, ir įpročiuose – „+XP" rodom ten, kur paspausta
    const rect = (el.querySelector('.chk') || el).getBoundingClientRect();
    const anchor = { getBoundingClientRect: () => rect };
    app.justToggled = id;
    const res = S.toggleTask(id);
    if (!res) return;
    if (res.blocked) {
      app.justToggled = null;
      LU.ui.toast('Pasižymės automatiškai, kai atliksi visas žvaigždute pažymėtas užduotis', { icon: 'star', ms: 3200 });
      return;
    }
    if (navigator.vibrate) navigator.vibrate(res.done ? 15 : 8);
    LU.sound.play(res.done ? 'done' : 'undo');
    LU.ui.xpFloat(`${res.xp > 0 ? '+' : ''}${res.xp} XP`, anchor, res.xp < 0);
    afterChange(res);
  };

  document.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('[role=button][data-action]')) {
      e.preventDefault();
      e.target.click();
      return;
    }
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
