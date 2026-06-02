import { useState } from 'react';
import { useTheme, HOLD } from '../../theme';

export function Eyebrow({ children, color, style }) {
  const P = useTheme();
  return (
    <p style={{ fontFamily: P.body, fontWeight: 700, fontSize: 10.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: color || P.ink2, margin: 0, ...style }}>
      {children}
    </p>
  );
}

export function SectionLabel({ children, right, style }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '0 0 12px', ...style }}>
      <Eyebrow>{children}</Eyebrow>
      {right}
    </div>
  );
}

export function Divider({ m = 20 }) {
  const P = useTheme();
  return <div style={{ height: 1, background: P.line, margin: `${m}px 0` }} />;
}

export function Btn({ children, onClick, full, variant = 'solid', size = 'md', style, disabled, type = 'button' }) {
  const P = useTheme();
  const pad = size === 'sm' ? '8px 14px' : '12px 18px';
  const fs = size === 'sm' ? 13 : 14.5;
  const rad = size === 'sm' ? 10 : 13;
  const base = {
    fontFamily: P.body, fontWeight: 700, fontSize: fs, padding: pad, borderRadius: rad,
    cursor: disabled ? 'default' : 'pointer', width: full ? '100%' : 'auto',
    whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center',
    justifyContent: 'center', gap: 7, opacity: disabled ? .5 : 1,
    transition: 'all .15s', boxSizing: 'border-box',
  };
  const variants = {
    solid:  { color: '#fff', background: P.primary, border: 'none', boxShadow: `0 6px 15px ${P.primary}3a` },
    ghost:  { color: P.ink, background: 'rgba(255,255,255,.55)', border: `1px solid ${P.line}` },
    danger: { color: '#fff', background: '#bb5b46', border: 'none' },
    accent: { color: '#fff', background: P.accent, border: 'none' },
  };
  return (
    <button type={type} onClick={disabled ? undefined : onClick} style={{ ...base, ...variants[variant], ...style }}>
      {children}
    </button>
  );
}

export function Chip({ children, tone = 'soft', style }) {
  const P = useTheme();
  const map = {
    soft:      { bg: 'rgba(255,255,255,.6)',          fg: P.ink2,   bd: P.line        },
    accent:    { bg: P.primarySoft,                   fg: P.primaryD, bd: 'transparent' },
    open:      { bg: P.goodBg,                        fg: P.good,   bd: 'transparent' },
    closed:    { bg: 'rgba(0,0,0,.05)',               fg: P.ink3,   bd: 'transparent' },
    upcoming:  { bg: P.infoBg,                        fg: P.info,   bd: 'transparent' },
    qualifier: { bg: P.primarySoft,                   fg: P.primaryD, bd: 'transparent' },
    finals:    { bg: P.infoBg,                        fg: P.info,   bd: 'transparent' },
    you:       { bg: P.primarySoft,                   fg: P.primaryD, bd: 'transparent' },
    good:      { bg: P.goodBg,                        fg: P.good,   bd: 'transparent' },
    info:      { bg: P.infoBg,                        fg: P.info,   bd: 'transparent' },
    advances:  { bg: P.infoBg,                        fg: P.info,   bd: 'transparent' },
    danger:    { bg: 'rgba(187,91,70,.12)',            fg: '#bb5b46', bd: 'transparent' },
  };
  const t = map[tone] || map.soft;
  return (
    <span style={{ fontFamily: P.body, fontWeight: 600, fontSize: 11.5, padding: '3px 11px', borderRadius: 999, background: t.bg, color: t.fg, border: `1px solid ${t.bd}`, whiteSpace: 'nowrap', ...style }}>
      {children}
    </span>
  );
}

export function Card({ children, style, onClick, hover, border }) {
  const P = useTheme();
  const [h, setH] = useState(false);
  const borderColor = border || (hover && h ? P.primary : P.line);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{ background: P.card, border: `1px solid ${borderColor}`, borderRadius: 15, boxShadow: '0 4px 14px rgba(40,40,30,.06)', transition: 'border-color .15s', cursor: onClick ? 'pointer' : 'default', ...style }}
    >
      {children}
    </div>
  );
}

export function Field({ label, value, onChange, placeholder, type = 'text', textarea, hint, optional, style }) {
  const P = useTheme();
  const inputStyle = { width: '100%', background: P.card, border: `1px solid ${P.line}`, borderRadius: 11, padding: '11px 14px', fontFamily: P.body, fontWeight: 500, fontSize: 14.5, color: P.ink, outline: 'none', boxSizing: 'border-box', resize: 'none' };
  return (
    <div style={{ marginBottom: 16, ...style }}>
      {label && (
        <label style={{ display: 'block', fontFamily: P.body, fontWeight: 700, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: P.ink2, marginBottom: 6 }}>
          {label}{optional && <span style={{ color: P.ink3, fontWeight: 600 }}> · optional</span>}
        </label>
      )}
      {textarea
        ? <textarea value={value} placeholder={placeholder} onChange={onChange && (e => onChange(e.target.value))} style={{ ...inputStyle, height: 80 }} />
        : <input type={type} value={value} placeholder={placeholder} onChange={onChange && (e => onChange(e.target.value))} style={inputStyle} />}
      {hint && <p style={{ fontFamily: P.serif, fontStyle: 'italic', fontSize: 12.5, color: P.ink3, margin: '6px 0 0' }}>{hint}</p>}
    </div>
  );
}

export function Toggle({ on, onChange }) {
  const P = useTheme();
  return (
    <div
      onClick={() => onChange && onChange(!on)}
      style={{ width: 44, height: 24, borderRadius: 999, background: on ? P.primary : 'rgba(0,0,0,.16)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 2, transition: 'background .15s', flexShrink: 0 }}
    >
      <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', transform: on ? 'translateX(20px)' : 'translateX(0)', transition: 'transform .18s', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
    </div>
  );
}

export function Avatar({ name, size = 34, onClick }) {
  const P = useTheme();
  return (
    <div
      onClick={onClick}
      style={{ width: size, height: size, borderRadius: '50%', background: 'rgba(255,255,255,.72)', border: `1px solid ${P.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: P.body, fontWeight: 700, fontSize: Math.round(size * 0.36), color: P.ink, flexShrink: 0, cursor: onClick ? 'pointer' : 'default' }}
    >
      {(name || '').slice(0, 2).toUpperCase()}
    </div>
  );
}

export function Stars({ n, size = 13, onPick }) {
  const P = useTheme();
  return (
    <span style={{ display: 'inline-flex', gap: 1, letterSpacing: 1, fontSize: size }}>
      {[1, 2, 3, 4, 5].map(s => (
        <span key={s} onClick={onPick ? () => onPick(s) : undefined} style={{ color: s <= n ? P.primary : 'rgba(0,0,0,.13)', cursor: onPick ? 'pointer' : 'default', lineHeight: 1 }}>★</span>
      ))}
    </span>
  );
}

export function Modal({ title, subtitle, children, onClose }) {
  const P = useTheme();
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(30,24,20,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 330, background: P.sheet, borderRadius: 18, border: `1px solid ${P.line}`, padding: '22px 22px 24px', boxShadow: '0 24px 60px rgba(20,16,12,.4)' }}>
        <h2 style={{ fontFamily: P.disp, fontWeight: 400, fontSize: 23, margin: 0, color: P.ink }}>{title}</h2>
        {subtitle && <p style={{ fontFamily: P.serif, fontStyle: 'italic', fontSize: 14, color: P.ink2, margin: '4px 0 0' }}>{subtitle}</p>}
        <div style={{ marginTop: 16 }}>{children}</div>
      </div>
    </div>
  );
}

export function GradePills({ grades, value, onPick }) {
  const P = useTheme();
  return (
    <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
      {grades.map(g => {
        const sel = value === g;
        return (
          <button key={g} type="button" onClick={() => onPick && onPick(g)} style={{ fontFamily: P.body, fontWeight: 700, fontSize: 13, padding: '7px 13px', borderRadius: 999, cursor: 'pointer', border: `1px solid ${sel ? P.primary : P.line}`, background: sel ? P.primary : P.card, color: sel ? '#fff' : P.ink, boxShadow: sel ? `0 4px 11px ${P.primary}3a` : 'none', transition: 'all .12s' }}>
            V{g}
          </button>
        );
      })}
    </div>
  );
}

export function ColourSwatches({ value, onPick }) {
  const P = useTheme();
  return (
    <div style={{ display: 'flex', gap: 11, flexWrap: 'wrap' }}>
      {Object.entries(HOLD).map(([name, hex]) => {
        const sel = value === name;
        return (
          <button key={name} type="button" onClick={() => onPick && onPick(name)} title={name} style={{ width: 32, height: 32, borderRadius: '50%', background: hex, cursor: 'pointer', border: `2.5px solid ${sel ? P.ink : 'transparent'}`, transform: sel ? 'scale(1.12)' : 'none', transition: 'all .12s', boxShadow: '0 2px 5px rgba(0,0,0,.15)' }} />
        );
      })}
    </div>
  );
}

export function Tabs({ tabs, active, onChange }) {
  const P = useTheme();
  return (
    <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${P.line}`, marginBottom: 22 }}>
      {tabs.map(t => {
        const sel = active === t.key;
        return (
          <button key={t.key} type="button" onClick={() => onChange(t.key)} style={{ background: 'none', border: 'none', borderBottom: `2px solid ${sel ? P.primary : 'transparent'}`, marginBottom: -1, cursor: 'pointer', padding: '9px 12px', fontFamily: P.body, fontWeight: sel ? 700 : 600, fontSize: 13.5, color: sel ? P.ink : P.ink2, transition: 'all .12s' }}>
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

export function Empty({ children }) {
  const P = useTheme();
  return <p style={{ fontFamily: P.serif, fontStyle: 'italic', fontSize: 15, color: P.ink3, textAlign: 'center', padding: '28px 0' }}>{children}</p>;
}

export function ErrorScreen({ message, onRetry }) {
  const P = useTheme();
  return (
    <div style={{ minHeight: '100vh', background: P.sheet, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', padding: '0 24px' }}>
        <p style={{ fontFamily: P.serif, fontStyle: 'italic', color: '#bb5b46', fontSize: 14, marginBottom: 16 }}>{message}</p>
        {onRetry && (
          <button onClick={onRetry} style={{ fontFamily: P.body, fontWeight: 700, fontSize: 13.5, padding: '10px 20px', borderRadius: 12, background: P.primary, color: '#fff', border: 'none', cursor: 'pointer' }}>
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
