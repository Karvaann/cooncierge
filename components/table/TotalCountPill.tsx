type TotalCountPillProps = {
  count: number;
  label?: string;
  className?: string;
};

export default function TotalCountPill({
  count,
  label = "Total",
  className = "",
}: TotalCountPillProps) {
  return (
    <div
      className={`inline-flex h-10 shrink-0 items-center gap-4 rounded-[12px] border border-[#E9CC22] bg-[#FFFBE4] px-4 font-[Poppins,sans-serif] ${className}`}
    >
      <span className="text-[14px] font-[400] leading-[20px] text-[#818181]">
        {label}
      </span>
      <span className="text-[14px] font-[500] leading-[20px] text-[#414141]">
        {count}
      </span>
    </div>
  );
}
