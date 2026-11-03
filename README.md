# Parts Picker – powered by Marinics

The app (this folder) is on GitHub Pages. The drawings and parts lists are **not** here: they are in your Firebase database, and only users with a running subscription can see them.

- **Super admin** (you, `admin@marinics.com`): `https://partselect.github.io/partspicker/admin.html`
- **App for users**: `https://partselect.github.io/partspicker/`

---

## Setup (once)

1. **Firebase → Security → Authentication**
   - Sign-in method → **Email/Password → Enable**.
   - Settings → Authorized domains → **Add domain** `partselect.github.io`.
   - Leave **sign-up enabled** — the super admin page creates logins for you. Strangers who create a login still can't see anything without a subscription.
2. **Users tab → Add user**: create the **owner** login `admin@marinics.com` with a strong password (only you know it).
3. **Firestore → Rules**: delete everything, paste the contents of **`firestore.rules`**, **Publish**.
   (To use a different owner email, change `admin@marinics.com` in `firestore.rules` **and** in `firebase-config.js`.)
4. **GitHub**: upload everything in this folder to the `partspicker` repository, keeping the folders. Settings → Pages → main / root.
5. Open the **super admin** → **Catalogues** → choose `f300det-catalogue.json` → **Upload catalogue**.

## Super admin – Users
- **Add user**: name, email, password (auto-generated), start date, engines. Creates the login **and** a **1-month subscription** in one step, then shows the details to send them.
- **Renew +1 month**: extends a running subscription by one month from its current end date.
- **Subscribe 1 month**: for expired or paused users — a new month starting today.
- **Pause / Resume**: blocks or restores access without changing dates.
- **Edit**: name, start / end date (any date you like), which engines they can see, send a password-reset email.
- **Remove**: deletes their subscription (they can no longer see anything).
- Tiles at the top: all users, active, ending within 14 days, expired/paused — tap a tile to filter.

## Super admin – Catalogues
- **Upload catalogue**: add a new engine, or upload the same engine again to replace it.
- **Shown on app / Hidden**: switch an engine off for everyone without deleting it.
- **Delete**: removes the engine and its drawings.

## What users see
- After sign-in: "Subscription active until …", a warning when 14 days or fewer are left, or "Your subscription ended on … Contact Marinics to renew."
- Only the engines that are shown **and** in their plan. Everything is enforced by the database rules, not just hidden on screen.

## Adding a new engine
Send Claude the engine's parts catalogue PDF → you get `<engine>-catalogue.json` → super admin → Catalogues → Upload. Nothing changes on GitHub.

## Keep catalogues safe
- Keep `*-catalogue.json` files on your computer only. **Never upload them to GitHub.**
- The keys in `firebase-config.js` are not secret; `firestore.rules` is what protects the data.
