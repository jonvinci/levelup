// 2. PROFILIS: avataras, lygio kortelė, statistika, pasiekimai, tikslai.
window.LU = window.LU || {};
LU.screens = LU.screens || {};

LU.screens.profile = (() => {
  const { icon, esc, fmt, avatar, modal, modalHeader, toast, plural, monthYear } = LU.ui;
  const S = LU.store;
  const C = LU.config;
  const TAG_SUGGESTIONS = ['Sveikata', 'Sportas', 'Verslas', 'Karjera', 'Mokslas', 'Finansai', 'Šeima', 'Kūryba', 'Ramybė', 'Kalbos'];

  function statTile(iconHtml, value, label, href) {
    return `
    <a ${href ? `href="${href}"` : ''} class="tile p-4 sm:p-5 flex items-start gap-3 sm:gap-4 ${href ? 'hover:border-line2 transition' : ''}">
      ${iconHtml}
      <div class="flex-1 min-w-0">
        <div class="text-2xl sm:text-[28px] font-black leading-none tabular-nums">${value}</div>
        <div class="mt-2 text-sm text-white/70 leading-snug">${label}</div>
      </div>
      ${href ? `<span class="hidden sm:block text-white/40 self-center">${icon('chevron-right', 'w-4 h-4')}</span>` : ''}
    </a>`;
  }

  function hero(st) {
    const p = S.state.profile;
    const li = st.levelInfo;
    return `
    <section class="card card-pad lg:p-10">
      <div class="flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-0">
        <div class="flex items-center gap-5 lg:w-[46%] lg:pr-10">
          <div class="relative shrink-0">
            ${avatar(p, 'w-[104px] h-[104px] sm:w-[124px] sm:h-[124px] text-3xl border-2 border-line2')}
            <label class="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-gold text-black grid place-items-center cursor-pointer ring-4 ring-card hover:bg-gold-light" aria-label="Keisti nuotrauką">
              ${icon('plus', 'w-5 h-5', 2.5)}
              <input type="file" accept="image/*" class="sr-only" data-avatar-input>
            </label>
          </div>
          <div class="min-w-0">
            <p class="text-sm font-semibold text-muted tracking-wide">${esc(C.APP_NAME)} narys</p>
            <h1 class="text-3xl sm:text-4xl font-black leading-tight truncate">${esc(p.name)}</h1>
            <span class="chip mt-3">${icon('star', 'w-4 h-4 text-gold')} ${esc(li.title.name)} · ${li.level} lygis</span>
            <p class="mt-3 text-xs text-muted flex items-center gap-1.5">${icon('calendar', 'w-3.5 h-3.5')} Prisijungė ${monthYear(p.createdAt)}</p>
          </div>
        </div>
        <div class="h-px lg:h-auto lg:w-px bg-line lg:self-stretch"></div>
        <a href="#/lygiai" class="flex-1 lg:pl-10 block group">
          <div class="flex items-center gap-3">
            <span class="pill-outline">LYGIS ${li.level}</span>
            <span class="text-xl font-bold">${esc(li.title.name)}</span>
            <span class="ml-auto tabular-nums"><b class="text-lg">${li.max ? fmt(li.xp) : fmt(li.into)}</b> <span class="text-muted">/ ${li.max ? '∞' : fmt(li.need)} XP</span></span>
          </div>
          <div class="bar mt-5 h-3"><i style="width:${li.pct}%"></i></div>
          <div class="mt-4 flex items-center justify-between">
            <span class="text-muted">${li.max ? 'Aukščiausias lygis pasiektas' : `Dar <b class="text-gold">${fmt(li.remaining)} XP</b> iki ${li.level + 1} lygio`}</span>
            <b class="tabular-nums">${li.pct} %</b>
          </div>
        </a>
      </div>
      <div class="h-px bg-line my-6 lg:my-8"></div>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5">
        ${statTile(`<span class="text-flame">${icon('flame', 'w-8 h-8')}</span>`, st.streak, `${plural(st.streak, 'Diena', 'Dienos', 'Dienų')} iš eilės`)}
        ${statTile(`<span class="text-white/90">${icon('check-check', 'w-8 h-8')}</span>`, fmt(st.tasksDone), 'Atliktos užduotys', '#/lygiai')}
        ${statTile(`<span class="text-gold">${icon('trophy', 'w-8 h-8')}</span>`, st.longestStreak, 'Ilgiausia serija')}
        ${statTile(`<span class="text-gold">${icon('calendar-days', 'w-8 h-8')}</span>`, st.activeDays, 'Dienos su app\'u')}
      </div>
    </section>`;
  }

  function achievements() {
    const un = S.state.achievements;
    const count = C.ACHIEVEMENTS.filter((a) => un[a.id]).length;
    return `
    <section class="card card-pad flex flex-col">
      <div class="flex items-center gap-3">
        <span class="text-gold">${icon('trophy', 'w-7 h-7')}</span>
        <h2 class="flex-1 text-2xl font-extrabold">Mano pasiekimai</h2>
        <span class="text-muted tabular-nums">${count} / ${C.ACHIEVEMENTS.length}</span>
      </div>
      <div class="mt-5 grid grid-cols-8 gap-1.5 sm:gap-2.5">
        ${C.ACHIEVEMENTS.map((a) => `
          <button data-action="achievements" class="aspect-square rounded-xl sm:rounded-2xl grid place-items-center border transition ${un[a.id] ? 'bg-gold/10 border-gold/40 text-gold shadow-[0_0_18px_rgba(240,180,41,0.15)]' : 'bg-card2 border-line text-white/35'}" title="${esc(a.name)}" aria-label="${esc(a.name)}">
            ${icon(un[a.id] ? a.icon : 'lock', 'w-[18px] h-[18px] sm:w-6 sm:h-6')}
          </button>`).join('')}
      </div>
      <p class="mt-5 text-muted">Rink toliau – kiekvienas ženklelis atrakinamas veiksmais.</p>
      <div class="mt-auto pt-5"><div class="h-px bg-line"></div></div>
      <button data-action="achievements" class="mt-5 flex items-center justify-between text-gold font-bold">Peržiūrėti pasiekimus ${icon('arrow-right', 'w-5 h-5')}</button>
    </section>`;
  }

  function goals() {
    const p = S.state.profile;
    return `
    <section class="card card-pad flex flex-col">
      <div class="flex items-center gap-3">
        <span class="text-gold">${icon('target', 'w-7 h-7')}</span>
        <h2 class="flex-1 text-2xl font-extrabold">Mano tikslai</h2>
        ${p.goal ? '<span class="text-sm text-muted">Išsaugota</span>' : ''}
      </div>
      <div class="mt-5 rounded-3xl bg-well border border-line p-5 flex gap-4">
        <span class="text-gold mt-0.5">${icon('target', 'w-7 h-7')}</span>
        <div class="min-w-0">
          <p class="text-muted">Pagrindinis tikslas</p>
          <p class="mt-1 text-xl sm:text-2xl font-extrabold break-words ${p.goal ? '' : 'text-white/40'}">${p.goal ? esc(p.goal) : 'Dar nenustatytas'}</p>
        </div>
      </div>
      ${p.tags && p.tags.length ? `<div class="mt-4 flex flex-wrap gap-2">${p.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>` : ''}
      <div class="mt-auto pt-5"><div class="h-px bg-line"></div></div>
      <button data-action="edit-goals" class="mt-5 flex items-center justify-between text-gold font-bold">Redaguoti mano tikslus ${icon('arrow-right', 'w-5 h-5')}</button>
    </section>`;
  }

  function codeCard() {
    return `
    <section class="card card-pad lg:col-span-2">
      <div class="flex items-center gap-3">
        <span class="text-gold">${icon('gift', 'w-7 h-7')}</span>
        <h2 class="flex-1 text-2xl font-extrabold">Pasidalink progresu</h2>
      </div>
      <p class="mt-2 text-muted">Nusiųsk savo profilio kodą draugui – jis matys tave savo lyderių lentelėje.</p>
      <div class="mt-5 flex flex-col sm:flex-row gap-3 rounded-3xl border border-gold/20 bg-well p-3 sm:p-4 sm:items-center">
        <code class="flex-1 min-w-0 px-2 text-gold font-mono text-sm break-all leading-relaxed">${esc(S.myCode())}</code>
        <button data-action="copy-code" class="btn btn-sm h-12 px-5 border border-gold/40 bg-gold/10 text-gold hover:bg-gold/20">${icon('copy', 'w-5 h-5')} Kopijuoti</button>
      </div>
      <a href="#/draugai" class="mt-5 inline-flex items-center gap-2 text-gold font-bold">Lyderių lentelė ${icon('arrow-right', 'w-5 h-5')}</a>
    </section>`;
  }

  function render() {
    const st = S.stats();
    return `
      ${hero(st)}
      <div class="grid lg:grid-cols-2 gap-4 lg:gap-6 mt-4 lg:mt-6">
        ${achievements()}
        ${goals()}
        ${codeCard()}
      </div>`;
  }

  // ---------- Avataras ----------
  function resizeImage(file, size = 320) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const s = Math.min(img.width, img.height);
        const c = document.createElement('canvas');
        c.width = size;
        c.height = size;
        c.getContext('2d').drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Nepavyko nuskaityti nuotraukos')); };
      img.src = url;
    });
  }

  async function onAvatarFile(file) {
    if (!file) return;
    try {
      const data = await resizeImage(file);
      S.updateProfile({ avatar: data });
      toast('Nuotrauka atnaujinta', { icon: 'camera' });
    } catch (e) {
      toast(e.message, { icon: 'triangle-alert', tone: 'error' });
    }
  }

  function mount(el) {
    const inp = el.querySelector('[data-avatar-input]');
    if (inp) inp.addEventListener('change', () => onAvatarFile(inp.files[0]));
  }

  // ---------- Modalai ----------
  function openAchievements() {
    const un = S.state.achievements;
    modal(`
      ${modalHeader('Pasiekimai', 'trophy')}
      <div class="px-5 sm:px-6 pb-6 space-y-2.5">
        ${C.ACHIEVEMENTS.map((a) => `
          <div class="flex items-center gap-4 rounded-2xl border p-3.5 ${un[a.id] ? 'border-gold/30 bg-gold/[0.06]' : 'border-line bg-well'}">
            <div class="${un[a.id] ? 'icon-box-gold' : 'icon-box text-white/35'} w-12 h-12">${icon(un[a.id] ? a.icon : 'lock', 'w-6 h-6')}</div>
            <div class="flex-1 min-w-0">
              <p class="font-bold ${un[a.id] ? '' : 'text-white/70'}">${esc(a.name)}</p>
              <p class="text-sm text-muted">${esc(a.text)}</p>
            </div>
            ${un[a.id] ? `<span class="text-xs text-gold font-bold whitespace-nowrap">${LU.ui.dayLabel(S.util.dateKey(new Date(un[a.id])))}</span>` : ''}
          </div>`).join('')}
      </div>`);
  }

  function openGoals() {
    const p = S.state.profile;
    let tags = [...(p.tags || [])];
    const all = () => [...new Set([...TAG_SUGGESTIONS, ...tags])];
    modal(`
      ${modalHeader('Mano tikslai', 'target')}
      <form class="px-5 sm:px-6 pb-6 space-y-6">
        <div>
          <label class="label" for="g-goal">Pagrindinis tikslas</label>
          <input id="g-goal" class="field" maxlength="60" placeholder="pvz. Nubėgti maratoną" value="${esc(p.goal || '')}" autofocus>
        </div>
        <div>
          <span class="label">Žymės</span>
          <div class="flex flex-wrap gap-2" data-tags></div>
          <div class="flex gap-2 mt-3">
            <input data-newtag class="field !h-11" maxlength="20" placeholder="Nauja žymė">
            <button type="button" data-addtag class="btn-ghost !h-11 !px-4">${icon('plus', 'w-5 h-5')}</button>
          </div>
        </div>
        <button type="submit" class="btn-gold w-full">${icon('check', 'w-5 h-5', 2.5)} Išsaugoti</button>
      </form>`, {
      onMount: (el, close) => {
        const box = el.querySelector('[data-tags]');
        const paint = () => {
          box.innerHTML = all().map((t) => `<button type="button" data-tag="${esc(t)}" class="rounded-xl border px-3 py-1.5 text-sm font-medium transition ${tags.includes(t) ? 'bg-gold/15 border-gold/60 text-gold' : 'bg-well border-line text-white/70'}">${esc(t)}</button>`).join('');
        };
        paint();
        box.addEventListener('click', (e) => {
          const b = e.target.closest('[data-tag]');
          if (!b) return;
          const t = b.dataset.tag;
          tags = tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t];
          paint();
        });
        const add = () => {
          const inp = el.querySelector('[data-newtag]');
          const v = inp.value.trim();
          if (v && !tags.includes(v)) tags.push(v);
          inp.value = '';
          paint();
        };
        el.querySelector('[data-addtag]').addEventListener('click', add);
        el.querySelector('[data-newtag]').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } });
        el.querySelector('form').addEventListener('submit', (e) => {
          e.preventDefault();
          S.updateProfile({ goal: el.querySelector('#g-goal').value.trim(), tags });
          toast('Tikslai išsaugoti', { icon: 'target' });
          close();
        });
      },
    });
  }

  function openEditProfile() {
    const p = S.state.profile;
    modal(`
      ${modalHeader('Redaguoti profilį', 'user')}
      <form class="px-5 sm:px-6 pb-6 space-y-6">
        <div class="flex items-center gap-4">
          <div data-av>${avatar(p, 'w-20 h-20 text-2xl')}</div>
          <div class="flex flex-wrap gap-2">
            <label class="btn-ghost !h-11 !px-4 cursor-pointer text-sm">${icon('camera', 'w-4 h-4')} Įkelti nuotrauką<input type="file" accept="image/*" class="sr-only" data-file></label>
            ${p.avatar ? `<button type="button" data-rm class="btn-ghost !h-11 !px-4 text-sm text-red-400">${icon('trash-2', 'w-4 h-4')} Pašalinti</button>` : ''}
          </div>
        </div>
        <div>
          <label class="label" for="p-name">Vardas</label>
          <input id="p-name" class="field" maxlength="30" value="${esc(p.name)}" required>
        </div>
        <button type="submit" class="btn-gold w-full">${icon('check', 'w-5 h-5', 2.5)} Išsaugoti</button>
      </form>`, {
      onMount: (el, close) => {
        el.querySelector('[data-file]').addEventListener('change', async (e) => {
          await onAvatarFile(e.target.files[0]);
          el.querySelector('[data-av]').innerHTML = avatar(S.state.profile, 'w-20 h-20 text-2xl');
        });
        const rm = el.querySelector('[data-rm]');
        if (rm) rm.addEventListener('click', () => { S.updateProfile({ avatar: null }); close(); toast('Nuotrauka pašalinta', { icon: 'trash-2' }); });
        el.querySelector('form').addEventListener('submit', (e) => {
          e.preventDefault();
          const name = el.querySelector('#p-name').value.trim();
          if (!name) return;
          S.updateProfile({ name });
          toast('Profilis atnaujintas', { icon: 'check' });
          close();
        });
      },
    });
  }

  LU.actions.achievements = openAchievements;
  LU.actions['edit-goals'] = openGoals;
  LU.actions['edit-profile'] = openEditProfile;
  LU.actions['copy-code'] = async () => {
    const code = S.myCode();
    try {
      await navigator.clipboard.writeText(code);
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    toast('Kodas nukopijuotas', { icon: 'copy' });
  };

  return { render, mount };
})();
