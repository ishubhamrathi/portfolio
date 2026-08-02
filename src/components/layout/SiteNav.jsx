import { useEffect, useState } from 'react'
import PillNav from '@/components/PillNav'
import GlassSurface from '@/components/GlassSurface'
import { useSound } from '@/context/SoundProvider'
import { HiSpeakerWave, HiSpeakerXMark } from 'react-icons/hi2'

export default function SiteNav({ items }) {
  const { muted, toggleMute, playNav, unlock } = useSound()
  const [activeHref, setActiveHref] = useState('#home')

  useEffect(() => {
    const onScroll = () => {
      const sections = items.map((i) => i.href.replace('#', '')).filter(Boolean)
      let current = '#home'
      for (const id of sections) {
        const el = document.getElementById(id)
        if (!el) continue
        if (el.getBoundingClientRect().top <= 120) current = `#${id}`
      }
      setActiveHref(current)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [items])

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex items-start justify-between gap-3 p-3 md:p-5">
      <div
        className="pointer-events-auto relative min-w-0 flex-1 md:flex-none"
        onClick={() => {
          unlock()
          playNav()
        }}
      >
        <div className="relative w-full md:w-auto [&_.absolute]:!static [&_.absolute]:!w-full md:[&_.absolute]:!w-auto">
          <PillNav
            logo="/logo.svg"
            logoAlt="SR"
            items={items}
            activeHref={activeHref}
            baseColor="#f5f5f5"
            pillColor="#0a0a0a"
            hoveredPillTextColor="#0a0a0a"
            pillTextColor="#f5f5f5"
            initialLoadAnimation
          />
        </div>
      </div>

      <div className="pointer-events-auto shrink-0">
        <GlassSurface
          width={48}
          height={48}
          borderRadius={999}
          backgroundOpacity={0.12}
          brightness={35}
          blur={10}
          opacity={0.9}
          className="flex items-center justify-center"
        >
          <button
            type="button"
            aria-label={muted ? 'Unmute sound' : 'Mute sound'}
            onClick={toggleMute}
            className="cursor-target flex h-12 w-12 items-center justify-center text-fg"
          >
            {muted ? <HiSpeakerXMark size={18} /> : <HiSpeakerWave size={18} />}
          </button>
        </GlassSurface>
      </div>
    </div>
  )
}
