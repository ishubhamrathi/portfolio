import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { IoMdClose } from 'react-icons/io'
import { getBlogPost } from '@/services/contentApi'
import { useSound } from '@/context/SoundProvider'
import BlogSEO from '@/components/Blog/BlogSEO'

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function BlogDetailPage({ slug }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { playClick } = useSound()
  const [post, setPost] = useState(() => {
    const passed = location.state?.post
    return passed && (passed.slug === slug || String(passed.id) === String(slug)) ? passed : null
  })
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (post) return
    let cancelled = false
    getBlogPost(slug).then((p) => {
      if (cancelled) return
      if (p) setPost(p)
      else setNotFound(true)
    })
    return () => {
      cancelled = true
    }
  }, [slug, post])

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
      {post && <BlogSEO post={post} />}
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 bg-bg/85 px-4 py-4 backdrop-blur-md md:px-8">
        <button
          type="button"
          onClick={close}
          className="cursor-target text-sm text-dim transition hover:text-fg"
        >
          &#8594; Back to blog
        </button>
        <button
          type="button"
          aria-label="Close post"
          onClick={close}
          className="cursor-target flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border bg-black/60 text-fg transition hover:border-fg"
        >
          <IoMdClose size={28} />
        </button>
      </div>

      <div className="mx-auto max-w-3xl px-5 pb-24 md:px-8">
        {notFound ? (
          <p className="py-24 text-center text-muted">Post not found.</p>
        ) : !post ? (
          <div className="py-24">
            <div className="mx-auto h-8 w-2/3 animate-pulse rounded bg-white/10" />
            <div className="mt-8 h-56 w-full animate-pulse rounded-3xl bg-white/5" />
          </div>
        ) : (
          <>
            <div className="mb-6 flex flex-wrap items-center gap-3 text-xs uppercase tracking-wider text-dim">
              {post.category && <span>{post.category}</span>}
              {post.readingTime && <span>&#183; {post.readingTime}</span>}
            </div>

            <h1 className="font-display text-4xl font-bold text-fg md:text-5xl">{post.title}</h1>

            <div className="mt-6 flex items-center gap-4 text-sm text-dim">
              {post.author && <span>By {post.author}</span>}
              {post.publishedAt && <span>&#183; {formatDate(post.publishedAt)}</span>}
            </div>

            {post.image && (
              <img
                src={post.image}
                alt={post.title}
                loading="lazy"
                className="mt-8 w-full rounded-3xl object-cover grayscale"
              />
            )}

            <div
              className="blog-rich-text mt-8 text-sm leading-relaxed text-muted md:text-base"
              dangerouslySetInnerHTML={{ __html: post.content || post.excerpt || '' }}
            />

            {Array.isArray(post.tags) && post.tags.length > 0 && (
              <div className="mt-8">
                <p className="mb-3 text-xs uppercase tracking-[0.3em] text-dim">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-border px-3 py-1.5 text-sm text-muted"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-10">
              <button
                type="button"
                onClick={close}
                className="cursor-target rounded-full border border-border px-5 py-2 text-sm text-muted transition hover:border-fg hover:text-fg"
              >
                &#8594; Back to blog
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
