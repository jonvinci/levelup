// Lokali saugykla. Kiekvienas įrašymas eina į DVI vietas:
//  - localStorage – sinchroniškai, iš karto (išlieka net jei telefonas tuoj pat uždaro programėlę);
//  - IndexedDB – asinchroniškai (didesnė talpa).
// Įkeliant paimama naujesnė kopija (pagal savedAt).
window.LU = window.LU || {};

LU.db = (() => {
  const DB_NAME = 'levelup';
  const STORE = 'kv';
  const KEY = 'state';
  const LS_KEY = 'levelup:state';
  let dbPromise = null;

  function open() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve) => {
      if (!('indexedDB' in window)) return resolve(null);
      try {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () => req.result.createObjectStore(STORE);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
        req.onblocked = () => resolve(null);
      } catch (e) {
        resolve(null);
      }
    });
    return dbPromise;
  }

  async function loadIdb() {
    const db = await open();
    if (!db) return null;
    try {
      return await new Promise((resolve, reject) => {
        const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(KEY);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      return null;
    }
  }

  function loadLs() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  async function load() {
    const a = await loadIdb();
    const b = loadLs();
    if (a && b) return (b.savedAt || 0) > (a.savedAt || 0) ? b : a;
    return a || b;
  }

  function saveIdb(state) {
    return open().then((db) => {
      if (!db) return false;
      return new Promise((resolve) => {
        try {
          const tx = db.transaction(STORE, 'readwrite');
          tx.objectStore(STORE).put(state, KEY);
          tx.oncomplete = () => resolve(true);
          tx.onerror = () => resolve(false);
          tx.onabort = () => resolve(false);
        } catch (e) {
          resolve(false);
        }
      });
    });
  }

  /** Įrašo iš karto: localStorage sinchroniškai, IndexedDB fone. */
  function save(state) {
    state.savedAt = Date.now();
    let lsOk = false;
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(state));
      lsOk = true;
    } catch (e) { /* pvz. viršyta talpa – liks IndexedDB */ }
    return saveIdb(state).then((idbOk) => {
      if (!idbOk && !lsOk) console.error('Nepavyko išsaugoti duomenų');
      return idbOk || lsOk;
    });
  }

  async function clear() {
    const db = await open();
    if (db) {
      await new Promise((resolve) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).delete(KEY);
        tx.oncomplete = resolve;
        tx.onerror = resolve;
      });
    }
    try { localStorage.removeItem(LS_KEY); } catch (e) { /* ignore */ }
  }

  /** Paprašo naršyklės saugyklos automatiškai nevalyti. */
  function persist() {
    try {
      if (navigator.storage && navigator.storage.persist) return navigator.storage.persist().catch(() => false);
    } catch (e) { /* ignore */ }
    return Promise.resolve(false);
  }

  return { load, save, clear, persist };
})();
