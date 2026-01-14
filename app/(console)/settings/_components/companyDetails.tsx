"use client";

import React, { useEffect, useState, useRef } from "react";
import { MdOutlineAddAPhoto } from "react-icons/md";
import { LuEye } from "react-icons/lu";
import { FiTrash2 } from "react-icons/fi";
import DropDown from "../../../../components/DropDown";
import { AuthApi } from "../../../../services/authApi";
import SuccessPopupModal from "../../../../components/popups/BookingPopups/SuccessPopupModal";
import {
  allowOnlyNumbers,
  allowOnlyText,
  allowOnly10Digits,
  isValidWebsite,
  isValidEmail,
} from "@/utils/inputValidators";
import ErrorToast from "@/components/ErrorToast";

export default function CompanyDetails() {
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [altContact, setAltContact] = useState("");
  const [website, setWebsite] = useState("");
  const [currency, setCurrency] = useState("INR");
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showError, setShowError] = useState<{
    show: boolean;
    message: string;
  }>({
    show: false,
    message: "",
  });
  const showErrorToast = (message: string) => {
    setShowError({ show: true, message });
  };

  useEffect(() => {
    // Prefill from localStorage first, then refresh from API if possible
    if (typeof window === "undefined") return;
    const storedUser = window.localStorage.getItem("user");
    let bId: string | null = null;
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser as string);

        // Normalize business id: user.businessId may be an object or string,

        const rawBiz = user?.businessId ?? user?.business ?? null;
        if (rawBiz) {
          if (typeof rawBiz === "string") {
            bId = rawBiz;
          } else if (rawBiz._id) {
            bId = String(rawBiz._id);
          } else {
            // fallback to string coercion
            bId = String(rawBiz);
          }
        }

        setBusinessId(bId);

        const business =
          user?.business ??
          (user?.businessId && typeof user.businessId !== "string"
            ? user.businessId
            : null);
        if (business) {
          setLogoUrl(
            business.profileImage?.url ||
              business.logo ||
              business.logoUrl ||
              null
          );
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
    const fetchBusiness = async () => {
      try {
        const res = await AuthApi.getCompanyDetails();
        if (res && res.success && res.business) {
          const business = res.business as any;
          setLogoUrl(
            business.profileImage?.url ||
              business.logo ||
              business.logoUrl ||
              null
          );
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

    // fetch latest business details from server
    fetchBusiness();
  }, []);

  const handlePhotoClick = () => {
    // allow local preview selection only; no upload integration here
    if (!isUploading) fileRef.current?.click();
  };

  const handleView = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (typeof window === "undefined") return;
    if (!logoUrl) return;
    try {
      window.open(logoUrl, "_blank");
    } catch (err) {
      // ignore
    }
  };

  const handleDelete = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setLogoUrl(null);
    setSelectedFile(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // create a local preview and store the selected file
    const preview = URL.createObjectURL(file);
    setLogoUrl(preview);
    setSelectedFile(file);
  };

  const handleSave = async () => {
    if (!businessId) return;
    // Validate email format
    if (companyEmail && !isValidEmail(String(companyEmail))) {
      showErrorToast("Email format is invalid");
      return;
    }
    if (website && !isValidWebsite(website)) {
      showErrorToast("Website URL format is invalid");
      return;
    }
    try {
      // If a new file was selected, upload it first
      if (selectedFile) {
        setIsUploading(true);
        try {
          const uploadRes = await AuthApi.uploadCompanyLogo(selectedFile);
          if (uploadRes && uploadRes.success && uploadRes.profileImage?.url) {
            setLogoUrl(uploadRes.profileImage.url);

            // persist profileImage to localStorage user.business
            if (typeof window !== "undefined") {
              const stored = localStorage.getItem("user");
              if (stored) {
                try {
                  const user = JSON.parse(stored as string);
                  user.business = user.business || {};
                  user.business.profileImage = uploadRes.profileImage;
                  localStorage.setItem("user", JSON.stringify(user));
                } catch (e) {}
              }
            }
          } else {
            console.error(
              "Upload did not return expected profileImage",
              uploadRes
            );
          }
        } catch (err) {
          console.error("Failed to upload company logo:", err);
        } finally {
          setIsUploading(false);
          setSelectedFile(null);
          if (fileRef.current) fileRef.current.value = "";
        }
      }

      const payload = {
        businessName: companyName,
        phone: companyPhone,
        email: companyEmail,
        website: website,
        settings: { defaultCurrency: currency },
      } as any;

      const res = await AuthApi.updateCompanyDetails(payload);

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
        setShowSuccessModal(true);
      } else {
        console.error("Failed to update business", res);
      }
    } catch (err) {
      console.error("Failed to update business:", err);
    }
  };

  return (
    <>
      <h2 className="text-[15px] font-[600] mb-[14px]">Company Details</h2>

      <div className="bg-white rounded-lg border border-gray-200 p-0 overflow-hidden">
        <div className="grid grid-cols-14 gap-0">
          <div className="col-span-3 bg-[#F8F8F8] px-6 py-6 border border-gray-200 flex items-center justify-center ">
            <label className="text-[14px] font-[500] text-[#414141]">
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
                  <div className="w-24 h-24 rounded-md bg-gray-100 group-hover:bg-gray-50 transition-colors flex flex-col items-center justify-center text-gray-500">
                    <MdOutlineAddAPhoto className="w-6 h-6 mb-1" />
                    <div className="text-sm">Add Photo</div>
                  </div>
                )}

                {logoUrl && (
                  <div className="absolute inset-0 rounded-md flex items-center justify-center pointer-events-none">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity w-full h-full rounded-md bg-white/10 group-hover:bg-white/30 flex items-center justify-center pointer-events-auto">
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleView(e);
                          }}
                          aria-label="View logo"
                          className="p-2 bg-white/90 hover:bg-white text-gray-700 rounded-md shadow flex items-center justify-center"
                        >
                          <LuEye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePhotoClick();
                          }}
                          aria-label="Edit logo"
                          className="p-2 bg-white/90 hover:bg-white text-gray-700 rounded-md shadow flex items-center justify-center"
                        >
                          <FiTrash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Company Name */}
        <div className="grid grid-cols-14 border-t border-gray-200">
          <div className="col-span-3 bg-[#F8F8F8] px-6 py-6 border border-gray-200 flex items-center justify-center">
            <label className="text-[14px] font-[500] text-[#414141]">
              Company Name
            </label>
          </div>
          <div className="col-span-9 px-6 py-6 bg-white">
            <input
              type="text"
              placeholder="Enter Company Name"
              value={companyName}
              onChange={(e) => setCompanyName(allowOnlyText(e.target.value))}
              className="w-full px-5 py-3 text-[14px] h-10 border border-gray-300 hover:border-green-300 focus:border-green-300 rounded-md"
            />
          </div>
        </div>

        {/* Company Phone */}
        <div className="grid grid-cols-14 border-t border-gray-200">
          <div className="col-span-3 bg-[#F8F8F8] px-6 py-6 border border-gray-200 flex items-center justify-center">
            <label className="text-[14px] font-[500] text-[#414141]">
              Company Phone
            </label>
          </div>
          <div className="col-span-9 px-6 py-6 bg-white flex items-center justify-center">
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
              onChange={(e) =>
                setCompanyPhone(allowOnly10Digits(e.target.value))
              }
              className="flex-1 px-5 py-3 h-10 text-[14px] border border-gray-300 rounded-md hover:border-green-300 focus:border-green-300"
            />
          </div>
        </div>

        {/* Company Email */}
        <div className="grid grid-cols-14 border-t border-gray-200">
          <div className="col-span-3 bg-[#F8F8F8] px-6 py-6 border border-gray-200 flex items-center justify-center">
            <label className="text-[14px] font-[500] text-[#414141]">
              Company Email
            </label>
          </div>
          <div className="col-span-9 px-6 py-6 bg-white">
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
        <div className="grid grid-cols-14 border-t border-gray-200">
          <div className="col-span-3 bg-[#F8F8F8] px-6 py-6 border border-gray-200 flex items-center justify-center">
            <label className="text-[14px] font-[500] text-[#414141]">
              Alternative Contact Number
            </label>
          </div>
          <div className="col-span-9 px-6 py-6 bg-white flex items-center justify-center">
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
              onChange={(e) => setAltContact(allowOnly10Digits(e.target.value))}
              className="flex-1 px-5 py-3 text-[14px] h-10 border border-gray-300 rounded-md hover:border-green-300 focus:border-green-300"
            />
          </div>
        </div>

        {/* Website */}
        <div className="grid grid-cols-14 border-t border-gray-100">
          <div className="col-span-3 bg-[#F8F8F8] px-6 py-6 border border-gray-100 flex items-center justify-center">
            <label className="text-[14px] font-[500] text-[#414141]">
              Website
            </label>
          </div>
          <div className="col-span-9 px-6 py-6 bg-white">
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
        <div className="grid grid-cols-14 border-t border-gray-100">
          <div className="col-span-3 bg-[#F8F8F8] px-6 py-6 border border-gray-100 flex items-center justify-center">
            <label className="text-[14px] font-[500] text-[#414141]">
              Default Currency
            </label>
          </div>
          <div className="col-span-9 px-6 py-6 bg-white">
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
      <SuccessPopupModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title={"Company Details have been successfully saved & updated!"}
      />
      <ErrorToast
        visible={showError.show}
        message={showError.message}
        onClose={() => setShowError({ show: false, message: "" })}
      />
    </>
  );
}
