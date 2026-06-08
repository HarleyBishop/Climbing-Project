import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { PageShell } from '../ui/PageShell';
import { Btn, Field, Eyebrow, Card, Toggle, ColourSwatches } from '../ui/primitives';
import { HOLD } from '../../theme';

function WallRow({ wall, onRemove }) {
  const hex = HOLD[wall.colour] || '#cd6f3f';
  return (
    <Card style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 14px', marginBottom: 9 }}>
      <span className="w-2.75-h-2.75ounded-full shrink-0" style={{ background: hex }} />
      <div className="flex-1">
        <p className="font-display font-normal text-base m-0 text-ink">{wall.name}</p>
        {wall.description && <p className="font-body text-[11.5px] text-ink2 mt-0.5 mb-0">{wall.description}</p>}
      </div>
      <button onClick={() => onRemove(wall.id)} className="bg-transparent border-0 cursor-pointer font-body font-semibold text-xs text-danger">Remove</button>
    </Card>
  );
}

function AddWallForm({ onAddWall }) {
  const [wallName, setWallName] = useState('');
  const [wallDescription, setWallDescription] = useState('');
  const [selectedColour, setSelectedColour] = useState('Green');

  const handleAdd = () => {
    if (!wallName) return;
    onAddWall({ id: Date.now(), name: wallName, description: wallDescription, colour: selectedColour });
    setWallName(''); setWallDescription(''); setSelectedColour('Green');
  };

  return (
    <Card style={{ padding: '14px 15px', marginTop: 3 }}>
      <div className="flex flex-col gap-3.25">
        <Field label="Wall name" value={wallName} onChange={setWallName} placeholder="e.g. Overhang" style={{ marginBottom: 0 }} />
        <Field label="Description" optional value={wallDescription} onChange={setWallDescription} placeholder="Short description…" style={{ marginBottom: 0 }} />
        <div>
          <Eyebrow style={{ marginBottom: 9, fontSize: 10 }}>Colour</Eyebrow>
          <ColourSwatches value={selectedColour} onPick={setSelectedColour} />
        </div>
        <Btn full variant="ghost" onClick={handleAdd}>+ Add wall</Btn>
      </div>
    </Card>
  );
}

function CreateGymForm() {
  const [gymName, setGymName] = useState('');
  const [location, setLocation] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [walls, setWalls] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const addWall = (wall) => setWalls([...walls, wall]);
  const removeWall = (id) => setWalls(walls.filter(w => w.id !== id));

  const handleSubmit = async () => {
    setError(null);
    if (!gymName.trim()) { setError('Please enter a gym name.'); return; }
    if (!location.trim()) { setError('Please enter a location.'); return; }
    setLoading(true);
    try {
      const res = await api.post('/api/gyms/', {
        name: gymName, location, is_active: isActive,
        lat: lat !== '' ? parseFloat(lat) : null,
        lng: lng !== '' ? parseFloat(lng) : null,
      });
      const gymId = res.data.id;
      for (const wall of walls) {
        await api.post(`/api/gyms/${gymId}/walls/`, { name: wall.name, description: wall.description });
      }
      navigate('/');
    } catch (err) {
      const data = err.response?.data;
      if (data) {
        const firstKey = Object.keys(data)[0];
        setError(data[firstKey]?.[0] || 'Failed to create gym. Please try again.');
      } else {
        setError('Failed to create gym. Please try again.');
      }
    } finally { setLoading(false); }
  };

  const inputClass = 'w-full bg-card border border-line rounded-[11px] px-[14px] py-[11px] font-body text-[13.5px] text-ink outline-none box-border';

  return (
    <PageShell back backLabel="Back" backPath="/" eyebrow="New gym" title="Set up your gym">
      {error && (
        <div className="rounded-xl px-3.5 py-2.5 mb-5 font-serif italic text-[13.5px] text-danger" style={{ background: 'rgba(187,91,70,.10)', border: '1px solid rgba(187,91,70,.25)' }}>
          {error}
        </div>
      )}

      <div className="flex flex-col gap-4.5">
        <Field label="Gym name" value={gymName} onChange={setGymName} placeholder="e.g. Boulder HQ" />
        <Field label="Location" value={location} onChange={setLocation} placeholder="e.g. 12 Forge St, Newstead" />

        <div>
          <Eyebrow style={{ marginBottom: 8, fontSize: 10 }}>Map coordinates · optional</Eyebrow>
          <div className="flex gap-2.5">
            <div className="flex-1">
              <input type="number" step="any" placeholder="Latitude e.g. -27.47" value={lat} onChange={e => setLat(e.target.value)} className={inputClass} />
            </div>
            <div className="flex-1">
              <input type="number" step="any" placeholder="Longitude e.g. 153.02" value={lng} onChange={e => setLng(e.target.value)} className={inputClass} />
            </div>
          </div>
          <p className="font-serif italic text-[12.5px] text-ink3 mt-1.5 mb-0">
            Right-click on Google Maps and copy the coordinates.
          </p>
        </div>

        <Card style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 15px' }}>
          <span className="font-serif italic text-[14.5px] text-ink">
            {isActive ? 'Gym is currently open' : 'Gym is currently closed'}
          </span>
          <Toggle on={isActive} onChange={setIsActive} />
        </Card>

        <div>
          <Eyebrow style={{ marginBottom: 6 }}>Walls</Eyebrow>
          <p className="font-serif italic text-[13px] text-ink3 m-0 mb-3">
            Add the walls in your gym so setters can assign climbs.
          </p>
          {walls.map(w => <WallRow key={w.id} wall={w} onRemove={removeWall} />)}
          <AddWallForm onAddWall={addWall} />
        </div>

        <div className="flex flex-col gap-2.5 mt-1">
          <Btn full onClick={handleSubmit} disabled={loading}>{loading ? 'Creating gym…' : 'Create gym'}</Btn>
          <Btn full variant="ghost" onClick={() => navigate('/')}>Cancel</Btn>
        </div>
      </div>
    </PageShell>
  );
}

export default CreateGymForm;
