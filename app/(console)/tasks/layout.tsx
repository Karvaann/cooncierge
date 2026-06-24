import type { ReactNode } from "react";
import { CalendarProvider } from "@/context/CalendarContext";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return <CalendarProvider>{children}</CalendarProvider>;
}
