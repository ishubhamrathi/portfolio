import { useEffect, useState } from 'react'
import GlassSurface from '@/components/GlassSurface'
import OptionWheel from '@/components/OptionWheel/OptionWheel'
import AnimatedTabBar from '@/components/AnimatedTabBar/AnimatedTabBar'
import { useSound } from '@/context/SoundProvider'
import { HiSpeakerWave, HiSpeakerXMark } from 'react-icons/hi2'

export default function SiteNav({ items }) {
  const { muted, toggleMute, playNav, unlock } = useSound()
  const [activeHref, setActiveHref] = useState('#home')

  useEffect(() => {
    let ticking = false
    let active = '#home'

    const measure = () => {
      ticking = false
      const sections = items.map((i) => i.href.replace('#', '')).filter(Boolean)
      let current = '#home'
      for (const id of sections) {
        const el = document.getElementById(id)
        if (!el) continue
        if (el.getBoundingClientRect().top <= 120) current = `#${id}`
      }
      if (current !== active) {
        active = current
        setActiveHref(current)
      }
    }

    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(measure)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    measure()
    return () => window.removeEventListener('scroll', onScroll)
  }, [items])

  const handleNav = (href) => {
    unlock()
    playNav()
    const id = href.replace('#', '')
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const activeIndex = items.findIndex((item) => item.href === activeHref)

  return (
    <>
      {/* Desktop: Left sidebar with OptionWheel */}
      <aside className="fixed top-0 left-0 z-50 hidden h-screen w-[280px] flex-col items-center gap-8 border-r border-white/5 bg-black pt-20 md:flex">
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

        <div className="relative h-[520px] w-[280px]">
          <OptionWheel
            items={items.map((i) => i.label)}
            defaultSelected={activeIndex >= 0 ? activeIndex : 0}
            onChange={(index) => handleNav(items[index].href)}
            side="left"
            fontSize={1.6}
            spacing={1.6}
            curve={0.9}
            tilt={7}
            fade={0.35}
            minOpacity={0.12}
            inset={70}
            textColor="#a6a6a6"
            activeColor="#ffffff"
          />
        </div>
      </aside>

      {/* Mobile: Bottom tab bar with AnimatedTabBar */}
      <nav className="fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
        <AnimatedTabBar
          items={items.map((item) => ({
            label: item.label,
            icon: item.icon,
            color: item.color,
            href: item.href,
          }))}
          selected={activeIndex >= 0 ? activeIndex : 0}
          onChange={(index) => handleNav(items[index].href)}
        />
      </nav>
    </>
  )
}
