# Content resources

`content.json` remains the **fallback / migration source** for Home, About, Social, Stats labels, and legacy projects.

## Live APIs (`VITE_API_BASE`, default `http://localhost:8080`)

| Endpoint | Used for |
|---|---|
| `GET /api/content` | **Consolidated public content** — socials, portfolio projects, blog posts, feature flags in one call |
| `GET /api/content/types` | Available content types (`["socials", "portfolio", "blogs", "feature_flags"]`) |
| `GET /api/v1/widget/PFP` | Widget catalog (`metadata.catalog`) — used to resolve tech names/icons |

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
| `tech` `[{ value, label, icon }]` | `tech` — normalized to `[{ code, label, icon }]` |
| `github` | `github` (null-safe) |
| `deployed` | `deployed` (null-safe) |
| `status` `{ value, label }` | `status` + `statusLabel` |
| `topCategory` `{ value, label }` | `topCategory` + `topCategoryLabel` |
| `categoryPath` | `categoryPath` |
| `visibility` `{ value, label }` | `visibility` (already SHOW-filtered) |
| `createdAt` / `updatedAt` | passthrough |

### Social links (footer)

Public social data lives under `response.socials` in the `GET /api/content` response — an array of active rows (sorted by `display_order`). `getSocial()` (`src/services/contentApi.js`) normalizes each row with `mapApiSocial()` and falls back to `content.json` on failure or when empty. Set `VITE_USE_API_SOCIAL=false` to force local-only.

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

## Env

See `.env.example`.
