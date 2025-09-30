interface RoutineTimeButtonProps {
  time: string;
  isSelected: boolean;
  onClick: () => void;
}

const RoutineTimeButton: React.FC<RoutineTimeButtonProps> = ({ time, isSelected, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`w-45 h-12 rounded-4xl ${
        isSelected ? "bg-cyan-700 text-white" : "bg-gray-400 text-gray-800"
      } hover:bg-blue-100 transition`}
    >
      {time}
    </button>
  );
};

export default RoutineTimeButton;
