import { useNavigate } from "react-router-dom";

const COLOUR_MAP = {
  Green: "#4a8c5c",
  Orange: "#c4622d",
  Blue: "#3a6fa8",
  Pink: "#a0416e",
  Yellow: "#c9a020",
  Black: "#555050",
  White: "#f5f5f0",
};

function ClimbCard({ climb, gymId, wallId }) {
  const navigate = useNavigate();
  const colour = COLOUR_MAP[climb.colour] || "#c9a98a";

  return (
    <div
      onClick={() => navigate(`/gym/${gymId}/wall/${wallId}/climb/${climb.id}`)}
      className="cursor-pointer bg-amber-50 rounded-xl border border-amber-200 overflow-hidden hover:border-amber-400 transition-colors"
    >
      {/* colour header */}
      {climb.image_url ? (
        <img
          src={climb.image_url}
          alt={climb.name}
          className="w-full h-28 object-cover"
        />
      ) : (
        <div
          className="w-full h-28 flex items-end p-2 gap-2"
          style={{ background: colour }}
        >
          <span className="text-xs px-2 py-1 rounded-full bg-black/30 text-white italic">
            {climb.colour}
          </span>
          <span className="text-xs px-2 py-1 rounded-full bg-black/30 text-white italic">
            V{climb.suggested_grade}
          </span>
        </div>
      )}



      {/* info */}
      <div className="p-3">
        <p className="font-bold italic text-amber-900 text-sm truncate">
          {climb.name}
        </p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs italic text-amber-600">
            V{climb.suggested_grade}
          </span>
          {climb.community_grade && (
            <span className="text-xs italic text-amber-500">
              Community: V{climb.community_grade}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default ClimbCard;
