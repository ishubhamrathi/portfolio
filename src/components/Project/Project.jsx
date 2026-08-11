import { useNavigate } from 'react-router-dom'
import SpotlightCard from '@/components/SpotlightCard'
import AnimatedContent from '@/components/AnimatedContent'
import TechIcon from '@/components/Project/TechIcon'
import { useSound } from '@/context/SoundProvider'

function stripHtml(html) {
  return (html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export default function ProjectCard({ project }) {
  const navigate = useNavigate()
  const { playClick } = useSound()
  const {
    title,
    shortDescription,
    description,
    image,
    tech = [],
    status,
    statusLabel,
    categoryPath,
    topCategoryLabel,
  } = project

  const openProject = () => {
    try {
      playClick()
    } catch {}
    navigate(`/projects/${project.id}`, { state: { project } })
  }

  return (
    <AnimatedContent distance={60} duration={0.7} ease="power2.out" threshold={0.15}>
      <SpotlightCard
        className="group cursor-pointer overflow-hidden rounded-3xl border border-border bg-white/[0.03]"
        spotlightColor="rgba(255,255,255,0.12)"
      >
        <button
          type="button"
          className="cursor-target block w-full text-left"
          onClick={openProject}
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
  )
}
