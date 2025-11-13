import AddTask from "./AddTask";
import { useEffect, useState } from "react";
import TaskCard from "./TaskCard";
import { useAuth } from "../provider/AuthProvider";

type Task = {
  task_name: string;
  done?: boolean;
};

const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const { token, username } = useAuth();

  // storage key per user
  const storageKey = username ? `vibe_tasks_${username}` : null;

  useEffect(() => {
    // When no user is signed in, clear tasks from UI
    if (!username) {
      setTasks([]);
      return;
    }

    // Load optimistic copy from localStorage first so reloads feel instant
    try {
      const saved = storageKey ? localStorage.getItem(storageKey) : null;
      if (saved) {
        setTasks(JSON.parse(saved));
      }
    } catch (e) {
      console.warn("Could not parse saved tasks", e);
    }

    // Then sync from server to ensure canonical data
    const fetchTasks = async () => {
      try {
        const res = await fetch("http://localhost:8000/tasks", {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : undefined,
        });
        if (!res.ok) {
          // on 401/403 clear tasks to avoid leaking other data
          if (res.status === 401 || res.status === 403) {
            setTasks([]);
            return;
          }
          throw new Error(`Response status: ${res.status}`);
        }

  const data: Task[] = await res.json();
  // normalize tasks to include a `done` flag for UI-only state
  const normalized = data.map((t) => ({ ...(t as Task), done: (t as Task).done ?? false }));
  setTasks(normalized);
  if (storageKey) localStorage.setItem(storageKey, JSON.stringify(normalized));
      } catch (error: any) {
        console.error("Error fetching tasks", error);
      }
    };

    fetchTasks();
    // re-run when username or token changes
  }, [username, token]);

  const handleDelete = (task_name: string) => {
    const updatedTasks = tasks.filter((task) => task.task_name !== task_name);
    setTasks(updatedTasks);
    if (storageKey) localStorage.setItem(storageKey, JSON.stringify(updatedTasks));
  };

  const handleSubmit = (task_name: string) => {
    const newTasks = [...tasks, { task_name, done: false }];
    setTasks(newTasks);
    if (storageKey) localStorage.setItem(storageKey, JSON.stringify(newTasks));
  };

  const handleToggle = (task_name: string) => {
    const updated = tasks.map((t) => (t.task_name === task_name ? { ...t, done: !t.done } : t));
    setTasks(updated);
    if (storageKey) localStorage.setItem(storageKey, JSON.stringify(updated));
  };
  return (
    <div className="flex flex-col">
      <AddTask handleTaskSubmit={handleSubmit} />
      <h2 className="flex justify-center text-2xl text-gray-300 mb-4">Your Tasks</h2>
      <div className="flex flex-wrap justify-evenly">
        {tasks &&
          tasks.map((task) => (
            <TaskCard
              handleTaskDelete={handleDelete}
              handleToggle={handleToggle}
              done={!!task.done}
              key={task.task_name}
              task_name={task.task_name}
            />
          ))}
      </div>
    </div>
  );
};

export default Tasks;
