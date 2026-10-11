// Lokali saugykla: IndexedDB (atsarginis variantas – localStorage). Visa būsena saugoma vienu dokumentu.
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

  async function load() {
    const db = await open();
    if (db) {
      try {
        const val = await new Promise((resolve, reject) => {
          const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(KEY);
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
        });
        if (val) return val;
      } catch (e) { /* krentam į localStorage */ }
    }
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  async function save(state) {
    const db = await open();
    if (db) {
      try {
        await new Promise((resolve, reject) => {
          const tx = db.transaction(STORE, 'readwrite');
          tx.objectStore(STORE).put(state, KEY);
          tx.oncomplete = resolve;
          tx.onerror = () => reject(tx.error);
        });
        return true;
      } catch (e) { /* krentam į localStorage */ }
    }
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      console.error('Nepavyko išsaugoti', e);
      return false;
    }
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

  return { load, save, clear };
})();
