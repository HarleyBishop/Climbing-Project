// pages-home-gym.jsx — Home, GymPage, AddClimb, ArchivedClimbs.

// ── shared list items ──
function GymRow({ g }){
  const P = useP();
  const r = useRouter();
  return (
    <Card hover onClick={()=>r.go('gym',{ gymId:g.id })} style={{ display:'flex', alignItems:'center', gap:13, padding:'13px 15px', marginBottom:11 }}>
      <span style={{ width:11, height:11, borderRadius:'50%', background:HOLD[g.strip], flexShrink:0, boxShadow:`0 0 0 4px ${HOLD[g.strip]}22` }} />
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontFamily:P.disp, fontWeight:400, fontSize:18, margin:0, color:P.ink, lineHeight:1.12 }}>{g.name}</p>
        <p style={{ fontFamily:P.body, fontSize:12, color:P.ink2, margin:'3px 0 0' }}>{g.location} · {g.wall_count} walls · {g.climb_count} climbs</p>
      </div>
      <Chip tone={g.is_active?'open':'closed'}>{g.is_active?'Open':'Closed'}</Chip>
    </Card>
  );
}

function ClimbTile({ c, gymId, setLabel }){
  const P = useP();
  const r = useRouter();
  const hold = HOLD[c.colour];
  return (
    <div>
      {setLabel && <p style={{ fontFamily:P.serif, fontStyle:'italic', fontSize:11.5, color:P.ink3, margin:'0 0 5px' }}>Set {fmtDate(c.set_at)}</p>}
      <Card hover onClick={()=>r.go('climb',{ gymId, climbId:c.id })} style={{ overflow:'hidden' }}>
        <div style={{ position:'relative', height:78, overflow:'hidden' }}>
          <div style={{ position:'absolute', inset:0, background:`linear-gradient(160deg, ${hold} 0%, ${hold} 60%, rgba(0,0,0,.16) 130%)` }} />
          <div style={{ position:'absolute', inset:0, background:'radial-gradient(80% 70% at 78% 14%, rgba(255,255,255,.30), transparent 60%)' }} />
          <div style={{ position:'absolute', inset:0, backgroundImage:GRAIN, backgroundSize:'160px 160px', opacity:0.12, mixBlendMode:'soft-light' }} />
          <div style={{ position:'absolute', bottom:8, left:8, display:'flex', gap:6 }}>
            <span style={{ fontFamily:P.body, fontWeight:700, fontSize:10.5, padding:'2px 8px', borderRadius:999, background:'rgba(0,0,0,.28)', color:'#fff' }}>{c.colour}</span>
            <span style={{ fontFamily:P.body, fontWeight:700, fontSize:10.5, padding:'2px 8px', borderRadius:999, background:'rgba(0,0,0,.28)', color:'#fff' }}>V{c.suggested_grade}</span>
          </div>
        </div>
        <div style={{ padding:'10px 12px 12px' }}>
          <p style={{ fontFamily:P.disp, fontWeight:400, fontSize:15.5, margin:0, color:P.ink, lineHeight:1.1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{c.name}</p>
          <p style={{ fontFamily:P.body, fontSize:11.5, color:P.ink2, margin:'4px 0 0' }}>
            Setter V{c.suggested_grade}{c.community_grade?` · Community V${c.community_grade}`:''}
          </p>
        </div>
      </Card>
    </div>
  );
}

function MapBlock(){
  const P = useP();
  return (
    <div style={{ position:'relative', height:150, borderRadius:15, overflow:'hidden', border:`1px solid ${P.line}` }}>
      <Sky hills={false} stars={P.key==='dusk'} />
      <div style={{ position:'absolute', inset:0, backgroundImage:GRAIN, backgroundSize:'160px 160px', opacity:0.1, mixBlendMode:'soft-light' }} />
      {[['32%','46%'],['58%','60%'],['46%','34%']].map(([l,t],i)=>(
        <div key={i} style={{ position:'absolute', left:l, top:t, width:18, height:18, borderRadius:'50% 50% 50% 0', background:P.primary, transform:'translate(-50%,-100%) rotate(-45deg)', border:'2px solid #fff', boxShadow:'0 3px 6px rgba(0,0,0,.25)' }} />
      ))}
      <span style={{ position:'absolute', bottom:8, right:10, fontFamily:'ui-monospace, monospace', fontSize:10, color:P.skyText, opacity:.7, background:'rgba(255,255,255,.25)', padding:'2px 7px', borderRadius:6 }}>interactive map</span>
    </div>
  );
}

// ── Home ──
function Home(){
  const P = useP();
  const r = useRouter();
  const greeting = P.key==='dusk' ? 'Tuesday evening' : 'Tuesday morning';
  return (
    <PageShell wordmark stars={P.key==='dusk'} eyebrow={greeting} title="Where are you climbing" titleItalic="today?" heroHeight={188}>
      <div style={{ background:P.card, border:`1px solid ${P.line}`, borderRadius:12, padding:'11px 15px', display:'flex', alignItems:'center', gap:10, marginBottom:22 }}>
        <span style={{ width:13, height:13, borderRadius:'50%', border:`1.5px solid ${P.ink3}`, position:'relative', flexShrink:0 }}>
          <span style={{ position:'absolute', width:1.5, height:6, background:P.ink3, transform:'rotate(-45deg)', bottom:-5, right:-2 }} />
        </span>
        <span style={{ fontFamily:P.body, fontSize:14, color:P.ink3 }}>Search gyms near you</span>
      </div>

      <SectionLabel right={<span style={{ fontFamily:P.serif, fontStyle:'italic', fontSize:14, color:P.ink2 }}>{GYMS.length} saved</span>}>Your gyms</SectionLabel>
      {GYMS.map(g=>(<GymRow key={g.id} g={g} />))}

      <Divider m={24} />
      <SectionLabel>Gyms near you</SectionLabel>
      <MapBlock />

      {r.role==='setter' && <Btn full onClick={()=>r.go('createGym')} style={{ marginTop:24 }}>Create a gym</Btn>}
    </PageShell>
  );
}

// ── GymPage ──
function GymPage({ params }){
  const P = useP();
  const r = useRouter();
  const gym = GYMS.find(g=>g.id===(params.gymId||1)) || GYMS[0];
  const [wall,setWall] = React.useState(WALLS[0]);
  const [confirm,setConfirm] = React.useState(false);
  const climbs = CLIMBS;
  const headerRight = (
    <div style={{ marginTop:14, display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
      <Chip tone={gym.is_active?'open':'closed'} style={{ background:'rgba(255,255,255,.5)' }}>{gym.is_active?'Open':'Closed'}</Chip>
      <div style={{ flex:1 }} />
      <button onClick={()=>r.go('comps',{ gymId:gym.id })} style={ghostPill(P)}>Competitions</button>
      <button onClick={()=>r.go('leaderboard',{ gymId:gym.id })} style={ghostPill(P)}>Leaderboard</button>
    </div>
  );
  return (
    <PageShell back backLabel="Your gyms" onBack={()=>r.go('home')} eyebrow={gym.location} title={gym.name} right={headerRight} heroHeight={176}>
      <SectionLabel>Select wall</SectionLabel>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:20 }}>
        {WALLS.map(w=>{
          const sel = wall.id===w.id;
          return <button key={w.id} onClick={()=>{ setWall(w); setConfirm(false); }} style={{ fontFamily:P.body, fontWeight:600, fontSize:13, padding:'7px 15px', borderRadius:999, cursor:'pointer', border:`1px solid ${sel?P.primary:P.line}`, background:sel?P.primary:P.card, color:sel?'#fff':P.ink, transition:'all .12s' }}>{w.name}</button>;
        })}
      </div>

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14, gap:10 }}>
        <div style={{ display:'flex', alignItems:'baseline', gap:10, minWidth:0 }}>
          <Eyebrow>{wall.name} · {climbs.length} climbs</Eyebrow>
          <button onClick={()=>r.go('archived',{ gymId:gym.id, wall:wall.name })} style={{ background:'none', border:'none', cursor:'pointer', fontFamily:P.serif, fontStyle:'italic', fontSize:13, color:P.ink3, padding:0, whiteSpace:'nowrap' }}>View archived</button>
        </div>
        {r.role==='setter' && <Btn size="sm" onClick={()=>r.go('addClimb',{ gymId:gym.id, wall:wall.name })}>+ Add climb</Btn>}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:13 }}>
        {climbs.map(c=>(<ClimbTile key={c.id} c={c} gymId={gym.id} />))}
      </div>

      {r.role==='setter' && (
        <div style={{ marginTop:18 }}>
          {confirm ? (
            <Card style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px', borderColor:P.primary }}>
              <p style={{ flex:1, fontFamily:P.serif, fontStyle:'italic', fontSize:13, color:P.ink, margin:0 }}>Archive all {climbs.length} climbs on {wall.name}? This can’t be undone.</p>
              <Btn size="sm" variant="danger" onClick={()=>setConfirm(false)}>Yes, archive</Btn>
              <Btn size="sm" variant="ghost" onClick={()=>setConfirm(false)}>Cancel</Btn>
            </Card>
          ) : (
            <button onClick={()=>setConfirm(true)} style={{ background:'none', border:'none', cursor:'pointer', fontFamily:P.serif, fontStyle:'italic', fontSize:13, color:P.ink3, padding:0 }}>Archive all climbs on this wall</button>
          )}
        </div>
      )}
    </PageShell>
  );
}
function ghostPill(P){ return { fontFamily:P.body, fontWeight:600, fontSize:12, padding:'6px 13px', borderRadius:999, cursor:'pointer', border:`1px solid ${P.skyText==='#fdeede'?'rgba(255,255,255,.4)':'rgba(58,67,41,.28)'}`, background:'rgba(255,255,255,.45)', color:P.skyText }; }

// ── AddClimb (setter) ──
function AddClimb({ params }){
  const P = useP();
  const r = useRouter();
  const [colour,setColour] = React.useState('Orange');
  const [grade,setGrade] = React.useState(5);
  return (
    <PageShell back backLabel="Back to gym" onBack={()=>r.go('gym',{ gymId:params.gymId })} eyebrow={params.wall||'Crimp Wall'} title="Add a new climb">
      <div style={{ display:'flex', flexDirection:'column', gap:22 }}>
        <Field label="Climb name" value="" placeholder="e.g. Crimpy arête" />
        <div>
          <Eyebrow style={{ marginBottom:10, fontSize:10 }}>Hold colour — <span style={{ color:P.primary }}>{colour}</span></Eyebrow>
          <ColourSwatches value={colour} onPick={setColour} />
        </div>
        <div>
          <Eyebrow style={{ marginBottom:10, fontSize:10 }}>Setter grade — V{grade}</Eyebrow>
          <GradePills grades={[0,1,2,3,4,5,6,7,8,9,10,11,12]} value={grade} onPick={setGrade} />
        </div>
        <div>
          <Eyebrow style={{ marginBottom:8, fontSize:10 }}>Photo · optional</Eyebrow>
          <div style={{ height:120, borderRadius:12, border:`1.5px dashed ${P.line}`, background:P.card, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ fontFamily:'ui-monospace, monospace', fontSize:11, color:P.ink3 }}>drop a wall photo</span>
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <Btn full onClick={()=>r.go('gym',{ gymId:params.gymId })}>Add climb</Btn>
          <Btn full variant="ghost" onClick={()=>r.go('gym',{ gymId:params.gymId })}>Cancel</Btn>
        </div>
      </div>
    </PageShell>
  );
}

// ── ArchivedClimbs ──
function ArchivedClimbs({ params }){
  const P = useP();
  const r = useRouter();
  const archived = CLIMBS.slice(0,4);
  return (
    <PageShell back backLabel="Back to gym" onBack={()=>r.go('gym',{ gymId:params.gymId })} eyebrow={`${params.wall||'Crimp Wall'} · old routes`} title="Archived climbs">
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:13 }}>
        {archived.map(c=>(<ClimbTile key={c.id} c={c} gymId={params.gymId} setLabel />))}
      </div>
    </PageShell>
  );
}

Object.assign(window, { Home, GymPage, AddClimb, ArchivedClimbs, GymRow, ClimbTile, MapBlock });
