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

### `backend/climbingAPI/serializers.py`
Serializers sit between your models and the JSON that the API sends/receives. Think of them as translators.

- **`CustomTokenObtainPairSerializer`** — adds `username` and `is_setter` to the JWT payload so the frontend can read them from the token.
- **`UserSerializer`** — handles registration. `password` is write-only so it never leaks in a response. Calls `create_user()` (not `create()`) so the password gets hashed.
- **`UserProfileSerializer`** — used for PATCH requests. Only `bio` is writable; everything else is read-only.
- **`GymSerializer`** — includes `wall_count` and `climb_count` as computed fields. These come from DB-level annotations (one COUNT query) not Python loops.
- **`ClimbSerializer`** — denormalises `wall_name` and `added_by_username` so the frontend doesn't need follow-up requests.
- **`SendSerializer`** — heavily denormalised. Includes the full chain of `climb → wall → gym` names and IDs so the profile page can show "you sent X on Y wall at Z gym" and link to it, all from a single response.
- **`CompetitionSerializer`** — embeds divisions, rounds, registration count, and whether the current user is registered, all in one response.

### `backend/climbingAPI/views.py`
Where the actual API logic lives. Each view handles one URL endpoint.

**Permissions:**
- `IsSetterOrReadOnly` — GET is open to anyone. POST/PUT/DELETE require `is_verified_setter=True`. Applied to gym, wall, and climb endpoints.

**Helper functions:**
- `gym_queryset_with_counts()` — annotates `wall_count` and `climb_count` onto the queryset at DB level, avoiding N+1 queries.
- `_get_or_create_oauth_user()` — handles Google OAuth. Looks up by Google sub ID → then by email → then creates a new account. Blocks setters from using OAuth.

**Key views:**

| View | URL (approx) | What it does |
|---|---|---|
| `CreateUserView` | `POST /api/user/register/` | Creates a new account |
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
| `QualifierLeaderboardView` | `GET /api/competitions/:id/leaderboard/` | Points ranking with tiebreak on attempts |
| `FinalsLeaderboardView` | `GET /api/competitions/:id/finals-leaderboard/` | IFSC ranking: tops → attempts → zones → zone attempts |

### `backend/climbingAPI/urls.py`
Maps every URL pattern to its view class. This is how Django knows which view to call for which URL.

### `backend/climbingAPI/admin.py`
Registers models with the Django admin panel at `/admin/`. Lets you view/edit all data in the browser — useful for manually creating setter accounts or fixing bad data.

### `backend/climbingAPI/migrations/`
Auto-generated files that track DB schema changes over time. Each migration is a snapshot of what changed. Django runs them in order to build the DB. You never edit these manually — run `python manage.py makemigrations` to generate them and `python manage.py migrate` to apply them.

---

## Frontend File Summaries

### Core

**`src/main.jsx`**
The entry point. Just mounts the `<App />` component into `index.html`.

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
Creates a configured Axios instance. The key part is a request interceptor that automatically attaches `Authorization: Bearer <token>` to every outgoing request. Import `api` instead of `axios` everywhere so this always applies.

**`src/constants.js`**
Just exports the string `'access'` as `ACCESS_TOKEN` — the localStorage key where the JWT is stored. Keeps it in one place so it doesn't get misspelled.

### Pages

**`src/pages/Login.jsx`**
Login form. On success, stores the access and refresh tokens in localStorage and redirects to `/`.

**`src/pages/Register.jsx`**
Registration form. Same flow — on success, logs the user straight in.

**`src/pages/Home.jsx`**
Landing page after login. Shows two lists of gyms:
1. "Your gyms" — gyms where you've logged at least one send (from `MyGymsView`)
2. All gyms — the full list (from `GymListCreateView`)
Also shows the map of all gyms with lat/lng set.

**`src/pages/GymPage.jsx`**
The main page for a specific gym. Shows all walls and their active climbs. Setters see "Add climb" buttons and "Archive wall" buttons. Also links to the gym's competitions and leaderboard.

**`src/pages/AddClimb.jsx`**
Setter-only form to create a new climb on a specific wall. Setter-gated at the route level too.

**`src/pages/ClimbPage.jsx`**
Detail page for a single climb. Shows grade, colour, image, community grade, sends, reviews, and videos. Climbers can log a send, vote on grade, and leave reviews here.

**`src/pages/ArchivedClimbs.jsx`**
Shows past (archived) climbs for a wall. Useful for looking back at old problems and your sends on them.

**`src/pages/Profile.jsx`**
User profile page. Works for both your own profile (`/profile`) and others (`/profile/:userId`). Shows bio, send history, and rank. Setters see a password change form. Other users see a follow/unfollow button.

**`src/pages/Leaderboard.jsx`**
The gym-wide points leaderboard. Shows ranked list of users with their points, send count, and rank badge (Iron → Magnus).

**`src/pages/Feed.jsx`**
Social activity feed. Shows recent sends and reviews from people you follow, in reverse chronological order.

**`src/pages/CompetitionList.jsx`**
Lists all competitions for a gym, grouped by status (upcoming / open / closed). Setters see a "Create competition" button.

**`src/pages/CompetitionPage.jsx`**
Detail page for a competition. Shows climbs in the comp, lets registered climbers log sends, and shows the leaderboard. Setters see a judging panel for finals events.

**`src/pages/CreateCompetition.jsx`**
Setter-only form to create a new competition. Sets type (qualifier vs finals), dates, divisions, and rounds.

**`src/pages/NotFound.jsx`**
The 404 page. Catches any URL that doesn't match a route.

### Components

**`src/components/ProtectedRoute.jsx`**
Checks if the access token exists and hasn't expired. If not, redirects to `/login`. Wraps every authenticated page in `App.jsx`.

**`src/components/Navbar.jsx`**
The top nav bar shown on all authenticated pages. Shows links to Home, Feed, Profile. Setters also see a "Create Gym" link.

**`src/components/Skeleton.jsx`**
A loading placeholder UI — shown while data is fetching to avoid a blank page flash.

**`src/components/ui/primitives.jsx`**
A small design system of reusable base components (buttons, cards, inputs, etc.) used throughout the app.

**`src/components/ui/PageShell.jsx`**
Wraps every page with consistent padding and layout.

**`src/components/ui/Sky.jsx`**
The animated sky background shown on some pages.

**`src/components/HomePageComponents/GymCard.jsx` / `GymCardMini.jsx`**
Card components for displaying a gym in a list. Full vs compact variants.

**`src/components/HomePageComponents/GymList.jsx`**
Container that renders a list of GymCards.

**`src/components/HomePageComponents/GymMap.jsx`**
Map component that plots gyms with `lat`/`lng` set.

**`src/components/CreateGymComponents/CreateGymForm.jsx`**
The form inside the Create Gym page.

**`src/components/CreateGymComponents/AddWallForm.jsx`**
Form to add a wall to an existing gym.

**`src/components/CreateGymComponents/WallCard.jsx`**
Displays a single wall within a gym page.

**`src/components/ClimbDashboardComponents/ClimbCard.jsx`**
Displays a single climb in a list with grade, colour, and send status.

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

**`src/theme/index.js`**
Colour palette and design tokens shared across the app.

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

**`backend/tests/test_views_gym.py`** — Integration tests for gym, wall, climb, and grade vote endpoints.
- Gym create: setter can, climber can't, `added_by` set from `request.user` not the POST body
- Gym detail: any authenticated user can GET, only creator can PATCH (others get 404)
- Climb list: active-only by default, archived endpoint returns only archived
- Archive wall: setter archives all active climbs at once, already-archived not double-counted
- Grade votes: first vote sets `community_grade`, re-vote updates (not duplicates), average calculated correctly
- My Gyms: returns gyms where user has sends, no duplicates when multiple sends at same gym

**`backend/tests/test_views_leaderboard.py`** — Tests the three leaderboard algorithms (the most business-critical code).
- **Gym leaderboard**: correct points per grade tier, archived sends excluded, sorted descending
- **Qualifier leaderboard**: sorted by points, tiebreaker is fewest attempts, `advances` flag correct, ranks sequential
- **Finals leaderboard (IFSC)**: all four tiebreak levels tested — more tops wins, then fewer top attempts, then more zones, then fewer zone attempts
- **Comp send guards**: can't send to closed comp, can't send without registering, registered user can send

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
1. **Django Tests** — spins up Ubuntu, installs Python, runs `manage.py test` against SQLite (no PostgreSQL needed in CI)
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
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver       # runs on :8000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev                      # runs on :5173
```

Frontend `.env` needs `VITE_API_URL=http://localhost:8000` to point at the local backend.
