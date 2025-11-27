import React, { useState, useRef, useEffect } from "react";
import Modal from "../Modal";
import { MdOutlineFileUpload } from "react-icons/md";
import { MdKeyboardArrowUp } from "react-icons/md";
import { MdKeyboardArrowDown } from "react-icons/md";
import { IoMdClose } from "react-icons/io";
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

  const [assignedBy, setAssignedBy] = useState(initialData.assignedBy || "");
  const [startDate, setStartDate] = useState(initialData.startDate || "");
  const [dueDate, setDueDate] = useState(initialData.dueDate || "");
  const [priority, setPriority] = useState(initialData.priority || "");
  const [dueHours, setDueHours] = useState(initialData.dueHours || 14);
  const [dueMinutes, setDueMinutes] = useState(initialData.dueMinutes || 30);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const assignees = ["John Doe", "Jane Smith", "Alex Johnson", "Emma Brown"];

  const toggleAssignee = (assignee: string) => {
    setSelectedAssignees((prev) =>
      prev.includes(assignee)
        ? prev.filter((item) => item !== assignee)
        : [...prev, assignee]
    );
  };

  useEffect(() => {
    if (!isOpen) {
      // Reset form fields when modal is closed

      setDescription("");

      setComments("");
      setAssignedBy("");
      setStartDate("");
      setDueDate("");
      setPriority("");
      setDueHours(14);
      setDueMinutes(30);
      setSelectedAssignees([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      customWidth="w-[55vw]"
      customeHeight="h-[75vh]"
    >
      <div className="p-2 -mt-2">
        <div className="flex flex-col md:flex-row gap-4 p-3 rounded-lg border border-gray-200">
          {/* Left Section */}
          <div className="flex-1 bg-white rounded-lg p-3">
            {/* Category */}
            <div className="mb-3">
              <label className="block text-[0.75rem] text-gray-700 mb-1">
                Category
              </label>
              <select
                className="w-[18rem] px-2 py-1.5 border border-gray-300 rounded-md text-[0.75rem]"
                value={nature}
                onChange={(e) => setNature(e.target.value)}
              >
                <option value="">Select Category</option>
                <option value="">Bookings - OS</option>
                <option value="">Bookings - Limitless Category</option>
                <option value="">Directory - Customers</option>
                <option value="">Directory - Vendors</option>
                <option value="">Directory - Team</option>
                <option value="">General</option>
              </select>
            </div>

            {/* Category ID */}
            <div className="mb-3">
              <label className="block text-[0.75rem] text-gray-700 mb-1">
                Category ID
              </label>
              <input
                className="w-[18rem] px-2 py-1.5 border border-gray-300 rounded-md text-[0.75rem]"
                placeholder="Enter Category ID"
                value={nature}
                onChange={(e) => setNature(e.target.value)}
              />
            </div>

            {/* Task Type */}
            <div className="mb-3">
              <label className="block text-[0.75rem] text-gray-700 mb-1">
                Task Type
              </label>
              <select
                className="w-[18rem] px-2 py-1.5 border border-gray-300 rounded-md text-[0.75rem]"
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
              <label className="block text-[0.75rem] text-gray-700 mb-1">
                Description
              </label>
              <textarea
                className="w-[18rem] h-[5rem] px-2 py-1.5 border border-gray-300 rounded-md text-[0.75rem] resize-none"
                placeholder="Enter description here..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
              />
            </div>

            {/* File Upload Box */}
            <label className="border-2 mt-3 border-dashed border-gray-300 rounded-md p-4 text-center bg-[#F9F9F9] hover:border-gray-400 transition-colors cursor-pointer flex flex-col items-center justify-center">
              <div className="flex items-center gap-1">
                <MdOutlineFileUpload className="text-gray-400" size={20} />
                <h3 className="text-gray-700 text-[0.75rem] font-medium">
                  Attach File
                </h3>
              </div>

              <p className="text-gray-500 text-[0.65rem] mt-1">
                Drag and drop files here
              </p>

              <input type="file" className="hidden" />
            </label>
          </div>

          {/* Right Section */}
          <div className="w-[27vw] bg-[#F9F9F9] rounded-lg p-3 flex flex-col gap-3">
            {/* Priority */}
            <div>
              <label className="block text-[0.75rem] text-gray-700 mb-1">
                Priority
              </label>
              <select
                className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-[0.75rem]"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="">Select Priority</option>
                <option value="">High</option>
                <option value="">Medium</option>
                <option value="">Low</option>
              </select>
            </div>

            {/* Assigned To */}
            <div className="relative">
              <label className="block text-[0.75rem] text-gray-700 mb-1">
                Assigned To
              </label>

              <div
                className="w-full border border-gray-300 rounded-md px-2 py-1.5 min-h-[2.2rem] flex items-center flex-wrap gap-1 cursor-pointer"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                {selectedAssignees.length > 0 ? (
                  selectedAssignees.map((name) => (
                    <span
                      key={name}
                      className="flex items-center gap-1 bg-white border border-gray-200 text-black px-2 py-0.5 rounded-full text-[0.65rem]"
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleAssignee(name);
                        }}
                      >
                        <IoMdClose size={12} />
                      </button>
                      {name}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-400 text-[0.65rem]">
                    Select Assignee
                  </span>
                )}
              </div>

              {dropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto">
                  {assignees.map((assignee) => (
                    <label
                      key={assignee}
                      className="flex items-center gap-2 px-2 py-1 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedAssignees.includes(assignee)}
                        onChange={() => toggleAssignee(assignee)}
                        className="accent-emerald-600"
                      />
                      <span className="text-gray-700 text-[0.75rem]">
                        {assignee}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Assigned By */}
            <div>
              <label className="block text-[0.75rem] text-gray-700 mb-1">
                Assigned By
              </label>
              <select
                className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-[0.75rem]"
                value={assignedBy}
                onChange={(e) => setAssignedBy(e.target.value)}
              >
                <option value="">Select Assigned by</option>
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-[0.75rem] text-gray-700 mb-1">
                Due Date
              </label>
              <input
                type="date"
                className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-[0.75rem]"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            {/* Due Time */}
            <div>
              <label className="block text-[0.75rem] text-gray-700 mb-1">
                Due Time <span className="text-gray-500">(hh:mm)</span>
              </label>

              <div className="flex items-center gap-2">
                {/* Hours */}
                <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-md px-2 py-1">
                  <input
                    type="text"
                    value={dueHours.toString().padStart(2, "0")}
                    readOnly
                    className="w-5 text-center text-[0.75rem] bg-transparent outline-none"
                  />
                  <div className="flex flex-col">
                    <button onClick={incrementHours} className="p-0.5">
                      <MdKeyboardArrowUp size={14} />
                    </button>
                    <button onClick={decrementHours} className="p-0.5">
                      <MdKeyboardArrowDown size={14} />
                    </button>
                  </div>
                </div>

                <span className="text-[1rem] font-semibold text-gray-700">
                  :
                </span>

                {/* Minutes */}
                <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-md px-2 py-1">
                  <input
                    type="text"
                    value={dueMinutes.toString().padStart(2, "0")}
                    readOnly
                    className="w-5 text-center text-[0.75rem] bg-transparent outline-none"
                  />
                  <div className="flex flex-col">
                    <button onClick={incrementMinutes} className="p-0.5">
                      <MdKeyboardArrowUp size={14} />
                    </button>
                    <button onClick={decrementMinutes} className="p-0.5">
                      <MdKeyboardArrowDown size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end mt-2 mr-2">
          <button
            type="button"
            className="px-4 py-1.5 bg-green-900 text-white text-[0.75rem] rounded-md hover:bg-green-800 transition"
            onClick={handleSave}
          >
            Create Task
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AddTaskModal;
