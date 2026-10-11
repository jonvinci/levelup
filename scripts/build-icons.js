// Sugeneruoja js/icons.js tik su naudojamomis Lucide ikonomis (kad app'as veiktų offline be 350 KB bibliotekos).
// Pridėjus naują ikoną: įrašyk jos pavadinimą (kebab-case, kaip lucide.dev) į sąrašą ir paleisk `npm run build:icons`.
const fs = require('fs');
const path = require('path');
const lucide = require('lucide');

const NAMES = [
  // UI
  'house', 'list-checks', 'sparkles', 'users', 'menu', 'user', 'bell', 'settings', 'x', 'check', 'check-check',
  'chevron-right', 'chevron-down', 'chevron-left', 'arrow-right', 'plus', 'pencil', 'trash-2', 'lock', 'copy',
  'share-2', 'download', 'upload', 'camera', 'image', 'star', 'zap', 'flame', 'calendar', 'calendar-days',
  'calendar-check', 'history', 'map', 'crown', 'trophy', 'target', 'circle-check', 'circle', 'info',
  'triangle-alert', 'log-out', 'smartphone', 'clipboard-paste', 'refresh-cw', 'tag', 'medal', 'gem',
  'footprints', 'sunrise', 'rocket', 'repeat', 'list-todo', 'grip-vertical', 'award', 'gift', 'eye',
  // Lygių ciklas
  'sprout', 'gamepad-2', 'swords', 'mountain', 'brain', 'hammer', 'palette', 'shield', 'briefcase',
  'telescope', 'flag',
  // Užduočių ikonos
  'snowflake', 'dumbbell', 'book-open', 'droplets', 'bike', 'apple', 'salad', 'moon', 'sun', 'pen-line',
  'notebook-pen', 'code', 'phone-off', 'coffee', 'heart', 'heart-pulse', 'music', 'languages', 'piggy-bank',
  'wallet', 'bed', 'glass-water', 'leaf', 'flower-2', 'timer', 'graduation-cap', 'mic', 'house-plus',
  'brush', 'shower-head', 'pill', 'person-standing', 'smile', 'lightbulb', 'mail', 'shopping-cart',
];

const pascal = (s) => s.split('-').map((p) => p[0].toUpperCase() + p.slice(1)).join('');
const attrs = (o) => Object.entries(o).map(([k, v]) => `${k}="${v}"`).join(' ');

const out = {};
const missing = [];
for (const name of NAMES) {
  const node = lucide.icons[pascal(name)];
  if (!node) { missing.push(name); continue; }
  const children = node[2] || node; // lucide >=0.4xx: ['svg', attrs, children]
  out[name] = children.map(([tag, a]) => `<${tag} ${attrs(a)}/>`).join('');
}
if (missing.length) {
  console.error('Nerastos ikonos:', missing.join(', '));
  process.exit(1);
}

const file = `// SUGENERUOTA: scripts/build-icons.js (Lucide, ISC licencija). Neredaguok rankomis.
window.LU = window.LU || {};
LU.ICONS = ${JSON.stringify(out)};
`;
fs.writeFileSync(path.join(__dirname, '..', 'js', 'icons.js'), file);
console.log(`js/icons.js: ${Object.keys(out).length} ikonų, ${(file.length / 1024).toFixed(1)} KB`);
