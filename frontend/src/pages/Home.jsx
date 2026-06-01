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
  const [view, setView] = useState("list");
  // allGyms is fetched here (not inside GymList) so GymMap can share the same
  // data without a second API call when the user switches to map view.
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
        <p className="text-amber-700 italic text-sm mb-6">
          Pick your gym to see the current climbs.
        </p>

        {/* List / Map toggle */}
        <div className="flex gap-1 bg-amber-100 rounded-xl p-1 mb-6 w-fit">
          {["list", "map"].map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-1.5 rounded-lg text-sm italic font-bold transition-colors
                ${view === v
                  ? "bg-amber-900 text-amber-50"
                  : "text-amber-700 hover:text-amber-900"}`}
            >
              {v === "list" ? "List" : "Map"}
            </button>
          ))}
        </div>

        {view === "list" ? (
          // GymList manages its own fetching for the "my gyms" section which
          // needs a separate endpoint — it's not shared with the map view.
          <GymList />
        ) : (
          gymsLoading
            ? <p className="text-sm italic text-amber-500">Loading map...</p>
            : <GymMap gyms={allGyms} />
        )}

        {canCreate && (
          <button
            onClick={() => navigate(`/create-gym`)}
            className="w-full py-3 rounded-xl bg-amber-900 text-amber-50 font-bold italic font-serif disabled:opacity-50 mt-6"
          >
            Create A Gym
          </button>
        )}
      </div>
    </div>
  );
}

export default Home;
