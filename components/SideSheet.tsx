"use client";

import React, { useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";

// Type definitions
interface SideSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onCloseButtonClick?: () => void;
  title?: string;
  children: React.ReactNode;
  width?: "sm" | "md" | "lg" | "xl" | "full";
  position?: "left" | "right";
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  className?: string;
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
}) => {
  // Memoized width classes
  const widthClasses: SideSheetWidth = useMemo(
    () => ({
      sm: "w-80",
      md: "w-96",
      lg: "w-[41.664vw]",
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
        onClose();
      }
    },
    [onClose, closeOnOverlayClick]
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
      <div className="fixed inset-0 z-50 transition-all duration-300">
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
        >
          {/* Header */}
          <div className="flex items-center justify-between px-2 py-2 ml-2">
            <h2
              id="sidesheet-title"
              className="text-[1rem] ml-2 font-semibold text-gray-900 flex-1"
            >
              {title}
            </h2>
            {showCloseButton && (
              <button
                onClick={onCloseButtonClick ? onCloseButtonClick : onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
                aria-label="Close side sheet"
              >
                <svg
                  className="w-5 h-5"
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

  // Don't render if not open
  if (!isOpen) return null;

  // Use portal for better accessibility and z-index management
  if (typeof window !== "undefined") {
    return createPortal(sideSheetContent, document.body);
  }

  return sideSheetContent;
};

export default React.memo(SideSheet);
