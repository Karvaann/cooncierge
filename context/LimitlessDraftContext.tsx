"use client";

import type { ReactNode } from "react";
import React, { createContext, useContext, useMemo, useState } from "react";

export type LimitlessDraft = {
  bookingCode: string;
  // Raw merged form data from BookingFormSidesheet (general + service)
  formData: Record<string, any>;
  documents: File[];
  createdAt: number;
};

type LimitlessDraftContextType = {
  draft: LimitlessDraft | null;
  setDraft: (draft: Omit<LimitlessDraft, "createdAt">) => void;
  clearDraft: () => void;
};

const LimitlessDraftContext = createContext<LimitlessDraftContextType | null>(
  null,
);

export const useLimitlessDraft = () => {
  const ctx = useContext(LimitlessDraftContext);
  if (!ctx) {
    throw new Error(
      "useLimitlessDraft must be used within a LimitlessDraftProvider",
    );
  }
  return ctx;
};

export const LimitlessDraftProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [draft, setDraftState] = useState<LimitlessDraft | null>(null);

  const value = useMemo<LimitlessDraftContextType>(
    () => ({
      draft,
      setDraft: (next) =>
        setDraftState({
          ...next,
          createdAt: Date.now(),
        }),
      clearDraft: () => setDraftState(null),
    }),
    [draft],
  );

  return (
    <LimitlessDraftContext.Provider value={value}>
      {children}
    </LimitlessDraftContext.Provider>
  );
};
