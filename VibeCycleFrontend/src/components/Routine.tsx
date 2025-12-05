import { useEffect, useState, useRef } from "react";
import { useAuth } from "../provider/AuthProvider";
import StickFigure from "./StickFigure";

type PostResponse = {
  routine: string;
};

type ItemNode =
  | { type: "title"; text: string }
  | { type: "task"; text: string; done: boolean; duration?: string }
  | { type: "total"; text: string };

const RoutineResponse: React.FC = () => {
  const [routineResponse, setRoutineResponse] = useState<PostResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [energyLevel, setEnergyLevel] = useState<number>(1);
  const [items, setItems] = useState<ItemNode[]>([]);
  const [editMode, setEditMode] = useState(false);

  const { token, username } = useAuth();

  const fetchRoutine = async (level: number) => {
    if (!token) {
      setError("You must be signed in to generate a routine.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Read optimistic local tasks and sheet notes (per-user keys)
      const tasksKey = username ? `vibe_tasks_${username}` : "vibe_tasks";
      const sheetKey = username ? `vibe_sheet_${username}` : "vibe_sheet";

      let localTasks: string[] = [];
      try {
        const raw = localStorage.getItem(tasksKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          // support both array of strings or array of objects with task_name
          if (Array.isArray(parsed)) {
            localTasks = parsed.map((t: any) => (typeof t === "string" ? t : t?.task_name || "")).filter(Boolean);
          }
        }
      } catch (e) {
        // ignore parse errors
      }

      const sheet = localStorage.getItem(sheetKey) || null;

      const body = {
        energy_level: level,
        tasks: localTasks.length ? localTasks : undefined,
        notes: sheet || undefined,
      } as any;

      const response = await fetch(`http://localhost:8000/routine`, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
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

  // useAuth already called above
  const dragIndex = useRef<number | null>(null);
  const touchTimer = useRef<number | null>(null);
  const STORAGE_KEY = "vibe_last_generated_routine";

  const startEditing = () => setEditMode(true);
  const stopEditing = () => {
    setEditMode(false);
  };

  const parseDurationToMinutes = (dur?: string) => {
    if (!dur) return 0;
    const s = dur.toLowerCase().trim();
    // handle formats like '1h 30m', '1 hr 30 min', '90 min', '10 min', '45'
    let total = 0;
    // hours
    const hrMatch = s.match(/(\d+)\s*h(?:ours?|r)?/i);
    if (hrMatch) total += parseInt(hrMatch[1], 10) * 60;
    const hrShort = s.match(/(\d+)\s*hr\b/i);
    if (hrShort) total += parseInt(hrShort[1], 10) * 60;
    const hmMatch = s.match(/(\d+)\s*h\s*(\d+)\s*m/i);
    if (hmMatch) total += parseInt(hmMatch[1], 10) * 60 + parseInt(hmMatch[2], 10);
    // minutes
    const minMatch = s.match(/(\d+)\s*m(?:in(?:ute)?s?)?/i);
    if (minMatch) total += parseInt(minMatch[1], 10);
    // plain number fallback
    if (total === 0) {
      const numMatch = s.match(/^(\d+)$/);
      if (numMatch) total = parseInt(numMatch[1], 10);
    }
    return total;
  };

  // Normalize a task text to a dedupe key: lowercase, trim, collapse spaces, remove punctuation
  const normalizeTaskKey = (t: string) =>
    t
      .toLowerCase()
      .replace(/[\u2013\u2014]/g, "-")
      .replace(/[^\n\w\s-]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  // Remove duplicate tasks while attempting to preserve duration information.
  // If two tasks share the same normalized text, keep the first one and
  // inherit duration from the later one if the first lacked it.
  const dedupeTasks = (nodes: ItemNode[]) => {
    const seen = new Map<string, Extract<ItemNode, { type: "task" }>>();
    const out: ItemNode[] = [];
    for (const n of nodes) {
      if (n.type !== "task") {
        // ignore "total" nodes coming from AI text - we'll compute total separately
        if (n.type === "title") out.push(n);
        continue;
      }
      const key = normalizeTaskKey(n.text);
      const existing = seen.get(key);
      if (!existing) {
        // clone to avoid mutating original
        const copy = { ...n } as Extract<ItemNode, { type: "task" }>;
        seen.set(key, copy);
        out.push(copy);
      } else {
        // merge duration if missing
        if (!existing.duration && n.duration) existing.duration = n.duration;
      }
    }
    return out;
  };

  const formatMinutes = (mins: number) => {
    if (mins <= 0) return "0 min";
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
  };

  const computeTotalText = (nodes: ItemNode[]) => {
    const totalMins = nodes
      .filter((n): n is Extract<ItemNode, { type: "task" }> => n.type === "task")
      .reduce((acc, t) => acc + parseDurationToMinutes(t.duration), 0);
    return `Total estimated time: ${formatMinutes(totalMins)}`;
  };

  const addTask = (text = "New task", duration?: string) => {
    setItems((prev) => {
      const withoutTotal = prev.filter((n) => n.type !== "total") as Extract<ItemNode, { type: "task" }>[];
      const key = normalizeTaskKey(text);
      const existingIdx = withoutTotal.findIndex((t) => normalizeTaskKey(t.text) === key);
      if (existingIdx !== -1) {
        // update existing task (preserve done state)
        const updated = [...withoutTotal];
        updated[existingIdx] = {
          ...updated[existingIdx],
          text,
          duration: duration ?? updated[existingIdx].duration,
        };
        const totalNode: Extract<ItemNode, { type: "total" }> = { type: "total", text: computeTotalText(updated) };
        return [...updated, totalNode];
      }

      const taskNode: Extract<ItemNode, { type: "task" }> = { type: "task", text, done: false, duration };
      const next = [...withoutTotal, taskNode];
      const totalNode: Extract<ItemNode, { type: "total" }> = { type: "total", text: computeTotalText(next) };
      return [...next, totalNode];
    });
  };

  const deleteTask = (index: number) => {
    setItems((prev) => {
      const without = prev.filter((_, i) => i !== index).filter((n) => n.type !== "total");
      const totalNode: Extract<ItemNode, { type: "total" }> = { type: "total", text: computeTotalText(without) };
      return [...without, totalNode];
    });
  };

  const onDragStart = (e: React.DragEvent, index: number) => {
    dragIndex.current = index;
    e.dataTransfer.effectAllowed = "move";
  };

  // keep total updated whenever items change (for edits to durations)
  useEffect(() => {
    // compute desired total text
    const desired = computeTotalText(items);
    // find existing total node (if any)
    const existingTotal = items.find((n) => n.type === "total") as ItemNode | undefined;
    if (existingTotal && existingTotal.text === desired) return;
    // rebuild items without total and append updated total
    setItems((prev) => {
      const withoutTotal = prev.filter((n) => n.type !== "total");
      return [...withoutTotal, { type: "total", text: desired }];
    });
  }, [items]);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const onDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    const from = dragIndex.current;
    const to = index;
    if (from === null || from === undefined) return;
    if (from === to) return;
    setItems((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(from, 1);
      copy.splice(to, 0, moved);
      return copy;
    });
    dragIndex.current = null;
  };

  const toggleTaskDone = (index: number) => {
    setItems((prev) => {
      const node = prev[index];
      if (!node || node.type !== "task") return prev;
      const toggled: typeof node = { ...node, done: !node.done } as any;

      // Remove the task from its current position
      const copy = [...prev];
      copy.splice(index, 1);

      // Find where to insert: before the total node if marking done, otherwise at the first task position
      if (toggled.done) {
        const totalIdx = copy.findIndex((n) => n.type === "total");
        if (totalIdx === -1) {
          copy.push(toggled);
        } else {
          copy.splice(totalIdx, 0, toggled);
        }
      } else {
        // insert among tasks at the start of task area (before first task or before total if no task)
        const firstTaskIdx = copy.findIndex((n) => n.type === "task");
        const insertIdx = firstTaskIdx === -1 ? copy.findIndex((n) => n.type === "total") : firstTaskIdx;
        if (insertIdx === -1) copy.push(toggled);
        else copy.splice(insertIdx, 0, toggled);
      }

      return copy;
    });
  };

  const saveRoutine = async (title?: string) => {
    if (!routineResponse && items.length === 0) return;
    const name = title ?? window.prompt("Name this routine:", "My Routine");
    if (name === null) return;
    try {
      // If user edited items, build content from items; otherwise fall back to original AI response
      const content = items.length
        ? items
            .map((n) => {
              if (n.type === "task") return `- ${n.text}${n.duration ? ` (${n.duration})` : ""}`;
              if (n.type === "total") return `${n.text}`;
              return null;
            })
            .filter(Boolean)
            .join("\n")
        : routineResponse!.routine;

      const res = await fetch("http://localhost:8000/routines", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ title: name, content }),
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      alert("Routine saved");
      setEditMode(false);
    } catch (err: any) {
      alert("Error saving routine: " + (err?.message ?? err));
    }
  };

  const applyEdits = () => {
    // Build content from items and update routineResponse so edits are preserved locally
    if (items.length) {
      const content = items
        .map((n) => {
          if (n.type === "task") return `- ${n.text}${n.duration ? ` (${n.duration})` : ""}`;
          if (n.type === "total") return `${n.text}`;
          return null;
        })
        .filter(Boolean)
        .join("\n");
      setRoutineResponse({ routine: content });
    }
    setEditMode(false);
  };

  const parseRoutine = (text: string) => {
    if (!text) return [] as ItemNode[];
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    const nodes: ItemNode[] = [];

    for (const l of lines) {
      // Normalize bullets and remove common prefixes
      const cleaned = l.replace(/^\s*[-–•\*\d+\)\.]+\s*/, "").trim();

      // Attempt to parse duration inside parentheses or at end: e.g. "Task name (10 min)" or "Task name - 10 min"
      const durMatch = cleaned.match(
        /\((\s*\d+\s*(?:min|mins|minutes|s|sec|secs))\)|(?:-|–|—)\s*(\d+\s*(?:min|mins|minutes|s|sec|secs))$|\b(\d+\s*(?:min|mins|minutes|s|sec|secs))\b/i
      );
      let duration: string | undefined;
      if (durMatch) {
        duration = (durMatch[1] || durMatch[2] || durMatch[3] || "").trim();
      }

      // If this line looks like the total, capture it
      const totalRegex = /^(?:total(?:\s+estimated)?(?:\s+time)?|estimated\s+total)\s*[:\-–]?\s*(.+)$/i;
      const totalMatch = cleaned.match(totalRegex);
      if (totalMatch) {
        const totalText = (totalMatch[1] || "").trim();
        const display = totalText ? `Total estimated time: ${totalText}` : "Total estimated time";
        nodes.push({ type: "total", text: display });
        continue;
      }

      // Only accept lines that contain a duration; otherwise ignore the line
      if (!duration) {
        continue;
      }

      // Extract task text without the duration
      const textOnly = cleaned
        .replace(
          /\(([^)]+)\)|(?:-|–|—)\s*\d+\s*(?:min|mins|minutes|s|sec|secs)$|\b\d+\s*(?:min|mins|minutes|s|sec|secs)\b/i,
          ""
        )
        .trim();
      if (!textOnly) continue;

      nodes.push({ type: "task", text: textOnly, done: false, duration });
    }

    return dedupeTasks(nodes);
  };

  useEffect(() => {
    if (!routineResponse) {
      setItems([]);
      return;
    }
    // Parse AI response and dedupe tasks before setting items
    setItems(parseRoutine(routineResponse.routine || ""));
  }, [routineResponse]);

  // Load last generated routine from sessionStorage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        setRoutineResponse({ routine: saved });
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Persist routineResponse.routine to sessionStorage so it survives route navigation
  useEffect(() => {
    try {
      if (routineResponse && routineResponse.routine) {
        sessionStorage.setItem(STORAGE_KEY, routineResponse.routine);
      } else {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      // ignore
    }
  }, [routineResponse]);
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

      <div className="flex justify-center mt-6">
        <StickFigure energyLevel={energyLevel} />
      </div>

      <div className="flex justify-center">
        <button
          onClick={() => fetchRoutine(energyLevel)}
          className="ml-2 bg-cyan-600 text-white px-3 py-1 rounded"
          disabled={loading}
        >
          {loading ? "Generating…" : "Generate Routine"}
        </button>
        <button
          onClick={() => saveRoutine()}
          className="ml-2 bg-green-600 text-white px-3 py-1 rounded"
          disabled={!routineResponse}
        >
          Save Routine
        </button>
      </div>

      <div className="flex justify-center">
        {error && <p className="text-red-500 mt-6">{error}</p>}
        {routineResponse ? (
          <div
            className="text-gray-300 py-5 px-10 m-10 max-w-3xl rounded outline-1 outline-white"
            onContextMenu={(e) => {
              e.preventDefault();
              if (!editMode) startEditing();
            }}
            onTouchStart={() => {
              // start a long-press timer (600ms)
              if (touchTimer.current) window.clearTimeout(touchTimer.current);
              touchTimer.current = window.setTimeout(() => {
                if (!editMode) startEditing();
                touchTimer.current = null;
              }, 600) as unknown as number;
            }}
            onTouchEnd={() => {
              if (touchTimer.current) {
                window.clearTimeout(touchTimer.current);
                touchTimer.current = null;
              }
            }}
            onTouchMove={() => {
              if (touchTimer.current) {
                window.clearTimeout(touchTimer.current);
                touchTimer.current = null;
              }
            }}
          >
            <div className="flex justify-between items-center mb-4 w-90">
              <div className="text-sm text-gray-400">Your Routine:</div>
              <div className="flex gap-2">
                {!editMode ? (
                  <>
                    <button
                      onClick={startEditing}
                      aria-label="Edit routine"
                      title="Edit"
                      className="flex items-center justify-center w-8 h-8 rounded hover:bg-gray-700"
                    >
                      <svg width="16" height="4" viewBox="0 0 16 4" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="2" cy="2" r="2" fill="white" />
                        <circle cx="8" cy="2" r="2" fill="white" />
                        <circle cx="14" cy="2" r="2" fill="white" />
                      </svg>
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => applyEdits()} className="text-sm px-2 py-1 bg-green-600 rounded text-black">
                      Done
                    </button>
                    <button onClick={() => addTask()} className="text-sm px-2 py-1 bg-cyan-600 rounded text-black">
                      + Task
                    </button>
                  </>
                )}
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

                if (node.type === "total") {
                  return (
                    <div key={idx} className="text-sm text-gray-400 italic mt-2">
                      {node.text}
                    </div>
                  );
                }

                // node is a task
                return (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 ${editMode ? "bg-gray-800 p-2 rounded" : ""}`}
                    draggable={editMode}
                    onDragStart={(e) => onDragStart(e, idx)}
                    onDragOver={onDragOver}
                    onDrop={(e) => onDrop(e, idx)}
                  >
                    <button
                      aria-pressed={node.done}
                      onClick={() => toggleTaskDone(idx)}
                      className={`mt-1 w-5 h-5 rounded-sm flex-none border ${
                        node.done ? "bg-green-600 border-green-600" : "bg-transparent border-gray-500"
                      }`}
                    />
                    <div className="flex-1">
                      {editMode ? (
                        <div className="flex gap-2">
                          <input
                            value={node.text}
                            onChange={(e) =>
                              setItems((prev) =>
                                prev.map((p, i) =>
                                  i === idx && p.type === "task" ? { ...p, text: e.target.value } : p
                                )
                              )
                            }
                            className="bg-gray-900 hover:cursor-grab text-gray-100 p-1 rounded w-full"
                          />
                          <input
                            value={node.duration ?? ""}
                            onChange={(e) =>
                              setItems((prev) =>
                                prev.map((p, i) =>
                                  i === idx && p.type === "task" ? { ...p, duration: e.target.value } : p
                                )
                              )
                            }
                            placeholder="10 min"
                            className="bg-gray-900 text-gray-100 p-1 rounded w-28"
                          />
                          <button onClick={() => deleteTask(idx)} className="px-2 bg-red-600 rounded">
                            Delete
                          </button>
                        </div>
                      ) : (
                        <>
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => toggleTaskDone(idx)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") toggleTaskDone(idx);
                            }}
                            className={`text-gray-100 ${node.done ? "line-through opacity-60" : ""}`}
                          >
                            {node.text}
                          </div>
                          {node.duration && <div className="text-xs text-gray-400">{node.duration}</div>}
                        </>
                      )}
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
