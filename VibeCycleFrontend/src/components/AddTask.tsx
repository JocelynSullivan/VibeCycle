import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useState } from "react";

type NewTask = {
  task_name: string;
};

type NewTaskProps = {
  handleTaskSubmit: (task_name: string) => void;
};

const AddTask: React.FC<NewTaskProps> = ({ handleTaskSubmit }) => {
  const [newTask, setNewTask] = useState<NewTask>({
    task_name: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewTask((prev) => ({
      ...prev,
      [name]: value,
    }));

    // if (name === "energyLevel") {
    //   if (value === "" || /^[1-5]$/.test(value)) {
    //     setNewTask((prev) => ({
    //       ...prev,
    //       [name]: value,
    //     }));
    //   }
    // } else {
    //   setNewTask((prev) => ({
    //     ...prev,
    //     [name]: value,
    //   }));
    // }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // const taskToSend = {
    //   ...newTask,
    //   energyLevel: newTask.energyLevel ? parseInt(newTask.energyLevel, 10) : null,
    // };

    fetch("http://localhost:8000/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newTask),
      mode: "cors",
    });

    setNewTask({
      task_name: "",
    });
    handleTaskSubmit(newTask.task_name);
  };

  return (
    <div className="flex justify-center">
      <form onSubmit={handleSubmit}>
        {/* <div className="flex justify-center pt-10 gap-4">
          <h2>Choose a routine time:</h2>
          <RoutineTimeButton
            time="Morning"
            isSelected={selectedTime === "morning"}
            onClick={() => handleButtonClick("morning")}
          />
          <h2>Choose a routine time:</h2>
          <RoutineTimeButton
            time="Evening"
            isSelected={selectedTime === "evening"}
            onClick={() => handleButtonClick("evening")}
          />
          <h2>Choose a routine time:</h2>
          <RoutineTimeButton
            time="Both"
            isSelected={selectedTime === "both"}
            onClick={() => handleButtonClick("both")}
          />
          {selectedTime && <p>You selected: {selectedTime}</p>}
        </div> */}
        <div className="flex justify-center">
          <div className="w-60">
            <div>
              <Input
                id="name"
                name="task_name"
                placeholder="Task Name"
                autoComplete="name"
                value={newTask.task_name}
                onChange={handleChange}
                className="text-gray-300 mb-3 border-2 mt-5"
              />
            </div>
            {/* <div>
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
            </div> */}
          </div>
        </div>
        <div className="flex justify-center">
          <Button type="submit" className="w-20 bg-cyan-600 mb-10 hover:bg-cyan-700 cursor-pointer">
            Add Task
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddTask;
