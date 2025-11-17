import React from "react";
import { useNavigate } from "react-router-dom";
import Tasks from "../components/Tasks";

const TasksPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-black h-full">
      <div className="flex items-center justify-start pt-4 px-6">
        <button
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="flex items-center gap-2 text-gray-200 hover:text-white"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18l-6-6 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-sm"></span>
        </button>
      </div>

      <div className="flex justify-center pt-3">
        <p className="text-gray-400 text-lg px-60">Enter your tasks here</p>
      </div>
      <div className="flex justify-center">
        <Tasks />
      </div>
    </div>
  );
};

export default TasksPage;
