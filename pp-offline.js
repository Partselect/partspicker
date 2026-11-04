// Parts Picker – engines saved on this phone for offline use (IndexedDB), plus the last known subscription.
// Each drawing is stored as its own small record (iPhones handle many small records better than one large one).
window.PPOff = (() => {
  const DB = 'pp-offline', EN = 'engines', FG = 'figs';
  let dbp = null;
  const open = () => dbp || (dbp = new Promise((res, rej) => {
    try {
      const r = indexedDB.open(DB, 2);
      r.onupgradeneeded = () => {
        const d = r.result;
        if (d.objectStoreNames.contains(EN)) d.deleteObjectStore(EN);   // version 1 kept everything in one record: start clean
        d.createObjectStore(EN, { keyPath: 'key' });
        if (!d.objectStoreNames.contains(FG)) d.createObjectStore(FG, { keyPath: 'key' });
      };
      r.onsuccess = () => { const d = r.result; d.onversionchange = () => { d.close(); dbp = null; }; res(d); };
      r.onerror = () => { dbp = null; rej(r.error || new Error('Storage unavailable')); };
      r.onblocked = () => { dbp = null; rej(new Error('Storage busy: close other Parts Picker tabs')); };
    } catch (e) { dbp = null; rej(e); }
  }));
  const run = async (stores, mode, fn) => {
    const db = await open();
    return new Promise((res, rej) => {
      let t; try { t = db.transaction(stores, mode); } catch (e) { return rej(e); }
      let out; const r = fn(t);
      if (r) r.onsuccess = () => { out = r.result; };
      t.oncomplete = () => res(out);
      t.onerror = () => rej(t.error || new Error('Storage error'));
      t.onabort = () => rej(t.error || new Error('Storage full'));
    });
  };
  const L = e => (e || '').toLowerCase();
  const ek = (email, id) => L(email) + '|' + id;
  const fk = (email, id, n) => ek(email, id) + '|' + String(n).padStart(4, '0');
  const range = (email, id) => IDBKeyRange.bound(ek(email, id) + '|', ek(email, id) + '|￿');
  // Saved engines are kept per login, so another login on the same phone doesn't see them
  async function list(email){
    try { const all = await run([EN], 'readonly', t => t.objectStore(EN).getAll()); return (all || []).filter(x => x.email === L(email) && x.done); }
    catch (e) { return []; }
  }
  async function get(email, id){
    try {
      const rec = await run([EN], 'readonly', t => t.objectStore(EN).get(ek(email, id)));
      if (!rec || !rec.done) return null;
      const figs = await run([FG], 'readonly', t => t.objectStore(FG).getAll(range(email, id)));
      if (!figs || figs.length < rec.count) return null;
      return { ...rec, figs: figs.map(f => f.fig).sort((a, b) => a.n - b.n) };
    } catch (e) { return null; }
  }
  async function del(email, id){
    try { await run([EN, FG], 'readwrite', t => { t.objectStore(EN).delete(ek(email, id)); t.objectStore(FG).delete(range(email, id)); }); } catch (e) {}
  }
  // Save drawings a few at a time; onProgress(saved, total)
  async function put(email, id, meta, figs, updated, onProgress){
    try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {}); } catch (e) {}   // ask the phone not to clear it
    await del(email, id);
    let size = 0;
    for (let i = 0; i < figs.length; i += 5) {
      const part = figs.slice(i, i + 5);
      await run([FG], 'readwrite', t => { const s = t.objectStore(FG); part.forEach(f => s.put({ key: fk(email, id, f.n), fig: f })); });
      part.forEach(f => { size += (f.img ? f.img.length : 0) + JSON.stringify(f.hot || []).length + JSON.stringify(f.parts || []).length; });
      if (onProgress) onProgress(Math.min(i + 5, figs.length), figs.length);
    }
    await run([EN], 'readwrite', t => t.objectStore(EN).put({ key: ek(email, id), email: L(email), id, meta, size, count: figs.length, updated: updated || 0, at: Date.now(), done: true }));
    return size;
  }
  // Last subscription seen online, used to allow offline viewing until the end date
  const subKey = email => 'pp-sub-' + L(email);
  const saveSub = (email, sub) => { try { localStorage.setItem(subKey(email), JSON.stringify(sub)); } catch (e) {} };
  const getSub = email => { try { return JSON.parse(localStorage.getItem(subKey(email)) || 'null'); } catch (e) { return null; } };
  const allowed = (sub, id) => !!sub && (sub.owner || (sub.active !== false && sub.end > Date.now() && (sub.models || ['*']).some(m => m === '*' || m === id)));
  const mb = n => (n / 1048576).toFixed(n < 10485760 ? 1 : 0) + ' MB';
  // Fetch an engine's drawings a few at a time. Each step has a time limit and is retried, so a slow
  // or dropped mobile connection doesn't leave the download stuck; it carries on from where it stopped.
  async function fetchFigs(db, id, onProgress, onRetry){
    const col = db.collection('models').doc(id).collection('figures');
    const figs = []; let last = null, tries = 0;
    const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej({ code: 'timeout', message: 'no answer from the server' }), ms))]);
    for (;;) {
      let q = col.orderBy('n').limit(5); if (last) q = q.startAfter(last);
      let s;
      try { s = await withTimeout(q.get(), 30000); tries = 0; }
      catch (e) {
        if (e && e.code === 'permission-denied') throw e;
        if (++tries > 4) throw e;
        if (onRetry) onRetry(tries);
        await new Promise(r => setTimeout(r, 1500 * tries));
        continue;
      }
      if (s.empty) break;
      s.docs.forEach(d => { const x = d.data(); figs.push({ n: x.n, t: x.t, w: x.w, h: x.h, hs: x.hs, img: x.img, hot: JSON.parse(x.hot), parts: JSON.parse(x.parts) }); });
      if (onProgress) onProgress(figs.length);
      last = s.docs[s.docs.length - 1]; if (s.size < 5) break;
    }
    return figs;
  }
  return { list, get, put, del, saveSub, getSub, allowed, mb, fetchFigs };
})();
