import { useEffect, useState } from "react";
import TaskCard from "./TaskCard";

type Task = {
  task_name: string;
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
        console.error("Error fetching tasks", error);
      }
    };

    fetchTasks();
  }, []);

  return (
    <div className="flex flex-col">
      <h2 className="flex justify-center text-2xl text-white mb-4">Your Tasks</h2>
      <p className="flex flex-wrap justify-between">
        {tasks && tasks.map((task) => <TaskCard task_name={task.task_name} />)}
      </p>
    </div>
  );
};

export default Tasks;
