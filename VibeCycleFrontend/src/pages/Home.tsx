import { useNavigate } from "react-router-dom";
import Tasks from "../components/Tasks";
import RoutineResponse from "../components/Routine";

const Home: React.FC = () => {
  const navigate = useNavigate();

  const handleLogoutClick = () => {
    navigate("/logout");
  };
  return (
    <div className="bg-black h-full">
      <div className="flex justify-center items-center p-7 bg-gradient-to-t from-cyan-600 to-cyan-900">
        <h1 className="text-5xl font-stretch-50% text-black">Welcome to Vibe Cycle!</h1>
        <div className="flex items-center absolute top-8 right-5">
          <button onClick={handleLogoutClick} className="bg-gray-700 text-white px-3 py-1 rounded-md">
            Logout
          </button>
        </div>
      </div>
      <div className="flex justify-center pt-10">
        <p className="text-cyan-500 text-2xl">Your personalized task manager</p>
      </div>
      <div className="flex justify-center pt-7">
        <p className="text-gray-400 text-lg px-60">
          Enter your tasks and energy levels and let Vibe Cycle do the rest!
        </p>
      </div>
      <div className="flex justify-center">
        <Tasks />
      </div>
      <div>
        <RoutineResponse />
      </div>
    </div>
  );
};

export default Home;
