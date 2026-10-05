# Beta Board — Frontend

React 19 + Vite single-page app, styled entirely with Tailwind CSS v4. Animations come from [Magic UI](https://magicui.design) components (built on the [Motion](https://motion.dev) library) that are copied into the codebase, not installed as a package.

## Scripts

```bash
npm install
npm run dev      # dev server on :5173, proxies /api → localhost:8000
npm test         # Vitest unit tests (tests/)
npm run lint     # ESLint
npm run build    # production build into dist/ (also generates the PWA service worker)
```

No `.env` is needed for local development: `vite.config.js` proxies `/api` to the Django dev server. `VITE_API_URL` is only set in production (Vercel), and `VITE_GOOGLE_CLIENT_ID` enables Google sign-in.

## Folder structure

```
src/
├── main.jsx                  # Entry point: Google OAuth provider, toast container
├── App.jsx                   # Routes + ProtectedRoute / SetterRoute guards
├── api.js                    # Axios instance; attaches the JWT to requests
├── auth.js                   # Reads claims (username, is_setter) from the JWT
├── styles/style.css          # Design tokens (@theme) + Magic UI keyframes
├── lib/
│   ├── utils.js              # cn() — merges Tailwind classes
│   └── holds.js              # Hold colour name → hex
├── components/
│   ├── ui/
│   │   ├── PageShell.jsx     # Page layout: glass nav bar, headline, content; AuthScaffold for login/register
│   │   └── primitives.jsx    # Shared building blocks: Btn, Card, Field, Modal, Segmented, Tabs, Chip…
│   ├── magicui/              # Components ported from Magic UI (see below)
│   ├── Skeleton.jsx          # Loading placeholders
│   └── …                     # Feature components (gym list, map, climb card, forms)
├── pages/                    # One file per route
└── utils/rankUtils.jsx       # Rank tiers, points maths, pixel-art rank icons
```

## Design system

The look is deliberately Apple-like: an off-white page, white rounded cards with soft layered shadows, large tightly-tracked headlines, lots of whitespace, one accent colour, and subtle motion. There is a single light theme.

**Tokens** live in one place, the `@theme` block in `src/styles/style.css`. Tailwind v4 turns every `--color-*` variable into utilities automatically, so `--color-muted` gives you `text-muted`, `bg-muted`, `border-muted` and so on.

| Token | Use |
|---|---|
| `ink` | Primary text, solid buttons |
| `muted` / `faint` | Secondary / tertiary text |
| `line` | Hairline borders and rings |
| `surface` | Page background, subtle fills |
| `accent` (+ `accent-soft`) | The one brand colour: eyebrows, links, highlights |
| `good`, `info`, `danger` (+ `-soft`) | Status chips and messages |

The font is Inter (loaded in `index.html`), with `-apple-system` first in the stack so Apple devices use SF Pro.

**Conventions**

- Style with Tailwind classes. Use inline `style` only for values that come from data, such as a climb's hold colour, which can't be known at build time.
- Reach for `primitives.jsx` before writing new markup. Every primitive accepts `className`, which is merged with `cn()` so the caller's classes win. For example `<Card className="p-0">` overrides the default padding instead of both ending up in the DOM.
- Every page uses `PageShell` for its layout, so the nav bar, headline and entry animation stay consistent.
- Two-tone headlines: `PageShell`'s `titleItalic` prop renders the second half of the title in grey (`Where are you climbing` **today?**).

## Magic UI components

[Magic UI](https://magicui.design) is an MIT-licensed library of animated React + Tailwind components. Like shadcn/ui, it's designed to be copied into your project rather than installed from npm, so the code lives in `src/components/magicui/` and is ours to edit.

| Component | Used for |
|---|---|
| `blur-fade.jsx` | Content fading/un-blurring in on page load and on scroll (`inView`) |
| `number-ticker.jsx` | Stats counting up (climb page, profile, leaderboard podium) |
| `bento-grid.jsx` | The tile grid on the home page (adapted, see the file header) |
| `marquee.jsx` | Scrolling feature pills on the login/register page |
| `animated-shiny-text.jsx` | The shimmering "Your climbing logbook" badge |

Each file starts with a comment linking to its source and noting anything changed.

### Adding another Magic UI component

1. **Find it** on [magicui.design/docs/components](https://magicui.design/docs/components) and check the demo looks right.
2. **Get the source.** Components live in the Magic UI GitHub repo at
   `apps/www/registry/magicui/<name>.tsx`, e.g.
   `https://raw.githubusercontent.com/magicuidesign/magicui/main/apps/www/registry/magicui/blur-fade.tsx`.
   Save it as `src/components/magicui/<name>.jsx`.
3. **Convert TypeScript to JSX.** Delete the `interface`/`type` declarations, the `: Type` annotations, `as` casts and `import type` lines. The logic stays the same.
4. **Fix imports.**
   - `@/lib/utils` → a relative import of `cn` from `src/lib/utils.js` (we don't use the `@` alias).
   - `motion/react` works as-is (the `motion` package is installed).
   - If it imports shadcn components (`@/components/ui/button`) or icon packs (`@radix-ui/react-icons`), swap them for our primitives or plain markup rather than adding the dependency. `bento-grid.jsx` is an example.
5. **Remove `dark:` classes.** The app has one light theme, so those classes are dead weight. Also map Magic UI's colour names to ours, e.g. `text-neutral-500` → `text-muted`.
6. **Add any keyframes.** Some components rely on CSS animations defined in the Magic UI docs' install step ("Update `tailwind.config` / CSS"). Add those to the `@theme` block in `style.css` as an `--animate-*` variable plus an `@keyframes` rule, like `marquee` and `shiny-text`.
7. **Add the header comment**: source URL, a line on what it does, and anything you changed.

### Gotchas

- **`position: fixed` inside animated content.** `BlurFade` leaves a `transform` and `filter` on its wrapper, and any element with those becomes the containing block for `fixed` descendants. Overlays rendered inside page content therefore get positioned relative to the content, not the viewport. That's why `Modal` renders through `createPortal(…, document.body)`. Do the same for any new overlay (dropdowns, drawers, popovers).
- **Scroll-triggered animations and full-page screenshots.** Elements using `BlurFade inView` stay hidden until they scroll into view, so a headless full-page screenshot taken without scrolling shows blank sections.
- **ESLint and `motion`.** Core `no-unused-vars` doesn't count `<motion.div>` as a use of the `motion` import, so `eslint.config.js` whitelists that name.

## Map

`GymMap.jsx` uses React Leaflet with free OpenStreetMap tiles (no API key). The tiles are toned down with CSS filters on Leaflet's tile pane (`saturate`, `brightness`) to fit the muted palette. Markers live in a different pane, so they keep their colour. Muted basemaps such as CARTO now require an API key, so they were deliberately not used.
