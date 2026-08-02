import { useEffect, useMemo, useState } from 'react'
import Dock from '@/components/Dock'
import Magnet from '@/components/Magnet'
import DecryptedText from '@/components/DecryptedText'
import { AiFillGithub, AiFillInstagram, AiFillLinkedin, AiFillMail } from 'react-icons/ai'
import { getSocial } from '@/services/contentApi'
import { useSound } from '@/context/SoundProvider'

export default function Social() {
  const [social, setSocial] = useState(null)
  const { playClick } = useSound()

  useEffect(() => {
    getSocial().then(setSocial)
  }, [])

  const items = useMemo(() => {
    if (!social?.links) return []
    const open = (url) => {
      playClick()
      window.open(url, '_blank', 'noopener,noreferrer')
    }
    return [
      {
        icon: <AiFillGithub size={22} className="text-fg" />,
        label: 'GitHub',
        onClick: () => open(social.links.github),
      },
      {
        icon: <AiFillLinkedin size={22} className="text-fg" />,
        label: 'LinkedIn',
        onClick: () => open(social.links.linkedin),
      },
      {
        icon: <AiFillInstagram size={22} className="text-fg" />,
        label: 'Instagram',
        onClick: () => open(social.links.instagram),
      },
      {
        icon: <AiFillMail size={22} className="text-fg" />,
        label: 'Email',
        onClick: () => {
          playClick()
          window.location.href = `mailto:${social.links.email}`
        },
      },
    ]
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
