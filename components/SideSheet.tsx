"use client";

import React, { useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";

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
  /** Scale panel to match console UI (80% on screens below 1728px) */
  responsiveScale?: boolean;
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
  responsiveScale = true,
}) => {
  const widthValues: SideSheetWidth = useMemo(
    () => ({
      sm: "20rem",
      md: "24rem",
      lg: "41.664vw",
      lg2: "50.43vw",
      xl: "56vw",
      full: "100vw",
    }),
    [],
  );

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

  const positionClasses = useMemo(
    () => ({
      left: {
        align: "justify-start",
        slide: isOpen ? "translate-x-0" : "-translate-x-full",
        rounded: "rounded-br-xl rounded-tr-xl",
      },
      right: {
        align: "justify-end",
        slide: isOpen ? "translate-x-0" : "translate-x-full",
        rounded: "rounded-bl-xl rounded-tl-xl",
      },
    }),
    [isOpen],
  );

  const handleEscape = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape" && closeOnEscape) {
        onClose();
      }
    },
    [onClose, closeOnEscape],
  );

  const handleOverlayClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget && closeOnOverlayClick) {
        if (onCloseButtonClick) onCloseButtonClick();
        else onClose();
      }
    },
    [onClose, closeOnOverlayClick, onCloseButtonClick],
  );

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

  const panelWidthClass = responsiveScale ? "" : widthClasses[width];
  const panelWidthStyle = responsiveScale
    ? ({
        "--console-sidesheet-width": widthValues[width],
      } as React.CSSProperties)
    : undefined;

  const sideSheetContent = useMemo(
    () => (
      <div
        className={`fixed inset-0 transition-opacity duration-300 ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        style={{ zIndex }}
        aria-hidden={!isOpen}
      >
        <div
          className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
            isOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={handleOverlayClick}
          aria-hidden="true"
        />

        <div
          className={`absolute inset-0 flex pointer-events-none ${positionClasses[position].align}`}
        >
          <div
            className={`pointer-events-auto h-[100dvh] max-h-[100dvh] min-h-0 transition-transform duration-300 ease-in-out ${positionClasses[position].slide}`}
          >
            <div
              className={`h-full min-h-0 ${
                responsiveScale ? "console-sidesheet-panel console-sidesheet-responsive" : `${panelWidthClass} h-full`
              }`}
              style={responsiveScale ? panelWidthStyle : undefined}
            >
              <div
                className={`
              flex h-full min-h-0 w-full flex-col overflow-hidden bg-white shadow-xl
              px-[14px] pt-[14px]
              ${positionClasses[position].rounded}
              ${className}
            `}
                data-sidesheet-position={position}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? "sidesheet-title" : undefined}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
            <div className="flex shrink-0 items-center justify-between">
              <div className="mt-1 flex min-w-0 flex-1 items-center gap-2">
                {showCloseButton && (
                  <button
                    onClick={
                      onCloseButtonClick ? onCloseButtonClick : onClose
                    }
                    className="shrink-0 rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-600"
                    aria-label="Close side sheet"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="11"
                      height="11"
                      viewBox="0 0 11 11"
                      fill="none"
                    >
                      <path
                        d="M5.30265 4.11676L9.42137 9.72748e-05L10.6053 1.18343L6.48657 5.3001L10.6053 9.41676L9.42137 10.6001L5.30265 6.48343L1.18392 10.6001L0 9.41676L4.11872 5.3001L0 1.18343L1.18392 9.72748e-05L5.30265 4.11676Z"
                        fill="#818181"
                      />
                    </svg>
                  </button>
                )}
                <h2
                  id="sidesheet-title"
                  className="truncate text-[1rem] font-semibold text-gray-900"
                >
                  {title}
                </h2>
              </div>
              {(headerRight || showLinkButton) && (
                <div className="ml-auto mr-1 flex shrink-0 items-center gap-2">
                  {headerRight}
                  {showLinkButton && (
                    <button
                      type="button"
                      className="text-[0.8rem] font-medium text-[#126ACB] hover:underline"
                    >
                      Link to a User
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
              {children}
            </div>
              </div>
            </div>
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
      panelWidthClass,
      panelWidthStyle,
      responsiveScale,
      className,
      title,
      showCloseButton,
      onCloseButtonClick,
      onClose,
      headerRight,
      showLinkButton,
      children,
    ],
  );

  if (typeof window !== "undefined") {
    return createPortal(sideSheetContent, document.body);
  }

  return sideSheetContent;
};

export default React.memo(SideSheet);
