"use client";

import { useMemo } from "react";
import { MdKeyboardArrowDown, MdKeyboardArrowUp } from "react-icons/md";

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

export default function BaggageCounters({
  cabinPcs,
  cabinWt,
  checkInPcs,
  checkInWt,
  onChange,
}: Props) {
  const cabinPcsNum = useMemo(() => toInt(cabinPcs), [cabinPcs]);
  const checkInPcsNum = useMemo(() => toInt(checkInPcs), [checkInPcs]);

  const Control = ({
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
  }) => {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-md px-0">
          <input
            type="text"
            value={String(pcs)}
            readOnly
            className="w-5 text-center text-[0.75rem] bg-transparent outline-none"
          />
          <div className="flex flex-col border border-black rounded-sm overflow-hidden">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onInc();
              }}
              className="p-0.5 border-b border-black"
            >
              <MdKeyboardArrowUp size={14} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDec();
              }}
              className="p-0.5"
            >
              <MdKeyboardArrowDown size={14} />
            </button>
          </div>
        </div>

        <span className="text-[0.75rem] font-medium text-gray-700">Pcs</span>

        <input
          type="text"
          value={wt == null ? "" : String(wt)}
          onChange={(e) => onWtChange(e.target.value)}
          placeholder="Wt."
          className="w-10 px-2 py-1 border border-gray-300 rounded-md text-[0.75rem] outline-none"
        />
        <span className="text-[0.75rem] font-medium text-gray-700">Kgs</span>
      </div>
    );
  };

  return (
    <div className="pt-1">
      <div className="flex items-center justify-between">
        <span className="text-[0.75rem] font-medium text-gray-600">Cabin</span>
        <span className="text-[0.75rem] font-medium text-gray-600">
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
