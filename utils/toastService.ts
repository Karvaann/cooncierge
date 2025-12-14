type ToastType = "success" | "error" | "info";

type ToastEvent = {
  message: string;
  type: ToastType;
  duration?: number;
};

type Listener = (toast: ToastEvent) => void;

const listeners: Listener[] = [];

export const pushToast = (toast: ToastEvent) => {
  listeners.forEach((l) => l(toast));
};

export const subscribeToToasts = (listener: Listener) => {
  listeners.push(listener);
  return () => {
    const idx = listeners.indexOf(listener);
    if (idx !== -1) listeners.splice(idx, 1);
  };
};
