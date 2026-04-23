const COLOURS = {
    "bg-emerald-600": "#4a8c5c",
    "bg-orange-600": "#c4622d",
    "bg-blue-600": "#3a6fa8",
    "bg-pink-600": "#a0416e",
    "bg-yellow-600": "#c9a020",
    "bg-stone-600": "#555050",
}

// onRemove is a function that will be pasased with func to remove a wall card
function WallCard({ wall, onRemove }) {
    return (
        <div className="flex items-center gap-3 bg-amber-50 rounded-xl border border-amber-200 mb-2 overflow-hidden">
            <div className="w-2 self-stretch shrink-0" style={{ background: COLOURS[wall.colour] }} />
            <div className="flex-1 py-3">
                <p className="font-bold italic text-amber-900">{wall.name}</p>
                <p className="text-xs text-amber-700">{wall.description}</p>
            </div>
            <button
                type="button"
                onClick={() => onRemove(wall.id)}
                className="pr-4 text-amber-300 hover:text-red-400 text-xl"
            >
                ×
            </button>
        </div>
    )
}

export default WallCard