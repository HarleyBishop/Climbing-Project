import { useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../../api"
import WallCard from "./WallCard"
import AddWallForm from "./AddWallForm"

function CreateGymForm() {
    const [gymName, setGymName] = useState("")
    const [location, setLocation] = useState("")
    const [isActive, setIsActive] = useState(true)
    const [walls, setWalls] = useState([])
    const navigate = useNavigate()

    const addWall = (wall) => {
        setWalls([...walls, wall])
    }

    const removeWall = (id) => {
        setWalls(walls.filter(wall => wall.id !== id))
    }

    const handleSubmit = async () => {
        try {
            const res = await api.post("/api/gyms/", {
                name: gymName,
                location,
                is_active: isActive,
            })
            const gymId = res.data.id

            for (const wall of walls) {
                await api.post(`/api/gyms/${gymId}/walls/`, {
                    name: wall.name,
                    description: wall.description,
                })
            }

            navigate("/")
        } catch (err) {
            console.log(err)
        }
    }

    return (
        <div className="max-w-xl mx-auto px-6 py-10 font-serif">
            <h1 className="text-3xl font-bold italic text-amber-900 mb-1">Set up your gym</h1>
            <p className="text-sm italic text-amber-700 mb-8">Fill in the details and add your walls.</p>

            <div className="mb-4">
                <label className="text-xs italic text-amber-800 block mb-1">Gym name</label>
                <input
                    type="text"
                    placeholder="e.g. Boulder HQ"
                    value={gymName}
                    onChange={(e) => setGymName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-amber-900 font-serif"
                />
            </div>

            <div className="mb-4">
                <label className="text-xs italic text-amber-800 block mb-1">Location</label>
                <input
                    type="text"
                    placeholder="e.g. 12 Forge St, Newstead"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-amber-900 font-serif"
                />
            </div>

            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200 mb-8">
                <span className="text-sm italic text-amber-900">
                    {isActive ? "Gym is currently open" : "Gym is currently closed"}
                </span>
                <div
                    onClick={() => setIsActive(!isActive)}
                    className={`w-12 h-6 rounded-full cursor-pointer transition-colors flex items-center px-1 ${isActive ? "bg-amber-900" : "bg-stone-300"}`}
                >
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-200 ${isActive ? "translate-x-6" : "translate-x-0"}`} />
                </div>
            </div>

            <p className="text-xs font-bold tracking-widest text-amber-700 mb-1">WALLS</p>
            <p className="text-xs italic text-amber-600 mb-4">Add the walls in your gym so setters can assign climbs to them.</p>

            {walls.map(wall => (
                <WallCard key={wall.id} wall={wall} onRemove={removeWall} />
            ))}

            <AddWallForm onAddWall={addWall} />

            <div className="mt-8">
                <button
                    type="button"
                    onClick={handleSubmit}
                    className="w-full py-3 rounded-xl bg-amber-900 text-amber-50 font-bold italic font-serif mb-3"
                >
                    Create gym
                </button>
                <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="w-full py-3 rounded-xl border border-amber-300 text-amber-700 italic font-serif"
                >
                    Cancel
                </button>
            </div>
        </div>
    )
}

export default CreateGymForm