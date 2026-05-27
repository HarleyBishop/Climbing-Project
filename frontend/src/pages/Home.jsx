import GymList from "../components/HomePageComponents/GymList";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom"
import { isSetter } from "../auth"



function Home() {
  const navigate = useNavigate();
  const canCreate = isSetter();

  return (
    <div className="bg-orange-50 font-serif min-h-screen">
      <Navbar />
      <div className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-amber-900 text-4xl font-bold italic leading-tight mb-3">
          Where are you climbing today?
        </h1>
        <p className="text-amber-700 italic text-sm mb-10">
          Pick your gym to see the current climbs.
        </p>

        <GymList />

        {canCreate && (
          <button
            onClick={() => navigate(`/create-gym`)}
            className="w-full py-3 rounded-xl bg-amber-900 text-amber-50 font-bold italic font-serif disabled:opacity-50 mt-3"
          >
            Create A Gym
          </button>
        )}
      </div>
    </div>
  );
}

export default Home;