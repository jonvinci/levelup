// Titulų emblemos: kiekvienas titulas turi savo simbolį. Pradžioje – kreivi, paprasti,
// kuo aukštesnis titulas – tuo detalesnis ir „rimtesnis" simbolis. Spalva – currentColor (titulo spalva).
window.LU = window.LU || {};

(() => {
  let seq = 0;
  const lg = (id, a, b, x2 = 0, y2 = 1) =>
    `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="currentColor" stop-opacity="${a}"/><stop offset="1" stop-color="currentColor" stop-opacity="${b}"/></linearGradient>`;
  const wl = (id, a, b) =>
    `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="${a}"/><stop offset="1" stop-color="#fff" stop-opacity="${b}"/></linearGradient>`;

  const pts = (arr) => arr.map((p) => p.map((v) => v.toFixed(2)).join(',')).join(' ');
  function starPts(cx, cy, R, r, n = 5, rot = -90) {
    const out = [];
    for (let k = 0; k < n * 2; k++) {
      const a = ((rot + (k * 180) / n) * Math.PI) / 180;
      const rr = k % 2 ? r : R;
      out.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]);
    }
    return pts(out);
  }
  function hexPts(cx, cy, R) {
    const out = [];
    for (let k = 0; k < 6; k++) {
      const a = ((-90 + k * 60) * Math.PI) / 180;
      out.push([cx + R * Math.cos(a), cy + R * Math.sin(a)]);
    }
    return pts(out);
  }
  function rays(n, cx, cy, r1, r2, w, op) {
    let s = '';
    for (let k = 0; k < n; k++) {
      const a = ((k * 360) / n) * Math.PI / 180;
      s += `<line x1="${(cx + r1 * Math.cos(a)).toFixed(2)}" y1="${(cy + r1 * Math.sin(a)).toFixed(2)}" x2="${(cx + r2 * Math.cos(a)).toFixed(2)}" y2="${(cy + r2 * Math.sin(a)).toFixed(2)}" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" opacity="${op}"/>`;
    }
    return s;
  }
  /** Lauro vainikas: dvi šakelės (kairė ir veidrodinė dešinė) su stiebu ir lapeliais. */
  function laurel(cx, cy, R, fill, count = 6, from = 100, to = 215) {
    const P = (deg) => [cx + R * Math.cos((deg * Math.PI) / 180), cy + R * Math.sin((deg * Math.PI) / 180)];
    const [x1, y1] = P(from);
    const [x2, y2] = P(to);
    let s = `<path d="M${x1.toFixed(2)} ${y1.toFixed(2)} A${R} ${R} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}" stroke="${fill}" stroke-width="1.6" stroke-linecap="round"/>`;
    s += `<path d="M${(2 * cx - x1).toFixed(2)} ${y1.toFixed(2)} A${R} ${R} 0 0 0 ${(2 * cx - x2).toFixed(2)} ${y2.toFixed(2)}" stroke="${fill}" stroke-width="1.6" stroke-linecap="round"/>`;
    for (let k = 0; k < count; k++) {
      const deg = from + ((to - from) * k) / (count - 1);
      const [x, y] = P(deg);
      // lapelis pakrypęs į išorę nuo stiebo
      const rot = deg + 90 + 35;
      const ox = Math.cos(((deg) * Math.PI) / 180) * 2.4;
      const oy = Math.sin(((deg) * Math.PI) / 180) * 2.4;
      const lx = x + ox; const ly = y + oy;
      s += `<ellipse cx="${lx.toFixed(2)}" cy="${ly.toFixed(2)}" rx="4.4" ry="1.9" transform="rotate(${rot.toFixed(1)} ${lx.toFixed(2)} ${ly.toFixed(2)})" fill="${fill}"/>`;
      const mx = 2 * cx - lx;
      s += `<ellipse cx="${mx.toFixed(2)}" cy="${ly.toFixed(2)}" rx="4.4" ry="1.9" transform="rotate(${(180 - rot).toFixed(1)} ${mx.toFixed(2)} ${ly.toFixed(2)})" fill="${fill}"/>`;
    }
    return s;
  }
  const SHIELD = 'M32 9 L51 16 V31 C51 44 42 52 32 56 C22 52 13 44 13 31 V16 Z';
  const SHIELD_IN = 'M32 14 L46 19.5 V31 C46 41 39.5 47.5 32 50.5 C24.5 47.5 18 41 18 31 V19.5 Z';
  const SHIELD_S = 'M32 16 L45 21 V32 C45 41 39 47 32 50 C25 47 19 41 19 32 V21 Z';

  const E = [
    // 1 Naujokas – kreivas, pieštuku braižytas apskritimas
    () => `<path d="M33 15c-8.5-.6-16.8 6.4-17.3 15.7-.4 8.6 6.2 17.6 15.8 17.8 10.6.3 17.2-8.2 16.6-17.6-.6-9.3-6.7-15.4-15.1-15.9z" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>
      <path d="M30 31.5c.6-.9 2.5-1 3.1.1" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" opacity=".6"/>`,

    // 2 Žaidėjas – paprastas trikampis su tašku
    () => `<path d="M32 13.5 L50.5 47 H13.5 Z" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round" opacity=".8"/>
      <circle cx="32" cy="36.5" r="3.2" fill="currentColor" opacity=".8"/>`,

    // 3 Kovotojas – plikas skydas
    () => `<path d="${SHIELD}" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round" opacity=".85"/>
      <path d="M32 18 V47" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" opacity=".6"/>`,

    // 4 Ryžtingasis – skydas su juosta
    () => `<path d="${SHIELD}" fill="currentColor" fill-opacity=".14" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"/>
      <path d="M13.5 30 H50.5" stroke="currentColor" stroke-width="3"/>
      <circle cx="32" cy="40" r="3.4" fill="currentColor" opacity=".9"/>`,

    // 5 Disciplinuotas – skydas su vidiniu kraštu ir ševronu
    (id) => `<defs>${lg(id, 0.35, 0.1)}</defs>
      <path d="${SHIELD}" fill="url(#${id})" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"/>
      <path d="${SHIELD_IN}" stroke="currentColor" stroke-width="1.2" opacity=".55"/>
      <path d="M22 25 L32 32.5 L42 25 V31 L32 38.5 L22 31 Z" fill="currentColor"/>`,

    // 6 Atkaklusis – skydas su dvigubu ševronu ir kniedėmis
    (id) => `<defs>${lg(id, 0.5, 0.12)}${wl(id + 'w', 0.35, 0)}</defs>
      <path d="${SHIELD}" fill="url(#${id})" stroke="currentColor" stroke-width="2.8" stroke-linejoin="round"/>
      <path d="M32 11.5 L49 17.8 V24 C40 20 24 20 15 24 V17.8 Z" fill="url(#${id}w)"/>
      <path d="M21 22 L32 29.5 L43 22 V27.5 L32 35 L21 27.5 Z" fill="currentColor"/>
      <path d="M21 32 L32 39.5 L43 32 V37.5 L32 45 L21 37.5 Z" fill="currentColor" opacity=".75"/>
      <circle cx="17.5" cy="19.5" r="1.4" fill="#fff" opacity=".6"/><circle cx="46.5" cy="19.5" r="1.4" fill="#fff" opacity=".6"/>`,

    // 7 Strategas – šešiakampis ženklelis su žvaigžde
    (id) => `<defs>${lg(id, 0.4, 0.1)}</defs>
      <polygon points="${hexPts(32, 32, 24)}" fill="url(#${id})" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"/>
      <polygon points="${hexPts(32, 32, 19)}" stroke="currentColor" stroke-width="1.2" opacity=".5"/>
      <polygon points="${starPts(32, 33, 11.5, 4.8)}" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/>`,

    // 8 Meistras – užpildytas šešiakampis, šviesi žvaigždė, kampų taškai
    (id) => `<defs>${lg(id, 0.95, 0.45)}${wl(id + 'w', 0.4, 0)}</defs>
      <polygon points="${hexPts(32, 32, 25)}" fill="url(#${id})" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
      <polygon points="${hexPts(32, 32, 20)}" stroke="#fff" stroke-width="1" opacity=".35"/>
      <path d="M32 7 L53.6 19.5 V27 C46 22 18 22 10.4 27 V19.5 Z" fill="url(#${id}w)"/>
      <polygon points="${starPts(32, 33, 12, 5)}" fill="#fff" opacity=".92"/>
      ${[0, 60, 120, 180, 240, 300].map((d) => { const a = (d - 90) * Math.PI / 180; return `<circle cx="${(32 + 25 * Math.cos(a)).toFixed(1)}" cy="${(32 + 25 * Math.sin(a)).toFixed(1)}" r="1.9" fill="#fff" opacity=".8"/>`; }).join('')}`,

    // 9 Kūrėjas – briaunuotas brangakmenis su blyksniu
    (id) => `<defs>${lg(id, 1, 0.5)}${wl(id + 'w', 0.55, 0.05)}</defs>
      <polygon points="14,25 23,13 41,13 50,25 32,54" fill="url(#${id})" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
      <polygon points="23,13 32,25 41,13" fill="url(#${id}w)"/>
      <path d="M14 25 H50 M23 13 L27 25 L32 54 L37 25 L41 13 M27 25 L32 13 L37 25" stroke="#fff" stroke-width="1.1" stroke-linejoin="round" opacity=".55"/>
      <path d="M52 9 l1.3 3.2 3.2 1.3 -3.2 1.3 -1.3 3.2 -1.3 -3.2 -3.2 -1.3 3.2 -1.3z" fill="#fff" opacity=".9"/>`,

    // 10 Nepalaužiamas – skydas su sparnais
    (id) => `<defs>${lg(id, 1, 0.45)}${wl(id + 'w', 0.45, 0)}</defs>
      ${[0, 1, 2, 3].map((k) => `<path d="M${19 - k * 0.5} ${22 + k * 6} C${11 - k * 2} ${19 + k * 6} ${5 - k} ${21 + k * 6} ${2 + k * 1.5} ${25 + k * 6} C${8} ${27 + k * 5.5} ${13} ${29 + k * 5.5} ${19} ${29 + k * 5.5} Z" fill="currentColor" opacity="${0.9 - k * 0.15}"/>`).join('')}
      ${[0, 1, 2, 3].map((k) => `<path d="M${45 + k * 0.5} ${22 + k * 6} C${53 + k * 2} ${19 + k * 6} ${59 + k} ${21 + k * 6} ${62 - k * 1.5} ${25 + k * 6} C${56} ${27 + k * 5.5} ${51} ${29 + k * 5.5} ${45} ${29 + k * 5.5} Z" fill="currentColor" opacity="${0.9 - k * 0.15}"/>`).join('')}
      <path d="${SHIELD_S}" fill="url(#${id})" stroke="#fff" stroke-opacity=".5" stroke-width="1.4" stroke-linejoin="round"/>
      <path d="M32 17.5 L43.5 22 V27 C38 24.5 26 24.5 20.5 27 V22 Z" fill="url(#${id}w)"/>
      <path d="M32 24 L35 31 L32 44 L29 31 Z" fill="#fff" opacity=".9"/>`,

    // 11 Verslininkas – lauro vainikas aplink brangakmenio medalioną
    (id) => `<defs>${lg(id, 1, 0.5)}${wl(id + 'w', 0.6, 0)}</defs>
      ${laurel(32, 32, 21, 'currentColor', 6, 100, 222)}
      <circle cx="32" cy="31" r="13" fill="url(#${id})" stroke="#fff" stroke-opacity=".45" stroke-width="1.3"/>
      <polygon points="25,28 29,23.5 35,23.5 39,28 32,38" fill="#fff" opacity=".88"/>
      <path d="M25 28 H39 M29 23.5 L32 28 L35 23.5 M32 28 V38" stroke="currentColor" stroke-width=".9" opacity=".6"/>
      <ellipse cx="27" cy="25" rx="5" ry="2.5" fill="url(#${id}w)" transform="rotate(-30 27 25)"/>
      <path d="M26 54 Q32 50 38 54" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>`,

    // 12 Vizionierius – spindulių medalionas su akimi ir žvaigžde
    (id) => `<defs>${lg(id, 1, 0.55)}${wl(id + 'w', 0.55, 0)}</defs>
      ${rays(16, 32, 32, 19, 29, 2.2, 0.85)}
      ${rays(16, 32, 32, 20, 25, 1.2, 0.5).replace(/line /g, 'line transform="rotate(11.25 32 32)" ')}
      <circle cx="32" cy="32" r="17" fill="url(#${id})" stroke="#fff" stroke-opacity=".5" stroke-width="1.4"/>
      <circle cx="32" cy="32" r="13.5" stroke="#fff" stroke-opacity=".35" stroke-width="1"/>
      <path d="M20.5 32 C24 26 40 26 43.5 32 C40 38 24 38 20.5 32 Z" fill="#fff" opacity=".92"/>
      <circle cx="32" cy="32" r="4.4" fill="currentColor"/>
      <polygon points="${starPts(32, 32, 2.6, 1.1, 4, 0)}" fill="#fff"/>
      <ellipse cx="26" cy="22" rx="6" ry="2.6" fill="url(#${id}w)" transform="rotate(-25 26 22)"/>`,

    // 13 Lyderis – sparnuotas herbas su žvaigžde ir juosta
    (id) => `<defs>${lg(id, 1, 0.5)}${wl(id + 'w', 0.5, 0)}</defs>
      ${[0, 1, 2, 3, 4].map((k) => `<path d="M${20 - k * 0.3} ${20 + k * 5} C${12 - k * 2} ${16 + k * 5} ${4 - k} ${17 + k * 5} ${1 + k * 1.6} ${21 + k * 5} C${8} ${24 + k * 4.5} ${14} ${26 + k * 4.5} ${20} ${26 + k * 4.5} Z" fill="currentColor" opacity="${0.95 - k * 0.13}"/>`).join('')}
      ${[0, 1, 2, 3, 4].map((k) => `<path d="M${44 + k * 0.3} ${20 + k * 5} C${52 + k * 2} ${16 + k * 5} ${60 + k} ${17 + k * 5} ${63 - k * 1.6} ${21 + k * 5} C${56} ${24 + k * 4.5} ${50} ${26 + k * 4.5} ${44} ${26 + k * 4.5} Z" fill="currentColor" opacity="${0.95 - k * 0.13}"/>`).join('')}
      <path d="${SHIELD_S}" fill="url(#${id})" stroke="#fff" stroke-opacity=".55" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M32 17.5 L43.5 22 V27 C38 24.5 26 24.5 20.5 27 V22 Z" fill="url(#${id}w)"/>
      <polygon points="${starPts(32, 33, 8.5, 3.6)}" fill="#fff"/>
      <polygon points="${starPts(32, 8, 4, 1.8)}" fill="currentColor" stroke="#fff" stroke-opacity=".6" stroke-width=".8"/>
      <path d="M17 50 L22 47 H42 L47 50 L42 53 H22 Z" fill="currentColor" stroke="#fff" stroke-opacity=".5" stroke-width="1"/>
      <path d="M22 47 V53 M42 47 V53" stroke="#fff" stroke-width=".8" opacity=".5"/>`,

    // 14 Čempionas – karūna su brangakmeniais virš lauro, spinduliai ir blyksniai
    (id) => `<defs>${lg(id, 1, 0.6)}${wl(id + 'w', 0.7, 0)}
        <radialGradient id="${id}g"><stop offset="0" stop-color="currentColor" stop-opacity=".55"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></radialGradient></defs>
      <circle cx="32" cy="31" r="30" fill="url(#${id}g)"/>
      ${rays(12, 32, 31, 24, 30.5, 1.6, 0.7)}
      ${laurel(32, 34, 23, 'currentColor', 7, 98, 210)}
      <path d="M17 41 L14.5 21 L23.5 29 L32 15 L40.5 29 L49.5 21 L47 41 Z" fill="url(#${id})" stroke="#fff" stroke-opacity=".7" stroke-width="1.4" stroke-linejoin="round"/>
      <path d="M16.5 37 L15 24 L23.5 31 L32 18 L40.5 31 L49 24 L47.5 37 Z" fill="url(#${id}w)" opacity=".6"/>
      <rect x="16.5" y="41" width="31" height="6.5" rx="2" fill="currentColor" stroke="#fff" stroke-opacity=".7" stroke-width="1.2"/>
      <circle cx="32" cy="44.25" r="2.3" fill="#fff"/><circle cx="23.5" cy="44.25" r="1.6" fill="#fff" opacity=".85"/><circle cx="40.5" cy="44.25" r="1.6" fill="#fff" opacity=".85"/>
      <circle cx="14.5" cy="20" r="2.4" fill="#fff"/><circle cx="32" cy="13.5" r="2.8" fill="#fff"/><circle cx="49.5" cy="20" r="2.4" fill="#fff"/>
      <polygon points="${starPts(32, 30, 4.2, 1.7, 4, 0)}" fill="#fff"/>
      <path d="M54 8 l1.2 2.9 2.9 1.2 -2.9 1.2 -1.2 2.9 -1.2 -2.9 -2.9 -1.2 2.9 -1.2z" fill="#fff"/>
      <path d="M9 12 l.8 2 2 .8 -2 .8 -.8 2 -.8 -2 -2 -.8 2 -.8z" fill="#fff" opacity=".85"/>`,
  ];

  /** Titulo emblema SVG: titleIndex – 0 (Naujokas) … 13 (Čempionas). */
  LU.emblem = (titleIndex, cls = 'w-10 h-10') => {
    const i = Math.max(0, Math.min(E.length - 1, titleIndex));
    const id = `em${i}_${++seq}`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" class="${cls}" aria-hidden="true">${E[i](id)}</svg>`;
  };
})();
