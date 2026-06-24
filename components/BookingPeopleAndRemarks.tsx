"use client";

import React, { useMemo, useState } from "react";
import { FiMail, FiPhoneCall, FiUser } from "react-icons/fi";

type Traveller = {
  name: string;
  phone: string;
  email: string;
};

type Props = {
  className?: string;
  initialRemarks?: string;
  onRemarksChange?: (value: string) => void;
  travellerData?: {
    lead: Traveller;
    others: Traveller[];
  };
  customerData?: Traveller;
  vendorData?: Traveller;
};

const BookingPeopleAndRemarks = ({
  className,
  initialRemarks = "",
  onRemarksChange,
  travellerData: travellerDataProp,
  customerData: customerDataProp,
  vendorData: vendorDataProp,
}: Props) => {
  const profileTabs = useMemo(
    () => ["Traveller", "Customer", "Vendor"] as const,
    [],
  );
  type ProfileTab = (typeof profileTabs)[number];
  const [activeProfileTab, setActiveProfileTab] =
    useState<ProfileTab>("Traveller");
  const [isTravellersExpanded, setIsTravellersExpanded] = useState(false);
  const [remarks, setRemarks] = useState(initialRemarks);

  const travellerData = useMemo(
    () =>
      travellerDataProp ?? {
        lead: {
          name: "Mr. Vijay Shekhawat",
          phone: "+91-9878987657",
          email: "vijay.s@gmail.com",
        },
        others: [
          {
            name: "Ms. Riya Sharma",
            phone: "+91-9878901234",
            email: "riya.s@gmail.com",
          },
          {
            name: "Mr. Aditya Verma",
            phone: "+91-9899912345",
            email: "aditya.v@gmail.com",
          },
        ],
      },
    [travellerDataProp],
  );

  const customerData = useMemo(
    () =>
      customerDataProp ?? {
        name: "Cooncierge Demo Customer",
        phone: "+91-9000000001",
        email: "customer@demo.com",
      },
    [customerDataProp],
  );

  const vendorData = useMemo(
    () =>
      vendorDataProp ?? {
        name: "Skyline Travels (Vendor)",
        phone: "+91-9000000002",
        email: "vendor@demo.com",
      },
    [vendorDataProp],
  );

  const renderProfileCard = (
    label: string,
    name: string,
    phone: string,
    email: string,
  ) => {
    return (
      <div className="flex items-center justify-between px-4 py-3 rounded-[12px] border border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#E8F9F7] border border-green-700 flex items-center justify-center">
            <FiUser className="text-green-700" size={16} />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="text-[14px] font-semibold text-[#020202]">
              {name}
            </div>
            <div className="text-[12px] text-gray-500">({label})</div>
          </div>
        </div>

        <div className="flex items-center gap-6 text-gray-700">
          <div className="flex items-center gap-2 text-[13px]">
            <FiPhoneCall className="text-gray-500" />
            <span className="text-gray-700">{phone}</span>
          </div>
          <div className="flex items-center gap-2 text-[13px]">
            <FiMail className="text-gray-500" />
            <span className="text-gray-700">{email}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={className}>
      {/* TRAVELLER / CUSTOMER / VENDOR */}
      <div className="rounded-[12px] border border-gray-200 bg-white overflow-hidden">
        <div className="px-5 py-4">
          <div className="inline-flex mb-3 rounded-lg border border-gray-200">
            {profileTabs.map((type) => (
              <button
                key={type}
                onClick={() => setActiveProfileTab(type)}
                className={`px-3 py-1.5 text-[0.7rem] font-medium transition-colors rounded-lg
				${
          activeProfileTab === type
            ? "bg-[#E8F9F7] text-green-700 font-semibold border border-green-700"
            : "bg-transparent text-gray-700"
        }`}
                type="button"
              >
                {type}
              </button>
            ))}
          </div>

          {activeProfileTab === "Traveller" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                {renderProfileCard(
                  "Lead Pax",
                  travellerData.lead.name,
                  travellerData.lead.phone,
                  travellerData.lead.email,
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="text-[14px] font-semibold text-[#020202]">
                  All Travellers ({1 + travellerData.others.length})
                </div>
                <button
                  type="button"
                  onClick={() => setIsTravellersExpanded((p) => !p)}
                  className="w-9 h-9 rounded-md border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50"
                  aria-label="Toggle travellers"
                >
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className={`w-5 h-5 transition-transform ${
                      isTravellersExpanded ? "rotate-180" : "rotate-0"
                    }`}
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>

              {isTravellersExpanded && (
                <div className="space-y-2">
                  {[travellerData.lead, ...travellerData.others].map(
                    (t, idx) => (
                      <div key={`${t.email}-${idx}`}>
                        {renderProfileCard(
                          idx === 0 ? "Lead Pax" : `Traveller ${idx + 1}`,
                          t.name,
                          t.phone,
                          t.email,
                        )}
                      </div>
                    ),
                  )}
                </div>
              )}
            </div>
          )}

          {activeProfileTab === "Customer" && (
            <div className="space-y-3">
              {renderProfileCard(
                "Primary Contact",
                customerData.name,
                customerData.phone,
                customerData.email,
              )}
            </div>
          )}

          {activeProfileTab === "Vendor" && (
            <div className="space-y-3">
              {renderProfileCard(
                "Primary Contact",
                vendorData.name,
                vendorData.phone,
                vendorData.email,
              )}
            </div>
          )}
        </div>
      </div>

      {/* REMARKS */}
      <div className="rounded-[12px] border border-gray-200 bg-white overflow-hidden mt-4">
        <div className="px-5 py-4">
          <h3 className="text-[16px] font-semibold text-[#020202]">Remarks</h3>
        </div>
        <div className="border-t border-gray-200" />
        <div className="p-5">
          <textarea
            value={remarks}
            onChange={(e) => {
              const next = e.target.value;
              setRemarks(next);
              onRemarksChange?.(next);
            }}
            placeholder="Enter Remarks"
            className="w-full min-h-[120px] text-[13px] py-3 px-4 rounded-[10px] border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-900 text-gray-700 bg-white"
          />
        </div>
      </div>
    </div>
  );
};

export default BookingPeopleAndRemarks;
