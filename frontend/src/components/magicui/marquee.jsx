// Ported from Magic UI (MIT) — https://magicui.design/docs/components/marquee
// Infinite scrolling row. Pure CSS: the children are repeated `repeat` times
// and each copy slides left by its own width + gap, so the loop is seamless.
// Keyframes live in style.css (--animate-marquee).
// Changes from the original: TypeScript types removed; logic unchanged.
// Speed is set per use via [--duration:30s]; fade the edges with Tailwind's
// mask-x-* utilities (see AuthScaffold in ui/PageShell.jsx).
import { cn } from '../../lib/utils';

export function Marquee({
  className,
  reverse = false,
  pauseOnHover = false,
  children,
  vertical = false,
  repeat = 4,
  ...props
}) {
  return (
    <div
      {...props}
      className={cn(
        'group flex gap-(--gap) overflow-hidden p-2 [--duration:40s] [--gap:1rem]',
        { 'flex-row': !vertical, 'flex-col': vertical },
        className
      )}
    >
      {Array(repeat)
        .fill(0)
        .map((_, i) => (
          <div
            key={i}
            className={cn('flex shrink-0 justify-around gap-(--gap)', {
              'animate-marquee flex-row': !vertical,
              'animate-marquee-vertical flex-col': vertical,
              'group-hover:[animation-play-state:paused]': pauseOnHover,
              '[animation-direction:reverse]': reverse,
            })}
          >
            {children}
          </div>
        ))}
    </div>
  );
}
