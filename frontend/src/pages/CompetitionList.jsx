import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import { PageShell } from '../components/ui/PageShell';
import { PageSkeleton } from '../components/Skeleton';
import { isSetter } from '../auth';
import { Card, Chip, Eyebrow, Btn } from '../components/ui/primitives';
import { useTheme } from '../theme';

function fmtDateLong(iso) {
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function CompCard({ comp, gymId }) {
  const P = useTheme();
  const navigate = useNavigate();
  return (
    <Card hover onClick={() => navigate(`/gym/${gymId}/competitions/${comp.id}`)} style={{ padding: '14px 15px', marginBottom: 11 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
        <h3 style={{ fontFamily: P.disp, fontWeight: 400, fontSize: 18, margin: 0, color: P.ink, lineHeight: 1.12 }}>{comp.title}</h3>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <Chip tone={comp.comp_type === 'qualifier' ? 'qualifier' : 'finals'}>
            {comp.comp_type === 'qualifier' ? 'Qualifier' : 'Finals'}
          </Chip>
          <Chip tone={comp.status === 'open' ? 'open' : comp.status === 'upcoming' ? 'upcoming' : 'closed'}>
            {comp.status.charAt(0).toUpperCase() + comp.status.slice(1)}
          </Chip>
        </div>
      </div>
      {comp.description && (
        <p style={{ fontFamily: P.serif, fontStyle: 'italic', fontSize: 13.5, color: P.ink2, lineHeight: 1.45, margin: '0 0 10px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {comp.description}
        </p>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: P.body, fontSize: 11.5, color: P.ink3 }}>
        <span>{fmtDateLong(comp.start_date)} → {fmtDateLong(comp.end_date)}</span>
        <span>{comp.registration_count} registered</span>
      </div>
    </Card>
  );
}

function CompetitionList() {
  const P = useTheme();
  const { gymId } = useParams();
  const navigate = useNavigate();
  const canCreate = isSetter();

  const [gym, setGym] = useState(null);
  const [comps, setComps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [gymRes, compsRes] = await Promise.all([
          api.get(`/api/gyms/${gymId}/`),
          api.get(`/api/gyms/${gymId}/competitions/`),
        ]);
        setGym(gymRes.data);
        setComps(compsRes.data);
      } catch { setError('Failed to load competitions.'); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [gymId]);

  if (loading) return <PageSkeleton />;

  if (error) return (
    <div style={{ minHeight: '100vh', background: P.sheet, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontFamily: P.serif, fontStyle: 'italic', color: '#bb5b46', fontSize: 14, marginBottom: 16 }}>{error}</p>
        <button onClick={() => window.location.reload()} style={{ fontFamily: P.body, fontWeight: 700, fontSize: 13.5, padding: '10px 20px', borderRadius: 12, background: P.primary, color: '#fff', border: 'none', cursor: 'pointer' }}>Retry</button>
      </div>
    </div>
  );

  const open = comps.filter(c => c.status === 'open');
  const upcoming = comps.filter(c => c.status === 'upcoming');
  const closed = comps.filter(c => c.status === 'closed');

  return (
    <PageShell back backLabel={gym?.name || 'Back'} backPath={`/gym/${gymId}`} eyebrow={gym?.name} title="Competitions">

      {open.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <Eyebrow style={{ marginBottom: 12 }}>Live now</Eyebrow>
          {open.map(c => <CompCard key={c.id} comp={c} gymId={gymId} />)}
        </div>
      )}

      {upcoming.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <Eyebrow style={{ marginBottom: 12 }}>Upcoming</Eyebrow>
          {upcoming.map(c => <CompCard key={c.id} comp={c} gymId={gymId} />)}
        </div>
      )}

      {closed.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <Eyebrow style={{ marginBottom: 12 }}>Past</Eyebrow>
          {closed.map(c => <CompCard key={c.id} comp={c} gymId={gymId} />)}
        </div>
      )}

      {comps.length === 0 && (
        <p style={{ fontFamily: P.serif, fontStyle: 'italic', fontSize: 14, color: P.ink3, textAlign: 'center', padding: '40px 0' }}>
          No competitions yet{canCreate ? ' — create one below.' : '.'}
        </p>
      )}

      {canCreate && <Btn full onClick={() => navigate(`/gym/${gymId}/competitions/create`)}>+ Create competition</Btn>}
    </PageShell>
  );
}

export default CompetitionList;
