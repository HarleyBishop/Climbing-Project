import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import GymList from "../components/HomePageComponents/GymList";
import GymMap from "../components/HomePageComponents/GymMap";
import Navbar from "../components/Navbar";
import { isSetter } from "../auth";

function Home() {
  const navigate = useNavigate();
  const canCreate = isSetter();
  const [allGyms, setAllGyms] = useState([]);
  const [gymsLoading, setGymsLoading] = useState(true);

  useEffect(() => {
    api.get("/api/gyms/")
      .then(res => setAllGyms(res.data))
      .finally(() => setGymsLoading(false));
  }, []);

  return (
    <div className="bg-orange-50 font-serif min-h-screen">
      <Navbar />
      <div className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-amber-900 text-4xl font-bold italic leading-tight mb-3">
          Where are you climbing today?
        </h1>
        <p className="text-amber-700 italic text-sm mb-8">
          Pick your gym to see the current climbs.
        </p>

        <GymList />

        <div className="h-px bg-amber-200 my-8" />

        <p className="text-xs font-bold tracking-widest text-amber-700 mb-4">
          GYMS NEAR YOU
        </p>
        {gymsLoading
          ? <p className="text-sm italic text-amber-500">Loading map...</p>
          : <GymMap gyms={allGyms} />
        }

        {canCreate && (
          <button
            onClick={() => navigate(`/create-gym`)}
            className="w-full py-3 rounded-xl bg-amber-900 text-amber-50 font-bold italic font-serif mt-8"
          >
            Create A Gym
          </button>
        )}
      </div>
    </div>
  );
}

export default Home;
