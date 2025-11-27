import React from "react";
import { TbClipboardText } from "react-icons/tb";
import DayWiseTaskModal from "./Modals/TaskModals/DayWiseTaskModal";

const TaskButton = ({ count }: { count: number }) => {
  const [isDayWiseModalOpen, setIsDayWiseModalOpen] = React.useState(false);

  // const handleOpenModal = () => {
  //   setIsDayWiseModalOpen(true);
  // };
  return (
    <div className="relative flex items-center justify-center">
      {/* Button box */}
      <button
        // onClick={handleOpenModal}
        className="p-1.5 border border-gray-300 rounded-md bg-white hover:bg-gray-100 transition-colors"
        type="button"
      >
        <TbClipboardText className="w-4 h-4 text-[#A5732A]" />
      </button>

      {/* Red badge */}
      <span
        className="
          absolute -top-2 -right-2 
          bg-red-500 text-white 
          text-[0.65rem] font-semibold 
          rounded-full w-5 h-5 
          flex items-center justify-center shadow
        "
      >
        {count}
      </span>
      <DayWiseTaskModal
        isOpen={isDayWiseModalOpen}
        onClose={() => setIsDayWiseModalOpen(false)}
      />
    </div>
  );
};

export default TaskButton;
