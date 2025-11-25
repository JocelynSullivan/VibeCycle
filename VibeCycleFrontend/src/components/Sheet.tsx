import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../provider/AuthProvider";

const BASE_KEY = "vibe_sheet";

const Sheet: React.FC = () => {
  const { username } = useAuth();
  const storageKey = username ? `${BASE_KEY}_${username}` : BASE_KEY;

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

  const save = () => {
    if (!editorRef.current) return;
    try {
      const html = editorRef.current.innerHTML;
      localStorage.setItem(storageKey, html);
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
      <div className="mt-3 text-xs text-gray-400">Click anywhere to start typing.</div>
    </div>
  );
};

export default Sheet;
