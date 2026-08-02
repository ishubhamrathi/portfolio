# Content resources

`content.json` remains the **fallback / migration source** for Home, About, Social, Stats labels, and legacy projects.

## Live APIs (`VITE_API_BASE`, default `http://localhost:8080`)

| Endpoint | Used for |
|---|---|
| `GET /api/portfolio/projects` | Projects grid — returns `{ projects: { title, items: [...] } }` |
| `GET /api/portfolio/projects/{id}` | Project detail (404 if not SHOW) |
| `GET /api/portfolio/categories` | Filter chips — returns `{ categories: ["web-apps", "tools"] }` |
| `GET /api/v1/widget/PFP` | Widget catalog (`metadata.catalog`) — used to resolve tech names/icons |
| `GET /api/blog/posts` | Blog section |
| `GET /api/blog/posts/{slug}` | Blog detail |
| `GET /api/features?category=portfolio` | Feature flags (e.g. hide blog) |

Auth: none. GET only. The public projects service returns only `visibility_status = 'SHOW'` items, sorted by `sort_order`.

## Query params (`GET /api/portfolio/projects`)

| Param | Meaning |
|---|---|
| `categoryPath` | Optional — filter by a `category_path` value from `/api/portfolio/categories` |
| `limit` | Optional — max items (cap 200) |

## Frontend mapping (public API → UI)

The public project shape is mapped in `mapApiProject()` (`src/services/contentApi.js`). Both the refreshed schema and the legacy camelCase shape are accepted. `status`, `topCategory`, `visibility` arrive as `{ value, label }` objects; `tech` arrives as an array of `{ value, label, icon }` (icon is a URL, e.g. `https://cdn.simpleicons.org/react`).

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
