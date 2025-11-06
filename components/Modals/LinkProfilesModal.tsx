import React, { useState } from "react";
import { FiSearch, FiCopy } from "react-icons/fi";
import Modal from "../Modal"; // Adjust the import path as needed

interface LinkProfilesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LinkProfilesModal: React.FC<LinkProfilesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [leftProfileType, setLeftProfileType] = useState("");
  const [rightProfileType, setRightProfileType] = useState("");
  const [leftNameId, setLeftNameId] = useState("");
  const [rightNameId, setRightNameId] = useState("");

  const handleLink = () => {
    // Handle Link logic here
    console.log("Linking profiles:", {
      left: { type: leftProfileType, nameId: leftNameId },
      right: { type: rightProfileType, nameId: rightNameId },
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Link Profiles"
      size="lg"
      customWidth="w-[700px]"
      showCloseButton={true}
    >
      <div className="space-y-6 px-3 py-2">
        {/* Subtitle */}
        <p className="text-gray-500 text-center -mt-5">
          Link one profile with another here
        </p>

        {/* Divider */}
        <div className="border-t border-gray-200"></div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
          {/* Left Profile */}
          <div className="space-y-4 mr-3">
            {/* Profile Type */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Profile Type
              </label>
              <div className="relative">
                <select
                  value={leftProfileType}
                  onChange={(e) => setLeftProfileType(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg appearance-none bg-white text-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select Profile Type</option>
                  <option value="user">User</option>
                  <option value="business">Business</option>
                  <option value="organization">Organization</option>
                </select>
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Name/ID */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Name/ID
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={leftNameId}
                  onChange={(e) => setLeftNameId(e.target.value)}
                  placeholder="Enter Name/ID/Nickname"
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-700 placeholder-gray-400"
                />
                <button className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-gray-600">
                  <FiSearch className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Copy Icon in the Middle */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
          >
            <div className=" p-3">
              <div className="w-px h-15 mb-4 ml-2 bg-gray-300"></div>
              <FiCopy className="w-5 h-5 text-gray-500" />
              <div className="w-px h-15 mt-4 ml-2 bg-gray-300"></div>
            </div>
          </div>

          {/* Right Profile */}
          <div className="space-y-4 ml-3">
            {/* Profile Type */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Profile Type
              </label>
              <div className="relative">
                <select
                  value={rightProfileType}
                  onChange={(e) => setRightProfileType(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg appearance-none bg-white text-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select Profile Type</option>
                  <option value="user">User</option>
                  <option value="business">Business</option>
                  <option value="organization">Organization</option>
                </select>
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Name/ID */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Name/ID
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={rightNameId}
                  onChange={(e) => setRightNameId(e.target.value)}
                  placeholder="Enter Name/ID/Nickname"
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-700 placeholder-gray-400"
                />
                <button className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-gray-600">
                  <FiSearch className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Merge Button */}
        <div className="flex justify-end pt-4">
          <button
            onClick={handleLink}
            className="px-8 py-3 bg-[#0D4B37] hover:bg-green-900 text-white font-medium rounded-lg transition-colors duration-200"
          >
            Link Profiles
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default LinkProfilesModal;
