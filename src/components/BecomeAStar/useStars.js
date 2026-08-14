import { useCallback, useEffect, useMemo, useState } from 'react'
import { getStars, addStar, updateStar } from '@/services/contentApi'
import { identityById } from './starIdentities'

const STORAGE_KEY = 'sr:my-star'

function genId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `star-local-${Math.random().toString(36).slice(2)}`
}

function loadLocalStar() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function saveLocalStar(star) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(star))
  } catch {}
}

function resolveIdentity(identityId) {
  const entry = identityById(identityId)
  if (!entry) {
    return {
      name: identityId || 'A Star',
      title: 'The Stargazer',
      rarity: 'common',
      description: 'A quiet light, still writing its own path.',
    }
  }
  return entry
}

/**
 * Enrich a raw star (API or local) with catalog data.
 * API stars come with { id, name, city, country, color, added_at, username }.
 * Local stars use { id, identity, color, addedAt }.
 */
export function enrichStar(raw = {}) {
  const identity = String(raw.identity ?? raw.name ?? raw.id ?? '')
  const resolved = resolveIdentity(identity)
  return {
    id: raw.id ?? '',
    identity,
    name: raw.name || resolved.name,
    title: resolved.title,
    rarity: resolved.rarity,
    description: resolved.description,
    color: raw.color || resolved.color || '#fff8e1',
    addedAt: raw.addedAt || raw.added_at || '',
    city: raw.city || '',
    country: raw.country || '',
    username: raw.username || '',
  }
}

function mergeStar(list, star) {
  if (!star) return { stars: list, added: false }
  if (list.some((s) => String(s.id) === String(star.id))) {
    return { stars: list, added: false }
  }
  return { stars: [star, ...list], added: true }
}

/**
 * Constellation + visitor-star persistence.
 * - Backend identifies visitors via `visitor_identity` cookie (HttpOnly).
 * - `visitor_has_star` in GET response tells us if this visitor already has a star.
 * - `join()` sends name/color to POST /api/stars; cookie handles identity.
 * - `recast()` re-rolls name/color via PATCH /api/stars.
 * - localStorage is a fast cache for returning visitors (works offline).
 */
export default function useStars() {
  const [state, setState] = useState({
    stars: [],
    totalStars: 0,
    cities: 0,
    countries: 0,
    status: 'loading',
    visitorStar: null,
    visitorHasStar: false,
  })

  useEffect(() => {
    let cancelled = false
    const local = loadLocalStar()
    const localStar = local ? enrichStar(local) : null

    getStars()
      .then((data) => {
        if (cancelled) return
        const base = data.stars.map(enrichStar)
        const visitorStar = data.visitorHasStar
          ? base.find((s) => s.username && localStar?.username === s.username) || (localStar && base.find((s) => s.id === localStar.id)) || null
          : null
        const effective = visitorStar || (data.visitorHasStar ? null : localStar)
        const merged = mergeStar(base, effective)
        setState({
          stars: merged.stars,
          totalStars: data.totalStars + (merged.added ? 1 : 0),
          cities: data.cities || 0,
          countries: data.countries || 0,
          status: 'ready',
          visitorStar: effective,
          visitorHasStar: data.visitorHasStar || !!effective,
        })
      })
      .catch(() => {
        if (cancelled) return
        setState((s) => {
          const merged = mergeStar(s.stars, localStar)
          return {
            ...s,
            stars: merged.stars,
            totalStars: merged.added ? Math.max(1, s.totalStars) : s.totalStars,
            status: 'offline',
            visitorStar: localStar,
            visitorHasStar: !!localStar,
          }
        })
      })
    return () => { cancelled = true }
  }, [])

  const join = useCallback(async (name, color) => {
    const existing = loadLocalStar()

    let record = null
    try {
      const created = await addStar({ name, color })
      if (created.conflict && existing) {
        return { star: enrichStar(existing), persisted: false, alreadyJoined: true }
      }
      record = {
        id: created.star?.id || genId(),
        name,
        color,
        addedAt: created.star?.added_at || new Date().toISOString(),
        username: created.star?.username || '',
      }
    } catch (err) {
      console.warn('[stars] Join persisted locally only:', err)
      if (existing) {
        return { star: enrichStar(existing), persisted: false, alreadyJoined: true }
      }
      record = { id: genId(), name, color, addedAt: new Date().toISOString() }
    }

    const enriched = enrichStar(record)
    saveLocalStar(record)
    setState((s) => ({
      stars: [enriched, ...s.stars],
      totalStars: s.totalStars + 1,
      status: s.status === 'loading' ? 'ready' : s.status,
      visitorStar: enriched,
      visitorHasStar: true,
    }))
    return { star: enriched, persisted: true, alreadyJoined: false }
  }, [])

  const recast = useCallback(
    async (name, color) => {
      const local = loadLocalStar()
      const current = (local && enrichStar(local)) || state.visitorStar
      const existingId = current?.id
      if (!existingId) {
        return join(name, color)
      }

      const updated = enrichStar({
        id: existingId,
        name,
        color,
        addedAt: current.addedAt || new Date().toISOString(),
        username: current.username || '',
      })
      saveLocalStar({ id: updated.id, name, color, addedAt: updated.addedAt, username: updated.username })
      const result = await updateStar({ name, color })
      if (!result.ok) {
        console.warn('[stars] Recast persisted locally only')
      }

      setState((s) => {
        const idx = s.stars.findIndex((st) => String(st.id) === String(existingId))
        if (idx >= 0) {
          return {
            ...s,
            stars: s.stars.map((st, i) => (i === idx ? updated : st)),
            totalStars: s.totalStars,
            visitorStar: updated,
            visitorHasStar: true,
          }
        }
        return {
          ...s,
          stars: [updated, ...s.stars],
          totalStars: s.totalStars + 1,
          visitorStar: updated,
          visitorHasStar: true,
        }
      })
      return { star: updated, recast: true }
    },
    [state.visitorStar, join]
  )

  return useMemo(() => ({ ...state, join, recast }), [state, join, recast])
}
