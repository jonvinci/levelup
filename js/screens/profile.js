// 2. PROFILIS: avataras, lygio kortelė, statistika, pasiekimai, tikslai.
window.LU = window.LU || {};
LU.screens = LU.screens || {};

LU.screens.profile = (() => {
  const { icon, esc, fmt, avatar, modal, modalHeader, toast, monthYear } = LU.ui;
  const S = LU.store;
  const C = LU.config;
  const TAG_SUGGESTIONS = ['Sveikata', 'Sportas', 'Verslas', 'Karjera', 'Mokslas', 'Finansai', 'Šeima', 'Kūryba', 'Ramybė', 'Kalbos'];

  function hero(st) {
    const p = S.state.profile;
    const li = st.levelInfo;
    const cell = (value, label) => `
      <div class="px-1 text-center">
        <div class="text-xl font-semibold tabular-nums leading-none">${value}</div>
        <div class="mt-1.5 text-xs text-muted">${label}</div>
      </div>`;
    return `
    <section class="flex items-center gap-4">
      <div class="relative shrink-0">
        ${avatar(p, 'w-[72px] h-[72px] text-xl')}
        <label class="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#232326] text-white/80 grid place-items-center cursor-pointer ring-2 ring-bg hover:text-white" aria-label="Keisti nuotrauką">
          ${icon('camera', 'w-3.5 h-3.5', 2)}
          <input type="file" accept="image/*" class="sr-only" data-avatar-input>
        </label>
      </div>
      <div class="min-w-0">
        <h1 class="page-title truncate">${esc(p.name)}</h1>
        <p class="text-sm text-muted">${esc(li.title.name)} · ${li.level} lygis</p>
        <p class="text-xs text-dim mt-0.5">Prisijungė ${monthYear(p.createdAt)}</p>
      </div>
    </section>

    <a href="#/lygiai" class="card card-pad block mt-5">
      <div class="flex items-baseline justify-between gap-4 text-sm">
        <span>Lygis ${li.level} · ${esc(li.title.name)}</span>
        <span class="text-muted tabular-nums">${li.max ? fmt(li.xp) : `${fmt(li.into)} / ${fmt(li.need)}`} XP</span>
      </div>
      <div class="bar mt-3"><i style="width:${li.pct}%"></i></div>
      <p class="mt-2.5 text-sm text-muted">${li.max ? 'Aukščiausias lygis' : `Dar ${fmt(li.remaining)} XP iki ${li.level + 1} lygio · ${li.pct} %`}</p>
    </a>

    <div class="card grid grid-cols-4 items-center divide-x divide-line py-4 mt-3">
      ${cell(st.streak, 'Serija')}
      ${cell(fmt(st.tasksDone), 'Atlikta')}
      ${cell(st.longestStreak, 'Ilgiausia')}
      ${cell(st.activeDays, 'Dienos')}
    </div>`;
  }

  function achievements() {
    const un = S.state.achievements;
    const count = C.ACHIEVEMENTS.filter((a) => un[a.id]).length;
    return `
    <section class="card card-pad">
      <div class="flex items-baseline justify-between gap-3">
        <h2 class="h-section">Pasiekimai</h2>
        <span class="text-sm text-muted tabular-nums">${count}/${C.ACHIEVEMENTS.length}</span>
      </div>
      <div class="mt-4 grid grid-cols-8 gap-1.5">
        ${C.ACHIEVEMENTS.map((a) => `
          <button data-action="achievements" class="aspect-square rounded-xl grid place-items-center ${un[a.id] ? 'bg-gold/10 text-gold' : 'bg-white/[0.04] text-white/20'}" title="${esc(a.name)}" aria-label="${esc(a.name)}">
            ${icon(un[a.id] ? a.icon : 'lock', 'w-[18px] h-[18px]', 1.75)}
          </button>`).join('')}
      </div>
      <button data-action="achievements" class="link mt-4">Visi pasiekimai</button>
    </section>`;
  }

  function goals() {
    const p = S.state.profile;
    return `
    <section class="card card-pad">
      <div class="flex items-baseline justify-between gap-3">
        <h2 class="h-section">Tikslai</h2>
        <button data-action="edit-goals" class="text-sm text-gold">Redaguoti</button>
      </div>
      <p class="mt-3 text-lg font-semibold break-words ${p.goal ? '' : 'text-white/30'}">${p.goal ? esc(p.goal) : 'Pagrindinis tikslas nenustatytas'}</p>
      ${p.tags && p.tags.length ? `<div class="mt-3 flex flex-wrap gap-1.5">${p.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>` : ''}
    </section>`;
  }

  function codeCard() {
    return `
    <section class="card card-pad lg:col-span-2">
      <div class="flex items-baseline justify-between gap-3">
        <h2 class="h-section">Profilio kodas</h2>
        <a href="#/draugai" class="text-sm text-gold">Draugai</a>
      </div>
      <p class="mt-1 text-sm text-muted">Nusiųsk draugui – jis matys tave savo lyderių lentelėje.</p>
      <code class="mt-3 block font-mono text-xs text-white/60 break-all leading-relaxed">${esc(S.myCode())}</code>
      <button data-action="copy-code" class="btn-ghost btn-sm mt-3">${icon('copy', 'w-4 h-4', 1.75)} Kopijuoti</button>
    </section>`;
  }

  function render() {
    const st = S.stats();
    return `
    <div class="max-w-3xl">
      ${hero(st)}
      <div class="grid lg:grid-cols-2 gap-3 lg:gap-4 mt-3 lg:mt-4">
        ${achievements()}
        ${goals()}
        ${codeCard()}
      </div>
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
      ${modalHeader('Pasiekimai')}
      <div class="px-5 sm:px-6 pb-6 divide-y divide-line">
        ${C.ACHIEVEMENTS.map((a) => `
          <div class="flex items-center gap-3.5 py-3">
            <span class="${un[a.id] ? 'text-gold' : 'text-white/20'} shrink-0">${icon(un[a.id] ? a.icon : 'lock', 'w-5 h-5', 1.75)}</span>
            <div class="flex-1 min-w-0">
              <p class="${un[a.id] ? '' : 'text-white/60'}">${esc(a.name)}</p>
              <p class="text-sm text-muted">${esc(a.text)}</p>
            </div>
            ${un[a.id] ? `<span class="text-xs text-muted whitespace-nowrap">${LU.ui.dayLabel(S.util.dateKey(new Date(un[a.id])))}</span>` : ''}
          </div>`).join('')}
      </div>`);
  }

  function openGoals() {
    const p = S.state.profile;
    let tags = [...(p.tags || [])];
    const all = () => [...new Set([...TAG_SUGGESTIONS, ...tags])];
    modal(`
      ${modalHeader('Tikslai')}
      <form class="px-5 sm:px-6 pb-6 space-y-5">
        <div>
          <label class="label" for="g-goal">Pagrindinis tikslas</label>
          <input id="g-goal" class="field" maxlength="60" placeholder="pvz. Nubėgti maratoną" value="${esc(p.goal || '')}" autofocus>
        </div>
        <div>
          <span class="label">Žymės</span>
          <div class="flex flex-wrap gap-2" data-tags></div>
          <div class="flex gap-2 mt-3">
            <input data-newtag class="field !h-11" maxlength="20" placeholder="Nauja žymė">
            <button type="button" data-addtag class="btn-ghost !h-11 !px-4" aria-label="Pridėti žymę">${icon('plus', 'w-5 h-5', 1.75)}</button>
          </div>
        </div>
        <button type="submit" class="btn-gold w-full">Išsaugoti</button>
      </form>`, {
      onMount: (el, close) => {
        const box = el.querySelector('[data-tags]');
        const paint = () => {
          box.innerHTML = all().map((t) => `<button type="button" data-tag="${esc(t)}" class="opt px-3 py-1.5 text-sm !font-medium" aria-pressed="${tags.includes(t)}">${esc(t)}</button>`).join('');
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
      ${modalHeader('Redaguoti profilį')}
      <form class="px-5 sm:px-6 pb-6 space-y-5">
        <div class="flex items-center gap-4">
          <div data-av>${avatar(p, 'w-20 h-20 text-2xl')}</div>
          <div class="flex flex-wrap gap-2">
            <label class="btn-ghost btn-sm cursor-pointer">Įkelti nuotrauką<input type="file" accept="image/*" class="sr-only" data-file></label>
            ${p.avatar ? `<button type="button" data-rm class="btn-ghost btn-sm text-red-400">Pašalinti</button>` : ''}
          </div>
        </div>
        <div>
          <label class="label" for="p-name">Vardas</label>
          <input id="p-name" class="field" maxlength="30" value="${esc(p.name)}" required>
        </div>
        <button type="submit" class="btn-gold w-full">Išsaugoti</button>
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
