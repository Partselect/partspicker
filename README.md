# Parts Picker – powered by Marinics

The app (this folder) is on GitHub Pages. The drawings and parts lists are **not** here: they are in your Firebase database, and only users with a running subscription can see them.

- **Super admin** (you, `bakku3344@gmail.com`): `https://partselect.github.io/partspicker/super/` — its own app "Parts Picker Super" (blue icon with a gold shield) you can add to your home screen. The old `admin.html` link still works.
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

## First sign-in: own password
- New logins get a **temporary password** (shown in the details you send them).
- The first time they sign in, the app asks them to **set their own password** (8+ characters, typed twice) before they can use anything. The temporary password then stops working.
- **Manage** shows "waiting for first sign-in (temporary password)" until they've done it.

## First device only
- Each login works **only on the first phone or PC it signs in on**. Signing in anywhere else is refused with: "This login is already registered to another device … Ask Marinics to reset the device."
- **Manage** shows each login's device (e.g. "Device: iPhone · Safari · since 3 Nov, 4:32 PM") and a **Reset device** button — use it when someone changes or loses their phone. The old device is signed out immediately, and the next device they sign in on becomes theirs.
- A different browser on the same phone, or clearing the browser's data, counts as a new device and also needs a reset.
- The device registration is protected by the database rules (only you can reset it); the device check itself runs in the app.

## Super admin – Catalogues
- **Choose catalogue files → Upload**: pick one or many `*-catalogue.json` files at once. Each becomes its own engine. Uploading the same engine again replaces it.
- **Search engines** filters the catalogue list.
- The engine list users see (`meta/catalog`) is updated automatically whenever the super admin opens or changes catalogues.
- **Shown on app / Hidden**: switch an engine off for everyone without deleting it.
- **Delete**: removes the engine and its drawings.

## What users see
- After sign-in: their company name and "Subscription active until …", a warning when 14 days or fewer are left, or "Your subscription ended on … Contact Marinics to renew."
- Only the engines that are shown **and** in their company's plan. Everything is enforced by the database rules, not just hidden on screen.

## Download for offline (users)
- Each engine card has **Download**. The engine is saved on that phone (about 3 MB each) and moves to the top under **On this phone · works offline**.
- Saved engines open with no internet. Online, the subscription is still checked each time; offline, the app uses the end date it last saw, so access stops when the subscription ends.
- **Remove** deletes it from the phone. **Update** appears if you upload a newer version of that catalogue.
- Saved engines belong to the login that downloaded them.

## Adding a new engine
Send Claude the engine's parts catalogue PDF → you get `<engine>-catalogue.json` → super admin → Catalogues → Upload. Nothing changes on GitHub.

## Keep catalogues safe
- Keep `*-catalogue.json` files on your computer only. **Never upload them to GitHub.**
- The keys in `firebase-config.js` are not secret; `firestore.rules` is what protects the data.
