"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

type TableTabsProps = {
  tabs: string[];
  activeTab: string;
  onChange: (tab: string) => void;
  totalCount: number;
  totalLabel?: string;
  tabsClassName?: string;
  draggableIndicator?: boolean;
};

export default function TableTabs({
  tabs,
  activeTab,
  onChange,
  totalCount,
  totalLabel = "Total",
  tabsClassName = "",
  draggableIndicator = false,
}: TableTabsProps) {
  const tabContainerRef = useRef<HTMLDivElement | null>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });
  const [tabMetrics, setTabMetrics] = useState<
    Array<{ tab: string; left: number; width: number; center: number }>
  >([]);
  const [dragIndicator, setDragIndicator] = useState<{
    left: number;
    width: number;
  } | null>(null);
  const dragOffsetRef = useRef(0);
  const [isDraggingIndicator, setIsDraggingIndicator] = useState(false);

  useLayoutEffect(() => {
    const update = () => {
      const container = tabContainerRef.current;
      if (!container) return;

      const shrinkPx = 5;
      const nextMetrics = tabs
        .map((tab) => {
          const btn = container.querySelector(
            `[data-tab="${tab}"]`,
          ) as HTMLElement | null;
          if (!btn) return null;

          const left = btn.offsetLeft + Math.round(shrinkPx / 2);
          const width = Math.max(0, btn.offsetWidth - shrinkPx);

          return {
            tab,
            left,
            width,
            center: left + width / 2,
          };
        })
        .filter(Boolean) as Array<{
        tab: string;
        left: number;
        width: number;
        center: number;
      }>;

      setTabMetrics((prev) => {
        if (
          prev.length === nextMetrics.length &&
          prev.every(
            (item, index) =>
              item.tab === nextMetrics[index]?.tab &&
              item.left === nextMetrics[index]?.left &&
              item.width === nextMetrics[index]?.width &&
              item.center === nextMetrics[index]?.center,
          )
        ) {
          return prev;
        }

        return nextMetrics;
      });

      const activeBtn = container.querySelector(
        `[data-tab="${activeTab}"]`,
      ) as HTMLElement | null;
      if (!activeBtn) return;

      const left = activeBtn.offsetLeft + Math.round(shrinkPx / 2);
      const width = Math.max(0, activeBtn.offsetWidth - shrinkPx);
      setIndicator({ left, width });
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [activeTab, tabs]);

  useEffect(() => {
    if (!draggableIndicator || !isDraggingIndicator) return;

    const handlePointerMove = (event: PointerEvent) => {
      const container = tabContainerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const width = dragIndicator?.width ?? indicator.width;
      const minLeft = 0;
      const maxLeft = Math.max(0, rect.width - width);
      const nextLeft = Math.min(
        maxLeft,
        Math.max(minLeft, event.clientX - rect.left - dragOffsetRef.current),
      );

      setDragIndicator({ left: nextLeft, width });
    };

    const handlePointerUp = () => {
      setIsDraggingIndicator(false);

      if (!dragIndicator || tabMetrics.length === 0) {
        setDragIndicator(null);
        return;
      }

      const dragCenter = dragIndicator.left + dragIndicator.width / 2;
      const closestTab = tabMetrics.reduce((closest, metric) => {
        return Math.abs(metric.center - dragCenter) <
          Math.abs(closest.center - dragCenter)
          ? metric
          : closest;
      }, tabMetrics[0]!);

      onChange(closestTab.tab);
      setDragIndicator(null);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [
    dragIndicator,
    draggableIndicator,
    indicator.width,
    isDraggingIndicator,
    onChange,
    tabMetrics,
  ]);

  return (
      <div
        ref={tabContainerRef}
        style={{ width: "fit-content" }}
        className={`flex items-center bg-[#FFF] rounded-xl relative py-1.5 gap-1.5 ${tabsClassName}`}
      >
        <div
          className={`absolute h-[calc(100%-0.5rem)] bg-[#7135AD] rounded-xl shadow-sm top-1 ${
            draggableIndicator
              ? isDraggingIndicator
                ? "transition-none cursor-grabbing"
                : "transition-all duration-300 ease-in-out cursor-grab"
              : "transition-all duration-300 ease-in-out"
          }`}
          style={{
            left: `${(dragIndicator ?? indicator).left}px`,
            width: `${(dragIndicator ?? indicator).width}px`,
          }}
          onPointerDown={
            draggableIndicator
              ? (event) => {
                  event.preventDefault();
                  const currentIndicator = dragIndicator ?? indicator;
                  dragOffsetRef.current =
                    event.clientX -
                    (tabContainerRef.current?.getBoundingClientRect().left ?? 0) -
                    currentIndicator.left;
                  setDragIndicator(currentIndicator);
                  setIsDraggingIndicator(true);
                }
              : undefined
          }
        />

        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            data-tab={tab}
            onClick={() => onChange(tab)}
            className={`relative z-10 py-1 px-4 rounded-lg text-[13px] font-medium transition-colors duration-300 text-center ${
              activeTab === tab
                ? "text-white"
                : "text-[#818181] hover:text-gray-900 font-[500]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
  );
}
