import { useState, useEffect, useRef } from 'react'

const AnimatedTabBar = ({ items, onChange, selected = 0 }) => {
  const [activeIndex, setActiveIndex] = useState(selected)
  const barRef = useRef(null)
  const itemRefs = useRef([])
  const indicatorRef = useRef(null)

  useEffect(() => {
    if (selected !== activeIndex) setActiveIndex(selected)
  }, [selected, activeIndex])

  useEffect(() => {
    const bar = barRef.current
    const indicator = indicatorRef.current
    const el = itemRefs.current[activeIndex]
    if (!bar || !indicator || !el) return

    const move = () => {
      indicator.style.width = `${el.offsetWidth}px`
      indicator.style.transform = `translateX(${el.offsetLeft}px)`
    }
    move()

    window.addEventListener('resize', move)
    return () => window.removeEventListener('resize', move)
  }, [activeIndex, items])

  if (!items || !items.length) return null

  return (
    <div
      ref={barRef}
      className="relative flex w-full max-w-[min(100vw-1.5rem,32rem)] items-center rounded-full border border-white/10 bg-bg/40 p-1.5 shadow-lg backdrop-blur-xl"
    >
      <div
        ref={indicatorRef}
        className="absolute inset-y-1.5 left-0 rounded-full transition-all duration-500 ease-out"
        style={{ backgroundColor: items[activeIndex]?.color, opacity: 0.18 }}
      />
      {items.map((item, index) => (
        <button
          key={item.label || index}
          ref={(el) => {
            itemRefs.current[index] = el
          }}
          type="button"
          onClick={() => {
            setActiveIndex(index)
            onChange?.(index)
          }}
          className={`relative z-10 flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-full px-1 py-2 text-[10px] font-medium uppercase tracking-wide transition-colors duration-300 ${
            index === activeIndex ? 'text-fg' : 'text-muted hover:text-fg/70'
          }`}
        >
          <span
            className={`transition-transform duration-300 ${
              index === activeIndex ? 'scale-110' : 'scale-100'
            }`}
          >
            {item.icon}
          </span>
          <span className="max-w-full truncate leading-none">{item.label}</span>
        </button>
      ))}
    </div>
  )
}

export default AnimatedTabBar
