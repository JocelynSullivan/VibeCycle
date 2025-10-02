import Tasks from "../components/Tasks";
import RoutineResponse from "../components/Routine";

const Home: React.FC = () => {
  return (
    <div className="bg-black h-full">
      <h1 className="flex justify-center p-7 text-5xl bg-gradient-to-t from-cyan-600 to-cyan-900 font-stretch-50%">
        Welcome to Vibe Cycle!
      </h1>
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
