"use client";
import React, { useState, useRef, useEffect } from "react";
import { PiDotsThreeBold } from "react-icons/pi";

type MenuAction = {
  label: string;
  icon?: React.ReactNode;
  color?: string;
  onClick: () => void;
};

interface ActionMenuProps {
  actions: MenuAction[];
}

const ActionMenu: React.FC<ActionMenuProps> = ({ actions }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative flex items-center justify-center z-[50]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
        aria-label="More actions"
      >
        <PiDotsThreeBold className="w-4 h-4 text-gray-600" />
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          className="
            absolute right-14 top-1/2 -translate-y-1/2
            bg-white border border-gray-200 rounded-md shadow-xl 
            w-31 z-[100] 
          "
        >
          <div
            className="
    absolute 
    -right-2
    top-1/2 -translate-y-1/2
    w-3 h-3
    bg-white 
    border-t border-r border-gray-200
    rotate-45
  "
          ></div>

          {/* Menu items */}
          <div className="flex flex-col py-0.5 px-1 text-xs">
            {actions.map((action, index) => (
              <React.Fragment key={index}>
                <button
                  onClick={() => {
                    action.onClick();
                    setIsOpen(false);
                  }}
                  className={`
                    flex items-center gap-1 px-2 py-0.5 
  hover:bg-gray-50 transition-colors
  whitespace-nowrap
  ${action.color ?? "text-gray-700"}
                  `}
                >
                  {action.icon && (
                    <span className="w-4 h-4 flex items-center justify-center">
                      {action.icon}
                    </span>
                  )}
                  <span className="font-medium">{action.label}</span>
                </button>

                {index < actions.length - 1 && (
                  <hr className="my-1 border-t border-gray-200" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActionMenu;
