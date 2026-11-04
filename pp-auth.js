// Parts Picker – shared Firebase sign-in helper. Needs firebase-app/auth/firestore (compat) and firebase-config.js loaded first.
window.PP = (() => {
  const cfg = window.PP_FIREBASE || {};
  if (!window.firebase || !cfg.apiKey || !cfg.projectId) return { configured: false };
  // The super admin uses its own named app, so its sign-in is kept apart from the user app's sign-in in the same browser.
  const name = window.PP_APP_NAME || '';
  const app = name ? (firebase.apps.find(a => a.name === name) || firebase.initializeApp(cfg, name)) : firebase.initializeApp(cfg);
  const auth = app.auth(), db = app.firestore();
  // Long polling is steadier than streaming on mobile networks and some Wi-Fi
  try { db.settings({ experimentalForceLongPolling: true, merge: true }); } catch (e) {}
  // No Firestore disk cache: on iPhones it can break and stop the database client ("client has already been terminated").
  // Engines are kept for offline use by pp-offline.js instead.
  const ready = new Promise(res => { const off = auth.onAuthStateChanged(u => { off(); res(u); }); });
  const adminEmail = (window.PP_ADMIN_EMAIL || '').toLowerCase();

  // ---------- one device per login ----------
  let deviceId = 'dev-' + Math.random().toString(36).slice(2);
  try {
    deviceId = localStorage.getItem('pp-device') || deviceId;
    localStorage.setItem('pp-device', deviceId);
  } catch (e) {}
  function deviceLabel(){
    const ua = navigator.userAgent;
    const os = /iPhone/.test(ua) ? 'iPhone' : /iPad|Macintosh.*Mobile|Macintosh(?=.*Safari)(?=.*Version).*Touch/.test(ua) ? 'iPad'
      : /Android/.test(ua) ? (/(SM-|Samsung)/i.test(ua) ? 'Samsung phone' : 'Android phone') : /Windows/.test(ua) ? 'Windows PC' : /Mac OS X|Macintosh/.test(ua) ? 'Mac' : /Linux/.test(ua) ? 'Linux PC' : 'Device';
    const br = /SamsungBrowser/.test(ua) ? 'Samsung Internet' : /Edg\//.test(ua) ? 'Edge' : /CriOS|Chrome\//.test(ua) ? 'Chrome' : /FxiOS|Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'browser';
    return os + ' · ' + br;
  }
  const isOwner = u => !!u && adminEmail && (u.email || '').toLowerCase() === adminEmail;
  const ref = u => db.collection('sessions').doc((u.email || '').toLowerCase());
  // First device only: a login is tied to the first device it signs in on.
  // Called right after signing in: registers this device, or refuses (and signs out) if another device owns the login.
  async function claim(u){
    if (!u || isOwner(u)) return;
    let cur = null;
    try { const d = await ref(u).get(); cur = d.exists ? d.data() : null; } catch (e) {}
    if (cur && cur.device && cur.device !== 'signed-out' && cur.device !== deviceId) {
      await auth.signOut().catch(() => {});
      throw { code: 'pp/other-device', label: cur.label || '' };
    }
    if (!cur || cur.device !== deviceId) {
      try { await ref(u).set({ device: deviceId, label: deviceLabel(), at: firebase.firestore.FieldValue.serverTimestamp() }); }
      catch (e) { await auth.signOut().catch(() => {}); throw { code: 'pp/other-device', label: '' }; }
    }
  }
  // Watch the login: if another device signs in, sign this one out and call onKick(info).
  function guard(u, onKick){
    if (!u || isOwner(u)) return () => {};
    let first = true, done = false;
    const kick = d => { if (done) return; done = true; auth.signOut().catch(() => {}).then(() => onKick(d || {})); };
    try {
      return ref(u).onSnapshot(snap => {
        const d = snap.exists ? snap.data() : null;
        if (!d) { if (first) claim(u).catch(kick); first = false; return; }   // signed in before the lock existed: this device takes it
        first = false;
        if (d.device !== deviceId) kick(d);   // reset by Marinics, or registered to another device
      }, () => {});
    } catch (e) { return () => {}; }
  }
  return { configured: true, auth, db, ready, adminEmail, session: { deviceId, deviceLabel, claim, guard } };
})();
