"use client";

import React, { useEffect, useState, useRef } from "react";
import { MdOutlineAddAPhoto } from "react-icons/md";
import DropDown from "../../../../components/DropDown";
import BusinessApi from "../../../../services/businessApi";

export default function CompanyDetails() {
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [altContact, setAltContact] = useState("");
  const [website, setWebsite] = useState("");
  const [currency, setCurrency] = useState("INR");
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // Prefill from localStorage first, then refresh from API if possible
    if (typeof window === "undefined") return;
    const storedUser = window.localStorage.getItem("user");
    let bId: string | null = null;
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser as string);
        bId = (user && (user.businessId || user.business?._id)) || null;
        setBusinessId(bId);

        const business = (user && user.business) || null;
        if (business) {
          setLogoUrl(business.logo || null);
          setCompanyName(business.businessName || "");
          setCompanyPhone(business.phone || "");
          setCompanyEmail(business.email || "");
          setWebsite(business.website || "");
          setCurrency(
            (business.settings && business.settings.defaultCurrency) || "INR"
          );
        }
      } catch (e) {
        // ignore
      }
    }

    // Fetch fresh business data from API and overwrite fields if available
    const fetchBusiness = async (id: string) => {
      try {
        const res = await BusinessApi.get(id);
        if (res && res.success && res.business) {
          const business = res.business as any;
          setLogoUrl(business.logo || null);
          setCompanyName(business.businessName || "");
          setCompanyPhone(business.phone || "");
          setCompanyEmail(business.email || "");
          setWebsite(business.website || "");
          setCurrency(
            (business.settings && business.settings.defaultCurrency) || "INR"
          );
        }
      } catch (e) {
        // ignore fetch errors
      }
    };

    if (bId) fetchBusiness(bId);
  }, []);

  const handlePhotoClick = () => {
    // allow local preview selection only; no upload integration here
    if (!isUploading) fileRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const preview = URL.createObjectURL(file);
    setLogoUrl(preview);
    // Revoke preview blob URL on next change or when component unmounts.
    setTimeout(() => URL.revokeObjectURL(preview), 10000);
  };

  const handleSave = async () => {
    if (!businessId) return;
    try {
      const payload = {
        businessName: companyName,
        phone: companyPhone,
        email: companyEmail,
        website: website,
        // leave logo field untouched here — upload handled separately later
        settings: { defaultCurrency: currency },
      } as any;
      const res = await BusinessApi.update(businessId, payload);

      if (res && res.success) {
        // Update localStorage user.business so UI reflects changes
        if (typeof window !== "undefined") {
          const stored = localStorage.getItem("user");
          if (stored) {
            try {
              const user = JSON.parse(stored as string);
              user.business = res.business || { ...user.business, ...payload };
              localStorage.setItem("user", JSON.stringify(user));
            } catch (e) {
              // ignore JSON errors
            }
          }
        }
      } else {
        console.error("Failed to update business", res);
      }
    } catch (err) {
      console.error("Failed to update business:", err);
    }
  };

  return (
    <>
      <h2 className="text-lg font-semibold mb-4 -mt-1">Company Details</h2>

      <div className="bg-white rounded-lg border border-gray-100 p-0 overflow-hidden">
        <div className="grid grid-cols-12 gap-0">
          <div className="col-span-3 bg-[#F8F8F8] px-6 py-6 border border-gray-100 flex items-center justify-center ">
            <label className="text-base font-semibold text-[#414141]">
              Company Logo
            </label>
          </div>
          <div className="col-span-9 px-6 py-4 bg-white">
            <div className="flex items-center gap-6">
              <div
                className={`relative group ${
                  isUploading ? "cursor-wait" : "cursor-pointer"
                }`}
                onClick={handlePhotoClick}
              >
                <input
                  type="file"
                  ref={fileRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />

                {logoUrl ? (
                  <div className="w-24 h-24 rounded-md overflow-hidden border border-gray-100">
                    <img
                      src={logoUrl}
                      alt="Logo"
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-md bg-gray-100 flex flex-col items-center justify-center text-gray-500">
                    <MdOutlineAddAPhoto className="w-6 h-6 mb-1" />
                    <div className="text-sm">Add Photo</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Company Name */}
        <div className="grid grid-cols-12 border-t border-gray-100">
          <div className="col-span-3 bg-[#F8F8F8] px-6 py-6 border border-gray-100 flex items-center justify-center">
            <label className="text-base font-semibold text-[#414141]">
              Company Name
            </label>
          </div>
          <div className="col-span-9 px-6 py-4 bg-white">
            <input
              type="text"
              placeholder="Enter Company Name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-5 py-3 text-[14px] h-10 border border-gray-300 hover:border-green-300 focus:border-green-300 rounded-md"
            />
          </div>
        </div>

        {/* Company Phone */}
        <div className="grid grid-cols-12 border-t border-gray-100">
          <div className="col-span-3 bg-[#F8F8F8] px-6 py-6 border border-gray-100 flex items-center justify-center">
            <label className="text-base font-semibold text-[#414141]">
              Company Phone
            </label>
          </div>
          <div className="col-span-9 px-6 py-4 bg-white flex items-center justify-center">
            <DropDown
              options={[
                { value: "+91", label: "+91" },
                { value: "+1", label: "+1" },
                { value: "+44", label: "+44" },
              ]}
              value={countryCode}
              onChange={(v) => setCountryCode(v)}
              customWidth="w-20 gap-1"
              customHeight="px-5 py-3 h-10"
            />
            <input
              value={companyPhone}
              placeholder="Enter Company Phone"
              type="text"
              onChange={(e) => setCompanyPhone(e.target.value)}
              className="flex-1 px-5 py-3 h-10 text-[14px] border border-gray-300 rounded-md hover:border-green-300 focus:border-green-300"
            />
          </div>
        </div>

        {/* Company Email */}
        <div className="grid grid-cols-12 border-t border-gray-100">
          <div className="col-span-3 bg-[#F8F8F8] px-6 py-6 border border-gray-100 flex items-center justify-center">
            <label className="text-base font-semibold text-[#414141]">
              Company Email
            </label>
          </div>
          <div className="col-span-9 px-6 py-4 bg-white">
            <input
              type="email"
              placeholder="Enter Company Email"
              value={companyEmail}
              onChange={(e) => setCompanyEmail(e.target.value)}
              className="w-full px-5 py-5 text-[14px] h-10 border border-gray-300 rounded-md hover:border-green-300 focus:border-green-300"
            />
          </div>
        </div>

        {/* Alternative Contact */}
        <div className="grid grid-cols-12 border-t border-gray-100">
          <div className="col-span-3 bg-[#F8F8F8] px-6 py-6 border border-gray-100 flex items-center justify-center">
            <label className="text-base font-semibold text-[#414141]">
              Alternative Contact Number
            </label>
          </div>
          <div className="col-span-9 px-6 py-4 bg-white flex items-center justify-center">
            <DropDown
              options={[
                { value: "+91", label: "+91" },
                { value: "+1", label: "+1" },
                { value: "+44", label: "+44" },
              ]}
              value={countryCode}
              onChange={(v) => setCountryCode(v)}
              customWidth="w-20 gap-1"
              customHeight="px-5 py-3 h-10"
            />
            <input
              placeholder="Enter Alternative Contact Number"
              type="text"
              value={altContact}
              onChange={(e) => setAltContact(e.target.value)}
              className="flex-1 px-5 py-3 text-[14px] h-10 border border-gray-300 rounded-md hover:border-green-300 focus:border-green-300"
            />
          </div>
        </div>

        {/* Website */}
        <div className="grid grid-cols-12 border-t border-gray-100">
          <div className="col-span-3 bg-[#F8F8F8] px-6 py-6 border border-gray-100 flex items-center justify-center">
            <label className="text-base font-semibold text-[#414141]">
              Website
            </label>
          </div>
          <div className="col-span-9 px-6 py-4 bg-white">
            <input
              type="text"
              placeholder="Enter Website URL"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="w-full px-5 py-3 h-10 text-[14px] border border-gray-300 rounded-md hover:border-green-300 focus:border-green-300"
            />
          </div>
        </div>

        {/* Default Currency */}
        <div className="grid grid-cols-12 border-t border-gray-100">
          <div className="col-span-3 bg-[#F8F8F8] px-6 py-6 border border-gray-100 flex items-center justify-center">
            <label className="text-base font-semibold text-[#414141]">
              Default Currency
            </label>
          </div>
          <div className="col-span-9 px-6 py-4 bg-white">
            <DropDown
              options={[
                { value: "INR", label: "Indian Rupee (INR)" },
                { value: "GBP", label: "British Pound (GBP)" },
                { value: "USD", label: "US Dollar (USD)" },
              ]}
              value={currency}
              onChange={(v) => setCurrency(v)}
              customWidth="w-full"
              customHeight="px-5 py-3 h-10"
            />
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          className="px-3.5 py-2 bg-[#0D4B37] text-[13px] text-white rounded-md hover:bg-emerald-700"
        >
          Save & Update
        </button>
      </div>
    </>
  );
}
