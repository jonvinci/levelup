// DRAUGAI: lyderių lentelė iš profilio kodų (be serverio).
window.LU = window.LU || {};
LU.screens = LU.screens || {};

LU.screens.friends = (() => {
  const { icon, esc, fmt, initials, avatar, ago, toast, confirm, modal, modalHeader } = LU.ui;
  const S = LU.store;

  function board() {
    const st = S.stats();
    const p = S.state.profile;
    const me = { id: p.id, me: true, name: p.name, xp: st.totalXp, level: st.level, streak: st.streak };
    const rows = [me, ...S.state.friends].sort((a, b) => b.xp - a.xp);
    return `
    <section class="card card-pad">
      <div class="flex items-center gap-3">
        <span class="text-gold">${icon('crown', 'w-7 h-7')}</span>
        <h2 class="flex-1 text-2xl font-extrabold">Lyderių lentelė</h2>
        <span class="text-muted">Iš viso</span>
      </div>
      <div class="mt-5 space-y-2.5">
        ${rows.map((r, i) => `
          <${r.me ? 'div' : 'button'} ${r.me ? '' : `data-action="friend" data-id="${r.id}"`} class="w-full flex items-center gap-3 sm:gap-4 rounded-2xl border px-3.5 sm:px-4 py-3 text-left transition ${r.me ? 'border-gold/40 bg-gold/[0.07]' : 'border-line bg-well hover:border-line2'}">
            <span class="w-6 text-center text-lg font-black tabular-nums ${i < 3 ? 'text-gold' : 'text-white/50'}">${i + 1}</span>
            ${r.me ? avatar(p, 'w-11 h-11 text-sm') : `<span class="w-11 h-11 rounded-full bg-card2 border border-line2 grid place-items-center text-sm font-bold shrink-0">${esc(initials(r.name))}</span>`}
            <span class="flex-1 min-w-0">
              <span class="flex items-center gap-2"><span class="font-semibold truncate">${esc(r.name)}</span>${r.me ? '<span class="pill-gold">TU</span>' : ''}</span>
              <span class="mt-0.5 flex items-center gap-2 text-xs text-muted">
                <span class="truncate">Lygis ${r.level}<span class="hidden sm:inline"> · ${esc(S.titleFor(r.level).name)}</span></span>
                ${r.streak ? `<span class="inline-flex items-center gap-0.5 text-flame font-bold">${icon('flame', 'w-3 h-3')}${r.streak}</span>` : ''}
              </span>
            </span>
            <span class="text-right shrink-0">
              <span class="block font-extrabold text-gold tabular-nums">${fmt(r.xp)} <span class="text-gold/70 font-bold text-sm">XP</span></span>
              ${r.me ? '' : `<span class="block text-[11px] text-dim mt-0.5">${ago(r.updatedAt)}</span>`}
            </span>
          </${r.me ? 'div' : 'button'}>`).join('')}
      </div>
      ${S.state.friends.length ? '' : `<p class="mt-5 text-sm text-muted">Kol kas čia tik tu. Įklijuok draugo profilio kodą ir varžykitės!</p>`}
    </section>`;
  }

  function myCodeCard() {
    return `
    <section class="card card-pad">
      <div class="flex items-center gap-3">
        <span class="text-gold">${icon('gift', 'w-7 h-7')}</span>
        <h2 class="flex-1 text-2xl font-extrabold">Mano profilio kodas</h2>
      </div>
      <p class="mt-2 text-sm text-muted">Nusiųsk šį kodą draugui. Kodas rodo tavo dabartinį progresą – pakilęs lygiu, nusiųsk naują.</p>
      <div class="mt-5 rounded-3xl border border-gold/20 bg-well p-4">
        <code class="block text-gold font-mono text-sm break-all leading-relaxed select-all">${esc(S.myCode())}</code>
      </div>
      <div class="mt-3 grid ${navigator.share ? 'grid-cols-2' : 'grid-cols-1'} gap-2.5">
        <button data-action="copy-code" class="btn h-12 border border-gold/40 bg-gold/10 text-gold hover:bg-gold/20">${icon('copy', 'w-5 h-5')} Kopijuoti</button>
        ${navigator.share ? `<button data-action="share-code" class="btn-ghost !h-12">${icon('share-2', 'w-5 h-5')} Dalintis</button>` : ''}
      </div>
    </section>`;
  }

  function addCard() {
    return `
    <section class="card card-pad">
      <div class="flex items-center gap-3">
        <span class="text-gold">${icon('users', 'w-7 h-7')}</span>
        <h2 class="flex-1 text-2xl font-extrabold">Pridėti draugą</h2>
      </div>
      <p class="mt-2 text-sm text-muted">Įklijuok draugo kodą. Tas pats kodas atnaujina jau pridėto draugo duomenis.</p>
      <form data-add-form class="mt-5 space-y-3">
        <textarea data-code rows="3" class="field font-mono text-sm resize-none" placeholder="LU1-..." spellcheck="false" autocapitalize="off" autocomplete="off"></textarea>
        <p data-err class="hidden text-sm text-red-400"></p>
        <div class="grid grid-cols-[auto_1fr] gap-2.5">
          ${navigator.clipboard && navigator.clipboard.readText ? `<button type="button" data-paste class="btn-ghost !h-12 !px-4" aria-label="Įklijuoti">${icon('clipboard-paste', 'w-5 h-5')}</button>` : '<span></span>'}
          <button type="submit" class="btn-gold !h-12">${icon('plus', 'w-5 h-5')} Pridėti į lentelę</button>
        </div>
      </form>
    </section>`;
  }

  function render() {
    return `
    <section class="mb-6 lg:mb-8">
      <p class="eyebrow text-gold">Be serverio</p>
      <h1 class="mt-2 text-[30px] sm:text-4xl lg:text-5xl font-black tracking-tight uppercase leading-none">Draugai</h1>
    </section>
    <div class="grid lg:grid-cols-12 gap-4 lg:gap-6 items-start">
      <div class="lg:col-span-7">${board()}</div>
      <div class="lg:col-span-5 space-y-4 lg:space-y-6">${addCard()}${myCodeCard()}</div>
    </div>`;
  }

  function mount(el) {
    const form = el.querySelector('[data-add-form]');
    const ta = form.querySelector('[data-code]');
    const err = form.querySelector('[data-err]');
    const submit = () => {
      err.classList.add('hidden');
      try {
        const res = S.addFriend(ta.value);
        toast(res.updated ? `${res.friend.name} atnaujintas` : `${res.friend.name} pridėtas į lentelę`, { icon: 'users' });
      } catch (e) {
        err.textContent = e.message;
        err.classList.remove('hidden');
      }
    };
    form.addEventListener('submit', (e) => { e.preventDefault(); submit(); });
    const paste = form.querySelector('[data-paste]');
    if (paste) {
      paste.addEventListener('click', async () => {
        try { ta.value = await navigator.clipboard.readText(); submit(); } catch (e) { ta.focus(); }
      });
    }
  }

  LU.actions['share-code'] = async () => {
    try {
      await navigator.share({ title: LU.config.APP_NAME, text: `Mano ${LU.config.APP_NAME} profilio kodas:\n${S.myCode()}` });
    } catch (e) { /* atšaukta */ }
  };

  LU.actions.friend = (b) => {
    const f = S.state.friends.find((x) => x.id === b.dataset.id);
    if (!f) return;
    const tile = (ic, v, l, cls) => `<div class="tile p-4 text-center"><div class="${cls} mx-auto w-fit">${icon(ic, 'w-6 h-6')}</div><div class="mt-2 text-2xl font-black tabular-nums">${v}</div><div class="text-xs text-muted mt-1">${l}</div></div>`;
    modal(`
      ${modalHeader('Draugo profilis', 'user')}
      <div class="px-5 sm:px-6 pb-6">
        <div class="flex flex-col items-center text-center">
          <span class="w-24 h-24 rounded-full bg-card2 border-2 border-line2 grid place-items-center text-3xl font-black">${esc(initials(f.name))}</span>
          <h3 class="mt-4 text-3xl font-black">${esc(f.name)}</h3>
          <span class="chip mt-3">${icon('star', 'w-4 h-4 text-gold')} ${esc(S.titleFor(f.level).name)} · ${f.level} lygis</span>
        </div>
        <div class="grid grid-cols-3 gap-2.5 mt-6">
          ${tile('flame', f.streak, 'Serija', 'text-flame')}
          ${tile('check-check', fmt(f.tasks), 'Užduotys', 'text-white/80')}
          ${tile('zap', fmt(f.xp), 'XP', 'text-gold')}
        </div>
        <div class="mt-3 tile px-4 py-3.5 flex items-center justify-between text-sm">
          <span class="flex items-center gap-2 text-muted">${icon('refresh-cw', 'w-4 h-4')} Kodas sukurtas</span>
          <span class="font-semibold">${ago(f.updatedAt)}</span>
        </div>
        <button data-rm class="btn-ghost w-full mt-5 text-red-400">${icon('trash-2', 'w-5 h-5')} Pašalinti iš lentelės</button>
      </div>`, {
      onMount: (el, close) => {
        el.querySelector('[data-rm]').addEventListener('click', async () => {
          close();
          const ok = await confirm({ title: 'Pašalinti draugą?', text: `<b class="text-white">${esc(f.name)}</b> dings iš tavo lyderių lentelės. Vėliau galėsi vėl pridėti pagal kodą.`, confirmLabel: 'Pašalinti', danger: true, icon: 'users' });
          if (ok) { S.removeFriend(f.id); toast('Draugas pašalintas', { icon: 'trash-2' }); }
        });
      },
    });
  };

  return { render, mount };
})();
