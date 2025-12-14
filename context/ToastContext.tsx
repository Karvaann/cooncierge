import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { subscribeToToasts, pushToast as pushToastEvent } from "@/utils/toastService";

type Toast = {
  id: number;
  message: string;
  type: "success" | "error" | "info";
};

type ToastContextType = {
  showToast: (message: string, type?: "success" | "error" | "info", duration?: number) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(
    (message: string, type: "success" | "error" | "info" = "info", duration = 3000) => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, duration);
    },
    []
  );

  // Bridge global toast events into the provider
  React.useEffect(() => {
    const unsubscribe = subscribeToToasts(({ message, type, duration }) =>
      showToast(message, type, duration)
    );
    return unsubscribe;
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container fixed top-5 right-5 z-50 space-y-2">
        {toasts.map(({ id, message, type }) => (
          <div
            key={id}
            className={`px-4 py-2 rounded shadow-md text-white text-sm animate-fade-in ${
              type === "success"
                ? "bg-green-900"
                : type === "error"
                ? "bg-red-900"
                : "bg-gray-700"
            }`}
          >
            {message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
