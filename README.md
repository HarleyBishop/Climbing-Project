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
| **Django REST Framework** | REST API — serializers, generic views, custom permissions |
| **drf-spectacular** | Generates an OpenAPI 3 schema from the code; serves Swagger UI (`/api/docs/`) and ReDoc (`/api/redoc/`) |
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
| **React 19** | UI framework — component tree, hooks |
| **Vite** | Build tool and dev server  |
| **React Router v7** | Client-side routing |
| **Tailwind CSS v4** | All styling; design tokens defined once in a CSS `@theme` block |
| **Magic UI** | Open-source (MIT) animated components — blur-fade, number ticker, bento grid, marquee — copied into the codebase and adapted |
| **Motion** | Animation library behind the Magic UI components, the modal spring and the sliding segmented control |
| **clsx + tailwind-merge** | The `cn()` helper for conditional classes that resolve conflicts correctly |
| **Inter** | Single typeface; falls back to SF Pro on Apple devices |
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
- Code split by domain: `views/` and `serializers/` packages with matching modules (users, gyms, climb_activity, competitions, leaderboards)
- Every endpoint returns data through a serializer, including hand-shaped responses like the activity feed, so response shapes are declared once and documented automatically
- DRF serializers with nested reads, `source=` field aliases, computed fields, and a shared field mixin (`ClimbContextFields`) reused across sends, reviews, videos and feed items
- Custom permission classes (`IsSetterOrReadOnly`, `IsSelfOrReadOnly`) instead of ad-hoc role checks inside views
- Idempotent "create or update" endpoints (sends, grade votes, comp sends, finals results) implemented in the serializer's `create()` with `update_or_create`
- Soft-delete pattern (`is_archived`) for climbs so historical sends aren't orphaned
- `select_related` / `prefetch_related` throughout to eliminate N+1 query problems
- Custom QuerySet method `Gym.objects.with_counts()` annotating `wall_count` and `climb_count` at the database level — avoids per-gym round-trips
- Leaderboards computed entirely in SQL: a `User` queryset annotated with `Sum`/`Count` aggregates (with conditional `filter=Q(...)` and `Case/When` for tiered points) plus a `ROW_NUMBER()` window function for the rank — one query instead of looping over every send in Python
- Auto-generated OpenAPI docs (drf-spectacular); a test fails the build if any endpoint can't be documented
- URL ordering: `gyms/my-gyms/` must come before `gyms/<int:pk>/` — Django resolves patterns in order, and a string would match the int slug if reversed
- IFSC boulder scoring algorithm: rank by tops → top attempts → zones → zone attempts

### Authentication
- JWT pair issued on login with custom claims (username, is_setter, user_id embedded in the payload)
- Silent token refresh: `ProtectedRoute` checks the access token's expiry on page load and swaps in a fresh one using the refresh token, so users aren't sent back to login while their refresh token is valid
- The Axios request interceptor attaches the JWT to every call except the public auth endpoints (register, login, refresh) — DRF rejects an expired token with 401 *before* checking permissions, so a stale token in storage would otherwise break login itself
- Refresh token blacklisting on logout (server-side invalidation)
- Google OAuth server-side exchange: the frontend sends a Google `access_token` to the backend which calls Google's userinfo endpoint to verify it, then issues our own JWT — Google credentials never touch the client beyond the initial implicit flow

### React & Frontend Architecture
- Small shared component library (`primitives.jsx`) where every component accepts a `className` merged via `cn()`, so pages customise layout without inline styles
- Modals rendered through `createPortal` so animated ancestors (whose `transform`/`filter` would otherwise become the containing block) can't misplace `position: fixed` overlays
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
- OpenStreetMap tiles (free, no API key, used under ODbL licence), muted with CSS `saturate`/`brightness` filters on the tile pane to match the UI while markers keep full colour
- OSM tiles cached for 30 days via the PWA's Workbox `CacheFirst` strategy so the map works offline for previously-visited areas

### PWA
- `vite-plugin-pwa` generates a Workbox service worker at build time
- Precaches the entire app shell (JS, CSS, HTML, fonts, icons) on first load
- `NetworkOnly` for all `/api/` requests — API data is never stale-served from cache
- `CacheFirst` for OSM tile requests — tile CDN responses are cached by URL so repeat map views are instant and offline-capable
- `autoUpdate` register type — new service workers install silently; users get updates without a prompt

### UI & Design
- Apple-inspired design: off-white page, white cards with layered soft shadows, large two-tone headlines, a frosted-glass sticky nav bar (`backdrop-blur`), and a single accent colour
- All styling in Tailwind CSS v4 with design tokens declared once in a CSS `@theme` block — no JS theme objects or runtime palette swapping
- Motion design using Magic UI components: content blur-fades in on load and as it scrolls into view, stats count up with a spring, bento-grid tiles lift on hover, and a marquee of feature pills scrolls on the login page
- iOS-style segmented controls and tabs where the selected pill slides between options (Motion shared `layoutId`), and modals that spring in over a blurred backdrop
- Climb tiles and the climb page hero are rendered in the climb's physical hold colour
- Skeleton loaders replace all `Loading...` text — page structure is visible before data arrives
- Gamified rank system with pixel-art SVG icons: Iron → Bronze → Silver → Gold → Platinum → Diamond → Emerald → Masters → Magnus (top 20 per gym). Points are tiered by grade (V0–V2 = 10pts through V11+ = 150pts) and reset when a gym archives its wall — rank reflects current active climbs, not history

### AI-Assisted Development
- **Claude Code** (CLI) was used throughout development for architecture decisions, debugging, and large-scale refactors — including the full UI redesign where every page was rewritten in a single session while preserving 100% of the existing functionality
- The original UI used a Ghibli-themed design system generated with **Claude Design**. It was later replaced with the current Apple-style Tailwind design, built from open-source **Magic UI** components (see [`frontend/README.md`](frontend/README.md) for how they were ported and how to add more)
- Claude Code also restructured the Django backend into domain modules, moved the leaderboards into SQL, added the OpenAPI docs, and drove a headless browser to screenshot every page at desktop and mobile widths during the redesign


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
| Activity feed | Recent sends and reviews from climbers you follow |
| API docs | Interactive Swagger UI at `/api/docs/`, ReDoc at `/api/redoc/` |
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

**API docs:** with the backend running, open [localhost:8000/api/docs/](http://localhost:8000/api/docs/). To try protected endpoints, call `POST /api/token/`, click **Authorize**, and paste the `access` token.

**Tests:** `python manage.py test` in `backend/`, `npm test` in `frontend/`.

---

## Project Structure

```
├── backend/
│   ├── climbingAPI/         # Main app
│   │   ├── models.py
│   │   ├── views/           # users, gyms, climb_activity, competitions, leaderboards
│   │   ├── serializers/     # same split as views/, plus common.py
│   │   ├── permissions.py   # IsSetterOrReadOnly, IsSelfOrReadOnly
│   │   ├── oauth.py         # Google sign-in helpers
│   │   └── urls.py
│   ├── backend/             # Django settings, root urls (incl. API docs), wsgi
│   ├── tests/               # Django test suite
│   ├── requirements.txt     # Production dependencies
│   └── requirements-local.txt
├── frontend/                # See frontend/README.md for the design system
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/          # PageShell + primitives (Btn, Card, Field, Modal…)
│   │   │   └── magicui/     # Animated components ported from Magic UI
│   │   ├── lib/             # cn() helper, hold colours
│   │   ├── pages/           # One file per route
│   │   ├── styles/          # style.css — Tailwind @theme design tokens
│   │   └── utils/           # rankUtils (rank tiers, points, SVG icons)
│   ├── tests/               # Vitest unit tests
│   └── public/              # PWA icons, static assets
├── PROJECT_GUIDE.md         # How every piece works, file by file
├── ARCHITECTURE.md          # System diagrams
└── README.md

```

## Still to Implement

```

- Email verification on register to avoid sp1am account creation
- Add Demo Account for Portfolio Viewing

