const images = new Map()
const pending = new Map()
const MAX_ENTRIES = 120

function loadImage(url) {
  if (!url) return Promise.resolve(null)
  if (images.has(url)) return Promise.resolve(images.get(url))
  if (pending.has(url)) return pending.get(url)

  const promise = new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.decoding = 'async'
    img.onload = () => {
      images.set(url, img)
      trim()
      resolve(img)
    }
    img.onerror = () => resolve(null)
    img.src = url
  }).finally(() => {
    pending.delete(url)
  })

  pending.set(url, promise)
  return promise
}

function trim() {
  while (images.size > MAX_ENTRIES) {
    const oldest = images.keys().next().value
    images.delete(oldest)
  }
}

export function getCachedImage(url) {
  return images.get(url) || null
}

export function preloadImages(urls) {
  const unique = [...new Set(urls.filter(Boolean))]
  return Promise.all(unique.map(loadImage))
}

export default loadImage
