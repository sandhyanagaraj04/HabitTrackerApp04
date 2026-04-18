# Habit Tracker — Product Requirements Document

**Version:** 1.0  
**Last Updated:** April 2026  
**Status:** Live — v1 shipped

---

## 1. Product Vision

A beautifully designed, mobile-first habit tracker that makes daily self-tracking effortless. The app focuses on holistic well-being — combining physical health metrics, spiritual practices, and personal habits — with each user's data private, cloud-synced, and exportable at any time.

> *"Micro habits. Extraordinary life."*

---

## 2. Target Users

| Persona | Description |
|---|---|
| **Primary** | Individual practitioner tracking daily health, sleep, diet, and sadhana (spiritual practices) |
| **Secondary** | Anyone in the user's community who wants to track similar habits using the same app |
| **Admin** | App owner — monitors user engagement and aggregate habit analytics |

---

## 3. Core Principles

1. **Mobile-first** — must be effortless to fill in on a phone, one-handed, in under 2 minutes
2. **No friction** — no passwords to remember; Google Sign-In only
3. **Private by default** — each user sees only their own data
4. **Always exportable** — data is never locked in; CSV and Excel export always available
5. **No install required** — works as a web app in any mobile browser

---

## 4. Feature Requirements

### 4.1 Authentication
| # | Requirement | Status |
|---|---|---|
| A1 | Sign in with Google account | ✅ Live |
| A2 | Sign out with confirmation dialog | ✅ Live |
| A3 | Session persists across browser restarts | ✅ Live |
| A4 | Each user gets a fully isolated dashboard | ✅ Live |
| A5 | Graceful offline/localStorage fallback when Firebase not configured | ✅ Live |

### 4.2 Health Tracking
| # | Field | Input Type | Notes | Status |
|---|---|---|---|---|
| H1 | Sleeping time | Time picker | | ✅ Live |
| H2 | Waking time | Time picker | | ✅ Live |
| H3 | Hours of sleep | Auto-calculated | Derived from H1 + H2, handles midnight crossover | ✅ Live |
| H4 | Sleep quality | 5-star rating | | ✅ Live |
| H5 | Greyscale switched on at | Time picker | | ✅ Live |
| H6 | Hours phone on Greyscale | Auto-calculated | Derived from H5 to H2 | ✅ Live |
| H7 | Steps | Number with ±500 buttons | Goal: 10,000 steps with progress bar | ✅ Live |
| H8 | Heart points | Number with ±5 buttons | | ✅ Live |
| H9 | Breakfast source | Dropdown | Home / Outside / Ordered In / Canteen / Skipped | ✅ Live |
| H10 | Breakfast description | Text input | What was eaten | ✅ Live |
| H11 | Lunch source | Dropdown | Same options as H9 | ✅ Live |
| H12 | Lunch description | Text input | | ✅ Live |
| H13 | Snack source | Dropdown | | ✅ Live |
| H14 | Snack description | Text input | | ✅ Live |
| H15 | Dinner source | Dropdown | | ✅ Live |
| H16 | Dinner description | Text input | | ✅ Live |

### 4.3 Sadhana Tracking
| # | Practice | Input Type | Status |
|---|---|---|---|
| S1 | Guru Pooja | Toggle switch | ✅ Live |
| S2 | Upa Yoga | Toggle switch | ✅ Live |
| S3 | Surya Kriya | Toggle switch | ✅ Live |
| S4 | Yoga Namaskar | Toggle switch | ✅ Live |
| S5 | SCK (Shakti Chalana Kriya) | Toggle switch | ✅ Live |
| S6 | All-complete celebration banner | Auto-shown | Shown when all 5 are toggled on | ✅ Live |

### 4.4 Category — T
| # | Requirement | Status |
|---|---|---|
| T1 | Placeholder category ready to extend | ✅ Live |
| T2 | Habit fields to be defined by product owner | ⏳ Pending input |

### 4.5 Category — 4 (Unnamed)
| # | Requirement | Status |
|---|---|---|
| 4.1 | Fourth category slot available | ⏳ Pending input |
| 4.2 | Name and habits to be defined by product owner | ⏳ Pending input |

### 4.6 Navigation & Date Management
| # | Requirement | Status |
|---|---|---|
| N1 | Navigate to any past date | ✅ Live |
| N2 | Cannot navigate to future dates | ✅ Live |
| N3 | Weekly strip showing 7 days with data indicators | ✅ Live |
| N4 | Today highlighted in accent colour | ✅ Live |
| N5 | Swipe left/right to change date (mobile) | ✅ Live |
| N6 | Arrow key navigation (desktop) | ✅ Live |
| N7 | "Today" / "Yesterday" label on date display | ✅ Live |

### 4.7 Progress & Gamification
| # | Requirement | Status |
|---|---|---|
| P1 | Per-category completion percentage | ✅ Live |
| P2 | Animated progress rings on each category card | ✅ Live |
| P3 | Streak counter (consecutive days with any data) | ✅ Live |
| P4 | Steps progress bar vs 10,000 goal | ✅ Live |
| P5 | Tab badges showing daily completion % | ✅ Live |
| P6 | Week strip dots indicating days with data | ✅ Live |

### 4.8 Export
| # | Requirement | Status |
|---|---|---|
| E1 | Export to CSV | ✅ Live |
| E2 | Export to Excel (.xlsx) — multi-sheet | ✅ Live |
| E3 | Date range selection (From / To) | ✅ Live |
| E4 | Quick ranges: Last 7 / 30 / 90 days / All data | ✅ Live |
| E5 | Per-category export selection (Health, Sadhana) | ✅ Live |
| E6 | CSV includes all computed fields (sleep hours, greyscale hours) | ✅ Live |

### 4.9 Admin Dashboard
| # | Requirement | Status |
|---|---|---|
| AD1 | Access controlled via Firestore `admins` collection | ✅ Live |
| AD2 | Total users stat card | ✅ Live |
| AD3 | Active this week stat card | ✅ Live |
| AD4 | Average sleep hours across all users | ✅ Live |
| AD5 | Average steps/day across all users | ✅ Live |
| AD6 | Top streak across all users | ✅ Live |
| AD7 | Average sadhana completion % across all users | ✅ Live |
| AD8 | Sadhana completion rates per practice (bar chart) | ✅ Live |
| AD9 | Sleep quality distribution (bar chart) | ✅ Live |
| AD10 | Meal source breakdown (doughnut chart) | ✅ Live |
| AD11 | Average steps by day of week (bar chart) | ✅ Live |
| AD12 | Full user table with per-user stats | ✅ Live |
| AD13 | User table search by name or email | ✅ Live |
| AD14 | Manual data refresh button | ✅ Live |

---

## 5. UI / UX Requirements

| # | Requirement | Status |
|---|---|---|
| UX1 | Dark theme, glassmorphism card design | ✅ Live |
| UX2 | Works on mobile browsers (iOS Safari, Android Chrome) | ✅ Live |
| UX3 | Works on desktop browsers | ✅ Live |
| UX4 | Minimum touch target size 44px | ✅ Live |
| UX5 | No horizontal scroll on any screen size | ✅ Live |
| UX6 | Loading screen while auth state resolves | ✅ Live |
| UX7 | Toast notifications for save/export/error feedback | ✅ Live |
| UX8 | Confirmation dialog before destructive actions | ✅ Live |
| UX9 | Animated tab transitions | ✅ Live |
| UX10 | ±increment buttons for numeric fields (phone-friendly) | ✅ Live |

---

## 6. Landing Page Requirements

| # | Requirement | Status |
|---|---|---|
| LP1 | Headline: "Micro habits. Extraordinary life." | ✅ Live |
| LP2 | Feature grid: Health, Sadhana, Export, Streaks | ✅ Live |
| LP3 | Google Sign-In CTA | ✅ Live |
| LP4 | Animated floating habit pill badges | ✅ Live |
| LP5 | Animated background gradient orbs | ✅ Live |
| LP6 | Split layout on desktop, single column on mobile | ✅ Live |
| LP7 | "What you get" perks list on sign-in card | ✅ Live |

---

## 7. Data & Privacy

- All user data is stored in Firestore under `users/{uid}` — completely isolated per user
- No user can access another user's data (enforced by Firestore security rules)
- Only the admin (identified by UID in `admins` collection) can see aggregate analytics
- Users can delete all their own data at any time from the Export tab
- Data can be exported and taken away at any time

---

## 8. Non-Functional Requirements

| Requirement | Target |
|---|---|
| Page load time | < 2 seconds on 4G mobile |
| Firestore write latency | < 1 second (debounced 800ms) |
| Offline usability | Full UI available; syncs when back online |
| Browser support | Chrome 90+, Safari 14+, Firefox 88+, Edge 90+ |
| No server required | Pure static frontend + Firebase BaaS |

---

## 9. Out of Scope (v1)

- Native mobile app (iOS / Android)
- Push / local notifications for habit reminders
- Social features (sharing streaks, leaderboards)
- Custom habit creation UI (currently requires code change)
- Historical trend charts per user
- Weekly / monthly summary emails
- Dark/light theme toggle

---

## 10. Open Items

| # | Item | Owner |
|---|---|---|
| O1 | Define habits for Category "T" | Product owner |
| O2 | Name and define Category 4 | Product owner |
| O3 | Decide on reminder/notification strategy | Product owner |

---

## 11. Live URLs

| Resource | URL |
|---|---|
| App | https://habit-tracker-app04.vercel.app |
| Admin Dashboard | https://habit-tracker-app04.vercel.app/admin.html |
| GitHub Repository | https://github.com/sandhyanagaraj04/HabitTrackerApp04 |
| Firebase Console | https://console.firebase.google.com/project/habit-tracker-4a504 |
