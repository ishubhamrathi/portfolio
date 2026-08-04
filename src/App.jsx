import { useEffect, useMemo, useState } from 'react'
import { BrowserRouter, useLocation, matchPath } from 'react-router-dom'
import { SoundProvider, useSound } from '@/context/SoundProvider'
import GlobalEffects from '@/components/layout/GlobalEffects'
import PageLoader from '@/components/layout/PageLoader'
import SectionScroller from '@/components/layout/SectionScroller'
import SiteNav from '@/components/layout/SiteNav'
import ClickSpark from '@/components/ClickSpark'
import Home from '@/components/Home/Home'
import Projects from '@/components/Projects/Projects'
import About from '@/components/About/About'
import Stats from '@/components/Stats/Stats'
import Blog from '@/components/Blog/Blog'
import Social from '@/components/Social/Social'
import ProjectDetailPage from '@/components/Project/ProjectDetailPage'
import BlogDetailPage from '@/components/Blog/BlogDetailPage'
import { getFeatures, getHome, getProjects, getSocial } from '@/services/contentApi'
import { HiHome, HiFolder, HiUser, HiChartBar, HiNewspaper, HiEnvelope } from 'react-icons/hi2'

const navIcons = {
  '#home': HiHome,
  '#projects': HiFolder,
  '#about': HiUser,
  '#stats': HiChartBar,
  '#blog': HiNewspaper,
  '#social': HiEnvelope,
}

const navColors = {
  '#home': '#3b82f6',
  '#projects': '#10b981',
  '#about': '#8b5cf6',
  '#stats': '#f59e0b',
  '#blog': '#ef4444',
  '#social': '#06b6d4',
}

function AppShell() {
  const [navLabels, setNavLabels] = useState(null)
  const [flags, setFlags] = useState({})
  const [pageReady, setPageReady] = useState(false)
  const { unlock } = useSound()

  useEffect(() => {
    getHome().then((home) => setNavLabels(home.nav))
    getFeatures().then((data) => setFlags(data.flags || data || {}))
  }, [])

  useEffect(() => {
    const MIN_LOAD_MS = 1200
    const start = performance.now()
    let cancelled = false

    const hide = () => {
      if (cancelled) return
      const wait = Math.max(0, MIN_LOAD_MS - (performance.now() - start))
      setTimeout(() => {
        if (!cancelled) setPageReady(true)
      }, wait)
    }

    getHome().then(hide)
    setTimeout(hide, MIN_LOAD_MS)

    Promise.allSettled([getProjects(), getSocial(), getFeatures()])

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const unlockOnce = () => unlock()
    window.addEventListener('pointerdown', unlockOnce, { once: true })
    return () => window.removeEventListener('pointerdown', unlockOnce)
  }, [unlock])

  const navItems = useMemo(() => {
    const labels = navLabels || {}
    const items = [
      { label: labels.home || 'Home', href: '#home', icon: <HiHome className="h-5 w-5" />, color: navColors['#home'] },
      { label: labels.projects || 'Projects', href: '#projects', icon: <HiFolder className="h-5 w-5" />, color: navColors['#projects'] },
      { label: labels.about || 'About', href: '#about', icon: <HiUser className="h-5 w-5" />, color: navColors['#about'] },
      { label: 'Stats', href: '#stats', icon: <HiChartBar className="h-5 w-5" />, color: navColors['#stats'] },
    ]
    if (flags.blog !== false) {
      items.push({ label: labels.blog || 'Blog', href: '#blog', icon: <HiNewspaper className="h-5 w-5" />, color: navColors['#blog'] })
    }
    items.push({ label: labels.contact || 'Contact', href: '#social', icon: <HiEnvelope className="h-5 w-5" />, color: navColors['#social'] })
    return items
  }, [navLabels, flags])

  return (
    <>
      <ClickSpark sparkColor="#ffffff" sparkSize={8} sparkRadius={18} sparkCount={6} duration={450}>
        <SectionScroller />
        <div className="App relative min-h-screen bg-transparent pb-28 text-fg md:ml-[280px] md:pb-0">
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
      <PageLoader done={pageReady} />
    </>
  )
}

function AppContent() {
  const location = useLocation()
  const detailMatch = matchPath('/projects/:id', location.pathname)
  const blogDetailMatch = matchPath('/blogs/:slug', location.pathname)

  return (
    <>
      <AppShell />
      {detailMatch && <ProjectDetailPage id={detailMatch.params.id} />}
      {blogDetailMatch && <BlogDetailPage slug={blogDetailMatch.params.slug} />}
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
