const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080'

export class ContentUnavailableError extends Error {
  constructor(message = 'Website is under maintenance') {
    super(message)
    this.name = 'ContentUnavailableError'
  }
}

async function fetchJson(url) {
  const headers = getPlatformApiKey() ? { 'X-API-Key': getPlatformApiKey() } : {}
  const response = await fetch(url, { method: 'GET', headers })
  if (!response.ok) {
    throw new Error(`Request failed (${response.status}): ${url}`)
  }
  return response.json()
}

let contentCache = null
let contentPromise = null

async function fetchContent() {
  if (contentCache) return contentCache
  if (contentPromise) return contentPromise
  contentPromise = fetchJson(`${API_BASE}/api/content`)
    .then((data) => {
      contentCache = data
      return data
    })
    .catch((err) => {
      contentPromise = null
      throw err
    })
  return contentPromise
}

function requireSection(data, key) {
  const section = data?.[key]
  if (!section || typeof section !== 'object' || Object.keys(section).length === 0) {
    throw new ContentUnavailableError(`Missing content section: ${key}`)
  }
  return section
}

/**
 * Global availability gate. The site is fully API-driven now — content.json
 * was removed. If the consolidated /api/content call fails or is missing any
 * core section, this throws and the app renders the maintenance screen.
 */
export async function checkContent() {
  const data = await fetchContent()
  if (!data || typeof data !== 'object') {
    throw new ContentUnavailableError()
  }
  requireSection(data, 'home')
  requireSection(data, 'about')
  requireSection(data, 'stats')
  const projects = data?.portfolio?.projects?.items
  if (!Array.isArray(projects) || projects.length === 0) {
    throw new ContentUnavailableError('Missing content section: portfolio projects')
  }
  const socials = extractSocialList(data?.socials).filter((s) => s && s.name && s.link)
  if (socials.length === 0) {
    throw new ContentUnavailableError('Missing content section: socials')
  }
  return data
}

function toOptionList(options) {
  if (!Array.isArray(options)) return []
  return options
    .map((option) => {
      if (option && typeof option === 'object') {
        return {
          value: option.value ?? option.id ?? option.name ?? '',
          label: option.label ?? option.name ?? option.value ?? '',
          icon: option.icon,
          dependsOn: option.dependsOn,
          group: option.group,
        }
      }
      return { value: String(option), label: String(option) }
    })
    .filter((option) => option.value)
}

function normalizeCatalog(catalog = {}) {
  const subGroups = catalog.subCategories?.groups || catalog.groups || {}
  const flatSubs = Array.isArray(catalog.subCategories) ? toOptionList(catalog.subCategories) : []
  Object.entries(subGroups).forEach(([parent, list]) => {
    toOptionList(list).forEach((option) => {
      if (!option.dependsOn) option.dependsOn = parent
      if (!option.group) option.group = parent
      flatSubs.push(option)
    })
  })
  return {
    statuses: toOptionList(catalog.statuses),
    visibilityStatuses: toOptionList(catalog.visibilityStatuses),
    topCategories: toOptionList(catalog.topCategories),
    subCategories: flatSubs,
  }
}

function widgetColumnOptions(column) {
  const raw = Array.isArray(column)
    ? column
    : Array.isArray(column?.options)
      ? column.options
      : Array.isArray(column?.values)
        ? column.values
        : []
  return toOptionList(raw)
}

export const STATUS_LABELS = {
  COMPLETED: 'Completed',
  IN_PROGRESS: 'In Progress',
  ONGOING: 'Ongoing',
  PLANNED: 'Planned',
  ON_HOLD: 'On Hold',
  ARCHIVED: 'Archived',
}

export const TOP_CATEGORY_LABELS = {
  FRONTEND: 'Frontend',
  BACKEND: 'Backend',
  FULLSTACK: 'Full Stack',
  MOBILE: 'Mobile',
  DATABASE: 'Database',
  CLOUD_DEVOPS: 'Cloud & DevOps',
  AI_ML: 'AI/ML',
}

export const TECH_LABELS = {
  REACTJS: 'React',
  REACT: 'React',
  NEXTJS: 'Next.js',
  NODEJS: 'Node.js',
  NODE: 'Node.js',
  EXPRESSJS: 'Express',
  EXPRESS: 'Express',
  SPRINGBOOT: 'Spring Boot',
  JAVA: 'Java',
  PYTHON: 'Python',
  OPENCV: 'OpenCV',
  TYPESCRIPT: 'TypeScript',
  JAVASCRIPT: 'JavaScript',
  HTML: 'HTML',
  CSS: 'CSS',
  TAILWIND: 'Tailwind CSS',
  MONGODB: 'MongoDB',
  MYSQL: 'MySQL',
  POSTGRESQL: 'PostgreSQL',
  STREAMLIT: 'Streamlit',
  DOCKER: 'Docker',
  AWS: 'AWS',
  GIT: 'Git',
  GITHUB: 'GitHub',
  AI: 'AI',
  ML: 'Machine Learning',
  NLP: 'NLP',
  'AI/ML': 'AI/ML',
  'COMPUTER VISION': 'Computer Vision',
}

export function statusLabel(status) {
  if (!status) return ''
  return STATUS_LABELS[status] || STATUS_LABELS[status.toUpperCase()] || status
}

export function topCategoryLabel(value) {
  if (!value) return ''
  return TOP_CATEGORY_LABELS[value] || TOP_CATEGORY_LABELS[value.toUpperCase()] || value
}

/** code → { code, label, icon } — merges static TECH_LABELS with catalog subCategories. */
export function buildTechLookup(catalog) {
  const lookup = {}
  Object.entries(TECH_LABELS).forEach(([code, label]) => {
    lookup[code] = { code, label }
  })
  ;(catalog?.subCategories || []).forEach((sub) => {
    lookup[sub.value] = { code: sub.value, label: sub.label || sub.value, icon: sub.icon }
  })
  return lookup
}

/** Normalize a `{ value, label }` enum object (or plain string) from the API. */
function toEnum(value) {
  if (value && typeof value === 'object') {
    return { value: value.value ?? '', label: value.label ?? '' }
  }
  return { value: value ?? '', label: '' }
}

/**
 * Normalize a metrics list into [{ value, label }].
 * Supports `{ value, label }`, `{ metric, title }`, or before/after
 * `{ before, after, label }` pairs (rendered as "before → after").
 */
function normalizeMetrics(metrics) {
  if (!Array.isArray(metrics)) return []
  return metrics
    .map((m) => {
      if (!m || typeof m !== 'object') return null
      const hasPair = m.before != null && m.after != null
      return {
        value: hasPair ? `${m.before} → ${m.after}` : (m.value ?? m.metric ?? ''),
        label: m.label ?? m.title ?? '',
      }
    })
    .filter((m) => m && (m.value || m.label))
}

/**
 * Normalize a tech list into [{ code, label, icon }].
 * Items may be plain codes or `{ value, label, icon }` objects (public API).
 */
function normalizeTech(tech) {
  if (!Array.isArray(tech)) return []
  return tech
    .map((item) => {
      if (item && typeof item === 'object') {
        const code = item.value ?? item.code ?? ''
        return { code, label: item.label || code, icon: item.icon || '' }
      }
      const code = String(item)
      return { code, label: TECH_LABELS[code] || code, icon: '' }
    })
    .filter((t) => t.code)
}

/**
 * Map backend portfolio project → UI project shape.
 * Accepts the refreshed public schema (snake_case columns, urls, metadata).
 */
export function mapApiProject(project) {
  const meta = project.metadata && typeof project.metadata === 'object' ? project.metadata : {}
  const urls = project.urls && typeof project.urls === 'object' ? project.urls : {}
  const image =
    project.thumbnail_image_url || project.thumbnailUrl || project.imageUrl || project.image || ''
  const rawCarousel = Array.isArray(project.carousel_images_url)
    ? project.carousel_images_url
    : Array.isArray(project.carouselImages)
      ? project.carouselImages
      : []
  const carouselImages = image ? [] : rawCarousel.filter(Boolean)
  const screenshots = Array.isArray(project.screenshots)
    ? project.screenshots.filter(Boolean)
    : Array.isArray(meta.screenshots)
      ? meta.screenshots.filter(Boolean)
      : carouselImages
  const tech = normalizeTech(Array.isArray(project.tech) ? project.tech : project.tags)
  const metrics = Array.isArray(project.metrics)
    ? normalizeMetrics(project.metrics)
    : normalizeMetrics(meta.metrics)
  const github =
    project.github || urls.github || urls.repository || meta.github || meta.githubUrl || ''
  const deployed =
    project.deployed ||
    project.projectUrl ||
    urls.deployed ||
    urls.live ||
    urls.demo ||
    meta.deployed ||
    ''
  const categoryPath = project.category_path || project.categoryPath || ''
  const topCategory = toEnum(project.topCategory || project.top_category)
  const status = toEnum(project.status || meta.status)
  const visibility = toEnum(project.visibility || project.visibility_status)
  return {
    id: project.id,
    title: project.title || '',
    shortDescription: project.shortDescription || '',
    description: project.description || project.shortDescription || '',
    image,
    imageUrl: project.imageUrl || image,
    thumbnailUrl: project.thumbnailUrl || image,
    carouselImages,
    screenshots,
    tech,
    tags: tech,
    metrics,
    previewType: project.previewType || meta.previewType || 'auto',
    github,
    deployed,
    projectUrl: project.projectUrl || project.deployed || '',
    categoryPath,
    topCategory: topCategory.value,
    topCategoryLabel: topCategory.label || topCategoryLabel(topCategory.value),
    status: status.value,
    statusLabel: status.label || statusLabel(status.value),
    visibility: visibility.value,
    visibilityLabel: visibility.label,
    mediaType: meta.mediaType,
    mediaUrls: meta.mediaUrls,
    sortOrder: project.sortOrder ?? 0,
    metadata: meta,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  }
}

function extractSocialList(raw) {
  if (Array.isArray(raw)) return raw
  if (Array.isArray(raw?.socials)) return raw.socials
  if (Array.isArray(raw?.items)) return raw.items
  return []
}

/**
 * Map a backend social row (public API schema) → UI social shape.
 * `iconUrl` (direct icon URL) is preferred; legacy `icon` JSONB object
 * { style, line, monochrome, normal, filled } of simpleicons slugs still works.
 */
export function mapApiSocial(social) {
  const icon = social.icon && typeof social.icon === 'object' ? social.icon : {}
  const iconSlug =
    icon[icon.style] || icon.normal || icon.line || icon.monochrome || icon.filled || 'link'
  return {
    id: social.id,
    name: (social.name || '').toUpperCase(),
    link: social.link || '',
    category: social.category || 'SOCIAL',
    displayOrder: social.displayOrder ?? social.display_order ?? 0,
    iconStyle: icon.style || 'normal',
    iconSlug,
    iconUrl: social.iconUrl || '',
  }
}

export async function getFeatures() {
  try {
    const data = await fetchContent()
    const raw = data?.feature_flags?.flags || {}
    const flags = {}
    for (const [key, value] of Object.entries(raw)) {
      flags[key] =
        typeof value === 'object' && value !== null ? value.enabled === true : Boolean(value)
    }
    return { flags }
  } catch {
    return { flags: {} }
  }
}

export async function getHome() {
  return requireSection(await fetchContent(), 'home')
}

export async function getAbout() {
  return requireSection(await fetchContent(), 'about')
}

export async function getStatsConfig() {
  return requireSection(await fetchContent(), 'stats')
}

export async function getSocial() {
  const data = await fetchContent()
  const links = extractSocialList(data?.socials)
    .map(mapApiSocial)
    .filter((s) => s.name && s.link)
    .sort((a, b) => a.displayOrder - b.displayOrder)
  return {
    title: data?.social?.title || data?.socialsTitle || 'Follow Me',
    links,
    source: 'api',
  }
}

/**
 * Dropdown catalog (GET /api/v1/widget/PFP) normalized for the filter UI.
 * Returns { statuses, visibilityStatuses, topCategories, subCategories }
 * where each is [{ value, label, icon?, dependsOn?, group? }].
 * Returns null on failure (callers should hide the filter bar).
 */
export async function getWidgetCatalog() {
  try {
    const data = await fetchJson(`${API_BASE}/api/v1/widget/PFP`)
    const catalog = normalizeCatalog(data?.metadata?.catalog || {})
    if (!catalog.topCategories.length && data?.top_category) {
      catalog.statuses = catalog.statuses.length
        ? catalog.statuses
        : widgetColumnOptions(data.project_status)
      catalog.visibilityStatuses = catalog.visibilityStatuses.length
        ? catalog.visibilityStatuses
        : widgetColumnOptions(data.visibility_status)
      catalog.topCategories = catalog.topCategories.length
        ? catalog.topCategories
        : widgetColumnOptions(data.top_category)
    }
    return catalog
  } catch (error) {
    console.warn('Widget catalog unavailable', error)
    return null
  }
}

/** Category chips for the filter bar (categoryPath values). Derived from /api/content portfolio items. */
export async function getCategories() {
  const data = await fetchContent()
  const items = data?.portfolio?.projects?.items || []
  const categories = [
    ...new Set(
      items
        .map((p) => {
          const raw = p.category_path || p.categoryPath || p.top_category || p.topCategory
          if (raw && typeof raw === 'object') return raw.value
          return raw
        })
        .filter(Boolean)
    ),
  ]
  return categories
}

/**
 * Portfolio projects from the consolidated /api/content endpoint.
 * `items` are already SHOW-filtered and sorted by the backend.
 */
export async function getProjects({ categoryPath, limit } = {}) {
  const data = await fetchContent()
  const block = data?.portfolio?.projects || {}
  let apiItems = (block.items || []).map(mapApiProject)

  if (categoryPath) {
    apiItems = apiItems.filter(
      (p) => p.categoryPath === categoryPath || p.topCategory === categoryPath
    )
  }
  if (limit) {
    apiItems = apiItems.slice(0, limit)
  }

  return {
    title: block.title || 'Projects',
    items: apiItems,
    count: apiItems.length,
    source: 'api',
  }
}

export async function getProjectById(id) {
  const data = await fetchContent()
  const items = data?.portfolio?.projects?.items || []
  const found = items.find((p) => String(p.id) === String(id))
  return found ? mapApiProject(found) : null
}

/**
 * Map a backend blog post → UI blog shape.
 * Accepts the public API schema (snake_case columns, metadata).
 */
export function mapApiBlogPost(post) {
  const meta = post.metadata && typeof post.metadata === 'object' ? post.metadata : {}
  const image =
    post.image || post.coverImage || post.cover_image || meta.image || meta.coverImage || ''
  return {
    id: post.id,
    slug: post.slug || (post.id != null ? String(post.id) : ''),
    title: post.title || '',
    excerpt: post.excerpt || post.shortDescription || '',
    content: post.content || post.excerpt || '',
    author: post.author || meta.author || '',
    publishedAt: post.publishedAt || post.published_at || meta.publishedAt || '',
    image,
    category: post.category || post.categoryLabel || meta.category || '',
    tags: Array.isArray(post.tags)
      ? post.tags
      : Array.isArray(meta.tags)
        ? meta.tags
        : [],
    readingTime: post.readingTime || meta.readingTime || '',
  }
}

export async function getBlogPosts({ limit = 10 } = {}) {
  const data = await fetchContent()
  const posts = (data?.blogs?.posts || []).slice(0, limit).map(mapApiBlogPost)
  return {
    title: data?.blogs?.title || 'Blog',
    posts,
    count: posts.length,
    source: 'api',
  }
}

export async function getBlogPost(slug) {
  const data = await fetchContent()
  const posts = data?.blogs?.posts || []
  const found = posts.find((p) => p.slug === slug || String(p.id) === String(slug))
  return found ? mapApiBlogPost(found) : null
}

export function getContactEndpoint() {
  return `${API_BASE}/api/contact`
}

/** AMA (Ask Me Anything) endpoints — see src/resources/README.md */
export function getAskEndpoint() {
  return `${API_BASE}/api/ama/ask`
}

export function getAmaQuestionEndpoint(reference) {
  return `${API_BASE}/api/ama/questions/${encodeURIComponent(reference)}`
}

export function getAmaHealthEndpoint() {
  return `${API_BASE}/api/ama/health`
}

/**
 * AMA error: carries the user-facing `code` from the backend alongside the
 * HTTP `status`. Never surfaces raw technical details to the UI — the `code`
 * strings from the AMA API are already human-friendly.
 */
class AmaError extends Error {
  constructor(message, status, code) {
    super(message)
    this.name = 'AmaError'
    this.status = status
    this.code = code
  }
}

function parseAmaError(response) {
  return response.json().catch(() => ({ error: 'Something went wrong' })).then((data) => {
    const message = data?.error || 'Something went wrong'
    return new AmaError(message, response.status, message)
  })
}

/** POST /api/ama/ask — submit a question. Throws AmaError on non-2xx. */
export async function postQuestion(question, options = {}) {
  const body = { question: (question || '').trim().slice(0, 1000) }
  if (options.askerName) body.askerName = options.askerName.trim().slice(0, 120)
  if (options.askerEmail) body.askerEmail = options.askerEmail.trim()
  if (options.category) body.category = options.category.trim()
  if (options.mode) body.mode = options.mode

  const response = await fetch(getAskEndpoint(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    throw await parseAmaError(response)
  }
  return response.json()
}

/** GET /api/ama/questions/{reference} — fetch a question's current state. */
export async function getQuestion(reference) {
  const response = await fetch(getAmaQuestionEndpoint(reference), { method: 'GET' })
  if (!response.ok) {
    throw await parseAmaError(response)
  }
  return response.json()
}

/**
 * Poll GET /api/ama/questions/{reference} until the question is PUBLISHED
 * (answer available), REJECTED, or maxAttempts is reached.
 */
export async function pollQuestion(reference, { interval = 3000, maxAttempts = 20 } = {}) {
  let latest = await getQuestion(reference)
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (latest.status === 'PUBLISHED' && latest.answer) return latest
    if (latest.status === 'REJECTED') return latest
    await new Promise((resolve) => setTimeout(resolve, interval))
    latest = await getQuestion(reference)
  }
  return latest
}

/**
 * GET /api/ama/health — check whether AI providers are available.
 * Non-blocking: returns `{ providers, available }` even on failure so the
 * widget can degrade gracefully (e.g. queue questions for manual review).
 */
export async function getAmaHealth() {
  try {
    const response = await fetch(getAmaHealthEndpoint(), { method: 'GET' })
    if (!response.ok) return { providers: [], available: false }
    const data = await response.json()
    const providers = data?.providers || []
    return { providers, available: providers.some((p) => p.available) }
  } catch {
    return { providers: [], available: false }
  }
}
export function getPlatformApiKey() {
  return import.meta.env.VITE_PLATFORM_API_KEY || ''
}

/**
 * Fetch coding profile stats from the single backend endpoint
 * ({API_BASE}/api/coding-profiles). Returns normalized { github, leetcode }.
 */
export async function getCodingProfiles() {
  const data = await fetchJson(`${API_BASE}/api/coding-profiles`)
  const github = data?.github || {}
  const leetcode = data?.leetcode || {}
  const difficulty = leetcode.solvedByDifficulty || {}
  return {
    github: {
      login: github.login || '',
      name: github.name || '',
      avatarUrl: github.avatarUrl || '',
      htmlUrl: github.htmlUrl || '',
      bio: github.bio || '',
      location: github.location || '',
      company: github.company || '',
      blog: github.blog || '',
      twitterUsername: github.twitterUsername || '',
      publicRepos: github.publicRepos || 0,
      followers: github.followers || 0,
      following: github.following || 0,
      createdAt: github.createdAt || '',
    },
    leetcode: {
      username: leetcode.username || '',
      ranking: leetcode.ranking || 0,
      reputation: leetcode.reputation || 0,
      contributionPoints: leetcode.contributionPoints || 0,
      totalSolved: leetcode.totalSolved || 0,
      totalQuestions: leetcode.totalQuestions || 0,
      easy: difficulty.easy || 0,
      medium: difficulty.medium || 0,
      hard: difficulty.hard || 0,
      acceptedSubmissions: leetcode.acceptedSubmissions || 0,
      totalSubmissions: leetcode.totalSubmissions || 0,
      activeDays: leetcode.activeDays || 0,
      lastActiveAt: leetcode.lastActiveAt || '',
    },
  }
}

/**
 * Map a backend visitor star (public API schema) → UI star shape.
 * `identity` is the star identity id (resolved against the local catalog);
 * positions are derived client-side from `id`. `color` falls back to warm white.
 */
export function mapApiStar(raw = {}) {
  return {
    id: raw.id ?? raw.star_id ?? '',
    identity: raw.identity ?? raw.identity_id ?? raw.name ?? '',
    color: raw.color || '#fff8e1',
    addedAt: raw.added_at || raw.addedAt || raw.created_at || raw.createdAt || '',
  }
}

let starsCachePromise = null

/**
 * All discovered stars (GET {API_BASE}/api/stars). Non-blocking — the
 * Become a Star section degrades gracefully instead of gating the site.
 */
export async function getStars() {
  if (starsCachePromise) return starsCachePromise
  starsCachePromise = fetchJson(`${API_BASE}/api/stars`)
    .then((data) => {
      const stars = (data?.stars || []).map(mapApiStar)
      const meta = data?.meta || {}
      return {
        stars,
        totalStars: Number(meta.total_stars ?? meta.totalStars ?? stars.length) || 0,
        visitorHasStar: Boolean(meta.visitor_has_star ?? meta.visitorHasStar),
        visitorStar: meta.visitor_star ? mapApiStar(meta.visitor_star) : null,
        source: 'api',
      }
    })
    .catch((err) => {
      starsCachePromise = null
      console.warn('[stars] Could not load the constellation:', err)
      throw err
    })
  return starsCachePromise
}

/** Join the constellation (POST {API_BASE}/api/stars). Throws on failure. */
export async function addStar(payload = {}) {
  const body = {
    identity: (payload.identity || '').trim(),
    color: payload.color || '#fff8e1',
  }
  const response = await fetch(`${API_BASE}/api/stars`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (response.status === 409) {
    console.warn('[stars] Visitor already has a star')
    return { conflict: true, star: null, totalStars: 0 }
  }
  if (!response.ok) {
    const data = await response.json().catch(() => null)
    console.warn('[stars] Star request failed:', response.status, data?.error)
    throw new Error(`Star request failed (${response.status})`)
  }
  const data = await response.json().catch(() => null)
  const star = mapApiStar(data?.star || data || {})
  const meta = data?.meta || {}
  return {
    conflict: false,
    star,
    totalStars: Number(meta.total_stars ?? meta.totalStars ?? 0) || 0,
  }
}

/**
 * Recast this visitor's existing star (PATCH {API_BASE}/api/stars/me) so the
 * same star id keeps its position but takes a new identity/color. Best-effort —
 * returns `{ ok: false }` instead of throwing so the recast always works
 * locally (localStorage) even when the backend endpoint is missing/unreachable.
 */
export async function updateStar(payload = {}) {
  const body = {
    identity: (payload.identity || '').trim(),
    color: payload.color || '#fff8e1',
  }
  try {
    const response = await fetch(`${API_BASE}/api/stars/me`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!response.ok) throw new Error(`Star update failed (${response.status})`)
    const data = await response.json().catch(() => null)
    const star = mapApiStar(data?.star || data || {})
    const meta = data?.meta || {}
    return {
      ok: true,
      star,
      totalStars: Number(meta.total_stars ?? meta.totalStars ?? 0) || 0,
    }
  } catch (err) {
    console.warn('[stars] Could not update the star on the backend:', err)
    return { ok: false }
  } finally {
    starsCachePromise = null
  }
}

export { API_BASE }
