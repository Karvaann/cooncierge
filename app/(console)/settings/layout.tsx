import React from "react";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-hidden">
      <div
        className="w-screen
        min-h-[calc(100vh-64px)]
        bg-gray-50
        relative
        left-1/2
        right-1/2
        -ml-[50vw]
        -mr-[50vw]
"
      >
        {children}
      </div>
    </div>
  );
}
