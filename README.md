# Parts Picker – powered by Marinics

The app (this folder) is on GitHub Pages. The drawings and parts lists are **not** here: they are in your Firebase database, and only users with a running subscription can see them.

- **Super admin** (you, `bakku3344@gmail.com`): `https://partselect.github.io/partspicker/admin.html`
- **App for users**: `https://partselect.github.io/partspicker/`

---

## Setup (once)

1. **Firebase → Security → Authentication**
   - Sign-in method → **Email/Password → Enable**.
   - Settings → Authorized domains → **Add domain** `partselect.github.io`.
   - Leave **sign-up enabled** — the super admin page creates logins for you. Strangers who create a login still can't see anything without a subscription.
2. **Users tab → Add user**: create the **owner** login `bakku3344@gmail.com` with a strong password (only you know it).
3. **Firestore → Rules**: delete everything, paste the contents of **`firestore.rules`**, **Publish**.
   (To use a different owner email, change `bakku3344@gmail.com` in `firestore.rules` **and** in `firebase-config.js`.)
4. **GitHub**: upload everything in this folder to the `partspicker` repository, keeping the folders. Settings → Pages → main / root.
5. Open the **super admin** → **Catalogues** → choose `f300det-catalogue.json` → **Upload catalogue**.

## Super admin – Companies
Each **company** is one customer: one subscription, one set of engines, and **up to 5 login emails**.
- **Add company**: company name, start date, engines, and the first login (email + auto-generated password). Creates a **1-month subscription** and shows the login details to send.
- **Manage**: add logins (up to 5), remove a login, send a password-reset email, change name, dates (any date) and engines.
- **Renew +1 month**: extends the company by one month from its current end date — all its logins keep working.
- **Subscribe 1 month**: for expired or paused companies — a new month starting today.
- **Pause / Resume**: blocks or restores every login of that company.
- **Remove**: deletes the company and unlinks all its logins.
- An email can belong to only one company. The 5-login limit is also enforced by the database rules.
- Tiles at the top: companies (and total logins), active, ending within 14 days, expired/paused — tap a tile to filter.

## Super admin – Catalogues
- **Upload catalogue**: add a new engine, or upload the same engine again to replace it.
- **Shown on app / Hidden**: switch an engine off for everyone without deleting it.
- **Delete**: removes the engine and its drawings.

## What users see
- After sign-in: their company name and "Subscription active until …", a warning when 14 days or fewer are left, or "Your subscription ended on … Contact Marinics to renew."
- Only the engines that are shown **and** in their company's plan. Everything is enforced by the database rules, not just hidden on screen.

## Adding a new engine
Send Claude the engine's parts catalogue PDF → you get `<engine>-catalogue.json` → super admin → Catalogues → Upload. Nothing changes on GitHub.

## Keep catalogues safe
- Keep `*-catalogue.json` files on your computer only. **Never upload them to GitHub.**
- The keys in `firebase-config.js` are not secret; `firestore.rules` is what protects the data.
