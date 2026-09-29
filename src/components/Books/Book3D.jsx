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

let sharedClothBump = null

// Fine woven-cloth height field for the covers. Deterministic value noise
// crossed with a thread grid so it tiles without a visible repeat at this scale.
function makeClothBumpTexture() {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const image = ctx.createImageData(size, size)
  const data = image.data

  const hash = (x, y) => {
    const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
    return n - Math.floor(n)
  }

  const smooth = (x, y, freq) => {
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

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size
      const v = y / size
      const warp = Math.sin(u * Math.PI * 2 * 48) * 0.5 + 0.5
      const weft = Math.sin(v * Math.PI * 2 * 48) * 0.5 + 0.5
      const weave = (warp * 0.5 + weft * 0.5) * 0.55
      const grain = smooth(u, v, 24) * 0.3 + smooth(u, v, 48) * 0.15
      const val = Math.round(118 + (weave + grain - 0.5) * 74)
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

function getSharedClothBump() {
  if (sharedClothBump) return sharedClothBump
  const texture = new CanvasTexture(makeClothBumpTexture())
  texture.colorSpace = NoColorSpace
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  texture.minFilter = LinearMipmapLinearFilter
  texture.magFilter = LinearFilter
  texture.generateMipmaps = true
  texture.repeat.set(5, 7)
  sharedClothBump = texture
  return sharedClothBump
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
// Cover body is uniformly 0.45 matte; the foil gloss comes from the clearcoat
// pair rather than roughness, since clearcoat is a separate specular lobe that
// does not wash the diffuse layer the way low roughness does.
const FOIL_METALNESS = 0.8
const CLOTH_METALNESS = 0.05
const COVER_ROUGHNESS = 0.45
const FOIL_CLEARCOAT = 0.3
const FOIL_CLEARCOAT_ROUGHNESS = 0.1
const CLEARCOAT_ROUGHNESS_CEILING = 0.5

function buildFoilMasks(texture) {
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

  // Normalised against each ceiling so the material scalars can carry the
  // target values directly and the maps only express the foil/cloth split.
  write(
    'metalnessMap',
    (d, i) => (CLOTH_METALNESS + (FOIL_METALNESS - CLOTH_METALNESS) * foilStrength(d, i)) / FOIL_METALNESS
  )
  // Uniform 0.45 across the cover, so this map is flat and exists only to keep
  // the four-map set symmetrical if the roughness split ever becomes per-pixel.
  write('roughnessMap', () => COVER_ROUGHNESS / COVER_ROUGHNESS)
  write('clearcoatMap', (d, i) => (FOIL_CLEARCOAT * foilStrength(d, i)) / FOIL_CLEARCOAT)
  write('clearcoatRoughnessMap', (d, i) => {
    const s = foilStrength(d, i)
    // Cloth gets no clearcoat, so its roughness is inert; keep it out of range.
    return s > 0
      ? (CLEARCOAT_ROUGHNESS_CEILING +
          (FOIL_CLEARCOAT_ROUGHNESS - CLEARCOAT_ROUGHNESS_CEILING) * s) /
        CLEARCOAT_ROUGHNESS_CEILING
      : 1
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

function getFoilMasks(texture) {
  if (!texture) return null
  if (foilMaskCache.has(texture)) return foilMaskCache.get(texture)
  const masks = buildFoilMasks(texture)
  foilMaskCache.set(texture, masks)
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
  const clothBump = useMemo(() => getSharedClothBump(), [])
  const pageBump = useMemo(() => getSharedPageBump(), [])
  const foilMasks = useMemo(() => getFoilMasks(coverMap), [coverMap])

  // Three.js BoxGeometry face indices:
  // 0: +X (right side - pages)
  // 1: -X (left side - spine)
  // 2: +Y (top - pages)
  // 3: -Y (bottom - pages)
  // 4: +Z (front - cover)
  // 5: -Z (back - cover back)
  const materials = useMemo(() => {
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
      // 1: Left side (spine)
      new MeshPhysicalMaterial({
        map: spineTexture,
        bumpMap: clothBump,
        bumpScale: 0.04,
        roughness: 0.82,
        metalness: 0.04,
        clearcoat: 0.12,
        clearcoatRoughness: 0.75,
        envMapIntensity: 0.3,
      }),
      // 2: Top (pages)
      pageMaterial(PAGE_BASE),
      // 3: Bottom (pages)
      pageMaterial('#EAE4D9'),
      // 4: Front face (cover)
      new MeshPhysicalMaterial({
        map: coverMap,
        bumpMap: clothBump,
        bumpScale: 0.05,
        color: '#ffffff',
        // With masks present these scalars are the ceiling and the maps carry
        // the per-pixel split; the maps are normalised so the products land on
        // exactly these values at each end. Without masks they stand alone.
        metalness: foilMasks ? FOIL_METALNESS : CLOTH_METALNESS,
        roughness: COVER_ROUGHNESS,
        metalnessMap: foilMasks?.metalnessMap,
        roughnessMap: foilMasks?.roughnessMap,
        clearcoat: FOIL_CLEARCOAT,
        clearcoatMap: foilMasks?.clearcoatMap,
        clearcoatRoughness: CLEARCOAT_ROUGHNESS_CEILING,
        clearcoatRoughnessMap: foilMasks?.clearcoatRoughnessMap,
        envMapIntensity: 0.3,
      }),
      // 5: Back face (cover back)
      new MeshPhysicalMaterial({
        color: spineColor,
        bumpMap: clothBump,
        bumpScale: 0.04,
        roughness: 0.88,
        metalness: 0.04,
        clearcoat: 0.08,
        clearcoatRoughness: 0.85,
        envMapIntensity: 0.25,
      }),
    ]
  }, [spineColor, coverMap, spineTexture, pageTexture, pageBump, clothBump, foilMasks])

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