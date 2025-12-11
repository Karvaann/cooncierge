import React, { useRef, useEffect } from "react";
import { MdOutlineFileUpload } from "react-icons/md";
import FileUploadModal from "../Modals/FileUploadModal";
import { TbClick } from "react-icons/tb";

type SelectUploadMenuProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: () => void;
};

const SelectUploadMenu: React.FC<SelectUploadMenuProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [isFileUploadModalOpen, setIsFileUploadModalOpen] =
    React.useState(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  const handleUploadClick = () => {
    setIsFileUploadModalOpen(true);
  };

  const handleSelectClick = () => {
    // ✅ trigger parent to enter select mode and switch menu
    if (onSelect) onSelect();
    onClose(); // ✅ close current menu once
  };

  return (
    <div className="relative" ref={menuRef}>
      {isOpen && (
        <div
          className="absolute right-10 -mt-4 -translate-y-1/2 
                 bg-white border border-gray-300 rounded-md shadow-xl 
                 w-[5.3rem] h-[3.3rem] z-50"
        >
          {/* Arrow Tail */}
          <div
            className="absolute -right-2 top-1/2 -translate-y-1/2 
                      w-3 h-3 bg-white border-t border-r border-gray-300 
                      rotate-45"
          ></div>
          <button
            onClick={handleSelectClick}
            className="w-full flex items-center gap-1.5 px-2 py-1 hover:bg-gray-50 transition-colors text-left"
          >
            <div className="flex items-center justify-center">
              <TbClick size={16} className="text-gray-800" />
            </div>
            <span className="text-gray-800 text-[0.72rem] font-medium">
              Select
            </span>
          </button>

          <hr className="border border-gray-100" />

          <button
            onClick={handleUploadClick}
            className="w-full flex items-center mb-1 gap-1 px-2 py-1 hover:bg-gray-50 transition-colors text-left"
          >
            <div className="flex items-center justify-center">
              <MdOutlineFileUpload size={16} className="text-[#5856D6]" />
            </div>
            <span className="text-[#5856D6] text-[0.70rem] font-medium">
              Upload
            </span>
          </button>
        </div>
      )}
      <FileUploadModal
        isOpen={isFileUploadModalOpen}
        onClose={() => setIsFileUploadModalOpen(false)}
      />
    </div>
  );
};

export default SelectUploadMenu;
