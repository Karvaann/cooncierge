"use client";

import React, { useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";

// Type definitions
interface SideSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onCloseButtonClick?: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  width?: "sm" | "md" | "lg" | "lg2" | "xl" | "full";
  position?: "left" | "right";
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  className?: string;
  showLinkButton?: boolean;
  zIndex?: number;
}

type SideSheetWidth = {
  [K in NonNullable<SideSheetProps["width"]>]: string;
};

const SideSheet: React.FC<SideSheetProps> = ({
  isOpen,
  onClose,
  onCloseButtonClick,
  title = "",
  children,
  width = "lg",
  position = "right",
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  className = "",
  showLinkButton = false,
  zIndex = 950,
}) => {
  // Memoized width classes
  const widthClasses: SideSheetWidth = useMemo(
    () => ({
      sm: "w-80",
      md: "w-96",
      lg: "w-[41.664vw]",
      lg2: "w-[50.43vw]",
      xl: "w-[52.08vw]",
      full: "w-full",
    }),
    []
  );

  // Memoized position classes
  const positionClasses = useMemo(
    () => ({
      left: {
        container: "left-0",
        transform: isOpen ? "translate-x-0" : "-translate-x-full",
        rounded: "rounded-br-xl rounded-tr-xl",
      },
      right: {
        container: "right-0",
        transform: isOpen ? "translate-x-0" : "translate-x-full",
        rounded: "rounded-bl-xl rounded-tl-xl",
      },
    }),
    [isOpen]
  );

  // Handle escape key
  const handleEscape = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape" && closeOnEscape) {
        onClose();
      }
    },
    [onClose, closeOnEscape]
  );

  // Handle overlay click
  const handleOverlayClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget && closeOnOverlayClick) {
        if (onCloseButtonClick) onCloseButtonClick();
        else onClose();
      }
    },
    [onClose, closeOnOverlayClick, onCloseButtonClick]
  );

  // Prevent body scroll when sidesheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";

      if (closeOnEscape) {
        document.addEventListener("keydown", handleEscape);
      }

      return () => {
        document.body.style.overflow = "unset";
        document.removeEventListener("keydown", handleEscape);
      };
    }
    return undefined;
  }, [isOpen, closeOnEscape, handleEscape]);

  // Memoized sidesheet content
  const sideSheetContent = useMemo(
    () => (
      <div
        className={`fixed inset-0 transition-all duration-300 ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        style={{ zIndex }}
        aria-hidden={!isOpen}
      >
        {/* Overlay */}
        <div
          className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
            isOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={handleOverlayClick}
          aria-hidden="true"
        />

        {/* Side Sheet */}
        <div
          className={`
          absolute top-0 h-full bg-white shadow-xl
          transition-transform duration-300 ease-in-out rounded-l-[24px]
 overflow-hidden
          ${positionClasses[position].container}
          ${positionClasses[position].transform}
          ${positionClasses[position].rounded}
          ${widthClasses[width]}
          ${className}
        `}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? "sidesheet-title" : undefined}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-2 py-2">
            <div className="flex items-center gap-2 mt-1 flex-1">
              {showCloseButton && (
                <button
                  onClick={onCloseButtonClick ? onCloseButtonClick : onClose}
                  className="text-gray-500 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
                  aria-label="Close side sheet"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
              <h2
                id="sidesheet-title"
                className="text-[1rem] -ml-1 font-semibold text-gray-900"
              >
                {title}
              </h2>
            </div>
            {showLinkButton && (
              <div className="ml-auto mr-1">
                <button
                  type="button"
                  className="text-[#126ACB] text-[0.8rem] font-medium hover:underline"
                >
                  Link to a User
                </button>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="overflow-y-auto h-[calc(100%-64px)] bg-white">
            {children}
          </div>
        </div>
      </div>
    ),
    [
      isOpen,
      zIndex,
      handleOverlayClick,
      positionClasses,
      position,
      widthClasses,
      width,
      className,
      title,
      showCloseButton,
      onClose,
      children,
    ]
  );

  // Use portal for better accessibility and z-index management
  if (typeof window !== "undefined") {
    return createPortal(sideSheetContent, document.body);
  }

  return sideSheetContent;
};

export default React.memo(SideSheet);
