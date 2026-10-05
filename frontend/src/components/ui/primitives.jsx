import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { HOLD } from '../../lib/holds';

// Shared building blocks. Every component accepts `className`, merged with
// cn() so callers can override spacing/layout without inline styles.
// Colours come from the tokens in styles/style.css; design conventions and
// the Magic UI porting process are documented in frontend/README.md.

export function Eyebrow({ children, className }) {
  return <p className={cn('text-xs font-semibold uppercase tracking-wider text-muted', className)}>{children}</p>;
}

export function SectionLabel({ children, right, className }) {
  return (
    <div className={cn('mb-4 flex items-baseline justify-between', className)}>
      <h2 className="text-xl font-semibold text-ink">{children}</h2>
      {right && <span className="text-sm text-muted">{right}</span>}
    </div>
  );
}

export function Divider({ className }) {
  return <hr className={cn('my-10 border-line', className)} />;
}

const BTN_SIZES = {
  sm: 'h-8 px-4 text-sm',
  md: 'h-11 px-6 text-[15px]',
};
const BTN_VARIANTS = {
  solid: 'bg-ink text-white hover:bg-ink/85',
  accent: 'bg-accent text-white hover:bg-accent/90',
  ghost: 'bg-white text-ink ring-1 ring-line hover:bg-surface',
  danger: 'bg-danger text-white hover:bg-danger/90',
};

export function Btn({ children, onClick, full, variant = 'solid', size = 'md', className, disabled, type = 'button' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex cursor-pointer items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap transition active:scale-[.98] disabled:cursor-default disabled:opacity-40',
        BTN_SIZES[size],
        BTN_VARIANTS[variant],
        full && 'w-full',
        className
      )}
    >
      {children}
    </button>
  );
}

const CHIP_TONES = {
  soft: 'bg-surface text-muted',
  accent: 'bg-accent-soft text-accent',
  you: 'bg-accent-soft text-accent',
  qualifier: 'bg-accent-soft text-accent',
  open: 'bg-good-soft text-good',
  good: 'bg-good-soft text-good',
  upcoming: 'bg-info-soft text-info',
  finals: 'bg-info-soft text-info',
  info: 'bg-info-soft text-info',
  advances: 'bg-info-soft text-info',
  closed: 'bg-surface text-faint',
  danger: 'bg-danger-soft text-danger',
};

export function Chip({ children, tone = 'soft', className }) {
  return (
    <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap', CHIP_TONES[tone] || CHIP_TONES.soft, className)}>
      {children}
    </span>
  );
}

// White rounded card with the soft layered shadow from Magic UI's bento card.
// `onClick` makes it interactive: it lifts slightly on hover.
export function Card({ children, className, onClick }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-2xl bg-white [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.04),0_8px_16px_rgba(0,0,0,.04)]',
        onClick && 'cursor-pointer transition duration-200 hover:-translate-y-0.5 hover:[box-shadow:0_0_0_1px_rgba(0,0,0,.04),0_4px_8px_rgba(0,0,0,.05),0_16px_32px_rgba(0,0,0,.08)]',
        className
      )}
    >
      {children}
    </div>
  );
}

export const inputClass =
  'w-full rounded-xl bg-white px-4 py-3 text-[15px] text-ink ring-1 ring-line outline-none transition placeholder:text-faint focus:ring-2 focus:ring-accent';

export function Field({ label, value, onChange, placeholder, type = 'text', textarea, hint, optional, className }) {
  return (
    <label className={cn('block', className)}>
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-ink">
          {label}{optional && <span className="font-normal text-faint"> · optional</span>}
        </span>
      )}
      {textarea
        ? <textarea value={value} placeholder={placeholder} onChange={e => onChange?.(e.target.value)} className={cn(inputClass, 'h-24 resize-none')} />
        : <input type={type} value={value} placeholder={placeholder} onChange={e => onChange?.(e.target.value)} className={inputClass} />}
      {hint && <span className="mt-1.5 block text-sm text-muted">{hint}</span>}
    </label>
  );
}

// iOS-style switch.
export function Toggle({ on, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange?.(!on)}
      className={cn('flex h-[31px] w-[51px] shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors', on ? 'bg-good' : 'bg-line')}
    >
      <span className={cn('size-[27px] rounded-full bg-white shadow transition-transform', on && 'translate-x-5')} />
    </button>
  );
}

export function Avatar({ name, size = 36, onClick, className }) {
  return (
    <div
      onClick={onClick}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
      className={cn('flex shrink-0 items-center justify-center rounded-full bg-linear-to-br from-neutral-200 to-neutral-300 font-semibold text-ink', onClick && 'cursor-pointer', className)}
    >
      {(name || '').slice(0, 2).toUpperCase()}
    </div>
  );
}

export function Stars({ n, size = 14, onPick }) {
  return (
    <span className="inline-flex gap-0.5" style={{ fontSize: size }}>
      {[1, 2, 3, 4, 5].map(s => (
        <span
          key={s}
          onClick={onPick ? () => onPick(s) : undefined}
          className={cn('leading-none', s <= n ? 'text-accent' : 'text-line', onPick && 'cursor-pointer')}
        >★</span>
      ))}
    </span>
  );
}

// Sheet that springs in over a blurred backdrop. Portalled to <body> because
// page content sits inside BlurFade, whose transform/filter would otherwise
// become the containing block for `position: fixed` and misplace the modal.
export function Modal({ title, subtitle, children, onClose }) {
  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 backdrop-blur-sm sm:items-center"
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', damping: 26, stiffness: 320 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl"
      >
        <h2 className="text-2xl font-semibold">{title}</h2>
        {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
        <div className="mt-6 space-y-4">{children}</div>
      </motion.div>
    </motion.div>,
    document.body
  );
}

export function GradePills({ grades, value, onPick }) {
  return (
    <div className="flex flex-wrap gap-2">
      {grades.map(g => (
        <button
          key={g}
          type="button"
          onClick={() => onPick?.(g)}
          className={cn(
            'h-9 min-w-12 cursor-pointer rounded-full px-3 text-sm font-medium transition',
            value === g ? 'bg-ink text-white' : 'bg-white text-ink ring-1 ring-line hover:bg-surface'
          )}
        >
          V{g}
        </button>
      ))}
    </div>
  );
}

export function ColourSwatches({ value, onPick }) {
  return (
    <div className="flex flex-wrap gap-3">
      {Object.entries(HOLD).map(([name, hex]) => (
        <button
          key={name}
          type="button"
          title={name}
          onClick={() => onPick?.(name)}
          style={{ background: hex }}
          className={cn(
            'size-9 cursor-pointer rounded-full ring-offset-2 transition',
            value === name ? 'scale-110 ring-2 ring-ink' : 'hover:scale-105'
          )}
        />
      ))}
    </div>
  );
}

// Apple-style segmented control. The selected background is a single motion
// element with a shared layoutId, so it slides between options instead of
// jumping. `layoutId` must be unique per control on the page.
export function Segmented({ options, value, onChange, layoutId = 'segmented', className }) {
  return (
    <div className={cn('inline-flex w-full rounded-full bg-black/5 p-1', className)}>
      {options.map(o => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          className={cn('relative flex-1 cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium transition-colors', value === o.key ? 'text-ink' : 'text-muted hover:text-ink')}
        >
          {value === o.key && (
            <motion.span layoutId={layoutId} transition={{ type: 'spring', damping: 30, stiffness: 400 }} className="absolute inset-0 rounded-full bg-white shadow-sm" />
          )}
          <span className="relative">{o.label}</span>
        </button>
      ))}
    </div>
  );
}

// Tabs are a segmented control with tab-shaped data ({ key, label }).
export function Tabs({ tabs, active, onChange }) {
  return <Segmented options={tabs} value={active} onChange={onChange} layoutId="tabs" className="mb-8" />;
}

// Big number + small label, used for stat rows.
export function Stat({ value, label, className }) {
  return (
    <div className={cn('rounded-2xl bg-white px-4 py-5 text-center ring-1 ring-line/60', className)}>
      <p className="text-3xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-xs font-medium text-muted">{label}</p>
    </div>
  );
}

// Thin bar that grows to `pct` when scrolled into view.
export function ProgressBar({ pct, colour }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-black/5">
      <motion.div
        initial={{ width: 0 }}
        whileInView={{ width: `${pct}%` }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="h-full rounded-full bg-accent"
        style={colour && { background: colour }}
      />
    </div>
  );
}

export function Empty({ children, className }) {
  return <p className={cn('py-10 text-center text-muted', className)}>{children}</p>;
}

export function ErrorText({ children }) {
  return <p className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">{children}</p>;
}

export function ErrorScreen({ message, onRetry }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-6 text-center">
      <div>
        <p className="mb-5 text-danger">{message}</p>
        {onRetry && <Btn onClick={onRetry}>Try again</Btn>}
      </div>
    </div>
  );
}
