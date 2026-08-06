import { memo, useMemo } from 'react';

const BubbleBackground = memo(function BubbleBackground({ active }) {
  const bubbles = useMemo(() => {
    // 12 lightweight floating bubbles for silky 60+ FPS zero-lag performance
    return [
      { id: 1, size: 54, left: 8, duration: 16, delay: -2, wobble: 15, opacity: 0.65 },
      { id: 2, size: 78, left: 22, duration: 20, delay: -10, wobble: -20, opacity: 0.55 },
      { id: 3, size: 42, left: 35, duration: 14, delay: -5, wobble: 18, opacity: 0.70 },
      { id: 4, size: 88, left: 52, duration: 22, delay: -14, wobble: -15, opacity: 0.60 },
      { id: 5, size: 60, left: 68, duration: 17, delay: -8, wobble: 22, opacity: 0.65 },
      { id: 6, size: 95, left: 84, duration: 24, delay: -18, wobble: -25, opacity: 0.50 },
      { id: 7, size: 36, left: 15, duration: 13, delay: -7, wobble: -12, opacity: 0.75 },
      { id: 8, size: 70, left: 45, duration: 19, delay: -12, wobble: 20, opacity: 0.58 },
      { id: 9, size: 48, left: 60, duration: 15, delay: -3, wobble: -18, opacity: 0.68 },
      { id: 10, size: 82, left: 76, duration: 21, delay: -15, wobble: 16, opacity: 0.52 },
      { id: 11, size: 50, left: 28, duration: 18, delay: -11, wobble: 14, opacity: 0.62 },
      { id: 12, size: 66, left: 92, duration: 17, delay: -4, wobble: -16, opacity: 0.60 },
    ].map((b) => ({
      id: b.id,
      style: {
        '--bubble-size': `${b.size}px`,
        '--bubble-left': `${b.left}%`,
        '--bubble-duration': `${b.duration}s`,
        '--bubble-delay': `${b.delay}s`,
        '--bubble-wobble': `${b.wobble}px`,
        '--bubble-opacity': b.opacity,
      },
    }));
  }, []);

  if (!active) return null;

  return (
    <div className="bubble-container" aria-hidden="true">
      {bubbles.map((b) => (
        <div key={b.id} className="bubble-3d" style={b.style} />
      ))}
    </div>
  );
});

export default BubbleBackground;
