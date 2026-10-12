// 5. MENIU / NUSTATYMAI: profilis, navigacija, eksportas / importas, duomenų ištrynimas.
window.LU = window.LU || {};
LU.screens = LU.screens || {};

LU.screens.menu = (() => {
  const { icon, esc, avatar, toast, confirm, modal, modalHeader } = LU.ui;
  const S = LU.store;

  function rowItem({ href, action, title, sub, danger }) {
    const attrs = href ? `href="${href}"` : `href="#" data-action="${action}"`;
    return `
      <a ${attrs} class="list-row">
        <span class="flex-1 min-w-0">
          <span class="block ${danger ? 'text-red-400' : ''}">${title}</span>
          ${sub ? `<span class="block text-xs text-muted mt-0.5">${sub}</span>` : ''}
        </span>
        <span class="text-white/25">${icon('chevron-right', 'w-4 h-4')}</span>
      </a>`;
  }

  const section = (label, items) => `
    <p class="text-xs text-muted mt-7 mb-2 px-1">${label}</p>
    <div class="list-group">${items.map(rowItem).join('')}</div>`;

  function render() {
    const p = S.state.profile;
    const li = S.levelInfo();
    const installed = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    return `
    <div class="max-w-xl">
      <h1 class="page-title mb-5">Meniu</h1>

      <a href="#/profilis" class="list-row card !rounded-2xl">
        ${avatar(p, 'w-11 h-11 text-sm')}
        <span class="flex-1 min-w-0">
          <span class="block font-semibold truncate">${esc(p.name)}</span>
          <span class="block text-sm text-muted">Lygis ${li.level} · ${esc(li.title.name)}</span>
        </span>
        <span class="text-white/25">${icon('chevron-right', 'w-4 h-4')}</span>
      </a>

      ${section('Žaidimas', [
        { href: '#/uzduotys', title: 'Užduotys' },
        { href: '#/lygiai', title: 'Lygiai' },
        { href: '#/draugai', title: 'Lyderių lentelė' },
      ])}

      ${section('Paskyra', [
        { action: 'edit-profile', title: 'Redaguoti profilį', sub: 'Vardas ir nuotrauka' },
        { action: 'edit-goals', title: 'Tikslai' },
        { action: 'achievements', title: 'Pasiekimai' },
      ])}

      ${section('Duomenys', [
        { action: 'export', title: 'Eksportuoti duomenis', sub: 'Atsarginė kopija JSON faile' },
        { action: 'import', title: 'Importuoti duomenis', sub: 'Atkurti iš JSON failo' },
        ...(installed ? [] : [{ action: 'install', title: 'Įdiegti programėlę', sub: 'Pridėti prie pradžios ekrano' }]),
        { action: 'reset', title: 'Ištrinti visus duomenis', danger: true },
      ])}

      <p class="text-xs text-dim mt-8 px-1">${esc(LU.config.APP_NAME)} v${LU.config.VERSION} · Duomenys saugomi tik šiame įrenginyje</p>
    </div>`;
  }

  /** Bendras importavimas: iš failo arba įklijuoto teksto. */
  async function doImport(text) {
    try {
      const data = JSON.parse(text);
      const name = data && data.state && data.state.profile ? data.state.profile.name : '?';
      const when = data && data.exportedAt ? new Date(data.exportedAt).toLocaleString('lt-LT') : 'nežinoma';
      const ok = await confirm({
        title: 'Importuoti duomenis?',
        text: `Dabartiniai duomenys bus <b class="text-white">pakeisti</b> kopija: <b class="text-white">${esc(name)}</b>, sukurta ${esc(when)}.`,
        confirmLabel: 'Importuoti',
        icon: 'upload',
      });
      if (!ok) return;
      await S.importJson(text);
      toast('Duomenys importuoti', { icon: 'check' });
      LU.app.go('');
    } catch (e) {
      toast(e instanceof SyntaxError ? 'Tai nėra tinkamas JSON.' : e.message, { icon: 'triangle-alert', tone: 'error', ms: 4000 });
    }
  }

  function mount() {}

  // ---------- Veiksmai ----------
  LU.actions.export = () => {
    const json = S.exportJson();
    const file = `levelup-${S.util.today()}.json`;
    modal(`
      ${modalHeader('Eksportuoti duomenis')}
      <div class="px-5 sm:px-6 pb-6 space-y-4">
        <p class="text-sm text-muted">Atsarginė kopija su visais tavo duomenimis. Atsisiųsk failą arba nukopijuok tekstą ir išsaugok kur nors saugiai (pvz. užrašuose ar el. laiške sau).</p>
        <textarea id="exp-json" readonly rows="6" class="field font-mono text-xs resize-none">${esc(json)}</textarea>
        <div class="grid grid-cols-2 gap-2.5">
          <button data-dl class="btn-ghost">Atsisiųsti</button>
          <button data-cp class="btn-gold">Kopijuoti</button>
        </div>
      </div>`, {
      onMount: (el) => {
        el.querySelector('[data-dl]').addEventListener('click', () => {
          const a = document.createElement('a');
          a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
          a.download = file;
          document.body.appendChild(a);
          a.click();
          setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
          toast('Failas atsisiųstas', { icon: 'download' });
        });
        el.querySelector('[data-cp]').addEventListener('click', async () => {
          const ta = el.querySelector('#exp-json');
          try {
            await navigator.clipboard.writeText(json);
          } catch (e) {
            ta.focus();
            ta.select();
            try { document.execCommand('copy'); } catch (e2) { /* lieka pažymėta */ }
          }
          toast('Kopija nukopijuota', { icon: 'copy' });
        });
      },
    });
  };

  LU.actions.import = () => {
    modal(`
      ${modalHeader('Importuoti duomenis')}
      <div class="px-5 sm:px-6 pb-6 space-y-4">
        <label class="btn-ghost w-full cursor-pointer">Pasirinkti JSON failą<input type="file" accept="application/json,.json" class="sr-only" data-imp-file></label>
        <p class="text-center text-xs text-muted">arba įklijuok nukopijuotą tekstą</p>
        <textarea id="imp-json" rows="5" class="field font-mono text-xs resize-none" placeholder='{"app":"LEVEL UP", ...}' spellcheck="false"></textarea>
        <button data-imp-text class="btn-gold w-full">Importuoti tekstą</button>
      </div>`, {
      onMount: (el, close) => {
        el.querySelector('[data-imp-file]').addEventListener('change', async (e) => {
          const f = e.target.files[0];
          if (!f) return;
          const text = await f.text();
          close();
          setTimeout(() => doImport(text), 200);
        });
        el.querySelector('[data-imp-text]').addEventListener('click', () => {
          const text = el.querySelector('#imp-json').value.trim();
          if (!text) return;
          close();
          setTimeout(() => doImport(text), 200);
        });
      },
    });
  };

  LU.actions.install = async () => {
    const ev = LU.app.installPrompt;
    if (ev) {
      ev.prompt();
      const choice = await ev.userChoice;
      LU.app.installPrompt = null;
      if (choice.outcome === 'accepted') toast('Programėlė įdiegta!', { icon: 'smartphone' });
      return;
    }
    const step = (n, html) => `<li class="flex gap-3 text-sm"><span class="w-4 text-muted tabular-nums shrink-0">${n}.</span><span class="text-white/80">${html}</span></li>`;
    modal(`
      ${modalHeader('Įdiegti programėlę')}
      <div class="px-5 sm:px-6 pb-7 space-y-6">
        <div>
          <p class="font-bold mb-3">iPhone (Safari)</p>
          <ol class="space-y-3">
            ${step(1, 'Spausk <b>Dalintis</b> apačioje')}
            ${step(2, 'Pasirink <b>„Į pradžios ekraną"</b> (Add to Home Screen)')}
          </ol>
        </div>
        <div>
          <p class="font-bold mb-3">Android (Chrome)</p>
          <ol class="space-y-3">
            ${step(1, 'Atidaryk naršyklės meniu <b>⋮</b>')}
            ${step(2, 'Pasirink <b>„Įdiegti programą"</b> arba <b>„Pridėti prie pagrindinio ekrano"</b>')}
          </ol>
        </div>
        <p class="text-sm text-muted">Įdiegta programėlė veikia ir be interneto. Duomenys lieka tavo telefone.</p>
      </div>`);
  };

  LU.actions.reset = async () => {
    const ok = await confirm({
      title: 'Ištrinti visus duomenis?',
      text: 'Bus ištrinti profilis, užduotys, XP, pasiekimai ir draugai. <b class="text-white">To atšaukti nebus galima.</b> Jei reikia, pirmiau eksportuok atsarginę kopiją.',
      confirmLabel: 'Ištrinti viską',
      danger: true,
      typeWord: 'TRINTI',
    });
    if (!ok) return;
    await S.resetAll();
    location.hash = '#/';
    toast('Visi duomenys ištrinti', { icon: 'trash-2' });
  };

  return { render, mount };
})();
