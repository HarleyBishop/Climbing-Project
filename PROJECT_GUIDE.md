# Climbing App — Project Guide

A personal reference for how this app works, how the pieces connect, and what every file does.

---

## The Big Picture

This is a full-stack web app split into two completely separate projects:

- **Backend** — Django (Python) running a REST API. Lives in `/backend`. Handles data, auth, and business logic.
- **Frontend** — React (JavaScript) running a single-page app. Lives in `/frontend`. Handles everything the user sees and interacts with.

They communicate over HTTP. The frontend calls the backend's API and the backend responds with JSON. They never share code directly.

---

## How Auth Works (End to End)

This is the most important thing to understand because it touches every part of the app.

1. User submits login form → frontend POSTs `username + password` to `/api/token/`
2. Backend checks the credentials, and if correct, returns two tokens:
   - **Access token** — short-lived JWT. Sent with every API request to prove who you are.
   - **Refresh token** — long-lived JWT. Used to get a new access token when the old one expires.
3. Frontend stores both tokens in `localStorage`
4. Every subsequent API call has `Authorization: Bearer <access_token>` in the header
5. Django reads that header, decodes the token, and sets `request.user` to the right user

**What's in the JWT?** Beyond the standard expiry/user_id, the backend injects `username` and `is_setter` into the token payload. This means the frontend can read those values from the token itself without making an extra API call — it just runs `jwtDecode(token)` in `auth.js`.

**Setter vs Climber roles** — `is_verified_setter` is a boolean on the user. It's set at registration and can't be changed via the API (only via Django admin). The entire permission system hinges on this one flag. Setters can create gyms, walls, climbs, and competitions. Climbers can only read and log sends.

---

## How the Database Is Structured

Think of the DB as a tree of ownership:

```
Gym
 └── Wall (belongs to a Gym)
      └── Climb (belongs to a Wall)
           ├── Send (one per user — "I completed this climb")
           ├── GradeVote (one per user — "I think this is grade X")
           ├── Review (a star rating + comment)
           └── Video (a URL to a video of the climb)

User
 ├── owns Gym (added_by)
 ├── owns Climb (added_by)
 ├── has many Sends, Reviews, Videos
 └── Follow (many-to-many self-join for the social feed)

Competition (belongs to a Gym)
 ├── Division (groupings within a comp: Open, Youth, etc.)
 ├── CompRound (named stages: "Route 1", "Boulder 2")
 ├── CompClimb (which climbs are in this comp, with point values)
 ├── CompRegistration (which users signed up)
 ├── CompSend (self-reported qualifier sends during the event)
 └── FinalsResult (judge-entered IFSC-style results)
```

**Key design decisions:**
- `Gym.added_by` uses `SET_NULL` on delete — if a setter account is deleted, the gym stays, `added_by` just becomes null.
- `Wall.gym` uses `CASCADE` — delete a gym and all its walls (and climbs, and sends) are gone.
- `Climb.is_archived = True` is a soft-delete — climbs are never actually deleted when a wall is reset, so send history is preserved. Active lists filter on `is_archived=False`.
- `GradeVote` and `Send` both have `unique_together = ['climb', 'user']` — one record per person per climb, enforced at DB level.
- `Competition.status` is not stored in the DB. It's a `@property` computed from `start_date` and `end_date` vs the current time. This means it's always accurate without needing a background job.

---

## Backend File Summaries

### `backend/backend/settings.py`
The Django config file. Key things set here:
- Which database to use (PostgreSQL in production, SQLite locally)
- `AUTH_USER_MODEL = 'climbingAPI.User'` — tells Django to use our custom User model
- JWT settings (token lifetimes, algorithm)
- CORS settings (which origins the frontend is allowed to call from)
- Installed apps, middleware, etc.

### `backend/backend/urls.py`
The root URL router. Maps URL prefixes to the app's URL file:
- `/api/token/` → JWT login endpoint (from simplejwt)
- `/api/token/refresh/` → exchange a refresh token for a new access token
- `/api/token/blacklist/` → invalidate a refresh token on logout
- `/api/schema/`, `/api/docs/`, `/api/redoc/` → the auto-generated OpenAPI schema, Swagger UI and ReDoc (drf-spectacular). They're built from the live code, so they can't drift out of date.
- Everything else under `/api/` → `climbingAPI/urls.py`

### `backend/climbingAPI/models.py`
Defines every database table. Each class is a table, each field is a column.

| Model | What it is |
|---|---|
| `User` | Extends Django's built-in user. Adds `is_verified_setter`, `google_id`, `bio` |
| `Gym` | A climbing gym. Has name, location, lat/lng for map, and an owner |
| `Wall` | A section of a gym (e.g. "Overhang Wall"). Belongs to a Gym |
| `Climb` | A single route/problem. Has grade, colour, image, soft-delete flag |
| `GradeVote` | One user's opinion on a climb's grade. Recalculates `community_grade` on every vote |
| `Send` | "I topped this climb." One per (user, climb). Stores attempt count |
| `Review` | Star rating + comment on a climb |
| `Video` | A URL to a video of someone on a climb |
| `Follow` | Social graph edge: `follower → following` |
| `Competition` | A timed event at a gym. Two types: `qualifier` or `finals` |
| `Division` | A sub-group within a comp (Open, Youth, Masters) |
| `CompRound` | A named stage within a comp |
| `CompClimb` | Which climbs are in a comp, with a custom points value per climb |
| `CompRegistration` | A user signing up for a competition |
| `CompSend` | Self-reported send during a qualifier. One per (user, comp climb) |
| `FinalsResult` | Judge-entered IFSC result: topped/zoned with attempt counts |

### `backend/climbingAPI/serializers/` and `views/`
Serializers sit between your models and the JSON that the API sends/receives; views handle one URL endpoint each. Both are split into matching files by domain, so the serializer for a view is always in the file with the same name:

| File | Covers |
|---|---|
| `users.py` | Registration, Google login, profiles, password change, follows, activity feed |
| `gyms.py` | Gyms, walls, climbs, wall archiving |
| `climb_activity.py` | Grade votes, sends, reviews, videos |
| `competitions.py` | Competitions, divisions, rounds, comp climbs, registration, comp sends, finals results |
| `leaderboards.py` | Gym, qualifier and finals rankings |
| `serializers/common.py` | Shared pieces: `DetailSerializer` and the `ClimbContextFields` mixin |

**Conventions** (also listed in `views/__init__.py`):
- Every endpoint returns data through a serializer, so response shapes are declared once and appear in the API docs at `/api/docs/`.
- "Create or update" endpoints (grade votes, sends, comp sends, finals results, registrations) do their `update_or_create` inside the serializer's `create()`. Views stay the standard DRF shape.
- Setter-only writes use the `IsSetterOrReadOnly` permission class rather than ad-hoc checks inside views.
- Business-rule failures (e.g. "competition closed") raise `BadRequest` / `PermissionDenied`, which return `{"detail": "..."}`.

**Notable pieces:**
- **`CustomTokenObtainPairSerializer`** — adds `username` and `is_setter` to the JWT payload so the frontend can read them from the token.
- **`ClimbContextFields`** — mixin adding the `climb → wall → gym` names and IDs to sends, reviews, videos and feed items, so the profile page can show "you sent X on Y wall at Z gym" and link to it from a single response.
- **`Gym.objects.with_counts()`** (in `models.py`) — annotates `wall_count` and `climb_count` at DB level, avoiding N+1 queries.
- **Leaderboards** — each is a `User` queryset annotated with its scores plus a `ROW_NUMBER()` window rank, so aggregation and sorting happen in one SQL query.
- **`ActivityFeedView`** — sends and reviews are annotated with a shared `feed_type`/`timestamp` so the two models can be merged and serialized as one list.

### `backend/climbingAPI/permissions.py`
- `IsSetterOrReadOnly` — GET is open to anyone. POST/PUT/PATCH/DELETE require `is_verified_setter=True`.
- `IsSelfOrReadOnly` — anyone can read a profile; only that user can edit it.

### `backend/climbingAPI/oauth.py`
Google sign-in helpers: fetch the Google profile, find or create the user (by Google sub ID → then email → then a new account; setters are blocked), and issue a JWT pair.

### `backend/climbingAPI/exceptions.py`
`BadRequest` — a 400 with a plain `{"detail": "..."}` body, matching DRF's 403/404 format.

**Key endpoints:**

| View | URL (approx) | What it does |
|---|---|---|
| `RegisterView` | `POST /api/user/register/` | Creates a new account |
| `UserDetailView` | `GET/PATCH /api/users/:id/` | Returns profile info; allows bio edit |
| `FollowView` | `POST/DELETE /api/users/:id/follow/` | Follow or unfollow someone |
| `ActivityFeedView` | `GET /api/feed/` | Returns the 50 most recent sends/reviews from people you follow |
| `ChangePasswordView` | `POST /api/users/change-password/` | Changes password after verifying current one |
| `GoogleLoginView` | `POST /api/auth/google/` | OAuth sign-in via Google access token |
| `GymListCreateView` | `GET/POST /api/gyms/` | List all gyms or create one (setter only) |
| `GymDetailView` | `GET/PATCH/DELETE /api/gyms/:id/` | View or edit a specific gym |
| `MyGymsView` | `GET /api/gyms/my-gyms/` | Gyms where the logged-in user has sends |
| `WallListCreateView` | `GET/POST /api/gyms/:id/walls/` | List or create walls in a gym |
| `ArchiveWallClimbsView` | `POST /api/gyms/:id/walls/:id/archive-climbs/` | Bulk-archives all active climbs on a wall |
| `ClimbListCreateView` | `GET/POST /api/gyms/:gId/walls/:wId/climbs/` | Active climbs on a wall, or add one |
| `ClimbArchivedListView` | `GET .../climbs/archived/` | Past climbs (soft-deleted) |
| `GradeVoteListCreateView` | `POST .../votes/` | Submit or update a grade vote; recalculates `community_grade` |
| `SendListCreateView` | `POST .../sends/` | Log a send; update if already logged |
| `GymLeaderboardView` | `GET /api/gyms/:id/leaderboard/` | Points-based ranking for a gym |
| `CompetitionListCreateView` | `GET/POST /api/gyms/:id/competitions/` | List or create competitions |
| `CompRegisterView` | `POST /api/competitions/:id/register/` | Sign up for a competition |
| `CompSendCreateView` | `POST /api/competitions/:id/log-send/` | Log a send during a qualifier (checks: comp open, user registered, valid climb) |
| `FinalsResultListCreateView` | `GET/POST /api/competitions/:id/finals-results/` | Judges record or correct finals results |
| `QualifierLeaderboardView` | `GET /api/competitions/:id/leaderboard/` | Points ranking with tiebreak on attempts |
| `FinalsLeaderboardView` | `GET /api/competitions/:id/finals-leaderboard/` | IFSC ranking: tops → attempts → zones → zone attempts |

The full, always-up-to-date list with request/response shapes is at `/api/docs/` (Swagger) or `/api/redoc/`.

### `backend/climbingAPI/urls.py`
Maps every URL pattern to its view class. This is how Django knows which view to call for which URL.

### `backend/climbingAPI/admin.py`
Registers models with the Django admin panel at `/admin/`. Lets you view/edit all data in the browser — useful for manually creating setter accounts or fixing bad data.

### `backend/climbingAPI/migrations/`
Auto-generated files that track DB schema changes over time. Each migration is a snapshot of what changed. Django runs them in order to build the DB. You never edit these manually — run `python manage.py makemigrations` to generate them and `python manage.py migrate` to apply them.

---

## Frontend File Summaries

### Core

For the design system (tokens, conventions) and how the Magic UI components were ported, see [`frontend/README.md`](frontend/README.md).

**`src/main.jsx`**
The entry point. Mounts `<App />` inside the Google OAuth provider, plus the toast container. It also imports `styles/style.css`.

**`src/styles/style.css`**
All global styling. The `@theme` block defines the design tokens (colours, font, Magic UI keyframes). Tailwind turns each `--color-*` into utilities like `text-muted` or `bg-surface`. There is one light theme, so this is the only place colours are defined.

**`src/App.jsx`**
Defines all the routes (URLs → page components). Two route guards:
- `<ProtectedRoute>` — wraps any page that requires login. Checks JWT validity and redirects to `/login` if missing/expired.
- `<SetterRoute>` — wraps setter-only pages. Reads `is_setter` from the JWT and redirects to `/` if false.

Routes that need both (e.g. Create Gym) are double-wrapped: `<ProtectedRoute><SetterRoute>`.

**`src/auth.js`**
Two exported functions:
- `getDecodedToken()` — reads the JWT from localStorage and decodes it (client-side only, no signature verification). Returns null if missing or malformed.
- `isSetter()` — reads the `is_setter` claim from the decoded token. Used by `SetterRoute` and throughout the UI to show/hide setter-only buttons.

**`src/api.js`**
Creates a configured Axios instance. The key part is a request interceptor that automatically attaches `Authorization: Bearer <token>` to every outgoing request. Import `api` instead of `axios` everywhere so this always applies. The exception is the public auth endpoints (register, login, refresh, Google): the header is skipped there because Django rejects an expired token with 401 even on endpoints that don't need one.

**`src/constants.js`**
Exports the localStorage keys for the access and refresh tokens (`ACCESS_TOKEN`, `REFRESH_TOKEN`). Keeps them in one place so they don't get misspelled.

**`src/lib/utils.js`**
`cn(...classes)`: combines `clsx` (conditional classes) with `tailwind-merge` (conflict resolution). It's used by every shared component so a `className` passed in overrides the defaults.

**`src/lib/holds.js`**
Maps hold colour names ("Blue", "Pink"…) to hex values, plus `holdColour(name)` with a fallback. Used for climb tiles, colour strips and the climb page hero.

### Pages

**`src/pages/Login.jsx`**
Login page (`AuthScaffold` layout). On success, stores the access and refresh tokens in localStorage and redirects to where the user was going (or `/`).

**`src/pages/Register.jsx`**
Registration page. The user picks Climber or Setter with a segmented control. On success it redirects to `/login`.

**`src/pages/Home.jsx`**
Landing page after login. It opens with a bento grid (Magic UI): a "Following activity" tile, and either "Create a gym" (setters) or "Your profile". Below that:
1. A search box over all gyms
2. "Your gyms": gyms where you've logged at least one send (from `MyGymsView`), paginated
3. A map of every gym with lat/lng set

**`src/pages/GymPage.jsx`**
The main page for a specific gym. A horizontally scrolling wall picker, then the selected wall's active climbs as a grid of hold-coloured tiles. Setters see "Add climb" and "Archive all" (with a confirmation step). Links to the gym's competitions and leaderboard.

**`src/pages/AddClimb.jsx`**
Setter-only form to create a new climb on a specific wall, with a live preview tile that updates as you pick the colour, grade and name. Setter-gated at the route level too.

**`src/pages/ClimbPage.jsx`**
Detail page for a single climb. A large hero tile in the hold colour (or the photo), stats that count up (setter grade, community grade, sends, reviews), then grade voting, beta videos and reviews. Climbers log sends and write reviews through modals.

**`src/pages/ArchivedClimbs.jsx`**
Shows past (archived) climbs for a wall. Useful for looking back at old problems and your sends on them.

**`src/pages/Profile.jsx`**
User profile page. Works for both your own profile (`/profile`) and others (`/profile/:userId`). A centred header (avatar, rank badge, points, home gym, bio, follower counts), stats that count up, then sends, reviews and videos. On your own profile you can edit your bio and change your password. On other people's profiles you get a follow/unfollow button.

**`src/pages/Leaderboard.jsx`**
The gym-wide points leaderboard. The top three are shown as a podium, the rest as a ranked list with animated progress bars and rank badges (Iron → Magnus). Below that are the rank tiers and the points-per-grade table.

**`src/pages/Feed.jsx`**
Social activity feed. Shows recent sends and reviews from people you follow, in reverse chronological order.

**`src/pages/CompetitionList.jsx`**
Lists all competitions for a gym, grouped by status (upcoming / open / closed). Setters see a "Create competition" button.

**`src/pages/CompetitionPage.jsx`**
Detail page for a competition, split into Info / Climbs / Leaderboard tabs (a sliding segmented control). Registered climbers log sends from the Climbs tab. The leaderboard polls every 30 seconds so it stays live during an event. Setters can add/remove climbs, show a registration QR code, and use a judging panel for finals events.

**`src/pages/CreateCompetition.jsx`**
Setter-only form to create a new competition. Sets type (qualifier vs finals), dates, divisions, and rounds.

**`src/pages/NotFound.jsx`**
The 404 page. Catches any URL that doesn't match a route.

### Components

**`src/components/ProtectedRoute.jsx`**
Checks if the access token exists and hasn't expired. If not, redirects to `/login`. Wraps every authenticated page in `App.jsx`.

**`src/components/ui/PageShell.jsx`**
The layout every page uses:
- `PageShell`: a sticky frosted-glass nav bar (logo, Gyms, Feed, setter badge, sign out, avatar), then an optional back link, eyebrow and big headline, then the page content. The header and content blur-fade in on load.
- `AuthScaffold`: the login/register layout. Headline, feature marquee and form on one side, illustration on the other (stacked on mobile).

**`src/components/ui/primitives.jsx`**
The shared component library: `Btn`, `Card`, `Chip`, `Field`, `Toggle`, `Avatar`, `Stars`, `Modal`, `GradePills`, `ColourSwatches`, `Segmented` / `Tabs`, `Stat`, `ProgressBar`, `Empty`, `ErrorText`, `ErrorScreen`, plus the shared `inputClass`. Every component accepts `className`. `Modal` renders through a portal into `<body>` (see the gotcha in the frontend README).

**`src/components/magicui/`**
Animated components ported from [Magic UI](https://magicui.design): `blur-fade`, `number-ticker`, `bento-grid`, `marquee`, `animated-shiny-text`. Each file's header links to its source and lists what was changed. The frontend README explains how to add more.

**`src/components/Skeleton.jsx`**
Loading placeholders (`PageSkeleton`, `CardSkeleton`) shown while data is fetching, so the page structure is visible before data arrives.

**`src/components/HomePageComponents/GymCard.jsx`**
A gym in a list: hold-colour dot, name, location, wall/climb counts, open/closed chip.

**`src/components/HomePageComponents/GymList.jsx`**
The home page's gym search plus the paginated "Your gyms" list.

**`src/components/HomePageComponents/GymMap.jsx`**
Leaflet map plotting gyms with `lat`/`lng` set. It flies to the user's location when geolocation is allowed. OpenStreetMap tiles are muted with CSS filters to match the UI.

**`src/components/CreateGymComponents/CreateGymForm.jsx`**
The Create Gym page: gym details, coordinates, open/closed toggle, and an inline form for adding walls before the gym is created.

**`src/components/ClimbDashboardComponents/ClimbCard.jsx`**
A climb tile: photo or hold-colour gradient, grade badge, name, and community grade (or set date on the archived page).

**`src/components/LoginRegisterComponents/LoginRegisterForm.jsx`**
Shared form component used by both Login and Register pages.

### Utilities

**`src/utils/rankUtils.jsx`**
Two key exports:
- `calculatePoints(sends)` — takes a user's sends array and calculates their total points using the tiered grade-to-points formula. Filters out archived climbs.
- `getRank(points, position)` — maps a points total to a rank badge (Iron, Bronze, Silver, Gold, Platinum, Diamond, Emerald, Masters). If `position <= 20`, returns the special "Magnus" rank instead (top 20 at a gym get Magnus regardless of points).

**The grade → points scale (matches backend exactly):**

| Grade | Points |
|---|---|
| V0–V2 | 10 |
| V3–V4 | 20 |
| V5–V6 | 40 |
| V7–V8 | 70 |
| V9–V10 | 100 |
| V11+ | 150 |

It also contains the pixel-art SVG rank icons and the `RankBadge` component. These rank colours are the one place colours are set in JS rather than in `style.css`, because each tier has its own colour.

---

## Test File Summaries

### Backend Tests

**`backend/tests/test_models.py`** — Tests the database layer only (no HTTP).
- `CompetitionStatusTest` — verifies the `status` property returns `upcoming`, `open`, or `closed` correctly based on the current time.
- `GradeVoteUniqueTest` — confirms the DB enforces one vote per (user, climb). Two votes from the same user must raise `IntegrityError`.
- `SendUniqueTest` — same constraint check for Sends.
- `ClimbArchiveTest` — confirms `is_archived=False` filter works and archived climbs don't appear in active lists.
- `FollowTest` — confirms duplicate follows raise `IntegrityError` but reverse follows are allowed.
- `CascadeTest` — confirms delete behaviour: deleting a setter nulls `gym.added_by` (SET_NULL), deleting a gym cascades to walls, deleting a wall cascades to climbs.

**`backend/tests/test_permissions.py`** — Tests `IsSetterOrReadOnly` in isolation using fake request objects (no actual HTTP).
- GET/HEAD/OPTIONS → always allowed, even for anonymous users
- POST/PUT/DELETE → allowed for setters only, 403 for climbers and anonymous

**`backend/tests/test_views_auth.py`** — Integration tests for the HTTP layer: registration, password change, follow/unfollow, and profile editing.
- Registration: creates user, hashes password, doesn't return password in response, rejects duplicates
- Password change: correct current password required, wrong password rejected, too-short password rejected
- Follow: creates relationship, idempotent (double-follow = one row), can't follow yourself, unfollow removes row
- Profile: can only edit your own bio, `is_following` flag in response is accurate
- Activity feed: only followed users appear, sends and reviews are merged newest-first, review-only fields (comment, stars) don't appear on send items

**`backend/tests/test_views_gym.py`** — Integration tests for gym, wall, climb, and grade vote endpoints.
- Gym create: setter can, climber can't, `added_by` set from `request.user` not the POST body
- Gym detail: any authenticated user can GET, only creator can PATCH (others get 404)
- Climb list: active-only by default, archived endpoint returns only archived
- Archive wall: setter archives all active climbs at once, already-archived not double-counted
- Grade votes: first vote sets `community_grade`, re-vote updates (not duplicates), average calculated correctly, deleting a vote recalculates it
- My Gyms: returns gyms where user has sends, no duplicates when multiple sends at same gym

**`backend/tests/test_views_leaderboard.py`** — Tests the three leaderboard algorithms (the most business-critical code).
- **Gym leaderboard**: correct points per grade tier, archived sends excluded, sorted descending
- **Qualifier leaderboard**: sorted by points, tiebreaker is fewest attempts, `advances` flag correct, ranks sequential
- **Finals leaderboard (IFSC)**: all four tiebreak levels tested — more tops wins, then fewer top attempts, then more zones, then fewer zone attempts
- **Finals result entry**: a judge re-saving a result updates it rather than failing, climbers can't record results, climbs from another competition are rejected
- **Comp send guards**: can't send to closed comp, can't send without registering, registered user can send

**`backend/tests/test_api_docs.py`**: guards the API documentation.
- The OpenAPI schema must generate with zero warnings and pass validation. drf-spectacular silently skips views it can't understand, so without this test a new endpoint could quietly vanish from the docs.
- `/api/schema/`, `/api/docs/` and `/api/redoc/` are reachable without logging in.

### Frontend Tests

**`frontend/tests/auth.test.js`** — Tests the `auth.js` utility functions.
- `getDecodedToken`: returns null when no token, returns decoded payload for valid token, returns null for malformed token (caught exception)
- `isSetter`: returns false for climber token, true for setter token, false for malformed token, false when `is_setter` claim is missing

**`frontend/tests/rankUtils.test.js`** — Tests the rank calculation functions.
- `getRank` point thresholds: every rank boundary tested (Iron at 0, Bronze at 100, Silver at 300, Gold at 700, Platinum at 1200, Diamond at 2000, Emerald at 3000, Masters at 4500+)
- `getRank` Magnus override: position ≤ 20 always returns Magnus, position 21 falls through to points
- `calculatePoints` grade boundaries: every grade tier tested against the expected points value
- `calculatePoints` archived filtering: archived sends excluded from total, mixed sends calculated correctly
- `RANKS` constant: 8 tiers, sorted ascending, Iron at min=0, Masters is last

---

## CI/CD Pipeline

**`.github/workflows/tests.yml`** — Runs on every push and pull request to master.

Two jobs run in parallel:
1. **Django Tests** — spins up Ubuntu, installs Python, runs `manage.py test tests` against SQLite (no PostgreSQL needed in CI). It discovers every `tests/test_*.py`, so new test files run automatically.
2. **Vitest Tests** — installs Node.js, runs `npm test`

Then, only if both pass AND the push is to master:
3. **Deploy Backend** → POSTs to the Render deploy hook URL
4. **Deploy Frontend** → POSTs to the Vercel deploy hook URL

These deploy hook URLs are stored as GitHub repository secrets (`RENDER_DEPLOY_HOOK`, `VERCEL_DEPLOY_HOOK`). If the secrets aren't set, the deploy steps will fail with a malformed URL error.

---

## Local Dev Setup

```
# Backend
cd backend
pip install -r requirements-local.txt
python manage.py migrate
python manage.py runserver       # runs on :8000; API docs at /api/docs/

# Frontend (separate terminal)
cd frontend
npm install
npm run dev                      # runs on :5173
```

No `VITE_API_URL` is needed locally: `vite.config.js` proxies every `/api` request from :5173 to the Django server on :8000. `VITE_API_URL` is only set in production, where the frontend (Vercel) and backend (Render) are on different domains.

**If login suddenly returns 401** after a long break, an expired token is probably still in the browser's localStorage. `api.js` now skips the token on auth endpoints so this shouldn't happen, but clearing localStorage in DevTools fixes it either way.
