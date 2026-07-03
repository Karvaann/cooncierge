"use client";

import { useEffect, useMemo, useState } from "react";
import { MdOutlineKeyboardArrowDown } from "react-icons/md";
import {
  overlayTransitionClass,
  useOverlayAnimation,
} from "@/hooks/useOverlayAnimation";
import {
  exportCSV,
  exportPDF,
  exportDOCX,
  exportXLSX,
} from "@/utils/exportUtils";
import { DeletableItem } from "./DeleteModal";
import { MODAL_FIELD_INPUT_CLASS } from "../atoms/modalFieldStyles";

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: DeletableItem[];
  entity: "customer" | "vendor" | "team" | "traveller";
}

const ENTITY_LABELS: Record<DownloadModalProps["entity"], string> = {
  customer: "customers",
  traveller: "travellers",
  vendor: "vendors",
  team: "team",
};

const DownloadModal: React.FC<DownloadModalProps> = ({
  isOpen,
  onClose,
  items,
  entity,
}) => {
  const { shouldRender, isVisible } = useOverlayAnimation(isOpen);
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setFileName("");
      setFileType("");
    }
  }, [isOpen]);

  const subtitle = useMemo(
    () => `Download (${items.length}) ${ENTITY_LABELS[entity]} data`,
    [items.length, entity],
  );

  const formatDataForExport = () => {
    if (entity === "customer") {
      return items.map((item) => ({
        "Customer ID": item.id,
        Name: item.name,
        Owner: item.owner,
        Rating: item.rating,
        "Date Modified": item.dateModified,
      }));
    }

    if (entity === "traveller") {
      return items.map((item) => ({
        "Traveller ID": item.id,
        Name: item.name,
        Owner: item.owner,
        "Last Modified": item.dateModified,
      }));
    }

    if (entity === "vendor") {
      return items.map((item) => ({
        "Vendor ID": item.id,
        "Vendor Name": item.vendorName,
        POC: item.poc,
        Rating: item.rating,
        "Date Modified": item.dateModified,
      }));
    }

    if (entity === "team") {
      return items.map((item) => ({
        ID: item.id,
        "Member Name": item.memberName,
        Alias: item.alias,
        "User Status": item.userStatus,
        "Joining Date": item.joiningDate,
      }));
    }

    return [];
  };

  const handleDownload = () => {
    if (!fileName.trim() || !fileType) return;

    const formattedData = formatDataForExport();

    if (fileType === "csv") exportCSV(formattedData, fileName);
    if (fileType === "pdf") exportPDF(formattedData, fileName);
    if (fileType === "docx") exportDOCX(formattedData, fileName);
    if (fileType === "xlsx") exportXLSX(formattedData, fileName);

    onClose();
  };

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 ${overlayTransitionClass} ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="download-modal-title"
    >
      <div
        className={`w-[min(480px,calc(100vw-2rem))] rounded-[24px] border border-[#E2E1E1] bg-white p-6 shadow-xl ${overlayTransitionClass} ${
          isVisible
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-2 scale-[0.98] opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative mb-6">
          <h2
            id="download-modal-title"
            className="text-center font-[Poppins,sans-serif] text-[18px] font-semibold text-[#020202]"
          >
            Download
          </h2>
          <p className="mt-1 text-center font-[Poppins,sans-serif] text-[13px] font-normal text-[#818181]">
            {subtitle}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-0 top-0 rounded-full p-1 text-[#818181] transition-colors hover:bg-[#F3F3F3] hover:text-[#414141]"
            aria-label="Close modal"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-5">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="download-file-name"
              className="font-[Poppins,sans-serif] text-[14px] font-medium leading-[24px] text-[#020202]"
            >
              File Name
            </label>
            <input
              id="download-file-name"
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="Enter file name"
              className={`h-11 ${MODAL_FIELD_INPUT_CLASS} px-4 font-[Poppins,sans-serif] text-[14px] text-[#020202] placeholder:text-[#818181]`}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="download-file-type"
              className="font-[Poppins,sans-serif] text-[14px] font-medium leading-[24px] text-[#020202]"
            >
              File Type
            </label>
            <div className="relative">
              <select
                id="download-file-type"
                value={fileType}
                onChange={(e) => setFileType(e.target.value)}
                className={`h-11 ${MODAL_FIELD_INPUT_CLASS} appearance-none px-4 pr-10 font-[Poppins,sans-serif] text-[14px] ${
                  fileType ? "text-[#020202]" : "text-[#818181]"
                }`}
              >
                <option value="">Select File Type</option>
                <option value="pdf">PDF</option>
                <option value="csv">CSV</option>
                <option value="docx">DOCX</option>
                <option value="xlsx">XLSX</option>
              </select>
              <MdOutlineKeyboardArrowDown
                className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#818181]"
                aria-hidden
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={handleDownload}
            disabled={!fileName.trim() || !fileType}
            className={`rounded-[10px] px-5 py-2.5 font-[Poppins,sans-serif] text-[14px] font-medium text-white transition-colors ${
              !fileName.trim() || !fileType
                ? "cursor-not-allowed bg-[#C9A8E8]"
                : "bg-[#7135AD] hover:bg-[#5C2B8E]"
            }`}
          >
            Download
          </button>
        </div>
      </div>
    </div>
  );
};

export default DownloadModal;
