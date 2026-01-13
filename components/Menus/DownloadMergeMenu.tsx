import React, { useRef, useEffect, useCallback, useState } from "react";
import { FiDownload, FiTrash2 } from "react-icons/fi";
import { TbLayersIntersect } from "react-icons/tb";
import DownloadModal from "../Modals/DownloadModal";
import MergeModal from "../Modals/MergeModal";
import DeleteModal, { DeletableItem } from "../Modals/DeleteModal";

type DownloadMergeMenuProps = {
  isOpen: boolean;
  onClose: () => void;
  entity?: "customer" | "vendor" | "team" | "traveller";
  items?: DeletableItem[];
  callback: () => void;
};

const DownloadMergeMenu: React.FC<DownloadMergeMenuProps> = ({
  isOpen,
  onClose,
  entity = "customer",
  items = [],
  callback,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = React.useState(false);
  const [isMergeModalOpen, setIsMergeModalOpen] = React.useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const containerClass = `absolute right-10 -mt-4 -translate-y-1/2 bg-white border border-gray-300 rounded-md shadow-xl w-[5.8rem] ${
    entity === "team" ? "h-auto py-1" : "h-[4.8rem]"
  } z-50`;

  const handleMergeClick = () => {
    setIsMergeModalOpen(true);
  };

  const handleDownloadClick = () => {
    setIsDownloadModalOpen(true);
  };

  const handleEscape = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (isMergeModalOpen || isDownloadModalOpen || isDeleteModalOpen) {
          return;
        }
        onClose();
      }
    },
    [isDeleteModalOpen, isDownloadModalOpen, isMergeModalOpen, onClose]
  );

  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      const menuEl = menuRef.current;

      // if menu ref doesn't exist or click is inside it, do nothing
      if (!menuEl || menuEl.contains(event.target as Node)) return;

      if (isMergeModalOpen || isDownloadModalOpen || isDeleteModalOpen) {
        return;
      }

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
    [isDeleteModalOpen, isDownloadModalOpen, isMergeModalOpen, onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.addEventListener("mousedown", handleClickOutside);

      return () => {
        document.removeEventListener("keydown", handleEscape);
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
    return;
  }, [isOpen, handleEscape, handleClickOutside]);
  if (!isOpen) return null;

  return (
    <>
      <div ref={menuRef} className={containerClass}>
        {/* Arrow Tail */}
        <div
          className="absolute -right-2 top-1/2 -translate-y-1/2 
                 w-3 h-3 bg-white border-t border-r border-gray-300 
                 rotate-45"
        ></div>

        {/* Menu Items */}
        <button
          onClick={handleDownloadClick}
          className="w-full flex items-center gap-1 px-3 py-1 hover:bg-gray-50 transition-colors text-left"
        >
          <div className="flex items-center justify-center">
            <FiDownload size={14} className="text-blue-600" />
          </div>
          <span className="text-blue-600 text-[0.65rem] font-medium">
            Download
          </span>
        </button>

        {entity === "team" ? (
          <hr className="border border-gray-100" />
        ) : (
          <>
            <hr className="border border-gray-100" />

            <button
              onClick={handleMergeClick}
              className="w-full flex items-center gap-1 px-3 py-1 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex items-center justify-center">
                <TbLayersIntersect size={14} className="text-[#818181]" />
              </div>
              <span className="text-[#818181] text-[0.65rem] font-medium">
                Merge
              </span>
            </button>

            <hr className="border border-gray-100" />
          </>
        )}

        <button
          onClick={() => setIsDeleteModalOpen(true)}
          className="w-full flex items-center gap-1 px-3 py-1 hover:bg-gray-50 transition-colors text-left"
        >
          <div className="flex items-center justify-center">
            <FiTrash2 size={14} className="text-red-600" />
          </div>
          <span className="text-red-600 text-[0.65rem] font-medium">
            Delete
          </span>
        </button>
      </div>

      {/* Modals */}
      <MergeModal
        isOpen={isMergeModalOpen}
        onClose={() => setIsMergeModalOpen(false)}
        items={items}
        mode={entity as "customer" | "vendor"}
      />
      <DownloadModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        items={items}
        entity={entity}
      />
      {isDeleteModalOpen && (
        <DeleteModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            callback();
            setIsDeleteModalOpen(false);
          }}
          items={items}
          entity={entity}
        />
      )}
    </>
  );
};

export default DownloadMergeMenu;
