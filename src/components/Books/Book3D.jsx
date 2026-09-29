import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import {
  CanvasTexture,
  ClampToEdgeWrapping,
  LinearFilter,
  LinearMipmapLinearFilter,
  MeshPhysicalMaterial,
  NoColorSpace,
  RepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
} from 'three'
import { useSound } from '@/context/SoundProvider'

export const BOOK_WIDTH = 1.6
export const BOOK_HEIGHT = 2.3
export const BOOK_DEPTH = 0.35

const COVER_WIDTH = 768
const COVER_HEIGHT = 1056
const SPINE_WIDTH = 256
const SPINE_HEIGHT = 1024
const PAGE_SIZE = 512
const PAGE_BASE = '#F3EFE6'

let sharedPageTexture = null

function tuneTexture(texture, maxAnisotropy) {
  texture.colorSpace = SRGBColorSpace
  texture.generateMipmaps = true
  texture.minFilter = LinearMipmapLinearFilter
  texture.magFilter = LinearFilter
  texture.wrapS = ClampToEdgeWrapping
  texture.wrapT = ClampToEdgeWrapping
  texture.anisotropy = Math.min(16, maxAnisotropy || 1)
  texture.needsUpdate = true
  return texture
}

// BoxGeometry +X face UVs run u along height and v along depth, so page lines
// must be drawn vertically here. Drawing them horizontally (as the old map did)
// produced lines running the wrong way across the fore-edge and top face.
function makePageTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = PAGE_SIZE
  canvas.height = PAGE_SIZE
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = PAGE_BASE
  ctx.fillRect(0, 0, PAGE_SIZE, PAGE_SIZE)

  for (let x = 0; x < PAGE_SIZE; x += 3) {
    const shade = 236 + Math.sin(x * 1.1) * 7
    ctx.fillStyle = `rgb(${Math.round(shade)}, ${Math.round(shade - 7)}, ${Math.round(shade - 19)})`
    ctx.fillRect(x, 0, 1.5, PAGE_SIZE)
  }

  // Gutter darkening along the spine side (u = 0) reads as the shadowed
  // inner margin where the pages curve into the binding.
  const gutter = ctx.createLinearGradient(0, 0, PAGE_SIZE * 0.22, 0)
  gutter.addColorStop(0, 'rgba(0, 0, 0, 0.20)')
  gutter.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = gutter
  ctx.fillRect(0, 0, PAGE_SIZE, PAGE_SIZE)

  return canvas
}

function getSharedPageTexture(maxAnisotropy) {
  if (sharedPageTexture) return sharedPageTexture
  sharedPageTexture = tuneTexture(new CanvasTexture(makePageTexture()), maxAnisotropy)
  return sharedPageTexture
}

let sharedPageBump = null

// Grayscale height field: each page edge is a hard step with a rounded crown,
// so grazing light picks out individual sheets instead of a flat cream block.
function makePageBumpTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = PAGE_SIZE
  canvas.height = PAGE_SIZE
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#6a6a6a'
  ctx.fillRect(0, 0, PAGE_SIZE, PAGE_SIZE)

  for (let x = 0; x < PAGE_SIZE; x += 3) {
    const grad = ctx.createLinearGradient(x, 0, x + 3, 0)
    grad.addColorStop(0, '#3a3a3a')
    grad.addColorStop(0.5, '#e8e8e8')
    grad.addColorStop(1, '#3a3a3a')
    ctx.fillStyle = grad
    ctx.fillRect(x, 0, 3, PAGE_SIZE)
  }

  return canvas
}

function getSharedPageBump() {
  if (sharedPageBump) return sharedPageBump
  const texture = new CanvasTexture(makePageBumpTexture())
  // Height data must not be sRGB-decoded or the steps flatten out.
  texture.colorSpace = NoColorSpace
  texture.wrapS = ClampToEdgeWrapping
  texture.wrapT = ClampToEdgeWrapping
  texture.minFilter = LinearMipmapLinearFilter
  texture.magFilter = LinearFilter
  texture.generateMipmaps = true
  sharedPageBump = texture
  return sharedPageBump
}

// Deterministic value noise, shared by every generated map so the grain on the
// cover, the wear on the edges and the waviness all agree with each other.
function valueNoise(seed) {
  const hash = (x, y) => {
    const n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453
    return n - Math.floor(n)
  }
  return (x, y, freq) => {
    const fx = x * freq
    const fy = y * freq
    const x0 = Math.floor(fx)
    const y0 = Math.floor(fy)
    const tx = fx - x0
    const ty = fy - y0
    const sx = tx * tx * (3 - 2 * tx)
    const sy = ty * ty * (3 - 2 * ty)
    const a = hash(x0, y0)
    const b = hash(x0 + 1, y0)
    const c = hash(x0, y0 + 1)
    const d = hash(x0 + 1, y0 + 1)
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy
  }
}

// Binding types. Base roughness is shared across all of them (see
// COVER_BASE_ROUGHNESS) so dark artwork keeps its blacks; what separates a
// hardcover from a gloss binding is the clearcoat film and the grain, not a
// different base roughness. Clearcoat is a separate specular lobe, so raising
// it adds a surface highlight without lifting the diffuse layer.
const BINDINGS = {
  hardcover: {
    roughSwing: 0.07,
    clearcoat: 0.06,
    clearcoatRoughness: 0.55,
    bumpScale: 0.055,
    grainRepeat: [5, 7],
    grainStrength: 0.5,
    wear: 0.5,
  },
  paperback: {
    roughSwing: 0.08,
    clearcoat: 0.14,
    clearcoatRoughness: 0.42,
    bumpScale: 0.03,
    grainRepeat: [8, 11],
    grainStrength: 0.3,
    wear: 0.34,
  },
  gloss: {
    roughSwing: 0.055,
    clearcoat: 0.34,
    clearcoatRoughness: 0.16,
    bumpScale: 0.016,
    grainRepeat: [11, 15],
    grainStrength: 0.16,
    wear: 0.22,
  },
}

const BINDING_KEYS = Object.keys(BINDINGS)

// No binding field comes from the API, so it is derived from genre where the
// genre implies one and otherwise falls back to a stable hash of the id. The
// same book always gets the same finish.
function deriveBinding(book) {
  const text = `${book?.genre || ''} ${book?.category || ''}`.toLowerCase()
  if (/gloss|luxury|collector|coffee.?table|art/.test(text)) return 'gloss'
  if (/paperback|thriller|novel|romance|fantasy|sci.?fi/.test(text)) return 'paperback'
  if (/hardcover|academic|textbook|cookbook|business|non.?fiction/.test(text)) return 'hardcover'

  const key = String(book?.id || book?.title || '')
  let seed = 0
  for (let i = 0; i < key.length; i++) seed = (seed * 31 + key.charCodeAt(i)) >>> 0
  return BINDING_KEYS[seed % BINDING_KEYS.length]
}

// Height field per finish: a woven cloth grid, a fine paper grain, or the soft
// orange-peel of a laminate, each with a low-frequency waviness layer so the
// cover is never geometrically flat.
function makeGrainTexture(binding, seed) {
  const spec = BINDINGS[binding]
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const image = ctx.createImageData(size, size)
  const data = image.data
  const noise = valueNoise(seed % 97)

  const threads = binding === 'hardcover' ? 44 : 0

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size
      const v = y / size
      let h = 0

      if (threads) {
        const warp = Math.sin(u * Math.PI * 2 * threads) * 0.5 + 0.5
        const weft = Math.sin(v * Math.PI * 2 * threads) * 0.5 + 0.5
        h += (warp * 0.5 + weft * 0.5) * spec.grainStrength
      }

      // Fine paper fibre / laminate tooth.
      h += (noise(u, v, 64) * 0.55 + noise(u, v, 128) * 0.45) * spec.grainStrength * 0.6

      // Board waviness: broad, very low amplitude, so highlights bend across
      // the cover instead of reflecting as one clean sheet.
      h += (noise(u, v, 3) - 0.5) * 0.22

      const val = Math.round(128 + (h - 0.35) * 150)
      const i = (y * size + x) * 4
      data[i] = val
      data[i + 1] = val
      data[i + 2] = val
      data[i + 3] = 255
    }
  }

  ctx.putImageData(image, 0, 0)
  return canvas
}

const grainCache = new Map()

function getGrainTexture(binding, seed) {
  const key = `${binding}:${seed % 97}`
  if (grainCache.has(key)) return grainCache.get(key)
  const texture = new CanvasTexture(makeGrainTexture(binding, seed))
  texture.colorSpace = NoColorSpace
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  texture.minFilter = LinearMipmapLinearFilter
  texture.magFilter = LinearFilter
  texture.generateMipmaps = true
  texture.repeat.set(BINDINGS[binding].grainRepeat[0], BINDINGS[binding].grainRepeat[1])
  grainCache.set(key, texture)
  return texture
}

function makeSpineTexture(book, maxAnisotropy) {
  const canvas = document.createElement('canvas')
  canvas.width = SPINE_WIDTH
  canvas.height = SPINE_HEIGHT
  const ctx = canvas.getContext('2d')
  const W = SPINE_WIDTH
  const H = SPINE_HEIGHT

  const baseColor = book.spineColor || '#2A1D17'
  ctx.fillStyle = baseColor
  ctx.fillRect(0, 0, W, H)

  const pad = W * 0.14

  ctx.fillStyle = 'rgba(234, 179, 8, 0.5)'
  ctx.fillRect(pad, H * 0.035, W - pad * 2, 7)
  ctx.fillRect(pad, H * 0.055, W - pad * 2, 3)
  ctx.fillRect(pad, H * 0.945, W - pad * 2, 3)
  ctx.fillRect(pad, H * 0.960, W - pad * 2, 7)

  const edgeGrad = ctx.createLinearGradient(0, 0, W, 0)
  edgeGrad.addColorStop(0, 'rgba(255, 255, 255, 0.16)')
  edgeGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0)')
  edgeGrad.addColorStop(1, 'rgba(0, 0, 0, 0.32)')
  ctx.fillStyle = edgeGrad
  ctx.fillRect(0, 0, W, H)

  ctx.save()
  ctx.translate(W / 2, H / 2)
  ctx.rotate(Math.PI / 2)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const title = (book.title || 'Untitled').toUpperCase()
  const titleSize = 44
  ctx.font = `bold ${titleSize}px system-ui, sans-serif`
  let shortTitle = title
  if (ctx.measureText(shortTitle).width > H * 0.86) {
    while (shortTitle.length > 2 && ctx.measureText(shortTitle + '…').width > H * 0.86) {
      shortTitle = shortTitle.slice(0, -1)
    }
    shortTitle += '…'
  }

  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)'
  ctx.shadowBlur = 6
  ctx.fillStyle = '#ffffff'
  ctx.fillText(shortTitle, 0, -22, H * 0.86)
  ctx.shadowBlur = 0

  const author = book.author || ''
  if (author) {
    const authorSize = 30
    ctx.font = `${authorSize}px system-ui, sans-serif`
    let shortAuthor = author
    if (ctx.measureText(shortAuthor).width > H * 0.86) {
      while (shortAuthor.length > 2 && ctx.measureText(shortAuthor + '…').width > H * 0.86) {
        shortAuthor = shortAuthor.slice(0, -1)
      }
      shortAuthor += '…'
    }
    ctx.fillStyle = 'rgba(255, 255, 255, 0.82)'
    ctx.fillText(shortAuthor, 0, 28, H * 0.86)
  }
  ctx.restore()

  return tuneTexture(new CanvasTexture(canvas), maxAnisotropy)
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 4) {
  const words = text.split(' ')
  let line = ''
  let lines = []

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' '
    const metrics = ctx.measureText(testLine)
    if (metrics.width > maxWidth && n > 0) {
      lines.push(line.trim())
      line = words[n] + ' '
    } else {
      line = testLine
    }
  }
  lines.push(line.trim())

  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines)
    lines[maxLines - 1] += '…'
  }

  lines.forEach((l, i) => {
    ctx.fillText(l, x, y + i * lineHeight)
  })
}

function makeFallbackCoverTexture(book, maxAnisotropy) {
  const canvas = document.createElement('canvas')
  canvas.width = COVER_WIDTH
  canvas.height = COVER_HEIGHT
  const ctx = canvas.getContext('2d')
  const W = COVER_WIDTH
  const H = COVER_HEIGHT

  const color = book.spineColor || '#2A1D17'
  const grad = ctx.createLinearGradient(0, 0, W, H)
  grad.addColorStop(0, color)
  grad.addColorStop(1, '#0B0F17')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)

  ctx.strokeStyle = 'rgba(234, 179, 8, 0.4)'
  ctx.lineWidth = 4
  ctx.strokeRect(38, 38, W - 76, H - 76)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)'
  ctx.lineWidth = 1.6
  ctx.strokeRect(50, 50, W - 100, H - 100)

  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)'
  ctx.beginPath()
  ctx.arc(W / 2, 252, 70, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = 'rgba(234, 179, 8, 0.85)'
  ctx.font = '50px serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('✦', W / 2, 252)

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 50px system-ui, sans-serif'
  wrapText(ctx, (book.title || 'Untitled').toUpperCase(), W / 2, 390, W - 160, 62, 3)

  if (book.author) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.82)'
    ctx.font = '28px system-ui, sans-serif'
    ctx.fillText(`by ${book.author}`, W / 2, 780, W - 160)
  }

  const tag = book.genre || book.category
  if (tag) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.14)'
    ctx.beginPath()
    ctx.roundRect(252, 862, 264, 46, 23)
    ctx.fill()
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)'
    ctx.font = 'bold 18px system-ui, sans-serif'
    ctx.fillText(tag.toUpperCase(), W / 2, 888)
  }

  return tuneTexture(new CanvasTexture(canvas), maxAnisotropy)
}

const coverTextureCache = new Map()
const fallbackCoverCache = new Map()
const spineCache = new Map()
const foilMaskCache = new Map()

// Stamped foil is warm and desaturated-bright relative to the cloth around it,
// so a hue/luma test isolates the title from the background.
//
// metalnessMap, roughnessMap, clearcoatMap and clearcoatRoughnessMap are all
// multiplicative and all read the same green channel, so they need different
// polarity and scaling per map: foil must be metallic (high metalness) yet
// glossy (low roughness, low clearcoatRoughness), while the cloth around it
// stays matte. One mask cannot serve all four, hence the set.
// The cover board is a printed dielectric: no metalness, and a roughness high
// enough that light spreads across the artwork instead of lifting the blacks.
// Any gloss comes from the clearcoat pair, which is a separate specular lobe and
// does not wash the diffuse layer the way low roughness does.
const COVER_BASE_ROUGHNESS = 0.65
const CLOTH_METALNESS = 0.0
const FOIL_METALNESS = 0.8
const FOIL_ROUGHNESS = 0.25
const FOIL_CLEARCOAT = 0.3
const FOIL_CLEARCOAT_ROUGHNESS = 0.1

// Ceiling for the clearcoatRoughness map. Values above this would be
// unreachable through the map, so the material scalar sits here and the map
// expresses everything below it.
const CLEARCOAT_ROUGHNESS_CEILING = 0.5

function buildFoilMasks(texture, binding, seed) {
  const source = texture?.image
  if (!source || !source.width || !source.height) return null

  const w = 256
  const h = Math.max(1, Math.round((w * source.height) / source.width))

  const make = () => {
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    return canvas
  }

  const channels = {
    metalnessMap: make(),
    roughnessMap: make(),
    clearcoatMap: make(),
    clearcoatRoughnessMap: make(),
  }
  const contexts = {}
  const pixels = {}
  for (const [name, canvas] of Object.entries(channels)) {
    contexts[name] = canvas.getContext('2d')
    pixels[name] = contexts[name].createImageData(w, h).data
  }

  // Read the cover once; the sampled pixels drive all four masks.
  const probe = contexts.metalnessMap
  probe.drawImage(source, 0, 0, w, h)

  let sampled
  try {
    sampled = probe.getImageData(0, 0, w, h)
  } catch {
    // Canvas is tainted by a cross-origin cover without CORS headers.
    return null
  }

  const write = (name, fn) => {
    const target = pixels[name]
    for (let i = 0; i < target.length; i += 4) {
      const val = Math.round(255 * Math.min(1, Math.max(0, fn(sampled.data, i))))
      target[i] = val
      target[i + 1] = val
      target[i + 2] = val
      target[i + 3] = 255
    }
    contexts[name].putImageData(new ImageData(target, w, h), 0, 0)
  }

  const foilStrength = (d, i) => {
    const r = d[i]
    const g = d[i + 1]
    const b = d[i + 2]
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const luma = (r * 0.299 + g * 0.587 + b * 0.114) / 255
    const sat = max === 0 ? 0 : (max - min) / max
    const warm = r >= b
    const isFoil = luma > 0.42 && warm && (sat > 0.18 || (luma > 0.72 && sat < 0.18))
    return isFoil ? Math.min(1, sat * 1.6) : 0
  }

  const spec = BINDINGS[binding]
  const noise = valueNoise((seed % 89) + 1)

  // Distance to the nearest cover edge, normalised, drives the wear ring: the
  // corners and spine edge of a handled book are rubbed smoother and lighter.
  const edgeDistance = (px, py) => {
    const dx = Math.min(px, 1 - px)
    const dy = Math.min(py, 1 - py)
    return Math.min(1, Math.min(dx * 2.6, dy * 3.4))
  }

  // Cover wear is signed: a band of rubbed-smooth (lower roughness) right at the
  // edge, scuffs and dulling (higher roughness) just inside it, then the
  // per-pixel grain. This is what stops the surface reading as one clean sheet.
  // Signed variation around the binding's base roughness. The worn band pulls
  // down (rubbed smooth) and the scuff band pushes up, but the total excursion
  // is clamped to the binding's own range so the finish never drifts out of
  // spec at the corners, which are where the distance field saturates.
  const wearVariation = (u, v) => {
    const e = edgeDistance(u, v)
    const rub = Math.max(0, 1 - e * 3.4) * spec.wear
    const scuff = Math.max(0, 1 - Math.abs(e - 0.16) * 5) * spec.wear * 0.55
    const grain = (noise(u, v, 96) - 0.5) * 0.1 + (noise(u, v, 12) - 0.5) * 0.07
    const raw = rub * 0.3 + scuff * 0.22 + grain
    return Math.max(-spec.roughSwing, Math.min(spec.roughSwing, raw))
  }

  const px = (i) => (i % (w * 4)) / w
  const py = (i) => Math.floor(i / (w * 4)) / h

  // The material scalar carries the board's 0.65 roughness, so the roughness
  // map is a multiplier around it rather than an absolute value. That keeps the
  // 0.65 target readable in the material while the map still adds per-pixel
  // variation and drops the stamped foil to a polished 0.25.
  write(
    'metalnessMap',
    (d, i) => (CLOTH_METALNESS + (FOIL_METALNESS - CLOTH_METALNESS) * foilStrength(d, i)) / FOIL_METALNESS
  )
  write('roughnessMap', (d, i) => {
    const s = foilStrength(d, i)
    if (s > 0.15) return FOIL_ROUGHNESS / COVER_BASE_ROUGHNESS
    const varied = Math.max(-spec.roughSwing, Math.min(spec.roughSwing, wearVariation(px(i), py(i))))
    return Math.max(0.2, Math.min(1, 1 + varied))
  })
  write('clearcoatMap', (d, i) => {
    const s = foilStrength(d, i)
    // Lamination film is continuous, so the base clearcoat survives; only the
    // rubbed edge loses its film.
    const e = edgeDistance(px(i), py(i))
    const film = spec.clearcoat * (1 - Math.max(0, 1 - e * 2.2) * spec.wear * 0.8)
    return Math.max(s * FOIL_CLEARCOAT, film) / FOIL_CLEARCOAT
  })
  write('clearcoatRoughnessMap', (d, i) => {
    const s = foilStrength(d, i)
    if (s > 0.15) {
      return (
        (CLEARCOAT_ROUGHNESS_CEILING +
          (FOIL_CLEARCOAT_ROUGHNESS - CLEARCOAT_ROUGHNESS_CEILING) * s) /
        CLEARCOAT_ROUGHNESS_CEILING
      )
    }
    // Uneven film: the wear band scatters more than the intact centre.
    const e = edgeDistance(px(i), py(i))
    const scuff = Math.max(0, 1 - e * 2.2) * spec.wear
    return Math.min(1, (spec.clearcoatRoughness + scuff * 0.3) / CLEARCOAT_ROUGHNESS_CEILING)
  })

  const prep = (canvas) => {
    const t = new CanvasTexture(canvas)
    t.colorSpace = NoColorSpace
    t.wrapS = ClampToEdgeWrapping
    t.wrapT = ClampToEdgeWrapping
    t.minFilter = LinearMipmapLinearFilter
    t.magFilter = LinearFilter
    t.generateMipmaps = true
    return t
  }

  const out = {}
  for (const [name, canvas] of Object.entries(channels)) out[name] = prep(canvas)
  return out
}

function getFoilMasks(texture, binding, seed) {
  if (!texture) return null
  const key = `${texture.uuid}:${binding}:${seed % 89}`
  if (foilMaskCache.has(key)) return foilMaskCache.get(key)
  const masks = buildFoilMasks(texture, binding, seed)
  foilMaskCache.set(key, masks)
  return masks
}

function getCachedTexture(cache, book, make, maxAnisotropy) {
  const key = `${book.id || ''}|${book.title}|${book.author}|${book.spineColor}|${book.genre || book.category || ''}`
  const cached = cache.get(key)
  if (cached) {
    tuneTexture(cached, maxAnisotropy)
    return cached
  }
  const texture = make(book)
  cache.set(key, texture)
  return texture
}

function useCoverTexture(url, maxAnisotropy) {
  const [texture, setTexture] = useState(() =>
    url ? coverTextureCache.get(url) || null : null
  )

  useEffect(() => {
    if (!url) {
      setTexture(null)
      return undefined
    }

    const cached = coverTextureCache.get(url)
    if (cached) {
      tuneTexture(cached, maxAnisotropy)
      setTexture(cached)
      return undefined
    }

    let active = true
    let created = null
    const loader = new TextureLoader()
    loader.setCrossOrigin('anonymous')
    loader.load(
      url,
      (loaded) => {
        if (!active) {
          loaded.dispose()
          return
        }
        created = tuneTexture(loaded, maxAnisotropy)
        coverTextureCache.set(url, created)
        setTexture(created)
      },
      undefined,
      () => {
        if (active) setTexture(null)
      }
    )
    return () => {
      active = false
    }
  }, [url, maxAnisotropy])

  return texture
}

export default function Book3D({
  book,
  position = [0, 0, 0],
  isMobile = false,
  onClick,
}) {
  const groupRef = useRef()
  const glowRef = useRef()
  const [hovered, setHovered] = useState(false)
  const { playHover, playClick } = useSound()
  const gl = useThree((state) => state.gl)
  const maxAnisotropy = useMemo(
    () => gl.capabilities.getMaxAnisotropy(),
    [gl]
  )

  const coverTexture = useCoverTexture(book.coverUrl, maxAnisotropy)
  const bookSeed = useMemo(() => {
    const key = String(book.id || book.title || '')
    let acc = 0
    for (let i = 0; i < key.length; i++) acc = (acc * 31 + key.charCodeAt(i)) >>> 0
    return acc
  }, [book.id, book.title])
  const fallbackCoverTexture = useMemo(
    () => getCachedTexture(fallbackCoverCache, book, (b) => makeFallbackCoverTexture(b, maxAnisotropy), maxAnisotropy),
    [book, maxAnisotropy]
  )
  const spineTexture = useMemo(
    () => getCachedTexture(spineCache, book, (b) => makeSpineTexture(b, maxAnisotropy), maxAnisotropy),
    [book, maxAnisotropy]
  )
  const pageTexture = useMemo(() => getSharedPageTexture(maxAnisotropy), [])

  // Default angle: 25° (Math.PI / 7) showing ~75-80% cover
  // Hover: 0° (flat), lifted and pulled forward
  useFrame((state, delta) => {
    if (!groupRef.current) return

    const slotX = position[0]
    const slotY = position[1]
    const slotZ = position[2]

    const isHoverActive = hovered
    const targetHoverY = isHoverActive ? 0.1 : 0
    const targetHoverZ = isHoverActive ? 0.3 : 0
    const targetHoverRotY = isHoverActive ? 0 : Math.PI / 7

    const factor = 1 - Math.exp(-12 * delta)
    const targetScale = isHoverActive ? 1.05 : 1.0

    groupRef.current.position.x += (slotX - groupRef.current.position.x) * factor
    groupRef.current.position.y += (slotY + targetHoverY - groupRef.current.position.y) * factor
    groupRef.current.position.z += (slotZ + targetHoverZ - groupRef.current.position.z) * factor
    groupRef.current.rotation.x += (-0.04 - groupRef.current.rotation.x) * factor
    groupRef.current.rotation.y += (targetHoverRotY - groupRef.current.rotation.y) * factor
    groupRef.current.rotation.z += (0 - groupRef.current.rotation.z) * factor
    groupRef.current.scale.setScalar(
      groupRef.current.scale.x + (targetScale - groupRef.current.scale.x) * factor
    )

    if (glowRef.current) {
      // Fade rather than snap, and ride along with the book so the highlight
      // stays anchored to the cover as it lifts and tilts.
      const target = isHoverActive ? 1.5 : 0
      glowRef.current.intensity += (target - glowRef.current.intensity) * factor
      glowRef.current.position.set(
        groupRef.current.position.x,
        groupRef.current.position.y,
        groupRef.current.position.z + 1.1
      )
    }
  })

  const handlePointerOver = (event) => {
    event.stopPropagation()
    setHovered(true)
    document.body.style.cursor = 'pointer'
    playHover()
  }

  const handlePointerOut = () => {
    setHovered(false)
    document.body.style.cursor = ''
  }

  const handleClick = (event) => {
    event.stopPropagation()
    playClick()
    if (onClick) onClick(book)
  }

  const spineColor = book.spineColor || '#1E1B18'
  const coverMap = coverTexture || fallbackCoverTexture
  const binding = useMemo(() => deriveBinding(book), [book])
  const grainMap = useMemo(() => getGrainTexture(binding, bookSeed), [binding, bookSeed])
  const pageBump = useMemo(() => getSharedPageBump(), [])
  const foilMasks = useMemo(
    () => getFoilMasks(coverMap, binding, bookSeed),
    [coverMap, binding, bookSeed]
  )

  // Three.js BoxGeometry face indices:
  // 0: +X (right side - pages)
  // 1: -X (left side - spine)
  // 2: +Y (top - pages)
  // 3: -Y (bottom - pages)
  // 4: +Z (front - cover)
  // 5: -Z (back - cover back)
  const materials = useMemo(() => {
    const spec = BINDINGS[binding]
    const pageMaterial = (tint) =>
      new MeshPhysicalMaterial({
        map: pageTexture,
        bumpMap: pageBump,
        bumpScale: 0.06,
        color: tint,
        roughness: 0.92,
        metalness: 0,
        clearcoat: 0,
        envMapIntensity: 0.25,
      })

    return [
      // 0: Right side (pages fore-edge)
      pageMaterial(PAGE_BASE),
      // 1: Left side (spine) - same board as the front, handled a little more
      new MeshPhysicalMaterial({
        map: spineTexture,
        bumpMap: grainMap,
        bumpScale: spec.bumpScale,
        color: '#ffffff',
        roughness: Math.min(0.9, COVER_BASE_ROUGHNESS + 0.1),
        metalness: 0,
        clearcoat: spec.clearcoat * 0.6,
        clearcoatRoughness: Math.min(0.6, spec.clearcoatRoughness + 0.15),
        envMapIntensity: 0.3,
      }),
      // 2: Top (pages)
      pageMaterial(PAGE_BASE),
      // 3: Bottom (pages)
      pageMaterial('#EAE4D9'),
      // 4: Front face (cover)
      new MeshPhysicalMaterial({
        map: coverMap,
        bumpMap: grainMap,
        bumpScale: spec.bumpScale,
        color: '#ffffff',
        // The scalar is the ceiling and the maps carry every per-pixel decision.
        // With masks, metalness lands the board at exactly 0 and the stamped
        // foil at 0.8; without masks the board has to carry that itself.
        metalness: foilMasks ? FOIL_METALNESS : CLOTH_METALNESS,
        roughness: COVER_BASE_ROUGHNESS,
        metalnessMap: foilMasks?.metalnessMap,
        roughnessMap: foilMasks?.roughnessMap,
        clearcoat: foilMasks ? FOIL_CLEARCOAT : spec.clearcoat,
        clearcoatMap: foilMasks?.clearcoatMap,
        clearcoatRoughness: foilMasks ? CLEARCOAT_ROUGHNESS_CEILING : spec.clearcoatRoughness,
        clearcoatRoughnessMap: foilMasks?.clearcoatRoughnessMap,
        envMapIntensity: 0.3,
      }),
      // 5: Back face (cover back) - unlaminated board, so duller than the front
      new MeshPhysicalMaterial({
        color: spineColor,
        bumpMap: grainMap,
        bumpScale: spec.bumpScale,
        roughness: Math.min(0.95, COVER_BASE_ROUGHNESS + 0.16),
        metalness: 0,
        clearcoat: spec.clearcoat * 0.3,
        clearcoatRoughness: Math.min(0.7, spec.clearcoatRoughness + 0.25),
        envMapIntensity: 0.25,
      }),
    ]
  }, [spineColor, coverMap, spineTexture, pageTexture, pageBump, grainMap, foilMasks, binding])

  useEffect(() => {
    return () => {
      materials.forEach((material) => material.dispose())
    }
  }, [materials])

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={[-0.04, Math.PI / 7, 0]}
    >
      <mesh
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[BOOK_WIDTH, BOOK_HEIGHT, BOOK_DEPTH]} />
        {materials.map((material, i) => (
          <primitive key={i} object={material} attach={`material-${i}`} />
        ))}
      </mesh>

      <pointLight
        ref={glowRef}
        intensity={0}
        color="#FFF5E6"
        distance={4.5}
        decay={1.6}
      />
    </group>
  )
}