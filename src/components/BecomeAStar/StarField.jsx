import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { isAnimatable } from '@/lib/rafGate'
import styles from './stars.module.css'

const PARALLAX = 18
const LINE_MIN_STARS = 40
const LINE_MAX_DIST = 110
const LINE_CELL = 90
const HIT_CELL = 44
const HIT_RADIUS = 16
const MAX_DRAWN = 6000
const MAX_LINES = 4000
const BURST_MS = 700
const METEOR_MIN_GAP = 20000
const METEOR_MAX_GAP = 10000
const TRAVEL_MS = 1700

const glowCache = new Map()

function hexToRgb(hex) {
  const clean = hex.replace('#', '')
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean
  const n = parseInt(full, 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

function glowSprite(color) {
  if (glowCache.has(color)) return glowCache.get(color)
  const { r, g, b } = hexToRgb(color)
  const size = 96
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  grad.addColorStop(0, `rgba(${r},${g},${b},1)`)
  grad.addColorStop(0.3, `rgba(${r},${g},${b},0.5)`)
  grad.addColorStop(1, `rgba(${r},${g},${b},0)`)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)
  glowCache.set(color, canvas)
  return canvas
}

function hashString(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function easeOutBack(x) {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2)
}

function easeInOutCubic(x) {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
}

function rarityVisuals(rarity) {
  switch (rarity) {
    case 'legendary':
      return { glow: 0.5, sizeMul: 1.45, ring: false, orbit: true }
    case 'epic':
      return { glow: 0.4, sizeMul: 1.3, ring: true, orbit: false }
    case 'rare':
      return { glow: 0.3, sizeMul: 1.15, ring: false, orbit: false }
    default:
      return { glow: 0.17, sizeMul: 1, ring: false, orbit: false }
  }
}

function layoutStars(stars, w, h) {
  const items = stars.map((star, i) => {
    const seed = star.id != null ? hashString(String(star.id)) : hashString(`${i}`)
    const rng = mulberry32(seed)
    return {
      star,
      nx: 0.06 + rng() * 0.88,
      ny: 0.08 + rng() * 0.84,
      size: 1.3 + rng() * 1.9,
      glow: 20 + rng() * 22,
      phase: rng() * Math.PI * 2,
      speed: 0.7 + rng() * 1.4,
      depth: 0.45 + rng() * 0.55,
      vis: rarityVisuals(star.rarity),
    }
  })
  const map = new Map()
  items.forEach((it) => map.set(String(it.star.id), it))
  return { items, map }
}

function makeAmbient(w, h, seed) {
  const count = Math.max(120, Math.min(460, Math.round((w * h) / 5200)))
  const rng = mulberry32(seed)
  const arr = []
  for (let i = 0; i < count; i++) {
    arr.push({
      nx: rng(),
      ny: rng(),
      r: 0.6 + rng() * 0.8,
      a: 0.28 + rng() * 0.5,
      p: rng() * Math.PI * 2,
      s: 0.4 + rng() * 1.2,
      d: 0.25 + rng() * 0.45,
    })
  }
  return arr
}

function buildLines(items, w, h) {
  if (items.length < LINE_MIN_STARS) return []
  const minDim = Math.min(w, h)
  const cellN = Math.max(0.08, LINE_CELL / minDim)
  const maxDistN = Math.max(0.1, LINE_MAX_DIST / minDim)
  const grid = new Map()
  const keyOf = (nx, ny) => `${Math.floor(nx / cellN)}:${Math.floor(ny / cellN)}`
  items.forEach((it, i) => {
    const k = keyOf(it.nx, it.ny)
    if (!grid.has(k)) grid.set(k, [])
    grid.get(k).push(i)
  })
  const seen = new Set()
  const pairs = []
  const distPx = (a, b) => {
    const dx = (a.nx - b.nx) * w
    const dy = (a.ny - b.ny) * h
    return Math.sqrt(dx * dx + dy * dy)
  }
  for (let i = 0; i < items.length && pairs.length < MAX_LINES; i++) {
    const s = items[i]
    const cx = Math.floor(s.nx / cellN)
    const cy = Math.floor(s.ny / cellN)
    const cands = []
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const list = grid.get(`${cx + dx}:${cy + dy}`)
        if (list) {
          for (let k = 0; k < list.length; k++) {
            const j = list[k]
            if (j !== i && !seen.has(`${Math.min(i, j)}:${Math.max(i, j)}`)) cands.push(j)
          }
        }
      }
    }
    cands.sort((a, b) => distPx(s, items[a]) - distPx(s, items[b]))
    let links = 0
    for (let k = 0; k < cands.length && links < 2; k++) {
      const j = cands[k]
      const d = distPx(s, items[j])
      if (d > LINE_MAX_DIST) break
      seen.add(`${Math.min(i, j)}:${Math.max(i, j)}`)
      pairs.push({
        x1: s.nx,
        y1: s.ny,
        x2: items[j].nx,
        y2: items[j].ny,
        alpha: Math.max(0.04, (1 - d / LINE_MAX_DIST) * 0.16),
      })
      links++
    }
  }
  return pairs
}

function buildHitGrid(items, size, cell) {
  const grid = new Map()
  items.forEach((it, i) => {
    const k = `${Math.floor((it.nx * size.w) / cell)}:${Math.floor((it.ny * size.h) / cell)}`
    if (!grid.has(k)) grid.set(k, [])
    grid.get(k).push(i)
  })
  return grid
}

function findHit(items, hitGrid, size, cell, x, y) {
  const cx = Math.floor(x / cell)
  const cy = Math.floor(y / cell)
  const R2 = HIT_RADIUS * HIT_RADIUS
  let best = null
  let bestD = R2
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const list = hitGrid.get(`${cx + dx}:${cy + dy}`)
      if (!list) continue
      for (let k = 0; k < list.length; k++) {
        const it = items[list[k]]
        const sx = it.nx * size.w
        const sy = it.ny * size.h
        const d = (sx - x) * (sx - x) + (sy - y) * (sy - y)
        if (d < bestD) {
          bestD = d
          best = it
        }
      }
    }
  }
  return best
}

function makeMeteor(w, h) {
  const angle = Math.PI * (0.1 + Math.random() * 0.35)
  const len = Math.min(w, h) * (0.3 + Math.random() * 0.2)
  const dx = Math.cos(angle)
  const dy = Math.sin(angle)
  let x1, y1
  if (Math.random() < 0.7) {
    x1 = Math.random() * w * 0.85
    y1 = Math.random() * h * 0.25
  } else {
    x1 = w * (0.05 + Math.random() * 0.4)
    y1 = -h * 0.1
  }
  return {
    x1,
    y1,
    x2: x1 + dx * len,
    y2: y1 + dy * len,
    dx,
    dy,
    len,
    t: 0,
    last: performance.now(),
    duration: 900 + Math.random() * 500,
  }
}

function formatAdded(addedAt) {
  if (!addedAt) return ''
  const d = new Date(addedAt)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

export default function StarField({ stars = [], focusId = null, myStarId = null, traveler = null, pulse = null, reducedMotion = false, isCoarse = false }) {
  const wrapperRef = useRef(null)
  const canvasRef = useRef(null)
  const starsRef = useRef(stars)
  starsRef.current = stars

  const s = useRef({
    ctx: null,
    size: { w: 0, h: 0 },
    dpr: 1,
    items: [],
    itemMap: new Map(),
    ambient: [],
    lines: [],
    hitGrid: new Map(),
    mouse: { x: 0, y: 0 },
    par: { x: 0, y: 0 },
    meteors: [],
    nextMeteorAt: 0,
    bursts: new Map(),
    knownIds: null,
    burstReady: false,
    hover: null,
    focusId: null,
    myStarId: null,
    traveler: null,
    linePulse: null,
    reducedMotion: false,
    isCoarse: false,
    visible: true,
    seed: 2026,
  }).current

  const [tooltip, setTooltip] = useState(null)

  const rebuild = () => {
    const { size } = s
    const { w, h } = size
    const { items, map } = layoutStars(starsRef.current, w, h)
    s.items = items
    s.itemMap = map
    s.ambient = makeAmbient(w, h, s.seed)
    s.lines = buildLines(s.items, w, h)
    s.hitGrid = buildHitGrid(s.items, size, HIT_CELL)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    const wrapper = wrapperRef.current
    if (!canvas || !wrapper) return
    s.ctx = canvas.getContext('2d')
    s.reducedMotion = reducedMotion
    s.isCoarse = isCoarse

    const resize = () => {
      const rect = wrapper.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      s.dpr = dpr
      s.size = { w: Math.max(1, rect.width), h: Math.max(1, rect.height) }
      canvas.width = Math.round(s.size.w * dpr)
      canvas.height = Math.round(s.size.h * dpr)
      rebuild()
    }

    const ro = new ResizeObserver(resize)
    ro.observe(wrapper)
    resize()

    if (!s.nextMeteorAt) s.nextMeteorAt = performance.now() + 20000 + Math.random() * METEOR_MAX_GAP

    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion, isCoarse])

  useEffect(() => {
    s.reducedMotion = reducedMotion
    s.isCoarse = isCoarse
  }, [reducedMotion, isCoarse])

  useEffect(() => {
    if (!s.size.w) return
    rebuild()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stars])

  useEffect(() => {
    if (focusId && String(focusId) !== String(s.focusId)) {
      const now = performance.now()
      s.bursts.set(String(focusId), now)
      const item = s.itemMap.get(String(focusId))
      if (item && s.size.w) {
        s.linePulse = { x: item.nx * s.size.w, y: item.ny * s.size.h, start: now }
      }
    }
    s.focusId = focusId
  }, [focusId, s])

  useEffect(() => {
    s.myStarId = myStarId
  }, [myStarId, s])

  useEffect(() => {
    if (!pulse?.id) return
    const now = performance.now()
    s.bursts.set(String(pulse.id), now)
    const item = s.itemMap.get(String(pulse.id))
    if (item && s.size.w) {
      s.linePulse = { x: item.nx * s.size.w, y: item.ny * s.size.h, start: now }
    }
  }, [pulse, s])

  useEffect(() => {
    if (traveler && traveler.id && String(traveler.id) !== String(s.traveler?.id)) {
      const fromX = traveler.from?.x ?? s.size.w * 0.5
      const fromY = traveler.from?.y ?? 0
      s.traveler = {
        id: traveler.id,
        fromX,
        fromY,
        prevX: fromX,
        prevY: fromY,
        start: performance.now(),
      }
    }
  }, [traveler, s])

  useEffect(() => {
    const now = performance.now()
    const nextIds = new Set()
    stars.forEach((st) => nextIds.add(String(st.id ?? '')))
    if (!s.burstReady) {
      s.burstReady = true
      s.knownIds = nextIds
      return
    }
    const prev = s.knownIds || new Set()
    nextIds.forEach((k) => {
      if (k && !prev.has(k)) s.bursts.set(k, now)
    })
    s.knownIds = nextIds
  }, [stars, s])

  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        s.visible = entries[0]?.isIntersecting ?? true
      },
      { threshold: 0.05 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [s])

  useEffect(() => {
    let raf = 0
    const loop = () => {
      raf = requestAnimationFrame(loop)
      if (!s.visible || !s.size.w) return
      if (!isAnimatable() && !s.traveler && !s.pulse) return
      draw(s)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [s])

  const showTooltipFor = (hit) => {
    if (!hit) {
      s.hover = null
      setTooltip(null)
      return
    }
    const x = hit.nx * s.size.w
    const y = hit.ny * s.size.h
    const left = Math.max(110, Math.min(s.size.w - 110, x))
    const top = Math.max(140, Math.min(s.size.h - 40, y))
    setTooltip({ star: hit.star, left, top })
  }

  const handlePointerMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    s.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    s.mouse.y = ((e.clientY - rect.top) / rect.height) * 2 - 1
    const hit = findHit(s.items, s.hitGrid, s.size, HIT_CELL, e.clientX - rect.left, e.clientY - rect.top)
    s.hover = hit ? { id: hit.star.id, x: hit.nx * s.size.w, y: hit.ny * s.size.h } : null
    canvasRef.current?.classList.toggle('cursor-target', !!hit)
    showTooltipFor(hit)
  }

  const handlePointerDown = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const hit = findHit(s.items, s.hitGrid, s.size, HIT_CELL, e.clientX - rect.left, e.clientY - rect.top)
    if (hit) {
      s.hover = { id: hit.star.id, x: hit.nx * s.size.w, y: hit.ny * s.size.h }
      showTooltipFor(hit)
    }
  }

  const handlePointerLeave = () => {
    s.mouse.x = 0
    s.mouse.y = 0
    s.hover = null
    setTooltip(null)
    canvasRef.current?.classList.remove('cursor-target')
  }

  return (
    <div ref={wrapperRef} className="absolute inset-0">
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        onPointerLeave={handlePointerLeave}
      />
      <AnimatePresence>
        {tooltip && (
          <motion.div
            key="tooltip"
            className={styles.tooltip}
            style={{ left: tooltip.left, top: tooltip.top }}
            initial={{ opacity: 0, scale: 0.9, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 6 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <div className={styles.tooltipName}>
              <span className={styles.tooltipDot} style={{ background: tooltip.star.color }} />
              {tooltip.star.name || 'A Star'}
            </div>
            <div className={styles.tooltipMeta}>
              {tooltip.star.title && <div>{tooltip.star.title}</div>}
              {formatAdded(tooltip.star.addedAt) && (
                <div>
                  <strong>Discovered</strong> {formatAdded(tooltip.star.addedAt)}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function draw(s) {
  const { ctx, size, dpr } = s
  if (!ctx) return
  const { w, h } = size
  const now = performance.now()

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, w, h)

  const targetX = s.mouse.x * PARALLAX
  const targetY = s.mouse.y * PARALLAX
  s.par.x += (targetX - s.par.x) * 0.06
  s.par.y += (targetY - s.par.y) * 0.06
  const px = s.reducedMotion ? 0 : s.par.x
  const py = s.reducedMotion ? 0 : s.par.y

  drawLines(s, ctx, now, w, h, px, py)
  drawAmbient(s, ctx, now, w, h, px, py)
  updateMeteors(s, ctx, now, w, h)
  drawTraveler(s, ctx, now, w, h)

  const step = Math.max(1, Math.ceil(s.items.length / MAX_DRAWN))

  ctx.globalCompositeOperation = 'lighter'
  for (let i = 0; i < s.items.length; i += step) {
    const it = s.items[i]
    if (s.traveler && String(s.traveler.id) === String(it.star.id)) continue
    const scale = burstScale(s, it.star.id, now)
    if (scale <= 0.01) continue
    const tw = s.reducedMotion ? 1 : 0.72 + 0.28 * Math.sin(now * 0.001 * it.speed + it.phase)
    const gx = it.nx * w + px * it.depth
    const gy = it.ny * h + py * it.depth
    const isMine = String(it.star.id) === String(s.myStarId)
    const gsize = it.glow * scale * 2 * (isMine ? 1.7 : 1)
    const glowBoost = isMine ? 0.4 : String(it.star.id) === String(s.focusId) ? 0.22 : 0
    ctx.globalAlpha = (it.vis.glow + glowBoost) * tw
    ctx.drawImage(glowSprite(it.star.color), gx - gsize / 2, gy - gsize / 2, gsize, gsize)
  }
  ctx.globalCompositeOperation = 'source-over'
  ctx.globalAlpha = 1

  for (let i = 0; i < s.items.length; i += step) {
    const it = s.items[i]
    if (s.traveler && String(s.traveler.id) === String(it.star.id)) continue
    const scale = burstScale(s, it.star.id, now)
    if (scale <= 0.01) continue
    const tw = s.reducedMotion ? 1 : 0.72 + 0.28 * Math.sin(now * 0.001 * it.speed + it.phase)
    const gx = it.nx * w + px * it.depth
    const gy = it.ny * h + py * it.depth
    const isHover = s.hover && String(s.hover.id) === String(it.star.id)
    const isFocus = String(it.star.id) === String(s.focusId)
    const isMine = String(it.star.id) === String(s.myStarId)
    const r = it.size * it.vis.sizeMul * scale * (isMine ? 1.9 : isHover ? 1.35 : 1)
    ctx.globalAlpha = tw
    ctx.fillStyle = it.star.color
    ctx.beginPath()
    ctx.arc(gx, gy, r, 0, Math.PI * 2)
    ctx.fill()
    if (isMine) {
      ctx.globalAlpha = tw
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(gx, gy, r * 0.55, 0, Math.PI * 2)
      ctx.fill()
    }
    if (isHover || isFocus || isMine) {
      const ringR = r + (isMine ? 8 + Math.sin(now * 0.0025 + it.phase) * 2 : 4)
      ctx.globalAlpha = isMine ? 1 : isFocus ? 0.6 : 0.5
      ctx.strokeStyle = isMine ? '#ffffff' : it.star.color
      ctx.lineWidth = isMine ? 1.6 : 1
      ctx.beginPath()
      ctx.arc(gx, gy, ringR, 0, Math.PI * 2)
      ctx.stroke()
    }
    if (isMine) {
      const rot = now * 0.0012 + it.phase
      const rayLen = r + 9
      ctx.globalAlpha = 0.9
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 1
      ctx.beginPath()
      for (let k = 0; k < 4; k++) {
        const a = rot + (k * Math.PI) / 2
        ctx.moveTo(gx + Math.cos(a) * r * 0.7, gy + Math.sin(a) * r * 0.7)
        ctx.lineTo(gx + Math.cos(a) * rayLen, gy + Math.sin(a) * rayLen)
      }
      ctx.stroke()
    }
    if (it.vis.ring) {
      ctx.globalAlpha = 0.35 * tw
      ctx.strokeStyle = it.star.color
      ctx.lineWidth = 0.75
      ctx.beginPath()
      ctx.arc(gx, gy, r + 5, 0, Math.PI * 2)
      ctx.stroke()
    }
    if (it.vis.orbit) {
      const ang = now * 0.002 + it.phase
      for (let k = 0; k < 2; k++) {
        const oa = ang + k * Math.PI
        ctx.globalCompositeOperation = 'lighter'
        ctx.globalAlpha = 0.5 * tw
        ctx.fillStyle = it.star.color
        ctx.beginPath()
        ctx.arc(gx + Math.cos(oa) * 7, gy + Math.sin(oa) * 7, 1, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalCompositeOperation = 'source-over'
      }
    }
  }
  ctx.globalAlpha = 1
}

function drawLines(s, ctx, now, w, h, px, py) {
  if (!s.lines.length) return
  ctx.lineWidth = 1
  ctx.strokeStyle = 'rgba(214, 222, 255, 1)'

  const pulse = s.linePulse ? { x: s.linePulse.x, y: s.linePulse.y, boost: 0 } : null
  if (pulse) {
    const age = now - s.linePulse.start
    if (age > 900) {
      s.linePulse = null
    } else {
      pulse.boost = (1 - age / 900) * 2.4
    }
  }

  for (let i = 0; i < s.lines.length; i++) {
    const L = s.lines[i]
    let alpha = L.alpha
    if (pulse && pulse.boost) {
      const mx = ((L.x1 + L.x2) / 2) * w
      const my = ((L.y1 + L.y2) / 2) * h
      const d = Math.hypot(mx - pulse.x, my - pulse.y)
      if (d < 150) alpha = Math.min(0.5, alpha * (1 + pulse.boost * (1 - d / 150)))
    }
    ctx.globalAlpha = alpha
    ctx.beginPath()
    ctx.moveTo(L.x1 * w + px, L.y1 * h + py)
    ctx.lineTo(L.x2 * w + px, L.y2 * h + py)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}

function drawAmbient(s, ctx, now, w, h, px, py) {
  ctx.fillStyle = '#ffffff'
  for (let i = 0; i < s.ambient.length; i++) {
    const a = s.ambient[i]
    const tw = s.reducedMotion ? 1 : 0.8 + 0.2 * Math.sin(now * 0.001 * a.s + a.p)
    ctx.globalAlpha = a.a * tw
    ctx.fillRect(a.nx * w + px * a.d * 0.6, a.ny * h + py * a.d * 0.6, a.r, a.r)
  }
  ctx.globalAlpha = 1
}

function drawTraveler(s, ctx, now, w, h) {
  const t = s.traveler
  if (!t) return
  const item = s.itemMap.get(String(t.id))
  const fx = item ? item.nx * w : w * 0.5
  const fy = item ? item.ny * h : h * 0.4
  const age = now - t.start
  if (age >= TRAVEL_MS) {
    s.bursts.set(String(t.id), now)
    s.linePulse = { x: fx, y: fy, start: now }
    s.traveler = null
    return
  }
  const k = easeInOutCubic(Math.min(1, age / TRAVEL_MS))
  const cx = t.fromX + (fx - t.fromX) * k
  const cy = t.fromY + (fy - t.fromY) * k
  const fade = Math.min(1, age / 220) * Math.sin(Math.PI * Math.min(1, age / TRAVEL_MS))
  ctx.globalCompositeOperation = 'lighter'
  const grad = ctx.createLinearGradient(t.prevX, t.prevY, cx, cy)
  grad.addColorStop(0, 'rgba(255,255,255,0)')
  grad.addColorStop(1, `rgba(255,255,255,${(0.9 * fade).toFixed(3)})`)
  ctx.strokeStyle = grad
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(t.prevX, t.prevY)
  ctx.lineTo(cx, cy)
  ctx.stroke()
  ctx.fillStyle = `rgba(255,255,255,${(0.95 * fade).toFixed(3)})`
  ctx.beginPath()
  ctx.arc(cx, cy, 2, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalCompositeOperation = 'source-over'
  t.prevX = cx
  t.prevY = cy
}

function burstScale(s, id, now) {
  const key = String(id ?? '')
  const start = s.bursts.get(key)
  if (start == null) return 1
  const t = (now - start) / BURST_MS
  if (t >= 1) {
    s.bursts.delete(key)
    return 1
  }
  return easeOutBack(t)
}

function updateMeteors(s, ctx, now, w, h) {
  if (s.reducedMotion || s.isCoarse) return
  if (now >= s.nextMeteorAt && s.meteors.length < 2) {
    s.meteors.push(makeMeteor(w, h))
    s.nextMeteorAt = now + METEOR_MIN_GAP + Math.random() * METEOR_MAX_GAP
  }
  for (let i = s.meteors.length - 1; i >= 0; i--) {
    const m = s.meteors[i]
    m.t += (now - m.last) / m.duration
    m.last = now
    if (m.t >= 1) {
      s.meteors.splice(i, 1)
      continue
    }
    const hx = m.x1 + (m.x2 - m.x1) * m.t
    const hy = m.y1 + (m.y2 - m.y1) * m.t
    const fade = Math.sin(Math.PI * m.t)
    const tl = m.len * 0.25
    const tx = hx - m.dx * tl
    const ty = hy - m.dy * tl
    const grad = ctx.createLinearGradient(tx, ty, hx, hy)
    grad.addColorStop(0, 'rgba(255,255,255,0)')
    grad.addColorStop(1, `rgba(255,255,255,${(0.85 * fade).toFixed(3)})`)
    ctx.strokeStyle = grad
    ctx.lineWidth = 1.6
    ctx.beginPath()
    ctx.moveTo(tx, ty)
    ctx.lineTo(hx, hy)
    ctx.stroke()
    ctx.globalCompositeOperation = 'lighter'
    ctx.fillStyle = `rgba(255,255,255,${(0.9 * fade).toFixed(3)})`
    ctx.beginPath()
    ctx.arc(hx, hy, 1.7, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalCompositeOperation = 'source-over'
  }
}
