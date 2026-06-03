import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import { PageShell } from '../components/ui/PageShell';
import { PageSkeleton } from '../components/Skeleton';
import { isSetter } from '../auth';
import { Card, Chip, Eyebrow, Btn, ErrorScreen } from '../components/ui/primitives';

function fmtDateLong(iso) {
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function CompCard({ comp, gymId }) {
  const navigate = useNavigate();
  return (
    <Card hover onClick={() => navigate(`/gym/${gymId}/competitions/${comp.id}`)} style={{ padding: '14px 15px', marginBottom: 11 }}>
      <div className="flex items-start justify-between gap-[10px] mb-2">
        <h3 className="font-display font-normal text-lg m-0 text-ink leading-[1.12]">{comp.title}</h3>
        <div className="flex gap-[6px] shrink-0">
          <Chip tone={comp.comp_type === 'qualifier' ? 'qualifier' : 'finals'}>
            {comp.comp_type === 'qualifier' ? 'Qualifier' : 'Finals'}
          </Chip>
          <Chip tone={comp.status === 'open' ? 'open' : comp.status === 'upcoming' ? 'upcoming' : 'closed'}>
            {comp.status.charAt(0).toUpperCase() + comp.status.slice(1)}
          </Chip>
        </div>
      </div>
      {comp.description && (
        <p className="font-serif italic text-[13.5px] text-ink2 leading-[1.45] m-0 mb-[10px] line-clamp-2">
          {comp.description}
        </p>
      )}
      <div className="flex items-center justify-between font-body text-[11.5px] text-ink3">
        <span>{fmtDateLong(comp.start_date)} → {fmtDateLong(comp.end_date)}</span>
        <span>{comp.registration_count} registered</span>
      </div>
    </Card>
  );
}

function CompetitionList() {
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
  if (error) return <ErrorScreen message={error} onRetry={() => window.location.reload()} />;

  const open = comps.filter(c => c.status === 'open');
  const upcoming = comps.filter(c => c.status === 'upcoming');
  const closed = comps.filter(c => c.status === 'closed');

  return (
    <PageShell back backLabel={gym?.name || 'Back'} backPath={`/gym/${gymId}`} eyebrow={gym?.name} title="Competitions">

      {open.length > 0 && (
        <div className="mb-6">
          <Eyebrow style={{ marginBottom: 12 }}>Live now</Eyebrow>
          {open.map(c => <CompCard key={c.id} comp={c} gymId={gymId} />)}
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="mb-6">
          <Eyebrow style={{ marginBottom: 12 }}>Upcoming</Eyebrow>
          {upcoming.map(c => <CompCard key={c.id} comp={c} gymId={gymId} />)}
        </div>
      )}

      {closed.length > 0 && (
        <div className="mb-6">
          <Eyebrow style={{ marginBottom: 12 }}>Past</Eyebrow>
          {closed.map(c => <CompCard key={c.id} comp={c} gymId={gymId} />)}
        </div>
      )}

      {comps.length === 0 && (
        <p className="font-serif italic text-sm text-ink3 text-center py-10">
          No competitions yet{canCreate ? ' — create one below.' : '.'}
        </p>
      )}

      {canCreate && <Btn full onClick={() => navigate(`/gym/${gymId}/competitions/create`)}>+ Create competition</Btn>}
    </PageShell>
  );
}

export default CompetitionList;
