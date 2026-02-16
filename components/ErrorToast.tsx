"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

type ErrorToastProps = {
  message: string;
  visible: boolean;
  onClose: () => void;
  autoHideMs?: number;
  bgColorClass?: string;
  boldText?: string | undefined;
  messageColorClass?: string | undefined;
  borderColorClass?: string | undefined;
  closeButtonClass?: string | undefined;
  showLabel?: boolean | undefined;
};

const ErrorToast: React.FC<ErrorToastProps> = ({
  message,
  visible,
  onClose,
  autoHideMs = 10000,
  bgColorClass = "bg-red-50",
  boldText,
  messageColorClass = "text-red-600",
  borderColorClass = "border-red-200",
  closeButtonClass = "text-red-400 hover:text-red-600",
  showLabel = true,
}) => {
  useEffect(() => {
    if (!visible) return;

    const timer = setTimeout(onClose, autoHideMs);
    return () => clearTimeout(timer);
  }, [visible, autoHideMs, onClose]);

  if (!visible) return null;

  return createPortal(
    <div
      className={`fixed top-8 left-1/2 -translate-x-1/2 z-[1100] flex items-center gap-2 ${bgColorClass} border ${borderColorClass} px-2 py-1 rounded-full shadow-md max-w-[90vw] text-[13px]`}
    >
      <svg
        className={`w-4 h-4 ${
          messageColorClass.replace("text-", "text-") || messageColorClass
        }`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="10" strokeWidth="2" />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M12 8v4m0 4h.01"
        />
      </svg>

      <span className={`truncate ${messageColorClass}`}>
        {showLabel && <span className="font-semibold">Error :</span>}
        {boldText && message.includes(boldText) ? (
          <>
            {message.split(boldText)[0]}
            <b>{boldText}</b>
            {message.split(boldText)[1]}
          </>
        ) : (
          message
        )}
      </span>

      <button
        type="button"
        onClick={onClose}
        className={`${closeButtonClass} ml-2 text-sm font-bold`}
      >
        ×
      </button>
    </div>,
    document.body,
  );
};

export default ErrorToast;
