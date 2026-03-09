"use client";

import React from "react";
import Image from "next/image";

interface Pill {
  label: string;
  icon?: React.ReactNode;
}

interface ChooseBookingTypeCardProps {
  title: string;
  description: string;
  pills: Pill[];
  image: string;
  showMore?: boolean;
  moreCount?: string;
  onProceed: () => void;
}

export default function ChooseBookingTypeCard({
  title,
  description,
  pills,
  image,
  showMore = false,
  moreCount = "& more",
  onProceed,
}: ChooseBookingTypeCardProps) {
  return (
    <div
      className="relative rounded-[24px] border border-[#CCD0DB] bg-white px-[24px] py-[18px] transition-all duration-200 hover:border-[4px] hover:border-[#7135AD33] hover:px-[22px] hover:py-[21px]"
      style={{ boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.06)" }}
    >
      <div className="flex items-start gap-4">
        {/* Left content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-[20px] font-[400] text-[#020202]">{title}</h3>
          <p className="mt-5 text-[14px] font-[400] text-[#818181]">
            {description}
          </p>

          {/* Pills */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {pills.map((pill, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-2 rounded-full border border-[#7135AD] px-3 py-1.5 text-[12px] font-[400] text-[#7135AD]"
              >
                {pill.icon && (
                  <span className="flex items-center text-[#7135AD]">
                    {pill.icon}
                  </span>
                )}
                {pill.label}
              </span>
            ))}
            {showMore && (
              <span className="text-[12px] font-[400] text-[#7135AD] underline">
                {moreCount}
              </span>
            )}
          </div>
        </div>

        {/* Right image */}
        <div className="shrink-0">
          <Image
            src={image}
            alt={title}
            width={130}
            height={120}
            className="object-contain"
          />
        </div>
      </div>

      {/* button */}
      <div className="mt-4 flex justify-end">
        <button
          onClick={onProceed}
          className="group inline-flex items-center gap-1.5 rounded-[12px] bg-[#7135AD] px-[14px] py-[9px] text-[14px] font-[500] text-white hover:cursor-pointer transition-all duration-300"
        >
          Proceed to Create
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 12 8"
            fill="none"
            className="ml-1 w-3 h-[8px] transition-all duration-200 group-hover:w-4"
          >
            <path
              d="M0.75 3.75H11.25M11.25 3.75L8.25 6.75M11.25 3.75L8.25 0.75"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
