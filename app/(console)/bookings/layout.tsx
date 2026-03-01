import type { ReactNode } from "react";
import { BookingProvider } from "@/context/BookingContext";

interface OtherServicesLayoutProps {
  children: ReactNode;
}

export default function OtherServicesLayout({ children }: OtherServicesLayoutProps) {
  return <BookingProvider>{children}</BookingProvider>;
}
