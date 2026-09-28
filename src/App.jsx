import { useEffect, useMemo, useState } from 'react'
import { BrowserRouter, useLocation, matchPath } from 'react-router-dom'
import { SoundProvider, useSound } from '@/context/SoundProvider'
import { ContentProvider, useContent } from '@/context/ContentProvider'
import GlobalEffects from '@/components/layout/GlobalEffects'
import PageLoader from '@/components/layout/PageLoader'
import MaintenanceScreen from '@/components/layout/MaintenanceScreen'
import SectionScroller from '@/components/layout/SectionScroller'
import SiteNav from '@/components/layout/SiteNav'
import ClickSpark from '@/components/ClickSpark'
import Home from '@/components/Home/Home'
import Projects from '@/components/Projects/Projects'
import About from '@/components/About/About'
import Stats from '@/components/Stats/Stats'
import BecomeAStar from '@/components/BecomeAStar/BecomeAStar'
import Blog from '@/components/Blog/Blog'
import Books from '@/components/Books/Books'
import Social from '@/components/Social/Social'
import ProjectDetailPage from '@/components/Project/ProjectDetailPage'
import BookDetailPage from '@/components/Books/BookDetailPage'
import BlogDetailPage from '@/components/Blog/BlogDetailPage'
import { HiHome, HiFolder, HiUser, HiChartBar, HiStar, HiNewspaper, HiBookOpen, HiEnvelope } from 'react-icons/hi2'

const navColors = {
  '#home': '#3b82f6',
  '#projects': '#10b981',
  '#about': '#8b5cf6',
  '#stats': '#f59e0b',
  '#star': '#fcd34d',
  '#blog': '#ef4444',
  '#books': '#a78bfa',
  '#social': '#06b6d4',
}

function AppShell() {
  const { content, flags, codingProfiles, starsData, amaSuggestions, social, loading, error } = useContent()
  const [navLabels, setNavLabels] = useState(null)
  const [pageReady, setPageReady] = useState(false)
  const { unlock } = useSound()

  useEffect(() => {
    if (content?.home) {
      setNavLabels(content.home.nav)
    }
  }, [content])

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

    if (!loading) hide()
    setTimeout(hide, MIN_LOAD_MS)

    return () => {
      cancelled = true
    }
  }, [loading])

  useEffect(() => {
    const unlockOnce = () => unlock()
    window.addEventListener('pointerdown', unlockOnce, { once: true })
    return () => window.removeEventListener('pointerdown', unlockOnce)
  }, [unlock])

  const navItems = useMemo(() => {
    const labels = navLabels || {}
    const featureFlags = flags || {}
    const items = [
      { label: labels.home || 'Home', href: '#home', icon: <HiHome className="h-5 w-5" />, color: navColors['#home'] },
      { label: labels.projects || 'Projects', href: '#projects', icon: <HiFolder className="h-5 w-5" />, color: navColors['#projects'] },
      { label: labels.about || 'About', href: '#about', icon: <HiUser className="h-5 w-5" />, color: navColors['#about'] },
      { label: 'Stats', href: '#stats', icon: <HiChartBar className="h-5 w-5" />, color: navColors['#stats'] },
    ]
    if (featureFlags.light !== false) {
      items.push({ label: labels.star || 'Star', href: '#star', icon: <HiStar className="h-5 w-5" />, color: navColors['#star'] })
    }
    if (featureFlags.blog !== false) {
      items.push({ label: labels.blog || 'Blog', href: '#blog', icon: <HiNewspaper className="h-5 w-5" />, color: navColors['#blog'] })
    }
    if (featureFlags.books !== false) {
      items.push({ label: 'Books', href: '#books', icon: <HiBookOpen className="h-5 w-5" />, color: navColors['#books'] })
    }
    items.push({ label: labels.contact || 'Contact', href: '#social', icon: <HiEnvelope className="h-5 w-5" />, color: navColors['#social'] })
    return items
  }, [navLabels, flags])

  if (loading) {
    return (
      <>
        <GlobalEffects />
        <PageLoader done={false} />
      </>
    )
  }

  if (error) {
    return <MaintenanceScreen />
  }

  return (
    <>
      <ClickSpark sparkColor="#ffffff" sparkSize={8} sparkRadius={18} sparkCount={6} duration={450}>
        <SectionScroller />
        <div className="App relative min-h-screen bg-transparent pb-28 text-fg md:ml-[280px] md:pb-0">
          <GlobalEffects />
          <SiteNav items={navItems} />
          <main>
            <Home home={content?.home} aiAssistantV2={flags?.ai_assistant_v2 !== false && flags?.FEATURE_AI_ASSISTANT_V2 !== false} />
            <Projects content={content} />
            <About about={content?.about} />
            <Stats content={content} codingProfiles={codingProfiles} />
            {flags?.light !== false && <BecomeAStar starsData={starsData} amaSuggestions={amaSuggestions} />}
            {flags?.blog !== false && <Blog content={content} />}
            {flags?.books !== false && <Books content={content} />}
            <Social social={social} />
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
  const bookDetailMatch = matchPath('/books/:id', location.pathname)
  const blogDetailMatch = matchPath('/blogs/:slug', location.pathname)

  return (
    <ContentProvider>
      <>
        <AppShell />
        {detailMatch && <ProjectDetailPage id={detailMatch.params.id} />}
        {bookDetailMatch && <BookDetailPage id={bookDetailMatch.params.id} />}
        {blogDetailMatch && <BlogDetailPage slug={blogDetailMatch.params.slug} />}
      </>
    </ContentProvider>
  )
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <SoundProvider>
        <AppContent />
      </SoundProvider>
    </BrowserRouter>
  )
}