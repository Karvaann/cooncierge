import type { ReactNode } from "react";

interface LoginLayoutProps {
  children: ReactNode;
}

export default function LoginLayout({ children }: LoginLayoutProps) {
  return (
    <main id="main-content" className="flex-1" role="main">
      {children}
    </main>
  );
}
