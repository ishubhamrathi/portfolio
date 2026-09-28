import { useEffect, useState, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { IoMdClose } from 'react-icons/io'
import { HiBookOpen, HiArrowTopRightOnSquare } from 'react-icons/hi2'
import { useContent } from '@/context/ContentProvider'
import { useSound } from '@/context/SoundProvider'
import { mapApiBook, extractBooks } from '@/services/contentApi'

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function BookDetailPage({ id }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { playClick } = useSound()
  const { content } = useContent()

  const book = useMemo(() => {
    // Check multiple possible locations for books in the content structure
    const books = 
      (Array.isArray(content?.books) ? content.books : null) ||
      (Array.isArray(content?.books?.books) ? content.books.books : null) ||
      (Array.isArray(content?.portfolio?.books) ? content.portfolio.books : null) ||
      (Array.isArray(content?.portfolio?.books?.books) ? content.portfolio.books.books : null) ||
      extractBooks(content) || 
      [];
    const found = books.find((b) => String(b.id) === String(id))
    return found ? mapApiBook(found) : null
  }, [content, id])

  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!book) setNotFound(true)
  }, [book])

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
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 bg-bg/85 px-4 py-4 backdrop-blur-md md:px-8">
        <button
          type="button"
          onClick={close}
          className="cursor-target text-sm text-dim transition hover:text-fg"
        >
          &#8594; Back to bookshelf
        </button>
        <button
          type="button"
          aria-label="Close book"
          onClick={close}
          className="cursor-target flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border bg-black/60 text-fg transition hover:border-fg"
        >
          <IoMdClose size={28} />
        </button>
      </div>

      <div className="mx-auto max-w-4xl px-5 pb-24 md:px-8">
        {notFound ? (
          <p className="py-24 text-center text-muted">Book not found.</p>
        ) : !book ? (
          <div className="py-24">
            <div className="mx-auto h-8 w-2/3 animate-pulse rounded bg-white/10" />
            <div className="mt-8 h-56 w-full animate-pulse rounded-3xl bg-white/5" />
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-wider text-dim">
              {book.genre && <span>{book.genre}</span>}
              {book.createdAt && (
                <>
                  <span aria-hidden>·</span>
                  <span>{formatDate(book.createdAt)}</span>
                </>
              )}
            </div>

            <h1 className="mt-4 font-display text-4xl font-bold text-fg md:text-5xl">{book.title}</h1>

            <div className="mt-6 flex items-center gap-4 text-sm text-dim">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10">
                <HiBookOpen className="h-4 w-4 text-fg" />
              </span>
              <span>by {book.author}</span>
              {book.isFeatured && (
                <>
                  <span aria-hidden>·</span>
                  <span className="text-amber-400">Featured read</span>
                </>
              )}
            </div>

            <div className="mt-10 grid gap-8 md:grid-cols-[160px_1fr]">
              <div className="aspect-[3/4] w-full overflow-hidden rounded-3xl bg-black/50 ring-1 ring-white/10">
                {book.coverUrl ? (
                  <img
                    src={book.coverUrl}
                    alt={`${book.title} cover`}
                    className="h-full w-full object-cover object-top"
                    onError={(e) => {
                      e.target.style.display = 'none'
                      e.target.parentElement.classList.add('flex', 'items-center', 'justify-center')
                    }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <HiBookOpen className="h-16 w-16 text-white/20" />
                  </div>
                )}
              </div>

              <div className="space-y-6">
                {book.description && <p className="text-sm leading-relaxed text-muted md:text-base">{book.description}</p>}

                {Array.isArray(book.keyTakeaways) && book.keyTakeaways.length > 0 && (
                  <div className="border-t border-white/10 pt-6">
                    <p className="text-xs uppercase tracking-[0.25em] text-amber-300 font-semibold mb-4">Key Takeaways</p>
                    <ul className="space-y-2.5">
                      {book.keyTakeaways.map((takeaway, i) => (
                        <li key={i} className="flex items-start gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-3 text-sm text-muted">
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-400/15 text-[11px] font-bold text-amber-300">{i + 1}</span>
                          <span>{takeaway}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {book.googleLink && (
                  <a
                    href={book.googleLink}
                    target="_blank"
                    rel="noreferrer"
                    className="cursor-target inline-flex items-center gap-2 text-sm text-fg underline-offset-4 hover:underline"
                  >
                    <HiArrowTopRightOnSquare /> View on Google Books
                  </a>
                )}
              </div>
            </div>

            <div className="mt-10">
              <button
                type="button"
                onClick={close}
                className="cursor-target rounded-full border border-border px-5 py-2 text-sm text-muted transition hover:border-fg hover:text-fg"
              >
                &#8594; Back to bookshelf
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
