import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DecryptedText from '@/components/DecryptedText'
import BentoGrid from '@/components/BentoGrid/BentoGrid'
import { useSound } from '@/context/SoundProvider'
import { getCategories, getProjects } from '@/services/contentApi'

const CARD_PALETTE = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899', '#22D3EE']
const BENTO_LIMIT = 7

function stripHtml(html) {
  return (html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export default function Projects() {
  const navigate = useNavigate()
  const { playClick } = useSound()
  const [data, setData] = useState({ title: 'Projects', items: [], source: 'loading' })
  const [categories, setCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState('')
  const [viewAll, setViewAll] = useState(false)

  useEffect(() => {
    getCategories().then(setCategories)
  }, [])

  useEffect(() => {
    setViewAll(false)
  }, [activeCategory])

  useEffect(() => {
    getProjects({ categoryPath: activeCategory || undefined }).then(setData)
  }, [activeCategory])

  const items = (data.items || []).map((project, i) => {
    const color = CARD_PALETTE[i % CARD_PALETTE.length]
    return {
      id: project.id,
      image: project.image,
      title: project.title,
      subtitle: stripHtml(project.shortDescription || project.description).slice(0, 110),
      handle: project.topCategoryLabel || project.categoryPath || '',
      borderColor: color,
      gradient: `linear-gradient(145deg, ${color}, #000)`,
      url: `/projects/${project.id}`,
    }
  })

  const handleCardClick = (item) => {
    if (!item) return
    playClick()
    const project = (data.items || []).find((p) => p.id === item.id)
    navigate(item.url, { state: { project } })
  }

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
        <div style={{ minHeight: 600, position: 'relative' }}>
          <BentoGrid
            items={viewAll ? items : items.slice(0, BENTO_LIMIT)}
            radius={300}
            damping={0.45}
            fadeOut={0.6}
            ease="power3.out"
            spotlightRadius={400}
            particleCount={12}
            glowColor="132, 0, 255"
            clickEffect
            onCardClick={handleCardClick}
          />
          {items.length > BENTO_LIMIT && (
            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={() => setViewAll((v) => !v)}
                className="cursor-target rounded-full border border-border px-5 py-2 text-xs uppercase tracking-wider text-muted transition hover:border-fg hover:text-fg"
              >
                {viewAll ? 'Show less' : `View all (${items.length})`}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
