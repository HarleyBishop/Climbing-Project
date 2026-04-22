import { useNavigate } from "react-router-dom";

function GymCard({ gym, colour }) {
  const navigate = useNavigate();

  console.log("full gym object:", gym)
  return (
    <div
      onClick={() => navigate(`/gym/${gym.id}`)}
      
      className={`flex items-center p-4 mb-5 border rounded-xl  ${colour}`}
    >
      <div>
        <p>{gym.name}</p>
        <p>{gym.location}</p>
        <p>{gym.is_active ? "Open" : "Closed"}</p>
      </div>
    </div>
  );
}

export default GymCard;
