"use client";

import { useRouter } from "next/navigation";

type DirectoryTravellersToggleProps = {
  /** True when the user is on the travellers directory page */
  isTravellersView: boolean;
};

export default function DirectoryTravellersToggle({
  isTravellersView,
}: DirectoryTravellersToggleProps) {
  const router = useRouter();

  const handleToggle = () => {
    router.push(
      isTravellersView ? "/directory/customers" : "/directory/travellers",
    );
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className="flex cursor-pointer items-center gap-[6px] px-1 py-1"
      aria-pressed={isTravellersView}
      aria-label={isTravellersView ? "Hide Travellers" : "Show Travellers"}
    >
      <span
        className={`relative inline-flex h-5 w-8 shrink-0 items-center rounded-full transition-colors duration-200 ${
          isTravellersView ? "bg-[#7135AD]" : "bg-[#C9CCCE]"
        }`}
        aria-hidden
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            isTravellersView ? "translate-x-[14px]" : "translate-x-[2px]"
          }`}
        />
      </span>
      <span className="whitespace-nowrap text-[12px] font-[400] text-[#414141]">
        {isTravellersView ? "Hide Travellers" : "Show Travellers"}
      </span>
    </button>
  );
}
