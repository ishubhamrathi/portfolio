import { useEffect, useState } from 'react'
import GlassSurface from '@/components/GlassSurface'
import CountUp from '@/components/CountUp'
import AnimatedContent from '@/components/AnimatedContent'
import { getStatsConfig } from '@/services/contentApi'

export default function Stats() {
  const [config, setConfig] = useState(null)
  const [leetcodeStats, setLeetcodeStats] = useState(null)
  const [githubStats, setGithubStats] = useState(null)
  const [linkedinStats, setLinkedinStats] = useState(null)

  useEffect(() => {
    getStatsConfig().then(setConfig)
  }, [])

   useEffect(() => {
    fetch('https://leetcode-stats-api.herokuapp.com/ishubhamrathi')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((data) => {
        if (data.status === 'success') {
          setLeetcodeStats({
            totalSolved: data.totalSolved,
            easy: data.easySolved,
            medium: data.mediumSolved,
            hard: data.hardSolved,
            ranking: data.ranking,
          })
        } else {
          setLeetcodeStats({ totalSolved: 150, easy: 80, medium: 50, hard: 20, ranking: 125000 })
        }
      })
      .catch(() => setLeetcodeStats({ totalSolved: 150, easy: 80, medium: 50, hard: 20, ranking: 125000 }))

    fetch('https://api.github.com/users/ishubhamrathi')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((data) => {
        setGithubStats({
          followers: data.followers || 0,
          following: data.following || 0,
          publicRepos: data.public_repos || 0,
        })
      })
      .catch(() => setGithubStats({ followers: 0, following: 0, publicRepos: 0 }))

    setLinkedinStats({
      experienceYears: 2,
      projects: 10,
      role: 'Software Development Intern',
      skills: 'Full Stack & Computer Vision',
    })
  }, [])

  if (!config) return <section id="stats" className="px-6 py-24" />

  return (
    <section id="stats" className="relative px-6 py-24 md:px-12 lg:px-20">
      <p className="mb-2 text-xs uppercase tracking-[0.35em] text-dim">Signals</p>
      <h2 className="mb-10 font-display text-4xl font-bold md:text-5xl">{config.title}</h2>

      <div className="grid gap-5 md:grid-cols-3">
        <AnimatedContent distance={40}>
          <GlassSurface
            width="100%"
            height="100%"
            borderRadius={24}
            backgroundOpacity={0.12}
            brightness={35}
            blur={10}
            className="h-full p-6"
            style={{ width: '100%', minHeight: 240 }}
          >
            <h3 className="font-display text-xl">{config.profiles.leetcode.title}</h3>
            {leetcodeStats ? (
              <div className="mt-4 space-y-2 text-sm text-muted">
                <p>
                  Total Solved:{' '}
                  <span className="text-fg">
                    <CountUp to={leetcodeStats.totalSolved} duration={1.6} />
                  </span>
                </p>
                <p>
                  Easy {leetcodeStats.easy} · Medium {leetcodeStats.medium} · Hard {leetcodeStats.hard}
                </p>
                <p>
                  Rank{' '}
                  <span className="text-fg">
                    <CountUp to={leetcodeStats.ranking} duration={1.8} separator="," />
                  </span>
                </p>
                <a
                  href={config.profiles.leetcode.profile}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block pt-2 underline-offset-4 hover:underline"
                >
                  View Profile
                </a>
              </div>
            ) : (
              <p className="mt-4 text-muted">Loading...</p>
            )}
          </GlassSurface>
        </AnimatedContent>

        <AnimatedContent distance={40} delay={0.1}>
          <GlassSurface
            width="100%"
            height="100%"
            borderRadius={24}
            backgroundOpacity={0.12}
            brightness={35}
            blur={10}
            className="h-full p-6"
            style={{ width: '100%', minHeight: 240 }}
          >
            <h3 className="font-display text-xl">{config.profiles.github.title}</h3>
            {githubStats ? (
              <div className="mt-4 space-y-2 text-sm text-muted">
                <p>
                  Followers:{' '}
                  <span className="text-fg">
                    <CountUp to={githubStats.followers} duration={1.4} />
                  </span>
                </p>
                <p>
                  Following:{' '}
                  <span className="text-fg">
                    <CountUp to={githubStats.following} duration={1.4} />
                  </span>
                </p>
                <p>
                  Public Repos:{' '}
                  <span className="text-fg">
                    <CountUp to={githubStats.publicRepos} duration={1.4} />
                  </span>
                </p>
                <a
                  href={config.profiles.github.profile}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block pt-2 underline-offset-4 hover:underline"
                >
                  View Profile
                </a>
              </div>
            ) : (
              <p className="mt-4 text-muted">Loading...</p>
            )}
          </GlassSurface>
        </AnimatedContent>

        <AnimatedContent distance={40} delay={0.2}>
          <GlassSurface
            width="100%"
            height="100%"
            borderRadius={24}
            backgroundOpacity={0.12}
            brightness={35}
            blur={10}
            className="h-full p-6"
            style={{ width: '100%', minHeight: 240 }}
          >
            <h3 className="font-display text-xl">{config.profiles.linkedin.title}</h3>
            {linkedinStats ? (
              <div className="mt-4 space-y-2 text-sm text-muted">
                <p>
                  Experience:{' '}
                  <span className="text-fg">
                    <CountUp to={linkedinStats.experienceYears} duration={1.2} />+ Years
                  </span>
                </p>
                <p>Role: {linkedinStats.role}</p>
                <p>Expertise: {linkedinStats.skills}</p>
                <p>
                  Projects:{' '}
                  <span className="text-fg">
                    <CountUp to={linkedinStats.projects} duration={1.2} />+
                  </span>
                </p>
                <a
                  href={config.profiles.linkedin.profile}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block pt-2 underline-offset-4 hover:underline"
                >
                  View LinkedIn
                </a>
              </div>
            ) : (
              <p className="mt-4 text-muted">Loading...</p>
            )}
          </GlassSurface>
        </AnimatedContent>
      </div>
    </section>
  )
}
