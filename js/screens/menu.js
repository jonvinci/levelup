// 5. MENIU / NUSTATYMAI: profilis, navigacija, eksportas / importas, duomenų ištrynimas.
window.LU = window.LU || {};
LU.screens = LU.screens || {};

LU.screens.menu = (() => {
  const { icon, esc, avatar, ring, toast, confirm, modal, modalHeader } = LU.ui;
  const S = LU.store;

  function rowItem({ href, action, ic, title, sub, danger }) {
    const attrs = href ? `href="${href}"` : `href="#" data-action="${action}"`;
    return `
      <a ${attrs} class="list-row">
        <span class="icon-box w-12 h-12 ${danger ? 'text-red-400' : 'text-gold'}">${icon(ic, 'w-[22px] h-[22px]')}</span>
        <span class="flex-1 min-w-0">
          <span class="block text-[17px] font-bold ${danger ? 'text-red-400' : ''}">${title}</span>
          ${sub ? `<span class="block text-sm text-muted mt-0.5">${sub}</span>` : ''}
        </span>
        <span class="text-white/50">${icon('chevron-right', 'w-5 h-5')}</span>
      </a>`;
  }

  const section = (label, items) => `
    <p class="eyebrow text-muted mt-8 mb-3 px-1">${label}</p>
    <div class="list-group">${items.map(rowItem).join('')}</div>`;

  function render() {
    const p = S.state.profile;
    const li = S.levelInfo();
    const installed = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    return `
    <div class="max-w-2xl mx-auto">
      <div class="mb-7">
        <h1 class="inline-block text-4xl sm:text-5xl font-black pb-2 border-b-4 border-gold">Meniu</h1>
      </div>

      ${LU.screens.home.profileCard()}

      ${section('Žaidimas', [
        { href: '#/uzduotys', ic: 'list-checks', title: 'Užduotys ir įpročiai' },
        { href: '#/lygiai', ic: 'sparkles', title: 'Lygių sistema' },
        { href: '#/draugai', ic: 'crown', title: 'Lyderių lentelė' },
      ])}

      ${section('Paskyra', [
        { action: 'edit-profile', ic: 'user', title: 'Redaguoti profilį', sub: 'Vardas ir nuotrauka' },
        { action: 'edit-goals', ic: 'target', title: 'Mano tikslai' },
        { action: 'achievements', ic: 'trophy', title: 'Pasiekimai' },
        { action: 'toggle-sound', ic: S.state.settings.sound === false ? 'bell' : 'music', title: 'Garsai', sub: S.state.settings.sound === false ? 'Išjungti – paspausk, kad įjungtum' : 'Įjungti – paspausk, kad išjungtum' },
      ])}

      ${section('Duomenys', [
        { action: 'export', ic: 'download', title: 'Eksportuoti duomenis', sub: 'Atsarginė kopija JSON faile' },
        { action: 'import', ic: 'upload', title: 'Importuoti duomenis', sub: 'Atkurti iš JSON failo' },
        ...(installed ? [] : [{ action: 'install', ic: 'smartphone', title: 'Įdiegti programėlę', sub: 'Pridėti prie pradžios ekrano' }]),
        { action: 'reset', ic: 'trash-2', title: 'Ištrinti visus duomenis', danger: true },
      ])}

      <div class="text-center mt-12 mb-4">
        <p class="text-sm font-black tracking-[0.4em] text-white/30">${esc(LU.config.APP_NAME)}</p>
        <p class="text-xs text-dim mt-2">v${LU.config.VERSION} · Duomenys saugomi tik šiame įrenginyje</p>
      </div>
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
      ${modalHeader('Eksportuoti duomenis', 'download')}
      <div class="px-5 sm:px-6 pb-6 space-y-4">
        <p class="text-sm text-muted">Atsarginė kopija su visais tavo duomenimis. Atsisiųsk failą arba nukopijuok tekstą ir išsaugok kur nors saugiai (pvz. užrašuose ar el. laiške sau).</p>
        <textarea id="exp-json" readonly rows="6" class="field font-mono text-xs resize-none">${esc(json)}</textarea>
        <div class="grid grid-cols-2 gap-2.5">
          <button data-dl class="btn-ghost !h-12">${icon('download', 'w-5 h-5')} Atsisiųsti</button>
          <button data-cp class="btn-gold !h-12">${icon('copy', 'w-5 h-5')} Kopijuoti</button>
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
      ${modalHeader('Importuoti duomenis', 'upload')}
      <div class="px-5 sm:px-6 pb-6 space-y-4">
        <label class="btn-ghost w-full cursor-pointer">${icon('upload', 'w-5 h-5')} Pasirinkti JSON failą<input type="file" accept="application/json,.json" class="sr-only" data-imp-file></label>
        <p class="text-center text-xs text-muted">arba įklijuok nukopijuotą tekstą</p>
        <textarea id="imp-json" rows="5" class="field font-mono text-xs resize-none" placeholder='{"app":"LEVEL UP", ...}' spellcheck="false"></textarea>
        <button data-imp-text class="btn-gold w-full">${icon('check', 'w-5 h-5', 2.5)} Importuoti tekstą</button>
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
    const step = (n, html) => `<li class="flex gap-3"><span class="w-7 h-7 rounded-full bg-gold text-black grid place-items-center text-sm font-black shrink-0">${n}</span><span class="text-white/80 pt-0.5">${html}</span></li>`;
    modal(`
      ${modalHeader('Įdiegti programėlę', 'smartphone')}
      <div class="px-5 sm:px-6 pb-7 space-y-6">
        <div>
          <p class="font-bold mb-3">iPhone (Safari)</p>
          <ol class="space-y-3">
            ${step(1, `Spausk <b>Dalintis</b> ${icon('share-2', 'w-4 h-4 inline -mt-1')} apačioje`)}
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

  LU.actions['toggle-sound'] = () => {
    S.state.settings.sound = S.state.settings.sound === false;
    S.commit();
    if (S.state.settings.sound) LU.sound.play('done');
    toast(S.state.settings.sound ? 'Garsai įjungti' : 'Garsai išjungti', { icon: 'music' });
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
