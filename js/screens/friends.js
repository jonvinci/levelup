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
    <section>
      <h2 class="h-section mb-3">Lyderių lentelė</h2>
      <div class="list-group">
        ${rows.map((r, i) => `
          <${r.me ? 'div' : 'button'} ${r.me ? '' : `data-action="friend" data-id="${r.id}"`} class="list-row ${r.me ? 'bg-white/[0.03]' : ''}">
            <span class="w-5 text-sm tabular-nums ${i === 0 ? 'text-gold' : 'text-muted'}">${i + 1}</span>
            ${r.me ? avatar(p, 'w-9 h-9 text-xs') : `<span class="w-9 h-9 rounded-full bg-white/[0.08] grid place-items-center text-xs font-semibold shrink-0">${esc(initials(r.name))}</span>`}
            <span class="flex-1 min-w-0">
              <span class="block truncate">${esc(r.name)}${r.me ? '<span class="text-muted"> (tu)</span>' : ''}</span>
              <span class="block text-xs text-muted truncate">Lygis ${r.level}${r.streak ? ` · serija ${r.streak}` : ''}${r.me ? '' : ` · ${ago(r.updatedAt)}`}</span>
            </span>
            <span class="text-sm tabular-nums shrink-0">${fmt(r.xp)} <span class="text-muted">XP</span></span>
          </${r.me ? 'div' : 'button'}>`).join('')}
      </div>
      ${S.state.friends.length ? '' : '<p class="mt-3 text-sm text-muted">Kol kas čia tik tu. Įklijuok draugo profilio kodą.</p>'}
    </section>`;
  }

  function myCodeCard() {
    return `
    <section class="card card-pad">
      <h2 class="h-section">Mano profilio kodas</h2>
      <p class="mt-1 text-sm text-muted">Nusiųsk draugui. Pakilęs lygiu – nusiųsk naują.</p>
      <code class="mt-3 block font-mono text-xs text-white/60 break-all leading-relaxed select-all">${esc(S.myCode())}</code>
      <div class="mt-3 flex gap-2">
        <button data-action="copy-code" class="btn-ghost btn-sm">${icon('copy', 'w-4 h-4', 1.75)} Kopijuoti</button>
        ${navigator.share ? `<button data-action="share-code" class="btn-ghost btn-sm">${icon('share-2', 'w-4 h-4', 1.75)} Dalintis</button>` : ''}
      </div>
    </section>`;
  }

  function addCard() {
    return `
    <section class="card card-pad">
      <h2 class="h-section">Pridėti draugą</h2>
      <p class="mt-1 text-sm text-muted">Įklijuok draugo kodą. Tas pats kodas atnaujina jo duomenis.</p>
      <form data-add-form class="mt-3 space-y-2.5">
        <textarea data-code rows="3" class="field font-mono text-sm resize-none" placeholder="LU1-..." spellcheck="false" autocapitalize="off" autocomplete="off"></textarea>
        <p data-err class="hidden text-sm text-red-400"></p>
        <div class="flex gap-2">
          ${navigator.clipboard && navigator.clipboard.readText ? `<button type="button" data-paste class="btn-ghost btn-sm">Įklijuoti</button>` : ''}
          <button type="submit" class="btn-gold btn-sm flex-1">Pridėti</button>
        </div>
      </form>
    </section>`;
  }

  function render() {
    return `
    <h1 class="page-title mb-5">Draugai</h1>
    <div class="grid lg:grid-cols-12 gap-5 lg:gap-6 items-start">
      <div class="lg:col-span-7">${board()}</div>
      <div class="lg:col-span-5 space-y-3">${addCard()}${myCodeCard()}</div>
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
    const cell = (v, l) => `<div class="px-1 text-center"><div class="text-xl font-semibold tabular-nums">${v}</div><div class="text-xs text-muted mt-1">${l}</div></div>`;
    modal(`
      ${modalHeader(f.name)}
      <div class="px-5 sm:px-6 pb-6">
        <p class="text-sm text-muted">${esc(S.titleFor(f.level).name)} · ${f.level} lygis · kodas ${ago(f.updatedAt)}</p>
        <div class="grid grid-cols-3 divide-x divide-line rounded-2xl bg-white/[0.03] py-4 mt-4">
          ${cell(f.streak, 'Serija')}
          ${cell(fmt(f.tasks), 'Užduotys')}
          ${cell(fmt(f.xp), 'XP')}
        </div>
        <button data-rm class="btn-ghost w-full mt-5 text-red-400">Pašalinti iš lentelės</button>
      </div>`, {
      onMount: (el, close) => {
        el.querySelector('[data-rm]').addEventListener('click', async () => {
          close();
          const ok = await confirm({ title: 'Pašalinti draugą?', text: `${esc(f.name)} dings iš tavo lyderių lentelės. Vėliau galėsi vėl pridėti pagal kodą.`, confirmLabel: 'Pašalinti', danger: true });
          if (ok) { S.removeFriend(f.id); toast('Draugas pašalintas', { icon: 'trash-2' }); }
        });
      },
    });
  };

  return { render, mount };
})();
