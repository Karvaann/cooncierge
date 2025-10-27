"use client";

import React, { useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";

// Type definitions
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  customWidth?: string;
  customeHeight?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  className?: string;
}

type ModalSize = {
  [K in NonNullable<ModalProps["size"]>]: string;
};

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  title = "Modal Title",
  size = "sm",
  customWidth,
  customeHeight,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  className = "",
}) => {
  // Memoized size classes
  const sizeClasses: ModalSize = useMemo(
    () => ({
      sm: "max-w-sm",
      md: "max-w-md",
      lg: "max-w-lg",
      xl: "max-w-xl",
      full: "max-w-full mx-4",
    }),
    []
  );

  // Memoized responsive behavior
  const isMobile = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < 768;
  }, []);

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

  // // Prevent body scroll when modal is open
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
    return;
  }, [isOpen, closeOnEscape, handleEscape]);

  const modalWidthClass = customWidth ? customWidth : sizeClasses[size];
  const modalHeightClass = customeHeight ? customeHeight : "";

  // Memoized modal content
  const modalContent = useMemo(
    () => (
      <div
        className="fixed inset-0 z-50 bg-black/50 flex justify-center items-center md:items-center transition-opacity duration-300"
        onClick={handleOverlayClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
      >
        <div
          className={`
          bg-white rounded-t-2xl md:rounded-lg shadow-xl overflow-hidden
          transition-all duration-300 transform ${modalWidthClass} ${modalHeightClass}
          ${isMobile ? "absolute bottom-0 w-full" : ``}
          ${className}
        `}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between mt-3 items-center p-4">
            <h2
              id="modal-title"
              className="text-black text-xl md:text-2xl font-bold flex-1 text-center pr-2"
            >
              {title}
            </h2>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                aria-label="Close modal"
              >
                <svg
                  className="w-6 h-6"
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
          <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
            {children}
          </div>
        </div>
      </div>
    ),
    [
      handleOverlayClick,
      title,
      isMobile,
      sizeClasses,
      size,
      className,
      showCloseButton,
      onClose,
      children,
    ]
  );

  // Don't render if not open
  if (!isOpen) return null;

  // Use portal for better accessibility and z-index management
  if (typeof window !== "undefined") {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
};

export default React.memo(Modal);
