import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Star, Sparkles } from 'lucide-react'
import AnimatedContent from '@/components/AnimatedContent'
import DecryptedText from '@/components/DecryptedText'
import CountUp from '@/components/CountUp'
import StarField from './StarField'
import StarMachine from './StarMachine'
import useStars from './useStars'
import { RARITIES } from './starIdentities'
import styles from './stars.module.css'
import { useSound } from '@/context/SoundProvider'

export default function BecomeAStar() {
  const { stars, totalStars, status, visitorStar, visitorHasStar, join, recast } = useStars()
  const { playClick, playSuccess, playSection } = useSound()
  const [joined, setJoined] = useState(false)
  const [myStar, setMyStar] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [cardDismissed, setCardDismissed] = useState(false)
  const [recasting, setRecasting] = useState(false)
  const [pulse, setPulse] = useState(null)
  const [resetArmed, setResetArmed] = useState(false)
  const [skyHint, setSkyHint] = useState(false)
  const resetTimerRef = useRef(null)
  const skyClicksRef = useRef(0)
  const skyLastRef = useRef(0)
  const [traveler, setTraveler] = useState(null)
  const [focusId, setFocusId] = useState(null)
  const machineRef = useRef(null)
  const panelRef = useRef(null)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [isCoarse, setIsCoarse] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const coarse = window.matchMedia('(hover: none), (pointer: coarse)')
    setReducedMotion(mq.matches)
    setIsCoarse(coarse.matches)
    const onMotion = (e) => setReducedMotion(e.matches)
    const onCoarse = (e) => setIsCoarse(e.matches)
    mq.addEventListener('change', onMotion)
    coarse.addEventListener('change', onCoarse)
    return () => {
      mq.removeEventListener('change', onMotion)
      coarse.removeEventListener('change', onCoarse)
    }
  }, [])

  const hasStar = joined || !!visitorStar || visitorHasStar
  const displayStar = myStar || visitorStar || null

  const computeLaunchFrom = () => {
    const machine = machineRef.current
    const panel = panelRef.current
    if (!machine || !panel) return { x: 0.5, y: 0 }
    const mr = machine.getBoundingClientRect()
    const pr = panel.getBoundingClientRect()
    return {
      x: mr.left + mr.width / 2 - pr.left,
      y: mr.top + mr.height * 0.55 - pr.top,
    }
  }

  const handleJoin = async (identity) => {
    if (submitting) return
    if (hasStar && !recasting) return
    setSubmitting(true)
    setError('')
    try {
      const from = computeLaunchFrom()
      if (recasting) {
        const res = await recast(identity.id, identity.color)
        setMyStar(res.star)
        setRecasting(false)
        setCardDismissed(true)
        setPulse({ id: res.star.id, at: Date.now() })
      } else {
        const res = await join(identity.id, identity.color)
        setMyStar(res.star)
        setJoined(true)
        setTraveler({ id: res.star.id, from })
      }
      playSuccess()
    } catch (err) {
      console.error('[star] Could not join the constellation:', err)
      setError("The star couldn't take off. Try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleViewMyStar = () => {
    playClick()
    setCardDismissed(true)
    setFocusId(displayStar?.id || stars[0]?.id || null)
  }

  const handleReopenCard = () => {
    playClick()
    setCardDismissed(false)
  }

  const enterRecastMode = () => {
    setRecasting(true)
    setCardDismissed(false)
    setFocusId(null)
    setError('')
  }

  const handleRecast = () => {
    playClick()
    if (!resetArmed) {
      setResetArmed(true)
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
      resetTimerRef.current = setTimeout(() => setResetArmed(false), 3500)
      return
    }
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
    setResetArmed(false)
    enterRecastMode()
  }

  const handleSkyClick = () => {
    const now = Date.now()
    if (now - skyLastRef.current > 1500) skyClicksRef.current = 0
    skyLastRef.current = now
    skyClicksRef.current += 1
    if (skyClicksRef.current >= 7) {
      skyClicksRef.current = 0
      setSkyHint(false)
      if (hasStar && !recasting) {
        setResetArmed(false)
        playSection()
        enterRecastMode()
      }
      return
    }
    if (hasStar && !recasting && skyClicksRef.current >= 4) {
      setSkyHint(true)
    }
    playClick()
  }

  const rarity = displayStar ? RARITIES[displayStar.rarity] : null

  return (
    <section id="star" className="relative px-6 py-24 md:px-12 lg:px-20">
      <AnimatedContent distance={40}>
        <p className="mb-2 text-xs uppercase tracking-[0.35em] text-dim">Constellation</p>
        <h2 className="font-display text-4xl font-bold md:text-5xl">
          <DecryptedText text="Become a Star" animateOn="view" />
        </h2>
        <p className="mt-3 max-w-xl text-muted">
          Every visitor receives a unique star and becomes part of this constellation.
        </p>
      </AnimatedContent>

      <div ref={panelRef} onClick={handleSkyClick} className={`${styles.starPanel} mt-10 h-[72vh] min-h-[560px] md:h-[78vh]`}>
        <StarField
          stars={stars}
          focusId={focusId}
          myStarId={displayStar?.id || null}
          traveler={traveler}
          pulse={pulse}
          reducedMotion={reducedMotion}
          isCoarse={isCoarse}
        />
        <div className={styles.vignette} />

        <div className="pointer-events-none absolute left-5 top-5 flex items-center gap-2 text-xs text-dim">
          <span className={`${styles.slowPulse} h-1.5 w-1.5 rounded-full bg-amber-200/80`} />
          {status === 'loading' ? (
            'Warming up the sky…'
          ) : status === 'offline' ? (
            'Offline constellation'
          ) : (
            <>
              <CountUp to={totalStars} duration={0.6} separator="," />
              {` star${totalStars === 1 ? '' : 's'} in the sky`}
            </>
          )}
        </div>

        <AnimatePresence>
          {skyHint && (
            <motion.div
              key="sky-hint"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-none absolute left-1/2 top-5 z-20 -translate-x-1/2"
            >
              <p className="rounded-full border border-amber-200/25 bg-[#0a0d18]/85 px-4 py-1.5 text-xs font-semibold text-amber-100/90 backdrop-blur-md">
                keep tapping the sky…
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-4 sm:p-6">
          <AnimatePresence mode="wait">
            {!hasStar || recasting ? (
              <motion.div
                key="machine"
                ref={machineRef}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: -8 }}
                transition={{ duration: 0.3 }}
                className="pointer-events-auto w-[min(100%,440px)]"
              >
                <StarMachine onJoin={handleJoin} joining={submitting} recastMode={recasting} />
                {error && (
                  <p className="mx-auto mt-3 w-fit rounded-full border border-red-400/20 bg-red-950/60 px-4 py-1.5 text-xs text-red-200/90">
                    {error}
                  </p>
                )}
                {status === 'offline' && (
                  <p className="mx-auto mt-3 w-fit text-center text-xs text-dim/80">
                    Constellation offline — your star is saved here and will join the shared sky when it reconnects.
                  </p>
                )}
              </motion.div>
            ) : !cardDismissed ? (
              <motion.div
                key="your-star"
                initial={{ opacity: 0, scale: 0.94, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="pointer-events-auto w-[min(100%,400px)] rounded-2xl border border-white/10 bg-[#0a0d18]/85 p-6 text-center shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)] backdrop-blur-xl"
              >
                {displayStar ? (
                  <>
                    <div
                      className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full"
                      style={{
                        background: `${displayStar.color}18`,
                        border: `1px solid ${displayStar.color}44`,
                      }}
                    >
                      <Sparkles size={22} style={{ color: displayStar.color }} />
                    </div>
                    <p className="text-xs uppercase tracking-[0.35em] text-dim">Your Star</p>
                    <p className="mt-2 font-display text-3xl font-bold text-fg">{displayStar.name}</p>
                    <p className="font-display text-base text-muted">{displayStar.title}</p>
                    {rarity && (
                      <span
                        className={styles.badge}
                        style={{
                          color: rarity.color,
                          borderColor: `${rarity.color}55`,
                          background: `${rarity.color}12`,
                        }}
                      >
                        {rarity.label}
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-white/[0.03]">
                      <Star size={20} className="fill-amber-200/70 text-amber-200/80" />
                    </div>
                    <p className="text-xs uppercase tracking-[0.35em] text-dim">Your Star</p>
                    <p className="mt-2 font-display text-2xl font-bold text-fg">
                      You're part of the constellation
                    </p>
                  </>
                )}
<button
                  type="button"
                  onClick={handleViewMyStar}
                  className="cursor-target mt-5 rounded-full border border-white/20 bg-white/[0.06] px-6 py-2.5 text-sm font-semibold text-fg transition-colors hover:bg-white/[0.12]"
                >
                  View My Star
                </button>
                <button
                  type="button"
                  onClick={handleRecast}
                  className={`cursor-target mt-3 text-[10px] uppercase tracking-[0.25em] transition-colors ${
                    resetArmed ? 'text-amber-200' : 'text-dim/70 hover:text-fg'
                  }`}
                >
                  {resetArmed ? 'Tap again to recast' : 'Recast my star'}
                </button>
                </motion.div>
              ) : null}
            </AnimatePresence>
        </div>

        {cardDismissed && hasStar && displayStar && (
          <div className="pointer-events-none absolute bottom-4 left-1/2 z-20 -translate-x-1/2">
            <button
              type="button"
              onClick={handleReopenCard}
              className="pointer-events-auto cursor-target flex items-center gap-2 rounded-full border border-white/15 bg-[#0a0d18]/85 px-4 py-2 text-xs font-semibold text-fg backdrop-blur-md transition-colors hover:bg-[#12162a]/90"
            >
              <Sparkles size={13} style={{ color: displayStar.color }} />
              Your Star — {displayStar.name}
            </button>
          </div>
        )}
      </div>

      <p className="mt-5 flex items-center justify-center gap-2 text-xs text-dim/80">
        <Star size={12} className="fill-amber-200/50 text-amber-200/60" />
        One sky, many stars — yours is now among them.
      </p>
    </section>
  )
}