import { useEffect, useState } from 'react'
import DecryptedText from '@/components/DecryptedText'
import ProjectCard from '@/components/Project/Project'
import { getCategories, getProjects } from '@/services/contentApi'

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

  return (
    <section id="projects" className="relative px-6 py-24 md:px-12 lg:px-20">
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.35em] text-dim">Selected work</p>
          <h2 className="font-display text-4xl font-bold text-fg md:text-5xl">
            <DecryptedText text={data.title || 'Projects'} animateOn="view" speed={60} />
          </h2>
          {data.source && data.source !== 'loading' && (
            <p className="mt-2 text-xs uppercase tracking-wider text-dim">
              Source: {data.source === 'api' ? 'live API' : 'content.json fallback'}
            </p>
          )}
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
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {data.items.map((project) => (
            <ProjectCard key={project.id || project.title} project={project} />
          ))}
        </div>
      )}
    </section>
  )
}
