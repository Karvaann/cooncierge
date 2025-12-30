"use client";

import React, { useState } from "react";
import Link from "next/link";
import CompanyDetails from "./_components/companyDetails";
import AllUsers from "./_components/AllUsers";
import Approvals from "./_components/Approvals";
import { MdKeyboardArrowLeft } from "react-icons/md";
import { IoHomeOutline } from "react-icons/io5";
import { TbBuildingSkyscraper } from "react-icons/tb";
import { LuUsers } from "react-icons/lu";
import { TbCheckbox } from "react-icons/tb";
import { TbReceipt } from "react-icons/tb";
import { TbWorld } from "react-icons/tb";
import { TbSpeakerphone } from "react-icons/tb";
import { PiHeadsetBold } from "react-icons/pi";
import type { IconType } from "react-icons";

const nav: {
  title: string;
  items: { label: string; href: string; icon?: IconType }[];
}[] = [
  {
    title: "Profile",
    items: [
      {
        label: "Company Details",
        href: "#company",
        icon: TbBuildingSkyscraper,
      },
      { label: "All Users / Roles", href: "#users", icon: LuUsers },
    ],
  },
  {
    title: "Modules",
    items: [{ label: "Approvals", href: "#approvals", icon: TbCheckbox }],
  },
  {
    title: "Others",
    items: [
      { label: "Billing", href: "#billing", icon: TbReceipt },
      { label: "Social Links", href: "#social", icon: TbWorld },
      { label: "Referral", href: "#referral", icon: TbSpeakerphone },
      { label: "Support", href: "#support", icon: PiHeadsetBold },
    ],
  },
];

export default function SettingsPage() {
  const [selected, setSelected] = useState<string>("company");

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="hidden md:block w-[200px] shrink-0 bg-white">
        <div className="  py-[14px] px-[14px]">
          <Link
            href="/bookings/other-services"
            className="text-[13px] flex items-center text-[#020202] font-[400] gap-[10px] hover:underline"
          >
            <MdKeyboardArrowLeft className=" text-[#020202]" /> Back to Home
          </Link>
        </div>
        <hr className="border-t border-gray-200" />

        <nav aria-label="Settings navigation">
          {nav.map((section) => (
            <div
              style={{ paddingBottom: "0px" }}
              key={section.title}
              className="px-[14px] py-[14px]"
            >
              <div className="text-sm text-gray-400 mb-2">{section.title}</div>
              <ul className="space-y-0.5">
                {section.items.map((it) => (
                  <li key={it.label}>
                    {it.label === "Company Details" ? (
                      <button
                        type="button"
                        onClick={() => setSelected("company")}
                        className={`flex w-full items-center gap-2 py-1 px-2 rounded hover:bg-[#F9F9F9] text-gray-600 text-sm ${
                          selected === "company" ? "bg-gray-100" : ""
                        }`}
                      >
                        <span className="w-4 text-center font-normal text-[#020202] text-[13px]">
                          {it.icon
                            ? React.createElement(it.icon, {
                                className: "w-[14px] h-[14px]",
                              })
                            : "•"}
                        </span>
                        <span className="font-[400] text-[#020202] text-[12px]">
                          {it.label}
                        </span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSelected(it.label)}
                        className={`flex w-full items-center gap-2 py-1 px-2 rounded hover:bg-[#F9F9F9] text-gray-600 text-[13px] ${
                          selected === it.label ? "bg-gray-100" : ""
                        }`}
                      >
                        <span className="w-4 text-center font-normal text-[#020202] text-[13px]">
                          {it.icon
                            ? React.createElement(it.icon, {
                                className: "w-[14px] h-[14px]",
                              })
                            : "•"}
                        </span>
                        <span className="font-[400] text-[#020202] text-[12px]">
                          {it.label}
                        </span>
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      <main className="flex-1 min-w-0 w-full px-5 py-2 bg-gray-100">
        {/* BREADCRUMB */}
        <div className="flex items-center text-[11px] text-gray-500 mb-1">
          <span className="text-[#0D4B37] font-medium">
            <IoHomeOutline className="w-[18px] text-[#114958]" />
          </span>
          <span className="mx-1">/</span>
          <span className="text-[#0D4B37] font-[400]">Settings</span>
        </div>
        <div className="bg-white rounded-lg p-[18px] shadow-sm border border-gray-100 w-full">
          <div>
            {selected === "company" ? (
              <CompanyDetails />
            ) : selected === "All Users / Roles" ? (
              <AllUsers />
            ) : selected === "Approvals" ? (
              <Approvals />
            ) : (
              <div className="h-64 rounded-md border border-gray-100 bg-white flex items-center justify-center text-gray-400">
                Right-side content placeholder — create the per-option layouts
                here.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
