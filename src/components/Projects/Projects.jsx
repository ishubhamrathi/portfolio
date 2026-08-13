import { useEffect, useState } from 'react'
import DecryptedText from '@/components/DecryptedText'
import FeaturedShowcase from '@/components/FeaturedShowcase/FeaturedShowcase'
import { getCategories, getProjects } from '@/services/contentApi'

const FEATURED_LIMIT = 3

function stripHtml(html) {
  return (html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export default function Projects() {
  const [data, setData] = useState({ title: 'Projects', items: [], source: 'loading' })
  const [categories, setCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState('')

  useEffect(() => {
    getCategories().then(setCategories)
  }, [])

  useEffect(() => {
    getProjects({ categoryPath: activeCategory || undefined }).then(setData)
  }, [activeCategory])

  const featuredItems = (data.items || []).map((project, i) => ({
    id: project.id,
    index: i,
    number: String(i + 1).padStart(2, '0'),
    title: project.title,
    description: stripHtml(project.shortDescription || project.description),
    category: project.topCategoryLabel || project.categoryPath || '',
    thumbnails: (() => {
      const thumb = project.image
      const carousel = (project.carouselImages || project.screenshots || []).filter(Boolean)
      return thumb ? [thumb, ...carousel] : carousel
    })(),
    previewType: project.previewType || 'auto',
    tech: project.tech || [],
    siteUrl: project.deployed || project.projectUrl || '',
    url: `/projects/${project.id}`,
    raw: project,
  }))

  return (
    <section id="projects" className="relative px-6 py-24 md:px-12 lg:px-20">
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.35em] text-dim">Selected work</p>
          <h2 className="font-display text-4xl font-bold text-fg md:text-5xl">
            <DecryptedText text={data.title || 'Projects'} animateOn="view" speed={60} />
          </h2>
        </div>
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveCategory('')}
              className={`cursor-target rounded-full border px-3 py-1.5 text-xs uppercase tracking-wider transition ${
                !activeCategory ? 'border-fg bg-fg text-bg' : 'border-border text-muted hover:border-fg'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`cursor-target rounded-full border px-3 py-1.5 text-xs uppercase tracking-wider transition ${
                  activeCategory === cat
                    ? 'border-fg bg-fg text-bg'
                    : 'border-border text-muted hover:border-fg'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {data.source === 'loading' || !data.items ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="aspect-[4/3] animate-pulse rounded-3xl bg-white/5" />
          ))}
        </div>
      ) : (
        <FeaturedShowcase items={featuredItems.slice(0, FEATURED_LIMIT)} />
      )}
    </section>
  )
}
