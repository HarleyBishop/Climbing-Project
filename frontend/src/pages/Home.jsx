import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import GymList from '../components/HomePageComponents/GymList';
import GymMap from '../components/HomePageComponents/GymMap';
import { PageShell } from '../components/ui/PageShell';
import { Divider, SectionLabel, Btn } from '../components/ui/primitives';
import { isSetter } from '../auth';

function Home() {
  const navigate = useNavigate();
  const canCreate = isSetter();
  const [allGyms, setAllGyms] = useState([]);
  const [gymsLoading, setGymsLoading] = useState(true);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    api.get('/api/gyms/')
      .then(res => setAllGyms(res.data))
      .finally(() => setGymsLoading(false));
  }, []);

  return (
    <PageShell eyebrow={greeting} title="Where are you climbing" titleItalic="today?" heroHeight={188}>
      <div
        onClick={() => navigate('/feed')}
        className="flex items-center justify-between bg-card border border-line rounded-[14px] px-4 py-[13px] mb-5 cursor-pointer"
      >
        <div>
          <p className="font-body font-bold text-[13px] text-ink m-0">Following activity</p>
          <p className="font-serif italic text-[12.5px] text-ink3 mt-[2px] mb-0">Sends and reviews from people you follow</p>
        </div>
        <span className="font-body font-bold text-lg text-ink2 leading-none">›</span>
      </div>

      <GymList />

      <Divider m={24} />

      <SectionLabel>Gyms near you</SectionLabel>
      {gymsLoading
        ? <div className="animate-pulse rounded-[15px] h-[150px]" style={{ background: 'var(--line-soft)' }} />
        : <GymMap gyms={allGyms} />
      }

      {canCreate && (
        <Btn full onClick={() => navigate('/create-gym')} style={{ marginTop: 24 }}>
          Create a gym
        </Btn>
      )}
    </PageShell>
  );
}

export default Home;
