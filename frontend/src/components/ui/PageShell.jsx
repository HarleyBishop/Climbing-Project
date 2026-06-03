import { useNavigate } from 'react-router-dom';
import { useTheme, useThemeToggle } from '../../theme';
import { Sky } from './Sky';
import { getDecodedToken } from '../../auth';
import api from '../../api';
import { ACCESS_TOKEN, REFRESH_TOKEN } from '../../constants';

// The top bar sits over the sky. Includes:
// - Left: wordmark (home) or back chevron (deep pages)
// - Right: day/night toggle, setter badge, avatar (→ profile), sign-out
function TopBar({ back, backLabel, backPath, onBack }) {
  const P = useTheme();
  const toggleTheme = useThemeToggle();
  const navigate = useNavigate();
  const decoded = getDecodedToken();
  const username = decoded?.username ?? '';
  const isSetterUser = decoded?.is_setter ?? false;
  const initials = username.slice(0, 2).toUpperCase();
  const tcol = P.skyText;

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

  // Sky-aware border so the toggle pill looks right against both light and dark skies.
  const pillBorder = P.key === 'dusk'
    ? '1px solid rgba(255,255,255,.25)'
    : '1px solid rgba(58,67,41,.22)';

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 34 }}>
      {back ? (
        <button onClick={handleBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: P.body, fontWeight: 600, fontSize: 13.5, color: tcol, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 17, lineHeight: 1 }}>‹</span> {backLabel || 'Back'}
        </button>
      ) : (
        <span style={{ fontFamily: P.disp, fontSize: 20, color: tcol, letterSpacing: 0.3 }}>Beta Board</span>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Day / Night toggle — sun for Meadow, crescent for Dusk */}
        <button
          onClick={toggleTheme}
          title={P.key === 'dusk' ? 'Switch to day' : 'Switch to night'}
          style={{ background: 'rgba(255,255,255,.22)', border: pillBorder, borderRadius: 999, cursor: 'pointer', padding: '4px 10px', fontSize: 14, lineHeight: 1, display: 'inline-flex', alignItems: 'center', gap: 5, transition: 'background .15s' }}
        >
          <span>{P.key === 'dusk' ? '☀' : '☾'}</span>
          <span style={{ fontFamily: P.body, fontWeight: 600, fontSize: 11, color: tcol }}>
            {P.key === 'dusk' ? 'Day' : 'Night'}
          </span>
        </button>

        {isSetterUser && (
          <span style={{ fontFamily: P.body, fontWeight: 700, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: 999, background: 'rgba(255,255,255,.28)', color: tcol, border: pillBorder }}>
            Setter
          </span>
        )}
        <div
          onClick={() => navigate('/profile')}
          style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,.72)', border: `1px solid ${P.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: P.body, fontWeight: 700, fontSize: 12, color: P.ink, cursor: 'pointer' }}
        >
          {initials}
        </div>
        <button
          onClick={handleLogout}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: P.body, fontWeight: 600, fontSize: 12, color: tcol, opacity: .85 }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

// Standard page scaffold: full-bleed painterly sky + cream sheet pulled up 20px.
// Stars are rendered in the sky only on Dusk, matching the theme's key.
export function PageShell({ back, backLabel, backPath, onBack, eyebrow, title, titleItalic, right, heroHeight = 152, children }) {
  const P = useTheme();
  return (
    <div style={{ minHeight: '100vh', background: P.sheet }}>
      <div style={{ position: 'relative', minHeight: heroHeight }}>
        <Sky stars={P.key === 'dusk'} />
        <div style={{ position: 'relative', maxWidth: 640, margin: '0 auto', padding: '16px 20px 0' }}>
          <TopBar back={back} backLabel={backLabel} backPath={backPath} onBack={onBack} />
          <div style={{ marginTop: 16, paddingBottom: 26 }}>
            {eyebrow && (
              <p style={{ fontFamily: P.body, fontWeight: 700, fontSize: 10.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: P.skyText, opacity: .92, margin: '0 0 7px' }}>
                {eyebrow}
              </p>
            )}
            {title && (
              <h1 style={{ fontFamily: P.disp, fontWeight: 400, fontSize: 30, lineHeight: 1.05, margin: 0, color: P.skyText, textShadow: P.key === 'dusk' ? '0 1px 12px rgba(20,16,40,.35)' : '0 1px 10px rgba(255,255,255,.45)' }}>
                {title}{titleItalic && <> <span style={{ fontFamily: P.serif, fontStyle: 'italic' }}>{titleItalic}</span></>}
              </h1>
            )}
            {right}
          </div>
        </div>
      </div>
      <div style={{ position: 'relative', marginTop: -20, background: P.sheet, borderRadius: '22px 22px 0 0', boxShadow: '0 -8px 24px rgba(40,40,30,.10)', minHeight: 200 }}>
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '22px 20px 40px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// Auth scaffold for Login/Register: full-sky hero with photo + no TopBar.
// Also shows stars on Dusk and switches the title text shadow.
export function AuthScaffold({ headline, headlineItalic, children }) {
  const P = useTheme();
  return (
    <div style={{ minHeight: '100vh', background: P.sheet, display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'relative' }}>
        <Sky stars={P.key === 'dusk'} />
        <div style={{ position: 'relative', maxWidth: 480, margin: '0 auto', padding: '22px 24px 30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: P.disp, fontSize: 20, color: P.skyText, letterSpacing: 0.3 }}>Beta Board</span>
            <span style={{ fontFamily: P.serif, fontStyle: 'italic', fontSize: 13, color: P.skyText, opacity: .85 }}>est. 2026</span>
          </div>
          <div style={{ margin: '20px 0 0', borderRadius: 18, overflow: 'hidden', border: '4px solid rgba(255,255,255,.7)', boxShadow: '0 14px 32px rgba(40,40,30,.28)' }}>
            <img src="/LoginRegisterImage.jpg" alt="climbing" style={{ width: '100%', height: 146, objectFit: 'cover', display: 'block' }} />
          </div>
          <h1 style={{ fontFamily: P.disp, fontWeight: 400, fontSize: 30, lineHeight: 1.08, margin: '18px 0 0', color: P.skyText, textShadow: P.key === 'dusk' ? '0 1px 12px rgba(20,16,40,.35)' : '0 1px 10px rgba(255,255,255,.5)' }}>
            {headline}{headlineItalic && <><br /><span style={{ fontFamily: P.serif, fontStyle: 'italic' }}>{headlineItalic}</span></>}
          </h1>
        </div>
      </div>
      <div style={{ position: 'relative', marginTop: -20, background: P.sheet, borderRadius: '22px 22px 0 0', boxShadow: '0 -8px 24px rgba(40,40,30,.12)', flex: 1 }}>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 24px 30px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
