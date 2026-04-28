import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";
import ClimbCard from "../components/ClimbDashboardComponents/ClimbCard";

function GymPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [gym, setGym] = useState(null);
  const [walls, setWalls] = useState([]);
  const [selectedWall, setSelectedWall] = useState(null);
  const [climbs, setClimbs] = useState([]);

  useEffect(() => {
    const fetchGymData = async () => {
      try {
        const [gymRes, wallRes] = await Promise.all([
          api.get(`/api/gyms/${id}/`),
          api.get(`/api/gyms/${id}/walls/`),
        ]);
        setGym(gymRes.data);
        setWalls(wallRes.data);
        setSelectedWall(wallRes.data[0]);
      } catch (err) {
        console.log(err);
      }
    };
    fetchGymData();
  }, [id]);

  useEffect(() => {
    if (!selectedWall) return;
    const fetchClimbs = async () => {
      try {
        const res = await api.get(`/api/gyms/${id}/walls/${selectedWall.id}/climbs/`);
        setClimbs(res.data);
      } catch (err) {
        console.log(err);
      }
    };
    fetchClimbs();
  }, [selectedWall]);

  if (!gym) return <div className="min-h-screen bg-orange-50 font-serif flex items-center justify-center text-amber-800 italic">Loading...</div>

  return (
    <div className="min-h-screen bg-orange-50 font-serif">

      {/* navbar */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-amber-200">
        <h3 className="text-amber-900 font-bold italic text-xl">Beta Board</h3>
        <div className="w-9 h-9 rounded-full bg-stone-300 flex items-center justify-center text-sm font-bold text-stone-600">
          JS
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">

        {/* back button */}
        <div
          onClick={() => navigate("/")}
          className="text-amber-700 italic text-sm mb-6 cursor-pointer"
        >
          ‹ Back to gyms
        </div>

        {/* gym header */}
        <h1 className="text-3xl font-bold italic text-amber-900 leading-tight mb-1">
          {gym.name}
        </h1>
        <p className="text-sm italic text-amber-700 mb-2">{gym.location}</p>
        <span className={`text-xs px-3 py-1 rounded-full font-bold italic
          ${gym.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {gym.is_active ? "Open" : "Closed"}
        </span>

        <div className="h-px bg-amber-200 my-6" />

        {/* wall tabs */}
        <p className="text-xs font-bold tracking-widest text-amber-700 mb-3">SELECT WALL</p>
        <div className="flex gap-2 flex-wrap mb-8">
          {walls.map((wall) => (
            <button
              key={wall.id}
              type="button"
              onClick={() => setSelectedWall(wall)}
              className={`px-4 py-2 rounded-full text-sm italic border transition-colors
                ${selectedWall?.id === wall.id
                  ? "bg-amber-900 text-amber-50 border-amber-900"
                  : "border-amber-300 text-amber-800 hover:border-amber-500"}`}
            >
              {wall.name}
            </button>
          ))}
        </div>

        {/* climbs header row */}
        {selectedWall && (
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold tracking-widest text-amber-700">
              {selectedWall.name.toUpperCase()} — {climbs.length} CLIMBS
            </p>
            <button
              type="button"
              onClick={() => navigate(`/gym/${id}/wall/${selectedWall.id}/add-climb`)}
              className="text-xs italic px-4 py-2 rounded-full bg-amber-900 text-amber-50 border border-amber-900 hover:bg-amber-800 transition-colors"
            >
              + Add climb
            </button>
          </div>
        )}

        {/* climb cards */}
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

        {climbs.length === 0 && selectedWall && (
          <div className="text-center py-16 text-amber-700 italic text-sm">
            No climbs on this wall yet — add one above.
          </div>
        )}

      </div>
    </div>
  );
}

export default GymPage;