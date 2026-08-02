import content from '@/resources/content.json'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080'

async function fetchJson(url) {
  const response = await fetch(url, { method: 'GET' })
  if (!response.ok) {
    throw new Error(`Request failed (${response.status}): ${url}`)
  }
  return response.json()
}

/** Map backend portfolio project → UI project shape (keeps legacy fields). */
export function mapApiProject(project) {
  const meta = project.metadata && typeof project.metadata === 'object' ? project.metadata : {}
  return {
    id: project.id,
    title: project.title,
    description: project.description || '',
    image: project.thumbnailUrl || project.imageUrl || '',
    imageUrl: project.imageUrl || '',
    thumbnailUrl: project.thumbnailUrl || '',
    tech: Array.isArray(project.tags) ? project.tags : [],
    tags: Array.isArray(project.tags) ? project.tags : [],
    github: meta.github || meta.githubUrl || '',
    deployed: project.projectUrl || meta.deployed || '',
    projectUrl: project.projectUrl || '',
    categoryPath: project.categoryPath || '',
    status: meta.status || (project.categoryPath?.includes('ongoing') ? 'Ongoing' : 'Completed'),
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
    description: project.description || '',
    image: project.image || '',
    imageUrl: project.image || '',
    thumbnailUrl: project.image || '',
    tech: project.tech || [],
    tags: project.tech || [],
    github: project.github || '',
    deployed: project.deployed || '',
    projectUrl: project.deployed || '',
    categoryPath: project.categoryPath || 'legacy',
    status: project.status || 'Completed',
    mediaType: project.mediaType,
    mediaUrls: project.mediaUrls,
    sortOrder: index,
    metadata: {},
    source: 'legacy',
  }
}

export async function getFeatures() {
  try {
    return await fetchJson(`${API_BASE}/api/features?category=portfolio`)
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

export async function getSocial() {
  return content.social
}

export async function getStatsConfig() {
  return content.stats
}

/**
 * Prefer live portfolio API; merge/fallback to content.json so nothing is removed.
 * Set VITE_USE_API_PROJECTS=false to force local-only during migration.
 */
export async function getProjects({ categoryPath, limit } = {}) {
  const useApi = import.meta.env.VITE_USE_API_PROJECTS !== 'false'
  const legacyItems = (content.projects?.items || []).map(mapLegacyProject)
  const title = content.projects?.title || 'Projects'

  if (!useApi) {
    return { title, items: legacyItems, source: 'legacy', count: legacyItems.length }
  }

  try {
    const params = new URLSearchParams()
    if (categoryPath) params.set('categoryPath', categoryPath)
    if (limit) params.set('limit', String(limit))
    const qs = params.toString()
    const data = await fetchJson(
      `${API_BASE}/api/portfolio/projects${qs ? `?${qs}` : ''}`
    )
    const apiItems = (data.projects || []).map(mapApiProject)
    // Keep legacy projects available under a separate list for migration visibility
    return {
      title,
      items: apiItems.length ? apiItems : legacyItems,
      legacyItems,
      categories: [],
      count: apiItems.length || legacyItems.length,
      source: apiItems.length ? 'api' : 'legacy',
    }
  } catch (error) {
    console.warn('Portfolio API unavailable, using content.json', error)
    return { title, items: legacyItems, source: 'legacy', count: legacyItems.length }
  }
}

export async function getProjectById(id) {
  try {
    const project = await fetchJson(`${API_BASE}/api/portfolio/projects/${id}`)
    return mapApiProject(project)
  } catch {
    const legacy = (content.projects?.items || [])
      .map(mapLegacyProject)
      .find((p) => p.id === id)
    return legacy || null
  }
}

export async function getCategories() {
  try {
    const data = await fetchJson(`${API_BASE}/api/portfolio/categories`)
    return data.categories || []
  } catch {
    return []
  }
}

export async function getBlogPosts({ limit = 10 } = {}) {
  const useApi = import.meta.env.VITE_USE_API_BLOG !== 'false'
  if (!useApi) return { posts: [], source: 'none' }

  try {
    const data = await fetchJson(`${API_BASE}/api/blog/posts?limit=${limit}`)
    return { posts: data.posts || data || [], source: 'api' }
  } catch (error) {
    console.warn('Blog API unavailable', error)
    return { posts: [], source: 'none' }
  }
}

export async function getBlogPost(slug) {
  try {
    return await fetchJson(`${API_BASE}/api/blog/posts/${slug}`)
  } catch {
    return null
  }
}

export function getFormspreeEndpoint() {
  const id = import.meta.env.VITE_FORMSPREE_ID
  return id ? `https://formspree.io/f/${id}` : null
}

export { API_BASE, content }
