import React, { useRef, useEffect } from "react";
import { MdOutlineFileUpload } from "react-icons/md";
import FileUploadModal from "../Modals/FileUploadModal";
import { TbClick } from "react-icons/tb";

type SelectUploadMenuProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: () => void;
  entity?: "customer" | "vendor" | "team";
  /** When provided, click-outside detection includes the trigger button wrapper */
  rootRef?: React.RefObject<HTMLDivElement | null>;
};

const SelectUploadMenu: React.FC<SelectUploadMenuProps> = ({
  isOpen,
  onClose,
  onSelect,
  entity = "customer",
  rootRef,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [isFileUploadModalOpen, setIsFileUploadModalOpen] =
    React.useState(false);
  const isAnchored = Boolean(rootRef);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const container = rootRef?.current ?? menuRef.current;
      if (container && !container.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose, rootRef]);

  const handleUploadClick = () => {
    setIsFileUploadModalOpen(true);
    onClose();
  };

  const handleSelectClick = () => {
    if (onSelect) onSelect();
    onClose();
  };

  const panelClassName = isAnchored
    ? `absolute left-0 top-full z-50 w-full min-w-[9.5rem] overflow-hidden border border-[#7135AD66] bg-white py-1 shadow-[0_4px_16px_rgba(0,0,0,0.08)] rounded-b-[14px] rounded-t-none border-t-0`
    : "absolute right-10 -mt-4 -translate-y-1/2 bg-white border border-gray-300 rounded-md shadow-xl w-[5.3rem] h-[3.3rem] z-50";

  const itemClassName = isAnchored
    ? "flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] font-medium text-[#414141] transition-colors hover:bg-[#FAFAFA]"
    : "w-full flex items-center gap-1.5 px-2 py-1 hover:bg-gray-50 transition-colors text-left";

  const dividerClassName = isAnchored
    ? "border-t border-[#7135AD66]/40"
    : "border border-gray-100";

  if (isAnchored) {
    return (
      <>
        {isOpen && (
          <div ref={menuRef} className={panelClassName}>
            <button type="button" onClick={handleSelectClick} className={itemClassName}>
              <TbClick size={16} className="shrink-0 text-[#818181]" />
              <span>Select</span>
            </button>

            <hr className={dividerClassName} />

            <button
              type="button"
              onClick={handleUploadClick}
              className={itemClassName}
            >
              <MdOutlineFileUpload size={16} className="shrink-0 text-[#818181]" />
              <span>Upload</span>
            </button>
          </div>
        )}
        <FileUploadModal
          isOpen={isFileUploadModalOpen}
          onClose={() => setIsFileUploadModalOpen(false)}
          entity={entity}
        />
      </>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      {isOpen && (
        <div className={panelClassName}>
          <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-t border-r border-gray-300 rotate-45" />

          <button type="button" onClick={handleSelectClick} className={itemClassName}>
            <TbClick size={16} className="text-gray-800" />
            <span className="text-gray-800 text-[0.72rem] font-medium">Select</span>
          </button>

          <hr className={dividerClassName} />

          <button
            type="button"
            onClick={handleUploadClick}
            className={`${itemClassName} mb-1 gap-1`}
          >
            <MdOutlineFileUpload size={16} className="text-[#5856D6]" />
            <span className="text-[#5856D6] text-[0.70rem] font-medium">Upload</span>
          </button>
        </div>
      )}
      <FileUploadModal
        isOpen={isFileUploadModalOpen}
        onClose={() => setIsFileUploadModalOpen(false)}
        entity={entity}
      />
    </div>
  );
};

export default SelectUploadMenu;
