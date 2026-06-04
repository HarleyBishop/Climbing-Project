# Architecture & System Design

## 1. Deployment Architecture

```mermaid
graph TB
    subgraph Clients["Client Devices"]
        PWA["Browser / PWA\n(iOS, Android, Desktop)"]
    end

    subgraph Vercel["Vercel — Frontend"]
        Vite["React 19 + Vite SPA\nTailwind CSS · React Router v7"]
    end

    subgraph Render["Render — Backend"]
        Gunicorn["Gunicorn WSGI"]
        Django["Django 6 + DRF\n+ SimpleJWT + WhiteNoise"]
    end

    subgraph RenderDB["Render — Database"]
        PG[("PostgreSQL")]
    end

    subgraph External["External Services"]
        GoogleOAuth["Google OAuth API\n(userinfo verification)"]
        OSM["OpenStreetMap\n(map tiles)"]
        GHA["GitHub Actions\n(CI/CD)"]
    end

    PWA -- "HTTPS (SPA shell)" --> Vite
    PWA -- "HTTPS /api/*" --> Gunicorn
    Vite -- "Axios /api/* calls" --> Gunicorn
    Gunicorn --> Django
    Django -- "psycopg2" --> PG
    Django <-- "server-side token verify" --> GoogleOAuth
    PWA -- "CacheFirst (30d TTL)" --> OSM

    GHA -- "deploy hook (master only)" --> Render
    GHA -- "deploy hook (master only)" --> Vercel
```

---

## 2. Data Model — Core Domain

```mermaid
erDiagram
    User {
        int id PK
        string username
        string email
        bool is_verified_setter
        string google_id
        text bio
    }
    Gym {
        int id PK
        string name
        string location
        bool is_active
        float lat
        float lng
        int added_by FK
    }
    Wall {
        int id PK
        string name
        string description
        int gym FK
    }
    Climb {
        int id PK
        string name
        string colour
        string image_url
        int suggested_grade
        float community_grade
        bool is_archived
        datetime set_at
        int wall FK
        int added_by FK
    }
    GradeVote {
        int id PK
        int grade
        datetime created_at
        int climb FK
        int user FK
    }
    Send {
        int id PK
        int attempts
        datetime sent_at
        int climb FK
        int user FK
    }
    Review {
        int id PK
        text comment
        int stars
        int attempts
        datetime created_at
        int climb FK
        int user FK
    }
    Video {
        int id PK
        string video_url
        datetime uploaded_at
        int climb FK
        int user FK
    }
    Follow {
        int id PK
        int follower FK
        int following FK
        datetime created_at
    }

    User ||--o{ Gym : "added_by (SET_NULL)"
    User ||--o{ Climb : "added_by (SET_NULL)"
    User ||--o{ GradeVote : "casts"
    User ||--o{ Send : "logs"
    User ||--o{ Review : "writes"
    User ||--o{ Video : "uploads"
    User ||--o{ Follow : "follower"
    User ||--o{ Follow : "following"

    Gym ||--o{ Wall : "contains"
    Wall ||--o{ Climb : "has"
    Climb ||--o{ GradeVote : "receives (upsert)"
    Climb ||--o{ Send : "receives (upsert)"
    Climb ||--o{ Review : "has"
    Climb ||--o{ Video : "has"
```

---

## 3. Data Model — Competition Domain

```mermaid
erDiagram
    Climb {
        int id PK
        string name
    }
    Gym {
        int id PK
        string name
    }
    User {
        int id PK
        string username
    }
    Competition {
        int id PK
        string title
        string comp_type
        datetime start_date
        datetime end_date
        int top_x_advance
        int gym FK
        int created_by FK
        int linked_qualifier FK
    }
    Division {
        int id PK
        string name
        int competition FK
    }
    CompRound {
        int id PK
        string name
        int order
        int competition FK
    }
    CompClimb {
        int id PK
        int points_value
        int competition FK
        int climb FK
        int comp_round FK
    }
    CompRegistration {
        int id PK
        datetime registered_at
        int competition FK
        int user FK
        int division FK
    }
    CompSend {
        int id PK
        int attempts
        datetime logged_at
        int comp_climb FK
        int user FK
    }
    FinalsResult {
        int id PK
        bool topped
        int top_attempts
        bool zoned
        int zone_attempts
        datetime recorded_at
        int comp_climb FK
        int user FK
        int recorded_by FK
    }

    Gym ||--o{ Competition : "hosts"
    User ||--o{ Competition : "created_by (SET_NULL)"
    Competition |o--o| Competition : "linked_qualifier (finals→qualifier)"

    Competition ||--o{ Division : "has"
    Competition ||--o{ CompRound : "has"
    Competition ||--o{ CompClimb : "includes"
    Competition ||--o{ CompRegistration : "has"

    Climb ||--o{ CompClimb : "featured in"
    CompRound ||--o{ CompClimb : "contains"
    Division ||--o{ CompRegistration : "categorizes"

    User ||--o{ CompRegistration : "registers"
    User ||--o{ CompSend : "logs"
    User ||--o{ FinalsResult : "achieves"
    User ||--o{ FinalsResult : "recorded_by (SET_NULL)"

    CompClimb ||--o{ CompSend : "receives"
    CompClimb ||--o{ FinalsResult : "has"
```

---

## 4. Authentication Flow

```mermaid
sequenceDiagram
    participant C as React Client
    participant B as Django Backend
    participant G as Google OAuth API

    Note over C,B: Username / Password Login
    C->>B: POST /api/token/  {username, password}
    B-->>C: {access, refresh}  (payload: username, is_setter)
    C->>C: Store in localStorage

    Note over C,B: Authenticated Request
    C->>B: GET /api/*  Authorization: Bearer <access>
    B-->>C: 200 + data

    Note over C,B: Silent Token Refresh
    C->>B: POST /api/token/refresh/  {refresh}
    B-->>C: {access}

    Note over C,B: Logout
    C->>B: POST /api/token/blacklist/  {refresh}
    B-->>C: 200 OK
    C->>C: Clear localStorage, redirect /login

    Note over C,G,B: Google OAuth (climbers only)
    C->>G: Implicit flow via @react-oauth/google
    G-->>C: Google access_token
    C->>B: POST /api/auth/google/  {token}
    B->>G: GET userinfo  (server-side verify)
    G-->>B: {sub, email, name}
    B-->>C: {access, refresh}  (creates user on first login)
    C->>C: Store tokens, redirect /
```

---

## 5. Frontend Route Map

```mermaid
graph TD
    App["App.jsx"]

    App --> PUB["Public Routes"]
    App --> PROT["ProtectedRoute\n(valid JWT required)"]

    PUB --> Login["/login"]
    PUB --> Register["/register"]
    PUB --> NotFound["* → 404"]

    PROT --> Home["/ → Home\nGym list + Leaflet map"]
    PROT --> Gym["/gym/:id → GymPage\nWalls + climbs dashboard"]
    PROT --> Climb["/gym/:gymId/wall/:wallId/climb/:climbId\n→ ClimbPage\nSends · Reviews · Videos · Grade votes"]
    PROT --> AddClimb["/gym/:gymId/wall/:wallId/add-climb\n→ AddClimb  [setter only]"]
    PROT --> Archived["/gym/:gymId/wall/:wallId/archived\n→ ArchivedClimbs"]
    PROT --> Profile["/profile  →  Profile (own)"]
    PROT --> ProfileOther["/profile/:userId  →  Profile (other user)"]
    PROT --> Leaderboard["/gym/:gymId/leaderboard\n→ Leaderboard"]
    PROT --> Feed["/feed → Feed\nActivity from followed users"]
    PROT --> CompList["/gym/:gymId/competitions\n→ CompetitionList"]
    PROT --> CompPage["/gym/:gymId/competitions/:compId\n→ CompetitionPage\nQualifier or Finals view"]
    PROT --> CreateComp["/gym/:gymId/competitions/create\n→ CreateCompetition  [setter only]"]
```

---

## 6. CI/CD Pipeline

```mermaid
graph LR
    Push["git push → master"]

    Push --> BE_TEST["backend job\nPython 3.14 · SQLite\npython manage.py test"]
    Push --> FE_TEST["frontend job\nNode 20\nnpm ci && npm test (Vitest)"]

    BE_TEST -- pass --> Deploy_BE["deploy-backend\nPOST → Render deploy hook"]
    FE_TEST -- pass --> Deploy_FE["deploy-frontend\nPOST → Vercel deploy hook"]

    BE_TEST -- fail --> Block["❌ deploy blocked"]
    FE_TEST -- fail --> Block

    Deploy_BE --> Render["Render\nGunicorn + Django + PostgreSQL"]
    Deploy_FE --> Vercel["Vercel\nReact SPA + PWA"]
```

---

## 7. API Endpoint Hierarchy

```mermaid
graph TD
    Root["/api/"]

    Root --> Auth["Auth"]
    Root --> Users["Users"]
    Root --> Feed["/feed/"]
    Root --> Gyms["/gyms/"]

    Auth --> Token["/token/  POST — obtain JWT"]
    Auth --> Refresh["/token/refresh/  POST"]
    Auth --> Blacklist["/token/blacklist/  POST"]
    Auth --> Google["/auth/google/  POST — OAuth exchange"]
    Auth --> Register["/user/register/  POST"]

    Users --> UserDetail["/users/:id/  GET·PATCH"]
    Users --> UserSends["/users/:id/sends/"]
    Users --> UserReviews["/users/:id/reviews/"]
    Users --> UserVideos["/users/:id/videos/"]
    Users --> Follow["/users/:id/follow/  POST·DELETE"]
    Users --> PwChange["/users/change-password/  POST"]

    Gyms --> GymList["GET·POST  (setter: POST)"]
    Gyms --> MyGyms["/gyms/my-gyms/"]
    Gyms --> GymDetail["/gyms/:id/  GET·PATCH·DELETE"]
    Gyms --> Walls["/gyms/:id/walls/  GET·POST"]
    Gyms --> GymClimbs["/gyms/:id/all-climbs/"]
    Gyms --> Leaderboard["/gyms/:id/leaderboard/"]
    Gyms --> Comps["/gyms/:id/competitions/  GET·POST"]

    Walls --> WallDetail["/walls/:wallId/  archive-climbs POST"]
    Walls --> Climbs["/walls/:wallId/climbs/  GET·POST"]

    Climbs --> ClimbDetail["/climbs/:id/  GET·PATCH·DELETE"]
    Climbs --> Archived["/climbs/archived/"]
    Climbs --> Votes["/climbs/:id/votes/  GET·POST"]
    Climbs --> Sends["/climbs/:id/sends/  GET·POST"]
    Climbs --> Reviews["/climbs/:id/reviews/  GET·POST"]
    Climbs --> Videos["/climbs/:id/videos/  GET·POST"]

    Comps --> CompDetail["/competitions/:id/  GET·PATCH·DELETE"]
    Comps --> Divisions["/competitions/:id/divisions/  GET·POST"]
    Comps --> Rounds["/competitions/:id/rounds/  GET·POST"]
    Comps --> CompClimbs["/competitions/:id/climbs/  GET·POST"]
    Comps --> Registrations["/competitions/:id/registrations/"]
    Comps --> CompRegister["/competitions/:id/register/  POST"]
    Comps --> CompSends["/competitions/:id/sends/  GET"]
    Comps --> LogSend["/competitions/:id/log-send/  POST"]
    Comps --> QualLB["/competitions/:id/leaderboard/"]
    Comps --> FinalsRes["/competitions/:id/finals-results/  GET·POST"]
    Comps --> FinalsLB["/competitions/:id/finals-leaderboard/"]
```
