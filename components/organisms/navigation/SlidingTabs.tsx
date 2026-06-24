"use client";

import { useEffect, useRef, useState } from "react";

interface SlidingTabsProps {
  tabs: string[];
  activeTab: string;
  onChange: (tab: string) => void;
  containerClassName?: string;
  tabClassName?: string;
  activeTabClassName?: string;
  inactiveTabClassName?: string;
  indicatorClassName?: string;
}

export default function SlidingTabs({
  tabs,
  activeTab,
  onChange,
  containerClassName = "",
  tabClassName = "",
  activeTabClassName = "text-white",
  inactiveTabClassName = "text-[#818181] hover:text-gray-900",
  indicatorClassName = "absolute top-1/2 h-[calc(100%-0.60rem)] -translate-y-1/2 rounded-[8px] bg-[#0D4B37] shadow-sm transition-all duration-300 ease-in-out",
}: SlidingTabsProps) {
  const tabsContainerRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicatorStyle, setIndicatorStyle] = useState({ width: 0, left: 0 });

  useEffect(() => {
    const updateIndicator = () => {
      const activeIndex = tabs.indexOf(activeTab);
      const activeEl = tabRefs.current[activeIndex];
      const container = tabsContainerRef.current;

      if (!activeEl || !container) {
        return;
      }

      const { width, left } = activeEl.getBoundingClientRect();
      const containerLeft = container.getBoundingClientRect().left;
      setIndicatorStyle({ width, left: left - containerLeft });
    };

    updateIndicator();
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [activeTab, tabs]);

  return (
    <div
      className={`relative flex items-center gap-[36px] rounded-[10px] bg-[#F3F3F3] p-1 ${containerClassName}`}
      ref={tabsContainerRef}
      role="tablist"
      aria-label="View tabs"
    >
      <div
        className={indicatorClassName}
        style={{
          width:
            indicatorStyle.width > 0
              ? `${indicatorStyle.width}px`
              : `calc((100% - 3.25rem) / ${Math.max(tabs.length, 1)})`,
          left: `${indicatorStyle.left}px`,
        }}
      />

      {tabs.map((tab, idx) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={`relative z-10 flex-1 rounded-[8px] px-[12px] py-[6px] text-[14px] font-medium transition-colors duration-300 ${tabClassName} ${
            activeTab === tab ? activeTabClassName : inactiveTabClassName
          }`}
          ref={(el) => {
            tabRefs.current[idx] = el;
          }}
          role="tab"
          aria-selected={activeTab === tab}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
