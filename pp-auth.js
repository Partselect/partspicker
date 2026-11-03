// Parts Picker – shared Firebase sign-in helper. Needs firebase-app/auth/firestore (compat) and firebase-config.js loaded first.
window.PP = (() => {
  const cfg = window.PP_FIREBASE || {};
  if (!window.firebase || !cfg.apiKey || !cfg.projectId) return { configured: false };
  firebase.initializeApp(cfg);
  const auth = firebase.auth(), db = firebase.firestore();
  try { db.enablePersistence({ synchronizeTabs: true }).catch(() => {}); } catch (e) {}   // keeps the catalogue for offline use
  const ready = new Promise(res => { const off = auth.onAuthStateChanged(u => { off(); res(u); }); });
  return { configured: true, auth, db, ready, adminEmail: (window.PP_ADMIN_EMAIL || '').toLowerCase() };
})();
