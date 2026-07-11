"use client";

import { CiFilter } from "react-icons/ci";

const ACTIVE = "#7135AD";
const IDLE = "#818181";

type TableFilterIconProps = {
  isActive: boolean;
  className?: string;
};

/** Table header filter icon — gray idle, purple when filter is active. */
export default function TableFilterIcon({
  isActive,
  className = "",
}: TableFilterIconProps) {
  const color = isActive ? ACTIVE : IDLE;

  return (
    <CiFilter
      className={`inline h-3 w-3 shrink-0 ${className}`}
      color={color}
      fill={color}
      stroke={color}
      style={{ color, fill: color }}
      aria-hidden
    />
  );
}
