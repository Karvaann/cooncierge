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
  rootRef?: React.RefObject<HTMLDivElement | null>;
  /** Floating dropdown under trigger (select mode) vs attached panel */
  menuVariant?: "attached" | "dropdown";
  /** When provided, parent owns the merge modal and receives a snapshot of selected items */
  onMergeClick?: (items: DeletableItem[]) => void;
};

const DownloadMergeMenu: React.FC<DownloadMergeMenuProps> = ({
  isOpen,
  onClose,
  entity = "customer",
  items = [],
  callback,
  rootRef,
  menuVariant = "attached",
  onMergeClick,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = React.useState(false);
  const [isMergeModalOpen, setIsMergeModalOpen] = React.useState(false);
  const [mergeModalItems, setMergeModalItems] = React.useState<DeletableItem[]>(
    [],
  );
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const isDropdown = Boolean(rootRef) && menuVariant === "dropdown";

  const containerClass = isDropdown
    ? "absolute right-0 top-full z-50 mt-2 min-w-[9.5rem] overflow-hidden rounded-[14px] border border-[#E2E1E1] bg-white py-1 shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
    : rootRef
      ? `absolute left-0 top-full z-50 w-full min-w-[9.5rem] overflow-hidden border border-[#7135AD66] bg-white py-1 shadow-[0_4px_16px_rgba(0,0,0,0.08)] rounded-b-[14px] rounded-t-none border-t-0`
      : `absolute right-10 -mt-4 -translate-y-1/2 bg-white border border-gray-300 rounded-md shadow-xl w-[5.8rem] ${
          entity === "team" ? "h-auto py-1" : "h-[4.8rem]"
        } z-50`;

  const itemBaseClass = isDropdown
    ? "flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] font-medium transition-colors hover:bg-[#FAFAFA]"
    : rootRef
      ? "flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] font-medium text-[#414141] transition-colors hover:bg-[#FAFAFA]"
      : "flex w-full items-center gap-2 text-left transition-colors hover:bg-gray-50";

  const dividerClass = isDropdown
    ? "border-t border-[#ECECEC]"
    : rootRef
      ? "border-t border-[#ECECEC]"
      : "border border-gray-100";

  const handleMergeClick = () => {
    const snapshot = [...items];
    if (onMergeClick) {
      onMergeClick(snapshot);
    } else {
      setMergeModalItems(snapshot);
      setIsMergeModalOpen(true);
    }
    onClose();
  };

  const handleDownloadClick = () => {
    setIsDownloadModalOpen(true);
    onClose();
  };

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
    onClose();
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
      const container = rootRef?.current ?? menuRef.current;
      if (!container || container.contains(event.target as Node)) return;

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
    [isDeleteModalOpen, isDownloadModalOpen, isMergeModalOpen, onClose, rootRef]
  );

  useEffect(() => {
    if (!isOpen) return;

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, handleEscape, handleClickOutside]);

  return (
    <>
      {isOpen && (
      <div ref={menuRef} className={containerClass}>
        {!rootRef && (
          <div
            className="absolute -right-2 top-1/2 -translate-y-1/2 
                 w-3 h-3 bg-white border-t border-r border-gray-300 
                 rotate-45"
          ></div>
        )}

        <button
          type="button"
          onClick={handleDownloadClick}
          className={`${itemBaseClass} ${
            isDropdown
              ? "text-[#126ACB]"
              : rootRef
                ? "text-[#414141]"
                : "gap-1 px-3 py-1"
          }`}
        >
          <FiDownload
            size={14}
            className={
              isDropdown
                ? "shrink-0 text-[#126ACB]"
                : rootRef
                  ? "shrink-0 text-[#818181]"
                  : "text-blue-600"
            }
          />
          <span
            className={
              isDropdown
                ? "text-[#126ACB]"
                : rootRef
                  ? ""
                  : "text-blue-600 text-[0.65rem] font-medium"
            }
          >
            Download
          </span>
        </button>

        {entity === "team" ? (
          <hr className={dividerClass} />
        ) : (
          <>
            <hr className={dividerClass} />

            <button
              type="button"
              onClick={handleMergeClick}
              className={`${itemBaseClass} ${
                isDropdown
                  ? "text-[#818181]"
                  : rootRef
                    ? "text-[#414141]"
                    : "gap-1 px-3 py-1"
              }`}
            >
              <TbLayersIntersect
                size={14}
                className={
                  isDropdown
                    ? "shrink-0 text-[#818181]"
                    : rootRef
                      ? "shrink-0 text-[#818181]"
                      : "text-[#818181]"
                }
              />
              <span
                className={
                  isDropdown
                    ? "text-[#818181]"
                    : rootRef
                      ? ""
                      : "text-[#818181] text-[0.65rem] font-medium"
                }
              >
                Merge
              </span>
            </button>

            <hr className={dividerClass} />
          </>
        )}

        <button
          type="button"
          onClick={handleDeleteClick}
          className={`${itemBaseClass} ${
            isDropdown
              ? "text-red-500"
              : rootRef
                ? "text-[#414141]"
                : "gap-1 px-3 py-1"
          }`}
        >
          <FiTrash2
            size={14}
            className={
              isDropdown
                ? "shrink-0 text-red-500"
                : rootRef
                  ? "shrink-0 text-red-500"
                  : "text-red-600"
            }
          />
          <span
            className={
              isDropdown
                ? "text-red-500"
                : rootRef
                  ? "text-red-500"
                  : "text-red-600 text-[0.65rem] font-medium"
            }
          >
            Delete
          </span>
        </button>
      </div>
      )}

      {/* Modals */}
      {!onMergeClick && (
        <MergeModal
          isOpen={isMergeModalOpen}
          onClose={() => {
            setIsMergeModalOpen(false);
            setMergeModalItems([]);
          }}
          items={mergeModalItems}
          mode={entity === "vendor" ? "vendor" : "customer"}
        />
      )}
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
