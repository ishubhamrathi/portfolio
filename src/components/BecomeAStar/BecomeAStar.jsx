import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Star, Sparkles, X } from 'lucide-react'
import AnimatedContent from '@/components/AnimatedContent'
import DecryptedText from '@/components/DecryptedText'
import CountUp from '@/components/CountUp'
import StarField from './StarField'
import StarMachine from './StarMachine'
import useStars from './useStars'
import styles from './stars.module.css'
import { useSound } from '@/context/SoundProvider'

export default function BecomeAStar({ starsData, amaSuggestions }) {
  const { stars, totalStars, status, visitorStar, visitorHasStar, join, recast } = useStars({ starsData, amaSuggestions })
  const { playClick, playSuccess, playSection } = useSound()
  const [joined, setJoined] = useState(false)
  const [myStar, setMyStar] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [machineOpen, setMachineOpen] = useState(false)
  const [cardOpen, setCardOpen] = useState(false)
  const [recasting, setRecasting] = useState(false)
  const [pulse, setPulse] = useState(null)
  const [skyHint, setSkyHint] = useState(false)
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
        const res = await recast(identity.name, identity.color)
        setMyStar(res.star)
        setRecasting(false)
        setMachineOpen(false)
        setCardOpen(false)
        setPulse({ id: res.star.id, at: Date.now() })
      } else {
        const res = await join(identity.name, identity.color)
        setMyStar(res.star)
        setJoined(true)
        setMachineOpen(false)
        setCardOpen(false)
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

  const handleCloseCard = () => {
    playClick()
    setCardOpen(false)
  }

  const handleOpenCard = () => {
    playClick()
    setCardOpen(true)
  }

  const handleOpenMachine = () => {
    playClick()
    setMachineOpen(true)
    setError('')
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
        playSection()
        setRecasting(true)
        setMachineOpen(true)
        setCardOpen(false)
        setError('')
      }
      return
    }
    if (hasStar && !recasting && skyClicksRef.current >= 4) {
      setSkyHint(true)
    }
    playClick()
  }

  return (
    <section id="star" className="relative px-6 py-24 md:px-12 lg:px-20">
      <AnimatedContent distance={40}>
        <p className="mb-2 text-xs uppercase tracking-[0.35em] text-dim">Constellation</p>
        <h2 className="font-display text-4xl font-bold md:text-5xl">
          <DecryptedText text="The Wall" animateOn="view" />
        </h2>
        <p className="mt-3 max-w-xl text-muted">
          A living constellation of every visitor. Claim your star, give it an identity, and watch it join the sky.
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

        <AnimatePresence>
          {machineOpen && (
            <motion.div
              key="machine-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-black/40 p-4 sm:p-6"
              onClick={(e) => { e.stopPropagation(); setMachineOpen(false); setRecasting(false) }}
            >
              <motion.div
                key="machine"
                ref={machineRef}
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                transition={{ duration: 0.3 }}
                className="pointer-events-auto w-[min(100%,440px)]"
                onClick={(e) => e.stopPropagation()}
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
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {cardOpen && displayStar && (
            <motion.div
              key="card-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-black/40 p-4 sm:p-6"
              onClick={(e) => { e.stopPropagation(); handleCloseCard() }}
            >
              <motion.div
                key="your-star"
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="pointer-events-auto relative w-[min(100%,400px)] rounded-2xl border border-white/10 bg-[#0a0d18]/90 p-6 text-center shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)] backdrop-blur-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={handleCloseCard}
                  className="cursor-target absolute right-3 top-3 rounded-full border border-white/15 bg-white/[0.06] p-1.5 text-dim transition-colors hover:bg-white/[0.12] hover:text-fg"
                >
                  <X size={14} />
                </button>
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
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {!machineOpen && !cardOpen && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 p-4 sm:p-6">
            <div className="flex flex-col items-center gap-2">
              {!hasStar ? (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleOpenMachine() }}
                  className="pointer-events-auto cursor-target flex items-center gap-2 rounded-full border border-amber-200/25 bg-[#0a0d18]/85 px-5 py-2.5 text-xs font-semibold text-amber-100/90 backdrop-blur-md transition-colors hover:bg-[#12162a]/90 hover:border-amber-200/40"
                >
                  <Sparkles size={13} />
                  Claim My Star
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleOpenCard() }}
                    className="pointer-events-auto cursor-target flex items-center gap-2 rounded-full border border-white/15 bg-[#0a0d18]/85 px-5 py-2.5 text-xs font-semibold text-fg backdrop-blur-md transition-colors hover:bg-[#12162a]/90"
                  >
                    <Sparkles size={13} style={{ color: displayStar?.color }} />
                    {displayStar?.name || 'Your Star'}
                  </button>
                  {stars.length > 1 && (
                    <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-[#0a0d18]/70 px-3 py-2 backdrop-blur-md max-w-lg">
                      {stars.filter((s) => s.id !== displayStar?.id).slice(0, 12).map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            playClick()
                            setFocusId(s.id)
                          }}
                          className="cursor-target flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-dim transition-colors hover:bg-white/[0.1] hover:text-fg"
                        >
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />
                          {s.name}
                        </button>
                      ))}
                      {stars.filter((s) => s.id !== displayStar?.id).length > 12 && (
                        <span className="text-[10px] text-dim/60">+{stars.filter((s) => s.id !== displayStar?.id).length - 12}</span>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <p className="mt-5 flex items-center justify-center gap-2 text-xs text-dim/80">
        <Star size={12} className="fill-amber-200/50 text-amber-200/60" />
        One sky, many stars — claim yours and join the constellation.
      </p>
    </section>
  )
}
