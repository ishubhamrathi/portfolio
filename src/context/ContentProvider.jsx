import { createContext, useContext, useEffect, useState, useMemo } from 'react'
import { fetchContent, mapApiSocial, extractSocialList, getAmaSuggestions } from '@/services/contentApi'

const ContentContext = createContext(null)

export function ContentProvider({ children }) {
  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    const loadAll = async () => {
      try {
        const contentRes = await fetchContent()

        if (cancelled) return

        setContent(contentRes)
      } catch (err) {
        if (!cancelled) {
          setError('Failed to load content')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadAll()
    return () => { cancelled = true }
  }, [])

  // Fetch AMA suggestions if not in consolidated content
  const [amaSuggestionsData, setAmaSuggestionsData] = useState([])
  useEffect(() => {
    let cancelled = false

    const loadSuggestions = async () => {
      try {
        // Check if suggestions are already in consolidated content
        if (content?.suggestions?.suggestions || content?.suggestions?.items) {
          return
        }
        const suggestions = await getAmaSuggestions()
        if (!cancelled) {
          setAmaSuggestionsData(suggestions)
        }
      } catch (err) {
        if (!cancelled) {
          console.warn('[ContentProvider] Failed to load AMA suggestions:', err)
        }
      }
    }

    if (content) {
      loadSuggestions()
    }
    return () => { cancelled = true }
  }, [content])

  // Extract sub-sections from consolidated content
  const codingProfiles = useMemo(() => {
    if (!content?.['coding-profiles'] && !content?.codingProfiles && !content?.coding_profiles) return null
    const data = content['coding-profiles'] || content.codingProfiles || content.coding_profiles || content
    const github = data.github || {}
    const leetcode = data.leetcode || {}
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
  }, [content])

  const starsData = useMemo(() => {
    const starsPayload = content?.stars
    if (!starsPayload) return null
    const meta = starsPayload.meta || starsPayload
    const rows = starsPayload.stars || starsPayload.items || []
    return {
      stars: rows,
      totalStars: Number(meta.total_stars ?? meta.totalStars ?? rows.length) || 0,
      cities: Number(meta.cities ?? 0) || 0,
      countries: Number(meta.countries ?? 0) || 0,
      visitorHasStar: Boolean(meta.visitor_has_star ?? meta.visitorHasStar ?? false),
    }
  }, [content])

  const amaSuggestions = useMemo(() => {
    // First try consolidated content
    const suggPayload = content?.suggestions
    if (suggPayload) {
      const list = suggPayload.suggestions || suggPayload.items || []
      return list
        .filter((s) => s.active !== false)
        .sort((a, b) => (a.displayOrder ?? a.display_order ?? 0) - (b.displayOrder ?? b.display_order ?? 0))
        .map((s) => ({
          id: s.id || '',
          question: s.question || '',
          category: s.category || '',
        }))
    }
    // Fallback to separately fetched suggestions
    return amaSuggestionsData
  }, [content, amaSuggestionsData])

  const flags = useMemo(() => {
    const raw = content?.feature_flags?.flags || {}
    const flags = {}
    for (const [key, value] of Object.entries(raw)) {
      flags[key] = typeof value === 'object' && value !== null ? value.enabled === true : Boolean(value)
    }
    return flags
  }, [content])

  const social = useMemo(() => {
    const rawSocials = content?.socials
    const list = extractSocialList(rawSocials)
    if (!list.length) return null
    const links = list
      .map(mapApiSocial)
      .filter((s) => s.name && s.link)
      .sort((a, b) => a.displayOrder - b.displayOrder)
    return {
      title: content?.social?.title || content?.socialsTitle || 'Follow Me',
      links,
    }
  }, [content])

  const value = useMemo(() => ({
    content,
    codingProfiles,
    starsData,
    amaSuggestions,
    flags,
    social,
    loading,
    error,
  }), [content, codingProfiles, starsData, amaSuggestions, flags, social, loading, error])

  return (
    <ContentContext.Provider value={value}>
      {children}
    </ContentContext.Provider>
  )
}

export function useContent() {
  const context = useContext(ContentContext)
  if (!context) {
    throw new Error('useContent must be used within a ContentProvider')
  }
  return context
}