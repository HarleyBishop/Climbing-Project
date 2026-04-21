
function GymCard({ gym, colour}) {
    return (
        <div className={`flex items-center p-4 border rounded-xl  ${colour}`} >
            <div>
                <p>{gym.name}</p>
                <p>{gym.location}</p>
                <p>{gym.is_active ? "Open" : "Closed"}</p>
            </div>
        </div>
    )
}

export default GymCard;
