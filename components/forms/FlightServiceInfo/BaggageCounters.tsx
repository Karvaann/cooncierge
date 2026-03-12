"use client";

import { useMemo } from "react";
import { MdKeyboardArrowDown, MdKeyboardArrowUp } from "react-icons/md";
import { allowOnlyNumbers } from "@/utils/inputValidators";

type Value = number | string | undefined | null;

type Props = {
  cabinPcs: Value;
  cabinWt: Value;
  checkInPcs: Value;
  checkInWt: Value;
  onChange: (patch: {
    cabinBaggagePcs?: number;
    cabinBaggageWt?: string;
    checkInBaggagePcs?: number;
    checkInBaggageWt?: string;
  }) => void;
};

const toInt = (v: Value) => {
  const n = parseInt(String(v ?? "0"), 10);
  return Number.isFinite(n) ? n : 0;
};

function Control({
  pcs,
  wt,
  onInc,
  onDec,
  onWtChange,
}: {
  pcs: number;
  wt: Value;
  onInc: () => void;
  onDec: () => void;
  onWtChange: (next: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-[7px] px-0">
        <input
          type="text"
          value={String(pcs)}
          readOnly
          className="w-5 text-center text-[0.75rem] bg-transparent placeholder:text-[#9CA3AF] outline-none"
        />
        <div className="flex flex-col border border-[#7135AD] rounded-tr-[7px] rounded-br-[7px] overflow-hidden">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onInc();
            }}
            className="p-0.5 h-[16px] bg-[#F7EFFF] border-b border-[#7135AD]"
          >
            <MdKeyboardArrowUp size={14} className="text-[#7135AD]" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDec();
            }}
            className="p-0.5 bg-[#F7EFFF]"
          >
            <MdKeyboardArrowDown size={14} className="text-[#7135AD]" />
          </button>
        </div>
      </div>

      <span className="text-[0.75rem] font-[400] text-[#020202]">Pcs</span>

      <input
        type="text"
        inputMode="decimal"
        value={wt == null ? "" : String(wt)}
        onChange={(e) => {
          const sanitized = e.target.value.replace(/[^0-9.]/g, "");
          onWtChange(allowOnlyNumbers(sanitized));
        }}
        placeholder="Wt."
        className="w-10 px-2.5 py-1.5 border border-gray-300 rounded-[9px] text-[0.75rem] placeholder:text-[#9CA3AF] outline-none"
      />
      <span className="text-[0.75rem] font-[400] text-[#020202]">Kgs</span>
    </div>
  );
}

export default function BaggageCounters({
  cabinPcs,
  cabinWt,
  checkInPcs,
  checkInWt,
  onChange,
}: Props) {
  const cabinPcsNum = useMemo(() => toInt(cabinPcs), [cabinPcs]);
  const checkInPcsNum = useMemo(() => toInt(checkInPcs), [checkInPcs]);

  return (
    <div className="pt-1">
      <div className="flex items-center justify-between">
        <span className="text-[0.75rem] font-[500] text-[#414141]">Cabin</span>
        <span className="text-[0.75rem] mr-28 font-[500] text-[#414141]">
          Check-In
        </span>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-3">
        <Control
          pcs={cabinPcsNum}
          wt={cabinWt}
          onInc={() => onChange({ cabinBaggagePcs: cabinPcsNum + 1 })}
          onDec={() =>
            onChange({ cabinBaggagePcs: Math.max(0, cabinPcsNum - 1) })
          }
          onWtChange={(next) => onChange({ cabinBaggageWt: next })}
        />

        <Control
          pcs={checkInPcsNum}
          wt={checkInWt}
          onInc={() => onChange({ checkInBaggagePcs: checkInPcsNum + 1 })}
          onDec={() =>
            onChange({ checkInBaggagePcs: Math.max(0, checkInPcsNum - 1) })
          }
          onWtChange={(next) => onChange({ checkInBaggageWt: next })}
        />
      </div>
    </div>
  );
}