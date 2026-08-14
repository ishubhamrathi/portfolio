import { useEffect, useState, useMemo } from 'react'
import { getOrCreateIdentity } from '@/services/contentApi'

const IDENTITY_STORAGE_KEY = 'sr:visitor_identity'

function loadLocal() {
  try {
    const raw = localStorage.getItem(IDENTITY_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export default function useIdentity() {
  const [identity, setIdentity] = useState(() => loadLocal())
  const [loading, setLoading] = useState(!identity?.username)

  useEffect(() => {
    let cancelled = false
    getOrCreateIdentity().then((id) => {
      if (!cancelled && id?.username) {
        setIdentity(id)
        setLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [])

  return useMemo(() => ({
    username: identity?.username || '',
    identityId: identity?.identity_id || '',
    loading,
  }), [identity, loading])
}
