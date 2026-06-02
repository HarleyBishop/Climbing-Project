import { useState, useEffect } from "react";
import api from "../../api";
import GymCard from "./GymCard";
import { CardSkeleton } from "../Skeleton";

const GYM_COLOURS = [
  "bg-emerald-600",
  "bg-orange-600",
  "bg-blue-600",
  "bg-pink-600",
  "bg-yellow-600",
  "bg-stone-600",
];

const PER_PAGE = 4;

function GymList() {
  const [allGyms, setAllGyms] = useState([]);
  const [myGyms, setMyGyms] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([api.get("/api/gyms/"), api.get("/api/gyms/my-gyms/")])
      .then(([allRes, myRes]) => {
        setAllGyms(allRes.data);
        setMyGyms(myRes.data);
        setLoading(false);
      })
      .catch(() => {
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

  // Reset to first page whenever the search query changes.
  const handleSearch = (val) => {
    setSearch(val);
    setPage(0);
  };

  const totalPages = Math.ceil(myGyms.length / PER_PAGE);
  const paginatedMyGyms = myGyms.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  if (loading)
    return <div className="flex flex-col"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>;

  if (error) return <div className="text-red-600 italic text-sm">{error}</div>;

  return (
    <div className="flex flex-col">
      <div className="relative mb-6">
        <input
          type="text"
          placeholder="Search gyms..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full px-4 py-2 rounded-xl border border-amber-300 bg-white text-amber-900 italic placeholder-amber-400 focus:outline-none focus:border-amber-500"
        />
        {search && (
          <button
            onClick={() => handleSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-400 hover:text-amber-600 text-lg"
          >
            ×
          </button>
        )}
      </div>

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
          <p className="text-xs font-bold tracking-widest text-amber-700 mb-4">
            YOUR GYMS
          </p>
          {myGyms.length === 0 ? (
            <p className="text-sm italic text-amber-500 mb-2">
              Log a climb to see your gyms here.
            </p>
          ) : (
            <>
              {paginatedMyGyms.map((gym, index) => (
                <GymCard
                  key={gym.id}
                  gym={gym}
                  colour={GYM_COLOURS[(page * PER_PAGE + index) % GYM_COLOURS.length]}
                />
              ))}

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-1 mb-2">
                  <button
                    onClick={() => setPage(p => p - 1)}
                    disabled={page === 0}
                    className="text-xs italic text-amber-700 hover:text-amber-900 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    ‹ Prev
                  </button>
                  <span className="text-xs italic text-amber-500">
                    {page + 1} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={page === totalPages - 1}
                    className="text-xs italic text-amber-700 hover:text-amber-900 disabled:opacity-30 disabled:cursor-not-allowed"
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
