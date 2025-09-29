import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useState } from "react";

type NewTask = {
  name: string;
  energyLevel?: string;
};

const AddTask: React.FC = () => {
  const [newTask, setNewTask] = useState<NewTask>({
    name: "",
    energyLevel: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === "energyLevel") {
      if (value === "" || /^[1-5]$/.test(value)) {
        setNewTask((prev) => ({
          ...prev,
          [name]: value,
        }));
      }
    } else {
      setNewTask((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const taskToSend = {
      ...newTask,
      energyLevel: newTask.energyLevel ? parseInt(newTask.energyLevel, 10) : null,
    };

    fetch("http://localhost:8000/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(taskToSend),
      mode: "cors",
    });

    setNewTask({
      name: "",
      energyLevel: "",
    });
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col w-60">
          <div>
            <Input
              name="name"
              placeholder="Task Name"
              autoComplete="name"
              value={newTask.name}
              onChange={handleChange}
              className="text-gray-300 mb-3 border-2 mt-5"
            />
          </div>
          <div>
            <Input
              name="energyLevel"
              placeholder="Energy Level (1-5)"
              autoComplete="amount"
              type="number"
              min={1}
              max={5}
              value={newTask.energyLevel}
              onChange={handleChange}
              className="text-gray-300 mb-3 border-2"
            />
          </div>
        </div>
        <div className="flex justify-center">
          <Button type="submit" className="w-20 bg-cyan-600 mb-10 hover:bg-cyan-700">
            Submit
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddTask;
