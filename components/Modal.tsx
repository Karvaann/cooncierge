"use client";

import React, { useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  overlayTransitionClass,
  useOverlayAnimation,
} from "@/hooks/useOverlayAnimation";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: string;
  customWidth?: string;
  customeHeight?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  className?: string;
  zIndexClass?: string;
  disableOverlayClick?: boolean;
  headerLeft?: React.ReactNode;
  /** Skip default px-6 pb-6 on the scrollable body */
  noBodyPadding?: boolean;
  /** Override default body padding classes */
  bodyClassName?: string;
}

type ModalSize = {
  [K in NonNullable<ModalProps["size"]>]: string;
};

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  title = "Modal Title",
  subtitle = "",
  size = "sm",
  customWidth,
  customeHeight,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  className = "",
  zIndexClass = "z-[140]",
  disableOverlayClick = false,
  headerLeft,
  noBodyPadding = false,
  bodyClassName,
}) => {
  const { shouldRender, isVisible } = useOverlayAnimation(isOpen);

  const sizeClasses: ModalSize = useMemo(
    () => ({
      sm: "max-w-sm",
      md: "max-w-md",
      lg: "max-w-lg",
      xl: "max-w-xl",
      full: "max-w-full mx-4",
    }),
    [],
  );

  const isMobile = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < 768;
  }, []);

  const handleEscape = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape" && closeOnEscape) onClose();
    },
    [onClose, closeOnEscape],
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
    [onClose, closeOnOverlayClick, disableOverlayClick],
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

    return undefined;
  }, [isOpen, closeOnEscape, handleEscape]);

  if (!shouldRender) return null;

  const modalWidthClass = customWidth ? customWidth : sizeClasses[size];
  const modalHeightClass = customeHeight
    ? customeHeight
    : "h-auto max-h-[90vh]";

  const hasHeaderContent = Boolean(
    headerLeft || title || subtitle,
  );
  const bodyPaddingClass = noBodyPadding
    ? ""
    : (bodyClassName ?? "px-6 pb-6");

  const modalContent = (
    <div
      className={`fixed inset-0 ${zIndexClass} flex items-center justify-center bg-black/50 ${overlayTransitionClass} ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`
          console-modal-scale
          relative flex max-h-[90dvh] flex-col overflow-hidden bg-white rounded-3xl shadow-xl
          ${overlayTransitionClass} ${modalWidthClass} ${modalHeightClass}
          pointer-events-auto
          ${isVisible ? "translate-y-0 scale-100 opacity-100" : "translate-y-2 scale-[0.98] opacity-0"}
          ${isMobile ? "absolute bottom-0 w-full rounded-t-2xl" : ""}
          ${className}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {(hasHeaderContent || showCloseButton) && (
          <div
            className={`relative shrink-0 px-6 pt-5 ${
              hasHeaderContent ? "pb-4" : "pb-1"
            }`}
          >
            {hasHeaderContent ? (
              headerLeft ? (
                <div className="min-w-0 pr-10">{headerLeft}</div>
              ) : (
                <div className="min-w-0 pr-10 text-left">
                  {title ? (
                    <h2
                      id="modal-title"
                      className="font-[Poppins,sans-serif] text-[18px] font-semibold leading-tight text-[#020202]"
                    >
                      {title}
                    </h2>
                  ) : null}
                  {subtitle ? (
                    <p className="mt-1 font-[Poppins,sans-serif] text-[13px] leading-snug text-[#818181]">
                      {subtitle}
                    </p>
                  ) : null}
                </div>
              )
            ) : null}

            {showCloseButton && (
              <button
                onClick={onClose}
                className="absolute right-5 top-5 rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                aria-label="Close modal"
              >
                <svg
                  className="h-5 w-5"
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
        )}

        <div
          className={`min-h-0 flex-1 overflow-y-auto overscroll-y-contain ${bodyPaddingClass}`}
        >
          {children}
        </div>
      </div>
    </div>
  );

  if (typeof window !== "undefined") {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
};

export default React.memo(Modal);
