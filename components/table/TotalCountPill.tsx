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
      className={`inline-flex h-10 shrink-0 items-center gap-4 rounded-[12px] border border-[#E9CC22] bg-[#FFFBE4] px-4 font-[Poppins,sans-serif] text-[14px] leading-[24px] ${className}`}
    >
      <span className="font-[400] text-[#818181]">{label}</span>
      <span className="font-[500] text-[#414141]">{count}</span>
    </div>
  );
}
