// kit.jsx — Beta Board · Ghibli design system (themeable: Meadow ⇄ Dusk).
// Painterly CSS skies, soft light, rolling hills, paper grain. Storybook type:
// Gloock (display) + Newsreader italic (accents/quotes) + Mulish (body).
// All components read the active palette from ThemeCtx via useP().

// ── grain texture ──
const GRAIN = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

const FONTS = {
  disp:'"Gloock", Georgia, serif',
  serif:'"Newsreader", Georgia, serif',
  body:'"Mulish", system-ui, sans-serif',
};

const MEADOW = {
  ...FONTS, key:'meadow', label:'Meadow',
  ink:'#36402c', ink2:'#6f7a60', ink3:'#9aa389',
  primary:'#cf6f49', primaryD:'#b85b39', primarySoft:'rgba(207,111,73,.12)',
  accent:'#7e9b5c',
  page:'#f3efe2', sheet:'#fbf5e6', card:'#fffaef', line:'#e8ddc6', lineSoft:'#efe7d4',
  onSky:'#3a4329',
  sky:'linear-gradient(180deg,#bfe2dd 0%,#d6e7d8 40%,#eef2dc 78%,#f6f1de 100%)',
  glow:'radial-gradient(115% 78% at 80% 6%, rgba(255,248,222,.95), rgba(255,248,222,0) 55%)',
  cloud:'rgba(255,255,255,.9)',
  hills:['#a9c187','#8fae6b','#739255'],
  skyText:'#3a4329',
  good:'#5e7a44', goodBg:'rgba(126,155,92,.16)',
  warn:'#b85b39', warnBg:'rgba(207,111,73,.14)',
  info:'#5b6f8c', infoBg:'rgba(91,111,140,.14)',
};

const DUSK = {
  ...FONTS, key:'dusk', label:'Dusk',
  ink:'#322a3d', ink2:'#6e6479', ink3:'#9a90a4',
  primary:'#dc9a47', primaryD:'#c5833a', primarySoft:'rgba(220,154,71,.14)',
  accent:'#7486ad',
  page:'#efe7da', sheet:'#fbf2e3', card:'#fff8ed', line:'#ecdfcd', lineSoft:'#f3e9da',
  onSky:'#fdeede',
  sky:'linear-gradient(180deg,#3b4a72 0%,#65567f 42%,#a9748a 72%,#e7b079 96%)',
  glow:'radial-gradient(85% 60% at 50% 98%, rgba(247,196,134,.85), rgba(247,196,134,0) 62%)',
  cloud:'rgba(255,233,206,.40)',
  hills:['#5d5b7d','#474463','#322f49'],
  skyText:'#fdeede',
  good:'#6e8a96', goodBg:'rgba(116,134,173,.18)',
  warn:'#c5833a', warnBg:'rgba(220,154,71,.16)',
  info:'#8d80ad', infoBg:'rgba(141,128,173,.18)',
};

const THEMES = { meadow:MEADOW, dusk:DUSK };
const ThemeCtx = React.createContext(MEADOW);
const useP = () => React.useContext(ThemeCtx);

// hold colours (route colours) — used as accents + climb heroes
const HOLD = { Green:'#5b9468', Orange:'#cd6f3f', Blue:'#4677a6', Pink:'#a85a7e', Yellow:'#caa23a', Black:'#5c5560', White:'#efe9da' };

// ── rank system (ported from rankUtils) ──
const RANKS = [
  { name:'Iron', min:0, color:'#757575', bg:'#F1EFEA' },
  { name:'Bronze', min:100, color:'#A0522D', bg:'#F4E6D6' },
  { name:'Silver', min:300, color:'#546E7A', bg:'#E6EBED' },
  { name:'Gold', min:700, color:'#B8860B', bg:'#F5EFD6' },
  { name:'Platinum', min:1200, color:'#00838F', bg:'#DCEFEF' },
  { name:'Diamond', min:2000, color:'#3949AB', bg:'#E2E5F2' },
  { name:'Emerald', min:3000, color:'#2E7D32', bg:'#E0EEE1' },
  { name:'Masters', min:4500, color:'#7B1FA2', bg:'#EEE2F0' },
];
const MAGNUS_RANK = { name:'Magnus', color:'#C62828', bg:'#F6E2E2' };
function getRank(points, position=null){
  if(position!==null && position<=20) return MAGNUS_RANK;
  for(let i=RANKS.length-1;i>=0;i--){ if(points>=RANKS[i].min) return RANKS[i]; }
  return RANKS[0];
}
const GRADE_POINTS = [
  { label:'V0 – V2', points:10 }, { label:'V3 – V4', points:20 }, { label:'V5 – V6', points:40 },
  { label:'V7 – V8', points:70 }, { label:'V9 – V10', points:100 }, { label:'V11 – V12+', points:150 },
];

const R = (x,y,w,h,f)=> <rect key={x+'-'+y+'-'+w+'-'+h+'-'+f} x={x} y={y} width={w} height={h} fill={f}/>;
function RankIcon({ name, size=18 }){
  const p = { width:size, height:size, viewBox:'0 0 16 16', shapeRendering:'crispEdges', xmlns:'http://www.w3.org/2000/svg' };
  switch(name){
    case 'Iron': return <svg {...p}>{R(4,1,8,2,'#757575')}{R(2,3,2,10,'#757575')}{R(4,13,8,2,'#757575')}{R(12,3,2,3,'#757575')}{R(12,10,2,3,'#757575')}{R(12,6,2,4,'#BDBDBD')}</svg>;
    case 'Bronze': return <svg {...p}>{R(5,1,2,2,'#A0522D')}{R(9,1,2,2,'#A0522D')}{R(4,3,8,2,'#CD853F')}{R(3,5,10,7,'#A0522D')}{R(4,12,8,2,'#A0522D')}{R(5,14,6,1,'#A0522D')}{R(5,3,2,1,'#F5DEB3')}{R(9,3,2,1,'#F5DEB3')}</svg>;
    case 'Silver': return <svg {...p}>{R(2,2,5,5,'#546E7A')}{R(3,2,3,3,'#78909C')}{R(1,7,11,3,'#546E7A')}{R(2,10,7,2,'#37474F')}{R(9,9,5,3,'#37474F')}{R(13,8,2,3,'#37474F')}{R(2,12,9,2,'#37474F')}</svg>;
    case 'Gold': return <svg {...p}>{R(3,3,10,9,'#B8860B')}{R(4,4,3,7,'#FFF9C4')}{R(9,4,3,7,'#FFF9C4')}{R(6,12,4,2,'#B8860B')}{R(5,1,6,2,'#DAA520')}{R(4,2,1,1,'#DAA520')}{R(11,2,1,1,'#DAA520')}</svg>;
    case 'Platinum': return <svg {...p}>{R(5,1,6,2,'#00838F')}{R(3,3,2,4,'#00838F')}{R(11,3,2,4,'#00838F')}{R(5,7,6,2,'#00838F')}{R(4,3,8,4,'#00838F')}{R(5,4,6,2,'#E0F7FA')}{R(4,9,8,2,'#00838F')}{R(2,11,2,3,'#00838F')}{R(12,11,2,3,'#00838F')}{R(4,14,8,1,'#00838F')}{R(4,11,8,3,'#00838F')}{R(5,11,6,2,'#E0F7FA')}</svg>;
    case 'Diamond': return <svg {...p}>{R(5,1,6,2,'#3949AB')}{R(3,3,10,2,'#3949AB')}{R(2,5,12,2,'#7986CB')}{R(3,7,10,2,'#3949AB')}{R(4,9,8,2,'#3949AB')}{R(5,11,6,2,'#283593')}{R(6,13,4,2,'#283593')}{R(7,15,2,1,'#283593')}{R(4,3,3,2,'#7986CB')}{R(9,3,3,2,'#7986CB')}</svg>;
    case 'Emerald': return <svg {...p}>{R(4,1,8,2,'#2E7D32')}{R(2,3,12,8,'#2E7D32')}{R(4,11,8,2,'#2E7D32')}{R(5,3,6,6,'#A5D6A7')}{R(3,5,2,4,'#66BB6A')}{R(11,5,2,4,'#1B5E20')}{R(5,9,6,2,'#66BB6A')}</svg>;
    case 'Masters': return <svg {...p}>{R(1,4,2,8,'#7B1FA2')}{R(7,2,2,8,'#7B1FA2')}{R(13,4,2,8,'#7B1FA2')}{R(3,6,4,6,'#7B1FA2')}{R(9,6,4,6,'#7B1FA2')}{R(1,10,14,4,'#6A1B9A')}{R(1,11,14,2,'#7B1FA2')}{R(2,12,2,2,'#CE93D8')}{R(7,12,2,2,'#CE93D8')}{R(12,12,2,2,'#CE93D8')}</svg>;
    case 'Magnus': return <svg {...p}>{R(8,1,1,5,'#FFD54F')}{R(9,1,3,3,'#FFD54F')}{R(7,4,3,2,'#FFCDD2')}{R(5,6,7,2,'#C62828')}{R(5,6,7,1,'#FFCDD2')}{R(3,8,11,2,'#C62828')}{R(1,10,14,5,'#C62828')}{R(4,10,2,3,'#B71C1C')}{R(10,10,2,3,'#B71C1C')}</svg>;
    default: return null;
  }
}
function RankBadge({ rank, showName=true, iconSize=16 }){
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'3px 9px', borderRadius:8, background:rank.bg }}>
      <RankIcon name={rank.name} size={iconSize}/>
      {showName && <span style={{ fontFamily:FONTS.body, fontSize:11.5, fontWeight:700, color:rank.color }}>{rank.name}</span>}
    </span>
  );
}

// ── date helper (en-AU) ──
function fmtDate(iso){ try { return new Date(iso).toLocaleDateString('en-AU',{ day:'numeric', month:'short' }); } catch { return iso; } }
function fmtDateLong(iso){ try { return new Date(iso).toLocaleDateString('en-AU',{ day:'numeric', month:'short', year:'numeric' }); } catch { return iso; } }

// ── painterly sky (fills its positioned parent) ──
function Sky({ hills=true, stars=false }){
  const P = useP();
  return (
    <div style={{ position:'absolute', inset:0, overflow:'hidden' }}>
      <div style={{ position:'absolute', inset:0, background:P.sky }} />
      <div style={{ position:'absolute', inset:0, background:P.glow }} />
      {stars && [['12%','22%',2],['26%','13%',1.5],['44%','26%',2],['66%','16%',1.5],['82%','30%',2],['55%','11%',1.5],['34%','34%',1.4]].map(([l,t,r],i)=>(
        <span key={i} style={{ position:'absolute', left:l, top:t, width:r*2, height:r*2, borderRadius:'50%', background:'rgba(255,245,225,.92)' }} />
      ))}
      <div style={{ position:'absolute', top:'18%', left:'7%', width:130, height:34, borderRadius:'50%', background:`radial-gradient(closest-side, ${P.cloud}, transparent)`, filter:'blur(3px)' }} />
      <div style={{ position:'absolute', top:'34%', left:'1%', width:88, height:24, borderRadius:'50%', background:`radial-gradient(closest-side, ${P.cloud}, transparent)`, filter:'blur(3px)' }} />
      <div style={{ position:'absolute', top:'12%', right:'9%', width:104, height:28, borderRadius:'50%', background:`radial-gradient(closest-side, ${P.cloud}, transparent)`, filter:'blur(3px)' }} />
      {hills && P.hills.map((c,i)=>(
        <div key={i} style={{ position:'absolute', bottom:-34+i*-2, left:i%2?'-30%':'-18%', width:'150%', height:96-i*16, background:c, borderRadius:'50% 50% 0 0 / 100% 100% 0 0', transform:`translateY(${i*10}px)` }} />
      ))}
      <div style={{ position:'absolute', inset:0, backgroundImage:GRAIN, backgroundSize:'160px 160px', opacity:0.09, mixBlendMode:'soft-light', pointerEvents:'none' }} />
    </div>
  );
}

// ── primitives ──
function Eyebrow({ children, color, style }){
  const P = useP();
  return <p style={{ fontFamily:P.body, fontWeight:700, fontSize:10.5, letterSpacing:'0.16em', textTransform:'uppercase', color:color||P.ink2, margin:0, ...style }}>{children}</p>;
}
function Btn({ children, onClick, full, variant='solid', size='md', style, disabled }){
  const P = useP();
  const pad = size==='sm'?'8px 14px':'12px 18px';
  const fs = size==='sm'?13:14.5;
  const base = { fontFamily:P.body, fontWeight:700, fontSize:fs, padding:pad, borderRadius:size==='sm'?10:13, cursor:disabled?'default':'pointer', width:full?'100%':'auto', whiteSpace:'nowrap', display:'inline-flex', alignItems:'center', justifyContent:'center', gap:7, opacity:disabled?.5:1, transition:'all .15s' };
  const variants = {
    solid:{ color:'#fff', background:P.primary, border:'none', boxShadow:`0 6px 15px ${P.primary}3a` },
    ghost:{ color:P.ink, background:'rgba(255,255,255,.55)', border:`1px solid ${P.line}` },
    danger:{ color:'#fff', background:'#bb5b46', border:'none' },
    accent:{ color:'#fff', background:P.accent, border:'none' },
  };
  return <button onClick={disabled?undefined:onClick} style={{ ...base, ...variants[variant], ...style }}>{children}</button>;
}
function Chip({ children, tone='soft', style }){
  const P = useP();
  const map = {
    soft:{ bg:'rgba(255,255,255,.6)', fg:P.ink2, bd:P.line },
    accent:{ bg:P.primarySoft, fg:P.primaryD, bd:'transparent' },
    open:{ bg:P.goodBg, fg:P.good, bd:'transparent' },
    closed:{ bg:'rgba(0,0,0,.05)', fg:P.ink3, bd:'transparent' },
    upcoming:{ bg:P.infoBg, fg:P.info, bd:'transparent' },
    qualifier:{ bg:P.primarySoft, fg:P.primaryD, bd:'transparent' },
    finals:{ bg:P.infoBg, fg:P.info, bd:'transparent' },
    you:{ bg:P.primarySoft, fg:P.primaryD, bd:'transparent' },
  };
  const t = map[tone]||map.soft;
  return <span style={{ fontFamily:P.body, fontWeight:600, fontSize:11.5, padding:'3px 11px', borderRadius:999, background:t.bg, color:t.fg, border:`1px solid ${t.bd}`, whiteSpace:'nowrap', ...style }}>{children}</span>;
}
function Avatar({ name, size=34, onClick }){
  const P = useP();
  return <div onClick={onClick} style={{ width:size, height:size, borderRadius:'50%', background:'rgba(255,255,255,.72)', border:`1px solid ${P.line}`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:P.body, fontWeight:700, fontSize:size*0.36, color:P.ink, flexShrink:0, cursor:onClick?'pointer':'default' }}>{(name||'').slice(0,2).toUpperCase()}</div>;
}
function Stars({ n, size=13, onPick }){
  const P = useP();
  return <span style={{ display:'inline-flex', gap:1, letterSpacing:1, fontSize:size }}>{[1,2,3,4,5].map(s=>(
    <span key={s} onClick={onPick?()=>onPick(s):undefined} style={{ color:s<=n?P.primary:'rgba(0,0,0,.13)', cursor:onPick?'pointer':'default', lineHeight:1 }}>★</span>))}</span>;
}
function Divider({ m=20 }){ const P=useP(); return <div style={{ height:1, background:P.line, margin:`${m}px 0` }} />; }
function Card({ children, style, onClick, hover }){
  const P = useP();
  const [h,setH] = React.useState(false);
  return <div onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
    style={{ background:P.card, border:`1px solid ${hover&&h?P.primary:P.line}`, borderRadius:15, boxShadow:'0 4px 14px rgba(40,40,30,.06)', transition:'border-color .15s', cursor:onClick?'pointer':'default', ...style }}>{children}</div>;
}
function Field({ label, value, onChange, placeholder, type='text', textarea, hint, optional }){
  const P = useP();
  const cls = { width:'100%', background:P.card, border:`1px solid ${P.line}`, borderRadius:11, padding:'11px 14px', fontFamily:P.body, fontWeight:500, fontSize:14.5, color:P.ink, outline:'none', boxSizing:'border-box' };
  return (
    <div>
      {label && <label style={{ display:'block', fontFamily:P.body, fontWeight:700, fontSize:10, letterSpacing:'0.14em', textTransform:'uppercase', color:P.ink2, marginBottom:6 }}>{label}{optional && <span style={{ color:P.ink3, fontWeight:600 }}> · optional</span>}</label>}
      {textarea
        ? <textarea value={value} placeholder={placeholder} onChange={onChange&&(e=>onChange(e.target.value))} style={{ ...cls, height:80, resize:'none' }} />
        : <input type={type} value={value} placeholder={placeholder} onChange={onChange&&(e=>onChange(e.target.value))} style={cls} />}
      {hint && <p style={{ fontFamily:P.serif, fontStyle:'italic', fontSize:12.5, color:P.ink3, margin:'6px 0 0' }}>{hint}</p>}
    </div>
  );
}
function Toggle({ on, onChange }){
  const P = useP();
  return <div onClick={()=>onChange&&onChange(!on)} style={{ width:44, height:24, borderRadius:999, background:on?P.primary:'rgba(0,0,0,.16)', cursor:'pointer', display:'flex', alignItems:'center', padding:2, transition:'background .15s', flexShrink:0 }}>
    <div style={{ width:20, height:20, borderRadius:'50%', background:'#fff', transform:on?'translateX(20px)':'translateX(0)', transition:'transform .18s', boxShadow:'0 1px 3px rgba(0,0,0,.2)' }} />
  </div>;
}
function Modal({ title, subtitle, children, onClose }){
  const P = useP();
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:60, background:'rgba(30,24,20,.5)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div onClick={e=>e.stopPropagation()} style={{ width:'100%', maxWidth:330, background:P.sheet, borderRadius:18, border:`1px solid ${P.line}`, padding:'22px 22px 24px', boxShadow:'0 24px 60px rgba(20,16,12,.4)' }}>
        <h2 style={{ fontFamily:P.disp, fontWeight:400, fontSize:23, margin:0, color:P.ink }}>{title}</h2>
        {subtitle && <p style={{ fontFamily:P.serif, fontStyle:'italic', fontSize:14, color:P.ink2, margin:'4px 0 0' }}>{subtitle}</p>}
        <div style={{ marginTop:16 }}>{children}</div>
      </div>
    </div>
  );
}
function GradePills({ grades, value, onPick, wrap=true }){
  const P = useP();
  return (
    <div style={{ display:'flex', gap:7, flexWrap:wrap?'wrap':'nowrap' }}>
      {grades.map(g=>{
        const sel = value===g;
        return <button key={g} onClick={()=>onPick&&onPick(g)} style={{ fontFamily:P.body, fontWeight:700, fontSize:13, padding:'7px 13px', borderRadius:999, cursor:'pointer', border:`1px solid ${sel?P.primary:P.line}`, background:sel?P.primary:P.card, color:sel?'#fff':P.ink, boxShadow:sel?`0 4px 11px ${P.primary}3a`:'none', transition:'all .12s' }}>V{g}</button>;
      })}
    </div>
  );
}
function ColourSwatches({ value, onPick }){
  const P = useP();
  return (
    <div style={{ display:'flex', gap:11, flexWrap:'wrap' }}>
      {Object.keys(HOLD).filter(k=>k!=='White').map(name=>{
        const sel = value===name;
        return <button key={name} onClick={()=>onPick&&onPick(name)} title={name} style={{ width:32, height:32, borderRadius:'50%', background:HOLD[name], cursor:'pointer', border:`2.5px solid ${sel?P.ink:'transparent'}`, transform:sel?'scale(1.12)':'none', transition:'all .12s', boxShadow:'0 2px 5px rgba(0,0,0,.15)' }} />;
      })}
    </div>
  );
}

Object.assign(window, {
  GRAIN, FONTS, MEADOW, DUSK, THEMES, ThemeCtx, useP, HOLD,
  RANKS, MAGNUS_RANK, getRank, GRADE_POINTS, RankIcon, RankBadge,
  fmtDate, fmtDateLong, Sky, Eyebrow, Btn, Chip, Avatar, Stars, Divider,
  Card, Field, Toggle, Modal, GradePills, ColourSwatches,
});
