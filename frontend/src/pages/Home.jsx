import { useState, useEffect } from 'react';
import api from '../api';
import GymList from '../components/HomePageComponents/GymList';
import GymMap from '../components/HomePageComponents/GymMap';
import { PageShell } from '../components/ui/PageShell';
import { SectionLabel } from '../components/ui/primitives';
import { BentoGrid, BentoCard } from '../components/magicui/bento-grid';
import { BlurFade } from '../components/magicui/blur-fade';
import { HOLD } from '../lib/holds';
import { isSetter } from '../auth';

// Decorative bento background: a loose cluster of hold-coloured circles
// fading out towards the text.
function HoldCluster() {
  const holds = Object.values(HOLD);
  return (
    <div className="absolute -top-6 right-0 grid grid-cols-4 gap-3 p-6 opacity-90 mask-b-from-20% mask-b-to-90%">
      {holds.concat(holds).slice(0, 12).map((c, i) => (
        <span key={i} style={{ background: c }} className="size-10 rounded-full transition-transform duration-500 group-hover:scale-110 sm:size-12" />
      ))}
    </div>
  );
}

function Home() {
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
    <PageShell eyebrow={greeting} title="Where are you climbing" titleItalic="today?">
      <BentoGrid className="mb-16">
        <BentoCard
          to="/feed"
          name="Following activity"
          description="Sends and reviews from people you follow."
          cta="Open feed"
          className="md:col-span-2"
          background={<HoldCluster />}
        />
        {canCreate ? (
          <BentoCard
            to="/create-gym"
            name="Create a gym"
            description="Set up walls and start setting."
            cta="Get started"
            className="md:col-span-1 bg-ink [&_h3]:text-white"
            background={<div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_10%,var(--color-accent),transparent_60%)] opacity-60" />}
          />
        ) : (
          <BentoCard
            to="/profile"
            name="Your profile"
            description="Rank, sends and stats."
            cta="View profile"
            className="md:col-span-1"
            background={<div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_10%,var(--color-accent-soft),transparent_70%)]" />}
          />
        )}
      </BentoGrid>

      <GymList />

      <BlurFade inView className="mt-16">
        <SectionLabel>Gyms near you</SectionLabel>
        {gymsLoading
          ? <div className="h-[420px] animate-pulse rounded-3xl bg-black/[.06]" />
          : <GymMap gyms={allGyms} />}
      </BlurFade>
    </PageShell>
  );
}

export default Home;
