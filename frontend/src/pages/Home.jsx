import GymList from "../components/HomePageComponents/GymList";

function Home() {
  return (
    <div className="bg-orange-100 font-serif min-h-screen">
      {/* This will be top bar /nav seperate to seperate component */}
      <div className="Navbar outline-black outline-1 pb-8 ">
        <div className="">
          <h3 className="text-amber-900  ">Beta Board</h3>
        </div>
      </div>

      <h1 className="text-amber-900 text-lg m-auto">
        {" "}
        Where are you climbing today?
      </h1>

      <GymList />
    </div>
  );
}

export default Home;
