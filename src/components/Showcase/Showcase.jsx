import { createContext, useContext, useEffect, useState } from 'react'
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from 'motion/react'
import styles from './showcase.module.css'

const GRADIENTS = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899', '#22D3EE']
const EASE = [0.22, 1, 0.36, 1]
const SPRING = { type: 'spring', stiffness: 130, damping: 20 }

const ParallaxCtx = createContext(null)

function useImageRatio(src) {
  const [ratio, setRatio] = useState(null)
  useEffect(() => {
    if (!src) {
      setRatio(null)
      return
    }
    let alive = true
    const img = new Image()
    img.onload = () => {
      if (alive && img.naturalWidth) setRatio(img.naturalWidth / img.naturalHeight)
    }
    img.src = src
    return () => {
      alive = false
    }
  }, [src])
  return ratio
}

function detectType(item, ratio, screenshots) {
  const override = item.previewType
  if (override && override !== 'auto') {
    return override === 'tablet' || override === 'laptop' ? 'browser' : override
  }
  const multi = screenshots.length >= 2
  if (multi) return ratio && ratio < 0.85 ? 'phone-stack' : 'browser-stack'
  if (ratio && ratio > 1.2) return 'browser'
  if (ratio && ratio < 0.85) return 'phone'
  return 'browser'
}

function hostname(url) {
  if (!url) return ''
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

function GlassOverlays() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-white/[0.1]" />
    </>
  )
}

function ParallaxImage({ src, alt, className }) {
  const reduced = useReducedMotion()
  const parallax = useContext(ParallaxCtx)
  return (
    <motion.img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={className}
      initial={reduced ? false : { scale: 1 }}
      animate={reduced ? undefined : { scale: 1.04 }}
      transition={{ duration: 5, ease: 'easeOut' }}
      style={parallax ? { x: parallax.main.x, y: parallax.main.y } : undefined}
    />
  )
}

export function BrowserFrame({ src, alt, url }) {
  return (
    <div className="w-full overflow-hidden rounded-2xl bg-[#0d0d0f] shadow-[0_50px_100px_-30px_rgba(0,0,0,0.9)] ring-1 ring-white/10">
      <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.05] px-4 py-3 backdrop-blur-sm">
        <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
        <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
        <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        <span className="ml-3 flex flex-1 items-center gap-1.5 truncate rounded-md bg-black/40 px-3 py-1 text-[11px] text-white/50">
          <svg viewBox="0 0 24 24" className="h-2.5 w-2.5 shrink-0 fill-current opacity-60" aria-hidden="true">
            <path d="M12 1a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-1V6a5 5 0 0 0-5-5Zm-3 8V6a3 3 0 1 1 6 0v3H9Z" />
          </svg>
          <span className="truncate">{hostname(url) || 'portfolio'}</span>
        </span>
      </div>
      <div className="relative flex items-center justify-center overflow-hidden bg-[#0a0a0c] p-4 sm:p-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.05),transparent_70%)]" />
        <ParallaxImage
          src={src}
          alt={alt}
          className="w-full max-h-[85vh] object-contain"
        />
        <GlassOverlays />
      </div>
    </div>
  )
}

export function PhoneFrame({ src, alt, floating = false }) {
  return (
    <div
      className={`relative mx-auto w-40 rounded-[2.6rem] bg-black p-2 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.85)] ring-1 ring-white/10 sm:w-48 ${
        floating ? styles.float : ''
      }`}
    >
      <div className="relative aspect-[9/19] w-full overflow-hidden bg-black">
        <ParallaxImage
          src={src}
          alt={alt}
          className="absolute inset-0 h-full w-full object-contain"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-transparent" />
      </div>
      <div className="absolute left-1/2 top-2.5 z-10 h-[22px] w-[84px] -translate-x-1/2 rounded-full bg-black" />
    </div>
  )
}

function BrowserStackShowcase({ images, alt, url }) {
  const [mainIdx, setMainIdx] = useState(0)
  const [hovering, setHovering] = useState(false)
  const reduced = useReducedMotion()
  const parallax = useContext(ParallaxCtx)

  const main = images[mainIdx]
  const others = images.filter((_, i) => i !== mainIdx)
  const left = others[0]
  const right = others[1]
  const spread = hovering ? 72 : 40

  const sideTransition = reduced ? { duration: 0.5 } : SPRING
  const sideAnimate = (side) =>
    reduced
      ? { x: side * spread, rotate: 0, scale: 0.92, opacity: 0.8 }
      : { x: side * spread, rotate: side < 0 ? -6 : 4, scale: side < 0 ? 0.92 : 0.88, opacity: 0.85, filter: 'blur(1px)' }

  return (
    <div className="relative w-full" onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)}>
      <div className="relative z-30 mx-auto w-[72%]">
        <motion.div style={parallax ? { x: parallax.main.x, y: parallax.main.y } : undefined}>
          <BrowserFrame src={main} alt={alt} url={url} />
        </motion.div>
      </div>

      {left && (
        <div className="pointer-events-auto absolute inset-x-0 top-0 z-20 mx-auto w-[72%]">
          <motion.div style={parallax ? { x: parallax.side.x, y: parallax.side.y } : undefined}>
            <motion.div animate={sideAnimate(-1)} transition={sideTransition}>
              <button
                type="button"
                onClick={() => setMainIdx(images.indexOf(left))}
                className="block w-full cursor-pointer"
              >
                <BrowserFrame src={left} alt={alt} url={url} />
              </button>
            </motion.div>
          </motion.div>
        </div>
      )}

      {right && (
        <div className="pointer-events-auto absolute inset-x-0 top-0 z-10 mx-auto w-[72%]">
          <motion.div style={parallax ? { x: parallax.side.x, y: parallax.side.y } : undefined}>
            <motion.div animate={sideAnimate(1)} transition={sideTransition}>
              <button
                type="button"
                onClick={() => setMainIdx(images.indexOf(right))}
                className="block w-full cursor-pointer"
              >
                <BrowserFrame src={right} alt={alt} url={url} />
              </button>
            </motion.div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

function PhoneStackShowcase({ images, alt }) {
  const [mainIdx, setMainIdx] = useState(0)
  const [hovering, setHovering] = useState(false)
  const reduced = useReducedMotion()
  const parallax = useContext(ParallaxCtx)

  const main = images[mainIdx]
  const others = images.filter((_, i) => i !== mainIdx)
  const left = others[0]
  const right = others[1]
  const spread = hovering ? 92 : 60

  const sideTransition = reduced ? { duration: 0.5 } : SPRING
  const sideAnimate = (side) =>
    reduced
      ? { x: side * spread, rotate: 0, scale: 0.85, opacity: 0.7 }
      : { x: side * spread, rotate: side * 11, scale: 0.85, opacity: 0.7 }

  return (
    <div
      className="relative mx-auto h-[440px] w-full max-w-[560px]"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div className="absolute bottom-0 left-1/2 z-30 -translate-x-1/2">
        <motion.div style={parallax ? { x: parallax.main.x, y: parallax.main.y } : undefined}>
          <motion.div
            animate={{ scale: hovering ? 1.06 : 1 }}
            transition={SPRING}
          >
            <PhoneFrame src={main} alt={alt} floating />
          </motion.div>
        </motion.div>
      </div>

      {left && (
        <div className="absolute bottom-0 left-1/2 z-20 -translate-x-1/2">
          <motion.div style={parallax ? { x: parallax.side.x, y: parallax.side.y } : undefined}>
            <motion.button
              type="button"
              onClick={() => setMainIdx(images.indexOf(left))}
              animate={sideAnimate(-1)}
              transition={sideTransition}
              className="block cursor-pointer"
            >
              <PhoneFrame src={left} alt={alt} />
            </motion.button>
          </motion.div>
        </div>
      )}

      {right && (
        <div className="absolute bottom-0 left-1/2 z-20 -translate-x-1/2">
          <motion.div style={parallax ? { x: parallax.side.x, y: parallax.side.y } : undefined}>
            <motion.button
              type="button"
              onClick={() => setMainIdx(images.indexOf(right))}
              animate={sideAnimate(1)}
              transition={sideTransition}
              className="block cursor-pointer"
            >
              <PhoneFrame src={right} alt={alt} />
            </motion.button>
          </motion.div>
        </div>
      )}
    </div>
  )
}

function ShowcaseFrame({ item, mode }) {
  const screenshots = (item.screenshots || item.carouselImages || []).filter(Boolean)
  const primary = item.image || screenshots[0] || ''
  const ratio = useImageRatio(primary)
  const images = screenshots.length >= 2 ? screenshots : [primary]
  const type = detectType(item, ratio, screenshots)

  if (mode === 'card') {
    const t = type === 'phone' || type === 'phone-stack' ? 'phone' : 'browser'
    return t === 'phone' ? (
      <PhoneFrame src={primary} alt={item.title} />
    ) : (
      <BrowserFrame src={primary} alt={item.title} url={item.siteUrl} />
    )
  }

  switch (type) {
    case 'phone':
      return <PhoneFrame src={primary} alt={item.title} floating />
    case 'phone-stack':
      return <PhoneStackShowcase images={images} alt={item.title} />
    case 'browser-stack':
      return <BrowserStackShowcase images={images} alt={item.title} url={item.siteUrl} />
    default:
      return <BrowserFrame src={primary} alt={item.title} url={item.siteUrl} />
  }
}

export default function Showcase({ item, mode = 'stage' }) {
  const screenshots = (item.screenshots || item.carouselImages || []).filter(Boolean)
  if (!item.image && !screenshots.length) return null
  return <ShowcaseFrame item={item} mode={mode} />
}

export function ShowcaseStage({ item }) {
  const reduced = useReducedMotion()
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 90, damping: 18 })
  const sy = useSpring(my, { stiffness: 90, damping: 18 })
  const mainX = useTransform(sx, (v) => v * 16)
  const mainY = useTransform(sy, (v) => v * 10)
  const sideX = useTransform(sx, (v) => v * 10)
  const sideY = useTransform(sy, (v) => v * 6)
  const bgX = useTransform(sx, (v) => -v * 4)
  const bgY = useTransform(sy, (v) => -v * 4)

  const color = GRADIENTS[item.index % GRADIENTS.length]
  const intensity = 0.22 + (item.index % 3) * 0.06

  const handleMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    mx.set((e.clientX - rect.left) / rect.width - 0.5)
    my.set((e.clientY - rect.top) / rect.height - 0.5)
  }

  const reset = () => {
    mx.set(0)
    my.set(0)
  }

  return (
    <div
      className="relative flex h-full w-full items-center justify-center"
      onMouseMove={reduced ? undefined : handleMove}
      onMouseLeave={reduced ? undefined : reset}
    >
      <div className="absolute left-1/2 top-1/2 h-[84%] w-[88%] -translate-x-1/2 -translate-y-1/2">
        <motion.div
          className="h-full w-full rounded-[3rem] border border-white/10 bg-white/[0.03] shadow-[0_0_90px_rgba(0,0,0,0.35)]"
          style={reduced ? undefined : { x: bgX, y: bgY }}
        />
      </div>

      <div className="absolute left-1/2 top-1/2 h-[70%] w-[75%] -translate-x-1/2 -translate-y-1/2">
        <motion.div
          className="h-full w-full rounded-full blur-3xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: intensity }}
          transition={{ duration: 1.1, ease: EASE }}
          style={{
            background: `radial-gradient(circle, ${color}66, transparent 70%)`,
            x: bgX,
            y: bgY,
          }}
        />
      </div>

      <div className="absolute bottom-0 left-1/2 w-[85%] max-w-xl -translate-x-1/2">
        <motion.div
          className="h-14 rounded-full bg-gradient-to-b from-white/[0.06] to-transparent blur-2xl"
          style={reduced ? undefined : { x: bgX }}
        />
      </div>

      <ParallaxCtx.Provider
        value={reduced ? null : { main: { x: mainX, y: mainY }, side: { x: sideX, y: sideY } }}
      >
        <div className={`${styles.float} relative z-10 w-full max-w-4xl px-4`}>
          <Showcase item={item} mode="stage" />
        </div>
      </ParallaxCtx.Provider>
    </div>
  )
}
