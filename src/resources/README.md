# Content resources

The site is **API-only** — `content.json` was removed. If `GET /api/content` fails or is missing any core section (`home`, `about`, `stats`, portfolio projects, socials), `checkContent()` throws and `App.jsx` renders the **MaintenanceScreen** instead of the page.

> Backend must also serve `home`, `about`, and `stats`. Full field spec: see [`CONTENT_REQUIREMENTS.md`](./CONTENT_REQUIREMENTS.md).

## Live APIs (`VITE_API_BASE`, default `http://localhost:8080`)

| Endpoint | Used for |
|---|---|
| `GET /api/content` | **Consolidated public content** — socials, portfolio projects, blog posts, feature flags in one call |
| `GET /api/content/types` | Available content types (`["socials", "portfolio", "blogs", "feature_flags"]`) |
| `GET /api/v1/widget/PFP` | Widget catalog (`metadata.catalog`) — used to resolve tech names/icons |
| `GET /api/stars` | **Become a Star** — shared constellation wall + totals (see [`STARS_API.md`](./STARS_API.md)) |
| `POST /api/stars` | **Become a Star** — place a machine-granted identity star (one per visitor) |
| `PATCH /api/stars/me` | **Become a Star** — recast this visitor's existing star in place (same id, new identity) |

Auth: none. GET only. All public content is fetched with a single `GET /api/content` call (cached per-session). The public projects service returns only `visibility_status = 'SHOW'` items; blog posts return only published entries.

## Query params (`GET /api/content`)

| Param | Meaning |
|---|---|
| `type` | Optional — comma-separated subset (e.g. `portfolio,blogs`); omit for all |
| `portfolio_limit` | Optional — cap portfolio items |
| `blogs_limit` | Optional — cap blog posts |
| `socials_limit` | Optional — cap social links |
| `feature_category` | Optional — feature flag scope (default `portfolio`) |

> Project detail and blog detail pages find individual items client-side from the cached `/api/content` portfolio/blogs response (no separate detail endpoints).

## Frontend mapping (public API → UI)

Public project data lives under `response.portfolio.projects.items` in the `GET /api/content` response. The first project is mapped by `mapApiProject()` (`src/services/contentApi.js`). Both the refreshed schema and the legacy camelCase shape are accepted. `status`, `topCategory`, `visibility` arrive as `{ value, label }` objects; `tech` arrives as an array of `{ value, label, icon }` (icon is a URL, e.g. `https://cdn.simpleicons.org/react`).

| Public API field | UI field |
|---|---|
| `title` | `title` |
| `shortDescription` (HTML) | `shortDescription` — **card preview on the front page** (tags stripped for the clamp) |
| `description` (rich HTML) | `description` — rendered in the detail modal (`.project-rich-text`) |
| `image` | `image` (thumbnail) |
| `carouselImages` | `carouselImages` (detail modal gallery) |
| `screenshots` `[url]` | `screenshots` — ordered preview sequence for the showcase; falls back to `carouselImages`, then the single `image` |
| `tech` `[{ value, label, icon }]` | `tech` — normalized to `[{ code, label, icon }]` |
| `metrics` `[{ value, label }]` or `[{ before, after, label }]` | `metrics` — normalized by `normalizeMetrics()`; before/after pairs render as `"before → after"` (used by the case-study scroll experience) |
| `previewType` (`auto` \| `browser` \| `phone` \| `tablet` \| `laptop`) | `previewType` — optional showcase override; `auto` (default) detects device framing from the image aspect ratio |
| `github` | `github` (null-safe) |
| `deployed` | `deployed` (null-safe) |
| `status` `{ value, label }` | `status` + `statusLabel` |
| `topCategory` `{ value, label }` | `topCategory` + `topCategoryLabel` |
| `categoryPath` | `categoryPath` |
| `visibility` `{ value, label }` | `visibility` (already SHOW-filtered) |
| `createdAt` / `updatedAt` | passthrough |

### Social links (footer)

Public social data lives under `response.socials` in the `GET /api/content` response — an array of active rows (sorted by `display_order`). `getSocial()` (`src/services/contentApi.js`) normalizes each row with `mapApiSocial()`. The consolidated endpoint must also serve `response.home`, `response.about`, and `response.stats` (consumed by `getHome()`, `getAbout()`, `getStatsConfig()`) — any missing section throws `ContentUnavailableError` and shows the maintenance screen.

| Public API field | UI field |
|---|---|
| `name` (`GITHUB`, `LINKEDIN`, …) | `name` |
| `link` | `link` |
| `iconUrl` (direct icon URL, e.g. `https://cdn.simpleicons.org/github`) | `iconUrl` — used as the icon `src` when present |
| `icon` JSONB `{ style, line, monochrome, normal, filled }` | `iconSlug` (variant chosen by `style`) + `iconStyle` — fallback when `iconUrl` is absent |
| `category` (`SOCIAL` / `CODING_PROFILE`) | `category` |
| `displayOrder` | `displayOrder` (dock sort order) |

The dock renders each icon as `<img src="https://cdn.simpleicons.org/{iconSlug}">`; `EMAIL` links are opened via `mailto:`.

### Lookup tables (in `contentApi.js`)

- `STATUS_LABELS`: `COMPLETED | IN_PROGRESS | ONGOING | PLANNED | ON_HOLD | ARCHIVED` → display labels.
- `TOP_CATEGORY_LABELS`: `FRONTEND | BACKEND | FULLSTACK | MOBILE | DATABASE | CLOUD_DEVOPS | AI_ML` → display labels.
- `TECH_LABELS`: static code → name fallback (`REACTJS` → React, etc.) used only when a `tech` entry is a plain code (legacy data).
- `normalizeTech()`: turns `tech` entries (objects or plain codes) into `[{ code, label, icon }]` so cards can render icon + label directly.
- `buildTechLookup(catalog)` / `getWidgetCatalog()`: retained utilities for resolving codes from the widget catalog if ever needed; the public API already returns label/icon per tech item, so the UI does not depend on them.

## Widget catalog (`GET /api/v1/widget/PFP`)

`metadata.catalog` is normalized by `getWidgetCatalog()` into:

```js
{
  statuses:           [{ value, label }],
  visibilityStatuses: [{ value, label }],
  topCategories:      [{ value, label, icon? }],
  subCategories:      [{ value, label, icon?, dependsOn?, group? }]  // flat + groups merged
}
```

- `sub_category` values are the codes used in a project's `tech` array; the widget catalog historically supplied their names/icons, but the public API now returns `tech` items with `label`/`icon` inline, so this endpoint is only a fallback/reference.
- If `metadata.catalog` is absent, values fall back to the widget column options (`project_status`, `visibility_status`, `top_category`).
- On any failure `getWidgetCatalog()` returns `null`; the Projects section still renders fine because tech label/icon come from each project item.

## Feature flags

Feature flags live under `response.feature_flags.flags` (consumed by `getFeatures()` → `App.jsx` `flags` state). A missing/empty object enables all default behavior.

| Flag | Type | Default | Consumed by | Effect |
|---|---|---|---|---|
| `blog` | boolean | `true` | `App.jsx`, `Home.jsx` (nav) | When `false`, the Blog section and nav item are hidden. |
| `FEATURE_CASE_STUDY_SCROLL_EXPERIENCE` | boolean | `false` | `Projects.jsx` | When `true`, projects open in the full-screen case-study scroll experience. |
| `FEATURE_AI_ASSISTANT_V2` | boolean | `false` | `AskMeAnything.jsx` | When `true`, renders the redesigned "Ask Shubham AI" assistant (glowing status dot, suggested-question chips, premium glass input, subtle grid background). When absent/false, the original "Ask Me Anything" component renders unchanged. |

## Env

See `.env.example`.

## Ask Me Anything (AMA) API

The AMA engine (`ama-demo-app`, backed by `ama-spring-boot-starter`) is a separate Spring Boot
service. All endpoints are relative to the service host (`VITE_API_BASE`). Content-Type is
`application/json; charset=utf-8`. Errors return `{ "error": "..." }` with human-friendly messages.

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/ama/ask` | POST | Submit a question. Returns `{ reference, questionId, status, mode, answered, answer, message }`. |
| `/api/ama/questions/{reference}` | GET | Poll a question until `status` is `PUBLISHED` (or `REJECTED`). |
| `/api/ama/health` | GET | Provider availability: `{ providers: [{ name, available }] }`. Non-blocking. |

**Frontend data access** (all in `contentApi.js`):

- `postQuestion(question, options?)` — POST `/api/ama/ask`. Throws `AmaError` (carrying `.status` + `.code`) on 4xx/5xx.
- `getQuestion(reference)` — GET `/api/ama/questions/{reference}`.
- `pollQuestion(reference, { interval, maxAttempts })` — polls every `interval` ms (default 3000)
  up to `maxAttempts` (default 20) until `status === 'PUBLISHED'` or `REJECTED`.
- `getAmaHealth()` — GET `/api/ama/health`. Returns `{ providers, available }` (never throws).
- `getAskEndpoint()` / `getAmaQuestionEndpoint(reference)` / `getAmaHealthEndpoint()` — URL helpers.

### Consumer: AskMeAnything.jsx

| Flag | UI behaviour |
|---|---|
| `FEATURE_AI_ASSISTANT_V2 === false` (default) | Legacy widget. Posts via `postQuestion()`; shows the immediate `answer` if `answered === true`, otherwise the `message` or a fallback. |
| `FEATURE_AI_ASSISTANT_V2 === true` | Redesigned "Ask Shubham AI" experience. Posts via `postQuestion()`, then polls `pollQuestion()` until the answer is published, showing a typing indicator during the wait. Shows provider-availability status via `getAmaHealth()` on mount. |

### Error handling

- `400` → the API's `error` string (e.g. "Question cannot be empty", "Too many questions…") is surfaced
  to the user **inside the chat** as an AI message — never as a raw status code or alert.
- `503` → shown as "Answering is temporarily unavailable. Please try again later." inside the chat.
- Network / unexpected errors → generic "Something went wrong. Please try again." inside the chat.
- Details are logged to the console.

## Become a Star (`#star`)

A cosmic arcade machine that assigns each visitor a unique identity from a 54-entry client-side catalog (rarity-weighted: common/rare/epic/legendary), then launches the star into a shared, permanent constellation wall. Unlike `/api/content`, this is **non-gating**: `GET /api/stars` failing only degrades the section (ambient sky + local-only join), never the whole site. Consumed via `getStars()` / `addStar()` in `contentApi.js`; catalog + rarity logic in `src/components/BecomeAStar/starIdentities.js`; section lives in `src/components/BecomeAStar/`. Full backend contract: [`STARS_API.md`](./STARS_API.md).

- Section + nav item render unless `feature_flags.light === false` (same pattern as `blog`).
- One star per visitor (backend enforces via IP/cookie; frontend blocks a second join locally + persists `sr:my-star` in localStorage). A local-only star is always rendered in the wall + counted even when the backend has 0 rows.
- Identities are decided client-side (`randomRarity()` + `randomIdentity()`); the backend stores only `identity` id + `color`.
- Recast: the "Your Star" card has a small "Recast my star" option (tap twice to confirm), plus an easy-to-remember easter egg — **click/tap anywhere in the constellation panel 7 times quickly** (a "keep tapping the sky…" hint appears after 4). It re-runs the machine in recast mode and **updates the same star in place** (same id/position, new identity/color), best-effort via `PATCH /api/stars/me`. The star is never deleted.
