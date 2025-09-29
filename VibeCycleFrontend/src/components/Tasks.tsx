import { useEffect, useState } from "react";

type Task = {
  name: string;
  energyLevel: number | null;
};

const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch("http://localhost:8000/tasks");
        if (!response.ok) {
          throw new Error(`Response status: ${response.status}`);
        }

        const data: Task[] = await response.json();
        setTasks(data);
      } catch (error: any) {
        console.error("Error fetching tasks:", error);
      }
    };

    fetchTasks();
  }, []);

  return (
    <div>
      <h2 className="text-2xl text-white mb-4">Your Tasks</h2>
      <ul>
        {tasks.map((task) => (
          <li className="text-gray-300 mb-2">
            Task: {task.name} - Energy Level: {task.energyLevel}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Tasks;
