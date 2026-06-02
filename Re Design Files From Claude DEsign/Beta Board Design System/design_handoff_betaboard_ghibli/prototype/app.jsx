// app.jsx — theme + router providers, mobile frame, screen switch.

const SCREENS = {
  login: ()=> <Login/>,
  register: ()=> <Register/>,
  home: (p)=> <Home params={p}/>,
  gym: (p)=> <GymPage params={p}/>,
  climb: (p)=> <ClimbPage params={p}/>,
  profile: (p)=> <Profile params={p}/>,
  leaderboard: (p)=> <Leaderboard params={p}/>,
  comps: (p)=> <CompetitionList params={p}/>,
  comp: (p)=> <CompetitionPage params={p}/>,
  createGym: (p)=> <CreateGym params={p}/>,
  addClimb: (p)=> <AddClimb params={p}/>,
  archived: (p)=> <ArchivedClimbs params={p}/>,
  createComp: (p)=> <CreateCompetition params={p}/>,
  notFound: ()=> <NotFound/>,
};

const LS = 'betaboard-ghibli';
function loadState(){
  try { return JSON.parse(localStorage.getItem(LS)) || {}; } catch { return {}; }
}

function Root(){
  const saved = loadState();
  const [themeKey,setThemeKeyRaw] = React.useState(saved.themeKey || 'meadow');
  const [role,setRoleRaw] = React.useState(saved.role || 'setter');
  const [view,setView] = React.useState(saved.view || { screen:'login', params:{} });
  const stack = React.useRef([]);

  const persist = (patch)=>{
    const next = { themeKey, role, view, ...patch };
    try { localStorage.setItem(LS, JSON.stringify(next)); } catch {}
  };
  const setThemeKey = (k)=>{ setThemeKeyRaw(k); persist({ themeKey:k }); };
  const setRole = (k)=>{ setRoleRaw(k); persist({ role:k }); };

  const frameRef = React.useRef(null);
  const go = (screen, params={})=>{
    stack.current.push(view);
    const v = { screen, params };
    setView(v); persist({ view:v });
    if(frameRef.current) frameRef.current.scrollTop = 0;
  };
  const back = ()=>{
    const prev = stack.current.pop();
    const v = prev || { screen:'home', params:{} };
    setView(v); persist({ view:v });
    if(frameRef.current) frameRef.current.scrollTop = 0;
  };

  const palette = THEMES[themeKey] || MEADOW;
  const router = { ...view, go, back, role, setRole, themeKey, setThemeKey };
  const render = SCREENS[view.screen] || SCREENS.notFound;

  return (
    <ThemeCtx.Provider value={palette}>
      <RouterCtx.Provider value={router}>
        <div style={{ minHeight:'100vh', width:'100%', background:'#ddd6c8', display:'flex', justifyContent:'center' }}>
          <div ref={frameRef} style={{ position:'relative', width:'100%', maxWidth:432, height:'100vh', overflowY:'auto', overflowX:'hidden', background:palette.sheet, boxShadow:'0 0 60px rgba(60,40,20,.18)' }}>
            {render(view.params)}
          </div>
        </div>
        <FloatingControls/>
      </RouterCtx.Provider>
    </ThemeCtx.Provider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Root/>);
