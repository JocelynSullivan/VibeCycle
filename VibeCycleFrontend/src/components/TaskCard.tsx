import { Button } from "./ui/button";
import { useAuth } from "../provider/AuthProvider";

type TaskCardInfo = {
  task_name: string;
  handleTaskDelete: (task_name: string) => void;
};

const TaskCard: React.FC<TaskCardInfo> = ({ task_name, handleTaskDelete }) => {
  const { token } = useAuth();

  const handleDelete = async () => {
    try {
      const response = await fetch(`http://localhost:8000/tasks/${encodeURIComponent(task_name)}`, {
        method: "DELETE",
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : undefined,
      });

      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }
      handleTaskDelete(task_name);
    } catch (error: any) {
      console.error(error.message);
    }
  };
  return (
    <div>
      <div className="flex justify-end -mb-4">
        <Button type="submit" className="w-1 h-5 bg-gray-800 rounded-full hover: cursor-pointer" onClick={handleDelete}>
          x
        </Button>
      </div>
      <div className="bg-cyan-900 text-white text-center text-wrap w-42 h-15 m-2 flex justify-center rounded-xl">
        <div className="flex flex-col justify-center">
          <h1 className="text-xl">{task_name}</h1>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
