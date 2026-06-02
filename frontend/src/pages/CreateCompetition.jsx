import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import { PageShell } from '../components/ui/PageShell';
import { Btn, Field, Eyebrow, Card } from '../components/ui/primitives';
import { useTheme } from '../theme';

function CreateCompetition() {
  const P = useTheme();
  const { gymId } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rules, setRules] = useState('');
  const [compType, setCompType] = useState('qualifier');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [topX, setTopX] = useState('');
  const [linkedQualifier, setLinkedQualifier] = useState('');
  const [divisions, setDivisions] = useState([]);
  const [newDivision, setNewDivision] = useState('');
  const [rounds, setRounds] = useState([]);
  const [newRound, setNewRound] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const addDivision = () => {
    if (newDivision.trim()) { setDivisions([...divisions, newDivision.trim()]); setNewDivision(''); }
  };
  const addRound = () => {
    if (newRound.trim()) { setRounds([...rounds, newRound.trim()]); setNewRound(''); }
  };

  const handleSubmit = async () => {
    setError(null);
    if (!title.trim()) return setError('Please enter a title.');
    if (!startDate) return setError('Please set a start date.');
    if (!endDate) return setError('Please set an end date.');
    if (new Date(endDate) <= new Date(startDate)) return setError('End date must be after start date.');
    setLoading(true);
    try {
      const payload = {
        title, description, rules, comp_type: compType,
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
      };
      if (compType === 'qualifier' && topX) payload.top_x_advance = parseInt(topX);
      if (compType === 'finals' && linkedQualifier) payload.linked_qualifier = parseInt(linkedQualifier);

      const res = await api.post(`/api/gyms/${gymId}/competitions/`, payload);
      const compId = res.data.id;
      await Promise.all([
        ...divisions.map(name => api.post(`/api/competitions/${compId}/divisions/`, { name })),
        ...rounds.map((name, i) => api.post(`/api/competitions/${compId}/rounds/`, { name, order: i + 1 })),
      ]);
      navigate(`/gym/${gymId}/competitions/${compId}`);
    } catch (err) {
      const data = err.response?.data;
      if (data) {
        const key = Object.keys(data)[0];
        setError(data[key]?.[0] || 'Failed to create competition.');
      } else {
        setError('Failed to create competition.');
      }
    } finally { setLoading(false); }
  };

  const inputStyle = { width: '100%', background: P.card, border: `1px solid ${P.line}`, borderRadius: 11, padding: '11px 14px', fontFamily: P.body, fontSize: 14, color: P.ink, outline: 'none', boxSizing: 'border-box' };

  return (
    <PageShell back backLabel="Competitions" backPath={`/gym/${gymId}/competitions`} eyebrow="New competition" title="Create competition">
      {error && (
        <div style={{ background: 'rgba(187,91,70,.10)', border: '1px solid rgba(187,91,70,.25)', borderRadius: 12, padding: '10px 14px', marginBottom: 20, fontFamily: P.serif, fontStyle: 'italic', fontSize: 13.5, color: '#bb5b46' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Type selector */}
        <div>
          <Eyebrow style={{ marginBottom: 8, fontSize: 10 }}>Competition type</Eyebrow>
          <div style={{ display: 'flex', gap: 10 }}>
            {[['qualifier', 'Qualifier'], ['finals', 'Finals / World Cup']].map(([k, lab]) => {
              const sel = compType === k;
              return (
                <button key={k} type="button" onClick={() => setCompType(k)}
                  style={{ flex: 1, fontFamily: P.body, fontWeight: 600, fontSize: 13, padding: '10px 8px', borderRadius: 11, cursor: 'pointer', border: `1px solid ${sel ? P.primary : P.line}`, background: sel ? P.primary : P.card, color: sel ? '#fff' : P.ink, transition: 'all .12s' }}>
                  {lab}
                </button>
              );
            })}
          </div>
        </div>

        <Field label="Title" value={title} onChange={setTitle} placeholder="e.g. Spring Open 2026" />
        <Field label="Description" value={description} onChange={setDescription} placeholder="Brief overview of the comp" textarea />
        <Field label="Rules" optional value={rules} onChange={setRules} placeholder="Format, scoring notes…" textarea />

        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontFamily: P.body, fontWeight: 700, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: P.ink2, marginBottom: 6 }}>Starts</label>
            <input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} style={inputStyle} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontFamily: P.body, fontWeight: 700, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: P.ink2, marginBottom: 6 }}>Ends</label>
            <input type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} style={inputStyle} />
          </div>
        </div>

        {compType === 'qualifier' && (
          <Field label="Top X advance" optional value={topX} onChange={setTopX} placeholder="e.g. 20" type="number" />
        )}
        {compType === 'finals' && (
          <Field label="Linked qualifier ID" optional value={linkedQualifier} onChange={setLinkedQualifier} placeholder="Competition ID" type="number" />
        )}

        {/* Divisions */}
        <div>
          <Eyebrow style={{ marginBottom: 10 }}>Divisions</Eyebrow>
          {divisions.map((d, i) => (
            <Card key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 14px', marginBottom: 8 }}>
              <span style={{ fontFamily: P.serif, fontStyle: 'italic', fontSize: 14, color: P.ink }}>{d}</span>
              <button type="button" onClick={() => setDivisions(divisions.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: P.body, fontWeight: 600, fontSize: 12, color: '#bb5b46' }}>Remove</button>
            </Card>
          ))}
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="text" placeholder="e.g. Open, Women's" value={newDivision} onChange={e => setNewDivision(e.target.value)} onKeyDown={e => e.key === 'Enter' && addDivision()} style={{ ...inputStyle, flex: 1 }} />
            <Btn variant="ghost" onClick={addDivision}>Add</Btn>
          </div>
        </div>

        {/* Rounds */}
        <div>
          <Eyebrow style={{ marginBottom: 10 }}>Rounds · optional</Eyebrow>
          {rounds.map((r, i) => (
            <Card key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 14px', marginBottom: 8 }}>
              <span style={{ fontFamily: P.serif, fontStyle: 'italic', fontSize: 14, color: P.ink }}>{i + 1}. {r}</span>
              <button type="button" onClick={() => setRounds(rounds.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: P.body, fontWeight: 600, fontSize: 12, color: '#bb5b46' }}>Remove</button>
            </Card>
          ))}
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="text" placeholder="e.g. Semi-final, Final" value={newRound} onChange={e => setNewRound(e.target.value)} onKeyDown={e => e.key === 'Enter' && addRound()} style={{ ...inputStyle, flex: 1 }} />
            <Btn variant="ghost" onClick={addRound}>Add</Btn>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
          <Btn full onClick={handleSubmit} disabled={loading}>{loading ? 'Creating…' : 'Create Competition'}</Btn>
          <Btn full variant="ghost" onClick={() => navigate(`/gym/${gymId}/competitions`)}>Cancel</Btn>
        </div>
      </div>
    </PageShell>
  );
}

export default CreateCompetition;
