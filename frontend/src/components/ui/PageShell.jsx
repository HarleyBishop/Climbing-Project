import { Link, NavLink, useNavigate } from 'react-router-dom';
import { getDecodedToken } from '../../auth';
import api from '../../api';
import { ACCESS_TOKEN, REFRESH_TOKEN } from '../../constants';
import { cn } from '../../lib/utils';
import { BlurFade } from '../magicui/blur-fade';
import { Marquee } from '../magicui/marquee';
import { AnimatedShinyText } from '../magicui/animated-shiny-text';
import { Avatar } from './primitives';

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-ink">
      <span className="size-2.5 rounded-full bg-accent" />
      Beta Board
    </Link>
  );
}

// Sticky translucent nav bar, like apple.com's global nav: the page scrolls
// underneath and shows through the blur.
function NavBar() {
  const navigate = useNavigate();
  const decoded = getDecodedToken();
  const username = decoded?.username ?? '';

  const handleLogout = async () => {
    // Blacklist server-side so the refresh token can't be reused; a failure
    // (e.g. already expired) shouldn't block logging out.
    const refresh = localStorage.getItem(REFRESH_TOKEN);
    try { await api.post('/api/token/blacklist/', { refresh }); } catch { /* ignore */ }
    localStorage.removeItem(ACCESS_TOKEN);
    localStorage.removeItem(REFRESH_TOKEN);
    navigate('/login');
  };

  const linkClass = ({ isActive }) =>
    cn('text-sm transition-colors', isActive ? 'text-ink' : 'text-muted hover:text-ink');

  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-white/70 backdrop-blur-xl backdrop-saturate-150">
      <nav className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
        <Logo />
        <div className="flex items-center gap-6">
          <NavLink to="/" end className={linkClass}>Gyms</NavLink>
          <NavLink to="/feed" className={linkClass}>Feed</NavLink>
          {decoded?.is_setter && <span className="hidden rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-accent sm:inline">Setter</span>}
          <button onClick={handleLogout} className="cursor-pointer text-sm text-muted transition-colors hover:text-ink">Sign out</button>
          <Avatar name={username} size={30} onClick={() => navigate('/profile')} />
        </div>
      </nav>
    </header>
  );
}

// Standard page layout: nav, big headline block, then content. Both header
// and content blur-fade in on load, staggered slightly.
// `titleItalic` is rendered as the grey second half of a two-tone headline.
export function PageShell({ back, backLabel, backPath, onBack, eyebrow, title, titleItalic, right, children }) {
  const navigate = useNavigate();
  const handleBack = () => {
    if (onBack) onBack();
    else if (backPath) navigate(backPath);
    else navigate(-1);
  };

  return (
    <div className="min-h-screen">
      <NavBar />
      <main className="mx-auto max-w-3xl px-5 pt-10 pb-28 sm:pt-16">
        <BlurFade>
          {back && (
            <button onClick={handleBack} className="mb-6 cursor-pointer text-sm text-accent hover:underline">
              ‹ {backLabel || 'Back'}
            </button>
          )}
          {eyebrow && <p className="mb-2 text-sm font-semibold text-accent">{eyebrow}</p>}
          {title && (
            <h1 className="text-4xl font-semibold sm:text-5xl">
              {title}
              {titleItalic && <span className="text-faint"> {titleItalic}</span>}
            </h1>
          )}
          {right}
        </BlurFade>
        <BlurFade delay={0.12} className="mt-10">
          {children}
        </BlurFade>
      </main>
    </div>
  );
}

const FEATURES = ['Log your sends', 'Vote on grades', 'Run competitions', 'Climb the leaderboard', 'Follow your crew', 'Watch beta videos', 'Find gyms nearby'];

// Login / register layout: copy + form on the left, illustration on the
// right (stacked on mobile), with a marquee of features under the headline.
export function AuthScaffold({ headline, headlineItalic, children }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-8">
      <BlurFade><Logo /></BlurFade>
      <div className="grid flex-1 items-center gap-10 py-8 lg:grid-cols-2 lg:gap-16">
      <div className="min-w-0">
        <BlurFade delay={0.08}>
          <div className="inline-flex rounded-full bg-white px-4 py-1 text-sm ring-1 ring-line">
            <AnimatedShinyText>✦ Your climbing logbook</AnimatedShinyText>
          </div>
          <h1 className="mt-5 text-5xl font-semibold sm:text-6xl">
            {headline}
            {headlineItalic && <span className="block text-faint">{headlineItalic}</span>}
          </h1>
        </BlurFade>
        <BlurFade delay={0.16}>
          <Marquee pauseOnHover className="mt-8 -mx-2 [--duration:30s] mask-x-from-80% mask-x-to-100%">
            {FEATURES.map(f => (
              <span key={f} className="rounded-full bg-white px-4 py-2 text-sm text-muted ring-1 ring-line">{f}</span>
            ))}
          </Marquee>
        </BlurFade>
        <BlurFade delay={0.24} className="mt-8 max-w-sm">
          {children}
        </BlurFade>
      </div>
      <BlurFade delay={0.2} direction="up" className="order-first lg:order-last">
        <img
          src="/LoginRegisterImage.jpg"
          alt="Illustration of a climber on a bouldering wall"
          className="h-56 w-full rounded-[2rem] object-cover object-[50%_20%] shadow-2xl sm:h-80 lg:h-[640px]"
        />
      </BlurFade>
      </div>
    </div>
  );
}
