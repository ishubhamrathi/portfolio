import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { ContactShadows } from '@react-three/drei'
import { ACESFilmicToneMapping, SRGBColorSpace } from 'three'
import Book3D, { BOOK_WIDTH, BOOK_HEIGHT, BOOK_DEPTH } from '@/components/Books/Book3D'
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi2'
import { useSound } from '@/context/SoundProvider'
import { isAnimatable, onGateChange } from '@/lib/rafGate'

const TIER_HEIGHT = 4.4
const TIERS_PER_PAGE = 2
const SHELF_PLANK_HEIGHT = 0.3
const SHELF_PLANK_DEPTH = 2.0
const SHELF_WOOD_COLOR = '#2E1C13'
const CAMERA_FOV = 50
const FIT_PADDING = 1.08
const SCENE_FOOT_PADDING = 0.5

const SHELF_SPACING = 2.0
const SHELF_MIN_WIDTH = 3.4
const SHELF_MARGIN = 0.7
const SHELF_EDGE = 0.3
const WIDTH_BUDGET_RATIO = 0.98
const FALLBACK_ASPECT = 1.4
const MOBILE_SLOTS = 2

// The plank mesh is centred on tierY - SHELF_PLANK_HEIGHT / 2 with a height of
// SHELF_PLANK_HEIGHT, so its top face lands exactly on tierY. Books therefore
// sit at tierY + BOOK_HEIGHT / 2 with no extra offset, giving flush contact.
export function getTierTopY(tierIndex, numTiers) {
  return ((numTiers - 1) / 2 - tierIndex) * TIER_HEIGHT
}

function getSceneBounds(numTiers) {
  const top = ((numTiers - 1) / 2) * TIER_HEIGHT + BOOK_HEIGHT
  const bottom =
    -((numTiers - 1) / 2) * TIER_HEIGHT - SHELF_PLANK_HEIGHT - SCENE_FOOT_PADDING
  return { top, bottom, height: top - bottom, centerY: (top + bottom) / 2 }
}

// Books are centered and span (slots - 1) * spacing + BOOK_WIDTH, so the plank
// has to cover that plus an edge lip or the outermost books overhang it.
function shelfWidthForSlots(slots) {
  const booksSpan = (slots - 1) * SHELF_SPACING + BOOK_WIDTH
  return Math.max(SHELF_MIN_WIDTH, booksSpan + SHELF_EDGE * 2)
}

// The camera always frames the full shelf width, so nothing is ever cropped
// regardless of slot count. On narrow screens we hold two large books per tier
// as a floor. On wider ones extra slots are free until the shelf outgrows the
// viewport, after which every added slot shrinks all of them, so grow only
// while the shelf still fits the height-bound framing.
function getLayout(aspect, isMobile, bookCount, numTiers) {
  if (isMobile) return { spacing: SHELF_SPACING, perRow: Math.min(MOBILE_SLOTS, bookCount) }

  const cap = bookCount <= 10 ? 5 : 4
  const budget = getSceneBounds(numTiers).height * aspect * WIDTH_BUDGET_RATIO
  let perRow = 1
  for (let slots = 1; slots <= cap; slots++) {
    if (shelfWidthForSlots(slots) + SHELF_MARGIN <= budget) perRow = slots
  }
  return { spacing: SHELF_SPACING, perRow }
}

function CameraSetup({ shelfWidth, numTiers }) {
  const camera = useThree((state) => state.camera)
  const size = useThree((state) => state.size)

  useEffect(() => {
    if (!camera.isPerspectiveCamera || !size.height) return

    const { height: sceneHeight, centerY } = getSceneBounds(numTiers)
    const sceneWidth = shelfWidth + SHELF_MARGIN

    const aspect = size.width / size.height
    const halfFov = (CAMERA_FOV * Math.PI) / 360
    const distForHeight = sceneHeight / 2 / Math.tan(halfFov)
    const distForWidth = sceneWidth / 2 / (Math.tan(halfFov) * aspect)

    const distance = Math.max(distForHeight, distForWidth) * FIT_PADDING
    const lift = Math.min(sceneHeight * 0.06, 0.45)

    camera.fov = CAMERA_FOV
    camera.position.set(0, centerY + lift, distance)
    camera.lookAt(0, centerY, 0)
    camera.updateProjectionMatrix()
  }, [camera, size, shelfWidth, numTiers])

  return null
}

function ShelfPlank({ width, y, isTop = false, isBottom = false }) {
  return (
    <group position={[0, y, 0]}>
      {/* Main shelf plank - slender floating */}
      <mesh position={[0, 0, 0]} receiveShadow castShadow>
        <boxGeometry args={[width, SHELF_PLANK_HEIGHT, SHELF_PLANK_DEPTH]} />
        <meshStandardMaterial
          color={SHELF_WOOD_COLOR}
          roughness={0.6}
          metalness={0.1}
        />
      </mesh>

      {/* Vertical backboard so the books have something to cast onto and the
          shelf reads as a recess rather than a floating slab. */}
      <mesh position={[0, SHELF_PLANK_HEIGHT / 2 + 0.55, -SHELF_PLANK_DEPTH / 2 + 0.03]} receiveShadow>
        <boxGeometry args={[width, 1.1, 0.06]} />
        <meshStandardMaterial color="#1C120D" roughness={0.85} metalness={0.05} />
      </mesh>

      {/* Front edge lip/trim for depth */}
      <mesh position={[0, SHELF_PLANK_HEIGHT / 2 + 0.015, SHELF_PLANK_DEPTH / 2 - 0.02]} receiveShadow castShadow>
        <boxGeometry args={[width, 0.03, 0.04]} />
        <meshStandardMaterial
          color="#3D2A1F"
          roughness={0.45}
          metalness={0.15}
        />
      </mesh>

      {/* Back edge */}
      <mesh position={[0, SHELF_PLANK_HEIGHT / 2 + 0.01, -SHELF_PLANK_DEPTH / 2 + 0.02]} receiveShadow>
        <boxGeometry args={[width, 0.02, 0.04]} />
        <meshStandardMaterial
          color="#241913"
          roughness={0.7}
        />
      </mesh>

      {isBottom && (
        <>
          {/* Contact shadow plane */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -SHELF_PLANK_HEIGHT / 2 - 0.08, 0]} receiveShadow>
            <planeGeometry args={[width + 2, 4]} />
            <shadowMaterial opacity={0.15} />
          </mesh>
        </>
      )}
    </group>
  )
}

// Switching frameloop to 'never' lets the rAF loop cancel itself, and setting
// it back to 'always' does not reschedule anything. The invalidate() is what
// actually restarts the loop, so it has to follow every switch to 'always'.
function RenderGate({ active }) {
  const setFrameloop = useThree((state) => state.setFrameloop)
  const invalidate = useThree((state) => state.invalidate)

  useEffect(() => {
    setFrameloop(active ? 'always' : 'never')
    if (active) invalidate()
  }, [active, setFrameloop, invalidate])

  return null
}

function LoadingFallback() {
  return (
    <group>
      <ambientLight intensity={0.35} color="#FFF7ED" />
    </group>
  )
}

// Stands in for the canvas before the WebGL context exists, so the section
// still has the shape and tone of a shelf rather than an empty dark box.
function ShelfPlaceholder({ books }) {
  return (
    <div className="flex h-full w-full flex-col justify-center gap-6 px-8">
      {[0, 1].map((tier) => (
        <div key={tier} className="flex items-end gap-4">
          {books.slice(0, 4).map((book, i) => (
            <div
              key={book.id || i}
              className="shimmer h-32 w-20 shrink-0 rounded-md border border-white/10 bg-white/[0.04]"
              style={{ opacity: 1 - tier * 0.25 }}
            />
          ))}
          <div className="h-1 flex-1 rounded-full bg-white/10" />
        </div>
      ))}
    </div>
  )
}

function ShelfScene({
  tiers = [],
  numTiers = 1,
  shelfWidth,
  spacing = 3.2,
  onSelectBook,
  isMobile = false,
}) {
  // Covers the widest tier plus the light's oblique throw across the plank.
  const shadowExtent = Math.max(shelfWidth / 2 + 1.5, TIER_HEIGHT * numTiers * 0.6, 4)

  const spotlightX = isMobile ? 0 : -1.2

  return (
    <group position={[0, 0, 0]}>
      {/* Transparent background - no color attachment */}

      {/* Key: warm, front-top, and the only shadow caster. Frustum is derived
          from shelfWidth so the map resolution lands on the books. Kept modest
          so highlights stay on the artwork instead of blowing out the blacks. */}
      <directionalLight
        position={[3, 5, 4]}
        intensity={2.2}
        color="#FFF8F0"
        castShadow
        shadow-mapSize-width={isMobile ? 1024 : 2048}
        shadow-mapSize-height={isMobile ? 1024 : 2048}
        shadow-bias={-0.0001}
        shadow-normalBias={0.02}
        shadow-camera-near={0.5}
        shadow-camera-far={24}
        shadow-camera-left={-shadowExtent}
        shadow-camera-right={shadowExtent}
        shadow-camera-top={shadowExtent}
        shadow-camera-bottom={-shadowExtent}
      />

      {/* Rim: cold light from behind-left. Grazes the top and spine edges so the
          covers separate from the dark backdrop instead of merging into it. */}
      <directionalLight position={[-3, 4, -3]} intensity={1.1} color="#E0F0FF" />

      {/* Low ambient: enough to keep the shadow side readable, not enough to
          lift the blacks on covers like The Art of War into grey. */}
      <ambientLight intensity={0.35} color="#FFF7ED" />

      {/* Shelf Frame - clean floating planks */}
      {tiers.map((tierBooks, tierIndex) => {
        const shelfTopY = getTierTopY(tierIndex, numTiers)
        const isBottomTier = tierIndex === numTiers - 1
        // frames={1} bakes the contact shadow once, so the key has to change
        // with the tier's contents or paging would leave a stale shadow.
        const contactKey = tierBooks.map((b) => b.id).join('-')

        return (
          <group key={`tier-${tierIndex}-${contactKey}`}>
            <ShelfPlank
              width={shelfWidth}
              y={shelfTopY - SHELF_PLANK_HEIGHT / 2}
              isTop={tierIndex === 0}
              isBottom={isBottomTier}
            />

            <ContactShadows
              position={[0, shelfTopY + 0.005, 0]}
              scale={[shelfWidth, SHELF_PLANK_DEPTH * 1.6]}
              resolution={isMobile ? 256 : 512}
              blur={2.4}
              far={1.1}
              opacity={0.9}
              color="#120b07"
              frames={1}
            />
          </group>
        )
      })}

      {/* Books arranged on each shelf tier - sitting ON the plank */}
      {tiers.map((tierBooks, tierIndex) => {
        const tierY = getTierTopY(tierIndex, numTiers)
        const bookY = tierY + BOOK_HEIGHT / 2
        const count = tierBooks.length
        const totalSpan = (count - 1) * spacing
        const startX = -totalSpan / 2

        return tierBooks.map((book, colIndex) => {
          const xPos = startX + colIndex * spacing

          return (
            <Book3D
              key={book.id || `tier-${tierIndex}-${colIndex}`}
              book={book}
              position={[xPos, bookY, 0]}
              spotlightX={spotlightX}
              onClick={onSelectBook}
              isMobile={isMobile}
            />
          )
        })
      })}
    </group>
  )
}

export default function Bookshelf3D({
  books = [],
  onSelectBook,
  isMobile = false,
}) {
  const [pageIndex, setPageIndex] = useState(0)
  const [aspect, setAspect] = useState(FALLBACK_ASPECT)
  // The WebGL context is expensive on mobile, so it is not created until the
  // shelf is close to the viewport, and it stops rendering entirely once the
  // shelf is scrolled away or the user is mid-scroll. Without this the canvas
  // renders every frame from page load, which starves the compositor and shows
  // up as a black box during scrolling.
  const [shouldMount, setShouldMount] = useState(false)
  const [isLive, setIsLive] = useState(false)
  const [scrolling, setScrolling] = useState(false)
  const wrapRef = useRef(null)
  const { playClick } = useSound()

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return undefined
    const measure = () => {
      const { width, height } = el.getBoundingClientRect()
      if (height > 0) setAspect(width / height)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const el = wrapRef.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      setShouldMount(true)
      return undefined
    }
    // A generous root margin means the context is already warm by the time the
    // shelf scrolls into view, which is what removes the visible stall.
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldMount(true)
          setIsLive(true)
        } else {
          setIsLive(false)
        }
      },
      { rootMargin: '600px 0px', threshold: 0 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => onGateChange(() => setScrolling(!isAnimatable())), [])

  const layout = useMemo(
    () => getLayout(aspect, isMobile, books.length, TIERS_PER_PAGE),
    [aspect, isMobile, books.length]
  )

  const { tiers, numTiers, totalPages } = useMemo(() => {
    const sorted = [...books].sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured))
    const perRow = layout.perRow
    const rows = []
    for (let i = 0; i < sorted.length; i += perRow) {
      rows.push(sorted.slice(i, i + perRow))
    }

    const pages = Math.max(1, Math.ceil(rows.length / TIERS_PER_PAGE))
    const safePageIndex = Math.min(pageIndex, pages - 1)
    const visibleTiers = rows.slice(
      safePageIndex * TIERS_PER_PAGE,
      safePageIndex * TIERS_PER_PAGE + TIERS_PER_PAGE
    )

    return {
      tiers: visibleTiers,
      numTiers: Math.max(1, visibleTiers.length),
      totalPages: pages,
    }
  }, [books, pageIndex, layout])

  const shelfWidth = useMemo(() => {
    const maxCols = Math.max(...tiers.map((t) => t.length), 1)
    return shelfWidthForSlots(maxCols)
  }, [tiers])

  const canGoPrev = pageIndex > 0
  const canGoNext = pageIndex < totalPages - 1

  const handlePrev = () => {
    if (!canGoPrev) return
    playClick()
    setPageIndex((prev) => prev - 1)
  }

  const handleNext = () => {
    if (!canGoNext) return
    playClick()
    setPageIndex((prev) => prev + 1)
  }

  return (
    <div ref={wrapRef} className="relative w-full h-[550px] sm:h-[600px] md:h-[650px]">
      {shouldMount ? (
        <>
          <Canvas
            camera={{
              position: [0, 1.8, 8.5],
              fov: CAMERA_FOV,
              near: 0.1,
              far: 100,
            }}
            dpr={isMobile ? 1 : [1, 2]}
            shadows
            gl={{
              alpha: true,
              antialias: true,
              preserveDrawingBuffer: false,
              powerPreference: 'high-performance',
              toneMapping: ACESFilmicToneMapping,
              // Kept at 1.0: dark cover art loses its blacks well before 1.1.
              toneMappingExposure: 1.0,
              outputColorSpace: SRGBColorSpace,
            }}
            resize={{ scroll: false }}
            className="h-full w-full"
          >
            <CameraSetup shelfWidth={shelfWidth} numTiers={numTiers} />
            <RenderGate active={isLive && !scrolling} />
            <Suspense fallback={<LoadingFallback />}>
              <ShelfScene
                tiers={tiers}
                numTiers={numTiers}
                shelfWidth={shelfWidth}
                spacing={layout.spacing}
                onSelectBook={onSelectBook}
                isMobile={isMobile}
              />
            </Suspense>
          </Canvas>
          {/* Covers the canvas whenever the loop is frozen, so an off-screen or
              mid-scroll shelf never presents the bare container background. */}
          {!isLive && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[#0B0F17]"
            />
          )}
        </>
      ) : (
        <ShelfPlaceholder books={books} />
      )}

      {totalPages > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous shelf tier"
            disabled={!canGoPrev}
            onClick={handlePrev}
            className={`cursor-target absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-black/70 backdrop-blur-md text-fg transition ${
              canGoPrev
                ? 'opacity-90 hover:border-amber-400 hover:text-amber-300 hover:scale-110'
                : 'opacity-25 cursor-not-allowed'
            }`}
          >
            <HiChevronLeft size={20} />
          </button>
          <button
            type="button"
            aria-label="Next shelf tier"
            disabled={!canGoNext}
            onClick={handleNext}
            className={`cursor-target absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-black/70 backdrop-blur-md text-fg transition ${
              canGoNext
                ? 'opacity-90 hover:border-amber-400 hover:text-amber-300 hover:scale-110'
                : 'opacity-25 cursor-not-allowed'
            }`}
          >
            <HiChevronRight size={20} />
          </button>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/60 px-3.5 py-1 text-[11px] text-dim backdrop-blur-sm">
            <span>
              Shelf Page {pageIndex + 1} of {totalPages}
            </span>
          </div>
        </>
      )}
    </div>
  )
}