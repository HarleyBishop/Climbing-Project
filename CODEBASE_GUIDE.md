# Beta Board: How the Whole Codebase Works

Personal reference notes. Covers every part of the app: the Django backend, the React frontend, each feature area, and how it's all deployed. Written assuming no prior knowledge of the frameworks, but focused on the *specific tools* this project uses rather than general "what is React" explanations.

---

## Table of contents

1. [The big picture](#1-the-big-picture)
2. [Repo layout](#2-repo-layout)
3. [Backend part 1: Django](#3-backend-part-1-django)
4. [Backend part 2: Django REST Framework (DRF)](#4-backend-part-2-django-rest-framework-drf)
5. [Backend part 3: the models (data layer)](#5-backend-part-3-the-models-data-layer)
6. [Backend part 4: ORM query tools used](#6-backend-part-4-orm-query-tools-used)
7. [Feature: auth, users, follows and the feed](#7-feature-auth-users-follows-and-the-feed)
8. [Feature: gyms, walls and climbs](#8-feature-gyms-walls-and-climbs)
9. [Feature: climb activity (votes, sends, reviews)](#9-feature-climb-activity-votes-sends-reviews)
10. [Feature: videos and Supabase Storage](#10-feature-videos-and-supabase-storage)
11. [Feature: gym leaderboard and ranks](#11-feature-gym-leaderboard-and-ranks)
12. [Feature: competitions (big section)](#12-feature-competitions)
13. [Frontend part 1: build tooling and entry point](#13-frontend-part-1-build-tooling-and-entry-point)
14. [Frontend part 2: React tools used](#14-frontend-part-2-react-tools-used)
15. [Frontend part 3: routing](#15-frontend-part-3-routing)
16. [Frontend part 4: talking to the API and client-side auth](#16-frontend-part-4-talking-to-the-api-and-client-side-auth)
17. [Frontend part 5: styling and UI components](#17-frontend-part-5-styling-and-ui-components)
18. [Frontend part 6: other libraries and the PWA](#18-frontend-part-6-other-libraries-and-the-pwa)
19. [DevOps: hosting, environments and CI/CD](#19-devops-hosting-environments-and-cicd)
20. [Testing](#20-testing)
21. [Local dev cheat sheet](#21-local-dev-cheat-sheet)
22. [Quirks and things to remember](#22-quirks-and-things-to-remember)

---

## 1. The big picture

The app is split into two completely separate programs that talk over HTTP:

```
 Browser (React SPA)                        Render (Django API)                 Supabase
 hosted on Vercel                           gunicorn + Django + DRF
┌──────────────────┐   JSON over HTTPS    ┌────────────────────────┐   SQL    ┌──────────────┐
│ pages, components│ ───────────────────▶ │ urls → views →         │ ───────▶ │  Postgres DB │
│ axios (api.js)   │ ◀─────────────────── │ serializers → models   │ ◀─────── │              │
│ JWT in           │   Authorization:     └────────────────────────┘          ├──────────────┤
│ localStorage     │   Bearer <token>                │ signed upload URL       │  Storage     │
└──────────────────┘                                 └───────────────────────▶ │  (videos)    │
          │                          PUT video file directly                    │              │
          └───────────────────────────────────────────────────────────────────▶└──────────────┘
```

- **Frontend** (`frontend/`): a single-page app (SPA). Vercel serves one `index.html` plus JS bundles; after that, all page changes happen in the browser via React Router. It never touches the database; it only calls the API.
- **Backend** (`backend/`): a JSON API. No HTML pages (except the Django admin and Swagger docs). Every request is authenticated with a JWT.
- **Database**: Postgres on Supabase in production, a local SQLite file in development.
- **File storage**: Supabase Storage holds the video files. Postgres only stores their URLs.

**The one-sentence version of a request:** the React page calls `api.get('/api/gyms/1/')` → axios attaches the JWT → Django matches the URL to a view → the view checks permissions, asks the ORM for data → a serializer turns model objects into JSON → React puts the JSON into state and re-renders.

---

## 2. Repo layout

```
Climbing-Project/
├── backend/
│   ├── manage.py                  Django's CLI entry (runserver, migrate, test, makemigrations...)
│   ├── requirements.txt           Python deps for production (includes psycopg2 + gunicorn)
│   ├── requirements-local.txt     Same minus Postgres driver/gunicorn
│   ├── Procfile                   "web: gunicorn backend.wsgi:application" (how to start the server)
│   ├── runtime.txt                Python version hint (legacy, see quirks)
│   ├── .env.example               Template for local env vars
│   ├── backend/                   The Django *project* (global config)
│   │   ├── settings.py            All configuration
│   │   ├── urls.py                Root URL table (auth tokens, docs, then includes the app)
│   │   ├── wsgi.py / asgi.py      Entry points a web server uses to call Django
│   ├── climbingAPI/               The Django *app* (all the actual features)
│   │   ├── models.py              Database tables as Python classes
│   │   ├── migrations/            Auto-generated DB schema change scripts
│   │   ├── serializers/           Model ⇄ JSON conversion, split by feature
│   │   ├── views/                 Endpoint logic, split by feature
│   │   ├── urls.py                Every /api/... route
│   │   ├── permissions.py         Custom permission classes
│   │   ├── exceptions.py          Custom HTTP error types (400, 503)
│   │   ├── oauth.py               Google sign-in helpers
│   │   ├── storage.py             Supabase Storage helpers (video uploads)
│   │   └── admin.py               Django admin registrations (currently empty)
│   └── tests/                     Django test suite
├── frontend/
│   ├── index.html                 The single HTML page; loads src/main.jsx
│   ├── package.json               JS deps + npm scripts
│   ├── vite.config.js             Build tool config (React, Tailwind, PWA, dev proxy)
│   ├── vitest.config.js           Test runner config
│   ├── vercel.json                SPA rewrite rule for Vercel
│   ├── public/                    Static files served as-is (images, icons)
│   ├── tests/                     Vitest unit tests
│   └── src/
│       ├── main.jsx               Mounts React, wraps app in providers
│       ├── App.jsx                Route table + route guards
│       ├── api.js                 Axios instance + JWT interceptor
│       ├── auth.js                Reads claims from the stored JWT
│       ├── constants.js           localStorage key names
│       ├── pages/                 One component per screen
│       ├── components/            Reusable pieces (ui/, magicui/, feature folders)
│       ├── lib/                   Small helpers (cn, hold colours, video upload)
│       ├── utils/rankUtils.jsx    Rank tiers + pixel-art rank icons
│       └── styles/style.css       Tailwind import + design tokens
├── .github/workflows/tests.yml    CI: run tests, then trigger deploys
├── ARCHITECTURE.md / PROJECT_GUIDE.md / DEPLOYMENT.md   Older docs
└── docs/diagrams/*.mmd            Mermaid diagrams
```

---

## 3. Backend part 1: Django

### 3.1 Project vs app

Django splits code into a **project** (`backend/backend/`: global settings and the root URL table) and one or more **apps** (`backend/climbingAPI/`: a self-contained feature package with its own models, views and URLs). This project has a single app. The app is registered in `INSTALLED_APPS` so Django discovers its models and migrations.

### 3.2 How a request flows through Django

```
gunicorn (WSGI server)
  → backend/wsgi.py  (creates the Django "application" object)
  → MIDDLEWARE, top to bottom (security, static files, CORS, sessions, CSRF, auth...)
  → ROOT_URLCONF = backend/urls.py  → include("climbingAPI.urls")
  → matched view (a DRF class)
       → authentication (JWT)  → permissions  → your get_queryset / perform_create / etc.
       → serializer validates input / renders output
  → Response travels back UP through the middleware (bottom to top)
  → JSON to the browser
```

**WSGI** is the standard interface between a Python web server and a Python web app. In production **gunicorn** is the server; locally `manage.py runserver` uses Django's own dev server.

### 3.3 `settings.py`, setting by setting

| Setting | What it does here |
|---|---|
| `load_dotenv()` | Reads `backend/.env` into environment variables (local only; Render injects env vars directly) |
| `AUTH_USER_MODEL = 'climbingAPI.User'` | Tells Django to use the custom `User` model instead of the built-in one. Must be set before the first migration |
| `SECRET_KEY` | Used to sign things (including JWTs). From env, never hardcoded |
| `DEBUG` | `True` locally (default), `False` in prod. When True, errors show full stack traces |
| `ALLOWED_HOSTS` | Which `Host` headers Django will answer to. Stops host-header attacks |
| `GOOGLE_CLIENT_ID` | Google OAuth app id |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_VIDEO_BUCKET` | Video storage config. If unset, uploads are disabled (503) |
| `REST_FRAMEWORK` | Global DRF config: JWT authentication for all views, drf-spectacular as the schema generator |
| `SPECTACULAR_SETTINGS` | Title/description for the auto-generated API docs; keeps the Swagger auth token across reloads |
| `SIMPLE_JWT` | Access token = 60 min, refresh token = 1 day, and a custom serializer that adds `username` + `is_setter` to the token |
| `INSTALLED_APPS` | Django built-ins + `rest_framework`, `drf_spectacular`, `corsheaders`, `climbingAPI`, `token_blacklist` |
| `MIDDLEWARE` | See below |
| `DATABASES` | If `DATABASE_URL` env var exists → Postgres via `dj_database_url` (with `conn_max_age=600`, `conn_health_checks=True`, `ssl_require=True`). Otherwise → SQLite file `db.sqlite3` |
| `AUTH_PASSWORD_VALIDATORS` | Rules for password strength (min length, not too common, not all numeric, not similar to username) |
| `STATIC_ROOT` / `STATICFILES_STORAGE` | Where `collectstatic` copies files (admin CSS, Swagger assets) and WhiteNoise's compressed, hashed storage |
| `CORS_ALLOWED_ORIGINS` / `CORS_ALLOW_CREDENTIALS` | Which frontend origins may call the API from a browser |

### 3.4 Middleware (in order)

Middleware are layers every request and response pass through. Order matters.

1. **`SecurityMiddleware`**: security headers.
2. **`WhiteNoiseMiddleware`**: serves static files (admin/Swagger CSS/JS) straight from Django in production, so no separate file server (like Nginx) is needed.
3. **`CorsMiddleware`** (django-cors-headers): adds `Access-Control-Allow-Origin` headers. Browsers block JS from calling a different domain unless the server sends these. The frontend (vercel.app) and API (onrender.com) are different domains, so this is essential. It's placed early so even error responses get the headers.
4. **`SessionMiddleware`, `AuthenticationMiddleware`, `MessageMiddleware`**: used by the Django admin (cookie sessions). The API itself uses JWT, not sessions.
5. **`CsrfViewMiddleware`**: CSRF protection for cookie-based auth (the admin). JWT requests aren't affected because DRF's JWT auth doesn't use cookies.
6. **`CommonMiddleware`**: small conveniences like trailing-slash handling.
7. **`XFrameOptionsMiddleware`**: stops the site being embedded in iframes (clickjacking).

### 3.5 URL routing

- `backend/urls.py` is the root. It defines `admin/`, the JWT endpoints (`api/token/`, `api/token/refresh/`, `api/token/blacklist/`), the docs (`api/schema/`, `api/docs/`, `api/redoc/`), then `path("api/", include("climbingAPI.urls"))` hands everything else to the app.
- `path('gyms/<int:gym_id>/walls/', ...)`: `<int:gym_id>` is a **path converter**. It only matches integers and passes `gym_id` to the view as a keyword argument, which views read as `self.kwargs['gym_id']`.
- `name='...'` on each path lets code/tests reverse-look-up URLs by name.
- **Order matters**: Django tries patterns top to bottom. `gyms/my-gyms/` is listed before `gyms/<int:pk>/` (the comment in `urls.py` explains why), and `videos/upload-url/` is a literal path so it doesn't clash with `videos/<int:pk>/`.
- Climb sub-resources share a prefix string: `CLIMB = 'gyms/<int:gym_id>/walls/<int:wall_id>/climbs/<int:climb_id>'`, then `f'{CLIMB}/votes/'` etc.

### 3.6 `manage.py` commands you'll use

| Command | Purpose |
|---|---|
| `python manage.py runserver` | Dev server on http://127.0.0.1:8000 |
| `python manage.py makemigrations` | Compare models.py to the last migration, write a new migration file |
| `python manage.py migrate` | Apply pending migrations to the database |
| `python manage.py test tests` | Run the test suite |
| `python manage.py createsuperuser` | Make an admin login for `/admin/` |
| `python manage.py collectstatic` | Copy static files to `STATIC_ROOT` (done in the Render build) |
| `python manage.py shell` | Python REPL with Django loaded (handy for poking the ORM) |

### 3.7 Migrations

A migration is a Python file describing a schema change (add table, add column, alter field). They live in `climbingAPI/migrations/` and are applied in order. Workflow: edit `models.py` → `makemigrations` → commit the new file → `migrate` runs locally, and on Render during the build command. Existing ones:

| # | Change |
|---|---|
| 0001 | Initial tables |
| 0002 | Competition system (Competition, CompRound, CompClimb, Division, CompSend, ...) |
| 0003/0004 | Added `google_id` + `apple_id`, then removed `apple_id` |
| 0005 | Gym `lat`/`lng` |
| 0006 | User `bio` |
| 0007 | `Follow` model |
| 0008 | Wall description made optional (`blank=True, default=''`) |

---

## 4. Backend part 2: Django REST Framework (DRF)

Django on its own renders HTML. **DRF** adds everything needed for a JSON API: views that speak JSON, serializers, authentication, permissions, and consistent error responses.

### 4.1 Views: the class hierarchy

Every endpoint is a class. The more specific the parent class, the less code you write.

| Class | What you get | Used for |
|---|---|---|
| `APIView` | Just method handlers (`def post(self, request, ...)`) plus DRF auth/permissions | Custom actions that aren't plain CRUD: `FollowView`, `ArchiveWallClimbsView`, `VideoUploadURLView` |
| `GenericAPIView` | `APIView` + `get_serializer()`, `get_queryset()` helpers | `GoogleLoginView`, `ChangePasswordView` |
| `ListAPIView` | GET → list | Leaderboards, `MyGymsView`, `UserSendsView`, feed |
| `CreateAPIView` | POST → create | `RegisterView`, `CompRegisterView`, `CompSendCreateView` |
| `ListCreateAPIView` | GET list + POST create | Most collections: gyms, walls, climbs, votes, sends, reviews, videos, comps... |
| `RetrieveUpdateAPIView` | GET one + PUT/PATCH | `UserDetailView` |
| `RetrieveUpdateDestroyAPIView` | GET one + PUT/PATCH + DELETE | `GymDetailView`, `ClimbDetailView`, `SendDetailView`... |
| `DestroyAPIView` | DELETE only | `CompClimbDetailView` |

**Hooks you override on generic views (all used in this codebase):**

| Hook / attribute | Purpose here |
|---|---|
| `serializer_class` | Which serializer reads/writes the data |
| `permission_classes` | List of permission checks, all of which must pass |
| `queryset` or `get_queryset()` | Which rows this endpoint can see. Used to scope by URL (`climb_id=self.kwargs['climb_id']`) **and** to enforce ownership (see 4.4) |
| `perform_create(serializer)` | Called after validation on POST. Used to inject server-side values the client must not control: `serializer.save(user=self.request.user, climb=climb)` |
| `perform_update` / `perform_destroy` | Run side effects. Grade votes recalculate the climb's community grade here |
| `get_serializer_context()` | Pass extra data to the serializer (qualifier leaderboard passes the competition) |
| `lookup_url_kwarg` | Name of the URL kwarg for the object id when it isn't `pk` (`user_id`, `comp_id`) |
| `http_method_names` | Restrict allowed methods (`UserDetailView` disables PUT/DELETE) |

**`CompetitionChildMixin`** (in `views/competitions.py`) is a small mixin for views nested under `/competitions/<comp_id>/`. `get_competition()` loads the competition once per request (cached on `self._competition`) and 404s if it doesn't exist.

### 4.2 Serializers

A serializer converts model instances → JSON (output) and validates JSON → Python data (input).

**`ModelSerializer`** builds fields automatically from a model:

```python
class WallSerializer(serializers.ModelSerializer):
    class Meta:
        model = Wall
        fields = ['id', 'name', 'gym', 'description']
        read_only_fields = ['gym']   # in the output, but ignored if the client sends it
```

Tools used across the serializers:

| Tool | Example | Meaning |
|---|---|---|
| `Meta.fields` | `['id', 'name', ...]` | Which fields appear in JSON |
| `Meta.read_only_fields` | `['user', 'climb']` | Output only. The view sets them in `perform_create`, so clients can't spoof who/what |
| `extra_kwargs` | `{'password': {'write_only': True}}` | Password is accepted on register but never returned |
| `source=` | `CharField(source='wall.name', read_only=True)` | Pull a value from a related object (dotted path). Used for "denormalised" fields like `wall_name`, `added_by_username`. Can also call methods: `source='followers.count'` |
| `SerializerMethodField` | `is_registered`, `is_following`, `wall_count` | Computed by a `get_<name>(self, obj)` method. Return type hints (`-> bool`) tell the docs generator the type |
| Nested serializer | `divisions = DivisionSerializer(many=True, read_only=True)` | Embed related objects in one response |
| Mixin of declared fields | `ClimbContextFields` | A plain `Serializer` holding `climb_id, climb_name, wall_id, wall_name, gym_id, gym_name`. Mixed into Send/Review/Video/Feed serializers so they all link back to the climb page |
| `validate_<field>()` | `validate_video_url`, `validate_current_password` | Per-field validation. Raise `ValidationError` → 400 with `{field: [message]}` |
| Overriding `create()` | Send, GradeVote, CompSend, CompRegistration, FinalsResult | Turn POST into an upsert with `update_or_create` / `get_or_create` |
| Overriding `save()` | `ChangePasswordSerializer` | Custom write (hash + save new password) |
| `Meta.validators = []` | `FinalsResultSerializer` | Disables DRF's auto-added unique-together check so `create()` can upsert instead of 400-ing on the second POST |
| Plain `Serializer` | `TokenPairSerializer`, `VideoUploadRequestSerializer`, leaderboard entries | Not tied to a model: describes request/response shapes for non-model data |
| `ChoiceField`, `IntegerField(min_value, max_value)` | `VideoUploadRequestSerializer` | Built-in input validation |
| `context['request']` | `get_is_registered` | Generic views pass the request in automatically, so serializers can know "who is asking" |

**Validation flow:** `serializer = X(data=request.data)` → `serializer.is_valid(raise_exception=True)` (400 if invalid) → `serializer.validated_data` / `serializer.save()`. Generic views do this for you; `APIView`s do it by hand.

### 4.3 Authentication: djangorestframework-simplejwt

**JWT (JSON Web Token)** = a signed string with three base64 parts: header, payload (claims like `user_id`, `exp`), signature. The server signs it with `SECRET_KEY`; anyone can *read* the payload, but nobody can *change* it without breaking the signature. So the server can trust it without looking anything up.

- **Two tokens**: a short-lived **access** token (60 min) sent on every request, and a longer **refresh** token (1 day) used only to get new access tokens.
- `JWTAuthentication` (set globally in `REST_FRAMEWORK`) reads `Authorization: Bearer <access>`, verifies it, and sets `request.user`. Invalid/expired token → 401, *even on public endpoints* (that's why `api.js` skips the header on auth routes).
- **Built-in views** in `backend/urls.py`:
  - `TokenObtainPairView` at `/api/token/`: username + password → `{access, refresh}`
  - `TokenRefreshView` at `/api/token/refresh/`: refresh → new access
  - `TokenBlacklistView` at `/api/token/blacklist/`: puts a refresh token on a deny-list (logout). Needs the `token_blacklist` app installed (it adds DB tables)
- **Custom claims**: `CustomTokenObtainPairSerializer.get_token()` adds `username` and `is_setter` to the payload. Wired in via `SIMPLE_JWT['TOKEN_OBTAIN_SERIALIZER']`. The frontend decodes these to show/hide setter UI without an extra API call.
- `oauth.issue_tokens(user)` uses the same serializer so Google logins get identical tokens.

### 4.4 Permissions

DRF runs `permission_classes` after authentication. Each class can implement:
- `has_permission(request, view)`: checked on **every** request
- `has_object_permission(request, view, obj)`: checked only when a view fetches a single object (`get_object()`)

`SAFE_METHODS` = `('GET', 'HEAD', 'OPTIONS')`, the read-only methods.

**Built-in classes used:**
| Class | Rule |
|---|---|
| `AllowAny` | Anyone (register, Google login) |
| `IsAuthenticated` | Must be logged in |
| `IsAuthenticatedOrReadOnly` | Anyone can read; must be logged in to write (votes, sends, reviews, videos lists) |

**Custom classes (`permissions.py`):**
| Class | Rule | Used on |
|---|---|---|
| `IsSetterOrReadOnly` | Reads open to all; writes require `user.is_verified_setter` | Gym list/create, walls, climbs, archive, comps, divisions, rounds, comp climbs, finals results |
| `IsSelfOrReadOnly` | Object-level: anyone can read; only that user can edit | `UserDetailView` (edit your own bio) |

**Ownership via queryset filtering (the main pattern in this codebase):** instead of a permission class, the view narrows `get_queryset()` on write methods:

```python
def get_queryset(self):
    if self.request.method in SAFE_METHODS:
        return Climb.objects.all()
    return Climb.objects.filter(added_by=self.request.user)
```

If someone tries to edit a climb they didn't create, the object simply isn't in the queryset → **404**, not 403. They can't even confirm it exists. Used for gym edit/delete, climb edit/delete, competition edit/delete, and every "my own vote/send/review/video" detail view.

### 4.5 Errors

DRF converts exceptions into JSON responses automatically:

| Raised | Response |
|---|---|
| `serializers.ValidationError` (incl. failed `is_valid`) | 400 `{"field": ["msg"]}` |
| `BadRequest` (custom, `exceptions.py`) | 400 `{"detail": "msg"}`, used for business rules ("Competition is not currently open") |
| `PermissionDenied` | 403 `{"detail": ...}` |
| `get_object_or_404` / `Http404` | 404 |
| `StorageUnavailable` (custom) | 503: Supabase Storage not configured / down |
| Missing/invalid token | 401 |

Frontend code reads `err.response?.data?.detail` (or the first field error) to show messages.

### 4.6 API docs: drf-spectacular

Generates an **OpenAPI 3** schema by inspecting views and serializers. Served at `/api/schema/` (raw), `/api/docs/` (Swagger UI, interactive with an "Authorize" button for your JWT), `/api/redoc/`. `@extend_schema(request=..., responses=...)` fills in details for `APIView` methods where it can't infer them. `tests/test_api_docs.py` ensures the schema generates without errors.

---

## 5. Backend part 3: the models (data layer)

All in `climbingAPI/models.py`. Each class = a table; each attribute = a column.

### 5.1 Field types and options used

| Thing | Meaning |
|---|---|
| `CharField(max_length=...)` / `TextField` | Short string (VARCHAR) / unlimited text |
| `IntegerField`, `FloatField`, `BooleanField`, `DateTimeField`, `URLField` | As named. `URLField` validates format only |
| `null=True` | DB column can be NULL |
| `blank=True` | Validation (forms/serializers) allows empty. **Different from `null`**: the wall description bug was a CharField without `blank=True` |
| `default=` | Value when not provided |
| `auto_now_add=True` | Set to now on creation, then never changes (`set_at`, `sent_at`, `created_at`) |
| `unique=True` | DB constraint (`google_id`) |
| `ForeignKey(Model, on_delete=..., related_name=...)` | Many-to-one link. `related_name` is the reverse accessor (`gym.walls.all()`) |
| `OneToOneField` | One-to-one link (`Competition.linked_qualifier`) |
| `on_delete=CASCADE` | Delete children with the parent (gym → walls → climbs → sends...) |
| `on_delete=SET_NULL` | Keep the row, null the link (deleting a setter doesn't delete their gyms/climbs) |
| `Meta.unique_together` | Multi-column uniqueness (one vote per user per climb, etc.) |
| `Meta.ordering` | Default sort (`CompRound` by `order`) |
| `@property` | Computed attribute, not a column (`Competition.status`) |
| Model method | `Climb.recalculate_community_grade()` |
| Custom QuerySet | `GymQuerySet.with_counts()` exposed via `objects = GymQuerySet.as_manager()` |

### 5.2 Core domain

```
User ─┬─< Gym (added_by)          Gym ──< Wall ──< Climb ─┬─< GradeVote >── User
      ├─< Climb (added_by)                                ├─< Send       >── User
      ├─< Follow (follower / following) >─ User           ├─< Review     >── User
                                                          └─< Video      >── User
```
(`──<` = one-to-many)

| Model | Key fields | Notes |
|---|---|---|
| **User** (extends `AbstractUser`) | `username`, `password` (hashed), `email`, `is_verified_setter`, `google_id`, `bio`, `is_staff`, `date_joined` | `AbstractUser` gives all the standard auth fields; extending it (instead of a separate Profile model) keeps everything in one table |
| **Gym** | `name`, `location`, `is_active`, `lat`, `lng`, `added_by` | `lat`/`lng` nullable; only gyms with both appear on the map |
| **Wall** | `name`, `description` (optional), `gym` | |
| **Climb** | `name`, `colour` (a name like "Green"), `image_url`, `suggested_grade` (V-grade int), `community_grade` (float, cached average), `is_archived`, `set_at`, `wall`, `added_by` | Soft delete: archiving hides it from active lists but keeps history |
| **GradeVote** | `grade`, `climb`, `user` | unique (climb, user) |
| **Send** | `attempts`, `sent_at`, `climb`, `user` | unique (climb, user): you can edit attempts, not send twice |
| **Review** | `comment`, `stars`, `attempts`, `climb`, `user` | Not unique: multiple reviews allowed |
| **Video** | `video_url`, `uploaded_at`, `climb`, `user` | URL must point into the Supabase bucket |
| **Follow** | `follower`, `following`, `created_at` | unique pair. `user.following` = people I follow; `user.followers` = people following me |

### 5.3 Competition domain

Covered in detail in [section 12](#12-feature-competitions).

---

## 6. Backend part 4: ORM query tools used

The ORM (Object-Relational Mapper) turns Python method chains into SQL. Querysets are **lazy**: nothing hits the DB until you iterate, slice, or serialize.

| Tool | Example in the code | What it does |
|---|---|---|
| `.filter()` / `.get()` | `Climb.objects.filter(wall_id=..., is_archived=False)` | WHERE clause |
| `__` traversal | `filter(walls__climbs__sends__user=user)` | Follow relationships, which become JOINs |
| `get_object_or_404` | Everywhere in `perform_create` | `.get()` that raises 404 instead of crashing |
| `.select_related()` | `select_related('climb__wall__gym')` | JOIN forward FKs into the same query, preventing **N+1 queries** (one extra query per row when the serializer reads `send.climb.wall.gym.name`) |
| `.prefetch_related()` | `prefetch_related('divisions', 'rounds')` | For reverse/many relations: one extra query per relation, joined in Python. Avoids row multiplication |
| `.annotate()` | `with_counts()`, leaderboards, feed | Add computed columns to each row |
| `.aggregate()` | `grade_votes.aggregate(Avg('grade'))` | Collapse to a single value |
| `Count`, `Sum`, `Avg`, `Max` | Counts, points, averages, latest send | SQL aggregates. `Count(..., distinct=True)` avoids double counting when JOINs multiply rows |
| `Q` objects | `Count('walls__climbs', filter=Q(walls__climbs__is_archived=False))` | Reusable/combinable conditions; also used as aggregate filters |
| `F` expressions | `F('points').desc()`, `F('sent_at')` | Refer to a column (or annotation) inside the query |
| `Value` | `annotate(feed_type=Value('send'))` | A constant column |
| `Case` / `When` | Gym leaderboard points per grade bracket | SQL CASE expression |
| `Coalesce` | Finals: treat missing attempts as 1, missing sums as 0 | First non-NULL value |
| `Window(RowNumber(), order_by=...)` | `ranked()` helper | SQL window function: rank numbers computed in the DB |
| `.order_by()` / `.distinct()` | `MyGymsView` | Sorting / dedupe |
| `.update()` | `ArchiveWallClimbsView` | One bulk UPDATE, no per-row save |
| `update_or_create` / `get_or_create` | Sends, votes, comp sends, registrations, finals results, follows | Upserts: makes POST idempotent |
| `.exists()` | `is_following`, registration checks | Cheap "is there at least one row" |
| `.values('following')` used as a subquery | Feed: `user__in=following` | Nested SELECT instead of loading ids into Python |
| Slicing `[:50]` | Feed | LIMIT |

---

## 7. Feature: auth, users, follows and the feed

### 7.1 Registration
- **Frontend**: `/register` → `Register.jsx` → `LoginRegisterForm` with `method="register"`. A segmented control picks Climber vs Setter. Posts `{username, password, is_verified_setter}` to `/api/user/register/`, then navigates to `/login` (no auto-login).
- **Backend**: `RegisterView` (`CreateAPIView`, `AllowAny`) + `UserRegistrationSerializer`, whose `create()` calls `User.objects.create_user()` so the password is **hashed**. `password` is `write_only`.

### 7.2 Username/password login
1. `LoginRegisterForm` posts to `/api/token/` (simplejwt).
2. Response `{access, refresh}` → saved to `localStorage` (`ACCESS_TOKEN = "access"`, `REFRESH_TOKEN = "refresh"` from `constants.js`).
3. Navigates to `location.state.from` (the page you were bounced from) or `/`.

### 7.3 Google sign-in
1. `@react-oauth/google`'s `useGoogleLogin` opens Google's popup and returns a Google **access token**. The `GoogleOAuthProvider` in `main.jsx` supplies `VITE_GOOGLE_CLIENT_ID`.
2. Frontend posts it to `/api/auth/google/`.
3. `GoogleLoginView` → `oauth.fetch_google_profile()` calls Google's userinfo endpoint with that token (this is how the backend verifies it's real) → gets `sub` (Google's permanent user id) and email.
4. `get_or_create_oauth_user()`:
   - existing user with that `google_id` → log in;
   - else existing user with that email → link `google_id` to it, **unless they're a setter** (403: setters must use a password);
   - else create a new climber with a username derived from the email and `set_unusable_password()`.
5. `issue_tokens()` returns the same JWT pair as normal login.

### 7.4 Staying logged in / logging out
- `ProtectedRoute` checks the stored access token's `exp`. If expired, it calls `/api/token/refresh/` and stores the new access token; if that fails → redirect to `/login`.
- Logout (in `PageShell`'s `NavBar`): POST the refresh token to `/api/token/blacklist/`, clear both tokens, go to `/login`.

### 7.5 Profiles
- `/profile` (yourself) or `/profile/:userId` (someone else): same `Profile.jsx`. Falls back to the JWT's `user_id` when no param.
- Loads 4 endpoints in parallel with `Promise.all`: `users/:id/`, `users/:id/sends/`, `users/:id/reviews/`, `users/:id/videos/`.
- `UserProfileSerializer` returns `follower_count`, `following_count` (`source='followers.count'`) and `is_following` (relative to the viewer).
- Edit bio → `PATCH /api/users/:id/` (`IsSelfOrReadOnly`).
- Change password → `POST /api/users/change-password/`. `ChangePasswordSerializer.validate_current_password` checks the old one; `save()` calls `set_password` (hashes).
- Rank badge, total points, average grade and "home gym" are all **computed in the browser** from the sends list (`rankUtils.calculatePoints`).

### 7.6 Follows
- `FollowView` (`APIView`): `POST /api/users/:id/follow/` → `get_or_create` (can't follow yourself → 400), `DELETE` → unfollow (204).
- `Follow` model with `unique_together`.

### 7.7 Activity feed (`/feed`)
`ActivityFeedView` merges two different models into one list:
1. Subquery: ids of people I follow.
2. Newest 50 sends and newest 50 reviews from those users, each annotated with `feed_type` ('send'/'review') and `timestamp`.
3. `itertools.chain` + `sorted(..., key=attrgetter('timestamp'))`, take 50.
4. `ActivityFeedItemSerializer` (a plain Serializer + `ClimbContextFields`) gives one shape; `comment`/`stars` use `required=False` so they're skipped for sends.

Frontend `Feed.jsx` renders each item with a "time ago" label and a link to the climb.

---

## 8. Feature: gyms, walls and climbs

### 8.1 Endpoints

| Method + path | View | Who |
|---|---|---|
| `GET/POST /api/gyms/` | `GymListCreateView` | Anyone reads (even logged out); setters create |
| `GET/PATCH/DELETE /api/gyms/:id/` | `GymDetailView` | Logged-in reads; only the gym's creator writes |
| `GET /api/gyms/my-gyms/` | `MyGymsView` | Gyms where *you* have sends, most recent first |
| `GET/POST /api/gyms/:id/walls/` | `WallListCreateView` | Setters create |
| `POST /api/gyms/:id/walls/:wid/archive-climbs/` | `ArchiveWallClimbsView` | Setters: archive every active climb on a wall |
| `GET/POST .../walls/:wid/climbs/` | `ClimbListCreateView` | Active climbs; setters create (`added_by` + `wall` injected) |
| `GET .../climbs/archived/` | `ClimbArchivedListView` | Archived climbs, newest set first |
| `GET/PATCH/DELETE .../climbs/:id/` | `ClimbDetailView` | Only the climb's creator writes |
| `GET /api/gyms/:id/all-climbs/` | `GymClimbsView` | Every active climb in a gym (used when adding climbs to a competition) |

### 8.2 Counts without N+1
`GymSerializer` shows `wall_count` and `climb_count`. `Gym.objects.with_counts()` adds them as annotations in **one query** for the whole list (`Count('walls', distinct=True)`, and `Count('walls__climbs', filter=Q(...is_archived=False), distinct=True)`). The serializer's `get_wall_count` uses the annotation if present, otherwise falls back to a live count (e.g. right after a create).

### 8.3 Frontend
- **Home** (`/`): greeting, bento cards (Feed, plus Create gym for setters or Profile for climbers), `GymList` (your gyms paginated 4 per page, plus a client-side search over all gyms), and `GymMap`.
- **GymMap**: `react-leaflet` map with OpenStreetMap tiles. Asks the browser for geolocation and flies to you. Gyms with `lat`/`lng` get pins (custom `divIcon` HTML markers, because Vite breaks Leaflet's default PNG marker paths). Popup → "View gym".
- **Create gym** (`/create-gym`, setter-only): name, location, optional lat/lng, open toggle, and a local list of walls. On submit: POST gym, then POST each wall **sequentially** (so they're created in order).
- **GymPage** (`/gym/:id`): loads gym + walls, a horizontal wall picker, then that wall's climbs as `ClimbCard`s. Setters see "Add climb", "Archive all" (with confirm), and a link to archived climbs. Buttons to Competitions and Leaderboard.
- **AddClimb** (`/gym/:gymId/wall/:wallId/add-climb`, setter-only): name, hold colour swatches, grade pills, photo URL, optional video (see section 10). Live preview tile in the hold colour.
- **ArchivedClimbs**: list of `ClimbCard`s from the archived endpoint.
- `lib/holds.js`: maps colour names ("Green") to hex values. Climbs store the *name*.

---

## 9. Feature: climb activity (votes, sends, reviews)

All nested under `/api/gyms/:g/walls/:w/climbs/:c/`. `views/climb_activity.py` follows one shape per resource:
- `XListCreateView`: anyone lists, logged-in users add (`IsAuthenticatedOrReadOnly`). `climb` and `user` come from the URL/request, never the body.
- `XDetailView`: queryset filtered to **your own** rows, so you can only edit/delete yours.

### 9.1 Grade votes and community grade
- `POST votes/ {grade}` → `GradeVoteSerializer.create` does `update_or_create`, so re-voting changes your vote.
- After create/update/delete, the view calls `climb.recalculate_community_grade()`: `Avg` of all votes, rounded to 1 decimal, saved to `Climb.community_grade`. This is **cached on the climb** so reading it is free; it's recalculated only on writes.
- Frontend: tap a grade pill on the climb page → POST → refetch votes and the climb.

### 9.2 Sends
- `POST sends/ {attempts}` → upsert (one send per user per climb). Shown as "You sent this in N attempts" with Edit.
- `SendSerializer` includes `climb_is_archived` and `climb_grade` so the frontend can compute points.

### 9.3 Reviews
- `POST reviews/ {comment, stars, attempts}`. Not unique.
- The review modal also has the optional video picker (section 10). Flow: save review → upload video → refresh. If only the video fails, `reviewSaved` state makes the retry skip re-posting the review.

### 9.4 ClimbPage (`/gym/:gymId/wall/:wallId/climb/:climbId`)
Loads climb, votes, reviews, videos, sends in parallel. Shows a hero tile (photo or hold colour), 4 stats with `NumberTicker`, the send card, the vote pills, beta videos, reviews, and two modals (Log send, Write a review).

---

## 10. Feature: videos and Supabase Storage

**Why not store videos in Postgres?** The free DB is 500 MB and binary blobs make it slow. Storage is built for files (1 GB free, 50 MB per file) and serves them over a CDN.

**Why not upload through Django?** Render's gunicorn kills requests after 30 s and every byte would cost Render bandwidth. Instead the browser uploads **directly to Supabase** using a **signed upload URL**.

### Flow (three steps, `frontend/src/lib/videoUpload.js → uploadClimbVideo`)
1. `POST .../climbs/:id/videos/upload-url/ {content_type, size}` → `VideoUploadURLView`:
   - 503 if Supabase env vars are missing (`storage.is_configured()`)
   - `VideoUploadRequestSerializer` validates type (mp4/webm/quicktime) and size (≤ 50 MB)
   - `storage.create_video_upload()` picks a path `climbs/<climb_id>/<uuid>.<ext>` and asks Supabase (`POST /storage/v1/object/upload/sign/<bucket>/<path>`, authenticated with the **service role key**) for a one-time URL
   - returns `{upload_url, video_url}`
2. Browser `PUT`s the file to `upload_url` with a **bare axios call** (not the `api` instance, because the JWT and baseURL don't belong on a Supabase request). `onUploadProgress` drives the progress bar.
3. `POST .../videos/ {video_url}` creates the `Video` row. `VideoSerializer.validate_video_url` rejects any URL not starting with the bucket's public prefix.

If step 2 fails, nothing is written to the DB. The **service role key** bypasses all Supabase security, so it only lives in the backend env (Render + local `.env`).

### Frontend pieces
- `components/VideoPicker.jsx`: a dashed drop box with a hidden `<input type="file">` inside a `<label>`, a preview via `URL.createObjectURL(file)` (`useMemo` + revoked in a `useEffect` cleanup to free memory), a Remove button, and a progress bar. Pure UI: the parent decides when to upload.
- Used on **AddClimb** (setters, after the climb is created) and in the **review modal** (everyone).
- Videos render with `<video src=... controls>` on the climb page and profile.

### Supabase bucket setup
Public bucket `climb-videos`, 50 MB limit, MIME types `video/mp4, video/webm, video/quicktime`. Env vars `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (legacy JWT-style key) on Render.

---

## 11. Feature: gym leaderboard and ranks

### 11.1 Backend (`GymLeaderboardView`)
- Users with sends on **active** climbs in that gym.
- Points per send from `GRADE_POINTS` brackets via `Case/When`: V0–2 = 10, V3–4 = 20, V5–6 = 40, V7–8 = 70, V9–10 = 100, V11+ = 150.
- `Sum` for points, `Count` for sends, then `ranked()` adds `rank` with a `ROW_NUMBER()` window, ordered by points desc, then user id for stable ties.
- Archiving a wall removes those climbs' points: intentional, so the board resets with the gym.

### 11.2 Ranks (`frontend/src/utils/rankUtils.jsx`)
- Tiers by points: Iron 0, Bronze 100, Silver 300, Gold 700, Platinum 1200, Diamond 2000, Emerald 3000, Masters 4500.
- **Magnus**: positional. Top 20 on a gym leaderboard, regardless of points.
- `calculatePoints(sends)` repeats the grade→points mapping **in JS**. It must stay in sync with `GRADE_POINTS` in `views/leaderboards.py`.
- Each rank has a hand-drawn 16×16 pixel-art SVG icon (`shapeRendering="crispEdges"` keeps pixels sharp). `RankBadge` renders icon + name.

### 11.3 Leaderboard page (`/gym/:gymId/leaderboard`)
Podium for the top 3 (laid out 2-1-3), rows with progress bars for the rest, your row highlighted, then a rank tier table and a points-per-grade table.

---

## 12. Feature: competitions

The largest feature. Gym-scoped events in two formats.

### 12.1 Concepts

| Format | How results are produced | Scoring |
|---|---|---|
| **Qualifier** | Climbers **self-report** sends during the event | Sum of each climb's `points_value`; tiebreak fewer total attempts. Top `top_x_advance` get an "Advances" badge |
| **Finals** (IFSC style) | **Judges (setters) enter** results per climber per climb | IFSC boulder rules: most tops → fewest top attempts → most zones → fewest zone attempts |

A finals comp can point to its qualifier via `linked_qualifier`.

### 12.2 Models

```
Gym ──< Competition ─┬─< Division           (e.g. Open, Youth)
                     ├─< CompRound          (e.g. Semi, Final; ordered)
                     ├─< CompClimb >── Climb      (+ points_value, optional comp_round)
                     │       ├─< CompSend      >── User   (qualifier, self-reported)
                     │       └─< FinalsResult  >── User   (finals, judged; recorded_by → User)
                     └─< CompRegistration >── User (+ optional Division)
Competition.linked_qualifier ── OneToOne ── Competition   (reverse name: linked_finals)
```

| Model | Fields | Notes |
|---|---|---|
| `Competition` | `title`, `description`, `rules`, `comp_type` ('qualifier'/'finals' via `choices`), `start_date`, `end_date`, `top_x_advance`, `gym`, `created_by`, `linked_qualifier` | `status` is a **`@property`**: upcoming/open/closed computed from `timezone.now()` each time, so no background job is needed to flip statuses |
| `Division` | `name`, `competition` | Organisational only; doesn't affect scoring |
| `CompRound` | `name`, `order`, `competition` | `Meta.ordering = ['order']` |
| `CompClimb` | `competition`, `climb`, `points_value` (default 100), `comp_round` | Join table between comps and normal climbs. unique (competition, climb) |
| `CompRegistration` | `competition`, `user`, `division`, `registered_at` | unique (competition, user) |
| `CompSend` | `comp_climb`, `user`, `attempts`, `logged_at` | unique (comp_climb, user) |
| `FinalsResult` | `comp_climb`, `user`, `topped`, `top_attempts`, `zoned`, `zone_attempts`, `recorded_by`, `recorded_at` | unique (comp_climb, user); `recorded_by` is an audit trail |

### 12.3 Endpoints

| Method + path | View | Who / rules |
|---|---|---|
| `GET/POST /api/gyms/:g/competitions/` | `CompetitionListCreateView` | Setters create (`gym`, `created_by` injected). Ordered newest start first; prefetches divisions/rounds |
| `GET/PATCH/DELETE /api/competitions/:c/` | `CompetitionDetailView` | Only the creator can write |
| `GET/POST .../divisions/` | `DivisionListCreateView` | Setters create |
| `GET/POST .../rounds/` | `CompRoundListCreateView` | Setters create |
| `GET/POST .../climbs/` | `CompClimbListCreateView` | Setters add a gym climb with a points value |
| `DELETE .../climbs/:id/` | `CompClimbDetailView` | Setters remove |
| `GET .../registrations/` | `CompRegistrationListView` | Logged-in |
| `POST .../register/` | `CompRegisterView` | Any user. 400 if comp is **closed** (upcoming is OK). `get_or_create` so repeat clicks are harmless |
| `GET .../sends/` | `CompSendListView` | **Only your own** sends, so you can't see rivals' progress mid-event |
| `POST .../log-send/` | `CompSendCreateView` | Guard rails: comp must be **open** (400), you must be **registered** (403), the climb must belong to **this** comp (400). Upsert on attempts |
| `GET/POST .../finals-results/` | `FinalsResultListCreateView` | Anyone reads, setters write. Climb must belong to this comp. Upsert (`validators = []` + `update_or_create`) so judges can correct results |
| `GET .../leaderboard/` | `QualifierLeaderboardView` | See below |
| `GET .../finals-leaderboard/` | `FinalsLeaderboardView` | See below |

### 12.4 `CompetitionSerializer` extras
- `status`: read-only `ChoiceField` reading the property.
- `divisions`, `rounds`: nested read-only serializers (written via their own endpoints).
- `registration_count` (`source='registrations.count'`), `is_registered` (per viewer), `has_linked_finals` (uses `hasattr(obj, 'linked_finals')` because a missing reverse one-to-one raises instead of returning None).

### 12.5 Qualifier leaderboard (SQL)
```python
User.objects
  .filter(comp_sends__comp_climb__competition=comp)          # only this comp's sends
  .annotate(points=Sum('comp_sends__comp_climb__points_value'),
            climbs_completed=Count('comp_sends'),
            total_attempts=Sum('comp_sends__attempts'))
→ ranked(users, F('points').desc(), F('total_attempts').asc())
```
Filtering on the relation **before** annotating restricts the sums to that competition. `QualifierLeaderboardEntrySerializer.get_advances` uses the competition from serializer context: `rank <= top_x_advance`.

### 12.6 Finals leaderboard (SQL)
```python
tops          = Count('finals_results', filter=Q(topped=True))
top_attempts  = Coalesce(Sum(Coalesce('top_attempts', 1), filter=topped), 0)
zones         = Count(..., filter=Q(zoned=True))
zone_attempts = Coalesce(Sum(Coalesce('zone_attempts', 1), filter=zoned), 0)
ordering: tops desc, top_attempts asc, zones desc, zone_attempts asc, id asc
```
The inner `Coalesce(..., 1)`: a top with no attempt count recorded counts as 1 attempt. The outer one turns "no rows → NULL" into 0.

### 12.7 Frontend
- **CompetitionList** (`/gym/:gymId/competitions`): groups comps into Live now / Upcoming / Past using `status`. Setters get "Create competition".
- **CreateCompetition** (setter-only): `Segmented` control for format; title, description, rules, start/end (`datetime-local` → `toISOString()`); qualifier → "Top X advance", finals → "Linked qualifier ID"; `ListBuilder` for divisions and rounds. Submit = POST the comp, then POST all divisions and rounds **in parallel** (`Promise.all`), with rounds getting `order: i + 1`.
- **CompetitionPage** (`/gym/:gymId/competitions/:compId`): fetches comp, climbs + my sends, and registrations. Three tabs via the `Tabs` primitive:
  - **Info**: stats, "Top X advance" banner, about/rules/divisions/rounds, Register button (or "You're registered" / "ended"). Setters get a **QR code** modal (`qrcode.react` `QRCodeSVG`) of the comp URL, with "Save SVG" (serialises the `<svg>` with `XMLSerializer` into a Blob download) and "Copy link" (`navigator.clipboard`).
  - **Climbs**: list of comp climbs with points. Registered climbers in an open comp get "Log send" (modal for attempts); already-sent shows a ✓ chip. Setters get "Add climb" (search modal over `/all-climbs/`, excluding ones already in the comp, then set points) and ✕ to remove.
  - **Leaderboard / Results**:
    - Qualifier → `QualifierLeaderboard`: **polls every 30 s** (`setInterval` in `useEffect`, cleared on unmount) so it's live during an event; progress bars relative to the leader, "You" and "Advances" chips.
    - Finals → `FinalsTab`: results table (tops/zones with attempts), also polling every 30 s. Setters get the **judging panel**: pick a climb → one row per registered climber with Topped/Zoned toggles and attempt fields → Save POSTs that climber's result (upsert) and refreshes. Shows "N/M judged" per climb.

---

## 13. Frontend part 1: build tooling and entry point

### 13.1 Vite
**Vite** is the dev server and bundler.
- `npm run dev` → dev server on http://localhost:5173 with hot module replacement (edits show instantly).
- `npm run build` → optimised static files in `frontend/dist/` (what Vercel serves).
- `vite.config.js` plugins:
  - `@vitejs/plugin-react`: JSX + Fast Refresh
  - `@tailwindcss/vite`: Tailwind v4 compilation
  - `VitePWA`: service worker + manifest (section 18)
- **Dev proxy**: `server.proxy['/api'] → http://localhost:8000`. Locally `VITE_API_URL` is unset, so axios requests go to `/api/...` on the Vite server, which forwards them to Django. No CORS issues in dev.

### 13.2 Env vars on the frontend
Vite only exposes variables prefixed with `VITE_`, via `import.meta.env.VITE_X`. They're **baked into the JS at build time** (public, never secret).
- `VITE_API_URL`: the Render API URL in production (`.env.production` / Vercel dashboard)
- `VITE_GOOGLE_CLIENT_ID`: Google OAuth client id

### 13.3 Boot sequence
`index.html` (has `<div id="root">` and loads Inter from Google Fonts) → `src/main.jsx`:
```jsx
ReactDOM.createRoot(root).render(
  <React.StrictMode>                      // dev-only double-invocation to surface bugs
    <GoogleOAuthProvider clientId=...>    // context for useGoogleLogin
      <App />                             // router + routes
      <Toaster />                         // react-hot-toast container
```

---

## 14. Frontend part 2: React tools used

| Tool | Where / why |
|---|---|
| **Function components + JSX** | Every file in `pages/` and `components/` |
| **Props** | Data passed into components (`<ClimbCard climb={c} gymId={id} />`) |
| `useState` | All local state: form fields, loaded data, `loading`, `error`, modal open flags |
| `useEffect` | Fetch data on mount / when URL params change (`[gymId]` dependency array); set up and clear intervals (comp polling); geolocation in `GymMap` |
| `useCallback` | Memoised fetch functions in `CompetitionPage`/`FinalsTab` so they can be effect dependencies without re-running every render |
| `useMemo` | `VideoPicker` creates the preview object URL only when the file changes |
| `useRef` | Grab the QR `<svg>` DOM node for download; Magic UI animations |
| **Conditional rendering** | `{canEdit && <Btn/>}`, ternaries for loading/error/empty states |
| **Lists + `key`** | `climbs.map(c => <ClimbCard key={c.id} .../>)`: keys let React track items |
| **Lifting state up** | `VideoPicker` gets `file`/`onChange` from its parent; `CreateGymForm` holds the walls list that `AddWallForm` adds to |
| **Portals** (`createPortal`) | `Modal` renders into `<body>` so `position: fixed` works (BlurFade's transform would otherwise break it) |
| **Loading pattern** | Each page: `loading` → `<PageSkeleton/>`, `error` → `<ErrorScreen/>`, else content |
| `Promise.all` | Parallel API calls on almost every page |

---

## 15. Frontend part 3: routing

**react-router-dom v7**, set up in `App.jsx`.

| Tool | Use |
|---|---|
| `BrowserRouter` | Uses real URL paths (`/gym/3`) via the History API |
| `Routes` / `Route path element` | The route table |
| `:param` in paths + `useParams()` | `/gym/:id` → `const { id } = useParams()` |
| `useNavigate()` | Programmatic navigation (`navigate('/login')`, `navigate(-1)` for back) |
| `useLocation()` | `ProtectedRoute` stores where you were; login sends you back there |
| `<Navigate to>` | Redirect while rendering |
| `<Link>` / `<NavLink>` | Links; `NavLink` knows if it's active (nav bar styling) |
| `path="*"` | 404 page |

**Route guards:**
- `ProtectedRoute` wraps every logged-in page (section 16.3).
- `SetterRoute` (inside `App.jsx`) wraps setter-only pages: `isSetter()` from the JWT, else `<Navigate to="/" />`. Double-wrapped: `<ProtectedRoute><SetterRoute>...`.

**Route map:**

| Path | Page | Guard |
|---|---|---|
| `/login`, `/register` | Login, Register | public |
| `/` | Home | logged in |
| `/feed` | Feed | logged in |
| `/profile`, `/profile/:userId` | Profile | logged in |
| `/create-gym` | CreateGym | setter |
| `/gym/:id` | GymPage | logged in |
| `/gym/:gymId/leaderboard` | Leaderboard | logged in |
| `/gym/:gymId/wall/:wallId/add-climb` | AddClimb | setter |
| `/gym/:gymId/wall/:wallId/climb/:climbId` | ClimbPage | logged in |
| `/gym/:gymId/wall/:wallId/archived` | ArchivedClimbs | logged in |
| `/gym/:gymId/competitions` | CompetitionList | logged in |
| `/gym/:gymId/competitions/create` | CreateCompetition | setter |
| `/gym/:gymId/competitions/:compId` | CompetitionPage | logged in |

**SPA + Vercel**: refreshing `/gym/3` asks Vercel for a file that doesn't exist. `vercel.json`'s rewrite (`/(.*)` → `/index.html`) serves the app instead, and React Router renders the right page.

---

## 16. Frontend part 4: talking to the API and client-side auth

### 16.1 `api.js` (axios)
- `axios.create({ baseURL: import.meta.env.VITE_API_URL })`: every call uses relative paths like `/api/gyms/`.
- **Request interceptor**: before each request, read the access token from `localStorage` and set `Authorization: Bearer ...`, **except** for public auth paths (`/api/user/register/`, `/api/token/`, `/api/token/refresh/`, `/api/auth/`). A stale token on those would cause a 401 before the view's `AllowAny` ever runs.

### 16.2 `auth.js`
- `getDecodedToken()`: `jwtDecode` (from `jwt-decode`) reads the payload. **No signature check**: it's only for UI decisions. The backend enforces the real rules.
- `isSetter()`: reads the `is_setter` claim.

### 16.3 `ProtectedRoute.jsx`
State `isAuthorized`: `null` (checking → skeleton) / `true` (render children) / `false` (redirect to `/login` with `state.from`). On mount: no token → false; token `exp` in the past → try refresh; else true.

### 16.4 Common request patterns
```js
const [aRes, bRes] = await Promise.all([api.get(a), api.get(b)]);   // parallel loads
await api.post(url, body); setX((await api.get(url)).data);          // write then refetch
catch (err) { setError(err.response?.data?.detail || 'fallback'); } // show API message
```

---

## 17. Frontend part 5: styling and UI components

### 17.1 Tailwind CSS v4
Utility classes in JSX (`className="rounded-2xl bg-white p-5"`). v4 is configured **in CSS**, not a JS config file:
- `styles/style.css` → `@import "tailwindcss";` then an `@theme { ... }` block of **design tokens**: `--color-ink`, `--color-muted`, `--color-faint`, `--color-line`, `--color-surface`, `--color-accent` (orange `#e8590c`), `good/info/danger` (+ `-soft` variants), the Inter font, and keyframes for marquee/shiny text. Each `--color-x` becomes `text-x`, `bg-x`, `ring-x` etc.
- `@layer base` sets body background/font and tight heading tracking.
- Tailwind modifiers used: `sm:`/`md:`/`lg:` (responsive), `hover:`, `group-hover:`, `disabled:`, arbitrary values `h-[420px]`, arbitrary variants `[&_.leaflet-tile-pane]:saturate-[.35]`, `!` important suffix (toasts), `mask-*` utilities.

### 17.2 `cn()` (`lib/utils.js`)
`twMerge(clsx(...))`. `clsx` builds a class string from conditionals (`cn('p-4', isMe && 'ring-2')`); `tailwind-merge` resolves conflicts so a passed `className="p-0"` overrides a default `p-4`.

### 17.3 `components/ui/primitives.jsx` (the design system)
`Eyebrow`, `SectionLabel`, `Divider`, `Btn` (variants: solid/ghost/accent/danger; sizes), `Chip` (tones), `Card` (lifts on hover when clickable), `inputClass` + `Field` (label/input/textarea/optional/hint), `Toggle` (iOS switch), `Avatar` (first two letters of the username in a grey gradient circle), `Stars` (display or pick), `Modal` (portal, spring animation, click-outside to close, scrolls if tall), `GradePills`, `ColourSwatches`, `Segmented` + `Tabs` (sliding highlight via a shared motion `layoutId`), `Stat`, `ProgressBar` (animates when scrolled into view), `Empty`, `ErrorText`, `ErrorScreen`.

### 17.4 `components/ui/PageShell.jsx`
- `PageShell`: sticky blurred nav bar (Gyms, Feed, Setter badge, Sign out, avatar → profile), optional back button, eyebrow + two-tone title, then content. Header and content fade in with `BlurFade`.
- `AuthScaffold`: login/register layout with headline, feature marquee, form, and hero image.
- `Skeleton.jsx`: `PageSkeleton` / `CardSkeleton` pulsing placeholders.

### 17.5 Magic UI + motion
`components/magicui/` holds components **copied from magicui.design** (MIT) and converted from TypeScript: `BlurFade` (fade/unblur/slide in, optionally when scrolled into view), `NumberTicker` (springs up to a number), `Marquee`, `AnimatedShinyText`, `BentoGrid/BentoCard`. They're built on **`motion`** (formerly Framer Motion): `motion.div`, `AnimatePresence`, `useInView`, `useSpring`, `layoutId`.

---

## 18. Frontend part 6: other libraries and the PWA

| Library | Used for |
|---|---|
| `axios` | HTTP client + interceptors + upload progress |
| `jwt-decode` | Read JWT claims client-side |
| `@react-oauth/google` | Google sign-in popup (`GoogleOAuthProvider`, `useGoogleLogin`) |
| `react-hot-toast` | Toast notifications (`toast.error(...)`), `<Toaster>` mounted in `main.jsx` |
| `leaflet` + `react-leaflet` | Map: `MapContainer`, `TileLayer`, `Marker`, `Popup`, `useMap` (`FlyToUser` must be a child of the map to use it) |
| `qrcode.react` | Competition registration QR code |
| `clsx` + `tailwind-merge` | `cn()` |
| `motion` | Animations |

### PWA (Progressive Web App) via `vite-plugin-pwa`
Makes the site installable to a phone home screen and work partly offline.
- **Manifest**: name "Beta Board", standalone display (no browser chrome), portrait, icons.
- **Service worker** (Workbox) generated at build:
  - Precaches the app shell (JS/CSS/HTML/images).
  - `/api/` requests → `NetworkOnly` (never stale data).
  - OpenStreetMap tiles → `CacheFirst` for 30 days (max 500 tiles).
- `registerType: "autoUpdate"`: new versions install silently.
- `devOptions.enabled: true`: the service worker also runs in dev. If you see stale behaviour locally, unregister it in DevTools → Application → Service Workers.

---

## 19. DevOps: hosting, environments and CI/CD

### 19.1 Environments

| | Local | Production |
|---|---|---|
| Frontend | Vite dev server :5173 | Vercel (static `dist/`) |
| Backend | `manage.py runserver` :8000 | Render web service, gunicorn |
| API URL | Vite proxy `/api` → :8000 | `VITE_API_URL` = Render URL |
| Database | SQLite `backend/db.sqlite3` | Supabase Postgres (session pooler) |
| Video storage | Supabase bucket (if `.env` has keys) | Supabase bucket |
| Static files | Django dev server | WhiteNoise |

### 19.2 All environment variables

**Backend (Render dashboard / `backend/.env`):**
| Var | Required | Purpose |
|---|---|---|
| `SECRET_KEY` | yes | Django signing key (also signs JWTs) |
| `DEBUG` | prod: `False` | Debug mode |
| `ALLOWED_HOSTS` | prod | e.g. `climbing-api.onrender.com` |
| `CORS_ALLOWED_ORIGINS` | prod | e.g. `https://<app>.vercel.app` |
| `DATABASE_URL` | prod | Supabase session pooler URI; unset locally → SQLite |
| `GOOGLE_CLIENT_ID` | for Google login | |
| `SUPABASE_URL` | for videos | `https://<ref>.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | for videos | Secret, backend only |
| `SUPABASE_VIDEO_BUCKET` | optional | Defaults to `climb-videos` |

**Frontend (Vercel dashboard / `frontend/.env*`):** `VITE_API_URL`, `VITE_GOOGLE_CLIENT_ID`.

### 19.3 Render (backend)
- Root directory `backend`.
- **Build command**: `pip install -r requirements.txt && python manage.py migrate && python manage.py collectstatic --noinput`. So **migrations run automatically on every deploy**.
- **Start command**: `gunicorn backend.wsgi:application` (same as the `Procfile`). gunicorn is a production WSGI server running multiple worker processes.
- Free tier sleeps after inactivity, so the first request after a while is slow (cold start).

### 19.4 Vercel (frontend)
- Root directory `frontend`, `npm run build`, serves `dist/`.
- `vercel.json` rewrite → SPA routing works on refresh/deep links.

### 19.5 Supabase
- **Postgres**: connect via the **Session pooler** (the direct host is IPv6-only and Render can't reach it). `dj_database_url` parses the URI. `ssl_require=True` (Supabase rejects unencrypted connections). `conn_max_age=600` reuses connections for 10 minutes instead of opening one per request; `conn_health_checks=True` pings a reused connection first, because the pooler silently drops idle ones.
- Free projects **pause after 7 days of inactivity**: restore from the dashboard.
- **Storage**: the `climb-videos` bucket (section 10).

### 19.6 CORS and hosts
Browser on `vercel.app` → API on `onrender.com` = cross-origin. `CORS_ALLOWED_ORIGINS` must contain the exact Vercel origin (scheme + domain, no trailing slash), or the browser blocks responses. `ALLOWED_HOSTS` must contain the Render domain, or Django returns 400.

### 19.7 GitHub Actions CI/CD (`.github/workflows/tests.yml`)
Triggers: push to `master` and PRs into `master`.
```
backend  (ubuntu, Python 3.14, pip cache) → pip install → manage.py test tests   (SQLite, SECRET_KEY from GitHub Secrets)
frontend (ubuntu, Node 20, npm cache)     → npm ci → npm test (vitest run)
          │  both run in parallel
          ▼  only if both pass AND branch is master
deploy-backend  → curl -X POST $RENDER_DEPLOY_HOOK
deploy-frontend → curl -X POST $VERCEL_DEPLOY_HOOK
```
- `needs:` = job dependencies; `if: github.ref == 'refs/heads/master'` stops PRs deploying.
- **Deploy hooks** are secret URLs; POSTing to them triggers a deploy. Stored in repo **Settings → Secrets → Actions**.
- `npm ci` (not `npm install`) fails if `package-lock.json` is out of sync, which prevents dependency drift.
- Lint (`npm run lint`) is **not** part of CI.

---

## 20. Testing

### 20.1 Backend (`backend/tests/`, Django `TestCase` + DRF `APIClient`)
- Each test class gets a fresh **temporary test database** (SQLite); every test runs inside a transaction that's rolled back.
- `APIClient()` makes fake HTTP requests; `client.force_authenticate(user=...)` skips the JWT step.
- `@override_settings(...)`: change settings for one class/test (Supabase URL/key in video tests).
- `@patch('climbingAPI.storage.create_video_upload', return_value=...)` (`unittest.mock`): replaces the Supabase call so tests never hit the network.
- Helpers at the top of files: `make_user`, `make_gym`, `make_wall`, `make_climb`.

| File | Covers |
|---|---|
| `test_models.py` | Competition status property, unique constraints, archiving, follows, cascades |
| `test_permissions.py` | `IsSetterOrReadOnly` for anon / climber / setter |
| `test_views_auth.py` | Register, change password, follow/unfollow, profiles, feed |
| `test_views_gym.py` | Gym list/create/counts, ownership, climbs, walls (optional description), archive, votes, my-gyms, video upload URL + video create |
| `test_views_leaderboard.py` | Gym/qualifier/finals leaderboards, finals result entry, comp send guard rails |
| `test_api_docs.py` | OpenAPI schema generates; docs pages load |

Run: `cd backend && venv/Scripts/python manage.py test tests`

### 20.2 Frontend (`frontend/tests/`, Vitest + jsdom)
- **Vitest** = Vite-native test runner (Jest-compatible API: `describe`, `it`, `expect`, `vi.mock`).
- `vitest.config.js` uses the **jsdom** environment (fake browser: `localStorage`, `document`) and `globals: true`. It's a separate config so the PWA/Tailwind plugins stay out of tests.
- `auth.test.js`: `getDecodedToken` / `isSetter` with `jwt-decode` mocked. `rankUtils.test.js`: rank thresholds and Magnus.
- Run: `cd frontend && npm test` (or `npm run test:watch`).

---

## 21. Local dev cheat sheet

```bash
# Backend (terminal 1)
cd backend
venv/Scripts/activate            # Windows Git Bash: source venv/Scripts/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver       # http://127.0.0.1:8000  (docs at /api/docs/)

# Frontend (terminal 2)
cd frontend
npm install
npm run dev                      # http://localhost:5173

# After changing models.py
python manage.py makemigrations
python manage.py migrate

# Tests
python manage.py test tests      # backend
npm test                         # frontend
npm run lint                     # frontend lint
npm run build                    # check the production build
```

---

## 22. Quirks and things to remember

- **Anyone can register as a setter.** `UserRegistrationSerializer` accepts `is_verified_setter` from the client (that's how the Climber/Setter toggle works). Fine for a portfolio; in a real app setters would be approved by an admin.
- **Setter powers are global, not per-gym.** Any setter can add walls/climbs to any gym, archive any wall, and add/remove climbs, divisions, rounds and finals results on any competition. Only *edit/delete* of a gym, climb or competition is limited to its creator.
- **Divisions are display-only.** Registration posts `{}`, so the `division` on `CompRegistration` is never set by the frontend.
- **Rounds aren't linked to climbs in the UI.** `CompClimb.comp_round` exists but the Add climb modal doesn't set it.
- **Finals need their own registrations.** The judging panel lists climbers registered to the *finals* comp; qualifiers don't automatically carry over.
- **Ranking logic is duplicated.** Grade → points lives in `views/leaderboards.py` (`GRADE_POINTS`) **and** `rankUtils.jsx` (`gradeToPoints`). Change both. (Comments in `rankUtils.jsx` still mention an old `views.py grade_to_points`.)
- **Token refresh only happens on page navigation.** `ProtectedRoute` refreshes when a page mounts; `api.js` has no 401-retry interceptor. If you sit on one page past 60 minutes, API calls will 401 until you navigate.
- **`admin.py` registers nothing**, so `/admin/` won't show the app's models until you add `admin.site.register(...)` calls.
- **`runtime.txt` says Python 3.11.7** but CI uses 3.14 (and locally it's 3.14). Render ignores `runtime.txt` (it's a Heroku convention) and uses a `PYTHON_VERSION` env var or `.python-version` file.
- **Possible double deploys.** If Render/Vercel auto-deploy on push *and* CI triggers deploy hooks, each push deploys twice. If you only want "deploy after tests pass", turn off auto-deploy in both dashboards.
- **Pre-existing lint errors** in `ProtectedRoute.jsx` and `rankUtils.jsx` (`npm run lint` fails). CI doesn't lint, so it doesn't block deploys.
- **`backend/tests/README.md`** lists test modules explicitly and is missing `test_api_docs`; `python manage.py test tests` runs everything anyway.
- **Service worker in dev** can serve stale assets; unregister it in DevTools if something looks out of date.
- **Supabase free tier**: DB pauses after 7 idle days; Storage is 1 GB / 50 MB per file.
- **Videos uploaded before the bucket validation** (pasted URLs) are still in the DB and still render.
