import { useNavigate } from 'react-router-dom';
import { Card, Chip } from '../ui/primitives';

function GymCard({ gym, colour }) {
  const navigate = useNavigate();

  return (
    <Card hover onClick={() => navigate(`/gym/${gym.id}`)} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 15px', marginBottom: 11 }}>
      <span className="w-[11px] h-[11px] rounded-full shrink-0" style={{ background: colour, boxShadow: `0 0 0 4px ${colour}22` }} />
      <div className="flex-1 min-w-0">
        <p className="font-display font-normal text-lg m-0 text-ink leading-[1.12]">{gym.name}</p>
        <p className="font-body text-xs text-ink2 mt-[3px] mb-0">
          {gym.location} · {gym.wall_count} walls · {gym.climb_count} climbs
        </p>
      </div>
      <Chip tone={gym.is_active ? 'open' : 'closed'}>{gym.is_active ? 'Open' : 'Closed'}</Chip>
    </Card>
  );
}

export default GymCard;
