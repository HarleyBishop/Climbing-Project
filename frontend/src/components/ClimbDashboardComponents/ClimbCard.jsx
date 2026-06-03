import { useNavigate } from 'react-router-dom';
import { HOLD, GRAIN } from '../../theme';
import { Card } from '../ui/primitives';

function ClimbCard({ climb, gymId, wallId, setLabel }) {
  const navigate = useNavigate();
  const hold = HOLD[climb.colour] || '#cd6f3f';

  return (
    <div>
      {setLabel && (
        <p className="font-serif italic text-[11.5px] text-ink3 m-0 mb-[5px]">
          Set {new Date(climb.set_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
        </p>
      )}
      <Card hover onClick={() => navigate(`/gym/${gymId}/wall/${wallId}/climb/${climb.id}`)} style={{ overflow: 'hidden' }}>
        {climb.image_url ? (
          <img src={climb.image_url} alt={climb.name} className="w-full block object-cover" style={{ height: 78 }} />
        ) : (
          <div className="relative overflow-hidden" style={{ height: 78 }}>
            <div className="absolute inset-0" style={{ background: `linear-gradient(160deg, ${hold} 0%, ${hold} 60%, rgba(0,0,0,.16) 130%)` }} />
            <div className="absolute inset-0" style={{ background: 'radial-gradient(80% 70% at 78% 14%, rgba(255,255,255,.30), transparent 60%)' }} />
            <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: GRAIN, backgroundSize: '160px 160px', opacity: 0.12, mixBlendMode: 'soft-light' }} />
            <div className="absolute bottom-2 left-2 flex gap-[6px]">
              <span className="font-body font-bold text-[10.5px] px-2 py-[2px] rounded-full text-white" style={{ background: 'rgba(0,0,0,.28)' }}>{climb.colour}</span>
              <span className="font-body font-bold text-[10.5px] px-2 py-[2px] rounded-full text-white" style={{ background: 'rgba(0,0,0,.28)' }}>V{climb.suggested_grade}</span>
            </div>
          </div>
        )}
        <div className="px-3 pt-[10px] pb-3">
          <p className="font-display font-normal text-[15.5px] m-0 text-ink leading-[1.1] truncate">{climb.name}</p>
          <p className="font-body text-[11.5px] text-ink2 mt-1 mb-0">
            Setter V{climb.suggested_grade}{climb.community_grade ? ` · Community V${climb.community_grade}` : ''}
          </p>
        </div>
      </Card>
    </div>
  );
}

export default ClimbCard;
