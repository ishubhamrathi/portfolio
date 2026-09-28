import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import GlassSurface from '@/components/GlassSurface'
import { IoClose } from 'react-icons/io5'
import { useSound } from '@/context/SoundProvider'
import styles from './BookDetailModal.module.css'

function BookDetailContent({ book }) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  // Use only backend data - no mock fallbacks
  const keyTakeaways = book.keyTakeaways || []

  return (
    <div className={styles.modalContent}>
      <div className={styles.pageSpread}>
        {/* LEFT PAGE - Cover Art */}
        <div className={styles.leftPage}>
          <div className={styles.coverFrame}>
            {book.coverUrl && !imageError ? (
              <>
                {/* Skeleton loader with shimmer */}
                {!imageLoaded && (
                  <div className={styles.coverSkeleton} aria-hidden="true">
                    <div className={styles.skeletonShimmer} />
                  </div>
                )}
                <img
                  src={book.coverUrl}
                  alt={`${book.title} cover`}
                  className={`${styles.coverImage} ${imageLoaded ? styles.loaded : styles.loading}`}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => {
                    setImageError(true)
                    setImageLoaded(true)
                  }}
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                />
              </>
            ) : (
              <div
                className={styles.coverFallback}
                style={{
                  background: `linear-gradient(135deg, ${book.spineColor || '#2A1D17'} 0%, #0B0F17 100%)`,
                }}
              >
                <span className={styles.coverTitle}>{book.title}</span>
                <span className={styles.coverAuthor}>by {book.author}</span>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PAGE - Details */}
        <div className={styles.rightPage}>
          <div className={styles.pageInner}>
            {/* Category Badges */}
            <div className={styles.badges}>
              {book.isFeatured && (
                <span className={styles.badgeFeatured}>Staff Pick</span>
              )}
              {(book.genre || book.category) && (
                <span className={styles.badgeCategory}>{book.genre || book.category}</span>
              )}
            </div>

            {/* Title & Author */}
            <h2 className={styles.title}>{book.title}</h2>
            <p className={styles.author}>by {book.author}</p>

            {/* Rating */}
            <div className={styles.rating}>
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`star ${
                    star <= Math.round(book.rating || 0)
                      ? styles.filled
                      : styles.empty
                  }`}
                >
                  ★
                </span>
              ))}
              {(book.rating || 0) > 0 && (
                <span className={styles.ratingValue}>
                  {(book.rating || 0).toFixed(1)}
                </span>
              )}
            </div>

            {/* Overview */}
            {book.description && (
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Overview</h3>
                <div
                  className={styles.overviewText}
                  dangerouslySetInnerHTML={{ __html: book.description }}
                />
              </section>
            )}

            {/* Key Takeaways - only show if backend provides data */}
            {keyTakeaways.length > 0 && (
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Key Takeaways</h3>
                <ol className={styles.takeawaysList}>
                  {keyTakeaways.slice(0, 3).map((takeaway, i) => (
                    <li key={i} className={styles.takeawayItem}>
                      <span className={styles.takeawayNumber}>{i + 1}</span>
                      <span className={styles.takeawayText}>
                        {takeaway.replace(/^•\s*/, '')}
                      </span>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {/* CTA */}
            {book.link && (
              <a
                href={book.link}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.ctaButton}
              >
                View Details →
              </a>
            )}
            {book.googleLink && (
              <a
                href={book.googleLink}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.ctaButtonSecondary}
              >
                View on Google Books →
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function BookDetailModal({
  book,
  isOpen,
  onClose,
}) {
  const { playClick } = useSound()
  const modalRef = useRef(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setMounted(true)
      document.body.style.overflow = 'hidden'
    } else if (!isOpen && mounted) {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen, mounted])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        playClick()
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, playClick])

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      playClick()
      onClose()
    }
  }

  if (!mounted && !isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={modalRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className={styles.backdrop}
          onClick={handleBackdropClick}
          role="dialog"
          aria-modal="true"
          aria-labelledby="book-title"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className={styles.modal}
          >
            <button
              type="button"
              className={styles.closeButton}
              onClick={() => {
                playClick()
                onClose()
              }}
              aria-label="Close book details"
            >
              <IoClose size={24} />
            </button>
            <BookDetailContent book={book} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}