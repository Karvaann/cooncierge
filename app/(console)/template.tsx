import type { ReactNode } from "react";

interface ConsoleTemplateProps {
  children: ReactNode;
}

export default function ConsoleTemplate({ children }: ConsoleTemplateProps) {
  return (
    <section className="console-page-shell" aria-live="polite">
      <div className="console-page-content">{children}</div>
    </section>
  );
}
