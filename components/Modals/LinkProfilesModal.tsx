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
      <div className="space-y-4 px-3 py-2">
        {/* Subtitle */}
        <p className="text-gray-500 text-center text-[0.75rem] -mt-4">
          Link one profile with another here
        </p>

        {/* Divider */}
        <div className="border-t border-gray-200"></div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
          {/* Left Profile */}
          <div className="space-y-3 mr-2">
            {/* Profile Type */}
            <div>
              <label className="block text-gray-700 font-medium text-[0.75rem] mb-1">
                Profile Type
              </label>
              <div className="relative">
                <select
                  value={leftProfileType}
                  onChange={(e) => setLeftProfileType(e.target.value)}
                  className="w-[12rem] px-3 py-1.5 border border-gray-300 rounded-md bg-white appearance-none text-[0.75rem] text-gray-600 focus:outline-none focus:ring-1 focus:ring-green-500"
                >
                  <option value="">Select Profile Type</option>
                  <option value="user">User</option>
                  <option value="business">Business</option>
                  <option value="organization">Organization</option>
                </select>

                {/* Arrow */}
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                  <svg
                    className="w-3 h-3 text-gray-400"
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
              <label className="block text-gray-700 font-medium text-[0.75rem] mb-1">
                Name/ID
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={leftNameId}
                  onChange={(e) => setLeftNameId(e.target.value)}
                  placeholder="Enter Name/ID/Nickname"
                  className="w-[12rem] px-3 py-1.5 pr-10 border border-gray-300 rounded-md text-[0.75rem] text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
                <button className="absolute inset-y-0 right-2 flex items-center text-gray-400 hover:text-gray-600">
                  <FiSearch className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Copy Icon Divider */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
          >
            <div className="flex flex-col items-center">
              <div className="w-px h-10 bg-gray-300 mb-1"></div>
              <FiCopy className="w-4 h-4 text-gray-500" />
              <div className="w-px h-10 bg-gray-300 mt-1"></div>
            </div>
          </div>

          {/* Right Profile */}
          <div className="space-y-3 ml-2">
            {/* Profile Type */}
            <div>
              <label className="block text-gray-700 font-medium text-[0.75rem] mb-1">
                Profile Type
              </label>
              <div className="relative">
                <select
                  value={rightProfileType}
                  onChange={(e) => setRightProfileType(e.target.value)}
                  className="w-[12rem] px-3 py-1.5 border border-gray-300 rounded-md appearance-none bg-white text-[0.75rem] text-gray-600 focus:outline-none focus:ring-1 focus:ring-green-500"
                >
                  <option value="">Select Profile Type</option>
                  <option value="user">User</option>
                  <option value="business">Business</option>
                  <option value="organization">Organization</option>
                </select>

                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                  <svg
                    className="w-3 h-3 text-gray-400"
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
              <label className="block text-gray-700 font-medium text-[0.75rem] mb-1">
                Name/ID
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={rightNameId}
                  onChange={(e) => setRightNameId(e.target.value)}
                  placeholder="Enter Name/ID/Nickname"
                  className="w-[12rem] px-3 py-1.5 pr-10 border border-gray-300 rounded-md text-[0.75rem] text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
                <button className="absolute inset-y-0 right-2 flex items-center text-gray-400 hover:text-gray-600">
                  <FiSearch className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Link Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={handleLink}
            className="px-4 py-1.5 bg-[#0D4B37] hover:bg-[#093C2C] text-white text-[0.75rem] font-medium rounded-md transition-colors"
          >
            Link Profiles
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default LinkProfilesModal;
