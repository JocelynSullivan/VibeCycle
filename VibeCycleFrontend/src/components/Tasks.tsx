import AddTask from "./AddTask";
import { useEffect, useState } from "react";
import { useAuth } from "../provider/AuthProvider";
import TaskCard from "./TaskCard";

type Task = {
  task_name: string;
};

const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const auth = useAuth();
  const { token } = auth;

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch("http://localhost:8000/tasks", {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        });
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

  const handleDelete = (task_name: string) => {
    const updatedTasks = tasks.filter((task) => task.task_name !== task_name);
    setTasks(updatedTasks);
  };

  const handleSubmit = (task_name: string) => {
    setTasks([...tasks, { task_name }]);
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
