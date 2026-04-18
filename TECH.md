# Habit Tracker — Technical Reference

## Tech Stack

| Layer | Technology | Version / Notes |
|---|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript | No framework, no build step |
| Auth | Firebase Authentication | Google Sign-In (OAuth 2.0) |
| Database | Cloud Firestore | NoSQL, real-time, per-user isolation |
| Hosting | Vercel | Auto-deploy on every `git push` to `main` |
| Export | SheetJS (xlsx) | v0.18.5 via CDN — Excel `.xlsx` export |
| Charts | Chart.js | v4.4.0 via CDN — admin dashboard only |
| Fonts | Google Fonts — Inter | 300–800 weight range |
| Icons | Inline SVG + emoji | No icon library dependency |

---

## Architecture

```
habit-tracker-app04.vercel.app/
│
├── index.html          ← Main app (SPA)
├── styles.css          ← All app + landing page styles
├── app.js              ← App logic, Firebase Auth, Firestore sync
├── firebase-config.js  ← Firebase project credentials
├── vercel.json         ← Vercel deployment config
│
├── admin.html          ← Admin dashboard (protected)
├── admin.js            ← Admin analytics + user table logic
└── admin-styles.css    ← Admin dashboard styles
```

### Frontend Architecture
- **Single-page app** — `index.html` handles both the landing/login screen and the tracker dashboard via overlay show/hide
- **No framework, no build step** — pure HTML/CSS/JS, opens directly in any browser
- **In-memory cache** — all loaded Firestore data is held in a `data` object (`{ [dateStr]: dayObject }`) for synchronous UI reads
- **Debounced writes** — Firestore saves are debounced 800ms to reduce write operations
- **localStorage fallback** — if `firebase-config.js` still has placeholder values, the app runs fully offline using `localStorage`

### Auth Flow
```
User visits app
    ↓
Firebase Auth checks session
    ↓
Not signed in → Landing page (Google Sign-In)
    ↓
Google OAuth popup → Firebase creates/finds user
    ↓
User profile saved to Firestore users/{uid}
    ↓
All user's habit days loaded into memory
    ↓
Tracker dashboard renders
```

### Data Flow
```
User edits a field
    ↓
In-memory data object updated instantly (synchronous)
    ↓
UI re-renders (completion rings, badges, computed fields)
    ↓
800ms debounce timer resets
    ↓
Firestore write: users/{uid}/days/{YYYY-MM-DD}
```

---

## Firestore Data Structure

```
firestore/
│
├── admins/
│   └── {uid}                       ← empty doc; presence = admin access
│
└── users/
    └── {uid}/                      ← profile fields on the document itself
        │   name: string
        │   email: string
        │   photoURL: string
        │   createdAt: timestamp
        │   lastActive: timestamp
        │
        └── days/
            └── {YYYY-MM-DD}/
                ├── health/
                │   ├── sleep_time: string       "23:30"
                │   ├── wake_time: string        "06:30"
                │   ├── sleep_quality: number    1–5
                │   ├── greyscale_on: string     "21:00"
                │   ├── steps: number
                │   ├── heart_points: number
                │   ├── breakfast_source: string home|outside|ordered|canteen|skipped
                │   ├── breakfast: string
                │   ├── lunch_source: string
                │   ├── lunch: string
                │   ├── snack_source: string
                │   ├── snack: string
                │   ├── dinner_source: string
                │   └── dinner: string
                │
                ├── sadhana/
                │   ├── guru_pooja: boolean
                │   ├── upa_yoga: boolean
                │   ├── surya_kriya: boolean
                │   ├── yoga_namaskar: boolean
                │   └── sck: boolean
                │
                └── t/              ← placeholder, ready to extend
```

---

## Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Admin can read all data
    match /{document=**} {
      allow read: if request.auth != null &&
        exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }

    // Users can only read/write their own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

---

## Vercel Configuration

**`vercel.json`**
```json
{
  "outputDirectory": "."
}
```

- Tells Vercel to serve the repo root as a static site
- `index.html` is auto-served at `/`
- Auto-deploys on every push to `main` branch
- HTTPS provided by default

---

## Firebase Configuration

**`firebase-config.js`** — contains the project credentials:

| Field | Value |
|---|---|
| Project ID | `habit-tracker-4a504` |
| Auth Domain | `habit-tracker-4a504.firebaseapp.com` |
| Storage Bucket | `habit-tracker-4a504.firebasestorage.app` |
| Measurement ID | `G-4HN19DBV1F` (Google Analytics) |

Firebase services enabled:
- **Authentication** — Google Sign-In provider
- **Cloud Firestore** — production mode, custom security rules applied
- **Google Analytics** — via `measurementId`

Authorised domains in Firebase Auth:
- `habit-tracker-app04.vercel.app`
- `localhost` (for local dev)

---

## Admin Access

Admin access is controlled by the `admins` Firestore collection:
- Add a document with the user's UID as the Document ID (no fields required)
- Presence of the document grants read access to all user data
- Admin dashboard: `/admin.html`

---

## Computed Fields

| Field | Calculation |
|---|---|
| Hours of sleep | `wake_time − sleep_time` (handles midnight crossover) |
| Greyscale hours | `wake_time − greyscale_on` (handles midnight crossover) |
| Steps goal % | `steps / 10,000 × 100` |
| Category completion % | Count of filled fields / total fields × 100 |
| Streak | Consecutive days backwards from today with any data |

---

## Key Dependencies (CDN — no npm required)

```html
<!-- SheetJS — Excel export -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>

<!-- Firebase (compat SDK) -->
<script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js"></script>

<!-- Chart.js — admin dashboard only -->
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>

<!-- Inter font -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
```

---

## Local Development

No build tools needed — just open `index.html` in a browser.

For Firebase to work locally:
1. Add `localhost` to Firebase Auth → Settings → Authorised domains
2. Open via a local server (e.g. `npx serve .`) rather than `file://` — required for Firebase Auth popup to work
