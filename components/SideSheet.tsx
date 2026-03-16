"use client";

import React, { useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";

// Type definitions
interface SideSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onCloseButtonClick?: () => void;
  title?: React.ReactNode;
  headerRight?: React.ReactNode;
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
  headerRight,
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
      xl: "w-[56vw]",
      full: "w-full",
    }),
    [],
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
    [isOpen],
  );

  // Handle escape key
  const handleEscape = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape" && closeOnEscape) {
        onClose();
      }
    },
    [onClose, closeOnEscape],
  );

  // Handle overlay click
  const handleOverlayClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget && closeOnOverlayClick) {
        if (onCloseButtonClick) onCloseButtonClick();
        else onClose();
      }
    },
    [onClose, closeOnOverlayClick, onCloseButtonClick],
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
          px-[14px] pt-[14px]
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 mt-1 flex-1">
              {showCloseButton && (
                <button
                  onClick={onCloseButtonClick ? onCloseButtonClick : onClose}
                  className="text-gray-500 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
                  aria-label="Close side sheet"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 11 11" fill="none">
                    <path d="M5.30265 4.11676L9.42137 9.72748e-05L10.6053 1.18343L6.48657 5.3001L10.6053 9.41676L9.42137 10.6001L5.30265 6.48343L1.18392 10.6001L0 9.41676L4.11872 5.3001L0 1.18343L1.18392 9.72748e-05L5.30265 4.11676Z" fill="#818181"/>
                  </svg>
                </button>
              )}
              <h2
                id="sidesheet-title"
                className="text-[1rem] font-semibold text-gray-900"
              >
                {title}
              </h2>
            </div>
            {(headerRight || showLinkButton) && (
              <div className="ml-auto mr-1 flex items-center gap-2">
                {headerRight}
                {showLinkButton && (
                  <button
                    type="button"
                    className="text-[#126ACB] text-[0.8rem] font-medium hover:underline"
                  >
                    Link to a User
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="overflow-y-auto h-[calc(100%-54px)] bg-white">
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
    ],
  );

  // Use portal for better accessibility and z-index management
  if (typeof window !== "undefined") {
    return createPortal(sideSheetContent, document.body);
  }

  return sideSheetContent;
};

export default React.memo(SideSheet);
