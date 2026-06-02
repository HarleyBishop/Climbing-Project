import { useNavigate } from 'react-router-dom';
import { useTheme } from '../theme';
import { Sky } from '../components/ui/Sky';
import { Btn } from '../components/ui/primitives';

function NotFound() {
  const P = useTheme();
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', position: 'relative', background: P.sheet, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <Sky stars={P.key === 'dusk'} />
      <div style={{ position: 'relative', textAlign: 'center', padding: '0 30px' }}>
        <p style={{ fontFamily: P.serif, fontStyle: 'italic', fontSize: 64, margin: 0, color: P.skyText, opacity: .9, lineHeight: 1 }}>404</p>
        <h1 style={{ fontFamily: P.disp, fontWeight: 400, fontSize: 30, margin: '12px 0 0', color: P.skyText }}>Lost the beta?</h1>
        <p style={{ fontFamily: P.serif, fontStyle: 'italic', fontSize: 16, color: P.skyText, opacity: .85, margin: '8px 0 24px' }}>
          This route doesn't exist on the wall.
        </p>
        <Btn onClick={() => navigate('/')}>Back to your gyms</Btn>
      </div>
    </div>
  );
}

export default NotFound;
