import { useNavigate } from 'react-router-dom';
import { useTheme, HOLD, GRAIN } from '../../theme';
import { Card } from '../ui/primitives';

// ClimbTile — 2-column grid card on GymPage and ArchivedClimbs.
// Header is a full-bleed colour gradient using the hold colour, with grain overlay.
function ClimbCard({ climb, gymId, wallId, setLabel }) {
  const P = useTheme();
  const navigate = useNavigate();
  const hold = HOLD[climb.colour] || '#cd6f3f';

  return (
    <div>
      {setLabel && (
        <p style={{ fontFamily: P.serif, fontStyle: 'italic', fontSize: 11.5, color: P.ink3, margin: '0 0 5px' }}>
          Set {new Date(climb.set_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
        </p>
      )}
      <Card hover onClick={() => navigate(`/gym/${gymId}/wall/${wallId}/climb/${climb.id}`)} style={{ overflow: 'hidden' }}>
        {/* Colour hero — gradient + grain overlay mimics the design's painterly feel */}
        {climb.image_url ? (
          <img src={climb.image_url} alt={climb.name} style={{ width: '100%', height: 78, objectFit: 'cover', display: 'block' }} />
        ) : (
          <div style={{ position: 'relative', height: 78, overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(160deg, ${hold} 0%, ${hold} 60%, rgba(0,0,0,.16) 130%)` }} />
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(80% 70% at 78% 14%, rgba(255,255,255,.30), transparent 60%)' }} />
            <div style={{ position: 'absolute', inset: 0, backgroundImage: GRAIN, backgroundSize: '160px 160px', opacity: 0.12, mixBlendMode: 'soft-light' }} />
            <div style={{ position: 'absolute', bottom: 8, left: 8, display: 'flex', gap: 6 }}>
              <span style={{ fontFamily: P.body, fontWeight: 700, fontSize: 10.5, padding: '2px 8px', borderRadius: 999, background: 'rgba(0,0,0,.28)', color: '#fff' }}>{climb.colour}</span>
              <span style={{ fontFamily: P.body, fontWeight: 700, fontSize: 10.5, padding: '2px 8px', borderRadius: 999, background: 'rgba(0,0,0,.28)', color: '#fff' }}>V{climb.suggested_grade}</span>
            </div>
          </div>
        )}
        <div style={{ padding: '10px 12px 12px' }}>
          <p style={{ fontFamily: P.disp, fontWeight: 400, fontSize: 15.5, margin: 0, color: P.ink, lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{climb.name}</p>
          <p style={{ fontFamily: P.body, fontSize: 11.5, color: P.ink2, margin: '4px 0 0' }}>
            Setter V{climb.suggested_grade}{climb.community_grade ? ` · Community V${climb.community_grade}` : ''}
          </p>
        </div>
      </Card>
    </div>
  );
}

export default ClimbCard;
