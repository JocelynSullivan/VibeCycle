import { useEffect, useState } from "react";

interface PostResponse {
  routine: string;
}

const RoutineResponse: React.FC = () => {
  const [routineResponse, setRoutineResponse] = useState<PostResponse | null>(null);

  useEffect(() => {
    const fetchRoutine = async () => {
      try {
        const response = await fetch("http://localhost:8000/tasks");
        if (!response.ok) {
          throw new Error(`Response status: ${response.status}`);
        }

        if (!routineResponse) {
          return <p className="text-gray-400">Routine not generated</p>;
        }

        const data: PostResponse = await response.json();
        setRoutineResponse(data);
      } catch (error: any) {
        console.error("Error fetching routine", error);
      }
    };
    fetchRoutine();
  }, []);

  return (
    <div>
      <h2>Your Routines</h2>
      <h3>{routineResponse?.routine}</h3>
    </div>
  );
};

export default RoutineResponse;
