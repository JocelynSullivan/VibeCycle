import { Button } from "./ui/button";

type TaskCardInfo = {
  task_name: string;
  handleTaskDelete: (task_name: string) => void;
};

const TaskCard: React.FC<TaskCardInfo> = ({ task_name, handleTaskDelete }) => {
  const handleDelete = async () => {
    try {
      const response = await fetch(`http://localhost:8000/tasks/${encodeURIComponent(task_name)}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }
    } catch (error: any) {
      console.error(error.message);
    }
    handleTaskDelete(task_name);
  };
  return (
    <div className="bg-cyan-900 text-white text-center text-wrap w-42 h-15 m-2 flex justify-center rounded-xl">
      <div className="flex flex-col justify-center">
        <div className="flex justify-end -mt-5">
          <span>
            <Button type="submit" className="w-1 h-5 bg-gray-800 rounded-full" onClick={handleDelete}>
              x
            </Button>
          </span>
        </div>
        <h1 className="text-xl">{task_name}</h1>
      </div>
    </div>
  );
};

export default TaskCard;
