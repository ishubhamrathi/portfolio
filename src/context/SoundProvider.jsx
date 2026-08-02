import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Howl } from 'howler'

const SoundContext = createContext(null)

function createToneDataUri(frequency, duration = 0.08, type = 'sine', volume = 0.25) {
  const sampleRate = 22050
  const samples = Math.floor(sampleRate * duration)
  const data = new Float32Array(samples)
  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate
    const env = Math.exp(-8 * t)
    let sample = 0
    if (type === 'sine') sample = Math.sin(2 * Math.PI * frequency * t)
    else if (type === 'triangle') {
      sample = 2 * Math.abs(2 * ((frequency * t) % 1) - 1) - 1
    } else {
      sample = (Math.random() * 2 - 1) * 0.4
    }
    data[i] = sample * env * volume
  }

  const buffer = new ArrayBuffer(44 + samples * 2)
  const view = new DataView(buffer)
  const writeStr = (offset, str) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i))
  }
  writeStr(0, 'RIFF')
  view.setUint32(4, 36 + samples * 2, true)
  writeStr(8, 'WAVE')
  writeStr(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeStr(36, 'data')
  view.setUint32(40, samples * 2, true)
  let offset = 44
  for (let i = 0; i < samples; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, data[i]))
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
  }
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return `data:audio/wav;base64,${btoa(binary)}`
}

export function SoundProvider({ children }) {
  const [muted, setMuted] = useState(true)
  const [volume, setVolume] = useState(0.35)
  const [unlocked, setUnlocked] = useState(false)
  const ambientRef = useRef(null)
  const sfxRef = useRef({})

  useEffect(() => {
    sfxRef.current = {
      hover: new Howl({ src: [createToneDataUri(880, 0.05, 'sine', 0.15)], volume: 0.2 }),
      click: new Howl({ src: [createToneDataUri(520, 0.09, 'triangle', 0.28)], volume: 0.35 }),
      nav: new Howl({ src: [createToneDataUri(360, 0.12, 'sine', 0.22)], volume: 0.3 }),
      success: new Howl({ src: [createToneDataUri(660, 0.18, 'sine', 0.3)], volume: 0.4 }),
      section: new Howl({ src: [createToneDataUri(240, 0.15, 'triangle', 0.2)], volume: 0.25 }),
    }

    // Prefer optional file; fall back to soft low drone data URI
    ambientRef.current = new Howl({
      src: ['/audio/ambient.mp3', createToneDataUri(110, 2.5, 'sine', 0.08)],
      loop: true,
      volume: 0.15,
      html5: true,
    })

    return () => {
      Object.values(sfxRef.current).forEach((h) => h.unload())
      ambientRef.current?.unload()
    }
  }, [])

  useEffect(() => {
    const ambient = ambientRef.current
    if (!ambient) return
    ambient.volume(muted ? 0 : volume * 0.45)
    Object.values(sfxRef.current).forEach((h) => {
      h.mute(muted)
    })
    if (!muted && unlocked) {
      if (!ambient.playing()) ambient.play()
    } else {
      ambient.pause()
    }
  }, [muted, volume, unlocked])

  const unlock = useCallback(() => {
    setUnlocked(true)
  }, [])

  const play = useCallback(
    (name) => {
      if (muted || !unlocked) return
      sfxRef.current[name]?.play()
    },
    [muted, unlocked]
  )

  const toggleMute = useCallback(() => {
    setUnlocked(true)
    setMuted((m) => !m)
  }, [])

  const value = useMemo(
    () => ({
      muted,
      volume,
      unlocked,
      setVolume,
      toggleMute,
      unlock,
      play,
      playHover: () => play('hover'),
      playClick: () => play('click'),
      playNav: () => play('nav'),
      playSuccess: () => play('success'),
      playSection: () => play('section'),
    }),
    [muted, volume, unlocked, toggleMute, unlock, play]
  )

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>
}

export function useSound() {
  const ctx = useContext(SoundContext)
  if (!ctx) throw new Error('useSound must be used within SoundProvider')
  return ctx
}
