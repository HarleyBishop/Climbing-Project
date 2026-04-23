import { useState } from "react"

const COLOURS = [
    "bg-emerald-600",
    "bg-orange-600",
    "bg-blue-600",
    "bg-pink-600",
    "bg-yellow-600",
    "bg-stone-600",
]

const COLOUR_HEX = {
    "bg-emerald-600": "#4a8c5c",
    "bg-orange-600": "#c4622d",
    "bg-blue-600": "#3a6fa8",
    "bg-pink-600": "#a0416e",
    "bg-yellow-600": "#c9a020",
    "bg-stone-600": "#555050",
}

function AddWallForm({ onAddWall }) {
    const [wallName, setWallName] = useState("")
    const [wallDescription, setWallDescription] = useState("")
    const [selectedColour, setSelectedColour] = useState("bg-emerald-600")

    const handleAdd = () => {
        if (!wallName) return

        onAddWall({
            id: Date.now(),
            name: wallName,
            description: wallDescription,
            colour: selectedColour,
        })

        setWallName("")
        setWallDescription("")
        setSelectedColour("bg-emerald-600")
    }

    return (
        <div className="border border-amber-300 rounded-xl p-4 mt-2 bg-amber-50">
            <div className="mb-3">
                <label className="text-xs italic text-amber-800 block mb-1">Wall name</label>
                <input
                    type="text"
                    placeholder="e.g. Overhang"
                    value={wallName}
                    onChange={(e) => setWallName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-amber-200 bg-white text-amber-900 text-sm font-serif"
                />
            </div>
            <div className="mb-3">
                <label className="text-xs italic text-amber-800 block mb-1">Description</label>
                <input
                    type="text"
                    placeholder="Short description..."
                    value={wallDescription}
                    onChange={(e) => setWallDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-amber-200 bg-white text-amber-900 text-sm font-serif"
                />
            </div>
            <div className="mb-4">
                <label className="text-xs italic text-amber-800 block mb-2">Colour</label>
                <div className="flex gap-2">
                    {COLOURS.map((colour) => (
                        <button
                            key={colour}
                            type="button"
                            onClick={() => setSelectedColour(colour)}
                            style={{ background: COLOUR_HEX[colour] }}
                            className={`w-7 h-7 rounded-full border-2 transition-all
                                ${selectedColour === colour ? "border-amber-900 scale-110" : "border-transparent"}`}
                        />
                    ))}
                </div>
            </div>
            <button
                type="button"
                onClick={handleAdd}
                className="w-full py-3 rounded-lg bg-amber-900 text-amber-50 font-bold italic font-serif"
            >
                + Add wall
            </button>
        </div>
    )
}

export default AddWallForm