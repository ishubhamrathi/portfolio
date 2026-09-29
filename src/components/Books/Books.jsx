import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import FadeContent from '@/components/FadeContent'
import ShinyText from '@/components/ShinyText'
import AnimatedContent from '@/components/AnimatedContent'
import SpotlightCard from '@/components/SpotlightCard'
import Bookshelf3D from '@/components/Books/Bookshelf3D'
import { preloadImages, getCachedImage } from '@/lib/imageCache'
import { mapApiBook, extractBooks } from '@/services/contentApi'
import { useSound } from '@/context/SoundProvider'
import {
  HiBookOpen,
  HiArrowTopRightOnSquare,
  HiCube,
  HiSquares2X2,
  HiSparkles,
  HiStar,
} from 'react-icons/hi2'

function stripHtml(html) {
  return (html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function CoverImage({ book, className = '', eager = false }) {
  const url = book.coverUrl
  const [status, setStatus] = useState(() =>
    !url ? 'error' : getCachedImage(url) ? 'loaded' : 'loading'
  )

  useEffect(() => {
    if (!url) {
      setStatus('error')
      return undefined
    }
    if (getCachedImage(url)) {
      setStatus('loaded')
      return undefined
    }
    let active = true
    setStatus('loading')
    preloadImages([url]).then((img) => {
      if (active) setStatus(img ? 'loaded' : 'error')
    })
    return () => { active = false }
  }, [url])

  if (!url || status === 'error') return null

  return (
    <>
      {status !== 'loaded' && (
        <div
          className="shimmer absolute inset-0 h-full w-full"
          aria-hidden="true"
        />
      )}
      <img
        src={url}
        alt={`${book.title} cover`}
        className={`${className} transition-opacity duration-500 ${
          status === 'loaded' ? 'opacity-100' : 'opacity-0'
        }`}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={eager ? 'high' : 'auto'}
        onLoad={() => setStatus('loaded')}
        onError={() => setStatus('error')}
      />
    </>
  )
}

function BookGridCard({ book, onClick }) {
  const { playClick, playHover } = useSound()

  const tags = []
  if (book.isFeatured) tags.push({ text: 'Featured', variant: 'featured' })
  if (book.genre) tags.push({ text: book.genre, variant: 'genre' })
  if (book.category && book.category !== book.genre) tags.push({ text: book.category, variant: 'category' })

  return (
    <AnimatedContent distance={40} duration={0.6} threshold={0.1}>
      <SpotlightCard
        className="group relative cursor-pointer overflow-hidden rounded-3xl border border-border bg-white/[0.03] transition duration-300 hover:border-amber-400/40"
        spotlightColor="rgba(245, 158, 11, 0.12)"
      >
        <button
          type="button"
          className="cursor-target grid w-full text-left"
          onClick={(e) => {
            e.stopPropagation()
            playClick()
            onClick(book)
          }}
          onMouseEnter={playHover}
        >
          <div className="relative aspect-[3/4] overflow-hidden bg-black/60">
            {book.coverUrl ? (
              <CoverImage
                book={book}
                className="h-full w-full object-cover object-top transition-all duration-700 group-hover:scale-105"
              />
            ) : (
              <div
                className="flex h-full w-full flex-col items-center justify-center p-6 text-center"
                style={{
                  background: `linear-gradient(135deg, ${book.spineColor || '#1e1b4b'} 0%, #09090b 100%)`,
                }}
              >
                <HiBookOpen className="h-14 w-14 text-white/30" />
                <span className="mt-3 font-display text-sm font-bold text-white">
                  {book.title}
                </span>
                <span className="mt-1 text-xs text-white/60">by {book.author}</span>
              </div>
            )}

            {tags.length > 0 && (
              <div className="absolute top-3 left-3 right-3 flex flex-wrap gap-1.5 justify-between">
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag, idx) => (
                    <span
                      key={`${tag.variant}-${idx}`}
                      className={`rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider backdrop-blur-md transition-opacity ${
                        tag.variant === 'featured'
                          ? 'border border-amber-400/40 bg-amber-400/20 text-amber-300'
                          : 'border border-white/10 bg-black/70 text-dim'
                      }`}
                    >
                      {tag.text}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2.5 p-5">
            <div className="flex items-center gap-1 text-amber-400">
              {[1, 2, 3, 4, 5].map((star) => (
                <HiStar
                  key={star}
                  className={`h-3.5 w-3.5 ${
                    star <= Math.round(book.rating || 5)
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-white/15'
                  }`}
                />
              ))}
              <span className="ml-1 text-[11px] font-semibold text-amber-300/80">
                {(book.rating || 5).toFixed(1)}
              </span>
            </div>

            <h3 className="font-display text-lg font-bold text-fg line-clamp-1 group-hover:text-amber-200 transition">
              {book.title}
            </h3>
            <p className="text-sm text-dim line-clamp-1">by {book.author}</p>
            {book.description && (
              <p className="text-xs leading-relaxed text-muted line-clamp-2">
                {stripHtml(book.description)}
              </p>
            )}
          </div>
        </button>
      </SpotlightCard>
    </AnimatedContent>
  )
}

function getBooksFromContent(content, limit = 50) {
  const list = extractBooks(content)
  if (!list) return { items: [], count: 0, source: 'none' }
  const mapped = list.map(mapApiBook).filter(Boolean)
  mapped.sort((a, b) => a.displayOrder - b.displayOrder || a.title.localeCompare(b.title))
  return {
    items: limit ? mapped.slice(0, limit) : mapped,
    count: mapped.length,
    source: 'content',
  }
}

export default function Books({ content }) {
  const [books, setBooks] = useState([])
  const [source, setSource] = useState('loading')
  const [title, setTitle] = useState('My Bookshelf')
  const [reduceMotion, setReduceMotion] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [showAllBooks, setShowAllBooks] = useState(false)
  const [viewMode, setViewMode] = useState('3d')
  const { playClick } = useSound()
  const navigate = useNavigate()

  useEffect(() => {
    const mqMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const mqMobile = window.matchMedia('(max-width: 800px)')
    setReduceMotion(mqMotion.matches)
    setIsMobile(mqMobile.matches)

    if (mqMotion.matches) {
      setViewMode('grid')
    }

    const onMotion = (e) => {
      setReduceMotion(e.matches)
      if (e.matches) setViewMode('grid')
    }
    const onMobile = (e) => setIsMobile(e.matches)
    mqMotion.addEventListener('change', onMotion)
    mqMobile.addEventListener('change', onMobile)

    return () => {
      mqMotion.removeEventListener('change', onMotion)
      mqMobile.removeEventListener('change', onMobile)
    }
  }, [])

  useEffect(() => {
    if (content) {
      const data = getBooksFromContent(content, 50)
      setBooks(data.items || [])
      setSource(data.source)
      setTitle('My Bookshelf')
    }
  }, [content])

  // Warm the shared cover cache so 2D grid, 3D shelf and detail views all reuse it
  useEffect(() => {
    if (books.length === 0) return
    preloadImages(books.map((b) => b.coverUrl))
  }, [books])

  const inspectBook = (book) => {
    playClick()
    navigate(`/books/${book.id}`)
  }

  const show3D = !reduceMotion && viewMode === '3d' && books.length > 0

  if (source === 'none' && books.length === 0) {
    return null
  }

  return (
    <section id="books" className="relative px-6 py-24 md:px-12 lg:px-20">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.35em] text-dim">Reading List</p>
          <h2 className="font-display text-4xl font-bold md:text-5xl">
            <ShinyText text={title} speed={3} className="text-fg" />
          </h2>
        </div>

        {source !== 'none' && books.length > 0 && (
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-border bg-white/[0.03] px-3.5 py-1.5 text-xs text-dim">
              {books.length} book{books.length === 1 ? '' : 's'}
            </span>

            {/* Toggle button to switch between 3D Shelf and 2D Grid view */}
            <div className="flex items-center rounded-full border border-border bg-white/[0.04] p-1 text-xs">
              <button
                type="button"
                onClick={() => {
                  playClick()
                  setViewMode('3d')
                }}
                disabled={reduceMotion}
                className={`cursor-target flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-medium transition ${
                  viewMode === '3d'
                    ? 'border border-amber-400/40 bg-amber-400/20 text-amber-300 shadow-sm'
                    : 'text-muted hover:text-fg'
                } ${reduceMotion ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <HiCube className="h-4 w-4" />
                <span>3D Shelf</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  playClick()
                  setViewMode('grid')
                }}
                className={`cursor-target flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-medium transition ${
                  viewMode === 'grid'
                    ? 'border border-amber-400/40 bg-amber-400/20 text-amber-300 shadow-sm'
                    : 'text-muted hover:text-fg'
                }`}
              >
                <HiSquares2X2 className="h-4 w-4" />
                <span>2D Grid</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {source === 'loading' ? (
        <div className="flex h-[320px] items-center justify-center">
          <p className="text-muted">Loading the bookshelf…</p>
        </div>
      ) : books.length === 0 ? (
        <FadeContent>
          <p className="text-muted">No books on the shelf yet.</p>
        </FadeContent>
      ) : (
        <>
          {show3D ? (
            <div className={`relative w-full overflow-hidden rounded-3xl border border-white/10 bg-[#0B0F17] shadow-[0_28px_70px_rgba(0,0,0,0.65)] ${
              books.length > 4
                ? 'h-[550px] sm:h-[600px] md:h-[650px]'
                : 'h-[500px] sm:h-[550px] md:h-[600px]'
            }`}>
              <Bookshelf3D
                books={books}
                onSelectBook={inspectBook}
                isMobile={isMobile}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {books.map((book) => (
                <BookGridCard key={book.id} book={book} onClick={inspectBook} />
              ))}
            </div>
          )}

          {books.length > 7 && (
            <div className="mt-4 text-center">
              <button
                type="button"
                className="cursor-target rounded-full border border-border bg-white/[0.02] px-4 py-2 text-sm text-muted transition hover:border-amber-400/50 hover:text-amber-200"
                aria-expanded={showAllBooks}
                onClick={() => {
                  playClick()
                  setShowAllBooks((visible) => !visible)
                }}
              >
                {showAllBooks ? 'Hide full reading grid' : `Browse all ${books.length} books in grid`}
              </button>

              {showAllBooks && (
                <div className="mt-8 grid grid-cols-1 gap-6 text-left sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {books.map((book) => (
                    <BookGridCard key={book.id} book={book} onClick={inspectBook} />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </section>
    )
  }
