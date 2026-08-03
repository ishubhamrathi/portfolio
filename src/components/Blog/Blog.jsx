import { useEffect, useState } from 'react'
import AnimatedContent from '@/components/AnimatedContent'
import FadeContent from '@/components/FadeContent'
import GlassSurface from '@/components/GlassSurface'
import ShinyText from '@/components/ShinyText'
import { getBlogPosts } from '@/services/contentApi'

export default function Blog() {
  const [posts, setPosts] = useState([])
  const [source, setSource] = useState('loading')
  const [active, setActive] = useState(null)

  useEffect(() => {
    getBlogPosts({ limit: 12 }).then((data) => {
      setPosts(data.posts || [])
      setSource(data.source)
    })
  }, [])

  if (source === 'none' && posts.length === 0) {
    return null
  }

  return (
    <section id="blog" className="relative px-6 py-24 md:px-12 lg:px-20">
      <p className="mb-2 text-xs uppercase tracking-[0.35em] text-dim">Writing</p>
      <h2 className="mb-3 font-display text-4xl font-bold md:text-5xl">
        <ShinyText text="Blog" speed={3} className="text-fg" />
      </h2>
      <p className="mb-10 text-sm text-dim">
        {source === 'api' ? 'From /api/content' : source === 'loading' ? 'Loading…' : 'No published posts yet'}
      </p>

      {source === 'loading' ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-3xl bg-white/5" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <FadeContent>
          <p className="text-muted">Publish a post in Blog → All Posts to show it here.</p>
        </FadeContent>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {posts.map((post) => (
            <AnimatedContent key={post.id || post.slug} distance={40}>
              <button type="button" className="cursor-target w-full text-left" onClick={() => setActive(post)}>
                <GlassSurface
                  width="100%"
                  height="100%"
                  borderRadius={24}
                  backgroundOpacity={0.12}
                  brightness={35}
                  blur={10}
                  className="p-5"
                  style={{ width: '100%', minHeight: 160 }}
                >
                  <h3 className="font-display text-xl font-semibold text-fg">{post.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm text-muted">{post.excerpt || ''}</p>
                  <div className="mt-4 flex gap-3 text-xs uppercase tracking-wider text-dim">
                    {post.author && <span>{post.author}</span>}
                    {post.publishedAt && <span>{new Date(post.publishedAt).toLocaleDateString()}</span>}
                  </div>
                </GlassSurface>
              </button>
            </AnimatedContent>
          ))}
        </div>
      )}

      {active && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setActive(null)}
        >
          <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <GlassSurface
              width="100%"
              height="auto"
              borderRadius={28}
              backgroundOpacity={0.18}
              brightness={35}
              blur={14}
              className="p-6"
              style={{ width: '100%' }}
            >
              <h3 className="font-display text-2xl font-semibold">{active.title}</h3>
              <p className="mt-2 text-xs text-dim">
                {active.author}
                {active.publishedAt ? ` · ${new Date(active.publishedAt).toLocaleDateString()}` : ''}
              </p>
              <div className="prose prose-invert mt-5 max-w-none whitespace-pre-wrap text-sm leading-relaxed text-muted">
                {active.content || active.excerpt || 'Open the full post from the API for body content.'}
              </div>
              <button
                type="button"
                className="mt-6 text-sm text-fg underline-offset-4 hover:underline"
                onClick={() => setActive(null)}
              >
                Close
              </button>
            </GlassSurface>
          </div>
        </div>
      )}
    </section>
  )
}
