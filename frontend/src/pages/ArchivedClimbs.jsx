import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";
import ClimbCard from "../components/ClimbDashboardComponents/ClimbCard";
import Navbar from "../components/Navbar";
import { PageSkeleton } from "../components/Skeleton";

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function ArchivedClimbs() {
  const { gymId, wallId } = useParams();
  const navigate = useNavigate();

  const [climbs, setClimbs] = useState([]);
  const [wallName, setWallName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [archivedRes, wallsRes] = await Promise.all([
          api.get(`/api/gyms/${gymId}/walls/${wallId}/climbs/archived/`),
          api.get(`/api/gyms/${gymId}/walls/`),
        ]);
        setClimbs(archivedRes.data);
        const wall = wallsRes.data.find((w) => String(w.id) === String(wallId));
        setWallName(wall?.name ?? "");
      } catch {
        setError("Failed to load archived climbs.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [gymId, wallId]);

  if (loading) return <PageSkeleton />;

  if (error)
    return (
      <div className="min-h-screen bg-orange-50 font-serif flex items-center justify-center">
        <div className="text-center px-6">
          <p className="text-red-600 italic text-sm mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg bg-amber-900 text-amber-50 italic text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-orange-50 font-serif">
      <Navbar showBack backLabel="Back to gym" backPath={`/gym/${gymId}`} />

      <div className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold italic text-amber-900 leading-tight mb-1">
          Archived climbs
        </h1>
        <p className="text-sm italic text-amber-700 mb-8">
          {wallName && `${wallName} — `}old routes in order of when they were set
        </p>

        {climbs.length === 0 ? (
          <div className="text-center py-16 text-amber-700 italic text-sm">
            No archived climbs on this wall yet.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {climbs.map((climb) => (
              <div key={climb.id}>
                <p className="text-xs italic text-amber-500 mb-1">
                  Set {formatDate(climb.set_at)}
                </p>
                <ClimbCard climb={climb} gymId={gymId} wallId={wallId} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ArchivedClimbs;
