import { lazy, Suspense, useEffect, useState } from 'react'
import GlassSurface from '@/components/GlassSurface'
import TextType from '@/components/TextType'
import BlurText from '@/components/BlurText'
import Magnet from '@/components/Magnet'
import SpecularButton from '@/components/SpecularButton'
import { getContactEndpoint, getHome } from '@/services/contentApi'
import { useSound } from '@/context/SoundProvider'

const MessageEditor = lazy(() => import('@/components/MessageEditor/MessageEditor'))

export default function Home() {
  const [home, setHome] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState('')
  const { playClick, playSuccess, unlock } = useSound()

  useEffect(() => {
    getHome().then(setHome)
  }, [])

  if (!home) {
    return (
      <section id="home" className="relative flex min-h-screen items-center px-6 pt-28">
        <div className="h-10 w-64 animate-pulse rounded bg-white/10" />
      </section>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    const endpoint = getContactEndpoint()
    try {
      if (!(formData.message || '').trim()) {
        setSubmitMessage('Please write a message before sending.')
      } else {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sender_name: formData.name,
            sender_email: formData.email,
            message: formData.message,
          }),
        })
        if (response.ok) {
          setSubmitMessage("Thank you! I'll get back to you soon.")
          setFormData({ name: '', email: '', message: '' })
          playSuccess()
          setTimeout(() => setIsFormOpen(false), 2000)
        } else {
          setSubmitMessage('Something went wrong. Please try again.')
        }
      }
    } catch {
      setSubmitMessage('Something went wrong. Please try again.')
    }
    setIsSubmitting(false)
    setTimeout(() => setSubmitMessage(''), 3500)
  }

  return (
    <section id="home" className="relative flex min-h-screen items-center px-6 pb-20 pt-28 md:px-12 lg:px-20">
      <div className="relative z-10 max-w-3xl">
        <p className="mb-3 font-body text-sm uppercase tracking-[0.35em] text-muted">{home.greeting}</p>
        <h1 className="font-display text-5xl font-bold leading-[1.05] text-fg md:text-7xl">
          <BlurText
            text={home.name}
            delay={60}
            animateBy="words"
            direction="top"
            className="justify-start text-left"
          />
        </h1>
        <div className="mt-6 min-h-[2.5rem] font-display text-2xl text-muted md:text-3xl">
          <TextType
            text={home.typewriter}
            typingSpeed={55}
            deletingSpeed={30}
            pauseDuration={1400}
            loop
            className="text-muted"
            cursorClassName="text-fg"
          />
        </div>

        <div className="mt-10 flex flex-wrap items-start gap-4">
          <Magnet padding={60} magnetStrength={3}>
            <SpecularButton
              className="cursor-target"
              onClick={() => {
                unlock()
                playClick()
                setIsFormOpen((v) => !v)
              }}
              size="md"
              textColor="#f5f5f5"
              lineColor="#ffffff"
              baseColor="#3a3a3a"
            >
              {home.contactButton || 'Get In Touch'}
            </SpecularButton>
          </Magnet>
        </div>

        {isFormOpen && (
          <div className="mt-8 w-full max-w-lg">
            <GlassSurface
              width="100%"
              height="auto"
              borderRadius={24}
              backgroundOpacity={0.14}
              brightness={40}
              blur={12}
              opacity={0.92}
              className="p-5"
              style={{ minHeight: 280, width: '100%' }}
            >
              <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3 text-left">
                <input
                  className="rounded-xl border border-border bg-black/40 px-4 py-3 text-fg outline-none placeholder:text-dim focus:border-white/40"
                  type="text"
                  name="name"
                  placeholder="Your Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                <input
                  className="rounded-xl border border-border bg-black/40 px-4 py-3 text-fg outline-none placeholder:text-dim focus:border-white/40"
                  type="email"
                  name="email"
                  placeholder="Your Email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
                <Suspense
                  fallback={
                    <div className="rounded-xl border border-border bg-black/40 px-4 py-3 text-sm text-dim">
                      Loading editor...
                    </div>
                  }
                >
                  <MessageEditor
                    onChange={(message) => setFormData((prev) => ({ ...prev, message }))}
                    placeholder="Tell me what you need!"
                  />
                </Suspense>
                <SpecularButton type="submit" disabled={isSubmitting} size="sm" className="self-start">
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </SpecularButton>
                {submitMessage && <p className="text-sm text-muted">{submitMessage}</p>}
              </form>
            </GlassSurface>
          </div>
        )}
      </div>
    </section>
  )
}
