"use client";

import React, { useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  subtitle?: string; // Added optional subtitle for better structure
  customWidth?: string;
  customeHeight?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  className?: string;
  zIndexClass?: string;
  disableOverlayClick?: boolean;
}

type ModalSize = {
  [K in NonNullable<ModalProps["size"]>]: string;
};

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  title = "Modal Title",
  subtitle,
  size = "sm",
  customWidth,
  customeHeight,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  className = "",
  zIndexClass = "z-[140]",
  disableOverlayClick = false,
}) => {
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

  const isMobile = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < 768;
  }, []);

  const handleEscape = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape" && closeOnEscape) onClose();
    },
    [onClose, closeOnEscape]
  );

  const handleOverlayClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (
        event.target === event.currentTarget &&
        closeOnOverlayClick &&
        !disableOverlayClick
      ) {
        onClose();
      }
    },
    [onClose, closeOnOverlayClick]
  );

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      if (closeOnEscape) document.addEventListener("keydown", handleEscape);
      return () => {
        document.body.style.overflow = "unset";
        document.removeEventListener("keydown", handleEscape);
      };
    }
    return;
  }, [isOpen, closeOnEscape, handleEscape]);

  const modalWidthClass = customWidth ? customWidth : sizeClasses[size];
  const modalHeightClass = customeHeight
    ? customeHeight
    : "h-auto max-h-[90vh]";

  const modalContent = (
    <div
      className={`fixed inset-0 ${zIndexClass} bg-black/50 flex justify-center items-center transition-opacity duration-300`}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`
          relative bg-white rounded-lg shadow-xl overflow-hidden 
          transition-all duration-300 transform ${modalWidthClass} ${modalHeightClass}
          pointer-events-auto
          ${isMobile ? "absolute bottom-0 w-full rounded-t-2xl" : ""}
          ${className}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ✅ HEADER FIXED LAYOUT */}

        <div className="relative flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-100">
          <div className="flex-1 text-center px-6">
            <h2
              id="modal-title"
              className="text-black text-[1rem] md:text-[1.15rem] font-semibold leading-snug m-0"
            >
              {title}
            </h2>

            {subtitle && (
              <p className="text-gray-500 text-[0.8rem] mt-1 leading-tight">
                {subtitle}
              </p>
            )}
          </div>

          {showCloseButton && (
            <button
              onClick={onClose}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition p-1 rounded-full hover:bg-gray-100"
              aria-label="Close modal"
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

        {/* ✅ CONTENT AREA */}
        <div className="relative mt-[-0.25rem] z-10 p-4 overflow-y-auto max-h-[calc(90vh-80px)] bg-white">
          {children}
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  if (typeof window !== "undefined") {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
};

export default React.memo(Modal);
