// GymCard.jsx
import { useNavigate } from "react-router-dom";

function GymCard({ gym, colour }) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/gym/${gym.id}`)}
      className="flex overflow-hidden rounded-xl border border-amber-200 bg-amber-50 cursor-pointer hover:border-amber-400 transition-colors mb-3"
    >
      {/* colour strip */}
      <div className={`w-2 shrink-0 ${colour}`} />

      {/* content */}
      <div className="flex-1 px-4 py-3">
        <p className="font-bold italic text-amber-900 text-base mb-1">{gym.name}</p>
        <p className="text-xs italic text-amber-600 mb-2">{gym.location}</p>
        <div className="flex gap-2">
          <span className="text-xs px-3 py-1 rounded-full bg-orange-100 text-amber-800 italic">
            {gym.wall_count} Walls
          </span>
            <span className="text-xs px-3 py-1 rounded-full bg-orange-100 text-amber-800 italic">
            {gym.climb_count} Climbs
          </span>
          
          <span className={`text-xs px-3 py-1 rounded-full italic
            ${gym.is_active
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"}`}>
            {gym.is_active ? "Open" : "Closed"}
          </span>
        </div>
      </div>

      {/* arrow */}
      <div className="flex items-center pr-4 text-amber-300 text-lg">›</div>
    </div>
  );
}

export default GymCard;