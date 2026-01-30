"use client";

import React, { useState } from "react";
import { IoLocationSharp } from "react-icons/io5";
import { FiEdit2 } from "react-icons/fi";
import ChangeRouteModal from "@/components/Modals/ChangeRouteModal";

type Props = {
  city?: string;
  pickupPoint?: string;
  dropPoint?: string;
  onChangeRoute?: () => void;
};

const PickupDropCard = ({
  city = "DEIRA",
  pickupPoint = "Dubai International Airport",
  dropPoint = "Dubai International Airport",
  onChangeRoute,
}: Props) => {
  const [isChangeRouteOpen, setIsChangeRouteOpen] = useState(false);

  return (
    <>
      <div className="rounded-[12px] border border-gray-200 bg-[#FFF7EA] px-5 py-4 shadow-sm w-full">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#FFF1E0] flex items-center justify-center">
              <IoLocationSharp className="text-[#EA580C]" size={16} />
            </div>
            <div>
              <div className="text-[13px] font-semibold text-[#EA580C]">
                {city}
              </div>
              <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="text-[11px] text-gray-500 font-semibold">
                    PICKUP POINT
                  </div>
                  <div className="text-[14px] text-[#020202] font-medium mt-1">
                    {pickupPoint}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-gray-500 font-semibold">
                    DROP POINT
                  </div>
                  <div className="text-[14px] text-[#020202] font-medium mt-1">
                    {dropPoint}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              onChangeRoute?.();
              setIsChangeRouteOpen(true);
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-md bg-white border border-blue-100 text-blue-600 hover:bg-blue-50"
          >
            <FiEdit2 />
            <span className="text-sm font-semibold">Change Route</span>
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

export default PickupDropCard;
