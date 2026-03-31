# Raffle

A zero-cost, local-first PWA for running live giveaways at events. Built for businesses in Oman who need a premium-looking raffle wheel that handles 100k+ entries on an iPad without crashing, costs nothing to host, and keeps customer data private.

## Features

- **Canvas Wheel** — GPU-accelerated spinning wheel at 60fps with realistic deceleration physics
- **Auto-Load CSV** — Participants loaded automatically from `public/data/users.csv` on startup
- **Collaborator Exclusion** — Post collaborators/admins are filtered out automatically
- **De-duplication** — Duplicate usernames removed at load time
- **Cryptographically Fair** — Winners selected via `crypto.getRandomValues()` before animation starts
- **Winner Removal** — Winners are removed from the pool for consecutive draws
- **Animated Reveal** — Full-screen winner overlay with confetti and celebration effects
- **Offline-Ready** — PWA with service worker caching; wheel spins work without internet
- **Data Privacy** — All participant data stays on-device; nothing leaves the browser

## Tech Stack

| Component | Technology |
|:----------|:-----------|
| Frontend | Vue 3 + Quasar (Vite) |
| Wheel | HTML5 Canvas + GSAP |
| Audio | Howler.js |
| CSV | PapaParse |
| Hosting | Vercel / Netlify (free tier) |

## Setup

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev
```

## Updating Participants

Replace `public/data/users.csv` with your participant list. The CSV should have a `username` column:

```csv
username,profile_link
"user1","https://www.instagram.com/user1/"
"user2","https://www.instagram.com/user2/"
```

Duplicates are removed automatically. To exclude collaborators/admins, edit the `EXCLUDED_USERS` set in `src/pages/WheelPage.vue`.

## Project Structure

```
RaffleProject/
├── public/
│   └── data/
│       └── users.csv          # Participant data (auto-loaded)
├── src/
│   ├── composables/
│   │   ├── useWheel.ts        # Canvas wheel rendering + spin physics
│   │   ├── useWinnerReveal.ts # Animated winner overlay with confetti
│   │   └── useRng.ts          # Cryptographic RNG wrapper
│   ├── pages/
│   │   └── WheelPage.vue      # Full-screen wheel (single page app)
│   └── router/
│       └── routes.ts
├── .env.example
└── quasar.config.ts
```

## Build & Deploy

```bash
# Production build
pnpm build
```
