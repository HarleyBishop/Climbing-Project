import GymList from "../components/HomePageComponents/GymList";

// Home page where user can check gyms to navigate. 

function Home() {
  return (
    <div className="bg-orange-50 font-serif min-h-screen">

      {/* Navbar */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-amber-200">
        <h3 className="text-amber-900 font-bold italic text-xl">Beta Board</h3>
        <div className="w-9 h-9 rounded-full bg-stone-300 flex items-center justify-center text-sm font-bold text-stone-600">
          JS
        </div>
      </div>

      {/* Content wrapper */}
      <div className="max-w-2xl mx-auto px-6 py-8">

        <h1 className="text-amber-900 text-3xl font-bold italic leading-tight mb-2">
          Where are you climbing today?
        </h1>
        <p className="text-amber-800 italic text-md mb-8">
          Pick your gym to see the current climbs.
        </p>

        <p className="text-xs font-bold tracking-widest text-amber-700 mb-3">
          YOUR GYMS
        </p>

        <GymList />

      </div>
    </div>
  );
}

export default Home;