import { useEffect, useState } from 'react'
import Noise from '@/components/Noise'
import TargetCursor from '@/components/TargetCursor'
import FaultyTerminal from '@/components/FaultyTerminal/FaultyTerminal'

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
          <div className="absolute inset-0 h-full w-full">
            <FaultyTerminal
              scale={1.5}
              gridMul={[2, 1]}
              digitSize={1.2}
              timeScale={0.5}
              pause={false}
              scanlineIntensity={0.5}
              glitchAmount={1}
              flickerAmount={1}
              noiseAmp={1}
              chromaticAberration={0}
              dither={0}
              curvature={0.1}
              tint="#605454"
              mouseReact
              mouseStrength={0.5}
              pageLoadAnimation
              brightness={0.6}
            />
          </div>
        ) : (
          <div
            className="h-full w-full"
            style={{
              background:
                'radial-gradient(ellipse at 20% 20%, #1a1a1a 0%, #050505 55%), linear-gradient(180deg, #0a0a0a, #050505)',
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/30" />
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
