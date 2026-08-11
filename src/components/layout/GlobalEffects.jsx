import { useEffect, useState } from 'react'
import Noise from '@/components/Noise'
import TargetCursor from '@/components/TargetCursor'
import FaultyTerminal from '@/components/FaultyTerminal/FaultyTerminal'
import DotField from '@/components/DotField/DotField'

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
            <DotField
              dotRadius={1.2}
              dotSpacing={16}
              bulgeStrength={40}
              glowRadius={140}
              sparkle={false}
              waveAmplitude={0}
              cursorRadius={400}
              cursorForce={0.08}
              bulgeOnly
              gradientFrom="rgba(168, 85, 247, 0.08)"
              gradientTo="rgba(180, 151, 207, 0.05)"
              glowColor="#120F17"
            />
            <div className="absolute inset-0 h-full w-full opacity-20 blur-[1px]">
              <FaultyTerminal
                scale={1.3}
                gridMul={[2, 1]}
                digitSize={1.2}
                timeScale={0.3}
                pause={false}
                scanlineIntensity={0.3}
                glitchAmount={0.5}
                flickerAmount={0.5}
                noiseAmp={0.5}
                chromaticAberration={0}
                dither={0}
                curvature={0.1}
                tint="#605454"
                mouseReact
                mouseStrength={0.3}
                pageLoadAnimation
                brightness={0.4}
              />
            </div>
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
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/50" />
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
