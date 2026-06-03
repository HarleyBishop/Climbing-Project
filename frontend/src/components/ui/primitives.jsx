import { useState } from 'react';
import { HOLD } from '../../theme';

export function Eyebrow({ children, color, style }) {
  return (
    <p
      className="font-body font-bold text-[10.5px] tracking-[0.16em] uppercase m-0 text-ink2"
      style={{ ...(color && { color }), ...style }}
    >
      {children}
    </p>
  );
}

export function SectionLabel({ children, right, style }) {
  return (
    <div className="flex items-baseline justify-between mb-3" style={style}>
      <Eyebrow>{children}</Eyebrow>
      {right}
    </div>
  );
}

export function Divider({ m = 20 }) {
  return <div className="h-px bg-line" style={{ margin: `${m}px 0` }} />;
}

export function Btn({ children, onClick, full, variant = 'solid', size = 'md', style, disabled, type = 'button' }) {
  const base = 'font-body font-bold inline-flex items-center justify-center gap-[7px] whitespace-nowrap transition-all duration-150 box-border';
  const sizes = {
    sm: 'text-[13px] px-[14px] py-2 rounded-[10px]',
    md: 'text-[14.5px] px-[18px] py-3 rounded-[13px]',
  };
  const variants = {
    solid:  'text-white bg-primary border-0 shadow-[0_6px_15px_color-mix(in_srgb,var(--primary)_23%,transparent)]',
    ghost:  'text-ink bg-white/55 border border-line',
    danger: 'text-white bg-[#bb5b46] border-0',
    accent: 'text-white bg-accent border-0',
  };
  return (
    <button
      type={type}
      onClick={disabled ? undefined : onClick}
      className={`${base} ${sizes[size] || sizes.md} ${variants[variant]} ${full ? 'w-full' : ''} ${disabled ? 'opacity-50 cursor-default' : 'cursor-pointer'}`}
      style={style}
    >
      {children}
    </button>
  );
}

export function Chip({ children, tone = 'soft', style }) {
  const toneClass = {
    soft:      'bg-white/60 text-ink2 border-line',
    accent:    'bg-primary-soft text-primary-d border-transparent',
    open:      'bg-good-bg text-good border-transparent',
    closed:    'bg-black/5 text-ink3 border-transparent',
    upcoming:  'bg-info-bg text-info border-transparent',
    qualifier: 'bg-primary-soft text-primary-d border-transparent',
    finals:    'bg-info-bg text-info border-transparent',
    you:       'bg-primary-soft text-primary-d border-transparent',
    good:      'bg-good-bg text-good border-transparent',
    info:      'bg-info-bg text-info border-transparent',
    advances:  'bg-info-bg text-info border-transparent',
    danger:    'bg-[rgba(187,91,70,.12)] text-danger border-transparent',
  };
  return (
    <span
      className={`font-body font-semibold text-[11.5px] px-[11px] py-[3px] rounded-full border whitespace-nowrap ${toneClass[tone] || toneClass.soft}`}
      style={style}
    >
      {children}
    </span>
  );
}

export function Card({ children, style, onClick, hover, border }) {
  return (
    <div
      onClick={onClick}
      className={`bg-card border border-line rounded-[15px] shadow-[0_4px_14px_rgba(40,40,30,.06)] transition-colors duration-150 ${onClick ? 'cursor-pointer' : ''} ${hover ? 'hover:border-primary' : ''}`}
      style={{ ...(border && { borderColor: border }), ...style }}
    >
      {children}
    </div>
  );
}

export function Field({ label, value, onChange, placeholder, type = 'text', textarea, hint, optional, style }) {
  const inputClass = 'w-full bg-card border border-line rounded-[11px] px-[14px] py-[11px] font-body font-medium text-[14.5px] text-ink outline-none box-border resize-none';
  return (
    <div className="mb-4" style={style}>
      {label && (
        <label className="block font-body font-bold text-[10px] tracking-[0.14em] uppercase text-ink2 mb-[6px]">
          {label}{optional && <span className="text-ink3 font-semibold"> · optional</span>}
        </label>
      )}
      {textarea
        ? <textarea value={value} placeholder={placeholder} onChange={onChange && (e => onChange(e.target.value))} className={`${inputClass} h-20`} />
        : <input type={type} value={value} placeholder={placeholder} onChange={onChange && (e => onChange(e.target.value))} className={inputClass} />
      }
      {hint && <p className="font-serif italic text-[12.5px] text-ink3 mt-[6px] mb-0">{hint}</p>}
    </div>
  );
}

export function Toggle({ on, onChange }) {
  return (
    <div
      onClick={() => onChange && onChange(!on)}
      className="w-11 h-6 rounded-full cursor-pointer flex items-center p-[2px] transition-colors duration-150 shrink-0"
      style={{ background: on ? 'var(--primary)' : 'rgba(0,0,0,.16)' }}
    >
      <div
        className="w-5 h-5 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,.2)] transition-transform duration-[180ms]"
        style={{ transform: on ? 'translateX(20px)' : 'translateX(0)' }}
      />
    </div>
  );
}

export function Avatar({ name, size = 34, onClick }) {
  return (
    <div
      onClick={onClick}
      className="rounded-full bg-white/72 border border-line flex items-center justify-center font-body font-bold text-ink shrink-0"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36), cursor: onClick ? 'pointer' : 'default' }}
    >
      {(name || '').slice(0, 2).toUpperCase()}
    </div>
  );
}

export function Stars({ n, size = 13, onPick }) {
  return (
    <span className="inline-flex gap-px" style={{ letterSpacing: 1, fontSize: size }}>
      {[1, 2, 3, 4, 5].map(s => (
        <span
          key={s}
          onClick={onPick ? () => onPick(s) : undefined}
          className="leading-none"
          style={{ color: s <= n ? 'var(--primary)' : 'rgba(0,0,0,.13)', cursor: onPick ? 'pointer' : 'default' }}
        >★</span>
      ))}
    </span>
  );
}

export function Modal({ title, subtitle, children, onClose }) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[60] bg-[rgba(30,24,20,.5)] flex items-center justify-center p-5"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="w-full max-w-[330px] bg-sheet rounded-[18px] border border-line px-[22px] pt-[22px] pb-6 shadow-[0_24px_60px_rgba(20,16,12,.4)]"
      >
        <h2 className="font-display font-normal text-[23px] m-0 text-ink">{title}</h2>
        {subtitle && <p className="font-serif italic text-sm text-ink2 mt-1 mb-0">{subtitle}</p>}
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

export function GradePills({ grades, value, onPick }) {
  return (
    <div className="flex gap-[7px] flex-wrap">
      {grades.map(g => {
        const sel = value === g;
        return (
          <button
            key={g}
            type="button"
            onClick={() => onPick && onPick(g)}
            className={`font-body font-bold text-[13px] px-[13px] py-[7px] rounded-full cursor-pointer border transition-all duration-[120ms] ${
              sel
                ? 'border-primary bg-primary text-white shadow-[0_4px_11px_color-mix(in_srgb,var(--primary)_23%,transparent)]'
                : 'border-line bg-card text-ink'
            }`}
          >
            V{g}
          </button>
        );
      })}
    </div>
  );
}

export function ColourSwatches({ value, onPick }) {
  return (
    <div className="flex gap-[11px] flex-wrap">
      {Object.entries(HOLD).map(([name, hex]) => {
        const sel = value === name;
        return (
          <button
            key={name}
            type="button"
            onClick={() => onPick && onPick(name)}
            title={name}
            className="w-8 h-8 rounded-full cursor-pointer transition-all duration-[120ms] shadow-[0_2px_5px_rgba(0,0,0,.15)]"
            style={{
              background: hex,
              border: `2.5px solid ${sel ? 'var(--ink)' : 'transparent'}`,
              transform: sel ? 'scale(1.12)' : 'none',
            }}
          />
        );
      })}
    </div>
  );
}

export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 border-b border-line mb-[22px]">
      {tabs.map(t => {
        const sel = active === t.key;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            className={`bg-transparent border-0 border-b-2 -mb-px cursor-pointer px-3 py-[9px] font-body text-[13.5px] transition-all duration-[120ms] ${
              sel ? 'border-b-primary font-bold text-ink' : 'border-b-transparent font-semibold text-ink2'
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

export function Empty({ children }) {
  return <p className="font-serif italic text-[15px] text-ink3 text-center py-7">{children}</p>;
}

export function ErrorScreen({ message, onRetry }) {
  return (
    <div className="min-h-screen bg-sheet flex items-center justify-center">
      <div className="text-center px-6">
        <p className="font-serif italic text-danger text-sm mb-4">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="font-body font-bold text-[13.5px] px-5 py-[10px] rounded-[12px] bg-primary text-white border-0 cursor-pointer"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
