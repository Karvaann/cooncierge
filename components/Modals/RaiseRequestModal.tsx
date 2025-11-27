import React, { useState } from "react";
import Modal from "../Modal";

interface RaiseRequestProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (task: any) => void;
}

const RaiseRequest: React.FC<RaiseRequestProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [requestCategory, setRequestCategory] = useState("");
  const [requestType, setRequestType] = useState("");
  const [teamMembers, setTeamMembers] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = () => {
    const request = {
      requestCategory,
      requestType,
      teamMembers,
      description,
    };
    if (onSave) {
      onSave(request);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Raise Request"
      size="sm"
      customWidth="w-[700px]"
    >
      <div className="px-4 -mt-5 p-2">
        <p className="text-gray-500 text-sm mb-6 text-center">
          Enter your request details in the fields below
        </p>

        {/* Request Category */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            Request Category
          </label>
          <select
            className="w-full px-2 py-3 border border-gray-300 rounded-lg text-gray-500 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            value={requestCategory}
            onChange={(e) => setRequestCategory(e.target.value)}
          >
            <option value="">Select Request Category</option>
            <option value="">User Login & Access</option>
            <option value="">User Profile & Account Settings</option>
            <option value="">Tasks & Assignments</option>
            <option value="">Dashboard</option>
            <option value="">Bookings</option>
            <option value="">Directory</option>
          </select>
        </div>

        {/* Request Type */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            Request Type
          </label>
          <select
            className="w-full px-2 py-3 border border-gray-300 rounded-lg text-gray-500 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            value={requestType}
            onChange={(e) => setRequestType(e.target.value)}
          >
            <option value="">Select Request Type</option>
            <option value="">Unable to log in</option>
            <option value="">Login session expiring automatically</option>
          </select>
        </div>

        {/* Team Members */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            Team Members
          </label>
          <select
            className="w-full px-2 py-3 border border-gray-300 rounded-lg text-gray-500 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            value={teamMembers}
            onChange={(e) => setTeamMembers(e.target.value)}
          >
            <option value="">Select Team Members</option>
            <option value=""> Yash</option>
            <option value=""> Shubham</option>
            <option value=""> Harsh</option>
            <option value=""> Diwakar</option>
          </select>
        </div>

        {/* Description */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            Description
          </label>
          <textarea
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-500 bg-white resize-none min-h-[120px] focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Enter description here..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Note */}
        <div className="mb-6">
          <p className="text-red-600 text-sm text-center">
            <span className="font-semibold">
              Note: Your request will be sent to Cooncierge team for review &
              support.{" "}
            </span>
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center">
          <button
            type="button"
            className="w-full px-6 py-3 bg-green-900 text-white rounded-lg hover:bg-green-800 transition font-medium"
            onClick={handleSubmit}
          >
            Submit
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default RaiseRequest;
