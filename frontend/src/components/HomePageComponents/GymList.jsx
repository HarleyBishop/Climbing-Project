// GymList.jsx
import { useState, useEffect } from "react";
import api from "../../api";
import GymCard from "./GymCard";

const GYM_COLOURS = [
  "bg-emerald-600",
  "bg-orange-600",
  "bg-blue-600",
  "bg-pink-600",
  "bg-yellow-600",
  "bg-stone-600",
];

function GymList() {
  const [gyms, setGyms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/api/gyms/")
      .then((res) => {
        setGyms(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
      });
  }, []);

  if (loading)
    return <div className="text-amber-700 italic text-sm">Loading...</div>;

  return (
    <div className="flex flex-col">
      {gyms.map((gym, index) => (
        <GymCard
          key={gym.id}
          gym={gym}
          colour={GYM_COLOURS[index % GYM_COLOURS.length]}
        />
      ))}
      {gyms.length === 0 && (
        <p className="text-sm italic text-amber-500">No gyms found.</p>
      )}
    </div>
  );
}

export default GymList;
