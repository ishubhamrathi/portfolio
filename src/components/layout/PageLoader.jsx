import { useMemo, useState, useEffect } from 'react'
import styles from './PageLoader.module.css'

const COLS = 35
const ROWS = 18
const SPOTS = 7

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

  useEffect(() => {
    if (!done) return
    const timer = setTimeout(() => setMounted(false), 1800)
    return () => clearTimeout(timer)
  }, [done])

  const tiles = useMemo(() => {
    const rng = seededRandom(42)

    const seeds = Array.from({ length: SPOTS }, () => ({
      r: rng() * ROWS,
      c: rng() * COLS,
    }))

    return Array.from({ length: ROWS * COLS }, (_, i) => {
      const r = Math.floor(i / COLS)
      const c = i % COLS

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
  }, [])

  if (!mounted) return null

  return (
    <div className={`${styles.overlay} ${done ? styles.hidden : ''}`} aria-label="Loading" role="status">
      <div className={styles.mosaic}>
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
