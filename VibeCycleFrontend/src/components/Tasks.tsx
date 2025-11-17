import AddTask from "./AddTask";
import { useEffect, useState } from "react";
import TaskCard from "./TaskCard";
import { useAuth } from "../provider/AuthProvider";

type Task = {
  task_name: string;
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
        setTasks(data);
        if (storageKey) localStorage.setItem(storageKey, JSON.stringify(data));
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
    setTasks([...tasks, { task_name }]);
    if (storageKey) localStorage.setItem(storageKey, JSON.stringify([...tasks, { task_name }]));
  };
  return (
    <div className="flex flex-col">
      <AddTask handleTaskSubmit={handleSubmit} />
      <h2 className="flex justify-center text-2xl text-gray-300 mb-4">Your Tasks</h2>
      <div className="flex flex-wrap justify-evenly">
        {tasks &&
          tasks.map((task) => (
            <TaskCard handleTaskDelete={handleDelete} key={task.task_name} task_name={task.task_name} />
          ))}
      </div>
    </div>
  );
};

export default Tasks;
