import { useEffect, useState } from 'react'
import GlassSurface from '@/components/GlassSurface'
import CountUp from '@/components/CountUp'
import AnimatedContent from '@/components/AnimatedContent'
import { getCodingProfiles, getStatsConfig } from '@/services/contentApi'
import { useSound } from '@/context/SoundProvider'

const ICON_CDN = 'https://cdn.simpleicons.org'
const ICON_NPM = 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons'

const PLATFORM_ICONS = {
  leetcode: `${ICON_CDN}/leetcode/white`,
  github: `${ICON_CDN}/github/white`,
  linkedin: `${ICON_NPM}/linkedin.svg`,
}

const DIFFICULTY = [
  { key: 'easy', label: 'Easy', color: '#00b8a3' },
  { key: 'medium', label: 'Medium', color: '#ffc01e' },
  { key: 'hard', label: 'Hard', color: '#ff375f' },
]

function PlatformIcon({ slug, alt }) {
  const src = PLATFORM_ICONS[slug]
  const needsWhite = src.includes('jsdelivr.net')
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className="h-4 w-4"
      style={needsWhite ? { filter: 'brightness(0) invert(1)' } : undefined}
    />
  )
}

function ProfileLink({ href, children }) {
  const { playClick } = useSound()
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      onClick={playClick}
      className="cursor-target inline-flex items-center gap-1 text-xs text-muted transition-colors hover:text-fg"
    >
      {children}
      <span aria-hidden>→</span>
    </a>
  )
}

function StatTile({ value, label }) {
  return (
    <div className="rounded-2xl bg-white/5 px-4 py-3 ring-1 ring-white/10">
      <p className="font-display text-3xl font-bold leading-none text-fg">
        <CountUp to={value} duration={0.6} />
      </p>
      <p className="mt-1.5 text-xs uppercase tracking-widest text-dim">{label}</p>
    </div>
  )
}

export default function Stats() {
  const [config, setConfig] = useState(null)
  const [leetcodeStats, setLeetcodeStats] = useState(null)
  const [githubStats, setGithubStats] = useState(null)
  const [linkedinStats, setLinkedinStats] = useState(null)

  useEffect(() => {
    getStatsConfig().then(setConfig)
  }, [])

  useEffect(() => {
    getCodingProfiles()
      .then(({ github, leetcode }) => {
        setGithubStats({
          followers: github.followers,
          following: github.following,
          publicRepos: github.publicRepos,
        })
        setLeetcodeStats(leetcode)
      })
      .catch(() => {
        setGithubStats(null)
        setLeetcodeStats(null)
      })

    setLinkedinStats(null)
  }, [])

  if (!config) return <section id="stats" className="px-6 py-24" />

  return (
    <section id="stats" className="relative px-6 py-24 md:px-12 lg:px-20">
      <p className="mb-2 flex items-center gap-2.5 text-xs uppercase tracking-[0.35em] text-dim">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>
        Signals
      </p>
      <h2 className="mb-10 font-display text-4xl font-bold md:text-5xl">{config.title}</h2>

      <div className="grid gap-5 lg:grid-cols-3">
        <AnimatedContent distance={40} className="lg:col-span-2">
          <GlassSurface
            width="100%"
            height="100%"
            borderRadius={24}
            backgroundOpacity={0.12}
            brightness={35}
            blur={10}
            className="h-full p-6"
            style={{ width: '100%', minHeight: 264 }}
          >
            <div className="flex h-full w-full flex-col gap-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-400/15 ring-1 ring-orange-400/20">
                    <PlatformIcon slug="leetcode" alt="LeetCode" />
                  </span>
                  <h3 className="font-display text-lg text-fg">{config.profiles.leetcode.title}</h3>
                </div>
                {leetcodeStats ? (
                  <ProfileLink href={config.profiles.leetcode.profile}>View Profile</ProfileLink>
                ) : null}
              </div>

              {leetcodeStats ? (
                <>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <p className="mb-1 text-xs uppercase tracking-widest text-dim">Total Solved</p>
                      <p className="font-display text-4xl font-bold leading-none text-fg sm:text-5xl">
                        <CountUp to={leetcodeStats.totalSolved} duration={0.8} separator="," />
                      </p>
                    </div>
                    <div className="sm:text-right">
                      <p className="mb-1 text-xs uppercase tracking-widest text-dim">Global Rank</p>
                      <p className="font-display text-4xl font-bold leading-none text-fg sm:text-5xl">
                        <CountUp
                          to={Math.ceil(leetcodeStats.ranking / 100000) * 100000}
                          from={leetcodeStats.ranking}
                          direction="down"
                          duration={0.9}
                          separator=","
                        />
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3.5">
                    {DIFFICULTY.map(({ key, label, color }) => {
                      const count = leetcodeStats[key] || 0
                      const pct =
                        leetcodeStats.totalSolved > 0
                          ? Math.round((count / leetcodeStats.totalSolved) * 100)
                          : 0
                      return (
                        <div key={key} className="flex items-center gap-3">
                          <span className="w-14 shrink-0 text-xs text-muted">{label}</span>
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                            <div
                              className="h-full rounded-full transition-[width] duration-1000"
                              style={{ width: `${pct}%`, backgroundColor: color }}
                            />
                          </div>
                          <span className="w-14 shrink-0 text-right text-sm font-semibold text-fg">
                            <CountUp to={count} duration={0.4} />
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center">
                  <p className="text-sm text-muted">Loading signals…</p>
                </div>
              )}
            </div>
          </GlassSurface>
        </AnimatedContent>

        <AnimatedContent distance={40} delay={0.1} className="lg:col-span-1">
          <GlassSurface
            width="100%"
            height="100%"
            borderRadius={24}
            backgroundOpacity={0.12}
            brightness={35}
            blur={10}
            className="h-full p-6"
            style={{ width: '100%', minHeight: 264 }}
          >
            <div className="flex h-full w-full flex-col gap-6">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/10">
                  <PlatformIcon slug="github" alt="GitHub" />
                </span>
                <h3 className="font-display text-lg text-fg">{config.profiles.github.title}</h3>
              </div>
              {githubStats ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <StatTile value={githubStats.followers} label="Followers" />
                    <StatTile value={githubStats.following} label="Following" />
                    <div className="col-span-2">
                      <StatTile value={githubStats.publicRepos} label="Public Repos" />
                    </div>
                  </div>
                  <div className="mt-auto">
                    <ProfileLink href={config.profiles.github.profile}>View Profile</ProfileLink>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted">Loading signals…</p>
              )}
            </div>
          </GlassSurface>
        </AnimatedContent>

        <AnimatedContent distance={40} delay={0.2} className="lg:col-span-3">
          <GlassSurface
            width="100%"
            height="100%"
            borderRadius={24}
            backgroundOpacity={0.12}
            brightness={35}
            blur={10}
            className="h-full p-6"
            style={{ width: '100%', minHeight: 0 }}
          >
            <div className="flex w-full flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-400/15 ring-1 ring-sky-400/20">
                  <PlatformIcon slug="linkedin" alt="LinkedIn" />
                </span>
                <div>
                  <h3 className="font-display text-lg text-fg">{config.profiles.linkedin.title}</h3>
                  <p className="text-xs text-muted">Profile stats not available</p>
                </div>
              </div>
              <ProfileLink href={config.profiles.linkedin.profile}>Connect on LinkedIn</ProfileLink>
            </div>
          </GlassSurface>
        </AnimatedContent>
      </div>
    </section>
  )
}
