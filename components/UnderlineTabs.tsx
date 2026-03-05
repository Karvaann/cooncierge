"use client";

import { useLayoutEffect, useRef, useState } from "react";

type UnderlineTabsProps = {
  tabs: string[];
  activeTab: string;
  onChange: (tab: string) => void;
  totalCount: number;
  totalLabel?: string;
  className?: string;
};

export default function UnderlineTabs({
  tabs,
  activeTab,
  onChange,
}: UnderlineTabsProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicatorStyle, setIndicatorStyle] = useState<{
    width: number;
    left: number;
  }>({
    width: 0,
    left: 0,
  });

  useLayoutEffect(() => {
    const updateIndicator = () => {
      const activeTabNode = tabRefs.current[activeTab];
      const containerNode = containerRef.current;

      if (!activeTabNode || !containerNode) return;

      const containerRect = containerNode.getBoundingClientRect();
      const activeTabRect = activeTabNode.getBoundingClientRect();

      setIndicatorStyle({
        width: activeTabRect.width,
        left: activeTabRect.left - containerRect.left,
      });
    };

    updateIndicator();
    window.addEventListener("resize", updateIndicator);

    return () => window.removeEventListener("resize", updateIndicator);
  }, [activeTab, tabs]);

  return (
    <div ref={containerRef} className="relative flex items-end border-b border-[#E5E7EB]">
      {tabs.map((tab) => {
        const isActive = activeTab === tab;

        return (
          <button
            key={tab}
            ref={(node) => {
              tabRefs.current[tab] = node;
            }}
            type="button"
            onClick={() => onChange(tab)}
            className={`relative py-[12px] px-6 text-[13px] font-[400] transition-colors duration-200 ${
              isActive
                ? "text-[#7135AD]"
                : "text-[#818181] hover:text-[#5F5F5F]"
            }`}
          >
            {tab}
          </button>
        );
      })}

      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 h-[2px] bg-[#7C3AED] transition-[transform,width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"
        style={{
          width: `${indicatorStyle.width}px`,
          transform: `translateX(${indicatorStyle.left}px)`,
        }}
      />
    </div>
  );
}
