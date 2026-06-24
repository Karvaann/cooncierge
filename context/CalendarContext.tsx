"use client";

import React, { createContext, useContext, useState, ReactNode, useMemo } from "react";

// Type definitions for the calendar context
interface CalendarContextType {
  calenderShow: boolean;
  setCalenderShow: (show: boolean) => void;
  toggleCalendar: () => void;
}

// Create context with proper typing
const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

// Custom hook with error handling
export const useCalendar = (): CalendarContextType => {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error("useCalendar must be used within a CalendarProvider");
  }
  return context;
};

// Props interface for the provider
interface CalendarProviderProps {
  children: ReactNode;
  defaultShow?: boolean;
}

// Optimized provider component with memoization
export function CalendarProvider({ 
  children, 
  defaultShow = false 
}: CalendarProviderProps): JSX.Element {
  const [calenderShow, setCalenderShow] = useState<boolean>(defaultShow);
  
  // Memoized toggle function for better performance
  const toggleCalendar = useMemo(() => {
    return () => setCalenderShow(prev => !prev);
  }, []);
  
  // Memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo<CalendarContextType>(() => ({
    calenderShow,
    setCalenderShow,
    toggleCalendar,
  }), [calenderShow, toggleCalendar]);
  
  return (
    <CalendarContext.Provider value={contextValue}>
      {children}
    </CalendarContext.Provider>
  );
}

// Export the context for advanced usage
export { CalendarContext };

// Type export for external usage
export type { CalendarContextType, CalendarProviderProps };
