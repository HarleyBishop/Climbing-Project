import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import { PageShell } from '../components/ui/PageShell';
import { Btn, Field, Eyebrow, GradePills, ColourSwatches } from '../components/ui/primitives';
import { useTheme } from '../theme';

const GRADES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

function AddClimb() {
  const P = useTheme();
  const { gymId, wallId } = useParams();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [colour, setColour] = useState('Green');
  // grade starts null so "please select" validation fires — V0 would pass a falsy check.
  const [grade, setGrade] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (grade === null) { setError('Please select a grade'); return; }
    setLoading(true);
    try {
      await api.post(`/api/gyms/${gymId}/walls/${wallId}/climbs/`, {
        name, colour, suggested_grade: grade, image_url: imageUrl,
      });
      navigate(`/gym/${gymId}`);
    } catch { setError('Failed to add climb. Please try again.'); }
    finally { setLoading(false); }
  };

  return (
    <PageShell back backLabel="Back to gym" backPath={`/gym/${gymId}`} eyebrow="New climb" title="Add a new climb">
      {error && (
        <div style={{ background: 'rgba(187,91,70,.10)', border: '1px solid rgba(187,91,70,.25)', borderRadius: 12, padding: '10px 14px', marginBottom: 20, fontFamily: P.serif, fontStyle: 'italic', fontSize: 13.5, color: '#bb5b46' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <Field label="Climb name" value={name} onChange={setName} placeholder="e.g. Crimpy arête" />

          <div>
            <Eyebrow style={{ marginBottom: 10, fontSize: 10 }}>
              Hold colour — <span style={{ color: P.primary }}>{colour}</span>
            </Eyebrow>
            <ColourSwatches value={colour} onPick={setColour} />
          </div>

          <div>
            <Eyebrow style={{ marginBottom: 10, fontSize: 10 }}>
              Setter grade{grade !== null ? ` — V${grade}` : ''}
            </Eyebrow>
            <GradePills grades={GRADES} value={grade} onPick={setGrade} />
          </div>

          <div>
            <Eyebrow style={{ marginBottom: 8, fontSize: 10 }}>Photo · optional</Eyebrow>
            <input
              type="url"
              placeholder="https://… or drop a wall photo URL"
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              style={{ width: '100%', background: P.card, border: `1px dashed ${P.line}`, borderRadius: 12, padding: '11px 14px', fontFamily: P.body, fontSize: 14, color: P.ink, outline: 'none', boxSizing: 'border-box' }}
            />
            {imageUrl && (
              <img src={imageUrl} alt="preview" onError={e => (e.target.style.display = 'none')}
                style={{ marginTop: 12, width: '100%', height: 140, objectFit: 'cover', borderRadius: 12, border: `1px solid ${P.line}` }} />
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Btn full type="submit" disabled={loading}>{loading ? 'Adding climb…' : 'Add climb'}</Btn>
            <Btn full variant="ghost" type="button" onClick={() => navigate(`/gym/${gymId}`)}>Cancel</Btn>
          </div>
        </div>
      </form>
    </PageShell>
  );
}

export default AddClimb;
