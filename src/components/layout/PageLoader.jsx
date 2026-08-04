import { useEffect, useState } from 'react'
import styles from './PageLoader.module.css'

export default function PageLoader({ done = false }) {
  const [mounted, setMounted] = useState(true)

  useEffect(() => {
    if (!done) return
    const timer = setTimeout(() => setMounted(false), 550)
    return () => clearTimeout(timer)
  }, [done])

  if (!mounted) return null

  return (
    <div className={`${styles.overlay} ${done ? styles.hidden : ''}`} aria-label="Loading" role="status">
      <div className={styles.ring}>
        <div className={styles.monogram}>SR</div>
      </div>
      <p className={styles.name}>Shubham Rathi</p>
      <div className={styles.bar}>
        <div className={styles.barFill} />
      </div>
    </div>
  )
}
