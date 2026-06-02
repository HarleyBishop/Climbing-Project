// pages-social.jsx — Profile & Leaderboard.

function StatTile({ v, l }){
  const P = useP();
  return (
    <div style={{ background:P.card, border:`1px solid ${P.line}`, borderRadius:13, padding:'12px 6px', textAlign:'center' }}>
      <p style={{ fontFamily:P.disp, fontWeight:400, fontSize:22, margin:0, color:P.ink, lineHeight:1 }}>{v}</p>
      <p style={{ fontFamily:P.body, fontWeight:600, fontSize:9.5, letterSpacing:'0.06em', textTransform:'uppercase', color:P.ink2, margin:'5px 0 0' }}>{l}</p>
    </div>
  );
}

function Profile(){
  const P = useP();
  const r = useRouter();
  const rank = getRank(ME.points);
  const avg = Math.round(ME.sends.reduce((s,x)=>s+x.climb_grade,0)/ME.sends.length);
  const headerRight = (
    <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:14, flexWrap:'wrap' }}>
      <RankBadge rank={rank} />
      <span style={{ fontFamily:P.body, fontWeight:700, fontSize:13, color:P.skyText }}>{ME.points.toLocaleString()} pts</span>
      <span style={{ fontFamily:P.serif, fontStyle:'italic', fontSize:13, color:P.skyText, opacity:.85 }}>· since Aug 2024</span>
    </div>
  );
  return (
    <PageShell back backLabel="Home" onBack={()=>r.go('home')} eyebrow="Your profile" title={`@${ME.username}`} right={headerRight} heroHeight={176}>
      <Card style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 15px', marginBottom:20 }}>
        <span style={{ width:11, height:11, borderRadius:'50%', background:P.accent, flexShrink:0 }} />
        <div>
          <Eyebrow style={{ fontSize:9.5, marginBottom:2 }}>Home gym</Eyebrow>
          <p style={{ fontFamily:P.disp, fontWeight:400, fontSize:17, margin:0, color:P.ink }}>{ME.home_gym}</p>
        </div>
      </Card>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:24 }}>
        <StatTile v={ME.sends.length} l="Sends" />
        <StatTile v={ME.reviews.length} l="Reviews" />
        <StatTile v={ME.videos} l="Videos" />
        <StatTile v={`V${avg}`} l="Avg" />
      </div>

      <SectionLabel>Sends · {ME.sends.length}</SectionLabel>
      <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:24 }}>
        {ME.sends.map(s=>(
          <Card key={s.id} hover onClick={()=>r.go('climb',{ gymId:1, climbId:s.id })} style={{ display:'flex', overflow:'hidden', alignItems:'stretch' }}>
            <div style={{ width:7, background:HOLD[s.climb_colour], flexShrink:0 }} />
            <div style={{ flex:1, padding:'11px 14px', minWidth:0 }}>
              <p style={{ fontFamily:P.disp, fontWeight:400, fontSize:16, margin:0, color:P.ink, lineHeight:1.1 }}>{s.climb_name}</p>
              <p style={{ fontFamily:P.body, fontSize:11.5, color:P.ink2, margin:'3px 0 0' }}>{s.wall_name} · {s.gym_name}</p>
            </div>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', justifyContent:'center', gap:4, padding:'0 14px' }}>
              <Chip tone="accent">V{s.climb_grade}</Chip>
              <span style={{ fontFamily:P.body, fontSize:11, color:P.ink2 }}>{s.attempts} att.</span>
            </div>
          </Card>
        ))}
      </div>

      <SectionLabel>Reviews · {ME.reviews.length}</SectionLabel>
      <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:24 }}>
        {ME.reviews.map(rv=>(
          <Card key={rv.id} style={{ padding:'13px 15px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
              <p style={{ fontFamily:P.disp, fontWeight:400, fontSize:16, margin:0, color:P.ink }}>{rv.climb_name}</p>
              <Stars n={rv.stars} />
            </div>
            <p style={{ fontFamily:P.serif, fontStyle:'italic', fontSize:14.5, lineHeight:1.4, color:P.ink, margin:'0 0 6px' }}>“{rv.comment}”</p>
            <p style={{ fontFamily:P.body, fontSize:11.5, color:P.ink2, margin:0 }}>{rv.wall_name} · {rv.gym_name}</p>
          </Card>
        ))}
      </div>

      <SectionLabel>Videos · {ME.videos}</SectionLabel>
      <div style={{ display:'flex', gap:11 }}>
        {[0,1].map(i=>(
          <div key={i} style={{ flex:1, position:'relative', height:92, borderRadius:12, overflow:'hidden', border:`1px solid ${P.line}`, background:`linear-gradient(150deg, ${HOLD.Blue}, rgba(0,0,0,.25))` }}>
            <div style={{ position:'absolute', inset:0, backgroundImage:GRAIN, backgroundSize:'160px 160px', opacity:0.14, mixBlendMode:'soft-light' }} />
            <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:32, height:32, borderRadius:'50%', background:'rgba(255,255,255,.85)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span style={{ marginLeft:3, borderStyle:'solid', borderWidth:'6px 0 6px 10px', borderColor:`transparent transparent transparent ${P.ink}` }} />
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}

// ── Leaderboard ──
function rankColour(P, n){ return n===1?P.primary : n===2?P.ink2 : n===3?P.accent : P.ink3; }

function Leaderboard({ params }){
  const P = useP();
  const r = useRouter();
  const gym = GYMS.find(g=>g.id===(params.gymId||1)) || GYMS[0];
  const me = LEADERBOARD.find(e=>e.username==='you');
  const maxPts = LEADERBOARD[0].points;
  return (
    <PageShell back backLabel={gym.name} onBack={()=>r.go('gym',{ gymId:gym.id })} eyebrow={`${gym.name} · ${gym.climb_count} active climbs`} title="Leaderboard">
      {/* your ranking */}
      <Eyebrow style={{ marginBottom:10 }}>Your ranking</Eyebrow>
      <Card style={{ display:'flex', alignItems:'center', gap:14, padding:'15px 16px', marginBottom:24, border:`2px solid ${P.primary}` }}>
        <span style={{ fontFamily:P.disp, fontSize:26, color:rankColour(P,me.rank), minWidth:38, textAlign:'center' }}>#{me.rank}</span>
        <div style={{ flex:1 }}>
          <p style={{ fontFamily:P.disp, fontWeight:400, fontSize:18, margin:0, color:P.ink }}>@{me.username}</p>
          <div style={{ display:'flex', alignItems:'center', gap:7, marginTop:5 }}>
            <Chip tone="you">You</Chip>
            <RankBadge rank={getRank(me.points, me.rank)} />
          </div>
        </div>
        <div style={{ textAlign:'right' }}>
          <p style={{ fontFamily:P.disp, fontSize:19, margin:0, color:P.ink }}>{me.points.toLocaleString()}</p>
          <p style={{ fontFamily:P.body, fontSize:11, color:P.ink2, margin:'2px 0 0' }}>{me.send_count} sends</p>
        </div>
      </Card>

      {/* top climbers */}
      <Eyebrow style={{ marginBottom:12 }}>Top climbers</Eyebrow>
      <div style={{ display:'flex', flexDirection:'column', gap:9, marginBottom:24 }}>
        {LEADERBOARD.map(e=>{
          const isMe = e.username==='you';
          const rk = getRank(e.points, e.rank);
          const bar = Math.round((e.points/maxPts)*100);
          return (
            <Card key={e.user_id} hover onClick={()=>r.go('profile')} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 14px', border:isMe?`2px solid ${P.primary}`:undefined }}>
              <span style={{ fontFamily:P.disp, fontSize:18, color:rankColour(P,e.rank), minWidth:24, textAlign:'center' }}>{e.rank}</span>
              <Avatar name={e.username} size={32} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:6 }}>
                  <span style={{ fontFamily:P.body, fontWeight:700, fontSize:13, color:P.ink, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>@{e.username}</span>
                  {isMe && <Chip tone="you">You</Chip>}
                </div>
                <div style={{ height:6, background:P.lineSoft, borderRadius:999, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${bar}%`, background:P.primary, borderRadius:999 }} />
                </div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
                <RankBadge rank={rk} showName={false} iconSize={15} />
                <span style={{ fontFamily:P.body, fontWeight:700, fontSize:12.5, color:P.ink }}>{e.points.toLocaleString()}</span>
              </div>
            </Card>
          );
        })}
      </div>

      <Divider m={4} />

      {/* rank tiers */}
      <Eyebrow style={{ margin:'24px 0 12px' }}>Rank tiers</Eyebrow>
      <Card style={{ overflow:'hidden', marginBottom:24 }}>
        {RANKS.map((rk,i)=>(
          <div key={rk.name} style={{ display:'flex', alignItems:'center', gap:11, padding:'9px 14px', borderTop:i?`1px solid ${P.line}`:'none' }}>
            <div style={{ width:108 }}><RankBadge rank={rk} /></div>
            <div style={{ flex:1, height:6, background:P.lineSoft, borderRadius:999, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${Math.max(4,Math.round((rk.min/4500)*100))}%`, background:rk.color, borderRadius:999 }} />
            </div>
            <span style={{ fontFamily:P.body, fontSize:11, color:P.ink2, width:62, textAlign:'right' }}>{rk.min===0?'0 pts':`${rk.min.toLocaleString()}+`}</span>
          </div>
        ))}
        <div style={{ display:'flex', alignItems:'center', gap:11, padding:'9px 14px', borderTop:`1px solid ${P.line}` }}>
          <div style={{ width:108 }}><RankBadge rank={MAGNUS_RANK} /></div>
          <p style={{ flex:1, fontFamily:P.serif, fontStyle:'italic', fontSize:12.5, color:P.ink2, margin:0 }}>Top 20 at this gym</p>
        </div>
      </Card>

      {/* points per grade */}
      <Eyebrow style={{ marginBottom:12 }}>Points per grade</Eyebrow>
      <Card style={{ overflow:'hidden' }}>
        {GRADE_POINTS.map((t,i)=>(
          <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 14px', borderTop:i?`1px solid ${P.line}`:'none' }}>
            <span style={{ fontFamily:P.serif, fontStyle:'italic', fontSize:13.5, color:P.ink, width:78 }}>{t.label}</span>
            <div style={{ flex:1, height:7, background:P.lineSoft, borderRadius:999, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${Math.round((t.points/150)*100)}%`, background:P.primary, borderRadius:999 }} />
            </div>
            <span style={{ fontFamily:P.body, fontWeight:700, fontSize:12.5, color:P.ink, width:52, textAlign:'right' }}>{t.points} pts</span>
          </div>
        ))}
      </Card>
    </PageShell>
  );
}

Object.assign(window, { Profile, Leaderboard });
