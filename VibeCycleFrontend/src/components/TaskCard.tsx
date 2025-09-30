type TaskCardInfo = {
  task_name: string;
};

const TaskCard: React.FC<TaskCardInfo> = ({ task_name: name }) => {
  return (
    <div className="bg-cyan-900 text-white text-center text-wrap w-42 h-15 m-2 flex justify-center rounded-xl">
      <div className="flex flex-col justify-center">
        <h1 className="text-xl">{name}</h1>
      </div>
    </div>
  );
};

export default TaskCard;
