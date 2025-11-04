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
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

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

  // remove markdown emphasis markers like * or _ around titles or headings
  textOnly = textOnly.replace(/^[*_]+|[*_]+$/g, "").trim();

  // remove common bullet/number prefixes
  textOnly = textOnly.replace(/^\s*[-–•\*]\s*/, "").replace(/^\d+[\).\-]\s*/, "").trim();

  // detect a title: line ends with ':' OR is all-caps OR matches common routines like morning/evening routines
  const isRoutineTitle = /:\s*$/.test(l) || (/^[A-Z0-9\s]+$/.test(textOnly) && textOnly.length > 2);
  const isMorningEvening = /\b(morning|evening)\b.*\broutine\b/i.test(textOnly);
  const isTitle = isRoutineTitle || isMorningEvening;
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

            <div className="space-y-4">
              {/* group items into sections by title */}
              {(() => {
                const sections: { title?: string; tasks: Extract<ItemNode, { type: "task" }>[] }[] = [];
                let current: { title?: string; tasks: Extract<ItemNode, { type: "task" }>[] } | null = null;
                for (const n of items) {
                  if (n.type === "title") {
                    current = { title: n.text, tasks: [] };
                    sections.push(current);
                    continue;
                  }
                  if (!current) {
                    current = { title: undefined, tasks: [] };
                    sections.push(current);
                  }
                  current.tasks.push(n);
                }

                return sections.map((sec, si) => {
                  const key = sec.title ?? `untitled-${si}`;
                  const collapsed = !!collapsedSections[key];
                  return (
                    <div key={si} className="bg-gray-800 p-3 rounded">
                      {sec.title && (
                        <div className="flex items-center justify-between">
                          <div className="text-cyan-300 font-semibold text-lg">{sec.title}</div>
                          <button
                            onClick={() => setCollapsedSections((s) => ({ ...s, [key]: !s[key] }))}
                            aria-expanded={!collapsed}
                            className="flex items-center gap-2 text-gray-200 px-2 py-1 rounded bg-gray-700 hover:bg-gray-700/80"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="none"
                              stroke="currentColor"
                              className={`w-4 h-4 transform transition-transform duration-200 ${collapsed ? "rotate-180" : "rotate-0"}`}
                            >
                              <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M6 8l4 4 4-4" />
                            </svg>
                            <span className="text-xs">{collapsed ? "Show" : "Hide"}</span>
                          </button>
                        </div>
                      )}
                      <div className={`${collapsed ? "hidden" : "block"} mt-2 space-y-2`}>
                        {sec.tasks.map((task, ti) => {
                          // find index of the overall items to update state correctly
                          const globalIndex = items.findIndex((it) => it === task);
                          return (
                            <div key={ti} className="flex items-start gap-3">
                              <button
                                aria-pressed={task.done}
                                onClick={() =>
                                  setItems((prev) => prev.map((p, i) => (i === globalIndex && p.type === "task" ? { ...p, done: !p.done } : p)))
                                }
                                className={`mt-1 w-5 h-5 rounded-sm flex-none border ${
                                  task.done ? "bg-green-600 border-green-600" : "bg-transparent border-gray-500"
                                }`}
                              />
                              <div className="flex-1">
                                <div className={`text-gray-100 ${task.done ? "line-through opacity-60" : ""}`}>{task.text}</div>
                                {task.duration && <div className="text-xs text-gray-400">{task.duration}</div>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                });
              })()}
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
