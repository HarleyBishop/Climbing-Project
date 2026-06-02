// pages-comp.jsx — CompetitionList, CompetitionPage (Info/Climbs/Standings),
// CreateCompetition, CreateGym.

function CompCard({ comp, gymId }){
  const P = useP();
  const r = useRouter();
  return (
    <Card hover onClick={()=>r.go('comp',{ gymId, compId:comp.id })} style={{ padding:'14px 15px', marginBottom:11 }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10, marginBottom:8 }}>
        <h3 style={{ fontFamily:P.disp, fontWeight:400, fontSize:18, margin:0, color:P.ink, lineHeight:1.12 }}>{comp.title}</h3>
        <div style={{ display:'flex', gap:6, flexShrink:0 }}>
          <Chip tone={comp.comp_type}>{comp.comp_type==='qualifier'?'Qualifier':'Finals'}</Chip>
          <Chip tone={comp.status==='open'?'open':comp.status==='upcoming'?'upcoming':'closed'}>{comp.status[0].toUpperCase()+comp.status.slice(1)}</Chip>
        </div>
      </div>
      {comp.description && <p style={{ fontFamily:P.serif, fontStyle:'italic', fontSize:13.5, color:P.ink2, lineHeight:1.45, margin:'0 0 10px', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{comp.description}</p>}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', fontFamily:P.body, fontSize:11.5, color:P.ink3 }}>
        <span>{fmtDateLong(comp.start_date)} → {fmtDateLong(comp.end_date)}</span>
        <span>{comp.registration_count} registered</span>
      </div>
    </Card>
  );
}

function CompetitionList({ params }){
  const P = useP();
  const r = useRouter();
  const gym = GYMS.find(g=>g.id===(params.gymId||1)) || GYMS[0];
  const groups = [['Live now', COMPETITIONS.filter(c=>c.status==='open')], ['Upcoming', COMPETITIONS.filter(c=>c.status==='upcoming')], ['Past', COMPETITIONS.filter(c=>c.status==='closed')]];
  return (
    <PageShell back backLabel={gym.name} onBack={()=>r.go('gym',{ gymId:gym.id })} eyebrow={gym.name} title="Competitions">
      {groups.map(([label,list])=> list.length>0 && (
        <div key={label} style={{ marginBottom:24 }}>
          <Eyebrow style={{ marginBottom:12 }}>{label}</Eyebrow>
          {list.map(c=>(<CompCard key={c.id} comp={c} gymId={gym.id} />))}
        </div>
      ))}
      {r.role==='setter' && <Btn full onClick={()=>r.go('createComp',{ gymId:gym.id })}>+ Create competition</Btn>}
    </PageShell>
  );
}

function Tabs({ tabs, active, onChange }){
  const P = useP();
  return (
    <div style={{ display:'flex', gap:4, borderBottom:`1px solid ${P.line}`, marginBottom:22 }}>
      {tabs.map(t=>{
        const sel = active===t.key;
        return <button key={t.key} onClick={()=>onChange(t.key)} style={{ background:'none', border:'none', borderBottom:`2px solid ${sel?P.primary:'transparent'}`, marginBottom:-1, cursor:'pointer', padding:'9px 12px', fontFamily:P.body, fontWeight:sel?700:600, fontSize:13.5, color:sel?P.ink:P.ink2, transition:'all .12s' }}>{t.label}</button>;
      })}
    </div>
  );
}

function CompetitionPage({ params }){
  const P = useP();
  const r = useRouter();
  const comp = COMPETITIONS.find(c=>c.id===(params.compId||1)) || COMPETITIONS[0];
  const [tab,setTab] = React.useState('info');
  const [registered,setRegistered] = React.useState(comp.is_registered);
  const [logModal,setLogModal] = React.useState(null);
  const isQual = comp.comp_type==='qualifier';
  const eyebrow = `${isQual?'Qualifier':'Finals'} · ${comp.status[0].toUpperCase()+comp.status.slice(1)}`;
  const tabs = [{ key:'info', label:'Info' }, { key:'climbs', label:`Climbs (${COMP_CLIMBS.length})` }, { key:'board', label:isQual?'Leaderboard':'Results' }];

  return (
    <PageShell back backLabel="Competitions" onBack={()=>r.go('comps',{ gymId:params.gymId })} eyebrow={eyebrow} title={comp.title}
      right={<p style={{ fontFamily:P.body, fontSize:12, color:P.skyText, opacity:.85, margin:'8px 0 0' }}>{fmtDateLong(comp.start_date)} → {fmtDateLong(comp.end_date)}</p>}>
      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {tab==='info' && (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:18 }}>
            {[['Opens',fmtDateLong(comp.start_date)],['Closes',fmtDateLong(comp.end_date)],['Registered',comp.registration_count],['Type',isQual?'Qualifier':'Finals']].map(([l,v])=>(
              <div key={l} style={{ background:P.card, border:`1px solid ${P.line}`, borderRadius:12, padding:'12px 14px', textAlign:'center' }}>
                <p style={{ fontFamily:P.disp, fontWeight:400, fontSize:17, margin:0, color:P.ink }}>{v}</p>
                <p style={{ fontFamily:P.body, fontWeight:600, fontSize:9.5, letterSpacing:'0.08em', textTransform:'uppercase', color:P.ink2, margin:'4px 0 0' }}>{l}</p>
              </div>
            ))}
          </div>
          {comp.top_x_advance && (
            <div style={{ background:P.infoBg, borderRadius:12, padding:'11px 14px', marginBottom:18, fontFamily:P.serif, fontStyle:'italic', fontSize:14, color:P.info }}>
              Top {comp.top_x_advance} climbers advance to finals.
            </div>
          )}
          {comp.description && (<><Eyebrow style={{ marginBottom:8 }}>About</Eyebrow><p style={{ fontFamily:P.serif, fontStyle:'italic', fontSize:15, lineHeight:1.5, color:P.ink, margin:'0 0 18px' }}>{comp.description}</p></>)}
          {comp.rules && (<><Eyebrow style={{ marginBottom:8 }}>Rules</Eyebrow><p style={{ fontFamily:P.serif, fontStyle:'italic', fontSize:14, lineHeight:1.6, color:P.ink, margin:'0 0 18px', whiteSpace:'pre-line' }}>{comp.rules}</p></>)}
          {comp.divisions?.length>0 && (<><Eyebrow style={{ marginBottom:10 }}>Divisions</Eyebrow><div style={{ display:'flex', gap:7, flexWrap:'wrap', marginBottom:18 }}>{comp.divisions.map(d=>(<Chip key={d} tone="soft">{d}</Chip>))}</div></>)}
          {comp.rounds?.length>0 && (<><Eyebrow style={{ marginBottom:10 }}>Rounds</Eyebrow><div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:22 }}>{comp.rounds.map((rd,i)=>(
            <div key={rd} style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ width:22, height:22, borderRadius:'50%', background:P.primarySoft, color:P.primaryD, fontFamily:P.body, fontWeight:700, fontSize:11, display:'flex', alignItems:'center', justifyContent:'center' }}>{i+1}</span>
              <span style={{ fontFamily:P.serif, fontStyle:'italic', fontSize:14.5, color:P.ink }}>{rd}</span>
            </div>))}</div></>)}

          <Divider m={6} />
          <div style={{ marginTop:18 }}>
            {comp.status==='closed' ? (
              <Empty>This competition has ended.</Empty>
            ) : registered ? (
              <Card style={{ display:'flex', alignItems:'center', gap:10, padding:'13px 15px', background:P.goodBg, borderColor:'transparent' }}>
                <span style={{ color:P.good, fontSize:17 }}>✓</span>
                <p style={{ flex:1, fontFamily:P.serif, fontStyle:'italic', fontSize:14, color:P.good, margin:0 }}>You’re registered — head to Climbs to log your sends.</p>
              </Card>
            ) : (
              <Btn full onClick={()=>setRegistered(true)}>Register for this competition</Btn>
            )}
          </div>
        </div>
      )}

      {tab==='climbs' && (
        <div>
          {r.role==='setter' && <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:14 }}><Btn size="sm" onClick={()=>{}}>+ Add climb</Btn></div>}
          <div style={{ display:'flex', flexDirection:'column', gap:11 }}>
            {COMP_CLIMBS.map(cc=>(
              <Card key={cc.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 13px' }}>
                <div style={{ width:40, height:40, borderRadius:10, background:HOLD[cc.climb_colour], flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:P.body, fontWeight:700, fontSize:12.5, color:'#fff' }}>V{cc.climb_grade}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontFamily:P.disp, fontWeight:400, fontSize:16, margin:0, color:P.ink, lineHeight:1.1 }}>{cc.climb_name}</p>
                  <p style={{ fontFamily:P.body, fontSize:11.5, color:P.ink2, margin:'3px 0 0' }}>{cc.wall_name} · {cc.points_value} pts</p>
                </div>
                {cc.my_send ? <Chip tone="open">✓ {cc.my_send.attempts} att.</Chip>
                  : (registered && comp.status==='open') ? <Btn size="sm" onClick={()=>setLogModal(cc)}>Log send</Btn>
                  : null}
              </Card>
            ))}
          </div>
          {!registered && comp.status==='open' && <p style={{ fontFamily:P.serif, fontStyle:'italic', fontSize:13, color:P.ink3, textAlign:'center', marginTop:16 }}>Register on the Info tab to log your sends.</p>}
        </div>
      )}

      {tab==='board' && (
        <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
          {COMP_LEADERBOARD.map(e=>{
            const isMe = e.username==='you';
            const bar = Math.round((e.points/COMP_LEADERBOARD[0].points)*100);
            return (
              <Card key={e.user_id} hover onClick={()=>r.go('profile')} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 14px', border:isMe?`2px solid ${P.primary}`:undefined }}>
                <span style={{ fontFamily:P.disp, fontSize:18, color:rankColour(P,e.rank), minWidth:22, textAlign:'center' }}>{e.rank}</span>
                <Avatar name={e.username} size={30} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:6 }}>
                    <span style={{ fontFamily:P.body, fontWeight:700, fontSize:13, color:P.ink }}>@{e.username}</span>
                    {isMe && <Chip tone="you">You</Chip>}
                    {e.advances && <Chip tone="upcoming">Advances</Chip>}
                  </div>
                  <div style={{ height:6, background:P.lineSoft, borderRadius:999, overflow:'hidden' }}><div style={{ height:'100%', width:`${bar}%`, background:P.primary, borderRadius:999 }} /></div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <p style={{ fontFamily:P.body, fontWeight:700, fontSize:12.5, color:P.ink, margin:0 }}>{e.points}</p>
                  <p style={{ fontFamily:P.body, fontSize:10.5, color:P.ink2, margin:'2px 0 0' }}>{e.climbs_completed} climbs</p>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {logModal && (
        <Modal title="Log comp send" subtitle={`${logModal.climb_name} · ${logModal.points_value} pts`} onClose={()=>setLogModal(null)}>
          <Field label="Attempts" value="" placeholder="e.g. 3" type="number" />
          <div style={{ display:'flex', gap:10, marginTop:16 }}>
            <Btn full onClick={()=>setLogModal(null)}>Save</Btn>
            <Btn full variant="ghost" onClick={()=>setLogModal(null)}>Cancel</Btn>
          </div>
        </Modal>
      )}
    </PageShell>
  );
}

// ── CreateGym (setter) ──
function CreateGym(){
  const P = useP();
  const r = useRouter();
  const [active,setActive] = React.useState(true);
  const [walls,setWalls] = React.useState([{ id:1, name:'Crimp Wall', colour:'Green' }]);
  const [colour,setColour] = React.useState('Green');
  return (
    <PageShell back backLabel="Home" onBack={()=>r.go('home')} eyebrow="New gym" title="Set up your gym">
      <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
        <Field label="Gym name" value="" placeholder="e.g. Boulder HQ" />
        <Field label="Location" value="" placeholder="e.g. 12 Forge St, Newstead" />
        <div>
          <Eyebrow style={{ marginBottom:8, fontSize:10 }}>Map coordinates · optional</Eyebrow>
          <div style={{ display:'flex', gap:10 }}>
            <Field value="" placeholder="Latitude" type="number" />
            <Field value="" placeholder="Longitude" type="number" />
          </div>
        </div>
        <Card style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'13px 15px' }}>
          <span style={{ fontFamily:P.serif, fontStyle:'italic', fontSize:14.5, color:P.ink }}>{active?'Gym is currently open':'Gym is currently closed'}</span>
          <Toggle on={active} onChange={setActive} />
        </Card>

        <div>
          <Eyebrow style={{ marginBottom:6 }}>Walls</Eyebrow>
          <p style={{ fontFamily:P.serif, fontStyle:'italic', fontSize:13, color:P.ink3, margin:'0 0 12px' }}>Add the walls in your gym so setters can assign climbs.</p>
          {walls.map(w=>(
            <Card key={w.id} style={{ display:'flex', alignItems:'center', gap:11, padding:'11px 14px', marginBottom:9 }}>
              <span style={{ width:11, height:11, borderRadius:'50%', background:HOLD[w.colour] }} />
              <span style={{ flex:1, fontFamily:P.disp, fontWeight:400, fontSize:16, color:P.ink }}>{w.name}</span>
              <button onClick={()=>setWalls(walls.filter(x=>x.id!==w.id))} style={{ background:'none', border:'none', cursor:'pointer', fontFamily:P.body, fontWeight:600, fontSize:12, color:'#bb5b46' }}>Remove</button>
            </Card>
          ))}
          <Card style={{ padding:'14px 15px', marginTop:3 }}>
            <div style={{ display:'flex', flexDirection:'column', gap:13 }}>
              <Field label="Wall name" value="" placeholder="e.g. Overhang" />
              <div>
                <Eyebrow style={{ marginBottom:9, fontSize:10 }}>Colour</Eyebrow>
                <ColourSwatches value={colour} onPick={setColour} />
              </div>
              <Btn full variant="ghost" onClick={()=>setWalls([...walls,{ id:Date.now(), name:'New wall', colour }])}>+ Add wall</Btn>
            </div>
          </Card>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:4 }}>
          <Btn full onClick={()=>r.go('home')}>Create gym</Btn>
          <Btn full variant="ghost" onClick={()=>r.go('home')}>Cancel</Btn>
        </div>
      </div>
    </PageShell>
  );
}

// ── CreateCompetition (setter) ──
function CreateCompetition({ params }){
  const P = useP();
  const r = useRouter();
  const [type,setType] = React.useState('qualifier');
  const [divisions,setDivisions] = React.useState(['Open','Women’s']);
  const [rounds,setRounds] = React.useState(['Qualifier','Final']);
  const chipRow = (items,setItems,placeholder)=>(
    <div>
      {items.map((d,i)=>(
        <Card key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 14px', marginBottom:8 }}>
          <span style={{ fontFamily:P.serif, fontStyle:'italic', fontSize:14, color:P.ink }}>{placeholder==='round'?`${i+1}. `:''}{d}</span>
          <button onClick={()=>setItems(items.filter((_,j)=>j!==i))} style={{ background:'none', border:'none', cursor:'pointer', fontFamily:P.body, fontWeight:600, fontSize:12, color:'#bb5b46' }}>Remove</button>
        </Card>
      ))}
      <div style={{ display:'flex', gap:8 }}>
        <Field value="" placeholder={placeholder==='round'?'e.g. Semi-final':'e.g. Masters'} />
        <Btn variant="ghost" onClick={()=>setItems([...items, placeholder==='round'?'New round':'New division'])}>Add</Btn>
      </div>
    </div>
  );
  return (
    <PageShell back backLabel="Competitions" onBack={()=>r.go('comps',{ gymId:params.gymId })} eyebrow="New competition" title="Create competition">
      <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
        <div>
          <Eyebrow style={{ marginBottom:8, fontSize:10 }}>Competition type</Eyebrow>
          <div style={{ display:'flex', gap:10 }}>
            {[['qualifier','Qualifier'],['finals','Finals / World Cup']].map(([k,lab])=>{
              const sel = type===k;
              return <button key={k} onClick={()=>setType(k)} style={{ flex:1, fontFamily:P.body, fontWeight:600, fontSize:13, padding:'10px 8px', borderRadius:11, cursor:'pointer', border:`1px solid ${sel?P.primary:P.line}`, background:sel?P.primary:P.card, color:sel?'#fff':P.ink }}>{lab}</button>;
            })}
          </div>
        </div>
        <Field label="Title" value="" placeholder="e.g. Spring Open 2026" />
        <Field label="Description" value="" placeholder="Brief overview of the comp" textarea />
        <Field label="Rules" optional value="" placeholder="Format, scoring notes…" textarea />
        <div style={{ display:'flex', gap:10 }}>
          <Field label="Starts" value="" type="datetime-local" />
          <Field label="Ends" value="" type="datetime-local" />
        </div>
        {type==='qualifier' && <Field label="Top X advance" optional value="" placeholder="e.g. 20" type="number" />}
        <div><Eyebrow style={{ marginBottom:10 }}>Divisions</Eyebrow>{chipRow(divisions,setDivisions,'division')}</div>
        <div><Eyebrow style={{ marginBottom:10 }}>Rounds · optional</Eyebrow>{chipRow(rounds,setRounds,'round')}</div>
        <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:4 }}>
          <Btn full onClick={()=>r.go('comp',{ gymId:params.gymId, compId:1 })}>Create competition</Btn>
          <Btn full variant="ghost" onClick={()=>r.go('comps',{ gymId:params.gymId })}>Cancel</Btn>
        </div>
      </div>
    </PageShell>
  );
}

Object.assign(window, { CompetitionList, CompetitionPage, CreateGym, CreateCompetition });
