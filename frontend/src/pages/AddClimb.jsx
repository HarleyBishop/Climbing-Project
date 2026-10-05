import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import { PageShell } from '../components/ui/PageShell';
import { Btn, Field, GradePills, ColourSwatches, ErrorText } from '../components/ui/primitives';
import { holdColour } from '../lib/holds';

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
    if (grade === null) { setError('Please select a grade.'); return; }
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
    <PageShell back backLabel="Back to gym" backPath={`/gym/${gymId}`} eyebrow="New climb" title="Add a climb">
      <form onSubmit={handleSubmit} className="space-y-8">
        {error && <ErrorText>{error}</ErrorText>}

        {/* Live preview tile, same look as the climb cards. */}
        <div
          className="flex h-40 items-end rounded-3xl p-6 text-white transition-colors duration-300"
          style={{ background: `radial-gradient(120% 100% at 85% 0%, rgba(255,255,255,.35), transparent 50%), ${holdColour(colour)}` }}
        >
          <div className="[text-shadow:0_1px_10px_rgba(0,0,0,.2)]">
            <p className="text-sm font-semibold opacity-90">{colour}{grade !== null && ` · V${grade}`}</p>
            <p className="text-3xl font-semibold tracking-tight">{name || 'Untitled climb'}</p>
          </div>
        </div>

        <Field label="Climb name" value={name} onChange={setName} placeholder="e.g. Crimpy arête" />

        <div>
          <span className="mb-3 block text-sm font-medium">Hold colour</span>
          <ColourSwatches value={colour} onPick={setColour} />
        </div>

        <div>
          <span className="mb-3 block text-sm font-medium">Setter grade</span>
          <GradePills grades={GRADES} value={grade} onPick={setGrade} />
        </div>

        <div>
          <Field label="Photo URL" optional type="url" value={imageUrl} onChange={setImageUrl} placeholder="https://…" />
          {imageUrl && (
            <img src={imageUrl} alt="Preview" onError={e => (e.target.style.display = 'none')} className="mt-3 h-40 w-full rounded-2xl object-cover" />
          )}
        </div>

        <div className="flex gap-3">
          <Btn full variant="ghost" onClick={() => navigate(`/gym/${gymId}`)}>Cancel</Btn>
          <Btn full type="submit" disabled={loading}>{loading ? 'Adding…' : 'Add climb'}</Btn>
        </div>
      </form>
    </PageShell>
  );
}

export default AddClimb;
