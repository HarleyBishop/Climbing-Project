// Adapted from Magic UI (MIT) — https://magicui.design/docs/components/bento-grid
// Kept: the grid, the layered card shadow, and the hover behaviour (content
// lifts, CTA slides up). Changed: links use react-router instead of <a href>,
// the icon is optional, and the Radix icon + shadcn Button deps are replaced
// with plain markup.
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';

export function BentoGrid({ children, className, ...props }) {
  return (
    <div className={cn('grid w-full auto-rows-[14rem] grid-cols-3 gap-4', className)} {...props}>
      {children}
    </div>
  );
}

export function BentoCard({ name, className, background, description, to, cta, ...props }) {
  return (
    <Link
      to={to}
      className={cn(
        'group relative col-span-3 flex flex-col justify-end overflow-hidden rounded-3xl bg-white',
        '[box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]',
        className
      )}
      {...props}
    >
      <div className="absolute inset-0">{background}</div>
      <div className="pointer-events-none relative z-10 flex transform-gpu flex-col gap-1 p-6 transition-all duration-300 group-hover:-translate-y-8">
        <h3 className="text-xl font-semibold text-ink">{name}</h3>
        <p className="max-w-lg text-sm text-muted">{description}</p>
      </div>
      <div className="pointer-events-none absolute bottom-0 z-10 flex w-full translate-y-8 transform-gpu items-center p-6 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
        <span className="text-sm font-medium text-accent">{cta} →</span>
      </div>
      <div className="pointer-events-none absolute inset-0 transform-gpu transition-all duration-300 group-hover:bg-black/[.02]" />
    </Link>
  );
}
