"use client";

import React, { useState } from "react";
import { IoLocationSharp } from "react-icons/io5";
import { FiEdit2 } from "react-icons/fi";
import ChangeRouteModal from "@/components/Modals/ChangeRouteModal";
import { TbEdit } from "react-icons/tb";

type Props = {
  city?: string;
  onChangeRoute?: () => void;
};

const RouteCard = ({ city = "DEIRA", onChangeRoute }: Props) => {
  const [isChangeRouteOpen, setIsChangeRouteOpen] = useState(false);

  return (
    <>
      <div className="rounded-[12px] border border-gray-200 bg-[#FFF7EA] px-5 py-3 shadow-sm w-full">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#FFF1E0] flex items-center justify-center">
              <IoLocationSharp className="text-[#EA580C]" size={16} />
            </div>
            <div className="text-[15px] mt-1.5 -ml-1 font-semibold text-[#EA580C]">
              {city}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              onChangeRoute?.();
              setIsChangeRouteOpen(true);
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-md bg-blue-50 text-[#126ACB] hover:bg-blue-50"
          >
            <TbEdit />
            <span className="text-[13px] font-semibold">Change Route</span>
          </button>
        </div>
      </div>

      <ChangeRouteModal
        isOpen={isChangeRouteOpen}
        onClose={() => setIsChangeRouteOpen(false)}
      />
    </>
  );
};

export default RouteCard;
