"use client";
import React, { useState, useRef, useEffect } from "react";
import { PiDotsThreeBold } from "react-icons/pi";
import DeleteConfirmModal from "../popups/DeleteConfirmModal";

type MenuAction = {
  label: string;
  icon?: React.ReactNode;
  color?: string;
  onClick: () => void;
  /** When set, clicking this action opens a centered delete confirmation modal. */
  confirmDeleteId?: string;
};

interface ActionMenuProps {
  actions: MenuAction[];
  /** Tailwind width class */
  width?: string;
  /** Legacy positioning class when align is not used */
  right?: string;
  /** Opens menu to the left or right of the trigger */
  align?: "left" | "right";
  /** Show only when parent row has `.row-actions-active` */
  revealClassName?: string;
}

const ActionMenu: React.FC<ActionMenuProps> = ({
  actions,
  width,
  right,
  align = "right",
  revealClassName,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{
    itemId: string;
    onConfirm: () => void;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const menuWidthClass = width ?? "min-w-[7.5rem]";
  const menuPositionClass =
    align === "left"
      ? "right-full mr-2 top-1/2 -translate-y-1/2"
      : `${right ?? "right-10"} top-1/2 -translate-y-1/2`;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pendingDelete) return;

      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, pendingDelete]);

  const closeMenu = () => {
    setIsOpen(false);
  };

  const closeDeleteModal = () => {
    setPendingDelete(null);
  };

  return (
    <>
      <div
        ref={containerRef}
        className={`relative flex items-center justify-center ${revealClassName ?? ""} ${
          isOpen && revealClassName ? "!opacity-100 pointer-events-auto" : ""
        }`}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (isOpen) {
              closeMenu();
            } else {
              setIsOpen(true);
            }
          }}
          className="cursor-pointer rounded-[8px] border border-[#E2E1E1] bg-[#FAFAFA] p-1.5 transition-colors hover:bg-[#F3F3F3]"
          aria-label="More actions"
        >
          <PiDotsThreeBold className="h-[18px] w-[18px] text-[#414141]" />
        </button>

        {isOpen && (
          <div
            className={`absolute ${menuPositionClass} z-50 overflow-hidden rounded-[12px] border border-[#E2E1E1] bg-white py-1.5 shadow-[0_4px_16px_rgba(0,0,0,0.08)] ${menuWidthClass}`}
          >
            <div className="flex flex-col px-1">
              {actions.map((action, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (action.confirmDeleteId) {
                      setPendingDelete({
                        itemId: action.confirmDeleteId,
                        onConfirm: action.onClick,
                      });
                      closeMenu();
                      return;
                    }
                    action.onClick();
                    closeMenu();
                  }}
                  className={`flex w-full items-center gap-2 whitespace-nowrap rounded-[8px] px-2.5 py-2 text-left text-[13px] font-medium transition-colors hover:bg-[#FAFAFA] ${action.color ?? "text-gray-700"}`}
                >
                  {action.icon && (
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                      {action.icon}
                    </span>
                  )}
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <DeleteConfirmModal
        isOpen={Boolean(pendingDelete)}
        itemId={pendingDelete?.itemId ?? ""}
        onCancel={closeDeleteModal}
        onConfirm={() => {
          pendingDelete?.onConfirm();
          closeDeleteModal();
        }}
      />
    </>
  );
};

export default ActionMenu;
