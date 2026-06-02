import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import GymList from '../components/HomePageComponents/GymList';
import GymMap from '../components/HomePageComponents/GymMap';
import { PageShell } from '../components/ui/PageShell';
import { Divider, SectionLabel, Btn } from '../components/ui/primitives';
import { isSetter } from '../auth';
import { useTheme } from '../theme';

function Home() {
  const P = useTheme();
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
      <GymList />

      <Divider m={24} />

      <SectionLabel>Gyms near you</SectionLabel>
      {gymsLoading
        ? <div style={{ height: 150, borderRadius: 15, background: '#efe7d4' }} className="animate-pulse" />
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
