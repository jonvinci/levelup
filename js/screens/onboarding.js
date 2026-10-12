// PIRMAS PALEIDIMAS: vardo klausimas.
window.LU = window.LU || {};
LU.screens = LU.screens || {};

LU.screens.onboarding = (() => {
  const { toast } = LU.ui;
  const S = LU.store;

  function render() {
    return `
    <div class="min-h-[100dvh] flex flex-col justify-center px-6 py-10">
      <div class="w-full max-w-sm mx-auto fade-in">
        ${LU.app.logo('lg')}
        <p class="mt-3 text-muted leading-relaxed">Atlik užduotis, rink XP ir kilk lygiais. Duomenys saugomi tik šiame įrenginyje.</p>
        <form data-onb class="mt-10 space-y-3">
          <label class="label" for="onb-name">Kuo tu vardu?</label>
          <input id="onb-name" class="field" maxlength="30" placeholder="Vardas" autocomplete="given-name" autofocus>
          <p data-err class="hidden text-sm text-red-400">Įrašyk savo vardą.</p>
          <button type="submit" class="btn-gold w-full">Pradėti</button>
        </form>
        <label class="link mt-6 cursor-pointer">Turi atsarginę kopiją? <span class="text-gold">Importuoti</span><input type="file" accept="application/json,.json" class="sr-only" data-onb-import></label>
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
