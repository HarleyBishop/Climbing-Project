import { useState, useEffect } from "react"
import api from "../../api"
import GymCard from "./GymCard"

const GYM_COLOURS = [
    "bg-emerald-200",
    "bg-orange-200",
    "bg-blue-200",
    "bg-pink-200",
    "bg-yellow-200",
    "bg-stone-200",
]

function GymList() {
    const [gyms, setGyms] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        api.get("/api/gyms/")
            .then(res => {
                setGyms(res.data)
                setLoading(false)
            })
            .catch(err => {
                console.log(err)
                setLoading(false)
            })
    }, [])

    if (loading) return <div>Loading...</div>

    return (
        <div>
            {gyms.map((gym, index) => (
                <GymCard key={gym.id} gym={gym} colour={GYM_COLOURS[index % GYM_COLOURS.length]} />
            ))}
        </div>
    )
}

export default GymList