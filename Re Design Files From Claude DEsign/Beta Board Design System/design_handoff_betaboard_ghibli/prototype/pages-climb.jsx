// pages-climb.jsx — ClimbPage with colour hero, stats, grade voting, sends,
// reviews, videos, and the log-send / write-review modals.

function StatCell({ v, l, last }){
  const P = useP();
  return (
    <div style={{ flex:1, textAlign:'center', borderRight: last?'none':`1px solid ${P.line}`, padding:'0 4px' }}>
      <p style={{ fontFamily:P.disp, fontWeight:400, fontSize:23, margin:0, color:P.ink, lineHeight:1 }}>{v}</p>
      <p style={{ fontFamily:P.body, fontWeight:600, fontSize:9.5, letterSpacing:'0.08em', textTransform:'uppercase', color:P.ink2, margin:'5px 0 0' }}>{l}</p>
    </div>
  );
}

function ClimbPage({ params }){
  const P = useP();
  const r = useRouter();
  const climb = CLIMBS.find(c=>c.id===(params.climbId||1)) || CLIMBS[0];
  const hold = HOLD[climb.colour];
  const [vote,setVote] = React.useState(null);
  const [sent,setSent] = React.useState(false);
  const [sendAttempts,setSendAttempts] = React.useState('');
  const [showSend,setShowSend] = React.useState(false);
  const [showReview,setShowReview] = React.useState(false);
  const [rStars,setRStars] = React.useState(0);
  const onSky = '#fff';

  return (
    <div style={{ minHeight:'100%', background:P.sheet, position:'relative' }}>
      {/* colour hero */}
      <div style={{ position:'relative', minHeight:192, overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, background:`linear-gradient(165deg, ${hold} 0%, ${hold} 55%, rgba(0,0,0,.18) 130%)` }} />
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(90% 70% at 75% 12%, rgba(255,255,255,.3), transparent 60%)' }} />
        <div style={{ position:'absolute', inset:0, backgroundImage:GRAIN, backgroundSize:'160px 160px', opacity:0.13, mixBlendMode:'soft-light' }} />
        <div style={{ position:'relative', padding:'16px 20px 0' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <button onClick={()=>r.go('gym',{ gymId:params.gymId })} style={{ background:'none', border:'none', cursor:'pointer', padding:0, fontFamily:P.body, fontWeight:600, fontSize:13.5, color:onSky, display:'inline-flex', alignItems:'center', gap:4 }}>
              <span style={{ fontSize:17, lineHeight:1 }}>‹</span> {climb.wall_name}
            </button>
            <Avatar name={ME.username} size={30} onClick={()=>r.go('profile')} />
          </div>
          <div style={{ marginTop:30, paddingBottom:30 }}>
            <Eyebrow color="rgba(255,255,255,.85)" style={{ marginBottom:7 }}>{climb.colour} hold · {climb.wall_name}</Eyebrow>
            <h1 style={{ fontFamily:P.disp, fontWeight:400, fontSize:34, lineHeight:1, margin:0, color:'#fff', textShadow:'0 2px 14px rgba(0,0,0,.22)' }}>{climb.name}</h1>
            <p style={{ fontFamily:P.serif, fontStyle:'italic', fontSize:14.5, color:'rgba(255,255,255,.92)', margin:'8px 0 0' }}>Set by @{climb.added_by} · {fmtDate(climb.set_at)}</p>
          </div>
        </div>
      </div>

      <div style={{ position:'relative', marginTop:-20, background:P.sheet, borderRadius:'22px 22px 0 0', padding:'20px 20px 40px' }}>
        {/* stat row */}
        <div style={{ display:'flex', border:`1px solid ${P.line}`, borderRadius:14, background:P.card, padding:'14px 0' }}>
          <StatCell v={`V${climb.suggested_grade}`} l="Setter" />
          <StatCell v={climb.community_grade?`V${climb.community_grade}`:'—'} l="Community" />
          <StatCell v={climb.sends} l="Sends" />
          <StatCell v={climb.reviews} l="Reviews" last />
        </div>

        {/* send strip */}
        <div style={{ marginTop:16 }}>
          {sent ? (
            <Card style={{ display:'flex', alignItems:'center', gap:10, padding:'13px 15px', background:P.goodBg, borderColor:'transparent' }}>
              <span style={{ color:P.good, fontSize:17 }}>✓</span>
              <p style={{ flex:1, fontFamily:P.serif, fontStyle:'italic', fontSize:14.5, color:P.good, margin:0 }}>You sent this! <strong style={{ fontStyle:'normal', fontFamily:P.body, fontWeight:700 }}>{sendAttempts||4} attempts</strong></p>
              <Btn size="sm" variant="ghost" onClick={()=>setShowSend(true)}>Edit</Btn>
            </Card>
          ) : (
            <Card style={{ display:'flex', alignItems:'center', gap:10, padding:'13px 15px' }}>
              <p style={{ flex:1, fontFamily:P.serif, fontStyle:'italic', fontSize:15, color:P.ink, margin:0 }}>Logged your send yet?</p>
              <Btn size="sm" onClick={()=>setShowSend(true)}>Log send</Btn>
            </Card>
          )}
        </div>

        {/* grade vote */}
        <SectionLabel style={{ margin:'24px 0 10px' }}>Vote the grade</SectionLabel>
        <GradePills grades={[2,3,4,5,6,7,8]} value={vote} onPick={setVote} />
        <p style={{ fontFamily:P.serif, fontStyle:'italic', fontSize:13, color:P.ink3, margin:'10px 0 0' }}>
          {vote!==null ? `You voted V${vote}. Community sits at V${climb.community_grade||climb.suggested_grade}.` : 'Tap a grade to add your vote.'}
        </p>

        <Divider m={24} />

        {/* videos */}
        <SectionLabel>Beta videos · 2</SectionLabel>
        <div style={{ display:'flex', gap:11 }}>
          {[0,1].map(i=>(
            <div key={i} style={{ flex:1, position:'relative', height:96, borderRadius:12, overflow:'hidden', border:`1px solid ${P.line}`, background:`linear-gradient(150deg, ${hold}, rgba(0,0,0,.25))` }}>
              <div style={{ position:'absolute', inset:0, backgroundImage:GRAIN, backgroundSize:'160px 160px', opacity:0.14, mixBlendMode:'soft-light' }} />
              <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:34, height:34, borderRadius:'50%', background:'rgba(255,255,255,.85)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <span style={{ marginLeft:3, borderStyle:'solid', borderWidth:'7px 0 7px 11px', borderColor:`transparent transparent transparent ${P.ink}` }} />
              </div>
            </div>
          ))}
        </div>

        <Divider m={24} />

        {/* reviews */}
        <SectionLabel>Reviews · {REVIEWS.length}</SectionLabel>
        <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
          {REVIEWS.map((rv,i)=>(
            <div key={rv.id} style={{ borderBottom: i<REVIEWS.length-1?`1px solid ${P.line}`:'none', paddingBottom: i<REVIEWS.length-1?18:0 }}>
              <p style={{ fontFamily:P.serif, fontStyle:'italic', fontSize:16.5, lineHeight:1.4, color:P.ink, margin:0 }}>“{rv.comment}”</p>
              <div style={{ display:'flex', alignItems:'center', gap:9, marginTop:11 }}>
                <Avatar name={rv.username} size={26} />
                <span style={{ fontFamily:P.body, fontWeight:600, fontSize:12.5, color:P.ink }}>@{rv.username}</span>
                <Stars n={rv.stars} />
                <span style={{ fontFamily:P.body, fontSize:11.5, color:P.ink2, marginLeft:'auto' }}>{rv.attempts} attempts</span>
              </div>
            </div>
          ))}
        </div>
        <Btn full variant="ghost" onClick={()=>setShowReview(true)} style={{ marginTop:20 }}>+ Write a review</Btn>
      </div>

      {/* log send modal */}
      {showSend && (
        <Modal title="Log your send" subtitle="How many attempts did it take?" onClose={()=>setShowSend(false)}>
          <Field label="Attempts" value={sendAttempts} placeholder="e.g. 5" type="number" onChange={setSendAttempts} />
          <div style={{ display:'flex', gap:10, marginTop:16 }}>
            <Btn full onClick={()=>{ setSent(true); setShowSend(false); }}>Log send</Btn>
            <Btn full variant="ghost" onClick={()=>setShowSend(false)}>Cancel</Btn>
          </div>
        </Modal>
      )}

      {/* write review modal */}
      {showReview && (
        <Modal title="Write a review" subtitle="Share your beta on this climb" onClose={()=>setShowReview(false)}>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <Field label="Comment" value="" placeholder="What did you think?" textarea />
            <div>
              <Eyebrow style={{ marginBottom:8, fontSize:10 }}>Stars</Eyebrow>
              <Stars n={rStars} size={26} onPick={setRStars} />
            </div>
            <Field label="Attempts" value="" placeholder="e.g. 3" type="number" />
            <Field label="Video URL" optional value="" placeholder="https://…" />
            <div style={{ display:'flex', gap:10 }}>
              <Btn full onClick={()=>setShowReview(false)}>Submit</Btn>
              <Btn full variant="ghost" onClick={()=>setShowReview(false)}>Cancel</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

Object.assign(window, { ClimbPage });
