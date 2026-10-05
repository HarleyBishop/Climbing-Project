import { useNavigate } from 'react-router-dom';
import { Card, Chip } from '../ui/primitives';

function GymCard({ gym, colour }) {
  const navigate = useNavigate();

  return (
    <Card onClick={() => navigate(`/gym/${gym.id}`)} className="flex items-center gap-4 p-5">
      <span className="size-3 shrink-0 rounded-full" style={{ background: colour, boxShadow: `0 0 0 5px ${colour}26` }} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-lg font-semibold">{gym.name}</p>
        <p className="text-sm text-muted">{gym.location} · {gym.wall_count} walls · {gym.climb_count} climbs</p>
      </div>
      <Chip tone={gym.is_active ? 'open' : 'closed'}>{gym.is_active ? 'Open' : 'Closed'}</Chip>
    </Card>
  );
}

export default GymCard;
