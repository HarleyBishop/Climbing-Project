// nav.jsx — router context, themed top bar, PageShell scaffold, and the
// floating prototype controls (Meadow⇄Dusk theme + Climber/Setter role).

const RouterCtx = React.createContext(null);
const useRouter = () => React.useContext(RouterCtx);

// ── top bar that sits over the painterly sky ──
function TopBar({ back, backLabel, onBack, wordmark }){
  const P = useP();
  const r = useRouter();
  const tcol = P.skyText;
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', minHeight:34 }}>
      {back ? (
        <button onClick={onBack || (()=>r.back())} style={{ background:'none', border:'none', cursor:'pointer', padding:0, fontFamily:P.body, fontWeight:600, fontSize:13.5, color:tcol, display:'inline-flex', alignItems:'center', gap:4, maxWidth:200, overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>
          <span style={{ fontSize:17, lineHeight:1 }}>‹</span> {backLabel || 'Back'}
        </button>
      ) : (
        <span style={{ fontFamily:P.disp, fontSize:20, color:tcol, letterSpacing:0.3, whiteSpace:'nowrap' }}>Beta Board</span>
      )}
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        {r.role==='setter' && <span style={{ fontFamily:P.body, fontWeight:700, fontSize:10, letterSpacing:'0.1em', textTransform:'uppercase', padding:'3px 8px', borderRadius:999, background:'rgba(255,255,255,.28)', color:tcol, border:`1px solid ${P.skyText==='#fdeede'?'rgba(255,255,255,.35)':'rgba(58,67,41,.25)'}` }}>Setter</span>}
        <Avatar name={ME.username} size={32} onClick={()=>r.go('profile')} />
        <button onClick={()=>r.go('login')} style={{ background:'none', border:'none', cursor:'pointer', padding:0, fontFamily:P.body, fontWeight:600, fontSize:12, color:tcol, opacity:.85 }}>Sign out</button>
      </div>
    </div>
  );
}

// ── page scaffold: sky header (with top bar + title) + cream content sheet ──
function PageShell({ back, backLabel, onBack, wordmark, eyebrow, title, titleItalic, right, stars, heroHeight=152, children }){
  const P = useP();
  return (
    <div style={{ minHeight:'100%', background:P.sheet, position:'relative' }}>
      <div style={{ position:'relative', minHeight:heroHeight }}>
        <Sky stars={stars} />
        <div style={{ position:'relative', padding:'16px 20px 0' }}>
          <TopBar back={back} backLabel={backLabel} onBack={onBack} wordmark={wordmark} />
          <div style={{ marginTop:16, paddingBottom:26 }}>
            {eyebrow && <Eyebrow color={P.skyText} style={{ opacity:.92, marginBottom:7 }}>{eyebrow}</Eyebrow>}
            {title && (
              <h1 style={{ fontFamily:P.disp, fontWeight:400, fontSize:30, lineHeight:1.05, margin:0, color:P.skyText, textShadow: P.key==='dusk'?'0 1px 12px rgba(20,16,40,.32)':'0 1px 10px rgba(255,255,255,.45)' }}>
                {title}{titleItalic && <> <span style={{ fontFamily:P.serif, fontStyle:'italic' }}>{titleItalic}</span></>}
              </h1>
            )}
            {right}
          </div>
        </div>
      </div>
      <div style={{ position:'relative', marginTop:-20, background:P.sheet, borderRadius:'22px 22px 0 0', boxShadow:'0 -8px 24px rgba(40,40,30,.10)', padding:'22px 20px 40px', minHeight:200 }}>
        {children}
      </div>
    </div>
  );
}

function SectionLabel({ children, right, style }){
  const P = useP();
  return (
    <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', margin:'0 0 12px', ...style }}>
      <Eyebrow>{children}</Eyebrow>
      {right}
    </div>
  );
}
function Empty({ children }){
  const P = useP();
  return <p style={{ fontFamily:P.serif, fontStyle:'italic', fontSize:15, color:P.ink3, textAlign:'center', padding:'28px 0' }}>{children}</p>;
}

// ── floating prototype controls (chrome — not part of the app UI) ──
function FloatingControls(){
  const r = useRouter();
  const P = useP();
  const seg = (active)=>({ fontFamily:'"Mulish",sans-serif', fontWeight:700, fontSize:11.5, padding:'5px 11px', borderRadius:999, cursor:'pointer', border:'none', background:active?'#2a2420':'transparent', color:active?'#fff':'#6b6157', transition:'all .15s', display:'inline-flex', alignItems:'center', gap:5 });
  return (
    <div style={{ position:'fixed', top:14, right:14, zIndex:200, display:'flex', flexDirection:'column', gap:8, alignItems:'flex-end' }} data-omelette-chrome="">
      <div style={{ display:'flex', gap:3, background:'rgba(255,255,255,.92)', border:'1px solid rgba(0,0,0,.08)', borderRadius:999, padding:3, boxShadow:'0 4px 16px rgba(0,0,0,.14)', backdropFilter:'blur(8px)' }}>
        <button style={seg(r.themeKey==='meadow')} onClick={()=>r.setThemeKey('meadow')}>☀ Meadow</button>
        <button style={seg(r.themeKey==='dusk')} onClick={()=>r.setThemeKey('dusk')}>☾ Dusk</button>
      </div>
      <div style={{ display:'flex', gap:3, background:'rgba(255,255,255,.92)', border:'1px solid rgba(0,0,0,.08)', borderRadius:999, padding:3, boxShadow:'0 4px 16px rgba(0,0,0,.14)', backdropFilter:'blur(8px)' }}>
        <button style={seg(r.role==='climber')} onClick={()=>r.setRole('climber')}>Climber</button>
        <button style={seg(r.role==='setter')} onClick={()=>r.setRole('setter')}>Setter</button>
      </div>
    </div>
  );
}

Object.assign(window, { RouterCtx, useRouter, TopBar, PageShell, SectionLabel, Empty, FloatingControls });
