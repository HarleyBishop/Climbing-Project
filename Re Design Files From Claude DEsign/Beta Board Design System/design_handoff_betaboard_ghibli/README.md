# Handoff: Beta Board — "Ghibli" Mobile Redesign

## Overview
Beta Board is a mobile app for indoor bouldering / climbing gyms. Climbers find gyms, browse walls and climbs, log sends, vote on grades, write reviews, climb a ranked leaderboard, and enter competitions. Setters / gym owners additionally create gyms, set climbs, archive routes, and run competitions.

This handoff covers a full visual redesign in a **painterly, Studio-Ghibli-inspired storybook style**: soft CSS-painted skies, gentle sun/lantern glow, rolling hills, paper grain, and an elegant serif display type. The system ships with **two interchangeable time-of-day themes** — **Meadow** (golden afternoon) and **Dusk** (twilight) — that reskin the entire app from a single palette object.

Every screen in the app is designed (14 views, listed below), in both themes, for both Climber and Setter roles.

## About the Design Files
The files in `prototype/` are **design references built in HTML/React (via in-browser Babel)** — high-fidelity prototypes showing the intended look, layout, and interactions. **They are not production code to copy directly.**

Your task is to **recreate these designs in the target codebase's existing environment**, using its established patterns, component library, routing, and state management. If the app has no front-end environment yet, choose the most appropriate framework for the project (the prototype is plain React, so a React/React-Native stack maps most directly) and implement the designs there.

The prototype intentionally has **no backend** — all content comes from mock data in `prototype/data.jsx`. Wire the real API in its place; the data shapes there mirror what each screen expects.

## Fidelity
**High-fidelity (hifi).** Colors, typography, spacing, radii, shadows, and interactions are all final and intended to be matched precisely. Exact values are documented under **Design Tokens** below, and every value is also readable in `prototype/kit.jsx` (the design system) — treat that file as the source of truth for tokens and shared components.

---

## Design Tokens

### Themes
The entire app is driven by one palette object per theme, selected at the root and provided via React context (`ThemeCtx` / `useP()` in the prototype). Recreate this as your framework's theming mechanism (context, CSS custom properties, design-token file, etc.). Switching the palette must reskin every screen with no other changes.

#### Meadow (default — golden afternoon)
| Token | Value | Use |
|---|---|---|
| `ink` | `#36402c` | Primary text |
| `ink2` | `#6f7a60` | Secondary text |
| `ink3` | `#9aa389` | Tertiary / placeholder text |
| `primary` | `#cf6f49` | Primary actions, accents (terracotta) |
| `primaryD` | `#b85b39` | Pressed/darker primary, chip text |
| `primarySoft` | `rgba(207,111,73,.12)` | Soft primary fills (chips) |
| `accent` | `#7e9b5c` | Secondary accent (sage green) |
| `page` | `#f3efe2` | App backdrop behind the phone frame |
| `sheet` | `#fbf5e6` | Main content surface (cream) |
| `card` | `#fffaef` | Card / input surface |
| `line` | `#e8ddc6` | Borders, dividers |
| `lineSoft` | `#efe7d4` | Progress-bar tracks |
| `onSky` / `skyText` | `#3a4329` | Text placed over the sky header |
| `sky` | `linear-gradient(180deg,#bfe2dd 0%,#d6e7d8 40%,#eef2dc 78%,#f6f1de 100%)` | Sky gradient |
| `glow` | `radial-gradient(115% 78% at 80% 6%, rgba(255,248,222,.95), rgba(255,248,222,0) 55%)` | Sun glow, top-right |
| `cloud` | `rgba(255,255,255,.9)` | Drifting cloud blobs |
| `hills` | `['#a9c187','#8fae6b','#739255']` | 3 layered hill silhouettes |
| `good` / `goodBg` | `#5e7a44` / `rgba(126,155,92,.16)` | Success / "Open" / sent |
| `warn` / `warnBg` | `#b85b39` / `rgba(207,111,73,.14)` | Warning |
| `info` / `infoBg` | `#5b6f8c` / `rgba(91,111,140,.14)` | Info / "Upcoming" / advances |

#### Dusk (twilight variant)
| Token | Value | Use |
|---|---|---|
| `ink` | `#322a3d` | Primary text |
| `ink2` | `#6e6479` | Secondary text |
| `ink3` | `#9a90a4` | Tertiary / placeholder text |
| `primary` | `#dc9a47` | Primary actions, accents (amber) |
| `primaryD` | `#c5833a` | Pressed/darker primary |
| `primarySoft` | `rgba(220,154,71,.14)` | Soft primary fills |
| `accent` | `#7486ad` | Secondary accent (dusty blue) |
| `page` | `#efe7da` | App backdrop |
| `sheet` | `#fbf2e3` | Main content surface |
| `card` | `#fff8ed` | Card / input surface |
| `line` | `#ecdfcd` | Borders, dividers |
| `lineSoft` | `#f3e9da` | Progress-bar tracks |
| `onSky` / `skyText` | `#fdeede` | Text over the sky (light, for dark sky) |
| `sky` | `linear-gradient(180deg,#3b4a72 0%,#65567f 42%,#a9748a 72%,#e7b079 96%)` | Twilight gradient |
| `glow` | `radial-gradient(85% 60% at 50% 98%, rgba(247,196,134,.85), rgba(247,196,134,0) 62%)` | Horizon glow, bottom |
| `cloud` | `rgba(255,233,206,.40)` | Cloud blobs |
| `hills` | `['#5d5b7d','#474463','#322f49']` | Hill silhouettes |
| `good`/`warn`/`info` | `#6e8a96` / `#c5833a` / `#8d80ad` | (with matching `*Bg` at higher alpha) |

Dusk also renders **stars** in the sky (Meadow does not).

### Hold / route colours
Used for climb "hero" panels, wall dots, and colour swatches. Theme-independent.
```
Green  #5b9468   Orange #cd6f3f   Blue   #4677a6
Pink   #a85a7e   Yellow #caa23a   Black  #5c5560   White #efe9da
```

### Typography
Three families. Load all three (Google Fonts in the prototype).
| Role | Font | Usage |
|---|---|---|
| **Display** | **Gloock** (serif), weight 400 | All headings, titles, big stat numbers, gym/climb names. Always weight 400 — its weight comes from the letterforms. |
| **Serif accent** | **Newsreader** (serif), *italic*, 400/500 | Quotes, reviews, hints, dates, secondary editorial lines. Almost always italic. |
| **Body / UI** | **Mulish** (sans-serif), 400–800 | All body copy, labels, buttons, chips, nav, form fields. |

Type scale (sizes in px, observed across screens):
- Page title (Gloock): 30–34 / line-height 1.0–1.08
- Section heading on cards (Gloock): 16–19
- Big stat number (Gloock): 22–26
- Eyebrow label (Mulish 700, uppercase): 10–10.5, letter-spacing 0.16em
- Body (Mulish): 13–14.5
- Editorial italic (Newsreader italic): 13–16.5
- Chip / meta (Mulish 600): 11–12

### Spacing, radius, shadow
- **Screen padding:** 20–24px horizontal.
- **Card radius:** 15px. **Input/tile radius:** 11–12px. **Sheet top corners:** 22px. **Pills/chips:** 999px (full).
- **Card shadow:** `0 4px 14px rgba(40,40,30,.06)`.
- **Sheet lift shadow:** `0 -8px 24px rgba(40,40,30,.10–.12)`.
- **Primary button shadow:** `0 6px 15px {primary}3a`.
- **Gaps:** card lists 9–11px; form fields 12–22px; grids 13px.

### Signature visual: the sky header + cream sheet
Almost every screen follows one scaffold (see `PageShell` in `prototype/nav.jsx`):
1. A **painterly sky header** (the `Sky` component): theme `sky` gradient + `glow` radial + 3 blurred cloud blobs + 3 rounded hill silhouettes at the base + a faint SVG paper-grain overlay (`opacity 0.09`, `mix-blend-mode: soft-light`). Dusk adds small star dots.
2. Over the sky: top bar (wordmark or back button + avatar + sign-out), then eyebrow + display title (with an optional italic Newsreader fragment).
3. A **cream content sheet** with 22px top corners, pulled up `-20px` to overlap the sky, casting the lift shadow. All page content lives here.

The grain texture is an inline SVG `feTurbulence` data-URI (`GRAIN` in `kit.jsx`); reuse one shared asset.

---

## Screens / Views

The router (see `prototype/app.jsx`) manages 14 screens with a simple stack (push on navigate, pop on back) and persists `{themeKey, role, view}` to `localStorage`. Two role states — `climber` and `setter` — gate setter-only UI. The floating Meadow/Dusk + Climber/Setter control in the corner is **prototype chrome only** — do not ship it; theme and role come from real settings/auth in production.

### 1. Login (`login`)
- **Purpose:** sign in.
- **Layout:** full-sky scaffold (no PageShell). Sky header with wordmark + "est. 2025", a framed climber photo (4px white border, 18px radius, height 146), and a display headline "Your next climb / *is waiting.*" (second line italic). Cream sheet pulled up below with the form.
- **Components:** Username field, Password field, primary **Login** button (full width) → goes to Home; "Don't have an account? *Register*" link; "or continue with" hairline divider; ghost **Google** button (multicolour wordmark) → Home.

### 2. Register (`register`)
- **Purpose:** create account.
- **Layout:** same auth scaffold; headline "Start your / *climbing story.*"
- **Components:** Username, Password, a **role selector** (two buttons: Climber / Setter–Gym owner; selected = primary fill), **Create account** button (sets role, returns to Login), "Already have an account? *Login*" link, and an italic note: "Google sign-in always creates a Climber account."

### 3. Home (`home`)
- **Purpose:** pick a gym to climb at.
- **Layout:** PageShell, eyebrow = greeting ("Tuesday morning" / "Tuesday evening" by theme), title "Where are you climbing *today?*", hero height 188.
- **Components:** search field (decorative magnifier), "Your gyms" section label with "N saved" italic on the right, list of **GymRow** cards (coloured strip dot + name + "location · N walls · N climbs" + Open/Closed chip; tap → Gym), a divider, "Gyms near you" + **MapBlock** (sky-textured panel with 3 pin markers and an "interactive map" monospace tag). **Setter only:** a "Create a gym" button at the bottom.

### 4. Gym (`gym`, param `gymId`)
- **Purpose:** browse a gym's walls and climbs.
- **Layout:** PageShell, eyebrow = location, title = gym name, hero 176. Header-right row: Open/Closed chip + ghost pills "Competitions" and "Leaderboard".
- **Components:** "Select wall" pill selector (Crimp Wall / The Slab / Overhang Cave), a row with "{wall} · N climbs" + "View archived" link + (setter) "+ Add climb" button, then a **2-column grid of ClimbTile** cards. Each tile: a hold-colour gradient header (78px tall, grain overlay, colour + grade pills bottom-left) and a body with climb name (Gloock) + "Setter Vx · Community Vy". **Setter only:** an "Archive all climbs on this wall" action that expands to an inline confirm card (danger + cancel buttons).

### 5. Climb detail (`climb`, params `gymId`, `climbId`)
- **Purpose:** view a climb, log a send, vote grade, read/write reviews.
- **Layout:** custom (not PageShell). **Hero is the hold colour** (full-bleed gradient of the route colour + grain + white radial highlight), with back button + avatar, eyebrow "{Colour} hold · {wall}", big display title, and italic "Set by @user · date". Cream sheet pulled up below.
- **Components:**
  - **4-cell stat row** (Setter grade / Community grade / Sends / Reviews) in a bordered card.
  - **Send strip:** "Logged your send yet?" → "Log send" button; after logging, becomes a green success card with attempt count + Edit.
  - **Vote the grade:** GradePills (V2–V8); selecting shows "You voted Vx. Community sits at Vy."
  - **Beta videos · 2:** two video thumbnails (hold-gradient + play triangle).
  - **Reviews:** list of italic quote + avatar + @user + stars + attempts; "+ Write a review" ghost button.
  - **Modals:** "Log your send" (attempts field) and "Write a review" (comment textarea, star picker, attempts, optional video URL).

### 6. Profile (`profile`)
- **Purpose:** the current user's climbing record.
- **Layout:** PageShell, eyebrow "Your profile", title "@username", hero 176. Header-right: **RankBadge** + "1,240 pts" + "*· since Aug 2024*".
- **Components:** Home-gym card; **4 StatTiles** (Sends / Reviews / Videos / Avg grade); "Sends" list (cards with a coloured left edge, name, wall·gym, grade chip + attempts); "Reviews" list (climb name + stars + italic quote + wall·gym); "Videos" thumbnails.

### 7. Leaderboard (`leaderboard`, param `gymId`)
- **Purpose:** ranked standings for a gym.
- **Layout:** PageShell, eyebrow "{gym} · N active climbs", title "Leaderboard".
- **Components:**
  - **Your ranking** card (primary 2px border): big "#8", @you, "You" chip + RankBadge, points + send count.
  - **Top climbers** list: rank number (gold/silver/bronze/neutral by position), avatar, @user, a **points progress bar**, RankBadge icon + points. "You" row gets the primary border.
  - **Rank tiers** card: each of 8 ranks (Iron→Masters) with pixel-art **RankIcon**, a min-points bar, and threshold; plus the **Magnus** tier ("Top 20 at this gym").
  - **Points per grade** card: grade band (italic) + bar + points value.

### 8. Competitions list (`comps`, param `gymId`)
- **Purpose:** browse a gym's competitions.
- **Layout:** PageShell, title "Competitions".
- **Components:** grouped sections "Live now / Upcoming / Past", each a list of **CompCard** (title + type chip [Qualifier/Finals] + status chip + 2-line italic description + date range + registration count). **Setter only:** "+ Create competition" button.

### 9. Competition detail (`comp`, params `gymId`, `compId`)
- **Purpose:** view a comp, register, log comp sends, see standings.
- **Layout:** PageShell, eyebrow "{type} · {status}", title = comp title, header-right = date range. A **tab bar** (underline style): Info / Climbs (N) / Leaderboard|Results.
- **Components:**
  - **Info tab:** 4 stat cells (Opens/Closes/Registered/Type), an info banner ("Top 20 climbers advance"), About + Rules (italic, preserves line breaks), Divisions chips, numbered Rounds list, and a register CTA (or a green "You're registered" card, or "ended" empty state).
  - **Climbs tab:** list of comp climbs (colour grade square + name + wall·points + Log-send button / "✓ N att." chip). Setter sees "+ Add climb".
  - **Leaderboard/Results tab:** standings cards like the gym leaderboard, with an "Advances" chip for qualifiers.
  - **Modal:** "Log comp send" (attempts).

### 10. Create gym (`createGym`, setter)
- PageShell, title "Set up your gym". Fields: Gym name, Location, optional Lat/Lng pair, an **open/closed toggle** card, and a **Walls** builder (list of wall cards with colour dot + remove, plus an "add wall" card with name field + colour swatches). Create / Cancel buttons.

### 11. Add climb (`addClimb`, setter, param `gymId`, `wall`)
- PageShell, eyebrow = wall name, title "Add a new climb". Fields: Climb name, **Hold colour** swatches (label shows current colour in primary), **Setter grade** GradePills (V0–V12), optional **photo drop zone** (dashed, "drop a wall photo" monospace). Add climb / Cancel.

### 12. Archived climbs (`archived`, setter, params `gymId`, `wall`)
- PageShell, eyebrow "{wall} · old routes", title "Archived climbs". A 2-column grid of ClimbTiles, each prefixed with an italic "Set {date}" label.

### 13. Create competition (`createComp`, setter, param `gymId`)
- PageShell, title "Create competition". **Type selector** (Qualifier / Finals–World Cup), Title, Description textarea, optional Rules textarea, Starts/Ends datetime pair, conditional "Top X advance" (qualifier only), and **Divisions** + **Rounds** editors (add/remove chip-rows). Create / Cancel.

### 14. Not found (`notFound`)
- Full-sky centered layout: large italic "404", "Lost the beta?", italic "This route doesn't exist on the wall.", and a "Back to your gyms" button.

---

## Interactions & Behavior
- **Navigation:** stack-based. `go(screen, params)` pushes current view and scrolls the frame to top; `back()` pops. Reproduce with your router; keep scroll-reset on navigate.
- **Roles:** `climber` vs `setter`. Setter unlocks: Create gym, Add climb, Archive wall, Create competition, comp "Add climb". In production, derive from the authenticated user, not a toggle.
- **Theme:** `meadow` / `dusk`, applied app-wide via the palette. Greetings and a few accents shift by theme; Dusk adds stars and uses light-on-dark sky text.
- **Local state per screen:** wall selection (Gym), grade vote + send/review modals (Climb), registration + active tab + log modal (Comp), open toggle + wall list (Create gym), colour/grade (Add climb), type/divisions/rounds (Create comp).
- **Transitions:** subtle only — `transition: all .12–.15s` on buttons/cards/toggles (border-color, background, transform). Toggle knob slides `translateX(20px)` over .18s. No long or looping animations.
- **Hover (where pointer exists):** cards with `hover` raise their border to `primary`; buttons/pills shift fill. On touch, these are inactive — that's fine.
- **Forms:** prototype fields are mostly visual; wire real validation and submission. Field component supports text/number/datetime/textarea, label, optional flag, and italic hint.
- **Persistence:** prototype stores `{themeKey, role, view}` in `localStorage` under `betaboard-ghibli`. Replace with real settings/session.

## State Management
Production state to wire (currently mocked in `data.jsx`):
- **Auth/session:** current user, role (climber/setter), theme preference.
- **Gyms:** list + detail (walls, climbs, active status, location/coords).
- **Climbs:** per wall; fields incl. colour, suggested_grade, community_grade, sends, reviews, set_at, added_by; archived flag.
- **Sends & grade votes:** per user per climb (attempts; community grade aggregation).
- **Reviews:** comment, stars, attempts, optional video URL.
- **Leaderboard:** per-gym points/rank, plus the points-per-grade rules and rank thresholds (in `kit.jsx`: `RANKS`, `MAGNUS_RANK`, `getRank`, `GRADE_POINTS`).
- **Competitions:** comp meta (type, status, dates, divisions, rounds, top_x_advance, registration), comp climbs (points_value, my_send), comp standings (rank, points, advances).

## Ranks (port exactly)
8 tiers by points: Iron 0 / Bronze 100 / Silver 300 / Gold 700 / Platinum 1200 / Diamond 2000 / Emerald 3000 / Masters 4500, plus **Magnus** for top-20 placement. Each rank has a brand `color` + `bg` and a **pixel-art SVG icon** (`RankIcon` in `kit.jsx`, drawn with `shapeRendering:crispEdges`). Reuse these icon definitions verbatim. Grade points: V0–V2 = 10, V3–V4 = 20, V5–V6 = 40, V7–V8 = 70, V9–V10 = 100, V11–V12+ = 150.

## Assets
- **`climber.jpg`** — the framed hero photo on Login/Register. A real photographic/illustrated climber image; swap for your own brand asset of equivalent aspect (shown at ~344×146, object-fit: cover).
- **Paper-grain texture** — inline SVG `feTurbulence` data-URI (`GRAIN`), used as a soft-light overlay on skies, climb heroes, video thumbs, and the map. No external file needed.
- **Rank icons** — inline SVGs in `kit.jsx`. No external files.
- **No icon font / icon library** is used; the few glyphs (search, back chevron, play, check, stars) are simple CSS/SVG/text. Substitute your codebase's icon set if preferred.
- **Fonts** — Gloock, Newsreader (italic), Mulish (Google Fonts). Self-host or load per your setup.

## Files (in `prototype/`)
| File | Contents |
|---|---|
| `Beta Board App.html` | Entry point; loads fonts + scripts. Open this to run the prototype. |
| `kit.jsx` | **Design system** — palettes (Meadow/Dusk), tokens, hold colours, ranks + rank icons, and all shared components (Btn, Chip, Card, Field, Toggle, Modal, Avatar, Stars, Eyebrow, Divider, GradePills, ColourSwatches, Sky, RankBadge). **Start here.** |
| `nav.jsx` | Router context, TopBar, **PageShell** scaffold, SectionLabel, Empty, and the (chrome-only) FloatingControls. |
| `app.jsx` | Root: theme + router providers, screen table, mobile frame, localStorage persistence. |
| `pages-auth.jsx` | Login, Register, NotFound. |
| `pages-home-gym.jsx` | Home, Gym, AddClimb, ArchivedClimbs (+ GymRow, ClimbTile, MapBlock). |
| `pages-climb.jsx` | Climb detail + log-send / review modals. |
| `pages-social.jsx` | Profile, Leaderboard (+ rank tiers, points-per-grade). |
| `pages-comp.jsx` | Competitions list, Competition detail (tabs), Create gym, Create competition. |
| `data.jsx` | All mock content (gyms, walls, climbs, reviews, leaderboard, me, competitions). Replace with API. |
| `climber.jpg` | Auth hero image. |

**Recommended reading order for the implementer:** `kit.jsx` (tokens + components) → `nav.jsx` (PageShell) → `app.jsx` (routing/theme wiring) → individual page files. To preview the original behavior, open `Beta Board App.html` in a browser.
