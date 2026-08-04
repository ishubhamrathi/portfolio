import { useEffect } from 'react'

const JUMP_THRESHOLD = 120
const GESTURE_END_MS = 170
const LOCK_MS = 700
const FAST_TOTAL = 1400
const FAST_WINDOW = 400
const MANUAL_WINDOW = 600

function sectionTops() {
  const tops = []
  document.querySelectorAll('main section[id]').forEach((s) => tops.push(s.offsetTop))
  return tops.sort((a, b) => a - b)
}

function currentIndex(tops, y) {
  let idx = 0
  for (let i = 0; i < tops.length; i++) if (y >= tops[i]) idx = i
  return idx
}

function isNestedScroller(el) {
  for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
    const st = getComputedStyle(n)
    if (
      (st.overflowY === 'auto' || st.overflowY === 'scroll' || st.overflowY === 'overlay') &&
      n.scrollHeight > n.clientHeight
    ) {
      return true
    }
  }
  return false
}

export default function SectionScroller() {
  useEffect(() => {
    if (import.meta.env.VITE_USE_SECTION_SCROLL !== 'true') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let gestureDelta = 0
    let gestureStart = 0
    let lastEventAt = 0
    let endTimer = 0
    let lockUntil = 0

    const glide = (top) => {
      if (Math.abs(window.scrollY - top) < 2) return
      lockUntil = performance.now() + LOCK_MS
      window.scrollTo({ top, behavior: 'smooth' })
    }

    const endGesture = () => {
      endTimer = 0
      if (performance.now() < lockUntil) {
        gestureDelta = 0
        return
      }
      const abs = Math.abs(gestureDelta)
      const duration = lastEventAt - gestureStart
      const tops = sectionTops()
      const y = window.scrollY
      if (abs >= JUMP_THRESHOLD && duration <= MANUAL_WINDOW) {
        if (abs > FAST_TOTAL && duration < FAST_WINDOW) {
          glide(gestureDelta > 0 ? tops[tops.length - 1] : 0)
        } else {
          const target = Math.min(
            tops.length - 1,
            Math.max(0, currentIndex(tops, y) + (gestureDelta > 0 ? 1 : -1))
          )
          glide(tops[target])
        }
      } else {
        window.scrollBy({ top: gestureDelta, behavior: 'smooth' })
      }
      gestureDelta = 0
    }

    const onWheel = (e) => {
      if (e.deltaY === 0) return
      const target = e.target
      if (isNestedScroller(target) || (target.closest && target.closest('aside, nav'))) return
      e.preventDefault()
      const now = performance.now()
      if (now - lastEventAt > GESTURE_END_MS) {
        gestureDelta = 0
        gestureStart = now
      }
      gestureDelta += e.deltaY
      lastEventAt = now
      clearTimeout(endTimer)
      endTimer = setTimeout(endGesture, GESTURE_END_MS)
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      window.removeEventListener('wheel', onWheel)
      clearTimeout(endTimer)
    }
  }, [])

  return null
}
