// pages-auth.jsx — Login, Register, NotFound (full-sky layouts, no PageShell).

function GoogleWord(){
  return <span style={{ fontFamily:'"Mulish",sans-serif', fontWeight:800, fontSize:14 }}>
    <span style={{ color:'#4285F4' }}>G</span><span style={{ color:'#EA4335' }}>o</span><span style={{ color:'#FBBC05' }}>o</span><span style={{ color:'#4285F4' }}>g</span><span style={{ color:'#34A853' }}>l</span><span style={{ color:'#EA4335' }}>e</span>
  </span>;
}

function AuthScaffold({ headline, headlineItalic, blurb, children }){
  const P = useP();
  return (
    <div style={{ minHeight:'100%', position:'relative', background:P.sheet, display:'flex', flexDirection:'column' }}>
      <div style={{ position:'relative', padding:'22px 24px 30px' }}>
        <Sky stars={P.key==='dusk'} />
        <div style={{ position:'relative' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontFamily:P.disp, fontSize:20, color:P.skyText, letterSpacing:0.3 }}>Beta Board</span>
            <span style={{ fontFamily:P.serif, fontStyle:'italic', fontSize:13, color:P.skyText, opacity:.85 }}>est. 2025</span>
          </div>
          <div style={{ margin:'20px 0 0', borderRadius:18, overflow:'hidden', border:'4px solid rgba(255,255,255,.7)', boxShadow:'0 14px 32px rgba(40,40,30,.28)' }}>
            <img src="./climber.jpg" alt="climbing" style={{ width:'100%', height:146, objectFit:'cover', display:'block' }} />
          </div>
          <h1 style={{ fontFamily:P.disp, fontWeight:400, fontSize:30, lineHeight:1.08, margin:'18px 0 0', color:P.skyText, textShadow: P.key==='dusk'?'0 1px 12px rgba(20,16,40,.35)':'0 1px 10px rgba(255,255,255,.5)' }}>
            {headline}{headlineItalic && <><br/><span style={{ fontFamily:P.serif, fontStyle:'italic' }}>{headlineItalic}</span></>}
          </h1>
        </div>
      </div>
      <div style={{ position:'relative', marginTop:-20, background:P.sheet, borderRadius:'22px 22px 0 0', boxShadow:'0 -8px 24px rgba(40,40,30,.12)', padding:'24px 24px 30px', flex:1 }}>
        {children}
      </div>
    </div>
  );
}

function Login(){
  const P = useP();
  const r = useRouter();
  return (
    <AuthScaffold headline="Your next climb" headlineItalic="is waiting.">
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <Field label="Username" value="" placeholder="your handle" />
        <Field label="Password" value="••••••••" />
        <Btn full onClick={()=>r.go('home')} style={{ marginTop:3 }}>Login</Btn>
      </div>
      <p style={{ textAlign:'center', margin:'14px 0 0', fontFamily:P.body, fontSize:13, color:P.ink2 }}>
        Don’t have an account? <span onClick={()=>r.go('register')} style={{ fontFamily:P.serif, fontStyle:'italic', fontSize:15, color:P.primary, cursor:'pointer' }}>Register</span>
      </p>
      <div style={{ display:'flex', alignItems:'center', gap:12, margin:'18px 0' }}>
        <span style={{ flex:1, height:1, background:P.line }} />
        <span style={{ fontFamily:P.body, fontSize:11.5, color:P.ink3 }}>or continue with</span>
        <span style={{ flex:1, height:1, background:P.line }} />
      </div>
      <Btn full variant="ghost" onClick={()=>r.go('home')}><GoogleWord/></Btn>
    </AuthScaffold>
  );
}

function Register(){
  const P = useP();
  const r = useRouter();
  const [role,setRole] = React.useState('climber');
  return (
    <AuthScaffold headline="Start your" headlineItalic="climbing story.">
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <Field label="Username" value="" placeholder="pick a handle" />
        <Field label="Password" value="" placeholder="create a password" />
        <div>
          <Eyebrow style={{ marginBottom:8, fontSize:10 }}>I’m registering as a…</Eyebrow>
          <div style={{ display:'flex', gap:10 }}>
            {[['climber','Climber'],['setter','Setter / Gym owner']].map(([k,lab])=>{
              const sel = role===k;
              return <button key={k} onClick={()=>setRole(k)} style={{ flex:1, fontFamily:P.body, fontWeight:600, fontSize:13, padding:'10px 8px', borderRadius:11, cursor:'pointer', border:`1px solid ${sel?P.primary:P.line}`, background:sel?P.primary:P.card, color:sel?'#fff':P.ink, transition:'all .12s' }}>{lab}</button>;
            })}
          </div>
        </div>
        <Btn full onClick={()=>{ r.setRole(role); r.go('login'); }} style={{ marginTop:3 }}>Create account</Btn>
      </div>
      <p style={{ textAlign:'center', margin:'14px 0 0', fontFamily:P.body, fontSize:13, color:P.ink2 }}>
        Already have an account? <span onClick={()=>r.go('login')} style={{ fontFamily:P.serif, fontStyle:'italic', fontSize:15, color:P.primary, cursor:'pointer' }}>Login</span>
      </p>
      <p style={{ textAlign:'center', margin:'12px 0 0', fontFamily:P.serif, fontStyle:'italic', fontSize:12.5, color:P.ink3, lineHeight:1.5 }}>
        Google sign-in always creates a Climber account. Setters register above.
      </p>
    </AuthScaffold>
  );
}

function NotFound(){
  const P = useP();
  const r = useRouter();
  return (
    <div style={{ minHeight:'100%', position:'relative', background:P.sheet, display:'flex', flexDirection:'column' }}>
      <div style={{ position:'relative', flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 30px', textAlign:'center' }}>
        <Sky stars={P.key==='dusk'} />
        <div style={{ position:'relative' }}>
          <p style={{ fontFamily:P.serif, fontStyle:'italic', fontSize:64, margin:0, color:P.skyText, opacity:.9, lineHeight:1 }}>404</p>
          <h1 style={{ fontFamily:P.disp, fontWeight:400, fontSize:30, margin:'12px 0 0', color:P.skyText }}>Lost the beta?</h1>
          <p style={{ fontFamily:P.serif, fontStyle:'italic', fontSize:16, color:P.skyText, opacity:.85, margin:'8px 0 24px' }}>
            This route doesn’t exist on the wall.
          </p>
          <Btn onClick={()=>r.go('home')}>Back to your gyms</Btn>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Login, Register, NotFound });
