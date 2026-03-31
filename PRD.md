# Product Requirements Document: Raffle

**Version:** 1.1
**Date:** 2026-03-30
**Status:** Active

---

## 1. Executive Summary

Raffle is a high-performance Progressive Web App (PWA) for local businesses in Oman to conduct live giveaways at events. It loads participant data from a pre-prepared CSV file and presents a visually impressive spinning wheel capable of handling up to 100,000 entries at 60fps on an iPad. The entire system operates with zero backend infrastructure, keeping all data local for maximum privacy and zero hosting cost.

---

## 2. Problem Statement

Local businesses in Oman frequently run giveaways at malls and events. Current solutions either:
- Cannot handle large datasets (100k+ entries) without crashing
- Require expensive backend infrastructure
- Look unprofessional during live presentations
- Expose customer data to third-party servers

Raffle solves all four problems with a local-first, canvas-rendered, PWA approach.

---

## 3. Goals & Success Metrics

| Goal | Metric |
|:-----|:-------|
| Handle massive datasets | Smooth 60fps wheel spin with 100,000 entries on iPad |
| Zero hosting cost | Deployed on Vercel/Netlify free tier, no database |
| Premium presentation | Full-screen PWA with confetti and fluid animations |
| Data privacy | All participant data stays on-device |
| Offline reliability | Core UI and animations work without internet |

---

## 4. Target Users

**Primary:** Local business owners / marketing managers in Oman who run in-store or event-based giveaways.

**Usage Context:** Live events at malls, stores, or brand activations where an iPad is presented to an audience during a raffle draw.

---

## 5. Technical Architecture

### 5.1 Stack

| Component | Technology | Cost |
|:----------|:-----------|:-----|
| **Hosting** | Vercel or Netlify | $0 |
| **Frontend Framework** | Vue 3 + Quasar (Vite) | $0 |
| **Wheel Rendering** | HTML5 Canvas | $0 |
| **Animations** | GSAP (spin physics, confetti) | $0 |
| **Audio** | Howler.js (tick sounds, winner fanfare) | $0 |
| **CSV Parsing** | PapaParse | $0 |
| **PWA** | Quasar PWA mode + Service Workers | $0 |

### 5.2 Architecture Principles

- **Stateless / Local-First:** No cloud database. CSV is bundled with the app in `public/data/`.
- **GPU-Accelerated Rendering:** The wheel is drawn on HTML5 Canvas to keep computation on the GPU, not the DOM.
- **Visual Proxy Rendering:** Only 50-100 slices are rendered at any time; names swap dynamically during the spin.
- **Cryptographically Secure Selection:** The winner is chosen via `crypto.getRandomValues()` with uniform probability P = 1/n.

---

## 6. Functional Requirements

### 6.1 Data Loading

| ID | Requirement | Priority |
|:---|:------------|:---------|
| DL-1 | Auto-load participants from `public/data/users.csv` on app startup | Must |
| DL-2 | Parse CSV with PapaParse, extracting the `username` column | Must |
| DL-3 | De-duplicate usernames (case-insensitive) | Must |
| DL-4 | Exclude collaborators/admins defined in `EXCLUDED_USERS` | Must |
| DL-5 | Display participant count in the header | Must |

### 6.2 The Wheel Engine

| ID | Requirement | Priority |
|:---|:------------|:---------|
| WE-1 | Render wheel on HTML5 Canvas (not DOM elements) | Must |
| WE-2 | Visual Proxy: Display max 50-100 slices; swap names dynamically during spin | Must |
| WE-3 | Maintain 60fps on iPad (target: iPad 9th gen or newer) | Must |
| WE-4 | Spin initiated by tapping the center of the wheel or the SPIN button | Must |
| WE-5 | Realistic deceleration physics (easing curve, not abrupt stop) | Must |
| WE-6 | Winner selected by cryptographically secure RNG before animation starts | Must |
| WE-7 | Tick-tick-tick audio synced to slice transitions during spin (Howler.js) | Should |
| WE-8 | Confetti + celebration on winner reveal | Must |
| WE-9 | Winner displayed in a high-impact animated overlay | Must |

### 6.3 Winner Management

| ID | Requirement | Priority |
|:---|:------------|:---------|
| WM-1 | Winners are automatically removed from the pool after each draw | Must |
| WM-2 | Winners shown with a badge in the participants table | Must |
| WM-3 | Multiple consecutive draws without reloading | Must |
| WM-4 | "Spin Again" button on winner reveal to continue drawing | Must |
| WM-5 | Reset button to restore all participants to the pool | Must |

### 6.4 PWA & Offline

| ID | Requirement | Priority |
|:---|:------------|:---------|
| PW-1 | Installable as PWA ("Add to Home Screen" on iPad) | Must |
| PW-2 | Standalone display mode (no browser chrome) | Must |
| PW-3 | Service Worker caches all static assets (UI, sounds, CSV data) | Must |
| PW-4 | Wheel spin and winner selection work fully offline | Must |

### 6.5 Presentation Mode

| ID | Requirement | Priority |
|:---|:------------|:---------|
| PM-1 | Full-screen wheel view optimized for landscape iPad | Must |
| PM-2 | Clean, premium aesthetic suitable for brand events | Must |
| PM-3 | Entry count displayed before spin | Must |
| PM-4 | Participants table below the wheel | Should |

---

## 7. User Flow

```
1. OPEN APP
   └─> CSV auto-loads, wheel renders with all participants

2. SPIN
   └─> Tap SPIN button or wheel center
       └─> Spin animation → deceleration → winner reveal
           └─> Confetti + winner name displayed

3. CONTINUE or DONE
   ├─> "Spin Again" → winner removed from pool → spin again
   └─> "Done" → return to wheel view
```

---

## 8. Non-Functional Requirements

| Category | Requirement |
|:---------|:------------|
| **Performance** | 60fps wheel animation with 100,000 entries on iPad 9th gen+ |
| **Memory** | Peak RAM usage under 200MB with 100,000 entries |
| **Load Time** | Initial app load < 3 seconds on 4G connection |
| **Browser Support** | Safari (iPad), Chrome, Edge (latest versions) |
| **Accessibility** | High-contrast winner display, readable at 3m distance |
| **Privacy** | No participant data leaves the device; no analytics on user data |

---

## 9. Constraints & Assumptions

### Constraints
- Zero monthly hosting cost (free-tier platforms only)
- No cloud database or user authentication system
- Must work on spotty mall/event Wi-Fi (offline after initial load)

### Assumptions
- Participant CSV is prepared before the event and placed in `public/data/users.csv`
- iPad is the primary presentation device (landscape orientation)
- CSV files are UTF-8 encoded with a `username` column

---

## 10. Future Considerations (Out of Scope for v1)

- Multi-language support (Arabic/English)
- Custom branding/theming per client
- QR code entry (audience scans to enter raffle live)
- Analytics dashboard (draw history, participation trends)
- WhatsApp integration for winner notification
- Multiple wheel types (slot machine, card flip)
- Instagram Graph API integration for fetching commenters directly
- Export winners list to CSV
- Audio effects (tick sounds, winner fanfare)

---

## 11. Risks & Mitigations

| Risk | Impact | Mitigation |
|:-----|:-------|:-----------|
| iPad Safari memory limits | App crash with very large datasets | Canvas rendering + virtual slicing caps memory; test with 100k on target device |
| Event Wi-Fi failure | Cannot load app initially | Offline-first PWA; install app before event while on Wi-Fi |
| CSV formatting issues | Names not loaded correctly | PapaParse handles edge cases; auto-detect username column |

---

## 12. Project Directory Structure

```
RaffleProject/
├── public/
│   ├── data/
│   │   └── users.csv              # Participant data (auto-loaded)
│   ├── icons/                     # PWA icons
│   └── sounds/                    # Tick, fanfare audio files (future)
├── src/
│   ├── composables/
│   │   ├── useWheel.ts            # Wheel physics & rendering logic
│   │   ├── useWinnerReveal.ts     # Animated winner overlay with confetti
│   │   └── useRng.ts              # Cryptographic RNG wrapper
│   ├── pages/
│   │   └── WheelPage.vue          # Single-page wheel (loads CSV, runs raffle)
│   ├── router/
│   │   └── routes.ts
│   ├── App.vue
│   └── main.ts
├── src-pwa/                       # Progressive Web App configuration
│   ├── register-service-worker.ts # Service worker registration
│   ├── custom-service-worker.ts   # Placeholder for GenerateSW
│   └── manifest.json              # Web app manifest for PWA installation
├── quasar.config.ts               # Quasar framework configuration
├── package.json
├── vercel.json                    # Vercel deployment configuration
├── PRD.md
└── README.md
```
