// Parts Picker – engines saved on this phone for offline use (IndexedDB), plus the last known subscription.
window.PPOff = (() => {
  const DB = 'pp-offline', ST = 'engines';
  let dbp = null;
  const open = () => dbp || (dbp = new Promise((res, rej) => {
    try {
      const r = indexedDB.open(DB, 1);
      r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains(ST)) r.result.createObjectStore(ST, { keyPath: 'key' }); };
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    } catch (e) { rej(e); }
  }));
  const tx = async (mode, fn) => { const db = await open(); return new Promise((res, rej) => { const t = db.transaction(ST, mode), s = t.objectStore(ST); let out; const r = fn(s); if (r) r.onsuccess = () => { out = r.result; }; t.oncomplete = () => res(out); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error || new Error('Storage full')); }); };
  const k = (email, id) => (email || '').toLowerCase() + '|' + id;
  // Saved engines are kept per login, so another login on the same phone doesn't see them
  async function list(email){
    try {
      const all = await tx('readonly', s => s.getAll());
      return (all || []).filter(x => x.email === (email || '').toLowerCase()).map(x => ({ id: x.id, meta: x.meta, size: x.size, at: x.at, updated: x.updated }));
    } catch (e) { return []; }
  }
  const get = async (email, id) => { try { return await tx('readonly', s => s.get(k(email, id))); } catch (e) { return null; } };
  async function put(email, id, meta, figs, updated){
    const size = figs.reduce((a, f) => a + (f.img ? f.img.length : 0) + JSON.stringify(f.hot || []).length + JSON.stringify(f.parts || []).length, 0);
    try { if (navigator.storage && navigator.storage.persist) await navigator.storage.persist(); } catch (e) {}   // ask the phone not to clear it
    await tx('readwrite', s => s.put({ key: k(email, id), email: (email || '').toLowerCase(), id, meta, figs, size, updated: updated || 0, at: Date.now() }));
    return size;
  }
  const del = async (email, id) => { try { await tx('readwrite', s => s.delete(k(email, id))); } catch (e) {} };
  // Last subscription seen online, used to allow offline viewing until the end date
  const subKey = email => 'pp-sub-' + (email || '').toLowerCase();
  const saveSub = (email, sub) => { try { localStorage.setItem(subKey(email), JSON.stringify(sub)); } catch (e) {} };
  const getSub = email => { try { return JSON.parse(localStorage.getItem(subKey(email)) || 'null'); } catch (e) { return null; } };
  const allowed = (sub, id) => !!sub && (sub.owner || (sub.active !== false && sub.end > Date.now() && (sub.models || ['*']).some(m => m === '*' || m === id)));
  const mb = n => (n / 1048576).toFixed(n < 10485760 ? 1 : 0) + ' MB';
  return { list, get, put, del, saveSub, getSub, allowed, mb };
})();
