# "Become a Star" — Stars API requirements

Backend contract for the `Become a Star` portfolio section (`#star`). A cosmic arcade machine assigns every visitor a unique **identity** from a client-side catalog (54 predefined identities, rarity-weighted), then posts it to a **shared, permanent** constellation wall. Unlike `/api/content`, this endpoint is **optional**: if it fails or is not implemented yet, the section renders a graceful offline state (ambient sky + local-only "join", identities still work). It must **never** take down the rest of the site.

Base URL: `VITE_API_BASE` (default `http://localhost:8080`). CORS must allow the portfolio origin (same policy as `/api/content` and `/api/contact`).

## Identity catalog (client-side)

The catalog lives in `src/components/BecomeAStar/starIdentities.js` and is **not** served by the backend. Each identity:

```js
{ id: 'comet', name: 'Comet', title: 'The Swift Messenger', rarity: 'common', description: '…' }
```

Rarities & weights (pick = weighted random, then uniform pick within the rarity):

| Rarity | Weight | Catalog count | Visual |
|---|---|---|---|
| `common` | 70 | 36 | glow alpha 0.17 |
| `rare` | 20 | 11 | glow alpha 0.30 |
| `epic` | 8 | 5 | glow alpha 0.40 + thin ring |
| `legendary` | 2 | 2 | glow alpha 0.50 + orbiting particles |

The frontend **only sends `identity` + `color`** to the backend — the backend stores the identity id, the client enriches it to name/title/rarity/description via the catalog. The backend should validate `identity` against the 54 known ids and reject unknown values with `400`.

## Endpoints

### `GET /api/stars`

Returns the current constellation plus aggregate counters. Used by `getStars()` (`src/services/contentApi.js`).

```json
{
  "stars": [
    {
      "id": "star_01J9Y3…",
      "identity": "comet",
      "color": "#fff8e1",
      "added_at": "2026-08-13T14:22:00Z"
    }
  ],
  "meta": {
    "total_stars": 1284,
    "visitor_has_star": false,
    "visitor_star": null
  }
}
```

**Contract notes**
- `stars` — newest first. Return **all** rows (frontend renders on a canvas and is built for thousands). If payload size is a concern, cap at ~10 000 rows and keep `meta` totals exact.
- `id` — stable string (used by the frontend as a seeded position hash, so positions must be deterministic per id across requests).
- `identity` — one of the 54 catalog ids. The client calls `enrichStar()` to attach `name`, `title`, `rarity`, `description`.
- `color` — one of the client palette hex values (see below). Backend should validate / clamp to the palette and fall back to `#fff8e1` (warm white).
- `added_at` — ISO 8601 timestamp (rendered as "Discovered Aug 2026").
- `meta.visitor_has_star` / `meta.visitor_star` — whether **this** visitor already contributed, and their star row if so (drives the "one star per visitor" UI). Identify the visitor by IP + optional short-lived cookie. Frontend also blocks a second join locally after a successful POST.
- Frontend renders positions itself from the id hash — the backend does **not** need to store `x`/`y`.

### `POST /api/stars`

Creates a new anonymous star from a machine-granted identity. Used by `addStar()`.

```json
// Request body (all fields optional except identity)
{
  "identity": "comet",
  "color": "#fff8e1"
}
```

```json
// 201 Created
{
  "star": {
    "id": "star_01J9Y3…",
    "identity": "comet",
    "color": "#fff8e1",
    "added_at": "2026-08-13T09:10:00Z"
  },
  "meta": {
    "total_stars": 1285,
    "visitor_has_star": true,
    "visitor_star": { "id": "star_01J9Y3…", "identity": "comet", "color": "#fff8e1", "added_at": "2026-08-13T09:10:00Z" }
  }
}
```

**Contract notes**
- Enforce **one star per visitor** (IP + cookie): a second POST should return `409 Conflict` (frontend maps this to `{ conflict: true }`). Include the visitor's existing star in the `409` body's `meta.visitor_star` so the client can recover the identity.
- Basic rate limiting is recommended (e.g. a few requests/minute per IP).
- Persistence must be permanent (database row, not in-memory).
- Unknown `identity` → `400` with `{ "error": "…" }`.
- On other validation failure return `400` with a `{ "error": "…" }` JSON body.

### `PATCH /api/stars/me`

Recasts **this visitor's** existing star in place — same star id (same deterministic position), new `identity`/`color`. Used by `recast()` (`src/services/contentApi.js`) via the "Recast my star" card button or the spam-click easter egg (tap the constellation panel 7× quickly). Best-effort — the frontend also updates localStorage, so a missing or failing endpoint never breaks the recast flow (the star is **updated, never deleted**).

```json
// Request body
{
  "identity": "aurora",
  "color": "#c4b5fd"
}
```

```json
// 200 OK
{
  "star": {
    "id": "star_01J9Y3…",
    "identity": "aurora",
    "color": "#c4b5fd",
    "added_at": "2026-08-13T09:10:00Z"
  },
  "meta": {
    "total_stars": 1285,
    "visitor_has_star": true,
    "visitor_star": { "id": "star_01J9Y3…", "identity": "aurora", "color": "#c4b5fd", "added_at": "2026-08-13T09:10:00Z" }
  }
}
```

**Contract notes**
- Identify the visitor exactly like `POST` (IP + cookie). If the visitor has no star, `404` with `{ "error": "…" }` is acceptable.
- Keep the same `id` (and therefore `added_at`) — the client relies on the id for the star's fixed position.
- After the update, `GET /api/stars` must reflect the new `identity`/`color` for that row.

### Failure behavior (frontend)

- `GET /api/stars` failure → section shows "Constellation offline" pill, the wall renders a calm ambient sky, and the machine still works (identities are client-side; a joined star is saved to localStorage `sr:my-star` only). Details are logged to the console only.
- `POST /api/stars` failure → local star still joins the wall and the "Your Star" card appears; generic copy ("The star couldn't take off. Try again.") — never raw status codes or URLs.

## Star color palette

The frontend exposes exactly these swatches (calm, non-neon). Backend may store any value but should clamp out-of-palette colors to the nearest listed value.

| Hex | Tone |
|---|---|
| `#fff8e1` | warm white |
| `#ffd9a8` | peach |
| `#fde68a` | gold |
| `#fbcfe8` | rose |
| `#c4b5fd` | violet |
| `#c7d2fe` | periwinkle |
| `#a7f3d0` | mint |

## Reference implementation

- Frontend consumer: `src/services/contentApi.js` (`getStars`, `addStar`, `mapApiStar`).
- Identity catalog + rarity logic: `src/components/BecomeAStar/starIdentities.js`.
- Section: `src/components/BecomeAStar/` (`BecomeAStar.jsx`, `StarMachine.jsx`, `StarField.jsx`, `useStars.js`).
- This doc lives alongside `src/resources/README.md` — keep both in sync when the contract changes.