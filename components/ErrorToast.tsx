"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

type ErrorToastProps = {
  message: string;
  visible: boolean;
  onClose: () => void;
  autoHideMs?: number;
};

const ErrorToast: React.FC<ErrorToastProps> = ({
  message,
  visible,
  onClose,
  autoHideMs = 4000,
}) => {
  useEffect(() => {
    if (!visible) return;

    const timer = setTimeout(onClose, autoHideMs);
    return () => clearTimeout(timer);
  }, [visible, autoHideMs, onClose]);

  if (!visible) return null;

  return createPortal(
    <div
      className="fixed top-8 left-1/2 -translate-x-1/2 z-[1100]
      flex items-center gap-2
      bg-red-50 border border-red-200 text-red-600
      px-3 py-1.5 rounded-full shadow-md
      max-w-[90vw] text-[0.65rem]"
    >
      <svg
        className="w-4 h-4 text-red-500"
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

      <span className="font-semibold">Error :</span>
      <span className="truncate">{message}</span>

      <button
        type="button"
        onClick={onClose}
        className="ml-2 text-red-400 hover:text-red-600 text-lg font-bold"
      >
        ×
      </button>
    </div>,
    document.body
  );
};

export default ErrorToast;
