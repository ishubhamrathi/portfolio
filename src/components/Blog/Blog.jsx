import { useEffect, useState } from 'react'
import FadeContent from '@/components/FadeContent'
import ShinyText from '@/components/ShinyText'
import BlogCard from '@/components/Blog/BlogCard'
import { getBlogPosts } from '@/services/contentApi'

const PAGE_SIZE = 4

export default function Blog() {
  const [posts, setPosts] = useState([])
  const [source, setSource] = useState('loading')
  const [title, setTitle] = useState('Blog')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  useEffect(() => {
    getBlogPosts({ limit: 12 }).then((data) => {
      setPosts(data.posts || [])
      setSource(data.source)
      setTitle(data.title || 'Blog')
    })
  }, [])

  if (source === 'none' && posts.length === 0) {
    return null
  }

  const visible = posts.slice(0, visibleCount)
  const hasMore = visibleCount < posts.length

  return (
    <section id="blog" className="relative px-6 py-24 md:px-12 lg:px-20">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.35em] text-dim">Writing</p>
          <h2 className="font-display text-4xl font-bold md:text-5xl">
            <ShinyText text={title} speed={3} className="text-fg" />
          </h2>
        </div>
        {source !== 'loading' && (
          <span className="rounded-full border border-border bg-white/[0.03] px-3 py-1 text-xs text-dim">
            {posts.length} {posts.length === 1 ? 'post' : 'posts'}
          </span>
        )}
      </div>

      {source === 'loading' ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="aspect-[16/9] animate-pulse rounded-3xl bg-white/5" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <FadeContent>
          <p className="text-muted">No published posts yet.</p>
        </FadeContent>
      ) : (
        <div className="space-y-6">
          {visible.map((post, i) => (
            <BlogCard key={post.slug || post.id} post={post} flip={i % 2 === 1} />
          ))}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <button
                type="button"
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                className="cursor-target rounded-full border border-border bg-white/[0.03] px-6 py-3 text-sm text-muted transition-colors hover:border-fg/50 hover:text-fg"
              >
                Load more
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
