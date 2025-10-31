import { useEffect, useState } from "react";
import { useAuth } from "../provider/AuthProvider";

type PostResponse = {
  routine: string;
};

const RoutineResponse: React.FC = () => {
  const [routineResponse, setRoutineResponse] = useState<PostResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [energyLevel, setEnergyLevel] = useState<number>(1);
  const [items, setItems] = useState<{ text: string; done: boolean; duration?: string }[]>([]);

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

  const { token } = useAuth();

  const saveRoutine = async (title?: string) => {
    if (!routineResponse) return;
    // prompt for title if not provided
    const name = title ?? window.prompt("Name this routine:", "My Routine");
    if (name === null) return; // user cancelled
    try {
      const res = await fetch("http://localhost:8000/routines", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ title: name, content: routineResponse.routine }),
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      alert("Routine saved");
    } catch (err: any) {
      alert("Error saving routine: " + (err?.message ?? err));
    }
  };

  // parse routine text into items with optional duration metadata
  const parseRoutine = (text: string) => {
    if (!text) return [] as { text: string; done: boolean; duration?: string }[];
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    const items = lines.map((l) => {
      // find duration like '10 min', '15 minutes', '5-7 mins', '30s'
      const durMatch = l.match(/(\b\d+(?:[-–]\d+)?\s*(?:min(?:ute)?s?|mins?|minutes?|sec(?:ond)?s?|s)\b)/i);
      let duration: string | undefined;
      let textOnly = l;
      if (durMatch) {
        duration = durMatch[0];
        // remove the duration from the visible text
        textOnly = l
          .replace(durMatch[0], "")
          .replace(/[\-–:,;]$/g, "")
          .trim();
      }

      // remove common bullet/number prefixes
      textOnly = textOnly
        .replace(/^\s*[-–•\*]\s*/, "")
        .replace(/^\d+[\).\-]\s*/, "")
        .trim();

      return { text: textOnly || l, done: false, duration };
    });
    return items;
  };

  // when a new routine is generated, initialize checklist items
  useEffect(() => {
    if (!routineResponse) {
      setItems([]);
      return;
    }
    setItems(parseRoutine(routineResponse.routine || ""));
  }, [routineResponse]);

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
        <button
          onClick={() => saveRoutine()}
          className="ml-2 bg-green-600 text-white px-3 py-1 mt-10 rounded"
          disabled={!routineResponse}
        >
          Save Routine
        </button>
      </div>

      <h2 className="flex justify-center text-gray-300 text-2xl mt-5">Your Routines</h2>

      <div className="flex justify-center">
        {error && <p className="text-red-500 mt-6">{error}</p>}
        {routineResponse ? (
          <div className="text-gray-300 p-6 max-w-3xl bg-gray-900 rounded">
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm text-gray-400">Generated routine</div>
              <div className="flex gap-2">
                <button
                  className="text-sm px-2 py-1 bg-slate-700 rounded"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(
                        items.map((it) => `- ${it.text}${it.duration ? ` (${it.duration})` : ""}`).join("\n")
                      );
                      alert("Copied checklist to clipboard");
                    } catch (e) {
                      alert("Copy failed: " + e);
                    }
                  }}
                >
                  Copy
                </button>
              </div>
            </div>

            <ol className="list-decimal list-inside space-y-2">
              {items.map((it, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={it.done}
                    onChange={() => setItems((prev) => prev.map((p, i) => (i === idx ? { ...p, done: !p.done } : p)))}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className={`text-gray-100 ${it.done ? "line-through opacity-60" : ""}`}>{it.text}</div>
                    {it.duration && <div className="text-xs text-gray-400">{it.duration}</div>}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        ) : (
          <p className="text-gray-500 p-10">No routine generated yet.</p>
        )}
      </div>
    </div>
  );
};

export default RoutineResponse;
