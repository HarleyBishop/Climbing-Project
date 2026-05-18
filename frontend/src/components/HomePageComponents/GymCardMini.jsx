import { useNavigate } from "react-router-dom";

function GymCardMini({ gym, colour }) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/gym/${gym.id}`)}
      className="shrink-0 w-36 rounded-xl border border-amber-200 bg-amber-50 cursor-pointer hover:border-amber-400 transition-colors overflow-hidden"
    >
      {/* colour bar on top */}
      <div className={`h-2 w-full ${colour}`} />

      <div className="px-3 py-3">
        <p className="font-bold italic text-amber-900 text-sm leading-tight mb-1 truncate">
          {gym.name}
        </p>
        <p className="text-xs italic text-amber-600 truncate mb-2">
          {gym.location}
        </p>
        <div className="flex flex-col gap-1">
          <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-amber-800 italic text-center">
            {gym.climb_count} Climbs
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full italic text-center
            ${gym.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
            {gym.is_active ? "Open" : "Closed"}
          </span>
        </div>
      </div>
    </div>
  );
}

export default GymCardMini;