import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { HiArrowRight } from 'react-icons/hi2'
import { useSound } from '@/context/SoundProvider'
import { BrowserFrame, PhoneFrame } from '@/components/Showcase/Showcase'
import './featuredShowcase.css'

const SPRING = { type: 'spring', stiffness: 130, damping: 20 }
const GRADIENTS = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899', '#22D3EE']

function detectType(previewType, ratio) {
  if (previewType && previewType !== 'auto') {
    return previewType === 'tablet' || previewType === 'laptop' ? 'browser' : previewType
  }
  if (ratio && ratio < 0.85) return 'phone'
  return 'browser'
}

function FallbackVisual({ index, title }) {
  const color = GRADIENTS[index % GRADIENTS.length]
  return (
    <div
      className="flex h-full w-full items-center justify-center"
      style={{ background: `linear-gradient(135deg, ${color}, #000)` }}
    >
      <span className="font-display text-8xl font-bold text-white/90">{(title || '').charAt(0)}</span>
    </div>
  )
}

function ThumbnailStack({ thumbnails, type, url, alt, index }) {
  const [hovering, setHovering] = useState(false)
  const reduced = useReducedMotion()
  const primary = thumbnails[0] || ''

  if (thumbnails.length < 2) {
    const Frame = type === 'phone' ? PhoneFrame : BrowserFrame
    return (
      <div className="flex h-full w-full items-center justify-center">
        {primary ? <Frame src={primary} alt={alt} url={url} /> : <FallbackVisual index={index} title={alt} />}
      </div>
    )
  }

  const Frame = type === 'phone' ? PhoneFrame : BrowserFrame
  const main = thumbnails[0]
  const side1 = thumbnails[1]
  const side2 = thumbnails[2]

  const spreadX = hovering ? 110 : 18
  const spreadRotate = hovering ? 1 : 0.5

  return (
    <div
      className="flex h-full w-full items-center justify-center"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div className="relative h-full w-full">
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={hovering ? { scale: 1.04, y: -8 } : { scale: 1, y: 0 }}
          transition={reduced ? { duration: 0.3 } : SPRING}
        >
          <Frame src={main} alt={alt} url={url} />
        </motion.div>

        {side1 && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={hovering
              ? { x: `-${spreadX}%`, rotate: -6 * spreadRotate, scale: 0.92, opacity: 1, filter: 'blur(0px)' }
              : { x: `-${spreadX / 5}%`, rotate: -2, scale: 0.88, opacity: 0.6, filter: 'blur(1px)' }
            }
            transition={reduced ? { duration: 0.4 } : SPRING}
          >
            <Frame src={side1} alt={alt} url={url} />
          </motion.div>
        )}

        {side2 && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={hovering
              ? { x: `${spreadX}%`, rotate: 4 * spreadRotate, scale: 0.88, opacity: 1, filter: 'blur(0px)' }
              : { x: `${spreadX / 5}%`, rotate: 2, scale: 0.88, opacity: 0.6, filter: 'blur(1px)' }
            }
            transition={reduced ? { duration: 0.4 } : SPRING}
          >
            <Frame src={side2} alt={alt} url={url} />
          </motion.div>
        )}
      </div>
    </div>
  )
}

function ProjectOverview({ item, isActive, onOpen }) {
  return (
    <motion.article
      initial={false}
      animate={{ opacity: isActive ? 1 : 0.3, y: isActive ? 0 : 30 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="w-full"
    >
      <p className="text-xs uppercase tracking-[0.35em] text-dim">
        {item.number} — {item.category}
      </p>
      <h3 className="mt-4 font-display text-3xl font-bold text-fg lg:text-4xl xl:text-5xl">
        {item.title}
      </h3>
      <p className="mt-5 max-w-lg font-body text-base leading-relaxed text-muted">
        {item.description}
      </p>
      {item.tech.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2">
          {item.tech.map((t, i) => (
            <span
              key={i}
              className="rounded-full border border-border bg-white/[0.04] px-3 py-1 text-xs text-muted"
            >
              {t.label}
            </span>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={onOpen}
        className="group mt-8 inline-flex cursor-target items-center gap-2 rounded-full border border-fg/40 px-6 py-3 text-sm font-medium text-fg transition-colors hover:bg-fg hover:text-bg"
      >
        View Project
        <HiArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </button>
    </motion.article>
  )
}

function ProjectOverviewNav({ items, activeIdx, onNavigate }) {
  return (
    <div className="flex shrink-0 flex-col gap-3">
      {items.map((item, i) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onNavigate(i)}
          className={`group flex items-center gap-3 transition-all ${
            i === activeIdx ? 'opacity-100' : 'opacity-30 hover:opacity-60'
          }`}
        >
          <span
            className={`block h-px transition-all ${
              i === activeIdx ? 'w-8 bg-fg' : 'w-4 bg-fg/40 group-hover:w-6 group-hover:bg-fg/60'
            }`}
          />
          <span className="text-xs text-dim">{item.number}</span>
        </button>
      ))}
    </div>
  )
}

function MobileFeaturedCard({ item, onOpen }) {
  const thumbnails = item.thumbnails.filter(Boolean)
  const primary = thumbnails[0] || ''
  const type = item.previewType === 'phone' ? 'phone' : 'browser'

  return (
    <article className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] shadow-xl">
      <div className="relative flex items-center justify-center overflow-hidden bg-black/30 py-10">
        {primary ? (
          type === 'phone' ? (
            <PhoneFrame src={primary} alt={item.title} />
          ) : (
            <BrowserFrame src={primary} alt={item.title} url={item.siteUrl} />
          )
        ) : (
          <FallbackVisual index={item.index} title={item.title} />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <p className="absolute bottom-3 left-4 text-xs uppercase tracking-[0.3em] text-white/80">
          {item.number} — {item.category}
        </p>
      </div>
      <div className="p-6">
        <h3 className="font-display text-2xl font-bold text-fg">{item.title}</h3>
        <p className="mt-3 font-body text-sm leading-relaxed text-muted">{item.description}</p>
        {item.tech.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {item.tech.map((t, i) => (
              <span key={i} className="rounded-full border border-border bg-white/[0.04] px-3 py-1 text-xs text-muted">
                {t.label}
              </span>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={() => onOpen(item)}
          className="group mt-6 inline-flex cursor-target items-center gap-2 rounded-full border border-fg/40 px-5 py-2.5 text-sm font-medium text-fg transition-colors hover:bg-fg hover:text-bg"
        >
          View Project
          <HiArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </article>
  )
}

export default function FeaturedShowcase({ items = [] }) {
  const navigate = useNavigate()
  const { playClick } = useSound()
  const reduced = useReducedMotion()
  const [activeProjectIdx, setActiveProjectIdx] = useState(0)
  const projectBlockRefs = useRef([])

  const openProject = useCallback((item) => {
    try { playClick() } catch {}
    navigate(item.url, { state: { project: item.raw } })
  }, [navigate, playClick])

  useEffect(() => {
    if (!items.length) return
    const els = projectBlockRefs.current.filter(Boolean)
    if (!els.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        let bestIdx = -1
        let bestRatio = 0
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio > bestRatio) {
            bestRatio = entry.intersectionRatio
            bestIdx = Number(entry.target.dataset.projectIdx)
          }
        }
        if (bestIdx >= 0) setActiveProjectIdx(bestIdx)
      },
      { rootMargin: '-40% 0px -40% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
    )
    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [items.length])

  useEffect(() => {
    const next = items[activeProjectIdx + 1]
    if (next) {
      const firstThumb = next.thumbnails.find(Boolean)
      if (firstThumb) {
        const img = new Image()
        img.src = firstThumb
      }
    }
  }, [activeProjectIdx, items])

  const scrollToProject = useCallback((idx) => {
    const el = projectBlockRefs.current[idx]
    if (el) {
      el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' })
    }
  }, [reduced])

  const goToProjectsPage = useCallback(() => {
    try { playClick() } catch {}
    navigate('/projects')
  }, [navigate, playClick])

  const activeItem = items[activeProjectIdx]

  return (
    <div className="relative">
      {/* Desktop: two-column split */}
      <div className="featured-showcase-desktop hidden lg:flex">
        {/* Left: scrollable thumbnail strip — ONE slot per project */}
        <div className="featured-showcase-track">
          {items.map((item, pIdx) => {
            const thumbnails = item.thumbnails.filter(Boolean)
            const type = detectType(item.previewType, null)
            return (
              <div
                key={item.id}
                ref={(el) => { projectBlockRefs.current[pIdx] = el }}
                data-project-idx={pIdx}
                className="featured-showcase-project-block"
              >
                <div className="featured-showcase-slot">
                  <ThumbnailStack
                    thumbnails={thumbnails}
                    type={type}
                    url={item.siteUrl}
                    alt={item.title}
                    index={item.index}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* Right: sticky overview + nav */}
        <div className="featured-showcase-overview">
          <div className="sticky top-0 flex h-screen flex-col justify-center px-8 xl:px-12">
            <div className="flex items-start gap-8">
              <div className="flex-1">
                <AnimatePresence mode="wait">
                  {activeItem && (
                    <motion.div
                      key={activeItem.id}
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -24 }}
                      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <ProjectOverview
                        item={activeItem}
                        isActive={true}
                        onOpen={() => openProject(activeItem)}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {items.length > 1 && (
                <ProjectOverviewNav
                  items={items}
                  activeIdx={activeProjectIdx}
                  onNavigate={scrollToProject}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: stacked cards */}
      <div className="flex flex-col gap-8 pb-8 lg:hidden">
        {items.map((item, i) => (
          <MobileFeaturedCard
            key={item.id}
            item={{ ...item, index: i }}
            onOpen={openProject}
          />
        ))}
      </div>

      {/* View All Projects */}
      <div className="featured-showcase-view-all mx-auto max-w-7xl px-8 py-16 text-center">
        <div className="flex items-center justify-center gap-6">
          <div className="h-px flex-1 bg-border" />
          <button
            type="button"
            onClick={goToProjectsPage}
            className="group cursor-target inline-flex items-center gap-3 rounded-full border border-fg/30 px-8 py-4 text-sm font-medium text-fg transition-all hover:border-fg/60 hover:bg-fg hover:text-bg"
          >
            View All Projects
            <HiArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
          <div className="h-px flex-1 bg-border" />
        </div>
      </div>
    </div>
  )
}
