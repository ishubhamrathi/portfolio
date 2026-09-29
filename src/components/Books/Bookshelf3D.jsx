import { Suspense, useEffect, useMemo, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import Book3D, { BOOK_WIDTH, BOOK_HEIGHT, BOOK_DEPTH } from '@/components/Books/Book3D'
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi2'
import { useSound } from '@/context/SoundProvider'

const HORIZONTAL_SPACING = 3.2
const TIER_HEIGHT = 4.4
const TIERS_PER_PAGE = 2
const SHELF_PLANK_HEIGHT = 0.3
const SHELF_PLANK_DEPTH = 2.0
const SHELF_WOOD_COLOR = '#2E1C13'

function CameraSetup({ numTiers }) {
  const { camera, size } = useThree()
  useEffect(() => {
    camera.position.set(0, 1.8, 8.5)
    camera.fov = 50
    camera.lookAt(0, 0.5, 0)
    camera.updateProjectionMatrix()

    const handleResize = () => {
      camera.aspect = size.width / size.height
      camera.updateProjectionMatrix()
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [camera, numTiers, size])
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

function LoadingFallback() {
  return (
    <group>
      <ambientLight intensity={1.2} color="#FFF7ED" />
    </group>
  )
}

function ShelfScene({
  tiers = [],
  numTiers = 1,
  onSelectBook,
  isMobile = false,
}) {
  const maxCols = Math.max(...tiers.map((t) => t.length), 3)
  const maxSpan = (maxCols - 1) * HORIZONTAL_SPACING
  const shelfWidth = Math.max(9.0, maxSpan + 3.0)

  const topTierY = ((numTiers - 1) / 2) * TIER_HEIGHT
  const bottomTierY = -((numTiers - 1) / 2) * TIER_HEIGHT

  const shelfBaseY = bottomTierY - SHELF_PLANK_HEIGHT / 2
  const topShelfY = topTierY - SHELF_PLANK_HEIGHT / 2

  const spotlightX = isMobile ? 0 : -1.2

  return (
    <group position={[0, 0, 0]}>
      {/* Transparent background - no color attachment */}

      {/* Warm ambient base lighting */}
      <ambientLight intensity={0.85} color="#FFF7ED" />

      {/* Warm directional key light from top-front-left - casts shadows */}
      <directionalLight
        position={[2, 6, 4]}
        intensity={2.4}
        color="#FFF8EE"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0001}
        shadow-normalBias={0.02}
        shadow-camera-near={0.5}
        shadow-camera-far={20}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
      />

      {/* Front-facing light so cover typography renders crisp and unshadowed */}
      <directionalLight position={[0, 2, 5]} intensity={3.0} color="#FFFFFF" />

      {/* Soft fill light from top-right */}
      <pointLight position={[6, 5, 6]} intensity={1.1} color="#FEF3C7" decay={1.5} distance={20} />

      {/* Subtle rim light from above/behind for cover readability */}
      <directionalLight position={[0, 6, -3]} intensity={0.6} color="#E2E8F0" />

      {/* Shelf Frame - clean floating planks */}
      {tiers.map((_, tierIndex) => {
        const tierY = ((numTiers - 1) / 2 - tierIndex) * TIER_HEIGHT
        const plankY = tierY - SHELF_PLANK_HEIGHT / 2
        const isBottomTier = tierIndex === numTiers - 1

        return (
          <ShelfPlank
            key={`plank-${tierIndex}`}
            width={shelfWidth}
            y={plankY}
            isTop={tierIndex === 0}
            isBottom={isBottomTier}
          />
        )
      })}

      {/* Books arranged on each shelf tier - sitting ON the plank */}
      {tiers.map((tierBooks, tierIndex) => {
        const tierY = ((numTiers - 1) / 2 - tierIndex) * TIER_HEIGHT
        const bookY = tierY + SHELF_PLANK_HEIGHT / 2 + BOOK_HEIGHT / 2
        const count = tierBooks.length
        const totalSpan = (count - 1) * HORIZONTAL_SPACING
        const startX = -totalSpan / 2

        return tierBooks.map((book, colIndex) => {
          const xPos = startX + colIndex * HORIZONTAL_SPACING

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
  const { playClick } = useSound()

  const { tiers, numTiers, totalPages } = useMemo(() => {
    const sorted = [...books].sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured))
    const perRow = sorted.length <= 8 ? 4 : sorted.length <= 10 ? 5 : 4
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
  }, [books, pageIndex])

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
    <div className="relative w-full h-[550px] sm:h-[600px] md:h-[650px]">
      <Canvas
        camera={{
          position: [0, 1.8, 8.5],
          fov: 50,
          near: 0.1,
          far: 100,
        }}
        dpr={[1, 2]}
        shadows
        flat
        gl={{
          alpha: true,
          antialias: true,
          preserveDrawingBuffer: false,
          powerPreference: 'high-performance',
        }}
        resize={{ scroll: false }}
        className="h-full w-full"
      >
        <CameraSetup numTiers={numTiers} />
        <Suspense fallback={<LoadingFallback />}>
          <ShelfScene
            tiers={tiers}
            numTiers={numTiers}
            onSelectBook={onSelectBook}
            isMobile={isMobile}
          />
        </Suspense>
      </Canvas>

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