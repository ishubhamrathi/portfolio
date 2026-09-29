import { useRef, useEffect } from 'react';

const Noise = ({
  patternSize = 250,
  patternScaleX = 1,
  patternScaleY = 1,
  patternRefreshInterval = 2,
  patternAlpha = 15,
  canvasSize = 256
}) => {
  const grainRef = useRef(null);

  useEffect(() => {
    const canvas = grainRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let frame = 0;
    let animationId;
    let last = 0;

    canvas.width = canvasSize;
    canvas.height = canvasSize;
    canvas.style.width = '100%';
    canvas.style.height = '100%';

    const drawGrain = () => {
      const imageData = ctx.createImageData(canvasSize, canvasSize);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const value = Math.random() * 255;
        data[i] = value;
        data[i + 1] = value;
        data[i + 2] = value;
        data[i + 3] = patternAlpha;
      }

      ctx.putImageData(imageData, 0, 0);
    };

    const loop = (now) => {
      if (document.hidden) {
        animationId = window.requestAnimationFrame(loop);
        return;
      }
      if (now - last >= 1000 / 20) {
        last = now;
        drawGrain();
      }
      frame++;
      animationId = window.requestAnimationFrame(loop);
    };

    const onVisibility = () => {
      if (document.hidden) {
        window.cancelAnimationFrame(animationId);
        animationId = 0;
      } else if (!animationId) {
        last = 0;
        animationId = window.requestAnimationFrame(loop);
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    animationId = window.requestAnimationFrame(loop);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.cancelAnimationFrame(animationId);
    };
  }, [patternSize, patternScaleX, patternScaleY, patternRefreshInterval, patternAlpha, canvasSize]);

  return (
    <canvas
      className="pointer-events-none absolute inset-0 h-full w-full"
      ref={grainRef}
      style={{ imageRendering: 'pixelated' }} />
  );
};

export default Noise;
