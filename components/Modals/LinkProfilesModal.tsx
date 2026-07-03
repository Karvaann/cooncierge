"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { CiSearch } from "react-icons/ci";
import { MdOutlineKeyboardArrowDown } from "react-icons/md";
import Modal from "../Modal";

export type LinkProfileSource = {
  profileType: "Customer" | "Vendor" | "Traveller";
  id: string;
  name: string;
  nickname?: string;
  tier?: number;
};

interface LinkProfilesModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceProfile?: LinkProfileSource | null;
  initialTargetProfileType?: "Customer" | "Vendor" | "Traveller";
}

const TIER_LABELS: Record<number, string> = {
  1: "Tier I",
  2: "Tier II",
  3: "Tier III",
};

const PROFILE_TYPE_OPTIONS = ["Customer", "Vendor", "Traveller"] as const;

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return `${parts[0]!.charAt(0).toUpperCase()}.`;
  return `${parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join(".")}.`;
};

const LinkProfilesModal: React.FC<LinkProfilesModalProps> = ({
  isOpen,
  onClose,
  sourceProfile,
  initialTargetProfileType,
}) => {
  const [targetProfileType, setTargetProfileType] = useState("");
  const [targetNameId, setTargetNameId] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setTargetProfileType("");
      setTargetNameId("");
      return;
    }

    if (initialTargetProfileType) {
      setTargetProfileType(initialTargetProfileType);
    }
  }, [isOpen, initialTargetProfileType]);

  const handleLink = () => {
    console.log("Linking profiles:", {
      source: sourceProfile,
      target: { type: targetProfileType, nameId: targetNameId },
    });
    onClose();
  };

  const nickname =
    sourceProfile?.nickname || getInitials(sourceProfile?.name ?? "");
  const tier = Math.min(Math.max(sourceProfile?.tier ?? 1, 1), 3);
  const tierLabel = TIER_LABELS[tier] ?? `Tier ${tier}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Link Profiles"
      subtitle="Link one profile with another here"
      size="lg"
      customWidth="w-[820px]"
      showCloseButton={true}
      zIndexClass="z-[1200]"
    >
      <div className="border-t border-[#ECECEC] pt-5">
        <div className="relative grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Source profile */}
          <div className="space-y-4">
            <div>
              <label className="mb-2 block font-[Poppins,sans-serif] text-[13px] font-medium text-[#414141]">
                Profile Type
              </label>
              <div className="rounded-[10px] border border-[#E2E1E1] bg-[#FAFAFA] px-3 py-2.5 font-[Poppins,sans-serif] text-[13px] text-[#414141]">
                {sourceProfile?.profileType ?? "Customer"}
              </div>
            </div>

            <div>
              <label className="mb-2 block font-[Poppins,sans-serif] text-[13px] font-medium text-[#414141]">
                Name/ID
              </label>
              <div className="rounded-[10px] border border-[#E2E1E1] bg-white px-3 py-2.5">
                {sourceProfile ? (
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-[Poppins,sans-serif] text-[13px]">
                    <span className="font-medium text-[#020202]">
                      {sourceProfile.name}
                    </span>
                    <span className="text-[#C9CCCE]">|</span>
                    <span className="text-[#414141]">{sourceProfile.id}</span>
                    {nickname ? (
                      <>
                        <span className="text-[#C9CCCE]">|</span>
                        <span className="text-[#414141]">{nickname}</span>
                      </>
                    ) : null}
                    <span className="text-[#C9CCCE]">|</span>
                    <span className="inline-flex items-center gap-1.5 text-[#414141]">
                      <Image
                        src={`/icons/tier-${tier}.svg`}
                        alt={tierLabel}
                        width={16}
                        height={16}
                        className="h-4 w-4 object-contain"
                        unoptimized
                      />
                      {tierLabel}
                    </span>
                  </div>
                ) : (
                  <span className="font-[Poppins,sans-serif] text-[13px] text-[#818181]">
                    —
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Center link icon */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:flex">
            <Image
              src="/icons/link-icon.svg"
              alt=""
              width={18}
              height={18}
              className="h-[18px] w-[18px] object-contain opacity-70"
              unoptimized
            />
          </div>

          {/* Target profile */}
          <div className="space-y-4">
            <div>
              <label className="mb-2 block font-[Poppins,sans-serif] text-[13px] font-medium text-[#414141]">
                Profile Type
              </label>
              <div className="relative">
                <select
                  value={targetProfileType}
                  onChange={(e) => setTargetProfileType(e.target.value)}
                  className="w-full appearance-none rounded-[10px] border border-[#E2E1E1] bg-white px-3 py-2.5 pr-10 font-[Poppins,sans-serif] text-[13px] text-[#414141] focus:border-[#7135AD] focus:outline-none focus:ring-1 focus:ring-[#7135AD]"
                >
                  <option value="">Select Profile Type</option>
                  {PROFILE_TYPE_OPTIONS.filter(
                    (type) => type !== sourceProfile?.profileType,
                  ).map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <MdOutlineKeyboardArrowDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#818181]" />
              </div>
            </div>

            <div>
              <label className="mb-2 block font-[Poppins,sans-serif] text-[13px] font-medium text-[#414141]">
                Name/ID
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={targetNameId}
                  onChange={(e) => setTargetNameId(e.target.value)}
                  placeholder="Enter Name/ID/Nickname"
                  className="w-full rounded-[10px] border border-[#E2E1E1] bg-white px-3 py-2.5 pr-10 font-[Poppins,sans-serif] text-[13px] text-[#414141] placeholder:text-[#818181] focus:border-[#7135AD] focus:outline-none focus:ring-1 focus:ring-[#7135AD]"
                />
                <CiSearch className="pointer-events-none absolute right-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#818181]" />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={handleLink}
            className="rounded-[10px] bg-[#7135AD] px-5 py-2 font-[Poppins,sans-serif] text-[13px] font-medium text-white transition-colors hover:bg-[#5C2B8E]"
          >
            Link Profiles
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default LinkProfilesModal;
