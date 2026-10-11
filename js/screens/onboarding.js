// PIRMAS PALEIDIMAS: vardo klausimas.
window.LU = window.LU || {};
LU.screens = LU.screens || {};

LU.screens.onboarding = (() => {
  const { icon, esc, toast } = LU.ui;
  const S = LU.store;

  function render() {
    const preview = [1, 5, 8].map((L, i) => `
      <div class="flex flex-col items-center gap-2">
        <span class="relative w-14 h-14 rounded-full grid place-items-center ${i === 0 ? 'path-node current pulse-gold' : 'path-node future'}">
          ${icon(S.levelIcon(L), 'w-6 h-6')}
          <span class="absolute -top-0.5 -left-0.5 w-5 h-5 rounded-full grid place-items-center text-[10px] font-black bg-black text-white ${i === 0 ? 'border border-gold/70' : 'border border-white/15 text-white/80'}">${L}</span>
        </span>
        <span class="text-[11px] font-bold ${i === 0 ? 'text-white' : 'text-white/50'}">${esc(S.titleFor(L).name)}</span>
      </div>`);
    return `
    <div class="relative min-h-[100dvh] flex flex-col items-center justify-center px-5 py-10 overflow-hidden">
      <div class="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full" style="background:radial-gradient(circle, rgba(240,180,41,.16), transparent 60%)"></div>
      <div class="relative w-full max-w-md fade-in">
        <div class="text-center">${LU.app.logo('lg')}</div>

        <div class="mt-10 flex items-start justify-center gap-3">
          ${preview[0]}
          <span class="mt-6 h-2 w-10 rounded-full bg-gradient-to-r from-gold to-[#222226]"></span>
          ${preview[1]}
          <span class="mt-6 h-2 w-10 rounded-full bg-[#222226]"></span>
          ${preview[2]}
        </div>

        <h1 class="mt-10 text-center text-[34px] sm:text-5xl font-black uppercase tracking-tight leading-[1.02]">Pradėk savo žaidimą</h1>
        <p class="mt-4 text-center text-muted leading-relaxed">Atlik užduotis, rink XP, kilk lygiais ir atrakink titulus. Viskas saugoma tik tavo įrenginyje.</p>

        <form data-onb class="card card-pad mt-8 space-y-4">
          <label class="label" for="onb-name">Kuo tu vardu?</label>
          <input id="onb-name" class="field !h-14 text-lg font-semibold" maxlength="30" placeholder="Tavo vardas" autocomplete="given-name" autofocus>
          <p data-err class="hidden text-sm text-red-400">Įrašyk savo vardą.</p>
          <button type="submit" class="btn-gold w-full">Pradėti žaidimą ${icon('arrow-right', 'w-5 h-5')}</button>
        </form>

        <p class="mt-6 text-center text-sm text-muted">
          Turi atsarginę kopiją?
          <label class="text-gold font-bold cursor-pointer hover:underline">Importuoti<input type="file" accept="application/json,.json" class="sr-only" data-onb-import></label>
        </p>
      </div>
    </div>`;
  }

  function mount(el) {
    const form = el.querySelector('[data-onb]');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = el.querySelector('#onb-name').value.trim();
      if (!name) {
        el.querySelector('[data-err]').classList.remove('hidden');
        return;
      }
      location.hash = '#/';
      S.createProfile(name);
      toast(`Labas, ${name}! Žaidimas prasideda.`, { icon: 'rocket', ms: 3200 });
    });
    el.querySelector('[data-onb-import]').addEventListener('change', async (e) => {
      const f = e.target.files[0];
      if (!f) return;
      try {
        await S.importJson(await f.text());
        toast('Duomenys importuoti', { icon: 'check' });
      } catch (err) {
        toast(err.message, { icon: 'triangle-alert', tone: 'error', ms: 4000 });
      }
    });
  }

  return { render, mount };
})();
