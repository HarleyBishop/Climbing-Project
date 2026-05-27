import { useState, useEffect } from "react";
import api from "../../api";
import GymCard from "./GymCard";
import GymCardMini from "./GymCardMini";

const GYM_COLOURS = [
  "bg-emerald-600",
  "bg-orange-600",
  "bg-blue-600",
  "bg-pink-600",
  "bg-yellow-600",
  "bg-stone-600",
];

function GymList() {
  const [allGyms, setAllGyms] = useState([]);
  const [myGyms, setMyGyms] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([api.get("/api/gyms/"), api.get("/api/gyms/my-gyms/")])
      .then(([allRes, myRes]) => {
        setAllGyms(allRes.data);
        setMyGyms(myRes.data);
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to load gyms. Please refresh and try again.");
        setLoading(false);
      });
  }, []);

  const filteredGyms = search.trim()
    ? allGyms.filter(
        (g) =>
          g.name.toLowerCase().includes(search.toLowerCase()) ||
          g.location.toLowerCase().includes(search.toLowerCase()),
      )
    : null;

  if (loading)
    return <div className="text-amber-700 italic text-sm">Loading...</div>;

  if (error) return <div className="text-red-600 italic text-sm">{error}</div>;

  return (
    <div className="flex flex-col">
      {/* Search bar */}
      <div className="relative mb-6">
        <input
          type="text"
          placeholder="Search gyms..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 rounded-xl border border-amber-300 bg-white text-amber-900 italic placeholder-amber-400 focus:outline-none focus:border-amber-500"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-400 hover:text-amber-600 text-lg"
          >
            ×
          </button>
        )}
      </div>

      {/* Search results */}
      {filteredGyms ? (
        <>
          <p className="text-xs font-bold tracking-widest text-amber-700 mb-4">
            RESULTS
          </p>
          {filteredGyms.length === 0 ? (
            <p className="text-sm italic text-amber-500 mb-6">
              No gyms match your search.
            </p>
          ) : (
            filteredGyms.map((gym, index) => (
              <GymCard
                key={gym.id}
                gym={gym}
                colour={GYM_COLOURS[index % GYM_COLOURS.length]}
              />
            ))
          )}
        </>
      ) : (
        <>
          {/* Your Gyms */}
          <p className="text-xs font-bold tracking-widest text-amber-700 mb-4">
            YOUR GYMS
          </p>
          {myGyms.length === 0 ? (
            <p className="text-sm italic text-amber-500 mb-6">
              Log a climb to see your gyms here.
            </p>
          ) : (
            myGyms.map((gym, index) => (
              <GymCard
                key={gym.id}
                gym={gym}
                colour={GYM_COLOURS[index % GYM_COLOURS.length]}
              />
            ))
          )}

          {/* All Gyms carousel */}
          <p className="text-xs font-bold tracking-widest text-amber-700 mt-6 mb-4">
            ALL GYMS
          </p>
          {allGyms.length === 0 ? (
            <p className="text-sm italic text-amber-500">No gyms yet.</p>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-3 -mx-1 px-1">
              {allGyms.map((gym, index) => (
                <GymCardMini
                  key={gym.id}
                  gym={gym}
                  colour={GYM_COLOURS[index % GYM_COLOURS.length]}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default GymList;
