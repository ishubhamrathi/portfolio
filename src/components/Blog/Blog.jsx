import { useEffect, useState } from 'react'
import FadeContent from '@/components/FadeContent'
import ShinyText from '@/components/ShinyText'
import BlogCard from '@/components/Blog/BlogCard'
import { getBlogPosts } from '@/services/contentApi'

export default function Blog() {
  const [posts, setPosts] = useState([])
  const [source, setSource] = useState('loading')
  const [title, setTitle] = useState('Blog')

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

  return (
    <section id="blog" className="relative px-6 py-24 md:px-12 lg:px-20">
      <div className="mb-10">
        <p className="mb-2 text-xs uppercase tracking-[0.35em] text-dim">Writing</p>
          <h2 className="mb-3 font-display text-4xl font-bold md:text-5xl">
            <ShinyText text={title} speed={3} className="text-fg" />
          </h2>
        </div>

      {source === 'loading' ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="aspect-[16/9] animate-pulse rounded-3xl bg-white/5 sm:aspect-[16/10]" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <FadeContent>
          <p className="text-muted">No published posts yet.</p>
        </FadeContent>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <BlogCard key={post.slug || post.id} post={post} />
          ))}
        </div>
      )}
    </section>
  )
}
