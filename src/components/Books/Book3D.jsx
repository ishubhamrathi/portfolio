import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import {
  CanvasTexture,
  ClampToEdgeWrapping,
  LinearFilter,
  LinearMipmapLinearFilter,
  MeshStandardMaterial,
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

function getSharedPageTexture(maxAnisotropy) {
  if (sharedPageTexture) return sharedPageTexture

  const canvas = document.createElement('canvas')
  canvas.width = PAGE_SIZE
  canvas.height = PAGE_SIZE
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#F5EFE6'
  ctx.fillRect(0, 0, PAGE_SIZE, PAGE_SIZE)

  for (let y = 0; y < PAGE_SIZE; y += 4) {
    const val = 240 + Math.floor(Math.sin(y * 0.9) * 8 + (y % 8) * 2)
    ctx.fillStyle = `rgb(${val}, ${val - 6}, ${val - 16})`
    ctx.fillRect(0, y, PAGE_SIZE, 2)
  }

  const grad = ctx.createLinearGradient(0, 0, 84, 0)
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.14)')
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 84, PAGE_SIZE)

  sharedPageTexture = tuneTexture(new CanvasTexture(canvas), maxAnisotropy)
  return sharedPageTexture
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
    const targetHoverY = isHoverActive ? 0.15 : 0
    const targetHoverZ = isHoverActive ? 0.5 : 0
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

  // Three.js BoxGeometry face indices:
  // 0: +X (right side - pages)
  // 1: -X (left side - spine)
  // 2: +Y (top - pages)
  // 3: -Y (bottom - pages)
  // 4: +Z (front - cover)
  // 5: -Z (back - cover back)
  const materials = useMemo(() => [
    // 0: Right side (pages edge)
    new MeshStandardMaterial({
      map: pageTexture,
      color: '#F5EFE6',
      roughness: 0.85,
    }),
    // 1: Left side (spine)
    new MeshStandardMaterial({
      map: spineTexture,
      roughness: 0.42,
      metalness: 0,
    }),
    // 2: Top (pages)
    new MeshStandardMaterial({
      map: pageTexture,
      color: '#F5EFE6',
      roughness: 0.85,
    }),
    // 3: Bottom (pages)
    new MeshStandardMaterial({
      map: pageTexture,
      color: '#EFE8DC',
      roughness: 0.85,
    }),
    // 4: Front face (cover)
    new MeshStandardMaterial({
      map: coverMap,
      color: '#ffffff',
      roughness: 0.2,
      metalness: 0.0,
      envMapIntensity: 0.4,
    }),
    // 5: Back face (cover back)
    new MeshStandardMaterial({
      color: spineColor,
      roughness: 0.65,
    }),
  ], [spineColor, coverMap, spineTexture, pageTexture])

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
    </group>
  )
}