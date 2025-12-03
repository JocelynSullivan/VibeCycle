import React, { useState, useEffect } from "react";
import { useAuth } from "../provider/AuthProvider";
import { useNavigate } from "react-router-dom";

type Day = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

const DAYS: Day[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const STORAGE_KEY = "vibe_custom_weekly_routine";

const Routines: React.FC = () => {
  const { username } = useAuth();
  const navigate = useNavigate();

  type Routine = Record<Day, string[]>;

  const empty: Routine = {
    Mon: [],
    Tue: [],
    Wed: [],
    Thu: [],
    Fri: [],
    Sat: [],
    Sun: [],
  };

  const [routine, setRoutine] = useState<Routine>(empty);
  const [title, setTitle] = useState<string>("My Weekly Routine");

  // Load from storage (per-user if username available)
  useEffect(() => {
    try {
      const key = username ? `${STORAGE_KEY}_${username}` : STORAGE_KEY;
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        setTitle(parsed.title || "My Weekly Routine");
        setRoutine(parsed.routine || empty);
      }
    } catch (e) {
      // ignore parse errors
    }
  }, [username]);

  const persist = () => {
    try {
      const key = username ? `${STORAGE_KEY}_${username}` : STORAGE_KEY;
      localStorage.setItem(key, JSON.stringify({ title, routine }));
      alert("Routine saved locally");
    } catch (e) {
      alert("Failed to save routine: " + e);
    }
  };

  // Auto-save whenever the routine or title changes (debounced).
  useEffect(() => {
    const key = username ? `${STORAGE_KEY}_${username}` : STORAGE_KEY;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify({ title, routine }));
      } catch (e) {
        // ignore
      }
    }, 400);
    return () => clearTimeout(t);
  }, [title, routine, username]);

  const addTask = (day: Day) => {
    const text = window.prompt(`Add task for ${day}`);
    if (!text) return;
    setRoutine((r) => ({ ...r, [day]: [...r[day], text] }));
  };

  const deleteTask = (day: Day, idx: number) => {
    setRoutine((r) => ({ ...r, [day]: r[day].filter((_, i) => i !== idx) }));
  };

  return (
    <div className="bg-black min-h-screen p-6">
      <div className="max-w-5xl mx-auto text-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              aria-label="Go back"
              title="Back"
              className="text-2xl leading-none p-1 rounded hover:bg-gray-800"
            >
              ←
            </button>
            <h2 className="text-2xl">{title}</h2>
          </div>
          <div className="flex gap-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-gray-900 text-gray-100 px-2 py-1 rounded"
            />
            <button onClick={persist} className="px-3 py-1 bg-cyan-600 rounded text-black">
              Save
            </button>
          </div>
        </div>

        <p className="text-gray-400 mb-4">Create a custom weekly routine. Add tasks to each day and save locally.</p>

        <div className="grid grid-cols-7 gap-4">
          {DAYS.map((d) => (
            <div key={d} className="bg-gray-900 p-3 rounded">
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold">{d}</div>
                <button onClick={() => addTask(d)} className="text-sm px-2 py-0.5 bg-green-600 rounded text-black">
                  +
                </button>
              </div>
              <div className="space-y-2">
                {routine[d].length === 0 && <div className="text-xs text-gray-500">No tasks</div>}
                {routine[d].map((t, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-800 p-2 rounded">
                    <div className="text-sm">{t}</div>
                    <button onClick={() => deleteTask(d, i)} className="text-xs text-red-500">
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Routines;
