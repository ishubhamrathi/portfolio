import { useEffect, useMemo, useState } from 'react'
import ScrollReveal from '@/components/ScrollReveal'
import AnimatedContent from '@/components/AnimatedContent'
import TrueFocus from '@/components/TrueFocus'
import { LogoLoop } from '@/components/LogoLoop'
import ReflectiveCard from '@/components/ReflectiveCard'
import { getAbout } from '@/services/contentApi'

export default function About() {
  const [about, setAbout] = useState(null)
  const [photoSrc, setPhotoSrc] = useState(null)

  useEffect(() => {
    getAbout().then((data) => {
      setAbout(data)
      const primary = data.photo
      const fallback = data.photoFallback
      if (!primary) {
        setPhotoSrc(fallback)
        return
      }
      const img = new Image()
      img.onload = () => setPhotoSrc(primary)
      img.onerror = () => setPhotoSrc(fallback)
      img.src = primary
    })
  }, [])

  const skillLogos = useMemo(() => {
    if (!about?.skills?.categories) return []
    return Object.values(about.skills.categories).flatMap((cat) =>
      (cat.items || []).map((item) => ({
        node: (
          <span className="rounded-full border border-border px-4 py-2 text-sm text-muted whitespace-nowrap">
            {item}
          </span>
        ),
        title: item,
        ariaLabel: item,
      }))
    )
  }, [about])

  if (!about) {
    return <section id="about" className="min-h-[40vh] px-6 py-24" />
  }

  const skillSentence = Object.values(about.skills?.categories || {})
    .map((c) => c.title)
    .join(' ')

  return (
    <section id="about" className="relative px-6 py-24 md:px-12 lg:px-20">
      <p className="mb-2 text-xs uppercase tracking-[0.35em] text-dim">Profile</p>
      <h2 className="mb-10 font-display text-4xl font-bold md:text-5xl">
        <ScrollReveal baseOpacity={0.1} enableBlur baseRotation={2} blurStrength={8}>
          {about.title}
        </ScrollReveal>
      </h2>

      <div className="mb-14 flex flex-col items-center gap-10 lg:flex-row lg:items-start lg:gap-14">
        <AnimatedContent distance={50} duration={0.7}>
          <ReflectiveCard
            imageSrc={photoSrc}
            name={about.name || 'Shubham Rathi'}
            role={about.role || 'Full Stack Developer'}
            idLabel="PORTFOLIO"
            idNumber="SR-DEV"
            grayscale={1}
            blurStrength={1.5}
            metalness={0.9}
            roughness={0.4}
            overlayColor="rgba(0,0,0,0.4)"
            className="cursor-target mx-auto shrink-0"
          />
        </AnimatedContent>

        <div className="min-w-0 flex-1 space-y-4 text-lg leading-relaxed text-muted">
          {(about.intro || []).map((p) => (
            <AnimatedContent key={p.slice(0, 24)} distance={40} duration={0.6}>
              <p>{p}</p>
            </AnimatedContent>
          ))}
        </div>
      </div>

      <div className="mb-10">
        <h3 className="mb-4 font-display text-2xl">{about.skills?.title || 'Skills'}</h3>
        {skillSentence && (
          <div className="mb-6">
            <TrueFocus
              sentence={skillSentence}
              blurAmount={4}
              borderColor="#f5f5f5"
              glowColor="rgba(255,255,255,0.35)"
              animationDuration={0.4}
            />
          </div>
        )}
        {skillLogos.length > 0 && (
          <div className="relative overflow-hidden py-4">
            <LogoLoop logos={skillLogos} speed={60} gap={28} logoHeight={40} fadeOut />
          </div>
        )}
      </div>
    </section>
  )
}
