import { useNavigate } from "react-router-dom"

function ClimbCard({ climb, gymId, wallId }) {
    const navigate = useNavigate()

    return (
        <div
            onClick={() => navigate(`/gym/${gymId}/wall/${wallId}/climb/${climb.id}`)}
            className="cursor-pointer"
        >
            <p>{climb.name}</p>
            <p>{climb.colour}</p>
            <p>V{climb.suggested_grade}</p>
        </div>
    )
}

export default ClimbCard