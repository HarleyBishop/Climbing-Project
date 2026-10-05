import { useNavigate } from 'react-router-dom';
import { holdColour } from '../../lib/holds';
import { Card } from '../ui/primitives';

const fmtDay = (iso) => new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });

function ClimbCard({ climb, gymId, wallId, setLabel }) {
  const navigate = useNavigate();
  const hold = holdColour(climb.colour);

  return (
    <Card onClick={() => navigate(`/gym/${gymId}/wall/${wallId}/climb/${climb.id}`)} className="group overflow-hidden">
      <div className="relative h-28 overflow-hidden">
        {climb.image_url ? (
          <img src={climb.image_url} alt={climb.name} className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          // No photo: a glossy tile in the hold colour.
          <div
            className="size-full transition-transform duration-500 group-hover:scale-105"
            style={{ background: `radial-gradient(120% 90% at 80% 0%, rgba(255,255,255,.45), transparent 55%), ${hold}` }}
          />
        )}
        <span className="absolute bottom-2 left-2 rounded-full bg-black/40 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur">
          V{climb.suggested_grade}
        </span>
      </div>
      <div className="p-4">
        <p className="truncate font-semibold">{climb.name}</p>
        <p className="mt-0.5 text-xs text-muted">
          {setLabel ? `Set ${fmtDay(climb.set_at)}` : climb.community_grade ? `Community V${climb.community_grade}` : climb.colour}
        </p>
      </div>
    </Card>
  );
}

export default ClimbCard;
