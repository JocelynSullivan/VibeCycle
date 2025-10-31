import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../provider/AuthProvider";

type Routine = {
  id: number;
  owner: string;
  title?: string | null;
  content: string;
};

const SavedDetail: React.FC = () => {
  const { id } = useParams();
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    const fetchOne = async () => {
      try {
        const res = await fetch(`http://localhost:8000/routines/${id}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data: Routine = await res.json();
        setRoutine(data);
      } catch (err: any) {
        setError(err.message || "Error fetching routine");
      }
    };
    fetchOne();
  }, [id, token]);

  return (
    <div className="p-6">
      {error && <div className="text-red-500">{error}</div>}
      {!routine ? (
        <div>Loading…</div>
      ) : (
        <div>
          <div className="flex items-center gap-3 mb-2">
            <button
              type="button"
              className="text-white text-2xl"
              aria-label="Go back"
              onClick={() => {
                // If history is shallow (e.g. user landed directly), fall back to /saved
                if (window.history.length > 1) {
                  navigate(-1);
                } else {
                  navigate('/saved');
                }
              }}
            >
              ←
            </button>
            <h2 className="text-2xl">{routine.title || `Routine #${routine.id}`}</h2>
          </div>
          <pre className="whitespace-pre-wrap bg-gray-900 text-gray-200 p-4 rounded">{routine.content}</pre>
          <div className="flex gap-2 mt-4">
            <button
              className="text-yellow-600"
              onClick={async () => {
                const newTitle = window.prompt("New title:", routine.title || "");
                if (!newTitle) return;
                const res = await fetch(`/routines/${routine.id}`, {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({ title: newTitle }),
                });
                if (res.ok) {
                  setRoutine((r: any) => ({ ...r, title: newTitle }));
                } else {
                  alert("Failed to rename");
                }
              }}
            >
              Rename
            </button>
            <button
              className="text-red-600"
              onClick={async () => {
                if (!confirm("Delete this routine?")) return;
                const res = await fetch(`/routines/${routine.id}`, {
                  method: "DELETE",
                  headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                  navigate('/saved');
                } else {
                  alert('Failed to delete');
                }
              }}
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavedDetail;
