let scrolling = false
let idleTimer = 0
let locked = 0
const listeners = new Set()

function release() {
  if (locked > 0) return
  scrolling = false
  listeners.forEach((fn) => fn())
}

function onScroll() {
  if (!scrolling) {
    scrolling = true
    listeners.forEach((fn) => fn())
  }
  clearTimeout(idleTimer)
  idleTimer = setTimeout(release, 140)
}

export function isScrolling() {
  return scrolling
}

export function isAnimatable() {
  return !scrolling && !document.hidden
}

export function onGateChange(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function lockGate() {
  locked += 1
  if (scrolling) {
    scrolling = false
    listeners.forEach((fn) => fn())
  }
}

export function unlockGate() {
  locked = Math.max(0, locked - 1)
}

export function startScrollGate() {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('touchmove', onScroll, { passive: true })
  return () => {
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('touchmove', onScroll)
    clearTimeout(idleTimer)
  }
}
