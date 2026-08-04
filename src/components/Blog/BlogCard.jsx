import { useNavigate } from 'react-router-dom'
import AnimatedContent from '@/components/AnimatedContent'
import { useSound } from '@/context/SoundProvider'

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function BlogCard({ post }) {
  const navigate = useNavigate()
  const { playClick } = useSound()

  const openPost = () => {
    playClick()
    navigate(`/blogs/${post.slug}`, { state: { post } })
  }

  return (
    <AnimatedContent distance={40} duration={0.6} ease="power3.out" threshold={0.1}>
      <button
        type="button"
        className="cursor-target group relative block w-full text-left"
        onClick={openPost}
      >
        <div className="relative overflow-hidden rounded-3xl border border-border bg-white/[0.03] transition-all duration-300 group-hover:border-fg/50">
          {post.image ? (
            <div className="relative aspect-[16/9] overflow-hidden">
              <img
                src={post.image}
                alt={post.title}
                className="h-full w-full object-cover grayscale transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0"
                loading="lazy"
              />
              {post.category && (
                <span className="absolute left-3 top-3 rounded-full border border-border bg-black/60 px-3 py-1 text-xs uppercase tracking-wider text-fg">
                  {post.category}
                </span>
              )}
            </div>
          ) : (
            <div className="flex h-36 items-center justify-center text-dim">No image</div>
          )}
          <div className="p-5 space-y-3">
            <h3 className="font-display text-xl font-semibold text-fg">{post.title}</h3>
            <p className="line-clamp-3 text-sm leading-relaxed text-muted">
              {post.excerpt || 'Read the full post to learn more.'}
            </p>
            <div className="flex flex-wrap items-center gap-2 text-xs text-dim">
              {post.author && <span>{post.author}</span>}
              {post.publishedAt && <span>· {formatDate(post.publishedAt)}</span>}
              {post.readingTime && <span>· {post.readingTime}</span>}
            </div>
          </div>
        </div>
      </button>
    </AnimatedContent>
  )
}
