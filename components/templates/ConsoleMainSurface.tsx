import type { ReactNode } from "react";

interface ConsoleMainSurfaceProps {
  children: ReactNode;
}

export default function ConsoleMainSurface({ children }: ConsoleMainSurfaceProps) {
  return (
    <main id="main-content" className="console-main" role="main" tabIndex={-1}>
      {children}
    </main>
  );
}
