"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import {
  finishGlobalLoading,
  startGlobalLoading,
  subscribeToLoading,
  type LoadingToken,
} from "@/utils/loadingManager";

interface LoadingContextValue {
  isLoading: boolean;
  startTask: (reason?: string) => LoadingToken;
  finishTask: (token?: LoadingToken) => void;
  withLoading: <T>(fn: () => Promise<T>) => Promise<T>;
}

const LoadingContext = createContext<LoadingContextValue | null>(null);

export const LoadingProvider = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToLoading((count) => {
      setIsLoading(count > 0);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const token = startGlobalLoading("route-change");
    const timeout = setTimeout(() => finishGlobalLoading(token), 1200);
    return () => {
      clearTimeout(timeout);
      finishGlobalLoading(token);
    };
  }, [pathname]);

  const value = useMemo(
    () => ({
      isLoading: isLoading || !hydrated,
      startTask: startGlobalLoading,
      finishTask: finishGlobalLoading,
      withLoading: async <T,>(fn: () => Promise<T>): Promise<T> => {
        const token = startGlobalLoading("manual");
        try {
          return await fn();
        } finally {
          finishGlobalLoading(token);
        }
      },
    }),
    [isLoading, hydrated]
  );

  return (
    <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const ctx = useContext(LoadingContext);
  if (!ctx) {
    throw new Error("useLoading must be used within LoadingProvider");
  }
  return ctx;
};
