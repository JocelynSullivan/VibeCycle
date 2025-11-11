import { useEffect, useState } from "react";
import { useAuth } from "../provider/AuthProvider";

type PostResponse = {
  routine: string;
};

type ItemNode = { type: "title"; text: string } | { type: "task"; text: string; done: boolean; duration?: string };

const RoutineResponse: React.FC = () => {
  const [routineResponse, setRoutineResponse] = useState<PostResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [energyLevel, setEnergyLevel] = useState<number>(1);
  const [items, setItems] = useState<ItemNode[]>([]);

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

  // parse routine text into title/task nodes and extract durations
  const parseRoutine = (text: string) => {
    if (!text) return [] as ItemNode[];
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    const nodes: ItemNode[] = [];

    for (const l of lines) {
      // find duration like '10 min', '15 minutes', '5-7 mins', '30s'
      const durMatch = l.match(/(\b\d+(?:[-–]\d+)?\s*(?:min(?:ute)?s?|mins?|minutes?|sec(?:ond)?s?|s)\b)/i);
      let duration: string | undefined;
      let textOnly = l;

      if (durMatch) {
        duration = durMatch[0];
        textOnly = l.replace(durMatch[0], "").trim();
      }

      // remove common bullet/number prefixes
      textOnly = textOnly
        .replace(/^\s*[-–•\*]\s*/, "")
        .replace(/^\d+[\).\-]\s*/, "")
        .trim();

      // detect a title: line ends with ':' OR is all-caps (likely a heading)
      const isTitle = /:$/.test(l) || (/^[A-Z0-9\s]+$/.test(textOnly) && textOnly.length > 2);
      if (isTitle) {
        // strip trailing colon for title
        const titleText = textOnly.replace(/:$/, "").trim();
        nodes.push({ type: "title", text: titleText });
        continue;
      }

      // sanitize trailing parenthetical/groups and punctuation from task text
      // remove trailing parenthetical/bracketed groups like 'task (optional)'
      textOnly = textOnly.replace(/\s*[\(\[\{][^\)\]\}]*[\)\]\}]\s*$/g, "").trim();
      // remove trailing punctuation and connector characters
      textOnly = textOnly.replace(/[\.\,;:\-–—\(\)\[\]\{\}]+$/g, "").trim();

      if (!textOnly) textOnly = l.replace(/[:\-–]$/, "").trim();

      nodes.push({ type: "task", text: textOnly, done: false, duration });
    }

    return nodes;
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
        <div className="">
          <p className="flex justify-center text-gray-400 pb-5">How are you feeling today?</p>
          <div className="flex items-center gap-4">
            {[
              { v: 1, label: "exhausted" },
              { v: 2, label: "tired" },
              { v: 3, label: "calm" },
              { v: 4, label: "motivated" },
              { v: 5, label: "energized" },
            ].map((lvl) => (
              <div key={lvl.v} className="flex flex-col items-center">
                <button
                  onClick={() => setEnergyLevel(lvl.v)}
                  aria-pressed={energyLevel === lvl.v}
                  aria-label={lvl.label}
                  className={`px-4 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
                    energyLevel === lvl.v
                      ? "bg-cyan-600 text-white border-cyan-600"
                      : "bg-transparent text-gray-200 border-gray-600"
                  }`}
                >
                  {lvl.v}
                </button>
                <div className="text-xs text-gray-400 mt-1 capitalize">{lvl.label}</div>
              </div>
            ))}
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
                      const lines = items
                        .filter((n): n is Extract<ItemNode, { type: "task" }> => n.type === "task")
                        .map((it) => `- ${it.text}${it.duration ? ` (${it.duration})` : ""}`);
                      await navigator.clipboard.writeText(lines.join("\n"));
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
            <div className="space-y-3">
              {items.map((node, idx) => {
                if (node.type === "title") {
                  return (
                    <div key={idx} className="text-cyan-300 font-semibold text-lg mt-3">
                      {node.text}
                    </div>
                  );
                }
                // task node
                return (
                  <div key={idx} className="flex items-start gap-3">
                    <button
                      aria-pressed={node.done}
                      onClick={() =>
                        setItems((prev) =>
                          prev.map((p, i) => (i === idx && p.type === "task" ? { ...p, done: !p.done } : p))
                        )
                      }
                      className={`mt-1 w-5 h-5 rounded-sm flex-none border ${
                        node.done ? "bg-green-600 border-green-600" : "bg-transparent border-gray-500"
                      }`}
                    />
                    <div className="flex-1">
                      <div className={`text-gray-100 ${node.done ? "line-through opacity-60" : ""}`}>{node.text}</div>
                      {node.duration && <div className="text-xs text-gray-400">{node.duration}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="text-gray-500 p-10">No routine generated yet.</p>
        )}
      </div>
    </div>
  );
};

export default RoutineResponse;
