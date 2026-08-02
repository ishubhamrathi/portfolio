import { useEffect, useRef } from 'react'
import { Fingerprint, Activity, Lock } from 'lucide-react'

const ReflectiveCard = ({
  imageSrc,
  name = 'Shubham Rathi',
  role = 'Full Stack Developer',
  idLabel = 'PORTFOLIO',
  idNumber = 'SR-2024',
  blurStrength = 2,
  color = 'white',
  metalness = 1,
  roughness = 0.35,
  overlayColor = 'rgba(0, 0, 0, 0.35)',
  displacementStrength = 14,
  noiseScale = 1,
  specularConstant = 1.2,
  grayscale = 1,
  glassDistortion = 0,
  useWebcam = false,
  className = '',
  style = {},
}) => {
  const videoRef = useRef(null)
  const filterId = 'metallic-displacement-photo'

  useEffect(() => {
    if (!useWebcam || imageSrc) return undefined

    let stream = null
    const startWebcam = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user',
          },
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      } catch (err) {
        console.error('Error accessing webcam:', err)
      }
    }

    startWebcam()

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [useWebcam, imageSrc])

  const baseFrequency = 0.03 / Math.max(0.1, noiseScale)
  const saturation = 1 - Math.max(0, Math.min(1, grayscale))

  const cssVariables = {
    '--blur-strength': `${blurStrength}px`,
    '--metalness': metalness,
    '--roughness': roughness,
    '--overlay-color': overlayColor,
    '--text-color': color,
    '--saturation': saturation,
  }

  const mediaFilter = {
    filter: `saturate(var(--saturation, 0)) contrast(115%) brightness(105%) grayscale(1) blur(var(--blur-strength, 2px)) url(#${filterId})`,
  }

  return (
    <div
      className={`relative w-[320px] h-[500px] rounded-[20px] overflow-hidden bg-[#1a1a1a] shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.1)_inset] isolate font-sans ${className}`}
      style={{ ...style, ...cssVariables }}
    >
      <svg className="pointer-events-none absolute h-0 w-0 opacity-0" aria-hidden="true">
        <defs>
          <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="turbulence" baseFrequency={baseFrequency} numOctaves="2" result="noise" />
            <feColorMatrix in="noise" type="luminanceToAlpha" result="noiseAlpha" />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale={displacementStrength}
              xChannelSelector="R"
              yChannelSelector="G"
              result="rippled"
            />
            <feSpecularLighting
              in="noiseAlpha"
              surfaceScale={displacementStrength}
              specularConstant={specularConstant}
              specularExponent="20"
              lightingColor="#ffffff"
              result="light"
            >
              <fePointLight x="0" y="0" z="300" />
            </feSpecularLighting>
            <feComposite in="light" in2="rippled" operator="in" result="light-effect" />
            <feBlend in="light-effect" in2="rippled" mode="screen" result="metallic-result" />
            <feColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
              result="solidAlpha"
            />
            <feMorphology in="solidAlpha" operator="erode" radius="45" result="erodedAlpha" />
            <feGaussianBlur in="erodedAlpha" stdDeviation="10" result="blurredMap" />
            <feComponentTransfer in="blurredMap" result="glassMap">
              <feFuncA type="linear" slope="0.5" intercept="0" />
            </feComponentTransfer>
            <feDisplacementMap
              in="metallic-result"
              in2="glassMap"
              scale={glassDistortion}
              xChannelSelector="A"
              yChannelSelector="A"
              result="final"
            />
          </filter>
        </defs>
      </svg>

      {imageSrc ? (
        <img
          src={imageSrc}
          alt={name}
          className="absolute top-0 left-0 z-0 h-full w-full scale-[1.08] object-cover opacity-90 transition-[filter] duration-300"
          style={mediaFilter}
        />
      ) : (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute top-0 left-0 z-0 h-full w-full scale-[1.2] object-cover opacity-90 transition-[filter] duration-300 -scale-x-100"
          style={mediaFilter}
        />
      )}

      <div className="pointer-events-none absolute inset-0 z-10 bg-[url('data:image/svg+xml,%3Csvg%20viewBox%3D%270%200%20200%20200%27%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%3E%3Cfilter%20id%3D%27noiseFilter%27%3E%3CfeTurbulence%20type%3D%27fractalNoise%27%20baseFrequency%3D%270.8%27%20numOctaves%3D%273%27%20stitchTiles%3D%27stitch%27%2F%3E%3C%2Ffilter%3E%3Crect%20width%3D%27100%25%27%20height%3D%27100%25%27%20filter%3D%27url(%23noiseFilter)%27%2F%3E%3C%2Fsvg%3E')] opacity-[var(--roughness,0.4)] mix-blend-overlay" />
      <div className="pointer-events-none absolute inset-0 z-20 bg-[linear-gradient(135deg,rgba(255,255,255,0.4)_0%,rgba(255,255,255,0.1)_40%,rgba(255,255,255,0)_50%,rgba(255,255,255,0.1)_60%,rgba(255,255,255,0.3)_100%)] opacity-[var(--metalness,1)] mix-blend-overlay" />
      <div className="pointer-events-none absolute inset-0 z-20 rounded-[20px] bg-[linear-gradient(135deg,rgba(255,255,255,0.8)_0%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.6)_100%)] p-[1px] [mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] [mask-composite:exclude]" />

      <div className="relative z-10 flex h-full flex-col justify-between bg-[var(--overlay-color,rgba(255,255,255,0.05))] p-8 text-[var(--text-color,white)]">
        <div className="flex items-center justify-between border-b border-white/20 pb-4">
          <div className="flex items-center gap-1.5 rounded border border-white/20 bg-white/10 px-2 py-1 text-[10px] font-bold tracking-[0.1em]">
            <Lock size={14} className="opacity-80" />
            <span>{idLabel}</span>
          </div>
          <Activity className="opacity-80" size={20} />
        </div>

        <div className="mb-8 flex flex-1 flex-col items-center justify-end gap-6 text-center">
          <div className="text-center">
            <h2 className="m-0 mb-2 text-2xl font-bold tracking-[0.05em] drop-shadow-md">{name}</h2>
            <p className="m-0 text-xs uppercase tracking-[0.2em] opacity-70">{role}</p>
          </div>
        </div>

        <div className="flex items-end justify-between border-t border-white/20 pt-6">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] tracking-[0.1em] opacity-60">ID NUMBER</span>
            <span className="font-mono text-sm tracking-[0.05em]">{idNumber}</span>
          </div>
          <div className="opacity-40">
            <Fingerprint size={32} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReflectiveCard
