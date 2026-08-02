# Content resources

`content.json` remains the **fallback / migration source** for Home, About, Social, Stats labels, and legacy projects.

## Live APIs (`VITE_API_BASE`, default `http://localhost:8080`)

| Endpoint | Used for |
|---|---|
| `GET /api/portfolio/projects` | Projects grid |
| `GET /api/portfolio/projects/{id}` | Project detail |
| `GET /api/portfolio/categories` | Category filters |
| `GET /api/blog/posts` | Blog section |
| `GET /api/blog/posts/{slug}` | Blog detail |
| `GET /api/features?category=portfolio` | Feature flags (e.g. hide blog) |

Auth: none. GET only.

## Frontend mapping (API → UI)

| API field | UI field |
|---|---|
| `thumbnailUrl` / `imageUrl` | `image` |
| `tags` | `tech` |
| `projectUrl` | `deployed` |
| `metadata.github` | `github` |
| `metadata.status` | `status` (`Completed` / `Ongoing`) |

If the API is down, projects fall back to `content.json` items (kept intact).

## Suggested backend schema additions (optional, for a cleaner fit)

These are **not required** — the mapper already reads them from `metadata` when present:

1. **`githubUrl`** (or document `metadata.github`) — portfolio cards show a GitHub link today.
2. **`status`** (`Completed` \| `Ongoing`) — or `metadata.status`.
3. **Home / About / Social** endpoints later — still served from `content.json` until you migrate.
4. Prefer absolute `thumbnailUrl` / `imageUrl` (or `/a/{shortCode}` that the browser can load cross-origin with CORS).

## Env

See `.env.example`.
