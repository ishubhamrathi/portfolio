import { useMemo, useState, useEffect } from 'react'
import styles from './PageLoader.module.css'

const DESKTOP_GRID = { cols: 35, rows: 18 }
const MOBILE_GRID = { cols: 10, rows: 6 }

const PALETTE = [
  '#0a0a0c', '#0f0f12', '#111116', '#131318',
  '#16161b', '#18181d', '#0c0c0f', '#141419',
  '#101015', '#0e0e11', '#121217', '#0d0d10',
]

function seededRandom(seed) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return s / 2147483647
  }
}

export default function PageLoader({ done = false }) {
  const [mounted, setMounted] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    setIsMobile(mq.matches)
    const onChange = (e) => setIsMobile(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (!done) return
    const timer = setTimeout(() => setMounted(false), isMobile ? 500 : 1800)
    return () => clearTimeout(timer)
  }, [done, isMobile])

  const tiles = useMemo(() => {
    const { cols, rows } = isMobile ? MOBILE_GRID : DESKTOP_GRID
    const spots = isMobile ? 3 : 7
    const rng = seededRandom(42)

    const seeds = Array.from({ length: spots }, () => ({
      r: rng() * rows,
      c: rng() * cols,
    }))

    return Array.from({ length: rows * cols }, (_, i) => {
      const r = Math.floor(i / cols)
      const c = i % cols

      let minDist = Infinity
      for (const s of seeds) {
        const dr = r - s.r
        const dc = c - s.c
        const d = Math.sqrt(dr * dr + dc * dc)
        if (d < minDist) minDist = d
      }

      return {
        r,
        c,
        bg: PALETTE[Math.floor(rng() * PALETTE.length)],
        delay: minDist * 0.18 + rng() * 0.12,
        blinkDelay: rng() * 4,
        blinkDur: 2 + rng() * 2,
      }
    })
  }, [isMobile])

  if (!mounted) return null

  const { cols, rows } = isMobile ? MOBILE_GRID : DESKTOP_GRID

  return (
    <div className={`${styles.overlay} ${done ? styles.hidden : ''}`} aria-label="Loading" role="status">
      <div
        className={styles.mosaic}
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)` }}
      >
        {tiles.map((t, i) => (
          <div
            key={`${t.r}-${t.c}`}
            className={`${styles.tile} ${done ? styles.tileFade : styles.tileBlink}`}
            style={{
              backgroundColor: t.bg,
              animationDelay: `${t.delay}s`,
              '--blink-delay': `${t.blinkDelay}s`,
              '--blink-dur': `${t.blinkDur}s`,
            }}
          />
        ))}
      </div>
    </div>
  )
}
