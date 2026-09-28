import { useEffect, useState, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { IoMdClose } from 'react-icons/io'
import { AiFillGithub } from 'react-icons/ai'
import { BiLinkAlt } from 'react-icons/bi'
import TechIcon from '@/components/Project/TechIcon'
import { useContent } from '@/context/ContentProvider'
import { useSound } from '@/context/SoundProvider'
import { mapApiProject } from '@/services/contentApi'

function stripHtml(html) {
  return (html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export default function ProjectDetailPage({ id }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { playClick } = useSound()
  const { content } = useContent()

  const project = useMemo(() => {
    if (!content?.portfolio?.projects?.items) return null
    const found = content.portfolio.projects.items.find((p) => String(p.id) === String(id))
    return found ? mapApiProject(found) : null
  }, [content, id])

  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!project) setNotFound(true)
  }, [project])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const close = () => {
    playClick()
    if (location.key === 'default') navigate('/')
    else navigate(-1)
  }

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-bg">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 bg-bg/85 px-4 py-4 backdrop-blur-md md:px-8">
        <button
          type="button"
          onClick={close}
          className="cursor-target text-sm text-dim transition hover:text-fg"
        >
          ← Back to home
        </button>
        <button
          type="button"
          aria-label="Close project"
          onClick={close}
          className="cursor-target flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border bg-black/60 text-fg transition hover:border-fg"
        >
          <IoMdClose size={28} />
        </button>
      </div>

      <div className="mx-auto max-w-3xl px-5 pb-24 md:px-8">
        {notFound ? (
          <p className="py-24 text-center text-muted">Project not found.</p>
        ) : !project ? (
          <div className="py-24">
            <div className="mx-auto h-8 w-2/3 animate-pulse rounded bg-white/10" />
            <div className="mt-8 h-56 w-full animate-pulse rounded-3xl bg-white/5" />
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-wider text-dim">
              {project.topCategoryLabel && <span>{project.topCategoryLabel}</span>}
              {project.statusLabel && (
                <span className="rounded-full border border-border px-3 py-1 text-fg">
                  {project.statusLabel}
                </span>
              )}
              {project.categoryPath && <span>{project.categoryPath}</span>}
            </div>
            <h1 className="mt-4 font-display text-4xl font-bold text-fg md:text-5xl">{project.title}</h1>

            {project.carouselImages.length > 0 ? (
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {project.carouselImages.map((src) => (
                  <img
                    key={src}
                    src={src}
                    alt={project.title}
                    loading="lazy"
                    className="w-full rounded-2xl object-cover grayscale"
                  />
                ))}
              </div>
            ) : (
              project.image && (
                <img
                  src={project.image}
                  alt={project.title}
                  loading="lazy"
                  className="mt-8 w-full rounded-3xl object-cover grayscale"
                />
              )
            )}

            <div
              className="project-rich-text mt-8 text-sm leading-relaxed text-muted md:text-base"
              dangerouslySetInnerHTML={{ __html: project.description || stripHtml(project.shortDescription) }}
            />

            {project.tech.length > 0 && (
              <div className="mt-8">
                <p className="mb-3 text-xs uppercase tracking-[0.3em] text-dim">Tech</p>
                <div className="flex flex-wrap gap-2">
                  {project.tech.map((t) => (
                    <span key={t.code} className="rounded-full border border-border px-3 py-1.5 text-sm text-muted">
                      <TechIcon icon={t.icon} />
                      {t.label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {(project.github || project.deployed) && (
              <div className="mt-8 flex flex-wrap gap-4">
                {project.github && (
                  <a
                    href={project.github}
                    target="_blank"
                    rel="noreferrer"
                    className="cursor-target inline-flex items-center gap-2 text-sm text-fg underline-offset-4 hover:underline"
                  >
                    <AiFillGithub /> GitHub
                  </a>
                )}
                {project.deployed && (
                  <a
                    href={project.deployed}
                    target="_blank"
                    rel="noreferrer"
                    className="cursor-target inline-flex items-center gap-2 text-sm text-fg underline-offset-4 hover:underline"
                  >
                    <BiLinkAlt /> View
                  </a>
                )}
              </div>
            )}

            <div className="mt-10">
              <button
                type="button"
                onClick={close}
                className="cursor-target rounded-full border border-border px-5 py-2 text-sm text-muted transition hover:border-fg hover:text-fg"
              >
                ← Back to projects
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
