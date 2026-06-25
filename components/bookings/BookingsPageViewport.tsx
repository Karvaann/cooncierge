import type { ReactNode } from "react";

interface BookingsPageViewportProps {
  children: ReactNode;
}

export default function BookingsPageViewport({ children }: BookingsPageViewportProps) {
  return (
    <div className="console-page-viewport overflow-hidden bg-[#F9F9F9] px-7 py-0">
      {children}
    </div>
  );
}
