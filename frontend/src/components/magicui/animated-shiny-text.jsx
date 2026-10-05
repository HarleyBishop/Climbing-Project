// Ported from Magic UI (MIT) — https://magicui.design/docs/components/animated-shiny-text
// A highlight sweeps across the text every few seconds. The gradient is
// clipped to the text (bg-clip-text) and its position is animated by the
// shiny-text keyframes in style.css.
// Changes from the original: TypeScript types removed; dark: classes dropped;
// base colour switched to our `muted` token; removed mx-auto so it sits inline.
import { cn } from '../../lib/utils';

export function AnimatedShinyText({ children, className, shimmerWidth = 100, ...props }) {
  return (
    <span
      style={{ '--shiny-width': `${shimmerWidth}px` }}
      className={cn(
        'max-w-md text-muted/80',
        // Shine effect
        'animate-shiny-text bg-size-[var(--shiny-width)_100%] bg-clip-text bg-position-[0_0] bg-no-repeat [transition:background-position_1s_cubic-bezier(.6,.6,0,1)_infinite]',
        // Shine gradient
        'bg-linear-to-r from-transparent via-black/80 via-50% to-transparent',
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
