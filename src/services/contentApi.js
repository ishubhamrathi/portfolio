import content from '@/resources/content.json'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080'

async function fetchJson(url) {
  const response = await fetch(url, { method: 'GET' })
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
 * Items may be plain codes (legacy) or `{ value, label, icon }` objects (public API).
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
 * Accepts the refreshed public schema (snake_case columns, urls, metadata)
 * and the legacy camelCase shape so both keep working.
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

/** Map legacy content.json project → same UI shape. */
export function mapLegacyProject(project, index = 0) {
  return {
    id: project.id || `legacy-${index}`,
    title: project.title,
    shortDescription: project.shortDescription || '',
    description: project.description || '',
    image: project.image || '',
    imageUrl: project.image || '',
    thumbnailUrl: project.image || '',
    carouselImages: Array.isArray(project.carouselImages) ? project.carouselImages : [],
    tech: normalizeTech(project.tech || []),
    tags: normalizeTech(project.tech || []),
    github: project.github || '',
    deployed: project.deployed || '',
    projectUrl: project.deployed || '',
    categoryPath: project.categoryPath || 'legacy',
    topCategory: project.topCategory || '',
    status: project.status || 'Completed',
    statusLabel: statusLabel(project.status || 'Completed'),
    topCategoryLabel: topCategoryLabel(project.topCategory || ''),
    visibility: project.visibility || 'SHOW',
    visibilityLabel: '',
    mediaType: project.mediaType,
    mediaUrls: project.mediaUrls,
    sortOrder: index,
    metadata: {},
    source: 'legacy',
  }
}

const LEGACY_SOCIAL_SLUGS = {
  GITHUB: 'github',
  LINKEDIN: 'linkedin',
  INSTAGRAM: 'instagram',
  EMAIL: 'maildotru',
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

/** Map a legacy content.json social entry ({ name, link, ... }) → UI social shape. */
export function mapLegacySocial(social) {
  const name = (social.name || '').toUpperCase()
  const displayOrder = social.displayOrder ?? 0
  return {
    id: social.id || `legacy-social-${displayOrder}`,
    name,
    link: social.link || '',
    category: social.category || (name === 'EMAIL' ? 'SOCIAL' : 'CODING_PROFILE'),
    displayOrder,
    iconStyle: 'line',
    iconSlug: LEGACY_SOCIAL_SLUGS[name] || 'link',
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
  // Not yet on backend — keep local content for migration
  return content.home
}

export async function getAbout() {
  return content.about
}

/**
 * Prefer live socials from the consolidated /api/content endpoint
 * (response.socials — active rows sorted by display_order); fall back to
 * content.json so the footer always renders.
 * Set VITE_USE_API_SOCIAL=false to force local-only during migration.
 */
export async function getSocial() {
  const legacyLinks = Object.entries(content.social?.links || {}).map(([key, link], i) =>
    mapLegacySocial({ id: `legacy-social-${i}`, name: key, link, displayOrder: i })
  )
  const title = content.social?.title || 'Follow Me'

  if (import.meta.env.VITE_USE_API_SOCIAL === 'false') {
    return { title, links: legacyLinks, source: 'legacy', legacyLinks }
  }

  try {
    const data = await fetchContent()
    const apiLinks = extractSocialList(data?.socials)
      .map(mapApiSocial)
      .filter((s) => s.name && s.link)
      .sort((a, b) => a.displayOrder - b.displayOrder)
    if (apiLinks.length) {
      return { title, links: apiLinks, source: 'api', legacyLinks }
    }
  } catch (error) {
    console.warn('Social API unavailable, using content.json', error)
  }
  return { title, links: legacyLinks, source: 'legacy', legacyLinks }
}

export async function getStatsConfig() {
  return content.stats
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
  try {
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
    if (categories.length) return categories
  } catch (error) {
    console.warn('Categories unavailable from API', error)
  }
  const catalog = await getWidgetCatalog()
  if (catalog && catalog.topCategories.length) {
    return catalog.topCategories.map((c) => c.value)
  }
  const legacyValues = (content.projects?.items || []).map((p) => p.categoryPath).filter(Boolean)
  return [...new Set(legacyValues)]
}

/**
 * Prefer live portfolio API via the consolidated /api/content endpoint;
 * merge/fallback to content.json so nothing is removed.
 * Set VITE_USE_API_PROJECTS=false to force local-only during migration.
 *
 * GET /api/content → response.portfolio.projects.items (public schema, visibility=SHOW only).
 */
export async function getProjects({ categoryPath, limit } = {}) {
  const useApi = import.meta.env.VITE_USE_API_PROJECTS !== 'false'
  const legacyItems = (content.projects?.items || []).map(mapLegacyProject)
  const title = content.projects?.title || 'Projects'

  if (!useApi) {
    return { title, items: legacyItems, source: 'legacy', count: legacyItems.length }
  }

  try {
    const data = await fetchContent()
    const block = data?.portfolio?.projects || { title, items: [] }
    let apiItems = (block.items || []).map(mapApiProject)

    if (categoryPath) {
      apiItems = apiItems.filter(
        (p) => p.categoryPath === categoryPath || p.topCategory === categoryPath
      )
    }
    if (limit) {
      apiItems = apiItems.slice(0, limit)
    }

    const emptyFallback = apiItems.length === 0 && !categoryPath
    return {
      title: block.title || title,
      items: emptyFallback ? legacyItems : apiItems,
      legacyItems,
      categories: [],
      count: apiItems.length,
      source: emptyFallback ? 'legacy' : 'api',
    }
  } catch (error) {
    console.warn('Portfolio API unavailable, using content.json', error)
    return { title, items: legacyItems, source: 'legacy', count: legacyItems.length }
  }
}

export async function getProjectById(id) {
  try {
    const data = await fetchContent()
    const items = data?.portfolio?.projects?.items || []
    const found = items.find((p) => String(p.id) === String(id))
    return found ? mapApiProject(found) : null
  } catch {
    const legacy = (content.projects?.items || [])
      .map(mapLegacyProject)
      .find((p) => String(p.id) === String(id))
    return legacy || null
  }
}

/**
 * Map a backend blog post → UI blog shape.
 * Accepts the public API schema (snake_case columns, metadata) and the
 * legacy content.json shape so both keep working.
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

/** Map a legacy content.json blog post → same UI shape. */
export function mapLegacyBlogPost(post, index = 0) {
  return {
    id: post.id || `blog-${index}`,
    slug: post.slug || post.id || `blog-${index}`,
    title: post.title || '',
    excerpt: post.excerpt || '',
    content: post.content || post.excerpt || '',
    author: post.author || '',
    publishedAt: post.publishedAt || '',
    image: post.image || '',
    category: post.category || '',
    tags: Array.isArray(post.tags) ? post.tags : [],
    readingTime: post.readingTime || '',
  }
}

export async function getBlogPosts({ limit = 10 } = {}) {
  const useApi = import.meta.env.VITE_USE_API_BLOG !== 'false'
  const legacyPosts = (content.blogs?.posts || []).map(mapLegacyBlogPost)
  const title = content.blogs?.title || 'Blog'

  if (!useApi) {
    return { title, posts: legacyPosts.slice(0, limit), source: 'legacy', count: legacyPosts.length }
  }

  try {
    const data = await fetchContent()
    const posts = (data?.blogs?.posts || []).slice(0, limit).map(mapApiBlogPost)
    const emptyFallback = posts.length === 0
    return {
      title: data?.blogs?.title || title,
      posts: emptyFallback ? legacyPosts.slice(0, limit) : posts,
      legacyPosts,
      count: posts.length,
      source: emptyFallback ? 'legacy' : 'api',
    }
  } catch (error) {
    console.warn('Blog API unavailable, using content.json', error)
    return { title, posts: legacyPosts.slice(0, limit), source: 'legacy', count: legacyPosts.length }
  }
}

export async function getBlogPost(slug) {
  const useApi = import.meta.env.VITE_USE_API_BLOG !== 'false'

  if (useApi) {
    try {
      const data = await fetchContent()
      const posts = data?.blogs?.posts || []
      const found = posts.find((p) => p.slug === slug || String(p.id) === String(slug))
      if (found) return mapApiBlogPost(found)
    } catch {
      // fall through to legacy
    }
  }

  const legacy = (content.blogs?.posts || [])
    .map(mapLegacyBlogPost)
    .find((p) => p.slug === slug || String(p.id) === String(slug))
  return legacy || null
}

export function getContactEndpoint() {
  return `${API_BASE}/api/contact`
}

export { API_BASE, content }
