import { useTheme, GRAIN } from '../../theme';

// Painterly sky: gradient sky + radial glow + soft cloud blobs + rolling hill
// silhouettes at the base + a faint paper-grain overlay.
// Absolutely positioned to fill its relative parent (the hero section of PageShell).
export function Sky({ hills = true, stars = false }) {
  const P = useTheme();
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0" style={{ background: 'var(--sky)' }} />
      <div className="absolute inset-0" style={{ background: 'var(--glow)' }} />
      {stars && [[12, 22, 2], [26, 13, 1.5], [44, 26, 2], [66, 16, 1.5], [82, 30, 2]].map(([l, t, r], i) => (
        <span key={i} className="absolute rounded-full bg-[rgba(255,245,225,.92)]" style={{ left: `${l}%`, top: `${t}%`, width: r * 2, height: r * 2 }} />
      ))}
      <div className="absolute rounded-full" style={{ top: '18%', left: '7%', width: 130, height: 34, background: 'radial-gradient(closest-side, var(--cloud), transparent)', filter: 'blur(3px)' }} />
      <div className="absolute rounded-full" style={{ top: '34%', left: '1%', width: 88, height: 24, background: 'radial-gradient(closest-side, var(--cloud), transparent)', filter: 'blur(3px)' }} />
      <div className="absolute rounded-full" style={{ top: '12%', right: '9%', width: 104, height: 28, background: 'radial-gradient(closest-side, var(--cloud), transparent)', filter: 'blur(3px)' }} />
      {hills && P.hills.map((c, i) => (
        <div key={i} className="absolute" style={{ bottom: -34 + i * -2, left: i % 2 ? '-30%' : '-18%', width: '150%', height: 96 - i * 16, background: c, borderRadius: '50% 50% 0 0 / 100% 100% 0 0', transform: `translateY(${i * 10}px)` }} />
      ))}
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: GRAIN, backgroundSize: '160px 160px', opacity: 0.09, mixBlendMode: 'soft-light' }} />
    </div>
  );
}
