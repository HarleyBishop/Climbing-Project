import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";
import ClimbCard from "../components/ClimbDashboardComponents/ClimbCard";
import Navbar from "../components/Navbar";
import { isSetter } from "../auth";

function GymPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [gym, setGym] = useState(null);
  const [walls, setWalls] = useState([]);
  const [selectedWall, setSelectedWall] = useState(null);
  const [climbs, setClimbs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [climbsLoading, setClimbsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [archiveConfirm, setArchiveConfirm] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const canEdit = isSetter();

  useEffect(() => {
    const fetchGymData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [gymRes, wallRes] = await Promise.all([
          api.get(`/api/gyms/${id}/`),
          api.get(`/api/gyms/${id}/walls/`),
        ]);
        setGym(gymRes.data);
        setWalls(wallRes.data);
        setSelectedWall(wallRes.data[0]);
      } catch (err) {
        setError("Failed to load gym. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchGymData();
  }, [id]);

  useEffect(() => {
    if (!selectedWall) return;
    const fetchClimbs = async () => {
      setClimbsLoading(true);
      try {
        const res = await api.get(
          `/api/gyms/${id}/walls/${selectedWall.id}/climbs/`,
        );
        setClimbs(res.data);
      } catch (err) {
        setError("Failed to load climbs. Please try again.");
      } finally {
        setClimbsLoading(false);
      }
    };
    fetchClimbs();
  }, [selectedWall]);

  const handleArchiveWall = async () => {
    setArchiving(true);
    try {
      await api.post(`/api/gyms/${id}/walls/${selectedWall.id}/archive-climbs/`);
      setClimbs([]);
      setArchiveConfirm(false);
    } catch {
      setError("Failed to archive climbs. Please try again.");
    } finally {
      setArchiving(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-orange-50 font-serif flex items-center justify-center text-amber-800 italic">
        Loading...
      </div>
    );

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
      <Navbar showBack backLabel="Back to gyms" backPath="/" />

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* gym header */}
        <h1 className="text-3xl font-bold italic text-amber-900 leading-tight mb-1">
          {gym.name}
        </h1>
        <p className="text-sm italic text-amber-700 mb-2">{gym.location}</p>

        <div className="flex items-center justify-between mb-4">
          <span
            className={`text-xs px-3 py-1 rounded-full font-bold italic
            ${gym.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
          >
            {gym.is_active ? "Open" : "Closed"}
          </span>

          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/gym/${id}/competitions`)}
              className="text-xs italic px-4 py-2 rounded-full border border-amber-300 text-amber-800 hover:border-amber-500 transition-colors"
            >
              Competitions
            </button>
            <button
              onClick={() => navigate(`/gym/${id}/leaderboard`)}
              className="text-xs italic px-4 py-2 rounded-full border border-amber-300 text-amber-800 hover:border-amber-500 transition-colors"
            >
              Leaderboard
            </button>
          </div>
        </div>

        <div className="h-px bg-amber-200 my-6" />

        {/* wall tabs */}
        <p className="text-xs font-bold tracking-widest text-amber-700 mb-3">
          SELECT WALL
        </p>
        {walls.length === 0 ? (
          <p className="text-sm italic text-amber-500 mb-8">
            No walls set up yet.
          </p>
        ) : (
          <div className="flex gap-2 flex-wrap mb-4">
            {walls.map((wall) => (
              <button
                key={wall.id}
                type="button"
                onClick={() => { setSelectedWall(wall); setArchiveConfirm(false); }}
                className={`px-4 py-2 rounded-full text-sm italic border transition-colors
                  ${
                    selectedWall?.id === wall.id
                      ? "bg-amber-900 text-amber-50 border-amber-900"
                      : "border-amber-300 text-amber-800 hover:border-amber-500"
                  }`}
              >
                {wall.name}
              </button>
            ))}
          </div>
        )}

        {/* setter archive action */}
        {canEdit && selectedWall && (
          <div className="mb-6">
            {archiveConfirm ? (
              <div className="flex items-center gap-3 bg-amber-50 border border-amber-300 rounded-xl px-4 py-3">
                <p className="text-xs italic text-amber-800 flex-1">
                  Archive all {climbs.length} active climb{climbs.length !== 1 ? "s" : ""} on {selectedWall.name}? This can't be undone.
                </p>
                <button
                  type="button"
                  onClick={handleArchiveWall}
                  disabled={archiving}
                  className="text-xs italic px-3 py-1.5 rounded-lg bg-red-700 text-white hover:bg-red-800 transition-colors disabled:opacity-50"
                >
                  {archiving ? "Archiving…" : "Yes, archive"}
                </button>
                <button
                  type="button"
                  onClick={() => setArchiveConfirm(false)}
                  className="text-xs italic px-3 py-1.5 rounded-lg border border-amber-300 text-amber-700 hover:border-amber-500 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setArchiveConfirm(true)}
                disabled={climbs.length === 0}
                className="text-xs italic text-amber-500 hover:text-amber-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Archive all climbs on this wall
              </button>
            )}
          </div>
        )}

        {/* climbs header row */}
        {selectedWall && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <p className="text-xs font-bold tracking-widest text-amber-700">
                {selectedWall.name.toUpperCase()} —{" "}
                {climbsLoading ? "..." : `${climbs.length} CLIMBS`}
              </p>
              <button
                type="button"
                onClick={() =>
                  navigate(`/gym/${id}/wall/${selectedWall.id}/archived`)
                }
                className="text-xs italic text-amber-500 hover:text-amber-700 transition-colors"
              >
                View archived
              </button>
            </div>
            {canEdit && (
              <button
                type="button"
                onClick={() =>
                  navigate(`/gym/${id}/wall/${selectedWall.id}/add-climb`)
                }
                className="text-xs italic px-4 py-2 rounded-full bg-amber-900 text-amber-50 border border-amber-900 hover:bg-amber-800 transition-colors"
              >
                + Add climb
              </button>
            )}
          </div>
        )}

        {/* climb cards */}
        {climbsLoading ? (
          <p className="text-sm italic text-amber-500">Loading climbs...</p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {climbs.map((climb) => (
              <ClimbCard
                key={climb.id}
                climb={climb}
                gymId={id}
                wallId={selectedWall?.id}
              />
            ))}
          </div>
        )}

        {!climbsLoading && climbs.length === 0 && selectedWall && (
          <div className="text-center py-16 text-amber-700 italic text-sm">
            {canEdit
              ? "No climbs on this wall yet — add one above."
              : "No climbs on this wall yet."}
          </div>
        )}
      </div>
    </div>
  );
}

export default GymPage;
