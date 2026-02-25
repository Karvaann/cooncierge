import React from "react";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <section className="min-h-[calc(100vh-64px)] bg-gray-50">{children}</section>;
}
