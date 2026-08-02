import { useState } from 'react'
import SpotlightCard from '@/components/SpotlightCard'
import AnimatedContent from '@/components/AnimatedContent'
import GlassSurface from '@/components/GlassSurface'
import { AiFillGithub } from 'react-icons/ai'
import { BiLinkAlt } from 'react-icons/bi'
import { IoMdClose } from 'react-icons/io'
import { useSound } from '@/context/SoundProvider'

export default function ProjectCard({ project }) {
  const [open, setOpen] = useState(false)
  const { playClick } = useSound()
  const {
    title,
    description,
    image,
    tech = [],
    github,
    deployed,
    status,
    categoryPath,
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
              {status && (
                <span className="absolute left-3 top-3 rounded-full border border-border bg-black/70 px-3 py-1 text-xs uppercase tracking-wider text-fg">
                  {status}
                </span>
              )}
            </div>
            <div className="space-y-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-display text-xl font-semibold text-fg">{title}</h3>
                {categoryPath && (
                  <span className="shrink-0 text-xs uppercase tracking-wider text-dim">{categoryPath}</span>
                )}
              </div>
              <p className="line-clamp-3 text-sm leading-relaxed text-muted">{description}</p>
              <div className="flex flex-wrap gap-2">
                {tech.slice(0, 4).map((t) => (
                  <span key={t} className="rounded-full border border-border px-2.5 py-1 text-xs text-muted">
                    {t}
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
              {image && (
                <img src={image} alt={title} className="mb-5 max-h-56 w-full rounded-2xl object-cover grayscale" />
              )}
              <h3 className="font-display text-2xl font-semibold">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {tech.map((t) => (
                  <span key={t} className="rounded-full border border-border px-2.5 py-1 text-xs text-muted">
                    {t}
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
