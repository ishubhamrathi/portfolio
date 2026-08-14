import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Sparkles } from 'lucide-react'
import { randomIdentity, RARITIES } from './starIdentities'
import styles from './stars.module.css'
import { useSound } from '@/context/SoundProvider'

const WAKE_MS = 800
const REEL_MS = 2400

export default function StarMachine({ onJoin, joining = false, recastMode = false }) {
  const [stage, setStage] = useState('idle')
  const [identity, setIdentity] = useState(null)
  const [reelName, setReelName] = useState('')
  const timersRef = useRef([])
  const { playClick, playHover, playSuccess, playSection } = useSound()

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }
  useEffect(() => clearTimers, [])

  const start = () => {
    if (stage !== 'idle') return
    playClick()
    setStage('waking')
    timersRef.current.push(
      setTimeout(() => {
        setStage('reeling')
        playSection()
        const chosen = randomIdentity()
        let interval = 80
        let elapsed = 0
        const tick = () => {
          setReelName(randomIdentity().name)
          elapsed += interval
          if (elapsed < REEL_MS) {
            interval += 60
            timersRef.current.push(setTimeout(tick, interval))
          } else {
            setReelName(chosen.name)
            setIdentity(chosen)
            setStage('reveal')
            playSuccess()
          }
        }
        timersRef.current.push(setTimeout(tick, interval))
      }, WAKE_MS)
    )
  }

  const active = stage !== 'idle'
  const rarity = identity ? RARITIES[identity.rarity] : null

  return (
    <div className={`${styles.machine} ${active ? styles.machineActive : ''}`}>
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-2.5">
        <span className="text-[10px] uppercase tracking-[0.35em] text-dim">Cosmic Registry</span>
        <span className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`${styles.machineBreath} h-1 w-1 rounded-full bg-amber-200/70`}
              style={{ animationDelay: `${i * 0.5}s` }}
            />
          ))}
        </span>
      </div>

      <div className={styles.machineDisplay}>
        <div
          className={`${styles.energyRing} ${
            stage === 'waking' ? styles.energyRingPulse : stage === 'reeling' || stage === 'reveal' ? styles.energyRingSpin : ''
          }`}
        />
        <div className="relative z-10 w-full px-6 py-7 text-center sm:px-10">
          <AnimatePresence mode="wait">
            {stage === 'idle' && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-white/[0.03]">
                  <Sparkles size={22} className="text-amber-200/90" />
                </div>
                <p className="font-display text-2xl font-semibold text-fg">
                  {recastMode ? 'Recast Terminal' : 'Star Terminal'}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {recastMode ? 'A new identity waits to take your place.' : 'A cosmic identity waits inside.'}
                </p>
              </motion.div>
            )}

            {stage === 'waking' && (
              <motion.div
                key="waking"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-3"
              >
                <p className={`${styles.machineBreath} font-display text-lg text-muted`}>Calibrating</p>
                <p className="text-xs uppercase tracking-[0.3em] text-dim">Waking the machine</p>
              </motion.div>
            )}

            {stage === 'reeling' && (
              <motion.div
                key="reeling"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
              >
                <p className="mb-3 text-xs uppercase tracking-[0.3em] text-dim">Scanning the sky</p>
                <p className={`${styles.reelFlicker} font-display text-4xl font-bold text-fg sm:text-5xl`}>
                  {reelName}
                </p>
              </motion.div>
            )}

            {stage === 'reveal' && identity && (
              <motion.div
                key="reveal"
                initial={{ opacity: 0, scale: 0.88, y: 14 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              >
                <p className="text-xs uppercase tracking-[0.35em] text-dim">You discovered</p>
                <div className="mt-2 flex items-center justify-center gap-3">
                  <Sparkles size={22} style={{ color: identity.color }} />
                  <span className="font-display text-4xl font-bold text-fg">{identity.name}</span>
                </div>
                <p className="mt-1 font-display text-base text-muted">{identity.title}</p>
                <span
                  className={styles.badge}
                  style={{
                    color: rarity?.color,
                    borderColor: `${rarity?.color}55`,
                    background: `${rarity?.color}12`,
                  }}
                >
                  {rarity?.label}
                </span>
                <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-muted">
                  {identity.description}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex min-h-[72px] items-center justify-center border-t border-white/10 px-5 py-4">
        {stage === 'idle' && (
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onMouseEnter={playHover}
            onClick={start}
            className="cursor-target rounded-full bg-gradient-to-r from-amber-300 to-yellow-200 px-7 py-3 text-sm font-semibold text-black shadow-[0_0_36px_rgba(253,224,71,0.35)] transition-shadow hover:shadow-[0_0_52px_rgba(253,224,71,0.5)]"
          >
            {recastMode ? 'Recast My Star' : 'Claim My Star'}
          </motion.button>
        )}

        {(stage === 'waking' || stage === 'reeling') && (
          <p className="text-xs text-dim">Choosing your identity…</p>
        )}

        {stage === 'reveal' && identity && (
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onMouseEnter={playHover}
            onClick={() => {
              playClick()
              onJoin(identity)
            }}
            disabled={joining}
            className="cursor-target rounded-full border border-white/20 bg-white/[0.06] px-7 py-3 text-sm font-semibold text-fg backdrop-blur transition-colors hover:bg-white/[0.12] disabled:cursor-default disabled:opacity-60"
          >
            {joining ? 'Launching…' : 'Join The Constellation'}
          </motion.button>
        )}
      </div>
    </div>
  )
}