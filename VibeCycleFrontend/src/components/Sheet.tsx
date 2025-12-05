import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../provider/AuthProvider";

const BASE_KEY = "vibe_sheet";
const TASKS_KEY = "vibe_tasks";

const Sheet: React.FC = () => {
  const { username, token } = useAuth();
  const storageKey = username ? `${BASE_KEY}_${username}` : BASE_KEY;
  const tasksKey = username ? `${TASKS_KEY}_${username}` : TASKS_KEY;

  const editorRef = useRef<HTMLDivElement | null>(null);
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved && editorRef.current) {
        editorRef.current.innerHTML = saved;
      }
    } catch (e) {
      console.warn("Failed to load sheet", e);
    }
  }, [storageKey]);

  // autosave every 3s if dirty
  useEffect(() => {
    const id = setInterval(() => {
      if (isDirty) save();
    }, 3000);
    return () => clearInterval(id);
  }, [isDirty]);

  // Extract plain-text tasks from editor HTML
  const extractTasksFromHtml = (html: string): string[] => {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    const text = tmp.innerText || tmp.textContent || "";
    // Split by newlines and common bullet separators; normalize and dedupe
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.replace(/^\s*[-–•\*\d+\)\.\s]+/, "").trim())
      .filter(Boolean);

    const seen = new Set<string>();
    const out: string[] = [];
    for (const l of lines) {
      const key = l.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        out.push(l);
      }
    }
    return out;
  };

  const save = async () => {
    if (!editorRef.current) return;
    try {
      const html = editorRef.current.innerHTML;
      localStorage.setItem(storageKey, html);

      // Also extract tasks and persist to the per-user tasks key so the Tasks
      // page will pick them up. Tasks are stored as array of { task_name }.
      const parsedTasks = extractTasksFromHtml(html);
      if (parsedTasks.length) {
        // read existing tasks from localStorage (may be objects)
        let existing: Array<{ task_name: string }> = [];
        try {
          const raw = localStorage.getItem(tasksKey);
          if (raw) existing = JSON.parse(raw);
        } catch (e) {
          existing = [];
        }

        const existingNames = new Set(existing.map((t) => t.task_name.toLowerCase()));
        const newTasks = parsedTasks.filter((t) => !existingNames.has(t.toLowerCase()));

        const merged = [...existing, ...newTasks.map((t) => ({ task_name: t }))];

        try {
          localStorage.setItem(tasksKey, JSON.stringify(merged));
        } catch (e) {
          console.warn("Failed to save tasks to localStorage", e);
        }

        // If user is signed in, POST any new tasks to the backend so they're
        // persisted server-side. Backend create endpoint is idempotent for
        // existing tasks for the same owner.
        if (token && newTasks.length) {
          for (const t of newTasks) {
            try {
              await fetch("http://localhost:8000/tasks", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ task_name: t }),
                mode: "cors",
              });
            } catch (e) {
              // Don't fail the save for network errors; keep local copy.
              console.warn("Failed to post task to server", e);
            }
          }
        }
      }

      setLastSaved(Date.now());
      setIsDirty(false);
    } catch (e) {
      console.error("Failed to save sheet", e);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 text-gray-200">
      <div className="flex justify-end mb-4">
        <div className="text-sm text-gray-400">
          {lastSaved ? `Saved ${new Date(lastSaved).toLocaleTimeString()}` : "Not saved yet"}
        </div>
      </div>

      <div
        ref={editorRef}
        onInput={() => setIsDirty(true)}
        contentEditable
        suppressContentEditableWarning
        className="min-h-[60vh] bg-gray-800 text-gray-200 rounded p-6 focus:outline-none shadow-inner"
        style={{ caretColor: "#06b6d4" }}
      />
      <div className="mt-3 text-xs text-gray-400">Click anywhere in the gray box to start typing.</div>
    </div>
  );
};

export default Sheet;
