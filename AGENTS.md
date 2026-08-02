# AGENTS.md — Project Context for AI Agents

This file is the single source of truth for working on this project. Read it fully before making changes. It is written for both human maintainers and future AI agents.

## What this project is

A personal portfolio / resume site for **Shubham Rathi** ("SR", github: `ishubhamrathi`). It is a single-page React app with a heavy visual/UX focus: WebGL background, custom cursors, sound effects, glassmorphism cards, scroll animations.

- Framework: **React 19** + **Vite 6** (NOT Create React App — the README is stale boilerplate).
- Styling: **Tailwind CSS v4** (via `@tailwindcss/vite`) + CSS variables in `src/index.css` + co-located CSS Modules for a few sections.
- Routing: `react-router-dom` (BrowserRouter, but only used as a wrapper — the page is effectively one long scroll page using anchor `#section` links).
- Path alias: `@` → `src/` (see `vite.config.js`, `jsconfig.json`).
- Build target: **Netlify** (`netlify.toml` → `npm run build`, publish `dist`).

## Commands

```bash
npm install          # install dependencies
npm run dev          # start dev server (http://localhost:5173)
npm run build        # production build → dist/ (this is the deployment artifact)
npm run preview      # preview the production build locally
```

- There is **no lint, typecheck, or test script** and no ESLint config. Do not assume one exists.
- `src/setupTests.js` imports `@testing-library/jest-dom`, but that package is **not installed** and there is no test runner — treat it as inert.
- Always run `npm run build` after changes to verify the bundle still compiles (this is what CI/Netlify runs).

## Architecture / folder map

```
src/
  main.jsx                 # React entry (StrictMode + render)
  App.jsx                  # Page shell: nav + sections (Home, Projects, About, Stats, Blog?, Social) + footer
  index.css                # Tailwind theme tokens + global styles + reduced-motion rules
  components/
    layout/
      SiteNav.jsx          # Fixed top nav + sound mute toggle
      GlobalEffects.jsx    # Background (Silk WebGL / gradient fallback), TargetCursor, Noise overlay
    Home/  Projects/  About/  Stats/  Blog/  Social/   # Page sections (each own folder + .module.css)
    Project/Project.jsx    # Project card + detail modal
    <effect components>/   # Reusable animation/UI primitives (BlurText, DecryptedText, GlassSurface, Magnet, etc.)
  context/SoundProvider.jsx  # howler-based SFX + ambient audio; exposes useSound() hook
  services/contentApi.js   # ALL data access. Reads content.json + optional backend API. Central content mapping lives here.
  resources/content.json   # Fallback + migration content source (the "database" when no API).
  data/projects.JSON       # EMPTY file — unused, do not treat as a data source.
  store/                   # EMPTY leftover dir (redux removed). Ignore.
  lib/utils.js             # cn() helper (clsx + tailwind-merge). Rarely used.
```

### Content flow (IMPORTANT)

- `contentApi.js` is the **only** module that should touch data. Components call `getHome()`, `getAbout()`, `getSocial()`, `getStatsConfig()`, `getProjects()`, `getCategories()`, `getWidgetCatalog()`, `getBlogPosts()`, `getFormspreeEndpoint()`.
- Home/About/Social/Stats always come from `src/resources/content.json` (not yet on backend).
- Projects/Blog prefer a backend API at `VITE_API_BASE` (default `http://localhost:8080`) and **silently fall back** to `content.json` on failure. A "Source: live API / content.json fallback" label is shown in the Projects section.
- `GET /api/portfolio/projects` returns `{ projects: { title, items: [...] } }` (public schema, pre-filtered to `visibility_status = 'SHOW'`, sorted by `sort_order`; params `categoryPath` + `limit` ≤ 200). The Projects filter bar is driven by `GET /api/portfolio/categories` (`categoryPath` chips) and hides when that fails. Each item's `status`/`topCategory`/`visibility` are `{ value, label }` objects and `tech` is `[{ value, label, icon }]` (icon = URL); `shortDescription`/`description` are HTML (`description` is rendered rich-text in the modal, `shortDescription` is tag-stripped for the card). `mapApiProject()` normalizes all of this (`tech` → `[{ code, label, icon }]`) and tolerates the legacy camelCase/string shape, with static `STATUS_LABELS` / `TOP_CATEGORY_LABELS` / `TECH_LABELS` as fallback. `getWidgetCatalog()` / `buildTechLookup()` are retained but not required for rendering.
- API→UI field mapping lives in `mapApiProject()` and `mapLegacyProject()` in `contentApi.js` (accepts both the refreshed snake_case schema and legacy camelCase). If you change backend fields, update the mapping + `src/resources/README.md`.

### Feature flags

- `getFeatures()` hits `GET {API_BASE}/api/features?category=portfolio`. If `flags.blog === false`, the Blog section and nav item are hidden. On any failure it returns `{ flags: {} }` (blog shows).
- `VITE_USE_API_PROJECTS=false` forces local projects. `VITE_USE_API_BLOG=false` disables blog entirely.

### Env vars (see `.env.example`)

| Var | Default | Purpose |
|---|---|---|
| `VITE_API_BASE` | `http://localhost:8080` | Backend API root |
| `VITE_USE_API_PROJECTS` | `true` | Use API projects or local only |
| `VITE_USE_API_BLOG` | `true` | Use API blog or none |
| `VITE_FORMSPREE_ID` | empty | Contact form endpoint (`https://formspree.io/f/{id}`). **Form is disabled until this is set.** |

`.env` exists locally (gitignored). Never commit it.

## Conventions

- **No code comments** unless explicitly requested.
- Component files are `.jsx` (no TypeScript). Use named `export default function ComponentName()`.
- Relative imports stay local; cross-tree imports use the `@/` alias (e.g. `@/context/SoundProvider`).
- Styling: prefer Tailwind utility classes + the theme tokens (`text-fg`, `text-muted`, `text-dim`, `border-border`, `bg-bg`, fonts `font-display`/`font-body`). CSS vars also exist in `:root`.
- Dark theme only. Section ids match nav anchors: `#home`, `#projects`, `#about`, `#stats`, `#blog`, `#social`.
- Interactive elements that should show the custom target cursor get the class `cursor-target`.
- Sound: use the `useSound()` hook (`playClick`, `playHover`, `playNav`, `playSuccess`, `playSection`, `toggleMute`). Do not create new `Howl` instances outside `SoundProvider`.
- Accessibility: `prefers-reduced-motion` is respected globally (GlobalEffects disables Silk/TargetCursor; CSS kills animations). Keep mobile (<768px) free of the WebGL background and custom cursor.
- Reuse existing effect components (GlassSurface, AnimatedContent, DecryptedText, CountUp, etc.) instead of adding new animation libs.

## Known problems & open tasks

Verified `npm run build` output: main chunk **647 kB** + Silk chunk **866 kB** (gzip ~215 kB / ~233 kB). Vite emits chunk-size warnings.

High priority:
1. **Huge bundle / performance.** `Silk.jsx` (ogl/WebGL) is 866 kB on its own. Consider: code-splitting, `manualChunks`, removing/trimming Silk, or lazy-loading below-the-fold sections.
2. **Stale README.md.** It is the Create React App template (wrong scripts, port 3000, mentions `eject`/`npm test`). Rewrite to match Vite + this project.
3. **Dead code cleanup.** Unused components (not imported anywhere): `ChromaGrid.jsx`, `GlassIcons.jsx`, `SplashCursor.jsx`, `SplitText.jsx`, `TiltedCard.jsx`. Also empty/unused: `src/data/projects.JSON`, `src/store/` (both empty files), `src/setupTests.js` (imports a package that isn't installed). Verify before deleting.
4. **Fabricated/placeholder data.**
   - `Stats.jsx`: hardcoded fake LinkedIn stats (2 years, 10 projects, "Software Development Intern") and fake LeetCode fallback numbers (150 solved / rank 125000). Remove hardcoding or source real data.
   - `content.json`: `"company": "XYZ Company"`, "BTech Completed 2024", `photo: "/me.jpg"` (file does not exist — relies on GitHub avatar fallback), and `via.placeholder.com` image URLs in the OpenCV project. Replace with real content or remove.
5. **Contact form is inert.** Needs `VITE_FORMSPREE_ID`; without it the button only shows a warning message. Decide: enable Formspree or remove the form.

Medium priority:
6. **Missing assets.** `public/me.jpg` and `public/audio/ambient.mp3` are referenced but don't exist (SoundProvider falls back to a generated drone tone; About falls back to GitHub avatar). Add real files or drop references.
7. **Backend coupling (partially addressed).** Category filter hides when `/api/portfolio/categories` is down (`getCategories()` falls back to the widget catalog's `topCategories`, then `[]`). Note: when the API returns zero projects for a filter, `getProjects` currently falls back to the full legacy list — revisit so an empty filtered result stays empty.
8. **No lint/format tooling.** Add ESLint (+ optional Prettier) and a `lint` script so agents/humans can verify code style consistently.

Low priority / polish:
9. **SEO/social meta.** `index.html` has only a basic description. Add Open Graph / Twitter cards and favicon variants already present (`logo192.png`, `logo512.png`, `manifest.json` for PWA).
10. **Unused deps audit.** `@gsap/react`, `three`, `@react-three/fiber`, `ogl`, `motion` overlap; some may be unused once dead components are removed. Prune to shrink node_modules/bundle.
11. **Redundant content sources.** `src/resources/README.md` and `contentApi.js` both document the API mapping — keep in sync when changing the API.

## Rules of thumb for agents

- Verify every change with `npm run build`.
- If you edit `content.json`, keep the JSON schema intact (components read specific keys: `home.nav`, `about.timeline`, `projects.items`, `social.links`, `stats.profiles`).
- If you add an animation/effect, check `src/components/` for an existing equivalent first.
- Never hardcode personal data (stats, links, employer names) — put it in `content.json` or env vars.
- Do not remove the graceful fallbacks in `contentApi.js` — the site must render with the backend down.
