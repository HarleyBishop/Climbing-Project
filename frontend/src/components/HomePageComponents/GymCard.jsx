import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../theme';
import { Card, Chip } from '../ui/primitives';

// GymRow — the gym list item used on the Home page.
// colour is a hex value assigned by GymList from the HOLD palette.
function GymCard({ gym, colour }) {
  const P = useTheme();
  const navigate = useNavigate();

  return (
    <Card hover onClick={() => navigate(`/gym/${gym.id}`)} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 15px', marginBottom: 11 }}>
      <span style={{ width: 11, height: 11, borderRadius: '50%', background: colour, flexShrink: 0, boxShadow: `0 0 0 4px ${colour}22` }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: P.disp, fontWeight: 400, fontSize: 18, margin: 0, color: P.ink, lineHeight: 1.12 }}>{gym.name}</p>
        <p style={{ fontFamily: P.body, fontSize: 12, color: P.ink2, margin: '3px 0 0' }}>
          {gym.location} · {gym.wall_count} walls · {gym.climb_count} climbs
        </p>
      </div>
      <Chip tone={gym.is_active ? 'open' : 'closed'}>{gym.is_active ? 'Open' : 'Closed'}</Chip>
    </Card>
  );
}

export default GymCard;
