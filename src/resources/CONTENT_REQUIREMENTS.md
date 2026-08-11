# `/api/content` — Backend Data Requirements

The frontend is **API-only**. `App.jsx` calls `checkContent()` (in `src/services/contentApi.js`) on boot. If `GET {VITE_API_BASE}/api/content` fails **or any core section is missing/invalid**, it logs the error to the console and renders the **MaintenanceScreen** instead of the page.

## Hard gate (what `checkContent()` requires)

| Requirement | Rule |
|---|---|
| HTTP status | `200 OK` (any other status → maintenance) |
| `response` | valid JSON object |
| `response.home` | non-empty object |
| `response.about` | non-empty object |
| `response.stats` | non-empty object |
| `response.portfolio.projects.items` | non-empty array |
| `response.socials.socials` | non-empty array (items need `name` + `link`) |

> The gate is shallow (non-empty). The sections below are the full field shapes the components actually read — missing fields degrade gracefully, but serving them keeps the site complete.

---

## `home` — Hero + nav labels

Consumed by `Home.jsx` and `App.jsx` (`SiteNav`).

```json
{
  "greeting": "Hi, I am",
  "name": "Shubham Rathi",
  "typewriter": ["Shubham Rathi", "Full Stack Developer", "Computer Vision Enthusiast"],
  "contactButton": "Get In Touch",
  "nav": {
    "home": "Home",
    "projects": "Projects",
    "about": "About",
    "blog": "Blog",
    "contact": "Contact"
  }
}
```

| Field | Type | Used for |
|---|---|---|
| `greeting` | string | small uppercase line above the name |
| `name` | string | big hero heading |
| `typewriter` | string[] | rotating typewriter roles |
| `contactButton` | string | CTA button label |
| `nav` | object | nav item labels (`nav.home`, `nav.projects`, `nav.about`, `nav.blog`, `nav.contact`) |

## `about` — Profile card + timeline + skills + achievements

Consumed by `About.jsx`.

```json
{
  "name": "Shubham Rathi",
  "title": "About Me",
  "photo": "https://example.com/me.jpg",
  "photoFallback": "https://github.com/ishubhamrathi.png",
  "role": "Full Stack Developer",
  "intro": ["Paragraph 1...", "Paragraph 2..."],
  "timeline": {
    "education": {
      "date": "2024",
      "title": "BTech Completed",
      "description": "Bachelor of Technology in Computer Science",
      "institution": "Lovely Professional University"
    },
    "internship": {
      "date": "2023 - Present",
      "title": "Software Development",
      "company": "Real Company Name",
      "note": "(Started during final year of BTech)",
      "responsibilities": ["Bullet 1...", "Bullet 2..."]
    },
    "freelance": {
      "date": "2022 - 2023",
      "title": "Freelance Developer",
      "description": "Various Projects",
      "responsibilities": ["Bullet 1..."]
    }
  },
  "skills": {
    "title": "Skills",
    "categories": {
      "frontend": { "title": "Frontend", "items": ["React", "HTML", "CSS"] },
      "backend": { "title": "Backend", "items": ["Node.js", "Python"] },
      "databases": { "title": "Databases", "items": ["MongoDB", "MySQL"] },
      "tools": { "title": "Tools", "items": ["Git", "Docker", "AWS"] },
      "other": { "title": "Other", "items": ["OpenCV", "ML"] }
    }
  },
  "achievements": {
    "title": "Achievements",
    "items": ["Achievement 1...", "Achievement 2..."]
  }
}
```

| Field | Type | Used for |
|---|---|---|
| `name` | string | ID-card name on the reflective photo |
| `title` | string | section heading |
| `photo` | string (URL) | profile image (falls back to `photoFallback` on load error) |
| `photoFallback` | string (URL) | avatar fallback if `photo` fails/absent |
| `role` | string | role line on the ID card |
| `intro` | string[] | paragraphs under the photo |
| `timeline.education` / `timeline.internship` / `timeline.freelance` | objects | 3 glass cards (any can be omitted; `internship`/`freelance` render `company`/`responsibilities`) |
| `skills.title` | string | section subheading |
| `skills.categories` | object of `{ title, items: string[] }` | skill tags fed to the logo marquee |
| `achievements.title` / `achievements.items` | string / string[] | achievement list |

## `stats` — Coding profiles section

Consumed by `Stats.jsx`.

```json
{
  "title": "Coding Profiles & Stats",
  "profiles": {
    "leetcode": {
      "title": "LeetCode",
      "profile": "https://leetcode.com/ishubhamrathi"
    },
    "github": {
      "title": "GitHub",
      "profile": "https://github.com/ishubhamrathi"
    },
    "linkedin": {
      "title": "LinkedIn",
      "profile": "https://www.linkedin.com/in/ishubhamrath"
    }
  }
}
```

| Field | Type | Used for |
|---|---|---|
| `title` | string | section heading |
| `profiles.leetcode` / `profiles.github` / `profiles.linkedin` | `{ title, profile }` | card headings + "View Profile" links. Live numbers are fetched client-side from LeetCode/GitHub using `VITE_PLATFORM_API_KEY` (sent as `X-API-Key`). |

## Notes

- `portfolio`, `socials`, `blogs`, `feature_flags`, `books` are **already served correctly** — no changes needed there.
- Project/social/blog field mappings: see `src/resources/README.md`.
- Frontend always calls with header `X-API-Key: <VITE_PLATFORM_API_KEY>` (when set).
- Keep this file in sync with `contentApi.js` and `src/resources/README.md`.
