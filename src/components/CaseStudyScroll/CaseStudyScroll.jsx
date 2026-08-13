import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { HiArrowRight } from 'react-icons/hi2'
import { useSound } from '@/context/SoundProvider'
import Showcase, { ShowcaseStage } from '@/components/Showcase/Showcase'

const EASE = [0.22, 1, 0.36, 1]
const GRADIENTS = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899', '#22D3EE']

function FallbackVisual({ item }) {
  const color = GRADIENTS[item.index % GRADIENTS.length]
  return (
    <div
      className="flex h-full w-full items-center justify-center"
      style={{ background: `linear-gradient(135deg, ${color}, #000)` }}
    >
      <span className="font-display text-8xl font-bold text-white/90">{item.title.charAt(0)}</span>
    </div>
  )
}

function MetricsList({ metrics }) {
  if (!metrics.length) return null
  return (
    <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
      {metrics.map((m, i) => (
        <div key={i} className="rounded-2xl border border-border bg-white/[0.04] p-4">
          <p className="font-display text-xl font-semibold text-fg">{m.value}</p>
          <p className="mt-1 text-[11px] uppercase tracking-wider text-dim">{m.label}</p>
        </div>
      ))}
    </div>
  )
}

function TechPills({ tech }) {
  if (!tech.length) return null
  return (
    <div className="mt-8 flex flex-wrap gap-2">
      {tech.map((t, i) => (
        <span
          key={i}
          className="rounded-full border border-border bg-white/[0.04] px-3 py-1 text-xs text-muted"
        >
          {t.label}
        </span>
      ))}
    </div>
  )
}

function CtaButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group mt-10 inline-flex cursor-target items-center gap-2 rounded-full border border-fg/40 px-6 py-3 text-sm font-medium text-fg transition-colors hover:bg-fg hover:text-bg"
    >
      View Case Study
      <HiArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
    </button>
  )
}

function DesktopVisual({ item }) {
  return (
    <div className="group relative flex h-full w-full items-center justify-center overflow-hidden bg-[#0a0a0c]">
      {item.image ? (
        <motion.img
          src={item.image}
          alt={item.title}
          loading="lazy"
          decoding="async"
          className="max-h-full max-w-full object-contain"
          whileHover={{ scale: 1.04 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      ) : (
        <FallbackVisual item={item} />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
    </div>
  )
}

function NarrativeContent({ item, isActive }) {
  return (
    <motion.article
      initial={false}
      animate={{ opacity: isActive ? 1 : 0.35, y: isActive ? 0 : 24 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="w-full"
    >
      <p className="text-xs uppercase tracking-[0.35em] text-dim">
        {item.number} — {item.category}
      </p>
      <h3 className="mt-4 font-display text-3xl font-bold text-fg lg:text-4xl">{item.title}</h3>
      <p className="mt-5 font-body text-base leading-relaxed text-muted">{item.description}</p>
      <MetricsList metrics={item.metrics} />
      <TechPills tech={item.tech} />
    </motion.article>
  )
}

function MobileCard({ item, onOpen, premium = false }) {
  return (
    <article className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] shadow-xl">
      <div
        className={
          premium
            ? 'relative flex items-center justify-center overflow-hidden bg-black/30 py-10'
            : 'relative aspect-[4/3] overflow-hidden'
        }
      >
        {item.image ? (
          premium ? (
            <Showcase item={item} mode="card" />
          ) : (
            <img
              src={item.image}
              alt={item.title}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-contain"
            />
          )
        ) : (
          <FallbackVisual item={item} />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <p className="absolute bottom-3 left-4 text-xs uppercase tracking-[0.3em] text-white/80">
          {item.number} — {item.category}
        </p>
      </div>
      <div className="p-6">
        <h3 className="font-display text-2xl font-bold text-fg">{item.title}</h3>
        <p className="mt-3 font-body text-sm leading-relaxed text-muted">{item.description}</p>
        <MetricsList metrics={item.metrics} />
        <TechPills tech={item.tech} />
        <CtaButton onClick={() => onOpen(item)} />
      </div>
    </article>
  )
}

export default function CaseStudyScroll({ items = [], premium = false }) {
  const navigate = useNavigate()
  const { playClick } = useSound()
  const reduced = useReducedMotion()
  const [active, setActive] = useState(0)
  const blockRefs = useRef([])

  useEffect(() => {
    if (!items.length) return
    const els = blockRefs.current
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = els.indexOf(entry.target)
            if (idx >= 0) setActive(idx)
          }
        })
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 }
    )
    els.forEach((el) => el && observer.observe(el))
    return () => observer.disconnect()
  }, [items.length])

  useEffect(() => {
    const next = items[active + 1]
    if (next?.image) {
      const img = new Image()
      img.src = next.image
    }
  }, [active, items])

  const openCaseStudy = (item) => {
    try {
      playClick()
    } catch {}
    const project = items.find((p) => p.id === item.id)
    navigate(item.url, { state: { project } })
  }

  const scrollToBlock = (index) => {
    const el = blockRefs.current[index]
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const goToProjectsPage = () => {
    try {
      playClick()
    } catch {}
    navigate('/projects')
  }

  const imageTransition = reduced
    ? { duration: 0 }
    : { duration: 0.65, ease: EASE }

  return (
    <div className="relative">
      <div className="hidden lg:flex">
        <div className="sticky top-0 flex h-screen w-[60%] items-center justify-center p-8">
          <AnimatePresence initial={false}>
            <motion.div
              key={items[active]?.id ?? 'none'}
              className="absolute inset-x-3 top-3 bottom-[7.5rem] overflow-hidden rounded-3xl shadow-2xl ring-1 ring-white/10"
              initial={{
                opacity: 0,
                scale: reduced ? 1 : 0.95,
                filter: reduced ? 'blur(0px)' : 'blur(10px)',
              }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{
                opacity: 0,
                scale: reduced ? 1 : 0.9,
                filter: reduced ? 'blur(0px)' : 'blur(10px)',
              }}
              transition={imageTransition}
            >
              {items[active] &&
                (premium && items[active].image ? (
                  <ShowcaseStage item={items[active]} />
                ) : (
                  <DesktopVisual item={items[active]} />
                ))}
            </motion.div>
          </AnimatePresence>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-24 bg-gradient-to-t from-black/70 to-transparent" />

          <div className="absolute left-6 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-4">
            {items.map((item, i) => (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollToBlock(i)}
                className="group flex cursor-target items-center gap-2"
              >
                <span
                  className={`h-px transition-all duration-500 ${
                    i === active ? 'w-10 bg-fg' : 'w-5 bg-white/30 group-hover:bg-white/60'
                  }`}
                />
                <span
                  className={`font-display text-xs transition-colors duration-500 ${
                    i === active ? 'text-fg' : 'text-white/40 group-hover:text-white/70'
                  }`}
                >
                  {item.number}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="w-[40%]">
          {items.map((item, i) => (
            <div
              key={item.id}
              ref={(el) => {
                blockRefs.current[i] = el
              }}
              className="flex min-h-screen flex-col items-start justify-center px-6 pb-40 pt-24 xl:px-10"
            >
              <NarrativeContent item={item} isActive={i === active} />
              <CtaButton onClick={() => openCaseStudy(item)} />
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-8 pb-40 lg:hidden">
        {items.map((item, i) => (
          <MobileCard
            key={item.id}
            item={{ ...item, index: i }}
            onOpen={openCaseStudy}
            premium={premium}
          />
        ))}
      </div>

      {items.length > 0 && (
        <div className="sticky bottom-[5.5rem] z-30 border-t border-white/10 bg-bg/85 backdrop-blur-xl lg:bottom-0 lg:z-20">
          <div className="flex flex-col items-center gap-1.5 px-6 py-5 text-center">
            <button
              type="button"
              onClick={goToProjectsPage}
              className="group inline-flex cursor-target items-center gap-3 rounded-full border border-fg/30 bg-white/[0.04] px-7 py-3 text-sm font-medium text-fg transition-all duration-300 hover:border-fg/60 hover:bg-white/[0.08] hover:shadow-[0_0_32px_rgba(255,255,255,0.1)]"
            >
              View All Projects
              <HiArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5" />
            </button>
            <p className="text-xs text-dim">Explore all projects, experiments and case studies.</p>
          </div>
        </div>
      )}
    </div>
  )
}
