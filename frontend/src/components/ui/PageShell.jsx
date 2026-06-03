import { useNavigate } from 'react-router-dom';
import { useTheme, useThemeToggle } from '../../theme';
import { Sky } from './Sky';
import { getDecodedToken } from '../../auth';
import api from '../../api';
import { ACCESS_TOKEN, REFRESH_TOKEN } from '../../constants';

function TopBar({ back, backLabel, backPath, onBack }) {
  const P = useTheme();
  const toggleTheme = useThemeToggle();
  const navigate = useNavigate();
  const decoded = getDecodedToken();
  const username = decoded?.username ?? '';
  const isSetterUser = decoded?.is_setter ?? false;
  const initials = username.slice(0, 2).toUpperCase();

  const handleBack = () => {
    if (onBack) { onBack(); return; }
    if (backPath) navigate(backPath);
    else navigate(-1);
  };

  const handleLogout = async () => {
    const refresh = localStorage.getItem(REFRESH_TOKEN);
    try { await api.post('/api/token/blacklist/', { refresh }); } catch {}
    localStorage.removeItem(ACCESS_TOKEN);
    localStorage.removeItem(REFRESH_TOKEN);
    navigate('/login');
  };

  return (
    <div className="flex items-center justify-between min-h-[34px]">
      {back ? (
        <button
          onClick={handleBack}
          className="bg-transparent border-0 cursor-pointer p-0 font-body font-semibold text-[13.5px] text-sky-text inline-flex items-center gap-1"
        >
          <span className="text-[17px] leading-none">‹</span> {backLabel || 'Back'}
        </button>
      ) : (
        <span className="font-display text-xl text-sky-text" style={{ letterSpacing: 0.3 }}>Beta Board</span>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          title={P.key === 'dusk' ? 'Switch to day' : 'Switch to night'}
          className="bg-white/22 rounded-full cursor-pointer px-[10px] py-1 text-sm leading-none inline-flex items-center gap-[5px] transition-colors duration-150"
          style={{ border: 'var(--pill-border)' }}
        >
          <span>{P.key === 'dusk' ? '☀' : '☾'}</span>
          <span className="font-body font-semibold text-[11px] text-sky-text">
            {P.key === 'dusk' ? 'Day' : 'Night'}
          </span>
        </button>

        {isSetterUser && (
          <span
            className="font-body font-bold text-[10px] tracking-[0.1em] uppercase px-2 py-[3px] rounded-full bg-white/28 text-sky-text"
            style={{ border: 'var(--pill-border)' }}
          >
            Setter
          </span>
        )}
        <div
          onClick={() => navigate('/profile')}
          className="w-8 h-8 rounded-full bg-white/72 border border-line flex items-center justify-center font-body font-bold text-xs text-ink cursor-pointer"
        >
          {initials}
        </div>
        <button
          onClick={handleLogout}
          className="bg-transparent border-0 cursor-pointer font-body font-semibold text-xs text-sky-text opacity-85"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

export function PageShell({ back, backLabel, backPath, onBack, eyebrow, title, titleItalic, right, heroHeight = 152, children }) {
  const P = useTheme();
  return (
    <div className="min-h-screen bg-sheet">
      <div className="relative" style={{ minHeight: heroHeight }}>
        <Sky stars={P.key === 'dusk'} />
        <div className="relative max-w-[640px] mx-auto px-5 pt-4">
          <TopBar back={back} backLabel={backLabel} backPath={backPath} onBack={onBack} />
          <div className="mt-4 pb-[26px]">
            {eyebrow && (
              <p className="font-body font-bold text-[10.5px] tracking-[0.16em] uppercase text-sky-text opacity-[.92] m-0 mb-[7px]">
                {eyebrow}
              </p>
            )}
            {title && (
              <h1
                className="font-display font-normal text-[30px] leading-[1.05] m-0 text-sky-text"
                style={{ textShadow: 'var(--title-shadow)' }}
              >
                {title}{titleItalic && <> <span className="font-serif italic">{titleItalic}</span></>}
              </h1>
            )}
            {right}
          </div>
        </div>
      </div>
      <div className="relative -mt-5 bg-sheet rounded-[22px_22px_0_0] shadow-[0_-8px_24px_rgba(40,40,30,.10)] min-h-[200px]">
        <div className="max-w-[640px] mx-auto px-5 pt-[22px] pb-10">
          {children}
        </div>
      </div>
    </div>
  );
}

export function AuthScaffold({ headline, headlineItalic, children }) {
  const P = useTheme();
  return (
    <div className="min-h-screen bg-sheet flex flex-col">
      <div className="relative">
        <Sky stars={P.key === 'dusk'} />
        <div className="relative max-w-[480px] mx-auto px-6 pt-[22px] pb-[30px]">
          <div className="flex justify-between items-center">
            <span className="font-display text-xl text-sky-text" style={{ letterSpacing: 0.3 }}>Beta Board</span>
            <span className="font-serif italic text-[13px] text-sky-text opacity-85">est. 2026</span>
          </div>
          <div className="mt-5 rounded-[18px] overflow-hidden border-4 border-white/70 shadow-[0_14px_32px_rgba(40,40,30,.28)]">
            <img src="/LoginRegisterImage.jpg" alt="climbing" className="w-full block object-cover" style={{ height: 146 }} />
          </div>
          <h1
            className="font-display font-normal text-[30px] leading-[1.08] mt-[18px] mb-0 text-sky-text"
            style={{ textShadow: 'var(--title-shadow)' }}
          >
            {headline}{headlineItalic && <><br /><span className="font-serif italic">{headlineItalic}</span></>}
          </h1>
        </div>
      </div>
      <div className="relative -mt-5 bg-sheet rounded-[22px_22px_0_0] shadow-[0_-8px_24px_rgba(40,40,30,.12)] flex-1">
        <div className="max-w-[480px] mx-auto px-6 pt-6 pb-[30px]">
          {children}
        </div>
      </div>
    </div>
  );
}
