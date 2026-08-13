import { useEffect, useRef, useState } from 'react'
import { motion, useInView, useReducedMotion } from 'motion/react'
import GlassSurface from '@/components/GlassSurface'
import { HiPaperAirplane } from 'react-icons/hi2'
import { getAmaHealth, pollQuestion, postQuestion } from '@/services/contentApi'
import { useSound } from '@/context/SoundProvider'
import styles from './AskMeAnything.module.css'

const INITIAL_MESSAGE = {
  role: 'ai',
  text: "Hi! Ask me anything about Shubham, his projects, or tech. My AI brain is being wired up right now — answers will be live soon!",
}

const SUGGESTED_QUESTIONS = [
  'What did Shubham build at Jupiter?',
  'Tell me about Credit Builder',
  'What technologies does he use?',
  'Why is he moving into AI?',
  'What projects has Shubham built?',
  'Show engineering achievements',
]

function AskMeAnythingLegacy() {
  const [messages, setMessages] = useState([INITIAL_MESSAGE])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const scrollRef = useRef(null)
  const { playClick, unlock } = useSound()

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, thinking])

  const send = async () => {
    const text = input.trim()
    if (!text || thinking) return
    unlock()
    playClick()
    setMessages((m) => [...m, { role: 'user', text }])
    setInput('')
    setThinking(true)

    let answer = ''
    try {
      const data = await postQuestion(text)
      answer = data?.answer || ''
      if (!answer && data?.message) answer = data.message
    } catch {}

    setMessages((m) => [
      ...m,
      {
        role: 'ai',
        text: answer || "I'm still being wired up — my AI brain is coming soon. Meanwhile, reach out through the contact form above!",
      },
    ])
    setThinking(false)
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <GlassSurface
      width="100%"
      height="auto"
      borderRadius={24}
      backgroundOpacity={0.14}
      brightness={40}
      blur={12}
      opacity={0.92}
      className="p-5"
      style={{ width: '100%' }}
    >
      <div className="flex items-center gap-2.5">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>
        <h4 className="font-display text-lg text-fg">Ask Me Anything</h4>
        <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wider text-dim">
          Powered by AI
        </span>
      </div>

      <div ref={scrollRef} className={`mt-4 flex flex-col gap-3 overflow-x-hidden ${styles.messages}`}>
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] break-words rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'rounded-br-md bg-white/10 text-fg'
                  : 'rounded-bl-md bg-white/[0.06] text-muted'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {thinking && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md bg-white/[0.06] px-3.5 py-3">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-dim [animation-delay:0ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-dim [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-dim [animation-delay:300ms]" />
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask me anything..."
          className="flex-1 rounded-xl border border-border bg-black/40 px-4 py-2.5 text-sm text-fg outline-none placeholder:text-dim focus:border-white/40"
        />
        <button
          type="button"
          onClick={send}
          disabled={thinking || !input.trim()}
          aria-label="Send"
          className="cursor-target flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-white/[0.06] text-fg transition-colors hover:border-fg/50 disabled:opacity-40"
        >
          <HiPaperAirplane className="h-4 w-4" />
        </button>
      </div>
    </GlassSurface>
  )
}

function AskMeAnythingV2() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [providersAvailable, setProvidersAvailable] = useState(true)
  const scrollRef = useRef(null)
  const containerRef = useRef(null)
  const { playClick, unlock } = useSound()
  const inView = useInView(containerRef, { once: true, amount: 0.3 })
  const shouldReduce = useReducedMotion()

  useEffect(() => {
    if (messages.length > 0) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    }
  }, [messages, thinking])

  useEffect(() => {
    let cancelled = false
    getAmaHealth().then((health) => {
      if (!cancelled) setProvidersAvailable(health.available)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const send = async () => {
    const text = input.trim()
    if (!text || thinking) return
    unlock()
    playClick()
    setMessages((m) => [...m, { role: 'user', text }])
    setInput('')
    setThinking(true)

    let answer = ''
    try {
      const data = await postQuestion(text)
      if (data.answered && data.answer) {
        answer = data.answer
      } else if (data.reference) {
        const published = await pollQuestion(data.reference)
        if (published.status === 'PUBLISHED' && published.answer) {
          answer = published.answer
        } else if (published.status === 'REJECTED') {
          answer = "That question was declined. Feel free to try another!"
        } else {
          answer = data.message || "Your question is queued and will be answered soon."
        }
      } else {
        answer = data.message || ''
      }
    } catch (err) {
      answer = err?.code || err?.message || 'Something went wrong. Please try again.'
    }

    setMessages((m) => [
      ...m,
      {
        role: 'ai',
        text: answer || "I'm still being wired up — my AI brain is coming soon. Meanwhile, reach out through the contact form above!",
      },
    ])
    setThinking(false)
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const setQuestion = (q) => {
    setInput(q)
    playClick()
  }

  const canSend = input.trim().length > 0 && !thinking

  const enter = shouldReduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
  const visible = shouldReduce ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }

  return (
    <motion.div
      ref={containerRef}
      initial={enter}
      animate={inView ? visible : enter}
      transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
      className="relative w-full"
    >
      <div className="relative flex flex-col gap-4 overflow-hidden rounded-[24px] border border-border bg-black/40 p-5 backdrop-blur-xl">
        <div className={styles['grid-bg']} aria-hidden="true" />

        <header className="relative z-10 flex items-center gap-2.5">
          <span className={styles.statusDot} aria-label="Online" role="status" />
          <h3 className="font-display text-lg font-medium text-fg">Ask Shubham AI</h3>
        </header>

        <p className="relative z-10 font-body text-sm text-muted">
          Trained on my projects, experience, skills and engineering work.
          {providersAvailable
            ? ' Answers are generated in real time.'
            : ' Answers may be delayed — questions are queued for review.'}
        </p>

        <div ref={scrollRef} className={`relative z-10 flex flex-col gap-3 ${styles.conversation}`}>
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'ai' && <span className="text-fg/40">●</span>}
              <div
                className={`max-w-[80%] break-words rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'rounded-br-md bg-white/10 text-fg'
                    : 'rounded-bl-md bg-white/[0.04] text-muted'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {thinking && (
            <div className="flex gap-2 justify-start">
              <span className="text-fg/40">●</span>
              <div className="rounded-2xl rounded-bl-md bg-white/[0.04] px-3.5 py-3">
                <div className="flex items-center gap-1">
                  <span className="h-1 w-1 animate-bounce rounded-full bg-dim [animation-delay:0ms]" />
                  <span className="h-1 w-1 animate-bounce rounded-full bg-dim [animation-delay:150ms]" />
                  <span className="h-1 w-1 animate-bounce rounded-full bg-dim [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
        </div>

        {messages.length === 0 && !thinking && (
          <div className="relative z-10">
            <p className="mb-2 font-display text-xs uppercase tracking-wider text-dim">
              Suggested Questions
            </p>
            <div className={styles.chips}>
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setQuestion(q)}
                  aria-label={`Ask: ${q}`}
                  className="cursor-target rounded-full border border-border bg-white/[0.035] px-3.5 py-2 text-left text-xs text-muted transition-all duration-200 hover:border-border hover:bg-white/[0.08] hover:text-fg focus-visible:outline-2 focus-visible:outline-[length:2px] focus-visible:outline-offset-2 focus-visible:outline-fg"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="relative z-10 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask me anything..."
            aria-label="Ask Shubham AI a question"
            autoComplete="off"
            className="flex-1 rounded-xl border border-border bg-black/40 px-4 py-3 text-sm text-fg outline-none placeholder:text-dim focus:border-white/40 focus:ring-1 focus:ring-fg/20"
          />
          <button
            type="button"
            onClick={send}
            disabled={!canSend}
            aria-label="Send question"
            className="cursor-target shrink-0 rounded-xl border border-border bg-white/[0.06] p-3 text-fg transition-all duration-200 hover:border-fg/50 hover:bg-white/[0.12] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-[length:2px] focus-visible:outline-offset-2 focus-visible:outline-fg"
          >
            <HiPaperAirplane className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default function AskMeAnything({ aiAssistantV2 = false }) {
  if (!aiAssistantV2) return <AskMeAnythingLegacy />
  return <AskMeAnythingV2 />
}
