"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { sidebarRouteHrefs } from "@/components/navigation/menuItems";

export default function RoutePrefetcher() {
  const router = useRouter();

  useEffect(() => {
    sidebarRouteHrefs.forEach((path) => {
      router.prefetch(path);
    });
  }, [router]);

  return null;
}
