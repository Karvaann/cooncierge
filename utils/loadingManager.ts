export type LoadingToken = string;

type Listener = (activeCount: number) => void;

const listeners: Listener[] = [];
const activeTokens = new Set<LoadingToken>();
const isBrowser = typeof window !== "undefined";

const notify = () => {
  const count = activeTokens.size;
  listeners.forEach((listener) => listener(count));
};

export const startGlobalLoading = (reason?: string): LoadingToken => {
  if (!isBrowser) {
    return "server-token";
  }
  const token = `${Date.now()}-${Math.random().toString(36).slice(2)}${reason ? `-${reason}` : ""
    }`;
  activeTokens.add(token);
  notify();
  return token;
};

export const finishGlobalLoading = (token?: LoadingToken) => {
  if (!isBrowser) return;
  if (token && activeTokens.delete(token)) {
    notify();
  }
};

export const subscribeToLoading = (listener: Listener) => {
  if (!isBrowser) {
    return () => undefined;
  }
  listeners.push(listener);
  listener(activeTokens.size);
  return () => {
    const index = listeners.indexOf(listener);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  };
};

export const resetGlobalLoading = () => {
  if (!isBrowser) return;
  activeTokens.clear();
  notify();
};
