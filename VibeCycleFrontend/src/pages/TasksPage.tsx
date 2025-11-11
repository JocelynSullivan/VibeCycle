import React from "react";
import Tasks from "../components/Tasks";

const TasksPage: React.FC = () => {
  return (
    <div className="bg-black h-full">
      <div className="flex justify-center pt-7">
        <p className="text-gray-400 text-lg px-60">Enter your tasks here</p>
      </div>
      <div className="flex justify-center">
        <Tasks />
      </div>
    </div>
  );
};

export default TasksPage;
