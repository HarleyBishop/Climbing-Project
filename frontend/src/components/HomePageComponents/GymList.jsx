import { useState, useEffect } from 'react';
import api from '../../api';
import GymCard from './GymCard';
import { CardSkeleton } from '../Skeleton';
import { HOLD } from '../../lib/holds';
import { SectionLabel, Empty, Btn, inputClass } from '../ui/primitives';
import { cn } from '../../lib/utils';

const HOLD_COLOURS = Object.values(HOLD);
const PER_PAGE = 4;

function GymList() {
  const [allGyms, setAllGyms] = useState([]);
  const [myGyms, setMyGyms] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([api.get('/api/gyms/'), api.get('/api/gyms/my-gyms/')])
      .then(([allRes, myRes]) => {
        setAllGyms(allRes.data);
        setMyGyms(myRes.data);
      })
      .catch(() => setError('Failed to load gyms. Please refresh and try again.'))
      .finally(() => setLoading(false));
  }, []);

  const query = search.trim().toLowerCase();
  const results = query
    ? allGyms.filter(g => g.name.toLowerCase().includes(query) || g.location.toLowerCase().includes(query))
    : null;

  const totalPages = Math.ceil(myGyms.length / PER_PAGE);
  const pageGyms = myGyms.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  if (loading) return <><CardSkeleton /><CardSkeleton /><CardSkeleton /></>;
  if (error) return <p className="text-danger">{error}</p>;

  const list = results ?? pageGyms;
  const offset = results ? 0 : page * PER_PAGE;

  return (
    <section>
      <input
        type="search"
        placeholder="Search all gyms"
        value={search}
        onChange={e => { setSearch(e.target.value); setPage(0); }}
        className={cn(inputClass, 'mb-8 rounded-full px-5')}
      />

      <SectionLabel right={results ? `${results.length} found` : `${myGyms.length} saved`}>
        {results ? 'Results' : 'Your gyms'}
      </SectionLabel>

      {list.length === 0 && (
        <Empty>{results ? 'No gyms match your search.' : 'Log a climb to see your gyms here.'}</Empty>
      )}
      <div className="space-y-3">
        {list.map((gym, i) => (
          <GymCard key={gym.id} gym={gym} colour={HOLD_COLOURS[(offset + i) % HOLD_COLOURS.length]} />
        ))}
      </div>

      {!results && totalPages > 1 && (
        <div className="mt-5 flex items-center justify-between">
          <Btn size="sm" variant="ghost" onClick={() => setPage(p => p - 1)} disabled={page === 0}>Previous</Btn>
          <span className="text-sm text-muted">{page + 1} of {totalPages}</span>
          <Btn size="sm" variant="ghost" onClick={() => setPage(p => p + 1)} disabled={page === totalPages - 1}>Next</Btn>
        </div>
      )}
    </section>
  );
}

export default GymList;
