import { Wrench, RefreshCw } from 'lucide-react'
import GlobalEffects from '@/components/layout/GlobalEffects'
import GlassSurface from '@/components/GlassSurface'
import DecryptedText from '@/components/DecryptedText'
import BlurText from '@/components/BlurText'

export default function MaintenanceScreen() {
  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      <GlobalEffects />
      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-24">
        <GlassSurface
          width="100%"
          height="auto"
          borderRadius={28}
          backgroundOpacity={0.14}
          brightness={40}
          blur={12}
          opacity={0.92}
          className="w-full max-w-xl p-8 md:p-12"
          style={{ width: '100%', minHeight: 420 }}
        >
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-border bg-black/40">
              <Wrench className="h-9 w-9 animate-spin text-fg [animation-duration:6s]" />
              <span className="absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.9)]" />
            </div>

            <span className="rounded-full border border-border px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-amber-300">
              Maintenance Mode
            </span>

            <h1 className="font-display text-3xl font-bold leading-tight text-fg md:text-4xl">
              <DecryptedText
                text="Website is under maintenance"
                animateOn="view"
                speed={40}
                sequential
                revealDirection="start"
                className="text-fg"
              />
            </h1>

            <BlurText
              text="We're upgrading things behind the scenes. Please check back shortly — we'll be back online soon."
              delay={30}
              animateBy="words"
              direction="top"
              className="justify-center text-center text-muted"
            />

            <div className="flex w-full flex-col items-center gap-4">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="cursor-target inline-flex items-center gap-2 rounded-full border border-fg bg-fg px-6 py-2.5 text-xs uppercase tracking-wider text-bg transition hover:opacity-80"
              >
                <RefreshCw className="h-4 w-4" />
                Try again
              </button>
            </div>
          </div>
        </GlassSurface>
      </div>
    </div>
  )
}
