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
  } catch {
    /* storage may be unavailable */
  }
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
 * Enrich a raw star (API or local) with catalog data:
 * { id, identity, name, title, rarity, description, color, addedAt }
 */
export function enrichStar(raw = {}) {
  const identity = String(raw.identity ?? raw.id ?? '')
  const resolved = resolveIdentity(identity)
  return {
    id: raw.id ?? '',
    identity,
    name: resolved.name,
    title: resolved.title,
    rarity: resolved.rarity,
    description: resolved.description,
    color: raw.color || resolved.color || '#fff8e1',
    addedAt: raw.addedAt || '',
  }
}

/** Add a star to the rendered constellation if it isn't already there. */
function mergeStar(list, star) {
  if (!star) return { stars: list, added: false }
  if (list.some((s) => String(s.id) === String(star.id))) {
    return { stars: list, added: false }
  }
  return { stars: [star, ...list], added: true }
}

/**
 * Constellation + visitor-star persistence.
 * - Returning visitors are recognized via localStorage first (works offline),
 *   then the backend `visitor_has_star` / `visitor_star` when reachable.
 * - A local-only star is always rendered in the wall + counted even when the
 *   backend has 0 stars (it's the visitor's own light, not in the shared sky).
 * - `join()` assigns a local identity, persists it, and best-effort registers
 *   it with the backend. Never throws for backend failures (local-only join).
 * - `recast()` re-rolls the identity on the SAME star (same id/position) and
 *   best-effort PATCHes the backend; the star is never deleted.
 */
export default function useStars() {
  const [state, setState] = useState({
    stars: [],
    totalStars: 0,
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
        const backendStar = data.visitorStar ? enrichStar(data.visitorStar) : null
        const effective = backendStar || localStar
        if (backendStar && !local) {
          saveLocalStar({ id: backendStar.id, identity: backendStar.identity, color: backendStar.color, addedAt: backendStar.addedAt })
        }
        const base = data.stars.map(enrichStar)
        const merged = mergeStar(base, effective)
        setState({
          stars: merged.stars,
          totalStars: data.totalStars + (merged.added ? 1 : 0),
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
    return () => {
      cancelled = true
    }
  }, [])

  const join = useCallback(async (identity, color) => {
    const existing = loadLocalStar()
    if (existing) {
      return { star: enrichStar(existing), persisted: false, alreadyJoined: true }
    }

    let record = null
    try {
      const created = await addStar({ identity, color })
      record = {
        id: created.conflict ? genId() : created.star?.id || genId(),
        identity,
        color,
        addedAt: created.star?.addedAt || new Date().toISOString(),
      }
    } catch (err) {
      console.warn('[stars] Join persisted locally only:', err)
      record = { id: genId(), identity, color, addedAt: new Date().toISOString() }
    }

    const enriched = enrichStar(record)
    saveLocalStar({ id: record.id, identity: record.identity, color: record.color, addedAt: record.addedAt })
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
    async (identity, color) => {
      const local = loadLocalStar()
      const current = (local && enrichStar(local)) || state.visitorStar
      const existingId = current?.id
      if (!existingId) {
        return join(identity, color)
      }

      const updated = enrichStar({
        id: existingId,
        identity,
        color,
        addedAt: current.addedAt || new Date().toISOString(),
      })
      saveLocalStar({ id: updated.id, identity: updated.identity, color: updated.color, addedAt: updated.addedAt })
      const result = await updateStar({ identity, color })
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