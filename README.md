# Beta Board

A full-stack web application for indoor bouldering gyms — track climbs, log sends, vote on grades, run competitions, and rank up on a gamified leaderboard. Built as a portfolio project to gain hands-on experience across a broad modern web stack.

**Live app:** [betaboard.vercel.app](https://v3inmygym.vercel.app) &nbsp;|&nbsp; **Backend API:** hosted on Render

---

## What It Does

Beta Board gives climbers and gym setters a shared platform for a single gym ecosystem:

- **Setters** create gyms, add walls and climbs, archive old routes, and run competitions
- **Climbers** log sends (with attempt counts), vote on community grades, write reviews, and upload beta videos
- **Everyone** can see where they rank on a per-gym leaderboard with a gamified tier system (Iron through Magnus)
- **Competitions** support both Qualifier format (points-based live leaderboard) and Finals format (IFSC-style judging with tops/zones/attempts)
- The **map** shows all gyms plotted with a Leaflet interactive map, flying to the user's current location on load
- The app installs as a **PWA** so climbers can add it to their phone home screen and use it at the wall without a browser

Outside of being a portfolio project, it's a genuinely usable tool for small or independent climbing gyms that want route tracking, community grade consensus, competition hosting, and beta sharing without paying for commercial software.

---

## Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **Python / Django** | Core backend framework — models, ORM, admin, auth |
| **Django REST Framework** | REST API — serializers, viewsets, custom permissions |
| **PostgreSQL** | Production database hosted on Render |
| **SQLite** | Local development database (zero config) |
| **SimpleJWT** | JWT access + refresh token authentication |
| **JWT Blacklisting** | Invalidates refresh tokens on logout so stolen tokens can't be reused |
| **Google OAuth2** | Social sign-in via Google Identity Services, verified server-side |
| **WhiteNoise** | Serves Django static files directly without a CDN |
| **dj-database-url** | Parses the `DATABASE_URL` env var so the same settings file works locally (SQLite) and on Render (Postgres) |
| **Gunicorn** | WSGI server for production |
| **Render** | Django app hosting + managed Postgres database |

### Frontend
| Technology | Purpose |
|---|---|
| **React 18** | UI framework — component tree, hooks, context |
| **Vite** | Build tool and dev server  |
| **React Router v6** | Client-side routing |
| **Tailwind CSS** | Utility classes for layout and animation |
| **React Context (ThemeContext)** | Runtime day/night theming — palette swaps the entire app without recompiling |
| **Google Fonts (Gloock / Newsreader / Mulish)** | Three-font design system: display serif, editorial italic, sans-serif UI |
| **React Leaflet + OpenStreetMap** | Interactive gym map with geolocation, custom SVG markers, no API key required |
| **react-hot-toast** | Non-blocking toast notifications replacing all `alert()` calls |
| **vite-plugin-pwa + Workbox** | Service worker, offline caching of app shell, tile caching for map, NetworkOnly for API routes |
| **jwt-decode** | Client-side JWT claim reading (username, is_setter, user_id) without a round-trip to `/me` |
| **@react-oauth/google** | Google OAuth implicit flow on the frontend |
| **Vercel** | Frontend hosting with automatic deploys on push to master |

---

## Portfolio Topics Covered

### Django & Django REST Framework
- Custom `AbstractUser` extension for the setter role (`is_verified_setter`)
- DRF serializers with nested reads, `source=` field aliases, and computed fields
- Custom permission class (`IsSetterOrReadOnly`) — setters can write, climbers read-only
- `update_or_create` for idempotent sends, grade votes, and competition sends
- Soft-delete pattern (`is_archived`) for climbs so historical sends aren't orphaned
- `select_related` on profile endpoints to eliminate N+1 query problems
- `gym_queryset_with_counts()` helper annotating `wall_count` and `climb_count` at the database level using `Count` — avoids per-gym round-trips
- URL ordering: `gyms/my-gyms/` must come before `gyms/<int:pk>/` — Django resolves patterns in order, and a string would match the int slug if reversed
- IFSC boulder scoring algorithm: rank by tops → top attempts → zones → zone attempts

### Authentication
- JWT pair issued on login with custom claims (username, is_setter, user_id embedded in the payload)
- Silent token refresh: the Axios interceptor retries failed requests after refreshing, so the user never sees a re-login prompt mid-session
- Refresh token blacklisting on logout (server-side invalidation)
- Google OAuth server-side exchange: the frontend sends a Google `access_token` to the backend which calls Google's userinfo endpoint to verify it, then issues our own JWT — Google credentials never touch the client beyond the initial implicit flow

### React & Frontend Architecture
- Context-based theming: a `ThemeContext` provides the active palette to every component; swapping it at the root rerenders the whole tree — this is the foundation of the day/night toggle
- `useCallback` memoisation to prevent child `useEffect`s re-running when parent re-renders (used in CompetitionPage's polling intervals)
- Parallel data fetching with `Promise.all` across most pages — gym + walls, profile + sends + reviews + videos all load simultaneously
- Two-step confirmation pattern for destructive actions (archive wall) — prevents accidental clicks without a modal
- Optimistic UI update: the local climbs list is cleared immediately on archive without waiting for a refetch
- `FlyToUser` renderless child component pattern — `useMap()` only works inside a `MapContainer`, so the geolocation handler lives as a child that accesses the map instance via hook

### Database & Hosting
- Environment-driven settings: `DATABASE_URL` absent → SQLite (local), present → Postgres (production); same `settings.py` serves both
- `conn_max_age=600` for persistent Postgres connections — avoids per-request TCP handshakes on Render's free tier
- Separate `requirements.txt` (production) and `requirements-local.txt` (no psycopg2 or gunicorn) to keep the local venv lightweight
- Static file serving with WhiteNoise middleware (positioned after `SecurityMiddleware`)
- Vercel auto-deploys on push to `master`; Render does the same for the Django service

### Maps
- React Leaflet with custom `divIcon` markers instead of the default image markers — Vite can't resolve Leaflet's internal PNG paths during the build, so HTML-string icons sidestep that entirely
- OpenStreetMap tiles (free, no API key, used under ODbL licence)
- OSM tiles cached for 30 days via the PWA's Workbox `CacheFirst` strategy so the map works offline for previously-visited areas

### PWA
- `vite-plugin-pwa` generates a Workbox service worker at build time
- Precaches the entire app shell (JS, CSS, HTML, fonts, icons) on first load
- `NetworkOnly` for all `/api/` requests — API data is never stale-served from cache
- `CacheFirst` for OSM tile requests — tile CDN responses are cached by URL so repeat map views are instant and offline-capable
- `autoUpdate` register type — new service workers install silently; users get updates without a prompt

### UI & Design
- Inline style theming with a palette context — every colour, shadow, and border references `P.primary`, `P.line` etc. so the whole app reskins from one object swap
- Painterly "Ghibli" sky header built entirely in CSS: layered gradient divs, blurred radial cloud blobs, rounded hill silhouettes, and an SVG `feTurbulence` paper-grain overlay with `mix-blend-mode: soft-light`
- Skeleton loaders replace all `Loading...` text — page structure is visible before data arrives
- Gamified rank system with pixel-art SVG icons: Iron → Bronze → Silver → Gold → Platinum → Diamond → Emerald → Masters → Magnus (top 20 per gym). Points are tiered by grade (V0–V2 = 10pts through V11+ = 150pts) and reset when a gym archives its wall — rank reflects current active climbs, not history

### AI-Assisted Development
- **Claude Code** (CLI) was used throughout development for architecture decisions, debugging, and large-scale refactors — including the full UI redesign where every page was rewritten in a single session while preserving 100% of the existing functionality
- **Claude Design** generated the Ghibli-themed design system (palettes, typography, component specs, and a full HTML/React prototype with mock data) which was then ported into the production codebase


---

## Features At a Glance

| Feature | Detail |
|---|---|
| Gym management | Create gyms with walls, map coordinates, open/closed status |
| Route setting | Add climbs with colour, setter grade, and optional photo |
| Send logging | Log sends with attempt count; edit after the fact |
| Grade voting | Community grade calculated from all votes |
| Reviews & videos | Star rating + written review + optional video URL per climb |
| Archived climbs | Soft-delete walls; view old routes with their set dates |
| Rank system | 9 tiers from Iron to Magnus; points from active climbs only |
| Leaderboard | Per-gym standings; rank badge + progress bar per climber |
| Competitions | Qualifier (points) and Finals (IFSC tops/zones) formats |
| Competition judging | Setter judging panel for Finals with per-climber result entry |
| Gym map | Interactive Leaflet map; flies to user's location; gym popups |
| PWA | Installable on iOS and Android; partial offline support |
| Day/Night theme | Meadow (golden afternoon) and Dusk (twilight) — persisted to localStorage |
| Google OAuth | Sign in with Google; setter accounts use username/password only |

---

## Running Locally

**Backend**
```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements-local.txt
python manage.py migrate
python manage.py runserver
```

Create a `.env` based on `.env.example`. Leave `DATABASE_URL` unset to use SQLite.

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

The Vite dev server proxies `/api` requests to `localhost:8000` so no CORS config is needed locally.

---

## Project Structure

```
├── backend/
│   ├── climbingAPI/         # Main app: models, serializers, views, urls
│   ├── backend/             # Django settings, root urls, wsgi
│   ├── requirements.txt     # Production dependencies
│   └── requirements-local.txt
├── frontend/
│   ├── src/
│   │   ├── components/      # Shared UI components + design system
│   │   │   └── ui/          # PageShell, Sky, primitives (Btn, Card, Field…)
│   │   ├── pages/           # One file per route
│   │   ├── theme/           # Meadow + Dusk palettes, ThemeContext
│   │   └── utils/           # rankUtils (rank tiers, points, SVG icons)
│   └── public/              # PWA icons, static assets
└── README.md

```

## Still to Implement

```

- Find and implement free Cloud Storage for video sotrage rather then link uploads
- Ensure Videos uploaded by setters are always at the top of climb videos section
- World leaderboards for highest point earners globally
- Add climbing news tab to see IFSC competition scores aswell as recent news // Etiehr webscraping or manually audited and updated
- Add following section to follow other users and see recent sends videos and reviews by them also a friends leaderboard
- Email verification on register to avoid sp1am account creation

- Potential UI updates with graphs to show climb sends andusers thoughts on difficulty
- Add Demo Account for Portfolio Viewing
- Implement Tests and CI/CD on github
