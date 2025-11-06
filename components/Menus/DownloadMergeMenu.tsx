import React, { useRef, useEffect, useCallback } from "react";
import { FiDownload, FiTrash2 } from "react-icons/fi";
import { FiCopy } from "react-icons/fi";
import DownloadModal from "../Modals/DownloadModal";
import MergeModal from "../Modals/MergeModal";

type DownloadMergeMenuProps = {
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
  onDelete: () => void;
  onMerge?: () => void;
};

const DownloadMergeMenu: React.FC<DownloadMergeMenuProps> = ({
  isOpen,
  onDownload,
  onClose,
  onDelete,
  onMerge,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = React.useState(false);
  const [isMergeModalOpen, setIsMergeModalOpen] = React.useState(false);

  const handleMergeClick = () => {
    setIsMergeModalOpen(true);
  };

  const handleDownloadClick = () => {
    setIsDownloadModalOpen(true);
  };

  const handleEscape = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      const menuEl = menuRef.current;

      // if menu ref doesn't exist or click is inside it, do nothing
      if (!menuEl || menuEl.contains(event.target as Node)) return;

      // check if a modal overlay is active (blocking clicks)
      const activeModal = document.querySelector(
        '[role="dialog"], .fixed.inset-0, .modal-overlay'
      );
      if (activeModal && activeModal.contains(event.target as Node)) {
        // click happened inside a modal, ignore
        return;
      }

      onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", handleEscape);
      document.addEventListener("mousedown", handleClickOutside);

      return () => {
        document.body.style.overflow = "unset";
        document.removeEventListener("keydown", handleEscape);
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
    return;
  }, [isOpen, handleEscape]);
  if (!isOpen) return null;

  return (
    <>
      <div
        ref={menuRef}
        className="absolute right-12 -mt-4 -translate-y-1/2 bg-white border border-gray-200 rounded-xl shadow-xl w-34 z-50"
      >
        {/* Arrow Tail */}
        <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-t border-r border-gray-200 rotate-45"></div>

        {/* Menu Items */}
        <div className="flex flex-col py-2 text-sm">
          <button
            onClick={handleDownloadClick}
            className="flex items-center gap-2 px-3 py-1 hover:bg-gray-50 text-blue-600 font-medium transition-colors"
          >
            <FiDownload className="text-lg" />
            Download
          </button>

          <hr className="mb-1 mt-1 border-t border-gray-200" />

          <button
            onClick={handleMergeClick}
            className="flex items-center gap-2 px-3 py-1 text-gray-400"
          >
            <FiCopy className="w-5 h-5 text-gray-500" />
            Merge
          </button>

          <hr className="mb-1 mt-1 border-t border-gray-200" />

          <button
            onClick={onDelete}
            className="flex items-center gap-2 px-3 py-1 hover:bg-gray-50 text-red-600 font-medium transition-colors"
          >
            <FiTrash2 className="text-lg" />
            Delete
          </button>
        </div>
      </div>

      <MergeModal
        isOpen={isMergeModalOpen}
        onClose={() => setIsMergeModalOpen(false)}
      />
      <DownloadModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
      />
    </>
  );
};

export default DownloadMergeMenu;
