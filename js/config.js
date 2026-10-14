// =====================================================================
//  LEVEL UP – konfigūracija. Viskas, ką gali norėti pakeisti, yra čia.
// =====================================================================
window.LU = window.LU || {};
LU.actions = LU.actions || {}; // veiksmų registras (data-action="...")
LU.screens = LU.screens || {};

LU.config = {
  APP_NAME: 'LEVEL UP',
  VERSION: '1.7.0',

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

  /**
   * Kada prasideda nauja diena (įpročiai atsinaujina, vienkartinės užduotys persikelia).
   * '23:59' – nauja diena prasideda 23:59 vietos laiku. Serija nenutrūksta, jei vakar buvo kas nors atlikta.
   */
  DAY_RESET: '23:59',

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
  // Kiekvienas pasiekimas atrakinamas, kai stats()[stat] >= goal. Išdėstyti nuo lengvesnio iki sunkiausio.
  // stat: tasksDone, totalXp, level, longestStreak (dienos iš eilės), perfectRun (visos misijos iš eilės),
  //       earlyDays (dienos su užduotimi iki 6:00), importantDone (atliktos svarbios užduotys),
  //       bestDay (daugiausia atliktų per vieną dieną), habitBest (ilgiausia vieno įpročio serija)
  ACHIEVEMENTS: [
    { id: 'a2_streak_21', icon: 'flame', name: 'Įpročio gimimas', text: 'Išlaikyk 21 dienos seriją.', stat: 'longestStreak', goal: 21 },
    { id: 'a2_level_15', icon: 'shield', name: 'Disciplinuotas', text: 'Pasiek 15 lygį.', stat: 'level', goal: 15 },
    { id: 'a2_tasks_250', icon: 'check-check', name: 'Darbštuolis', text: 'Atlik 250 užduočių ir įpročių.', stat: 'tasksDone', goal: 250 },
    { id: 'a2_perfect_14', icon: 'calendar-check', name: 'Tobulos dvi savaitės', text: 'Atlik visas dienos misijas 14 dienų iš eilės.', stat: 'perfectRun', goal: 14 },
    { id: 'a2_day_12', icon: 'rocket', name: 'Produktyvi diena', text: 'Atlik 12 užduočių ir įpročių per vieną dieną.', stat: 'bestDay', goal: 12 },
    { id: 'a2_important_50', icon: 'star', name: 'Svarbiausia – pirmiau', text: 'Atlik 50 svarbių užduočių (su žvaigždute).', stat: 'importantDone', goal: 50 },
    { id: 'a2_early_30', icon: 'sunrise', name: 'Ankstyvas paukštis', text: 'Atlik užduotį iki 6:00 ryto 30 skirtingų dienų.', stat: 'earlyDays', goal: 30 },
    { id: 'a2_perfect_30', icon: 'award', name: 'Tobulas mėnuo', text: 'Atlik visas dienos misijas 30 dienų iš eilės.', stat: 'perfectRun', goal: 30 },
    { id: 'a2_habit_60', icon: 'dumbbell', name: 'Geležinis įprotis', text: 'Išlaikyk vieno įpročio 60 dienų seriją.', stat: 'habitBest', goal: 60 },
    { id: 'a2_streak_66', icon: 'zap', name: 'Automatizmas', text: 'Išlaikyk 66 dienų seriją.', stat: 'longestStreak', goal: 66 },
    { id: 'a2_level_25', icon: 'medal', name: 'Meistras', text: 'Pasiek 25 lygį.', stat: 'level', goal: 25 },
    { id: 'a2_streak_100', icon: 'mountain', name: 'Šimtadienis', text: 'Išlaikyk 100 dienų seriją.', stat: 'longestStreak', goal: 100 },
    { id: 'a2_tasks_1000', icon: 'target', name: 'Tūkstantis darbų', text: 'Atlik 1000 užduočių ir įpročių.', stat: 'tasksDone', goal: 1000 },
    { id: 'a2_xp_10000', icon: 'gem', name: 'Dešimt tūkstančių', text: 'Surink 10 000 XP.', stat: 'totalXp', goal: 10000 },
    { id: 'a2_level_45', icon: 'crown', name: 'Čempionas', text: 'Pasiek 45 lygį.', stat: 'level', goal: 45 },
    { id: 'a2_streak_365', icon: 'trophy', name: 'Metai be pertraukos', text: 'Išlaikyk 365 dienų seriją.', stat: 'longestStreak', goal: 365 },
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
