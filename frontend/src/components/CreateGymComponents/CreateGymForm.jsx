import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { PageShell } from '../ui/PageShell';
import { Btn, Field, Eyebrow, Card, Toggle, ColourSwatches } from '../ui/primitives';
import { useTheme, HOLD } from '../../theme';

// WallRow — a confirmed wall shown in the walls list before submission.
function WallRow({ wall, onRemove }) {
  const P = useTheme();
  const hex = HOLD[wall.colour] || '#cd6f3f';
  return (
    <Card style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 14px', marginBottom: 9 }}>
      <span style={{ width: 11, height: 11, borderRadius: '50%', background: hex, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <p style={{ fontFamily: P.disp, fontWeight: 400, fontSize: 16, margin: 0, color: P.ink }}>{wall.name}</p>
        {wall.description && <p style={{ fontFamily: P.body, fontSize: 11.5, color: P.ink2, margin: '2px 0 0' }}>{wall.description}</p>}
      </div>
      <button onClick={() => onRemove(wall.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: P.body, fontWeight: 600, fontSize: 12, color: '#bb5b46' }}>Remove</button>
    </Card>
  );
}

// AddWallForm — inline form for building new walls before the gym is saved.
function AddWallForm({ onAddWall }) {
  const P = useTheme();
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
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
  const P = useTheme();
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

  return (
    <PageShell back backLabel="Back" backPath="/" eyebrow="New gym" title="Set up your gym">
      {error && (
        <div style={{ background: 'rgba(187,91,70,.10)', border: '1px solid rgba(187,91,70,.25)', borderRadius: 12, padding: '10px 14px', marginBottom: 20, fontFamily: P.serif, fontStyle: 'italic', fontSize: 13.5, color: '#bb5b46' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <Field label="Gym name" value={gymName} onChange={setGymName} placeholder="e.g. Boulder HQ" />
        <Field label="Location" value={location} onChange={setLocation} placeholder="e.g. 12 Forge St, Newstead" />

        <div>
          <Eyebrow style={{ marginBottom: 8, fontSize: 10 }}>Map coordinates · optional</Eyebrow>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <input type="number" step="any" placeholder="Latitude e.g. -27.47" value={lat} onChange={e => setLat(e.target.value)}
                style={{ width: '100%', background: P.card, border: `1px solid ${P.line}`, borderRadius: 11, padding: '11px 14px', fontFamily: P.body, fontSize: 13.5, color: P.ink, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ flex: 1 }}>
              <input type="number" step="any" placeholder="Longitude e.g. 153.02" value={lng} onChange={e => setLng(e.target.value)}
                style={{ width: '100%', background: P.card, border: `1px solid ${P.line}`, borderRadius: 11, padding: '11px 14px', fontFamily: P.body, fontSize: 13.5, color: P.ink, outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>
          <p style={{ fontFamily: P.serif, fontStyle: 'italic', fontSize: 12.5, color: P.ink3, margin: '6px 0 0' }}>
            Right-click on Google Maps and copy the coordinates.
          </p>
        </div>

        <Card style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 15px' }}>
          <span style={{ fontFamily: P.serif, fontStyle: 'italic', fontSize: 14.5, color: P.ink }}>
            {isActive ? 'Gym is currently open' : 'Gym is currently closed'}
          </span>
          <Toggle on={isActive} onChange={setIsActive} />
        </Card>

        <div>
          <Eyebrow style={{ marginBottom: 6 }}>Walls</Eyebrow>
          <p style={{ fontFamily: P.serif, fontStyle: 'italic', fontSize: 13, color: P.ink3, margin: '0 0 12px' }}>
            Add the walls in your gym so setters can assign climbs.
          </p>
          {walls.map(w => <WallRow key={w.id} wall={w} onRemove={removeWall} />)}
          <AddWallForm onAddWall={addWall} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
          <Btn full onClick={handleSubmit} disabled={loading}>{loading ? 'Creating gym…' : 'Create gym'}</Btn>
          <Btn full variant="ghost" onClick={() => navigate('/')}>Cancel</Btn>
        </div>
      </div>
    </PageShell>
  );
}

export default CreateGymForm;
