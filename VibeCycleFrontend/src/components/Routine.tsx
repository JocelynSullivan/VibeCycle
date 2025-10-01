import { useEffect, useState } from "react";
import { Suspense } from "react";

type PostResponse = {
  routine: string;
};

const RoutineResponse: React.FC = () => {
  const [routineResponse, setRoutineResponse] = useState<PostResponse | null>(null);

  useEffect(() => {
    const fetchRoutine = async () => {
      try {
        const response = await fetch(`http://localhost:8000/routine?energy_level=1`, {
          method: "POST",
          mode: "cors",
        });
        if (!response.ok) {
          throw new Error(`Response status: ${response.status}`);
        }

        const data: PostResponse = await response.json();
        console.log(data);
        setRoutineResponse(data);
      } catch (error: any) {
        console.error("Error fetching routine", error);
      }
    };
    fetchRoutine();
  }, []);

  return (
    <div className="bg-black">
      <h2 className="text-gray-400">Your Routines</h2>
      <h3 className="text-gray-400">{routineResponse?.routine}</h3>
    </div>
  );
};

export default RoutineResponse;
