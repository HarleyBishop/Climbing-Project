import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import { PageShell } from '../components/ui/PageShell';
import { Btn, Field, Segmented, Chip, ErrorText, inputClass } from '../components/ui/primitives';
import { cn } from '../lib/utils';

// A text box + Add button that builds up a list of names (divisions, rounds).
function ListBuilder({ label, placeholder, items, onChange, numbered }) {
  const [draft, setDraft] = useState('');
  const add = () => {
    if (draft.trim()) { onChange([...items, draft.trim()]); setDraft(''); }
  };
  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {items.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {items.map((item, i) => (
            <Chip key={i} className="flex items-center gap-1.5 py-1 pl-3 text-sm">
              {numbered && `${i + 1}. `}{item}
              <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} className="cursor-pointer text-faint hover:text-danger">✕</button>
            </Chip>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder={placeholder}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          className={cn(inputClass, 'flex-1')}
        />
        <Btn variant="ghost" onClick={add}>Add</Btn>
      </div>
    </div>
  );
}

function CreateCompetition() {
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
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

      const compId = (await api.post(`/api/gyms/${gymId}/competitions/`, payload)).data.id;
      await Promise.all([
        ...divisions.map(name => api.post(`/api/competitions/${compId}/divisions/`, { name })),
        ...rounds.map((name, i) => api.post(`/api/competitions/${compId}/rounds/`, { name, order: i + 1 })),
      ]);
      navigate(`/gym/${gymId}/competitions/${compId}`);
    } catch (err) {
      const data = err.response?.data;
      setError((data && Object.values(data)[0]?.[0]) || 'Failed to create competition.');
    } finally { setLoading(false); }
  };

  return (
    <PageShell back backLabel="Competitions" backPath={`/gym/${gymId}/competitions`} eyebrow="New competition" title="Create a competition">
      <div className="space-y-6">
        {error && <ErrorText>{error}</ErrorText>}

        <div>
          <span className="mb-1.5 block text-sm font-medium">Format</span>
          <Segmented
            layoutId="comp-type"
            value={compType}
            onChange={setCompType}
            options={[{ key: 'qualifier', label: 'Qualifier' }, { key: 'finals', label: 'Finals / World Cup' }]}
          />
        </div>

        <Field label="Title" value={title} onChange={setTitle} placeholder="e.g. Spring Open 2026" />
        <Field label="Description" value={description} onChange={setDescription} placeholder="Brief overview of the comp" textarea />
        <Field label="Rules" optional value={rules} onChange={setRules} placeholder="Format, scoring notes…" textarea />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Starts" type="datetime-local" value={startDate} onChange={setStartDate} />
          <Field label="Ends" type="datetime-local" value={endDate} onChange={setEndDate} />
        </div>

        {compType === 'qualifier'
          ? <Field label="Top X advance to finals" optional value={topX} onChange={setTopX} placeholder="e.g. 20" type="number" />
          : <Field label="Linked qualifier ID" optional value={linkedQualifier} onChange={setLinkedQualifier} placeholder="Competition ID" type="number" />}

        <ListBuilder label="Divisions" placeholder="e.g. Open, Youth" items={divisions} onChange={setDivisions} />
        <ListBuilder label="Rounds · optional" placeholder="e.g. Semi-final" items={rounds} onChange={setRounds} numbered />

        <div className="flex gap-3 pt-4">
          <Btn full variant="ghost" onClick={() => navigate(`/gym/${gymId}/competitions`)}>Cancel</Btn>
          <Btn full onClick={handleSubmit} disabled={loading}>{loading ? 'Creating…' : 'Create competition'}</Btn>
        </div>
      </div>
    </PageShell>
  );
}

export default CreateCompetition;
