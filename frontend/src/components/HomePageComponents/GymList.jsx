import { useState, useEffect } from 'react';
import api from '../../api';
import GymCard from './GymCard';
import { CardSkeleton } from '../Skeleton';
import { useTheme, HOLD } from '../../theme';
import { SectionLabel, Eyebrow } from '../ui/primitives';

// Cycle through HOLD colours to give each gym a distinct dot strip.
const HOLD_COLOURS = Object.values(HOLD);
const PER_PAGE = 4;

function GymList() {
  const P = useTheme();
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
    <p style={{ fontFamily: P.serif, fontStyle: 'italic', fontSize: 14, color: '#bb5b46' }}>{error}</p>
  );

  return (
    <div>
      {/* Search field */}
      <div style={{ position: 'relative', marginBottom: 22 }}>
        <div style={{ background: P.card, border: `1px solid ${P.line}`, borderRadius: 12, padding: '11px 15px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 13, height: 13, borderRadius: '50%', border: `1.5px solid ${P.ink3}`, flexShrink: 0, position: 'relative', display: 'inline-block' }} />
          <input
            type="text"
            placeholder="Search gyms near you"
            value={search}
            onChange={e => handleSearch(e.target.value)}
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontFamily: P.body, fontSize: 14, color: search ? P.ink : P.ink3 }}
          />
          {search && (
            <button onClick={() => handleSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: P.ink3, fontSize: 18, lineHeight: 1 }}>×</button>
          )}
        </div>
      </div>

      {filteredGyms ? (
        <>
          <SectionLabel right={<span style={{ fontFamily: P.serif, fontStyle: 'italic', fontSize: 14, color: P.ink2 }}>{filteredGyms.length} found</span>}>Results</SectionLabel>
          {filteredGyms.length === 0
            ? <p style={{ fontFamily: P.serif, fontStyle: 'italic', fontSize: 14, color: P.ink3, padding: '12px 0' }}>No gyms match your search.</p>
            : filteredGyms.map((gym, index) => (
                <GymCard key={gym.id} gym={gym} colour={HOLD_COLOURS[index % HOLD_COLOURS.length]} />
              ))
          }
        </>
      ) : (
        <>
          <SectionLabel right={<span style={{ fontFamily: P.serif, fontStyle: 'italic', fontSize: 14, color: P.ink2 }}>{myGyms.length} saved</span>}>Your gyms</SectionLabel>
          {myGyms.length === 0 ? (
            <p style={{ fontFamily: P.serif, fontStyle: 'italic', fontSize: 14, color: P.ink3, padding: '12px 0' }}>
              Log a climb to see your gyms here.
            </p>
          ) : (
            <>
              {paginatedMyGyms.map((gym, index) => (
                <GymCard key={gym.id} gym={gym} colour={HOLD_COLOURS[(page * PER_PAGE + index) % HOLD_COLOURS.length]} />
              ))}

              {totalPages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                  <button onClick={() => setPage(p => p - 1)} disabled={page === 0}
                    style={{ background: 'none', border: 'none', cursor: page === 0 ? 'default' : 'pointer', fontFamily: P.serif, fontStyle: 'italic', fontSize: 13, color: P.ink2, opacity: page === 0 ? .3 : 1 }}>
                    ‹ Prev
                  </button>
                  <span style={{ fontFamily: P.body, fontSize: 11.5, color: P.ink3 }}>{page + 1} / {totalPages}</span>
                  <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages - 1}
                    style={{ background: 'none', border: 'none', cursor: page === totalPages - 1 ? 'default' : 'pointer', fontFamily: P.serif, fontStyle: 'italic', fontSize: 13, color: P.ink2, opacity: page === totalPages - 1 ? .3 : 1 }}>
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
