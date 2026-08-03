import { useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import './BentoGrid.css'

const SPANS = [
  { col: 'span 2', row: 'span 2' },
  { col: 'span 1', row: 'span 1' },
  { col: 'span 1', row: 'span 1' },
  { col: 'span 1', row: 'span 1' },
  { col: 'span 1', row: 'span 1' },
  { col: 'span 2', row: 'span 1' },
  { col: 'span 2', row: 'span 1' },
]

function BentoCard({
  item,
  index,
  enableBorderGlow,
  enableStars,
  particleCount,
  glowColor,
  clickEffect,
  onCardClick,
}) {
  const ref = useRef(null)
  const particlesRef = useRef([])
  const hoverRef = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el || !enableStars) return

    const spawnParticles = () => {
      if (!hoverRef.current) return
      const rect = el.getBoundingClientRect()
      for (let k = 0; k < particleCount; k++) {
        const p = document.createElement('div')
        p.className = 'bento-particle'
        p.style.cssText = `position:absolute;width:4px;height:4px;border-radius:50%;background:rgba(${glowColor},1);box-shadow:0 0 6px rgba(${glowColor},0.6);pointer-events:none;z-index:4;left:${Math.random() * rect.width}px;top:${Math.random() * rect.height}px;`
        el.appendChild(p)
        particlesRef.current.push(p)
        gsap.fromTo(p, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' })
        gsap.to(p, {
          x: (Math.random() - 0.5) * 100,
          y: (Math.random() - 0.5) * 100,
          rotation: Math.random() * 360,
          duration: 2 + Math.random() * 2,
          ease: 'none',
          repeat: -1,
          yoyo: true,
        })
      }
    }

    const clearParticles = () => {
      particlesRef.current.forEach((p) =>
        gsap.to(p, {
          scale: 0,
          opacity: 0,
          duration: 0.3,
          ease: 'back.in(1.7)',
          onComplete: () => p.parentNode?.removeChild(p),
        })
      )
      particlesRef.current = []
    }

    const onEnter = () => {
      hoverRef.current = true
      spawnParticles()
    }
    const onLeave = () => {
      hoverRef.current = false
      clearParticles()
    }

    el.addEventListener('pointerenter', onEnter)
    el.addEventListener('pointerleave', onLeave)

    return () => {
      el.removeEventListener('pointerenter', onEnter)
      el.removeEventListener('pointerleave', onLeave)
      clearParticles()
    }
  }, [enableStars, particleCount, glowColor])

  const handleClick = (e) => {
    const el = ref.current
    if (el && clickEffect) {
      const rect = el.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const maxDistance = Math.max(
        Math.hypot(x, y),
        Math.hypot(x - rect.width, y),
        Math.hypot(x, y - rect.height),
        Math.hypot(x - rect.width, y - rect.height)
      )
      const ripple = document.createElement('div')
      ripple.className = 'bento-ripple'
      ripple.style.cssText = `position:absolute;width:${maxDistance * 2}px;height:${maxDistance * 2}px;border-radius:50%;background:radial-gradient(circle, rgba(${glowColor},0.4) 0%, rgba(${glowColor},0.2) 30%, transparent 70%);left:${x - maxDistance}px;top:${y - maxDistance}px;pointer-events:none;z-index:5;`
      el.appendChild(ripple)
      gsap.fromTo(
        ripple,
        { scale: 0, opacity: 1 },
        { scale: 1, opacity: 0, duration: 0.8, ease: 'power2.out', onComplete: () => ripple.remove() }
      )
    }
    onCardClick?.(item)
  }

  const span = SPANS[index] || { col: 'span 1', row: 'span 1' }

  return (
    <article
      ref={ref}
      className={`bento-card cursor-target ${enableBorderGlow ? 'bento-card--border-glow' : ''}`}
      style={{
        gridColumn: span.col,
        gridRow: span.row,
        '--card-gradient': item.gradient,
        '--glow-color': glowColor,
      }}
      onClick={handleClick}
    >
      <div className="bento-card__img">
        {item.image ? (
          <img src={item.image} alt={item.title} loading="lazy" />
        ) : (
          <div className="bento-card__noimg">No image</div>
        )}
      </div>
      <div className="bento-card__gradient" />
      <div className="bento-card__top">
        {item.handle && <span className="bento-card__label">{item.handle}</span>}
      </div>
      <div className="bento-card__content">
        <h3 className="bento-card__title">{item.title}</h3>
        {item.subtitle && <p className="bento-card__description">{item.subtitle}</p>}
      </div>
    </article>
  )
}

export default function BentoGrid({
  items = [],
  radius = 300,
  damping = 0.45,
  fadeOut = 0.6,
  ease = 'power3.out',
  spotlightRadius = 400,
  particleCount = 12,
  glowColor = '132, 0, 255',
  enableBorderGlow = true,
  enableSpotlight = true,
  enableStars = true,
  clickEffect = true,
  onCardClick,
}) {
  const rootRef = useRef(null)
  const fadeRef = useRef(null)
  const setX = useRef(null)
  const setY = useRef(null)
  const pos = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    setX.current = gsap.quickSetter(el, '--x', 'px')
    setY.current = gsap.quickSetter(el, '--y', 'px')
    const { width, height } = el.getBoundingClientRect()
    pos.current = { x: width / 2, y: height / 2 }
    setX.current(pos.current.x)
    setY.current(pos.current.y)
  }, [])

  const moveTo = (x, y) => {
    gsap.to(pos.current, {
      x,
      y,
      duration: damping,
      ease,
      onUpdate: () => {
        setX.current?.(pos.current.x)
        setY.current?.(pos.current.y)
      },
      overwrite: true,
    })
  }

  const handleMove = (e) => {
    const el = rootRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    moveTo(e.clientX - r.left, e.clientY - r.top)
    gsap.to(fadeRef.current, { opacity: 0, duration: 0.25, overwrite: true })

    if (enableSpotlight) {
      const proximity = spotlightRadius * 0.5
      const fadeDistance = spotlightRadius * 0.75
      el.querySelectorAll('.bento-card').forEach((card) => {
        const cr = card.getBoundingClientRect()
        const relX = ((e.clientX - cr.left) / cr.width) * 100
        const relY = ((e.clientY - cr.top) / cr.height) * 100
        const centerX = cr.left + cr.width / 2
        const centerY = cr.top + cr.height / 2
        const dist = Math.hypot(e.clientX - centerX, e.clientY - centerY) - Math.max(cr.width, cr.height) / 2
        const effective = Math.max(0, dist)
        let glow = 0
        if (effective <= proximity) glow = 1
        else if (effective <= fadeDistance) glow = (fadeDistance - effective) / (fadeDistance - proximity)
        card.style.setProperty('--glow-x', `${relX}%`)
        card.style.setProperty('--glow-y', `${relY}%`)
        card.style.setProperty('--glow-intensity', glow.toFixed(3))
        card.style.setProperty('--glow-radius', `${spotlightRadius}px`)
      })
    }
  }

  const handleLeave = () => {
    gsap.to(fadeRef.current, { opacity: 1, duration: fadeOut, overwrite: true })
    if (enableSpotlight) {
      rootRef.current?.querySelectorAll('.bento-card').forEach((card) => {
        card.style.setProperty('--glow-intensity', '0')
      })
    }
  }

  return (
    <div
      ref={rootRef}
      className="bento-grid"
      style={{ '--r': `${radius}px` }}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
    >
      {items.map((item, i) => (
        <BentoCard
          key={item.id || i}
          item={item}
          index={i}
          enableBorderGlow={enableBorderGlow}
          enableStars={enableStars}
          particleCount={particleCount}
          glowColor={glowColor}
          clickEffect={clickEffect}
          onCardClick={onCardClick}
        />
      ))}
      <div className="bento-overlay" />
      <div ref={fadeRef} className="bento-fade" />
    </div>
  )
}
