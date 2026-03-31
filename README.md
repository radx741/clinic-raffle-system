# Raffle: High-Performance PWA Picker

**Raffle** is a secure, high-performance Progressive Web App (PWA) designed for local businesses in Oman to conduct live giveaways. It features a GPU-accelerated wheel capable of handling up to **100,000 entries at 60fps** on an iPad, with zero backend infrastructure costs.

---

## Key Features

- **Massive Scale** — Handles up to 100,000 entries using a "Visual Proxy" Canvas engine.
- **Hybrid Ingestion** — Import participants via **Instagram comments** or **CSV uploads**, with optional de-duplication.
- **Privacy First** — All participant data is stored locally in the browser's IndexedDB. No data ever leaves the device.
- **Zero Hosting Cost** — Runs on free-tier platforms like Vercel or Netlify using serverless functions.
- **Event Ready** — Fully functional offline (after initial data fetch) with standalone PWA mode optimized for iPad.
- **Fair Selection** — Winner picked via `crypto.getRandomValues()` with uniform probability (P = 1/n).

---

## Tech Stack

| Component | Technology | Purpose |
|:----------|:-----------|:--------|
| **Frontend** | Vue 3 + Quasar (Vite) | High-performance UI and PWA management |
| **Rendering** | HTML5 Canvas | GPU-accelerated wheel animations at 60fps |
| **Physics** | GSAP | Realistic wheel deceleration and easing curves |
| **Storage** | IndexedDB (Dexie.js) | Local-first data persistence and recovery |
| **State** | Pinia | Centralized reactive state management |
| **Audio** | Howler.js | Low-latency sound effects synced to wheel movement |
| **CSV** | PapaParse | Fast, flexible CSV parsing |
| **API Proxy** | Vercel Functions | Secure bridge for Instagram Graph API requests |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
git clone https://github.com/your-username/raffle.git
cd raffle
npm install
cp .env.example .env
```

### Environment Variables

Create a `.env` file in the root directory. Variables prefixed with `VITE_` are exposed to the frontend, while others remain secure on the server.

```bash
# Frontend Access
VITE_RAFFLE_PASSCODE=your_event_passcode

# Backend Secrets (Vercel Functions only)
INSTAGRAM_CLIENT_SECRET=your_secret_key
```

### Development

```bash
# Standard dev server
quasar dev

# Dev server with PWA mode
quasar dev -m pwa
```

### Build and Deploy (Production)

```bash
# Build the PWA locally
quasar build -m pwa

# Deploy to Vercel (uses vercel.json config)
vercel --prod
```

> **Note:** The `vite-plugin-checker` is disabled during the build step in `quasar.config.ts` to prevent strict TypeScript/ESLint warnings from blocking deployment on Vercel.

---

## Project Structure

```
raffle/
│
├── api/                              # Vercel serverless functions
│   └── instagram.js                  #   Instagram Graph API proxy
│
├── public/
│   ├── favicon.ico
│   ├── icons/                        # PWA icons (192x192, 512x512)
│   │   ├── icon-192x192.png
│   │   └── icon-512x512.png
│   └── sounds/                       # Audio assets
│       ├── tick.mp3                  #   Slice tick during spin
│       ├── fanfare.mp3              #   Winner reveal sound
│       └── whoosh.mp3               #   Spin start sound
│
├── src/
│   ├── App.vue                       # Root component
│   ├── main.js                       # App entry point
│   │
│   ├── assets/
│   │   ├── fonts/                    # Custom brand fonts
│   │   └── images/
│   │       ├── logo.svg             #   App logo
│   │       └── confetti-sprite.png  #   Confetti particle sprite
│   │
│   ├── boot/                         # Quasar boot files
│   │   └── dexie.js                 #   IndexedDB initialization
│   │
│   ├── css/
│   │   ├── app.scss                  # Global styles
│   │   └── quasar-variables.scss     # Quasar theme overrides
│   │
│   ├── router/
│   │   ├── index.js                  # Vue Router setup
│   │   └── routes.js                 # Route definitions
│   │
│   ├── stores/                       # Pinia stores
│   │   ├── raffle-store.js          #   Entries, winners, draw state
│   │   └── settings-store.js        #   App preferences, passcode
│   │
│   ├── composables/                  # Reusable logic (Vue composables)
│   │   ├── useWheel.js              #   Canvas rendering & spin physics
│   │   ├── useAudio.js             #   Howler.js sound management
│   │   ├── useStorage.js           #   IndexedDB CRUD via Dexie
│   │   ├── useInstagram.js         #   Instagram API fetch logic
│   │   ├── useCsvParser.js         #   PapaParse CSV import
│   │   ├── useConfetti.js          #   Canvas confetti animation
│   │   └── useRng.js               #   Cryptographic random selection
│   │
│   ├── components/
│   │   ├── wheel/
│   │   │   ├── WheelCanvas.vue      #   Core canvas wheel component
│   │   │   ├── WheelPointer.vue     #   The arrow/pointer overlay
│   │   │   └── SpinButton.vue       #   Center tap-to-spin button
│   │   │
│   │   ├── data/
│   │   │   ├── CsvUploader.vue      #   Drag & drop CSV import
│   │   │   ├── InstagramFetcher.vue #   Instagram URL input + fetch
│   │   │   ├── EntryTable.vue       #   Scrollable entry review list
│   │   │   └── MergeControls.vue    #   Source toggle + de-dup switch
│   │   │
│   │   ├── reveal/
│   │   │   ├── WinnerModal.vue      #   Full-screen winner display
│   │   │   └── ConfettiOverlay.vue  #   Confetti canvas layer
│   │   │
│   │   └── shared/
│   │       ├── PasscodeGate.vue     #   Passcode entry screen
│   │       ├── EntryCount.vue       #   "12,847 participants" badge
│   │       └── ExportButton.vue     #   Export winners to CSV
│   │
│   ├── pages/
│   │   ├── PasscodePage.vue          # Gate screen — passcode entry
│   │   ├── DashboardPage.vue         # Import data, review entries
│   │   └── WheelPage.vue            # Full-screen wheel presentation
│   │
│   └── utils/
│       ├── constants.js              # App-wide constants
│       └── dedup.js                  # De-duplication logic
│
├── src-pwa/                          # Quasar PWA files
│   ├── register-service-worker.ts   #   SW registration
│   ├── custom-service-worker.ts     #   GenerateSW Placeholder
│   └── manifest.json                #   PWA manifest configuration
│
├── .env.example                      # Environment variable template
├── .gitignore
├── index.html
├── package.json
├── quasar.config.ts                  # Quasar framework config
├── vercel.json                       # Vercel CI/CD configuration
├── PRD.md
└── README.md
```

---

## How It Works

### The Wheel Engine

The wheel doesn't render 100,000 DOM elements. Instead:

1. **Pre-spin** — A winner is selected using `crypto.getRandomValues()` with uniform probability
2. **Visual proxy** — Only 50-100 slices are drawn on Canvas at any time
3. **Dynamic swap** — During the fast spin phase, names rotate through from the full pool
4. **Deceleration** — GSAP easing curve slows the wheel, landing precisely on the pre-selected winner
5. **Reveal** — Modal + confetti + fanfare

### Data Flow

```
CSV File / Instagram URL
        │
        ▼
  PapaParse / API Proxy
        │
        ▼
  De-duplication Engine
        │
        ▼
  IndexedDB (Dexie.js)
        │
        ▼
  Pinia Store ──> Canvas Wheel
        │
        ▼
  Winner Selected ──> Winners List ──> CSV Export
```

---

## Security & Privacy

> **Local-First Architecture:** This application does not use a centralized database. All participant names and contact details are stored within the device's internal storage (IndexedDB) and are deleted when the admin presses "Clear Data." No participant data is ever transmitted to external servers.

---

## Performance Targets

| Metric | Target |
|:-------|:-------|
| **Device** | iPad 9th Gen or newer |
| **Frame Rate** | Constant 60fps during spin |
| **Memory** | < 200MB RAM for 100k entries |
| **Load Time** | < 3 seconds on 4G |

---

## License

MIT
