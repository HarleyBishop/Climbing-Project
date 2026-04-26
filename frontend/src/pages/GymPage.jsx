import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useParams } from "react-router-dom";

function GymPage() {
  // gym id from url
  const { id } = useParams();

  // store data for the one gym
  const [gym, setGym] = useState(null);
  // store all walls
  const [wall, setWall] = useState([]);
  // check which wall button selected so use effect can act as onclick
  const [selectedWall, setSelectedWall] = useState(null);
  // all climb data
  const [climb, setClimbs] = useState([]);

  // When the page is accessed retrieve data for the associated gym
  useEffect(() => {
    const fetchGymData = async () => {
      try {
        const [gymres, wallres] = await Promise.all([
          api.get(`/api/gyms/${id}/`),
          api.get(`/api/gyms/${id}/walls/`),
        ]);

        setGym(gymres.data);
        setWall(wallres.data);
        // the default wall is the first one
        setSelectedWall(wallres.data[0]);
      } catch (err) {
        console.log(err);
      }
    };
    fetchGymData();
  }, [id]);

  // When a wall is selected it changes the usestate causing this effect to run retrieving the climb data opn the wall selected
  useEffect(() => {
    if (!selectedWall) return;

    const fetchClimbs = async () => {
      try {
        const res = await api.get(
          `/api/gyms/${id}/walls/${selectedWall.id}/climbs/`,
        );
        setClimbs(res.data);
      } catch (err) {
        console.log(err);
      }
    };
    fetchClimbs();
  }, [selectedWall]);

  return (
    <div>
      <h1> Ready to send something hard?</h1>

      <h3> Pick a Wall and find your next Project</h3>

      <div className="button wrapper">
        {wall.map((walls) => (
          <button key={walls.id} onClick={() => setSelectedWall(walls)}>
            {walls.name}
          </button>
        ))}
      </div>

      <div className="climb card wrapper">
        {climb.map((climbs) => (
          <ClimbCard
            key={climbs.id}
            climb={climbs}
            gymId={id}
            wallId={selectedWall.id}
          />
        ))}
      </div>
    </div>
  );
}

export default GymPage;
