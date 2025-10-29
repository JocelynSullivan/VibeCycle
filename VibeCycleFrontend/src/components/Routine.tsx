import { useState } from "react";

type PostResponse = {
  routine: string;
};

const RoutineResponse: React.FC = () => {
  const [routineResponse, setRoutineResponse] = useState<PostResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [energyLevel, setEnergyLevel] = useState<number>(1);

  const fetchRoutine = async (level: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:8000/routine?energy_level=${encodeURIComponent(level)}`, {
        method: "POST",
        mode: "cors",
      });
      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }

      const data: PostResponse = await response.json();
      setRoutineResponse(data);
    } catch (err: any) {
      setError(err?.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  // optional: keep initial empty state and require user to generate
  // useEffect(() => { fetchRoutine(energyLevel); }, []);

  return (
    <div className="bg-black">
      <div className="flex justify-center items-center gap-4 pt-10">
        <div className="ml-4 flex items-center gap-4">
          <input
            type="range"
            min={1}
            max={5}
            value={energyLevel}
            onChange={(e) => setEnergyLevel(Number(e.target.value))}
            className="w-48"
          />
          <div className="text-gray-200">
            <div className="text-sm">Level: {energyLevel}</div>
            <div className="text-xs text-gray-400">
              {energyLevel === 1 && "Very Low"}
              {energyLevel === 2 && "Low"}
              {energyLevel === 3 && "Medium"}
              {energyLevel === 4 && "High"}
              {energyLevel === 5 && "Very High"}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={() => fetchRoutine(energyLevel)}
          className="ml-2 bg-cyan-600 text-white px-3 py-1 mt-10 rounded"
          disabled={loading}
        >
          {loading ? "Generating…" : "Generate Routine"}
        </button>
      </div>

      <h2 className="flex justify-center text-gray-300 text-2xl mt-5">Your Routines</h2>

      <div className="flex justify-center">
        {error && <p className="text-red-500 mt-6">{error}</p>}
        {routineResponse ? (
          <h3 className="text-gray-400 p-10 max-w-3xl">{routineResponse.routine}</h3>
        ) : (
          <p className="text-gray-500 p-10">No routine generated yet.</p>
        )}
      </div>
    </div>
  );
};

export default RoutineResponse;
