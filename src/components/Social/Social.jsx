import { useMemo } from 'react'
import Dock from '@/components/Dock'
import Magnet from '@/components/Magnet'
import DecryptedText from '@/components/DecryptedText'
import { useSound } from '@/context/SoundProvider'

const ICON_CDN = 'https://cdn.simpleicons.org'

function iconSrc(entry) {
  const url = entry.iconUrl || `${ICON_CDN}/${entry.iconSlug || 'link'}`
  const parts = url.split('/')
  if (url.includes('cdn.simpleicons.org') && parts.length === 4) {
    return `${url}/white`
  }
  return url
}

function needsWhiteFilter(src) {
  return src.includes('cdn.jsdelivr.net/npm/simple-icons')
}

const PLATFORM_LABELS = {
  GITHUB: 'GitHub',
  TWITTER: 'Twitter',
  X: 'X',
  LINKEDIN: 'LinkedIn',
  INSTAGRAM: 'Instagram',
  EMAIL: 'Email',
  YOUTUBE: 'YouTube',
  MASTODON: 'Mastodon',
  DISCORD: 'Discord',
  OTHER: 'Link',
}

function platformLabel(name) {
  return PLATFORM_LABELS[name] || name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
}

export default function Social({ social }) {
  const { playClick } = useSound()

  const items = useMemo(() => {
    if (!social?.links?.length) return []
    return social.links.map((entry) => {
      const isEmail = entry.name === 'EMAIL'
      const open = () => {
        playClick()
        if (isEmail) {
          const href = entry.link.startsWith('mailto:') ? entry.link : `mailto:${entry.link}`
          window.location.href = href
        } else {
          window.open(entry.link, '_blank', 'noopener,noreferrer')
        }
      }
      return {
        icon: (
          <img
            src={iconSrc(entry)}
            alt={platformLabel(entry.name)}
            className="h-6 w-6"
            loading="lazy"
            style={needsWhiteFilter(iconSrc(entry)) ? { filter: 'brightness(0) invert(1)' } : undefined}
          />
        ),
        label: platformLabel(entry.name),
        onClick: open,
      }
    })
  }, [social, playClick])

  if (!social) return <section id="social" className="px-6 py-24" />

  return (
    <section id="social" className="relative px-6 pb-40 pt-24 md:px-12 lg:px-20">
      <p className="mb-2 text-xs uppercase tracking-[0.35em] text-dim">Connect</p>
      <h2 className="mb-8 font-display text-4xl font-bold md:text-5xl">
        <DecryptedText text={social.title} animateOn="view" />
      </h2>
      <Magnet padding={80} magnetStrength={2} wrapperClassName="inline-block">
        <p className="max-w-md text-muted">Find me across platforms — tap an icon in the dock.</p>
      </Magnet>

      <div className="relative mt-16 h-28">
        <Dock
          items={items}
          panelHeight={78}
          baseItemSize={54}
          magnification={76}
          distance={120}
          className="border-border bg-black/50 backdrop-blur-md"
        />
      </div>
    </section>
  )
}
