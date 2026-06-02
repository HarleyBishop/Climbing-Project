import { useTheme, GRAIN } from '../../theme';

// Painterly sky: gradient sky + radial glow + soft cloud blobs + rolling hill
// silhouettes at the base + a faint paper-grain overlay.
// Absolutely positioned to fill its relative parent (the hero section of PageShell).
export function Sky({ hills = true, stars = false }) {
  const P = useTheme();
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: P.sky }} />
      <div style={{ position: 'absolute', inset: 0, background: P.glow }} />
      {stars && [[12, 22, 2], [26, 13, 1.5], [44, 26, 2], [66, 16, 1.5], [82, 30, 2]].map(([l, t, r], i) => (
        <span key={i} style={{ position: 'absolute', left: `${l}%`, top: `${t}%`, width: r * 2, height: r * 2, borderRadius: '50%', background: 'rgba(255,245,225,.92)' }} />
      ))}
      <div style={{ position: 'absolute', top: '18%', left: '7%', width: 130, height: 34, borderRadius: '50%', background: `radial-gradient(closest-side, ${P.cloud}, transparent)`, filter: 'blur(3px)' }} />
      <div style={{ position: 'absolute', top: '34%', left: '1%', width: 88, height: 24, borderRadius: '50%', background: `radial-gradient(closest-side, ${P.cloud}, transparent)`, filter: 'blur(3px)' }} />
      <div style={{ position: 'absolute', top: '12%', right: '9%', width: 104, height: 28, borderRadius: '50%', background: `radial-gradient(closest-side, ${P.cloud}, transparent)`, filter: 'blur(3px)' }} />
      {hills && P.hills.map((c, i) => (
        <div key={i} style={{ position: 'absolute', bottom: -34 + i * -2, left: i % 2 ? '-30%' : '-18%', width: '150%', height: 96 - i * 16, background: c, borderRadius: '50% 50% 0 0 / 100% 100% 0 0', transform: `translateY(${i * 10}px)` }} />
      ))}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: GRAIN, backgroundSize: '160px 160px', opacity: 0.09, mixBlendMode: 'soft-light', pointerEvents: 'none' }} />
    </div>
  );
}
