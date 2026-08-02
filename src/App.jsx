import { useEffect, useMemo, useState } from 'react'
import { BrowserRouter, useLocation, matchPath } from 'react-router-dom'
import { SoundProvider, useSound } from '@/context/SoundProvider'
import GlobalEffects from '@/components/layout/GlobalEffects'
import SiteNav from '@/components/layout/SiteNav'
import ClickSpark from '@/components/ClickSpark'
import Home from '@/components/Home/Home'
import Projects from '@/components/Projects/Projects'
import About from '@/components/About/About'
import Stats from '@/components/Stats/Stats'
import Blog from '@/components/Blog/Blog'
import Social from '@/components/Social/Social'
import ProjectDetailPage from '@/components/Project/ProjectDetailPage'
import { getFeatures, getHome } from '@/services/contentApi'

function AppShell() {
  const [navLabels, setNavLabels] = useState(null)
  const [flags, setFlags] = useState({})
  const { unlock } = useSound()

  useEffect(() => {
    getHome().then((home) => setNavLabels(home.nav))
    getFeatures().then((data) => setFlags(data.flags || data || {}))
  }, [])

  useEffect(() => {
    const unlockOnce = () => unlock()
    window.addEventListener('pointerdown', unlockOnce, { once: true })
    return () => window.removeEventListener('pointerdown', unlockOnce)
  }, [unlock])

  const navItems = useMemo(() => {
    const labels = navLabels || {}
    const items = [
      { label: labels.home || 'Home', href: '#home' },
      { label: labels.projects || 'Projects', href: '#projects' },
      { label: labels.about || 'About', href: '#about' },
      { label: 'Stats', href: '#stats' },
    ]
    if (flags.blog !== false) {
      items.push({ label: labels.blog || 'Blog', href: '#blog' })
    }
    items.push({ label: labels.contact || 'Contact', href: '#social' })
    return items
  }, [navLabels, flags])

  return (
    <ClickSpark sparkColor="#ffffff" sparkSize={8} sparkRadius={18} sparkCount={6} duration={450}>
      <div className="App relative min-h-screen bg-transparent text-fg">
        <GlobalEffects />
        <SiteNav items={navItems} />
        <main>
          <Home />
          <Projects />
          <About />
          <Stats />
          {flags.blog !== false && <Blog />}
          <Social />
        </main>
        <footer className="border-t border-border px-6 py-8 text-center text-xs uppercase tracking-[0.25em] text-dim">
          © {new Date().getFullYear()} Shubham Rathi
        </footer>
      </div>
    </ClickSpark>
  )
}

function AppContent() {
  const location = useLocation()
  const detailMatch = matchPath('/projects/:id', location.pathname)

  return (
    <>
      <AppShell />
      {detailMatch && <ProjectDetailPage id={detailMatch.params.id} />}
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <SoundProvider>
        <AppContent />
      </SoundProvider>
    </BrowserRouter>
  )
}
