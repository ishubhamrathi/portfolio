import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  CanvasTexture,
  LinearFilter,
  MeshStandardMaterial,
  SRGBColorSpace,
  TextureLoader,
} from 'three'
import { useSound } from '@/context/SoundProvider'

export const BOOK_WIDTH = 1.6
export const BOOK_HEIGHT = 2.3
export const BOOK_DEPTH = 0.35

let sharedPageTexture = null

function getSharedPageTexture() {
  if (sharedPageTexture) return sharedPageTexture

  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#F5EFE6'
  ctx.fillRect(0, 0, 256, 256)

  for (let y = 0; y < 256; y += 2) {
    const val = 240 + Math.floor(Math.sin(y * 0.9) * 8 + (y % 4) * 2)
    ctx.fillStyle = `rgb(${val}, ${val - 6}, ${val - 16})`
    ctx.fillRect(0, y, 256, 1)
  }

  const grad = ctx.createLinearGradient(0, 0, 42, 0)
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.14)')
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 42, 256)

  sharedPageTexture = new CanvasTexture(canvas)
  sharedPageTexture.colorSpace = SRGBColorSpace
  sharedPageTexture.minFilter = LinearFilter
  sharedPageTexture.magFilter = LinearFilter
  return sharedPageTexture
}

function makeSpineTexture(book) {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 512
  const ctx = canvas.getContext('2d')

  const baseColor = book.spineColor || '#2A1D17'
  ctx.fillStyle = baseColor
  ctx.fillRect(0, 0, 128, 512)

  ctx.fillStyle = 'rgba(234, 179, 8, 0.5)'
  ctx.fillRect(16, 20, 96, 3.5)
  ctx.fillRect(16, 28, 96, 1.5)
  ctx.fillRect(16, 482, 96, 1.5)
  ctx.fillRect(16, 490, 96, 3.5)

  const edgeGrad = ctx.createLinearGradient(0, 0, 128, 0)
  edgeGrad.addColorStop(0, 'rgba(255, 255, 255, 0.16)')
  edgeGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0)')
  edgeGrad.addColorStop(1, 'rgba(0, 0, 0, 0.32)')
  ctx.fillStyle = edgeGrad
  ctx.fillRect(0, 0, 128, 512)

  ctx.save()
  ctx.translate(64, 256)
  ctx.rotate(Math.PI / 2)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 22px system-ui, sans-serif'
  const title = (book.title || 'Untitled').toUpperCase()
  const shortTitle = title.length > 26 ? title.slice(0, 24) + '…' : title
  ctx.fillText(shortTitle, 0, -10, 370)

  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)'
  ctx.font = '15px system-ui, sans-serif'
  const author = book.author || ''
  const shortAuthor = author.length > 22 ? author.slice(0, 20) + '…' : author
  ctx.fillText(shortAuthor, 0, 16, 370)
  ctx.restore()

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.minFilter = LinearFilter
  texture.magFilter = LinearFilter
  return texture
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

function makeFallbackCoverTexture(book) {
  const canvas = document.createElement('canvas')
  canvas.width = 640
  canvas.height = 880
  const ctx = canvas.getContext('2d')

  const color = book.spineColor || '#2A1D17'
  const grad = ctx.createLinearGradient(0, 0, 640, 880)
  grad.addColorStop(0, color)
  grad.addColorStop(1, '#0B0F17')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 640, 880)

  ctx.strokeStyle = 'rgba(234, 179, 8, 0.4)'
  ctx.lineWidth = 3
  ctx.strokeRect(32, 32, 576, 816)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)'
  ctx.lineWidth = 1.2
  ctx.strokeRect(42, 42, 556, 796)

  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)'
  ctx.beginPath()
  ctx.arc(320, 210, 56, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = 'rgba(234, 179, 8, 0.85)'
  ctx.font = '40px serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('✦', 320, 210)

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 42px system-ui, sans-serif'
  wrapText(ctx, (book.title || 'Untitled').toUpperCase(), 320, 330, 500, 52, 3)

  if (book.author) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.78)'
    ctx.font = '24px system-ui, sans-serif'
    ctx.fillText(`by ${book.author}`, 320, 650, 480)
  }

  const tag = book.genre || book.category
  if (tag) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.14)'
    ctx.beginPath()
    ctx.roundRect(210, 720, 220, 38, 19)
    ctx.fill()
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
    ctx.font = 'bold 15px system-ui, sans-serif'
    ctx.fillText(tag.toUpperCase(), 320, 742)
  }

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.minFilter = LinearFilter
  texture.magFilter = LinearFilter
  return texture
}

function useCoverTexture(url) {
  const [texture, setTexture] = useState(null)

  useEffect(() => {
    if (!url) {
      setTexture(null)
      return undefined
    }
    let active = true
    const loader = new TextureLoader()
    loader.setCrossOrigin('anonymous')
    loader.load(
      url,
      (loaded) => {
        if (!active) {
          loaded.dispose()
          return
        }
        loaded.colorSpace = SRGBColorSpace
        loaded.generateMipmaps = true
        loaded.minFilter = LinearFilter
        loaded.magFilter = LinearFilter
        loaded.needsUpdate = true
        setTexture(loaded)
      },
      undefined,
      () => {
        if (active) setTexture(null)
      }
    )
    return () => {
      active = false
    }
  }, [url])

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

  const coverTexture = useCoverTexture(book.coverUrl)
  const fallbackCoverTexture = useMemo(
    () => makeFallbackCoverTexture(book),
    [book.title, book.author, book.spineColor, book.genre, book.category]
  )
  const spineTexture = useMemo(
    () => makeSpineTexture(book),
    [book.title, book.author, book.spineColor]
  )
  const pageTexture = useMemo(() => getSharedPageTexture(), [])

  useEffect(() => {
    return () => {
      spineTexture?.dispose()
      fallbackCoverTexture?.dispose()
    }
  }, [spineTexture, fallbackCoverTexture])

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
      roughness: 0.5,
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
    // 4: Front face (cover) - THIS IS THE KEY FIX
    new MeshStandardMaterial({
      map: coverMap,
      roughness: 0.32,
      metalness: 0.04,
    }),
    // 5: Back face (cover back)
    new MeshStandardMaterial({
      color: spineColor,
      roughness: 0.65,
    }),
  ], [spineColor, coverMap, spineTexture, pageTexture])

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