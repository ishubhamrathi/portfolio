import { useEffect, useState, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { IoMdClose } from 'react-icons/io'
import { HiBookOpen, HiArrowTopRightOnSquare } from 'react-icons/hi2'
import { useContent } from '@/context/ContentProvider'
import { useSound } from '@/context/SoundProvider'
import { mapApiBook, extractBooks, getBookById } from '@/services/contentApi'
import { getCachedImage } from '@/lib/imageCache'
import styles from './BookDetailPage.module.css'

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

  const [book, setBook] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [coverLoaded, setCoverLoaded] = useState(false)
  const [coverError, setCoverError] = useState(false)

  // Initial book from consolidated content (for immediate display)
  const initialBook = useMemo(() => {
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

  // Fetch full book from individual API endpoint
  useEffect(() => {
    let cancelled = false
    setCoverError(false)
    setCoverLoaded(!!getCachedImage(initialBook?.coverUrl))

    const loadFullBook = async () => {
      try {
        setLoading(true)
        const fullBook = await getBookById(id)
        if (!cancelled) {
          if (fullBook) {
            setBook(fullBook)
          } else if (initialBook) {
            setBook(initialBook)
          } else {
            setNotFound(true)
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.warn('[BookDetailPage] Failed to load full book:', err)
          if (initialBook) {
            setBook(initialBook)
          } else {
            setNotFound(true)
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadFullBook()
    return () => { cancelled = true }
  }, [id, initialBook])

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

  if (loading) {
    return (
      <div className={`${styles.container} ${styles.loading}`}>
        <div className={styles.header}>
          <button type="button" onClick={close} className={styles.backButton}>
            &#8592; Back to bookshelf
          </button>
          <button type="button" onClick={close} className={styles.closeButton} aria-label="Close book">
            <IoMdClose size={28} />
          </button>
        </div>
        <div className={styles.content}>
          <div className={styles.skeletonTitle} />
          <div className={styles.skeletonCover} />
          <div className={styles.skeletonText} />
          <div className={styles.skeletonText} />
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button
          type="button"
          onClick={close}
          className={styles.backButton}
        >
          &#8592; Back to bookshelf
        </button>
        <button
          type="button"
          aria-label="Close book"
          onClick={close}
          className={styles.closeButton}
        >
          <IoMdClose size={28} />
        </button>
      </div>

      <div className={styles.content}>
        {notFound ? (
          <p className={styles.notFound}>Book not found.</p>
        ) : !book ? (
          <div className={styles.skeleton}>
            <div className={styles.skeletonTitle} />
            <div className={styles.skeletonCover} />
            <div className={styles.skeletonText} />
            <div className={styles.skeletonText} />
          </div>
        ) : (
          <>
            <div className={styles.meta}>
              {book.genre && <span>{book.genre}</span>}
              {book.createdAt && (
                <>
                  <span aria-hidden>·</span>
                  <span>{formatDate(book.createdAt)}</span>
                </>
              )}
            </div>

            <h1 className={styles.title}>{book.title}</h1>

            <div className={styles.authorRow}>
              <span className={styles.authorIcon}>
                <HiBookOpen className="h-4 w-4 text-fg" />
              </span>
              <span>by {book.author}</span>
              {book.isFeatured && (
                <>
                  <span aria-hidden>·</span>
                  <span className={styles.featuredBadge}>Featured read</span>
                </>
              )}
            </div>

            <div className={styles.grid}>
              <div className={styles.coverWrapper}>
                {book.coverUrl && !coverError ? (
                  <>
                    {!coverLoaded && (
                      <div className="shimmer absolute inset-0 h-full w-full" aria-hidden="true" />
                    )}
                    <img
                      src={book.coverUrl}
                      alt={`${book.title} cover`}
                      className={`${styles.coverImage} ${coverLoaded ? styles.coverLoaded : ''}`}
                      loading="eager"
                      fetchPriority="high"
                      decoding="async"
                      onLoad={() => setCoverLoaded(true)}
                      onError={() => setCoverError(true)}
                    />
                  </>
                ) : (
                  <div className={styles.coverFallback}>
                    <HiBookOpen className="h-16 w-16 text-white/20" />
                  </div>
                )}
              </div>

              <div className={styles.details}>
                {book.description && <p className={styles.description}>{book.description}</p>}

                {Array.isArray(book.keyTakeaways) && book.keyTakeaways.length > 0 && (
                  <div className={styles.takeawaysSection}>
                    <p className={styles.sectionTitle}>Key Takeaways</p>
                    <ul className={styles.takeawaysList}>
                      {book.keyTakeaways.map((takeaway, i) => (
                        <li key={i} className={styles.takeawayItem}>
                          <span className={styles.takeawayNumber}>{i + 1}</span>
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
                    className={styles.googleLink}
                  >
                    <HiArrowTopRightOnSquare /> View on Google Books
                  </a>
                )}
              </div>
            </div>

            <div className={styles.closeWrapper}>
              <button
                type="button"
                onClick={close}
                className={styles.closeButtonBottom}
              >
                &#8592; Back to bookshelf
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
