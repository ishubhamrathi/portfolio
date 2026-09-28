import { useNavigate } from 'react-router-dom'
import SpotlightCard from '@/components/SpotlightCard'
import AnimatedContent from '@/components/AnimatedContent'
import { useSound } from '@/context/SoundProvider'

function stripHtml(html) {
  return (html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function CategoryChip({ label }) {
  return (
    <span className="absolute left-3 top-3 rounded-full border border-border bg-black/60 px-3 py-1 text-xs uppercase tracking-wider text-fg backdrop-blur-sm">
      {label}
    </span>
  )
}

function Cover({ post }) {
  const coverClasses = 'relative aspect-[16/9] overflow-hidden bg-black/50 lg:aspect-auto lg:h-full lg:min-h-[260px]'

  if (!post.image) {
    return null
  }

  return (
    <div className={coverClasses}>
      <img
        src={post.image}
        alt={post.title}
        className="h-full w-full object-cover grayscale transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0"
        loading="lazy"
      />
      {post.category && <CategoryChip label={post.category} />}
    </div>
  )
}

function TitleWithInitial({ title }) {
  const trimmed = (title || '').trim()
  const initial = trimmed.charAt(0) || 'P'
  const rest = trimmed.slice(1)
  return (
    <h3 className="font-display font-semibold leading-tight text-fg">
      <span className="font-display text-6xl leading-[0.8] md:text-7xl">{initial}</span>
      <span className="text-2xl md:text-3xl">{rest}</span>
    </h3>
  )
}

function Meta({ post }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-dim">
      {post.author && (
        <span className="inline-flex items-center gap-1.5">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[10px] font-semibold text-fg">
            {post.author.charAt(0).toUpperCase()}
          </span>
          {post.author}
        </span>
      )}
      {post.publishedAt && (
        <>
          <span aria-hidden>·</span>
          <span>{formatDate(post.publishedAt)}</span>
        </>
      )}
      {post.readingTime && (
        <>
          <span aria-hidden>·</span>
          <span>{post.readingTime}</span>
        </>
      )}
    </div>
  )
}

export default function BlogCard({ post, flip = false }) {
  const navigate = useNavigate()
  const { playClick } = useSound()

  const openPost = () => {
    playClick()
    navigate(`/blogs/${post.slug}`, { state: { post } })
  }

  return (
    <AnimatedContent distance={40} duration={0.6} ease="power3.out" threshold={0.1}>
      <SpotlightCard
        className="group cursor-pointer overflow-hidden rounded-3xl border border-border bg-white/[0.03]"
        spotlightColor="rgba(255,255,255,0.12)"
      >
        <button
          type="button"
          className="cursor-target grid w-full text-left lg:grid-cols-2"
          onClick={openPost}
        >
          <div className={flip ? 'lg:order-2' : 'lg:order-1'}>
            <Cover post={post} />
          </div>
          <div
            className={`flex flex-col space-y-4 p-6 md:p-8 md:justify-center ${post.image ? (flip ? 'lg:order-1' : 'lg:order-2') : 'lg:col-span-2'}`}
          >
            <TitleWithInitial title={post.title} />
            <p className="line-clamp-3 text-sm leading-relaxed text-muted md:text-base">
              {stripHtml(post.excerpt || 'Read the full post to learn more.')}
            </p>
            <Meta post={post} />
            <span className="inline-flex items-center gap-1 text-xs text-dim transition-colors group-hover:text-fg">
              Read post <span aria-hidden>→</span>
            </span>
          </div>
        </button>
      </SpotlightCard>
    </AnimatedContent>
  )
}