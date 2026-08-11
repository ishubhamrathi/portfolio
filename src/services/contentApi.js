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
  const carouselImages = Array.isArray(project.carousel_images_url)
    ? project.carousel_images_url
    : Array.isArray(project.carouselImages)
      ? project.carouselImages
      : []
  const tech = normalizeTech(Array.isArray(project.tech) ? project.tech : project.tags)
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
    tech,
    tags: tech,
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
    const ff = data?.feature_flags || {}
    return { flags: ff.flags || {} }
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

/** API key used to authenticate third-party platform API calls (GitHub, LeetCode, etc.). */
export function getPlatformApiKey() {
  return import.meta.env.VITE_PLATFORM_API_KEY || ''
}

export { API_BASE }
