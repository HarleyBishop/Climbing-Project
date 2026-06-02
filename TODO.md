# Beta Board — TODO

## ✅ Done
- Code comments throughout (backend + frontend)
- Rank system (Iron → Masters → Magnus) on leaderboard + profile
- Gym map on home page with user location
- Login/Register cross-links
- Local dev / production environment split (SQLite locally, Postgres in prod)
- Replace all alert() with react-hot-toast notifications (amber-themed)
- Loading skeleton components replacing all "Loading..." text across every page
- PWA via vite-plugin-pwa — installable on mobile, service worker caches app shell + OSM tiles

---

## 🔥 High Priority

### Edit profile
Users currently have no way to change their username or add a bio/description.
Minimum viable: username change + optional one-line bio shown on the profile page.

### Password reset flow
There's no forgot password link anywhere. Users who lose access are stuck.
Django has this built in — just needs wiring up with an email backend.

---

## 🟡 Medium Priority

### UI review with Claude
Feed screenshots of each page into claude.ai and ask for specific layout/visual feedback.
Pages most worth reviewing: Home, ClimbPage, Profile, Leaderboard.
Focus areas: spacing consistency, mobile layout, colour contrast, empty states.

### Filter + sort climbs on gym page
Currently all climbs on a wall are shown in creation order with no filtering.
Adding grade range filter and colour filter would make large walls much more navigable.
Sort by: newest, grade (easy→hard, hard→easy), most sends.

### Grade progression chart on profile
The profile shows average grade as a single number. A simple line chart (recharts or
chart.js) showing average grade over time would make the portfolio aspect much stronger —
it demonstrates both data visualisation skills and meaningful product thinking.

### Image upload instead of URL
Climbs and videos currently accept URLs only. A real upload (Cloudinary free tier or
Supabase storage) would be more realistic and remove the dependency on external hosting
for images.

### Climb search / quick-find
No way to search for a specific climb by name across the whole gym. Useful when a gym
has many walls and you want to find a specific route.

---

## 🟢 Nice to Have

### Landing page for logged-out users
Currently / redirects straight to /login. A brief landing page showing what the app is
(with a screenshot or demo) is important for portfolio presentation — reviewers shouldn't
have to create an account to understand what it does.

### Guest / demo access
A read-only demo account (pre-seeded with a gym, walls, climbs, sends) that anyone can
log into without registering. Makes the portfolio accessible to people who won't bother
signing up.

### Social follows / activity feed
Follow other climbers and see a feed of their recent sends. Large scope but would make
the app feel like a real product rather than a personal tracker.

### Email verification on register
Currently any email can be used (or none at all). Django supports email verification
out of the box — just needs an email backend (SendGrid free tier).

### Infinite scroll on profile sends list
The sends list on the profile page loads everything at once. For prolific climbers this
could get long — paginating or using infinite scroll (with a sentinel IntersectionObserver)
would keep it fast.

### Competition QR code check-in
At a real comp, a setter could display a QR code that deep-links to the competition
registration page. Small feature, looks impressive in a demo.
