import { useState, useEffect } from 'react';
import api from '../../api';
import GymCard from './GymCard';
import { CardSkeleton } from '../Skeleton';
import { HOLD } from '../../theme';
import { SectionLabel, Eyebrow } from '../ui/primitives';

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
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load gyms. Please refresh and try again.');
        setLoading(false);
      });
  }, []);

  const filteredGyms = search.trim()
    ? allGyms.filter(g =>
        g.name.toLowerCase().includes(search.toLowerCase()) ||
        g.location.toLowerCase().includes(search.toLowerCase()))
    : null;

  const handleSearch = (val) => { setSearch(val); setPage(0); };

  const totalPages = Math.ceil(myGyms.length / PER_PAGE);
  const paginatedMyGyms = myGyms.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  if (loading) return (
    <div>
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </div>
  );

  if (error) return (
    <p className="font-serif italic text-sm text-danger">{error}</p>
  );

  return (
    <div>
      <div className="relative mb-[22px]">
        <div className="bg-card border border-line rounded-[12px] px-[15px] py-[11px] flex items-center gap-[10px]">
          <span className="w-[13px] h-[13px] rounded-full border-[1.5px] border-ink3 shrink-0 relative inline-block" />
          <input
            type="text"
            placeholder="Search gyms near you"
            value={search}
            onChange={e => handleSearch(e.target.value)}
            className="flex-1 bg-transparent border-0 outline-none font-body text-sm"
            style={{ color: search ? 'var(--ink)' : 'var(--ink3)' }}
          />
          {search && (
            <button onClick={() => handleSearch('')} className="bg-transparent border-0 cursor-pointer text-ink3 text-lg leading-none">×</button>
          )}
        </div>
      </div>

      {filteredGyms ? (
        <>
          <SectionLabel right={<span className="font-serif italic text-sm text-ink2">{filteredGyms.length} found</span>}>Results</SectionLabel>
          {filteredGyms.length === 0
            ? <p className="font-serif italic text-sm text-ink3 py-3">No gyms match your search.</p>
            : filteredGyms.map((gym, index) => (
                <GymCard key={gym.id} gym={gym} colour={HOLD_COLOURS[index % HOLD_COLOURS.length]} />
              ))
          }
        </>
      ) : (
        <>
          <SectionLabel right={<span className="font-serif italic text-sm text-ink2">{myGyms.length} saved</span>}>Your gyms</SectionLabel>
          {myGyms.length === 0 ? (
            <p className="font-serif italic text-sm text-ink3 py-3">
              Log a climb to see your gyms here.
            </p>
          ) : (
            <>
              {paginatedMyGyms.map((gym, index) => (
                <GymCard key={gym.id} gym={gym} colour={HOLD_COLOURS[(page * PER_PAGE + index) % HOLD_COLOURS.length]} />
              ))}

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-1">
                  <button
                    onClick={() => setPage(p => p - 1)}
                    disabled={page === 0}
                    className="bg-transparent border-0 font-serif italic text-[13px] text-ink2"
                    style={{ cursor: page === 0 ? 'default' : 'pointer', opacity: page === 0 ? .3 : 1 }}
                  >
                    ‹ Prev
                  </button>
                  <span className="font-body text-[11.5px] text-ink3">{page + 1} / {totalPages}</span>
                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={page === totalPages - 1}
                    className="bg-transparent border-0 font-serif italic text-[13px] text-ink2"
                    style={{ cursor: page === totalPages - 1 ? 'default' : 'pointer', opacity: page === totalPages - 1 ? .3 : 1 }}
                  >
                    Next ›
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

export default GymList;
