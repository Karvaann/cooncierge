"use client";

import React, { useState } from "react";
import Link from "next/link";
import CompanyDetails from "./_components/companyDetails";
import AllUsers from "./_components/AllUsers";
import Approvals from "./_components/Approvals";
import { MdKeyboardArrowLeft } from "react-icons/md";
import { IoHomeOutline } from "react-icons/io5";

const nav = [
  {
    title: "Profile",
    items: [
      { label: "Company Details", href: "#company" },
      { label: "All Users / Roles", href: "#users" },
    ],
  },
  {
    title: "Modules",
    items: [{ label: "Approvals", href: "#approvals" }],
  },
  {
    title: "Others",
    items: [
      { label: "Billing", href: "#billing" },
      { label: "Social Links", href: "#social" },
      { label: "Referral", href: "#referral" },
      { label: "Support", href: "#support" },
    ],
  },
];

export default function SettingsPage() {
  const [selected, setSelected] = useState<string>("company");

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="hidden md:block w-60 shrink-0 bg-white py-5 px-1">
        <div className="mb-5 items-center ml-6">
          <Link
            href="/bookings/other-services"
            className="text-sm text-black flex gap-2 hover:underline"
          >
            <MdKeyboardArrowLeft className=" text-black mt-0.5" /> Back to Home
          </Link>
        </div>
        <hr className="mb-4 -mt-2 border-t border-gray-200" />

        <nav aria-label="Settings navigation">
          {nav.map((section) => (
            <div key={section.title} className="mb-6 px-3 ml-3">
              <div className="text-sm text-gray-400 uppercase mb-2">
                {section.title}
              </div>
              <ul className="space-y-0.5">
                {section.items.map((it) => (
                  <li key={it.label}>
                    {it.label === "Company Details" ? (
                      <button
                        type="button"
                        onClick={() => setSelected("company")}
                        className={`flex w-full items-center gap-2 py-1 px-2 rounded hover:bg-gray-100 text-gray-600 text-sm ${
                          selected === "company" ? "bg-gray-100" : ""
                        }`}
                      >
                        <span className="w-4 text-center text-gray-400 text-sm">
                          •
                        </span>
                        <span>{it.label}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSelected(it.label)}
                        className={`flex w-full items-center gap-2 py-1 px-2 rounded hover:bg-gray-100 text-gray-600 text-sm ${
                          selected === it.label ? "bg-gray-100" : ""
                        }`}
                      >
                        <span className="w-4 text-center text-gray-400 text-sm">
                          •
                        </span>
                        <span>{it.label}</span>
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      <main className="flex-1 min-w-0 w-full px-6 py-4 bg-gray-100">
        {/* BREADCRUMB */}
        <div className="flex items-center text-[12px] text-gray-500 mb-1">
          <span className="text-[#114958] font-medium">
            <IoHomeOutline className="w-[14px] h-5 mr-1 -mt-1 text-[#114958]" />
          </span>
          <span className="mx-1">/</span>
          <span className="text-[#114958] font-medium">Settings</span>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 w-full">
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
