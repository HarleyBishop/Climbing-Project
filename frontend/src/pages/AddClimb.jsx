import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import { PageShell } from '../components/ui/PageShell';
import { Btn, Field, Eyebrow, GradePills, ColourSwatches } from '../components/ui/primitives';

const GRADES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

function AddClimb() {
  const { gymId, wallId } = useParams();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [colour, setColour] = useState('Green');
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
        <div className="rounded-[12px] px-[14px] py-[10px] mb-5 font-serif italic text-[13.5px] text-danger" style={{ background: 'rgba(187,91,70,.10)', border: '1px solid rgba(187,91,70,.25)' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-[22px]">
          <Field label="Climb name" value={name} onChange={setName} placeholder="e.g. Crimpy arête" />

          <div>
            <Eyebrow style={{ marginBottom: 10, fontSize: 10 }}>
              Hold colour — <span className="text-primary">{colour}</span>
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
              className="w-full bg-card border border-line rounded-[12px] px-[14px] py-[11px] font-body text-sm text-ink outline-none box-border"
              style={{ borderStyle: 'dashed' }}
            />
            {imageUrl && (
              <img src={imageUrl} alt="preview" onError={e => (e.target.style.display = 'none')}
                className="mt-3 w-full rounded-[12px] border border-line object-cover" style={{ height: 140 }} />
            )}
          </div>

          <div className="flex flex-col gap-[10px]">
            <Btn full type="submit" disabled={loading}>{loading ? 'Adding climb…' : 'Add climb'}</Btn>
            <Btn full variant="ghost" type="button" onClick={() => navigate(`/gym/${gymId}`)}>Cancel</Btn>
          </div>
        </div>
      </form>
    </PageShell>
  );
}

export default AddClimb;
