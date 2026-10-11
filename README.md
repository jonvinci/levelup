# LEVEL UP

Lokalus įpročių ir dienos užduočių sekiklis su XP, lygiais, titulais ir pasiekimais. Tai PWA: nėra jokio serverio, duomenys saugomi naršyklės IndexedDB ir viskas veikia offline.

## Paleidimas

Programėlė jau sukompiliuota, tad `npm install` nereikia. Užtenka bet kokio statinio serverio:

```bash
npx http-server . -p 8080 -c-1      # arba: python3 -m http.server 8080
```

Tada atsidaryk <http://localhost:8080>. Galima atidaryti ir tiesiai `index.html`, bet tada neveiks service worker'is ir diegimas.

### Įdiegimas telefone

Service worker'iui reikia HTTPS, todėl failus reikia patalpinti į bet kurį nemokamą statinį hostingą:

- **Netlify Drop** (<https://app.netlify.com/drop>): nutempk visą aplanką į naršyklę.
- **GitHub Pages**: įkelk į repozitoriją ir įjunk Pages.

Atsidaryk nuorodą telefone. Android'e (Chrome) pasirink ⋮ → „Įdiegti programą“, iPhone'e (Safari) – Dalintis → „Į pradžios ekraną“. Hostingas tik pateikia failus: duomenys lieka telefone, o ne serveryje.

## Ką lengva pakeisti (`js/config.js`)

| Ką | Kur |
|---|---|
| Programėlės pavadinimas | `APP_NAME` (taip pat `<title>` faile `index.html` ir `manifest.webmanifest`) |
| XP kreivė | `xpToNext(n)` – viena funkcija, kiek XP reikia iš lygio *n* į *n+1* |
| Premija už visas dienos misijas | `ALL_DONE_BONUS` |
| Titulai ir jų aprašymai | `TITLES` |
| Lygių ikonų ciklas | `LEVEL_ICONS` |
| Pasiekimai | `ACHIEVEMENTS` (kiekvienas turi `check(stats)` funkciją) |
| Užduočių ikonos, pradinės užduotys | `TASK_ICONS`, `SEED_TASKS` |

Dabartinė kreivė: 6→7 lygis = 50 XP, 10→11 = 78 XP, 20→21 = 218 XP, iki 50 lygio iš viso ≈ 20 800 XP. Darant 4 užduotis per dieną, tai apie 10 mėnesių.

## Struktūra

```
index.html              karkasas, skriptų tvarka
manifest.webmanifest    PWA manifestas
sw.js                   service worker (offline kešas; keičiant failus padidink VERSION)
css/input.css           Tailwind šaltinis + komponentų klasės
css/app.css             sukompiliuotas CSS (generuojamas)
js/icons.js             Lucide ikonos (generuojamas, tik naudojamos)
js/config.js            visi nustatymai (žr. aukščiau)
js/db.js                IndexedDB saugykla (atsarginė – localStorage)
js/store.js             duomenų modelis ir žaidimo logika
js/ui.js                pagalbinės UI funkcijos: modalai, toast'ai, šventė
js/app.js               maršrutai, viršus, navigacija, dienos keitimasis
js/screens/*.js         ekranai: home, tasks, levels, profile, friends, menu, onboarding
assets/                 šriftas (Inter) ir ikonos
scripts/build-icons.js  generuoja js/icons.js
```

## Logika trumpai

- **XP**: apskaičiuojamas kaip `xpLog` įrašų suma. Atšaukus užduotį, jos įrašas ištrinamas ir XP sumažėja.
- **Premija**: kai atliktos visos tos dienos misijos, pridedamas `bonus` įrašas. Jei atšauki užduotį ar pridedi naują, premija nuimama, kol vėl atliksi viską.
- **Serija**: tai dienos iš eilės, kai atlikta bent viena užduotis. Šiandiena seriją nutraukia tik pasibaigusi, o praleista diena ją nunulina.
- **Diena** keičiasi vidurnaktį pagal vietinį laiką (tikrinama kas 20 s ir grįžus į app'ą). Įpročiai atsinaujina, o neatliktos vienkartinės užduotys persikelia į šiandieną.
- **Draugai**: profilio kodas `LU1-…` yra base64 su vardu, XP, lygiu, serija ir kontroline suma. Įklijavus to paties draugo naują kodą, jo įrašas atnaujinamas.
- **Atsarginė kopija**: Meniu → Eksportuoti / Importuoti (JSON).

## Kūrimas

```bash
npm install
npm run watch:css     # keičiant klases
npm run build         # ikonos + CSS
```

Jei naudoji naują Tailwind klasę, CSS reikia perkompiliuoti. Jei naują Lucide ikoną – įrašyk ją į `scripts/build-icons.js` ir paleisk `npm run build:icons`.
