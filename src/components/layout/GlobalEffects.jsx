import { lazy, Suspense, useEffect, useState } from 'react'
import Noise from '@/components/Noise'
import TargetCursor from '@/components/TargetCursor'

const Silk = lazy(() => import('@/components/Silk'))

export default function GlobalEffects() {
  const [reduceMotion, setReduceMotion] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const mqMobile = window.matchMedia('(max-width: 768px)')
    setReduceMotion(mq.matches)
    setIsMobile(mqMobile.matches)
    const onMotion = (e) => setReduceMotion(e.matches)
    const onMobile = (e) => setIsMobile(e.matches)
    mq.addEventListener('change', onMotion)
    mqMobile.addEventListener('change', onMobile)
    return () => {
      mq.removeEventListener('change', onMotion)
      mqMobile.removeEventListener('change', onMobile)
    }
  }, [])

  return (
    <>
      <div className="pointer-events-none fixed inset-0 -z-10 bg-bg">
        {!reduceMotion && !isMobile ? (
          <Suspense fallback={<div className="h-full w-full bg-bg" />}>
            <div className="h-full w-full opacity-70">
              <Silk speed={3.5} scale={1.1} color="#2a2a2a" noiseIntensity={1.2} rotation={0} />
            </div>
          </Suspense>
        ) : (
          <div
            className="h-full w-full"
            style={{
              background:
                'radial-gradient(ellipse at 20% 20%, #1a1a1a 0%, #050505 55%), linear-gradient(180deg, #0a0a0a, #050505)',
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />
      </div>

      {!reduceMotion && !isMobile && (
        <TargetCursor
          targetSelector=".cursor-target"
          spinDuration={2}
          hideDefaultCursor
          hoverDuration={0.2}
          parallaxOn
          cursorColor="#ffffff"
        />
      )}

      <div className="noise-overlay">
        <Noise patternAlpha={18} patternRefreshInterval={3} />
      </div>
    </>
  )
}
