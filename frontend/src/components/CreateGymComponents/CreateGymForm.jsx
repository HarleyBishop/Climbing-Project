import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { PageShell } from '../ui/PageShell';
import { Btn, Field, Card, Toggle, ErrorText } from '../ui/primitives';

function AddWallForm({ onAddWall }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleAdd = () => {
    if (!name.trim()) return;
    onAddWall({ id: Date.now(), name: name.trim(), description });
    setName(''); setDescription('');
  };

  return (
    <Card className="space-y-4 p-5">
      <Field label="Wall name" value={name} onChange={setName} placeholder="e.g. Overhang" />
      <Field label="Description" optional value={description} onChange={setDescription} placeholder="Short description…" />
      <Btn full variant="ghost" onClick={handleAdd}>Add wall</Btn>
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
      // Sequential so walls are created in the order they were added.
      for (const wall of walls) {
        await api.post(`/api/gyms/${res.data.id}/walls/`, { name: wall.name, description: wall.description });
      }
      navigate('/');
    } catch (err) {
      const data = err.response?.data;
      setError((data && Object.values(data)[0]?.[0]) || 'Failed to create gym. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <PageShell back backLabel="Back" backPath="/" eyebrow="New gym" title="Set up your gym">
      <div className="space-y-6">
        {error && <ErrorText>{error}</ErrorText>}

        <Field label="Gym name" value={gymName} onChange={setGymName} placeholder="e.g. Boulder HQ" />
        <Field label="Location" value={location} onChange={setLocation} placeholder="e.g. 12 Forge St, Newstead" />

        <div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Latitude" optional type="number" value={lat} onChange={setLat} placeholder="-27.47" />
            <Field label="Longitude" optional type="number" value={lng} onChange={setLng} placeholder="153.02" />
          </div>
          <p className="mt-1.5 text-sm text-muted">Right-click a spot in Google Maps to copy its coordinates.</p>
        </div>

        <Card className="flex items-center justify-between p-5">
          <span>{isActive ? 'Gym is open' : 'Gym is closed'}</span>
          <Toggle on={isActive} onChange={setIsActive} />
        </Card>

        <div>
          <h2 className="text-xl font-semibold">Walls</h2>
          <p className="mb-4 text-sm text-muted">Add the walls in your gym so setters can assign climbs.</p>
          <div className="space-y-2">
            {walls.map(w => (
              <Card key={w.id} className="flex items-center gap-4 px-5 py-4">
                <div className="flex-1">
                  <p className="font-semibold">{w.name}</p>
                  {w.description && <p className="text-sm text-muted">{w.description}</p>}
                </div>
                <button onClick={() => setWalls(walls.filter(x => x.id !== w.id))} className="cursor-pointer text-sm text-danger">Remove</button>
              </Card>
            ))}
            <AddWallForm onAddWall={wall => setWalls([...walls, wall])} />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Btn full variant="ghost" onClick={() => navigate('/')}>Cancel</Btn>
          <Btn full onClick={handleSubmit} disabled={loading}>{loading ? 'Creating…' : 'Create gym'}</Btn>
        </div>
      </div>
    </PageShell>
  );
}

export default CreateGymForm;
