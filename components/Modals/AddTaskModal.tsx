import React, { useState } from "react";
import Modal from "../Modal";
import { MdOutlineFileUpload } from "react-icons/md";

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (task: any) => void;
  onEdit?: (task: any) => void;
  initialData?: any;
  isEditMode?: boolean;
}

const AddTaskModal: React.FC<AddTaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onEdit,
  initialData = {},
  isEditMode = false,
}) => {
  const [nature, setNature] = useState(initialData.nature || "");
  const [description, setDescription] = useState(initialData.description || "");
  const [subTasks, setSubTasks] = useState<string[]>(
    initialData.subTasks || [
      "Database Optimization",
      "Payment Pending",
      "Follow Up",
    ]
  );
  const [comments, setComments] = useState(initialData.comments || "");
  const [assignee, setAssignee] = useState(initialData.assignee || "");
  const [assignedBy, setAssignedBy] = useState(initialData.assignedBy || "");
  const [startDate, setStartDate] = useState(initialData.startDate || "");
  const [dueDate, setDueDate] = useState(initialData.dueDate || "");
  const [priority, setPriority] = useState(initialData.priority || "");
  const [dueHours, setDueHours] = useState(initialData.dueHours || 14);
  const [dueMinutes, setDueMinutes] = useState(initialData.dueMinutes || 30);

  const handleAddSubTask = () => {
    setSubTasks([...subTasks, "Lorem Ipsum"]);
  };

  const incrementHours = () => {
    setDueHours((prev: number) => (prev === 23 ? 0 : prev + 1));
  };

  const decrementHours = () => {
    setDueHours((prev: number) => (prev === 0 ? 23 : prev - 1));
  };

  const incrementMinutes = () => {
    setDueMinutes((prev: number) => (prev === 59 ? 0 : prev + 1));
  };

  const decrementMinutes = () => {
    setDueMinutes((prev: number) => (prev === 0 ? 59 : prev - 1));
  };

  const handleSave = () => {
    const task = {
      nature,
      description,
      subTasks,
      comments,
      assignee,
      assignedBy,
      startDate,
      dueDate,
      priority,
      dueHours,
      dueMinutes,
    };

    if (onSave) onSave(task);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tasks"
      size="sm"
      customWidth="w-[1000px]"
      customeHeight="h-[720px]"
    >
      <div className="p-3 -mt-4">
        <div className="flex flex-col md:flex-row gap-6 p-4 rounded-lg border border-gray-200">
          {/* Left Section */}
          <div className="flex-1 bg-white rounded-lg -mt-4 p-4">
            {/* Category */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Category
              </label>
              <select
                className="w-[400px] px-3 py-2 border border-gray-300 rounded-md "
                value={nature}
                onChange={(e) => setNature(e.target.value)}
              >
                <option value="">Select Category</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Category ID
              </label>
              <input
                className="w-[400px] px-3 py-2 border border-gray-300 rounded-md "
                value={nature}
                placeholder="Enter Category ID"
                onChange={(e) => setNature(e.target.value)}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Task Type
              </label>
              <select
                className="w-[400px] px-3 py-2 border border-gray-300 rounded-md "
                value={nature}
                onChange={(e) => setNature(e.target.value)}
              >
                <option value="">Select Task Type</option>
                <option value="">Documents</option>
                <option value="">Finance</option>
                <option value="">Follow Up</option>
                <option value="">Feedback</option>
                <option value="">General</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                className="w-[400px] h-[100px] px-3 py-2 mb-2 border border-gray-300 rounded-md  resize-none min-h-[60px]"
                placeholder="Enter description here..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
              />
            </div>
            <label className="border-2 h-[100px] border-dashed border-gray-300 rounded-xl p-8 text-center bg-[#F9F9F9] hover:border-gray-400 transition-colors cursor-pointer flex flex-col items-center justify-center">
              <div className="flex items-center justify-center gap-2">
                <MdOutlineFileUpload
                  className="text-2xl text-gray-400"
                  size={25}
                />
                <h3 className="text-gray-700 font-medium text-base">
                  Attach File
                </h3>
              </div>

              <p className="text-gray-500 text-sm mt-1">
                Drag and drop files here
              </p>
              <input type="file" className="hidden" />
            </label>
          </div>

          {/* Right Section */}
          <div className="w-[600px] h-[498px] bg-[#F9F9F9] rounded-lg p-4 flex flex-col gap-4">
            {/* Priority */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Priority
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md "
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="">Select Priority</option>
              </select>
            </div>
            {/* Assigned To */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Assigned To
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md "
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
              >
                <option value="">Select Assignee</option>
              </select>
            </div>
            {/* Assigned By */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Assigned By
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md "
                value={assignedBy}
                onChange={(e) => setAssignedBy(e.target.value)}
              >
                <option value="">Select Assigned by</option>
              </select>
            </div>
            {/* Due Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Due Date
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md "
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            {/* Due Time */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Due Time{" "}
                <span className="text-gray-500 font-normal">(hh:mm)</span>
              </label>
              <div className="flex items-center gap-2">
                {/* Hours */}
                <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-md px-3 py-2">
                  <input
                    type="text"
                    value={dueHours.toString().padStart(2, "0")}
                    readOnly
                    className="w-8 text-center font-medium text-gray-700 bg-transparent outline-none"
                  />
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={incrementHours}
                      className="p-0.5 hover:bg-gray-100 rounded transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="18 15 12 9 6 15"></polyline>
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={decrementHours}
                      className="p-0.5 hover:bg-gray-100 rounded transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Colon Separator */}
                <span className="text-xl font-semibold text-gray-700">:</span>

                {/* Minutes */}
                <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-md px-3 py-2">
                  <input
                    type="text"
                    value={dueMinutes.toString().padStart(2, "0")}
                    readOnly
                    className="w-8 text-center font-medium text-gray-700 bg-transparent outline-none"
                  />
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={incrementMinutes}
                      className="p-0.5 hover:bg-gray-100 rounded transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="18 15 12 9 6 15"></polyline>
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={decrementMinutes}
                      className="p-0.5 hover:bg-gray-100 rounded transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end mt-4 mr-2">
          <button
            type="button"
            className="flex items-center gap-1 px-4 py-2 bg-green-900 text-white rounded-md hover:bg-green-800 transition"
            onClick={handleSave}
          >
            Save Details
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AddTaskModal;
