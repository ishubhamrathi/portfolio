import { useState } from 'react'
import SpotlightCard from '@/components/SpotlightCard'
import AnimatedContent from '@/components/AnimatedContent'
import GlassSurface from '@/components/GlassSurface'
import { AiFillGithub } from 'react-icons/ai'
import { BiLinkAlt } from 'react-icons/bi'
import { IoMdClose } from 'react-icons/io'
import { useSound } from '@/context/SoundProvider'

function TechIcon({ icon }) {
  if (!icon) return null
  if (/^https?:\/\//i.test(icon)) {
    return (
      <img src={icon} alt="" loading="lazy" className="mr-1 inline-block h-3.5 w-3.5 align-[-2px]" />
    )
  }
  return <span className="mr-1">{icon}</span>
}

function stripHtml(html) {
  return (html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export default function ProjectCard({ project }) {
  const [open, setOpen] = useState(false)
  const { playClick } = useSound()
  const {
    title,
    shortDescription,
    description,
    image,
    carouselImages = [],
    tech = [],
    github,
    deployed,
    status,
    statusLabel,
    categoryPath,
    topCategoryLabel,
  } = project

  return (
    <>
      <AnimatedContent distance={60} duration={0.7} ease="power2.out" threshold={0.15}>
        <SpotlightCard
          className="group cursor-pointer overflow-hidden rounded-3xl border border-border bg-white/[0.03]"
          spotlightColor="rgba(255,255,255,0.12)"
        >
          <button
            type="button"
            className="cursor-target block w-full text-left"
            onClick={() => {
              playClick()
              setOpen(true)
            }}
          >
            <div className="relative aspect-[16/10] overflow-hidden bg-black/50">
              {image ? (
                <img
                  src={image}
                  alt={title}
                  className="h-full w-full object-cover grayscale transition duration-700 group-hover:scale-105 group-hover:grayscale-0"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-dim">No image</div>
              )}
              {(statusLabel || status) && (
                <span className="absolute left-3 top-3 rounded-full border border-border bg-black/70 px-3 py-1 text-xs uppercase tracking-wider text-fg">
                  {statusLabel || status}
                </span>
              )}
            </div>
            <div className="space-y-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-display text-xl font-semibold text-fg">{title}</h3>
                {(topCategoryLabel || categoryPath) && (
                  <span className="shrink-0 text-xs uppercase tracking-wider text-dim">
                    {topCategoryLabel || categoryPath}
                  </span>
                )}
              </div>
              <p className="line-clamp-3 text-sm leading-relaxed text-muted">
                {stripHtml(shortDescription || description)}
              </p>
              <div className="flex flex-wrap gap-2">
                {tech.slice(0, 6).map((t) => (
                  <span key={t.code} className="rounded-full border border-border px-2.5 py-1 text-xs text-muted">
                    <TechIcon icon={t.icon} />
                    {t.label}
                  </span>
                ))}
              </div>
            </div>
          </button>
        </SpotlightCard>
      </AnimatedContent>

      {open && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl">
            <GlassSurface
              width="100%"
              height="auto"
              borderRadius={28}
              backgroundOpacity={0.18}
              brightness={35}
              blur={14}
              className="relative p-6"
              style={{ width: '100%', minHeight: 320 }}
            >
              <button
                type="button"
                className="absolute right-4 top-4 text-fg"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                <IoMdClose size={22} />
              </button>
              {carouselImages.length > 0 ? (
                <div className="mb-5 grid grid-cols-3 gap-2">
                  {carouselImages.map((src) => (
                    <img
                      key={src}
                      src={src}
                      alt={title}
                      loading="lazy"
                      className="h-24 w-full rounded-xl object-cover grayscale"
                    />
                  ))}
                </div>
              ) : (
                image && (
                  <img
                    src={image}
                    alt={title}
                    className="mb-5 max-h-56 w-full rounded-2xl object-cover grayscale"
                  />
                )
              )}
              <h3 className="font-display text-2xl font-semibold">{title}</h3>
              <div
                className="project-rich-text mt-3 text-sm leading-relaxed text-muted"
                dangerouslySetInnerHTML={{ __html: description }}
              />
              <div className="mt-4 flex flex-wrap gap-2">
                {tech.map((t) => (
                  <span key={t.code} className="rounded-full border border-border px-2.5 py-1 text-xs text-muted">
                    <TechIcon icon={t.icon} />
                    {t.label}
                  </span>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-4">
                {github && (
                  <a
                    href={github}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-fg underline-offset-4 hover:underline"
                  >
                    <AiFillGithub /> GitHub
                  </a>
                )}
                {deployed && (
                  <a
                    href={deployed}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-fg underline-offset-4 hover:underline"
                  >
                    <BiLinkAlt /> View
                  </a>
                )}
              </div>
            </GlassSurface>
          </div>
        </div>
      )}
    </>
  )
}
