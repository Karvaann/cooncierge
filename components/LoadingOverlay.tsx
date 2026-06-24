"use client";

import FullScreenLoader from "@/components/FullScreenLoader";
import { useLoading } from "@/context/LoadingContext";

export default function LoadingOverlay() {
  const { isLoading } = useLoading();

  if (!isLoading) return null;

  return <FullScreenLoader />;
}
