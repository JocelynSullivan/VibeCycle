import { useEffect, useState } from "react";
import { useAuth } from "../provider/AuthProvider";
import { Link, useNavigate } from "react-router-dom";

type Routine = {
  id: number;
  owner: string;
  title?: string | null;
  content: string;
};

const Saved: React.FC = () => {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const auth = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const { token } = useAuth();

  useEffect(() => {
    const fetchSaved = async () => {
      try {
        const res = await fetch("http://localhost:8000/routines", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data: Routine[] = await res.json();
        setRoutines(data);
      } catch (err: any) {
        setError(err.message || "Error fetching saved routines");
      }
    };
    fetchSaved();
  }, [token]);

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <button
          type="button"
          className="text-white text-2xl"
          aria-label="Go back"
          onClick={() => {
            // go back in history
            navigate(-1);
          }}
        >
          ←
        </button>
        <h2 className="text-2xl text-white">Saved Routines</h2>
      </div>
      {error && <div className="text-red-500">{error}</div>}
      {routines.length === 0 ? (
        <div className="text-gray-500">No saved routines yet.</div>
      ) : (
        <ul className="space-y-2">
          {routines.map((r) => (
            <li key={r.id} className="text-white p-4 border rounded mb-2">
              <h3 className="font-bold">{r.title || "Untitled"}</h3>
              <p className="text-sm text-gray-600">{r.content}</p>
              <div className="flex gap-2 mt-2">
                <Link to={`/saved/${r.id}`} className="text-blue-600">
                  View
                </Link>
                <button
                  className="text-sm text-yellow-600"
                  onClick={async () => {
                    const newTitle = window.prompt("New title:", r.title || "");
                    if (!newTitle) return;
                    const res = await fetch(`/routines/${r.id}`, {
                      method: "PUT",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${auth.token}`,
                      },
                      body: JSON.stringify({ title: newTitle }),
                    });
                    if (res.ok) {
                      setRoutines((prev) => prev.map((p) => (p.id === r.id ? { ...p, title: newTitle } : p)));
                    } else {
                      alert("Failed to rename");
                    }
                  }}
                >
                  Rename
                </button>
                <button
                  className="text-sm text-red-600"
                  onClick={async () => {
                    if (!confirm("Delete this routine?")) return;
                    const res = await fetch(`/routines/${r.id}`, {
                      method: "DELETE",
                      headers: { Authorization: `Bearer ${auth.token}` },
                    });
                    if (res.ok) {
                      setRoutines((prev) => prev.filter((p) => p.id !== r.id));
                    } else {
                      alert("Failed to delete");
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Saved;
