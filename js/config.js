// =====================================================================
//  LEVEL UP – konfigūracija. Viskas, ką gali norėti pakeisti, yra čia.
// =====================================================================
window.LU = window.LU || {};
LU.actions = LU.actions || {}; // veiksmų registras (data-action="...")
LU.screens = LU.screens || {};

LU.config = {
  APP_NAME: 'LEVEL UP',
  VERSION: '1.5.6',

  // ---------------- XP KREIVĖ ----------------
  MAX_LEVEL: 50,

  /**
   * Kreivė sukalibruota taip, kad, kasdien atliekant viską, Čempionu (CHAMPION_LEVEL)
   * taptum per DAYS_TO_CHAMPION dienų. DAILY_XP – kiek XP gauni per dieną atlikęs viską:
   * dabar ~7 misijos/įpročiai × 5 XP + 20 XP premija = 55 XP.
   * Pakeitus šiuos tris skaičius, visa kreivė persiskaičiuoja automatiškai.
   */
  CHAMPION_LEVEL: 45,
  DAYS_TO_CHAMPION: 365,
  DAILY_XP: 55,

  /** Kreivės forma: pradžioje lygiai greiti, vėliau vis lėtesni (kvadratinis narys). */
  curveShape(n) {
    return 25 + 5 * (n - 1) + 0.5 * Math.max(0, n - 6) ** 2;
  },

  /** Kiek XP reikia pereiti iš lygio `n` į lygį `n + 1`. */
  xpToNext(n) {
    if (!this._scale) {
      let sum = 0;
      for (let k = 1; k < this.CHAMPION_LEVEL; k++) sum += this.curveShape(k);
      this._scale = (this.DAYS_TO_CHAMPION * this.DAILY_XP) / sum;
    }
    return Math.round(this.curveShape(n) * this._scale);
  },

  /** Premija, kai atliktos visos tos dienos misijos. */
  ALL_DONE_BONUS: 20,

  /** Kiek XP duoda kiekviena atlikta misija ir įprotis. */
  TASK_XP: 5,

  // ---------------- TITULAI ----------------
  // color – titulo spalva pagrindinio ekrano lygio kortelėje: pradžioje išblukusios, vėliau vis ryškesnės.
  TITLES: [
    { from: 1, to: 4, name: 'Naujokas', color: '#8A8682',
      text: 'Tavo kelionė prasideda čia. Žengi pirmus žingsnius, mokaisi žaidimo taisyklių ir kuri pirmus įpročius. Kiekviena užduotis – plyta tavo pamatams.' },
    { from: 5, to: 7, name: 'Žaidėjas', color: '#8E8A76',
      text: 'Tu nebe stebėtojas. Įsijungei į žaidimą, atlikai pirmas užduotis ir supratai, kaip viskas veikia. Dabar žaidi tu.' },
    { from: 8, to: 10, name: 'Kovotojas', color: '#927F69',
      text: 'Pradžios entuziazmas praėjo, bet tu vis dar čia. Kovoji su tingumu, atidėliojimu ir pasiteisinimais. Ir laimi vis dažniau.' },
    { from: 11, to: 14, name: 'Ryžtingasis', color: '#7F8F78',
      text: 'Sprendimai tau nebėra sunkūs. Žinai, ko nori, ir darai tai net tada, kai niekas nemato. Tavo žodis sau kažką reiškia.' },
    { from: 15, to: 17, name: 'Disciplinuotas', color: '#6E8C98',
      text: 'Motyvacija ateina ir praeina, o tavo įpročiai lieka. Darai tai, ką reikia, nes taip nusprendei, o ne todėl, kad norisi.' },
    { from: 18, to: 20, name: 'Atkaklusis', color: '#4F9AB0',
      text: 'Nesėkmės tavęs nesustabdo. Praleista diena – tik pauzė, ne pabaiga. Atsikeli ir tęsi, kol kiti dar svarsto.' },
    { from: 21, to: 24, name: 'Strategas', color: '#3D8EE0',
      text: 'Tu ne tik darai, bet ir planuoji. Matai didesnį vaizdą, renkiesi, kur investuoti laiką ir energiją. Kiekvienas ėjimas turi tikslą.' },
    { from: 25, to: 27, name: 'Meistras', color: '#21B57A',
      text: 'Tai, kas kitiems atrodo sunku, tau tapo kasdienybe. Tavo įpročiai nušlifuoti, o rezultatai kalba patys už save.' },
    { from: 28, to: 30, name: 'Kūrėjas', color: '#14CDB0',
      text: 'Nebeprisitaikai prie aplinkybių – jas kuri. Paverti idėjas veiksmais ir statai tai, kas išliks ilgiau nei viena diena.' },
    { from: 31, to: 34, name: 'Nepalaužiamas', color: '#8A63FF',
      text: 'Spaudimas tave grūdina, o ne laužo. Sunkiausiomis dienomis lieki ištikimas savo sistemai. Tai ir yra tavo stiprybė.' },
    { from: 35, to: 37, name: 'Verslininkas', color: '#C04BFF',
      text: 'Į savo laiką žiūri kaip į kapitalą. Investuoji į save, skaičiuoji grąžą ir kuri vertę ne tik sau, bet ir kitiems.' },
    { from: 38, to: 40, name: 'Vizionierius', color: '#FF3D7F',
      text: 'Matai toliau nei šiandiena. Tavo tikslai dideli, bet kasdieniai veiksmai juos paverčia planu, o ne svajone.' },
    { from: 41, to: 44, name: 'Lyderis', color: '#FF4B1F',
      text: 'Kiti pastebi tavo pokytį ir seka tavo pavyzdžiu. Tu nebe tik tobulėji pats – tu įkvepi ir trauki kitus kartu.' },
    { from: 45, to: 50, name: 'Čempionas', color: '#FFC400',
      text: 'Viršūnė pasiekta, bet žaidimas nesibaigia. Tu įrodei, kad disciplina, kantrybė ir kasdieniai žingsniai sukuria čempioną.' },
  ],

  /** Lygių takelio ikonos – kartojasi ciklu (1 lygis = pirma, 16 lygis vėl pirma...). */
  LEVEL_ICONS: ['sprout', 'gamepad-2', 'swords', 'flame', 'target', 'mountain', 'brain', 'hammer',
    'palette', 'shield', 'briefcase', 'telescope', 'flag', 'trophy', 'crown'],

  // ---------------- PASIEKIMAI ----------------
  // check(s) gauna statistiką: { tasksDone, totalXp, level, longestStreak, perfectRun, earlyBird }
  ACHIEVEMENTS: [
    { id: 'first_task', icon: 'footprints', name: 'Pirmas žingsnis', text: 'Atlik pirmą užduotį.', check: (s) => s.tasksDone >= 1 },
    { id: 'streak_7', icon: 'flame', name: 'Savaitės ugnis', text: 'Išlaikyk 7 dienų seriją.', check: (s) => s.longestStreak >= 7 },
    { id: 'early_bird', icon: 'sunrise', name: 'Ankstyvas paukštis', text: 'Atlik užduotį iki 7:00 ryto.', check: (s) => s.earlyBird },
    { id: 'level_10', icon: 'medal', name: 'Kovotojas', text: 'Pasiek 10 lygį.', check: (s) => s.level >= 10 },
    { id: 'perfect_7', icon: 'calendar-check', name: 'Tobula savaitė', text: 'Atlik visas dienos misijas 7 dienas iš eilės.', check: (s) => s.perfectRun >= 7 },
    { id: 'tasks_100', icon: 'check-check', name: 'Šimtukas', text: 'Atlik 100 užduočių.', check: (s) => s.tasksDone >= 100 },
    { id: 'xp_1000', icon: 'gem', name: 'Tūkstantis XP', text: 'Surink 1000 XP.', check: (s) => s.totalXp >= 1000 },
    { id: 'streak_30', icon: 'crown', name: 'Mėnesio ugnis', text: 'Išlaikyk 30 dienų seriją.', check: (s) => s.longestStreak >= 30 },
  ],

  // ---------------- UŽDUOTYS ----------------
  TASK_ICONS: ['snowflake', 'shower-head', 'brain', 'dumbbell', 'book-open', 'footprints', 'bike', 'person-standing',
    'heart-pulse', 'droplets', 'glass-water', 'apple', 'salad', 'pill', 'bed', 'moon', 'sun', 'sunrise',
    'pen-line', 'notebook-pen', 'code', 'briefcase', 'graduation-cap', 'languages', 'lightbulb', 'phone-off',
    'coffee', 'music', 'mic', 'brush', 'piggy-bank', 'wallet', 'mail', 'shopping-cart', 'house-plus',
    'leaf', 'flower-2', 'heart', 'smile', 'timer', 'target', 'zap'],

  SEED_TASKS: [
    { title: 'Šaltas dušas', note: '2 min', icon: 'snowflake' },
    { title: 'Ryto meditacija', note: '10 min', icon: 'brain' },
    { title: 'Treniruotė', note: '30 min', icon: 'dumbbell' },
    { title: 'Knygos skaitymas', note: '20 min', icon: 'book-open' },
  ],

  /** Savaitės dienos: 1 = pirmadienis ... 7 = sekmadienis. */
  WEEKDAYS: [
    { n: 1, short: 'Pr', long: 'Pirmadienis' },
    { n: 2, short: 'An', long: 'Antradienis' },
    { n: 3, short: 'Tr', long: 'Trečiadienis' },
    { n: 4, short: 'Kt', long: 'Ketvirtadienis' },
    { n: 5, short: 'Pn', long: 'Penktadienis' },
    { n: 6, short: 'Š', long: 'Šeštadienis' },
    { n: 7, short: 'S', long: 'Sekmadienis' },
  ],
};
