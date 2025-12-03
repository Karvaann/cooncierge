import React, { useState, useRef, useEffect } from "react";
import Modal from "../Modal";
import { MdOutlineFileUpload } from "react-icons/md";
import { MdKeyboardArrowUp } from "react-icons/md";
import { MdKeyboardArrowDown } from "react-icons/md";
import { IoMdClose } from "react-icons/io";
import { createLog, updateLog } from "@/services/logsApi";
import { getTeams } from "@/services/teamsApi";
import { getAuthUser } from "@/services/storage/authStorage";

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (task: any) => void;
  onEdit?: (task: any) => void;
  initialData?: any;
  isEditMode?: boolean;
  bookingId?: string; // booking against which task is created
}

const AddTaskModal: React.FC<AddTaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onEdit,
  initialData = {},
  isEditMode = false,
  bookingId,
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
  const [taskType, setTaskType] = useState(initialData.taskType || "");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]); // team member IDs
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [teams, setTeams] = useState<any[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [teamsError, setTeamsError] = useState<string | null>(null);
  const [editWarning, setEditWarning] = useState<string | null>(null);

  const toggleAssignee = (teamId: string) => {
    setSelectedAssignees((prev) =>
      prev.includes(teamId)
        ? prev.filter((item) => item !== teamId)
        : [...prev, teamId]
    );
  };

  const getTeamName = (id: string) =>
    teams.find((t) => t._id === id)?.name || id;

  // Reset when closing
  useEffect(() => {
    if (!isOpen) {
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

  // Prefill fields when opening in edit mode
  useEffect(() => {
    if (!isOpen || !isEditMode) return;

    const t = initialData || {};
    const category: string = t.category || "General";
    const subCategory: string = t.subCategory || "General";

    const mapNatureFromCat = () => {
      if (category === "Bookings" && subCategory === "OS") return "bookings-os";
      if (category === "Bookings" && subCategory === "Limitless")
        return "bookings-limitless";
      if (category === "Directory" && subCategory === "Customers")
        return "directory-customers";
      if (category === "Directory" && subCategory === "Vendors")
        return "directory-vendors";
      if (category === "Directory" && subCategory === "Team")
        return "directory-team";
      return "general";
    };

    setNature(mapNatureFromCat());
    setComments(t.activity || t.description || "");
    setPriority(t.priority || "");
    setTaskType(t.taskType || "");

    const dueISO: string | undefined = t.dueDate || t.dueISO;
    if (dueISO) {
      const d = new Date(dueISO);
      if (!isNaN(d.getTime())) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        setStartDate(`${yyyy}-${mm}-${dd}`);
        setDueHours(d.getHours());
        setDueMinutes(d.getMinutes());
      }
    }

    const rawAssigned = Array.isArray(t.assignedTo) ? t.assignedTo : [];
    const toId = (v: any) => (typeof v === "string" ? v : v?._id);
    const ids = rawAssigned
      .map(toId)
      .filter(
        (id: any): id is string =>
          typeof id === "string" && /^[a-fA-F0-9]{24}$/.test(id)
      );
    // de-dupe to avoid duplicate keys and selections
    setSelectedAssignees(Array.from(new Set(ids)));
  }, [isOpen, isEditMode, initialData]);

  // Fetch team members when modal opens
  useEffect(() => {
    if (!isOpen) return;
    const fetchTeams = async () => {
      try {
        setLoadingTeams(true);
        setTeamsError(null);
        const resp = await getTeams();
        const list = Array.isArray(resp) ? resp : resp?.teams || [];
        setTeams(list);
      } catch (e: any) {
        setTeamsError(e?.message || "Failed to load team members");
      } finally {
        setLoadingTeams(false);
      }
    };
    fetchTeams();
  }, [isOpen]);

  const mapCategory = (value: string) => {
    switch (value) {
      case "bookings-os":
        return { category: "Bookings", subCategory: "OS" };

      case "bookings-limitless":
        return { category: "Bookings", subCategory: "Limitless" };

      case "directory-customers":
        return { category: "Directory", subCategory: "Customers" };

      case "directory-vendors":
        return { category: "Directory", subCategory: "Vendors" };

      case "directory-team":
        return { category: "Directory", subCategory: "Team" };

      case "general":
      default:
        return { category: "General", subCategory: "General" };
    }
  };

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

  const handleSave = async () => {
    try {
      const user = getAuthUser() as any;

      const { category, subCategory } = mapCategory(nature);

      // Basic validations aligned with backend requirements
      if (!nature) {
        console.error("Validation: Category is required");
        return;
      }
      if (!priority) {
        console.error("Validation: Priority is required");
        return;
      }
      if (!taskType) {
        console.error("Validation: Task Type is required");
        return;
      }
      if (!startDate) {
        console.error("Validation: Due Date is required");
        return;
      }
      if (!selectedAssignees.length) {
        console.error("Validation: At least one assignee is required");
        return;
      }

      // Convert due date + due time → ISO
      let finalDueDate = null;
      if (startDate) {
        const due = new Date(startDate);
        due.setHours(dueHours);
        due.setMinutes(dueMinutes);
        due.setSeconds(0);
        finalDueDate = due.toISOString();
      }

      // Validate ObjectId-like strings (24 hex chars)
      const isObjectId = (v: unknown) =>
        typeof v === "string" && /^[a-fA-F0-9]{24}$/.test(v);
      const validAssignees = selectedAssignees.filter((id) => isObjectId(id));
      const bookingObjectId = isObjectId(bookingId) ? bookingId : undefined;

      // Use the first selected assignee as the primary `userId` (Logs.userId ref: Team)
      const primaryAssignee = selectedAssignees[0];
      if (!isObjectId(primaryAssignee)) {
        console.error("Primary assignee is not a valid Team ID");
        return;
      }

      // Temporary mapping (fix later)
      const logData = {
        activity: comments || description || "No Description",
        userId: primaryAssignee,
        status: "Pending",
        dateTime: new Date().toISOString(),
        // assignedBy will be set on backend from token (req.user)
        priority: priority || "Medium",
        taskType: taskType || "General",
        dueDate: finalDueDate || new Date().toISOString(),
        category,
        subCategory,
        bookingId: bookingObjectId,
        assignedTo: validAssignees,
      };

      const maybeId = (initialData as any)?._id as string | undefined;
      const isValidId =
        typeof maybeId === "string" && /^[a-fA-F0-9]{24}$/.test(maybeId);
      setEditWarning(null);
      if (isEditMode && isValidId) {
        const updates = { ...logData, logs: [] };
        console.log("Updating Log:", { id: maybeId, updates });
        try {
          const updated = await updateLog(maybeId, updates);
          onEdit?.(updated);
        } catch (e: any) {
          const msg =
            e?.message || e?.data?.message || e?.response?.data?.message;
          if (e?.response?.status === 404 || msg === "Log not found") {
            setEditWarning(
              "Selected task could not be found. Please verify and try again."
            );
            return; // Do not create silently
          }
          setEditWarning(msg || "Failed to update the task.");
          return;
        }
      } else {
        if (isEditMode && !isValidId) {
          setEditWarning(
            "This task cannot be edited because its ID is invalid."
          );
          return; // Stop instead of creating
        }
        console.log("Creating Log with:", logData);
        await createLog(logData);
        onSave?.(logData);
      }

      onClose();
    } catch (err: any) {
      const backendMsg =
        err?.response?.data?.message ||
        err?.message ||
        err?.error ||
        err?.data?.message;
      console.error("Failed to create task:", backendMsg || err);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tasks"
      size="sm"
      customWidth="w-[50vw]"
      customeHeight="h-fit"
    >
      <div className="p-2 -mt-2">
        <div className="flex flex-col md:flex-row gap-4 p-3 rounded-lg border border-gray-200">
          {/* Left Section */}
          <div className="flex-1 bg-white rounded-lg p-3 w-[50%] flex flex-col gap-4">
            {/* Category */}
            <div className="mb-3">
              <label className="block text-[0.75rem] text-gray-700 mb-1">
                Category
              </label>
              <select
                className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-[0.75rem]"
                value={nature}
                onChange={(e) => setNature(e.target.value)}
              >
                <option value="">Select Category</option>
                <option value="bookings-os">Bookings - OS</option>
                <option value="bookings-limitless">
                  Bookings - Limitless Category
                </option>
                <option value="directory-customers">
                  Directory - Customers
                </option>
                <option value="directory-vendors">Directory - Vendors</option>
                <option value="directory-team">Directory - Team</option>
                <option value="general">General</option>
              </select>
            </div>

            {/* Category ID */}
            <div className="mb-3">
              <label className="block text-[0.75rem] text-gray-700 mb-1">
                Category ID
              </label>
              <input
                className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-[0.75rem]"
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
                className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-[0.75rem]"
                value={taskType}
                onChange={(e) => setTaskType(e.target.value)}
              >
                <option value="">Select Task Type</option>
                <option value="Documents">Documents</option>
                <option value="Finance">Finance</option>
                <option value="Follow up">Follow up</option>
                <option value="Feedback">Feedback</option>
                <option value="General">General</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-[0.75rem] text-gray-700 mb-1">
                Description
              </label>
              <textarea
                className="w-full h-[4.8rem] px-2 py-1.5 border border-gray-300 rounded-md text-[0.75rem] resize-none"
                placeholder="Enter description here..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
              />
            </div>

            {/* File Upload Box */}
            {/* <label className="border-2 mt-3 border-dashed border-gray-300 rounded-md p-4 text-center bg-[#F9F9F9] hover:border-gray-400 transition-colors cursor-pointer flex flex-col items-center justify-center">
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
            </label> */}
          </div>

          {/* Right Section */}
          <div className="w-[50%] h-fit bg-[#F9F9F9] rounded-lg p-3 flex flex-col gap-3">
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
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            {/* Assigned To */}
            <div className="relative" ref={dropdownRef}>
              <label className="block text-[0.75rem] text-gray-700 mb-1">
                Assigned To
              </label>

              <div
                className="w-full border border-gray-300 rounded-md px-2 py-1.5 min-h-[2.2rem] flex items-center flex-wrap gap-1 cursor-pointer relative"
                onClick={() => setDropdownOpen((prev) => !prev)}
              >
                {selectedAssignees.length > 0 ? (
                  selectedAssignees.map((id) => (
                    <span
                      key={id}
                      className="flex items-center gap-1 bg-white border border-gray-200 text-black px-2 py-0.5 rounded-full text-[0.65rem]"
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleAssignee(id);
                        }}
                      >
                        <IoMdClose size={12} />
                      </button>
                      {getTeamName(id)}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-400 text-[0.65rem] flex items-center w-full">
                    {loadingTeams
                      ? "Loading team members..."
                      : "Select Assignee"}
                    <MdKeyboardArrowDown className="ml-auto text-gray-400 pointer-events-none" />
                  </span>
                )}
                {selectedAssignees.length > 0 && (
                  <MdKeyboardArrowDown className="absolute right-2 top-2 text-gray-400" />
                )}
              </div>

              {dropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto">
                  {teamsError && (
                    <div className="px-2 py-2 text-red-600 text-[0.65rem]">
                      {teamsError}
                    </div>
                  )}
                  {teams.map((team, idx) => {
                    const checked = selectedAssignees.includes(team._id);
                    return (
                      <div
                        key={team._id}
                        onClick={() => toggleAssignee(team._id)}
                        className={`flex items-center gap-2 px-2 py-2 hover:bg-gray-50 cursor-pointer border-b ${
                          idx === teams.length - 1
                            ? "border-b-0"
                            : "border-gray-100"
                        }`}
                      >
                        <div className="w-4 h-4 border border-gray-400 rounded-md flex items-center justify-center">
                          {checked && (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="12"
                              height="11"
                              viewBox="0 0 12 11"
                              fill="none"
                            >
                              <path
                                d="M0.75 5.5L4.49268 9.25L10.4927 0.75"
                                stroke="#0D4B37"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                              />
                            </svg>
                          )}
                        </div>
                        <span className="text-gray-700 text-[0.75rem]">
                          {team.name}
                        </span>
                      </div>
                    );
                  })}
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
                  <div className="flex flex-col border border-black rounded-sm overflow-hidden">
                    <button
                      onClick={incrementHours}
                      className="p-0.5 border-b border-black"
                    >
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
                  <div className="flex flex-col border border-black rounded-sm overflow-hidden">
                    <button
                      onClick={incrementMinutes}
                      className="p-0.5 border-b border-black"
                    >
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
        <div className="flex items-center justify-end gap-3 mt-2 mr-2">
          {editWarning && (
            <span className="text-[0.7rem] text-orange-600">{editWarning}</span>
          )}
          <button
            type="button"
            className="px-4 py-1.5 bg-green-900 text-white text-[0.75rem] rounded-md hover:bg-green-800 transition"
            onClick={handleSave}
          >
            {isEditMode ? "Save Changes" : "Create Task"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AddTaskModal;
