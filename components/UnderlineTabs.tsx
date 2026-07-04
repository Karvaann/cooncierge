"use client";

type UnderlineTabsProps = {
  tabs: string[];
  activeTab: string;
  onChange: (tab: string) => void;
  totalCount: number;
  totalLabel?: string;
  className?: string;
  tabClassName?: string;
  indicatorClassName?: string;
};

export default function UnderlineTabs({
  tabs,
  activeTab,
  onChange,
  className = "",
  tabClassName = "",
  indicatorClassName = "",
}: UnderlineTabsProps) {
  return (
    <div
      className={`relative flex items-end border-b border-[#E5E7EB] ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab;

        return (
          <button
            key={tab}
            type="button"
            onClick={() => onChange(tab)}
            className={`relative shrink-0 px-6 py-[12px] text-[13.5px] font-[500] transition-colors duration-200 ${tabClassName} ${
              isActive
                ? "text-[#7135AD]"
                : "text-[#818181] hover:text-[#5F5F5F]"
            }`}
          >
            {tab}
            <span
              aria-hidden="true"
              className={`absolute bottom-[-1px] left-0 right-0 z-10 h-[2px] bg-[#7C3AED] transition-opacity duration-200 ${indicatorClassName} ${
                isActive ? "opacity-100" : "opacity-0"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}
