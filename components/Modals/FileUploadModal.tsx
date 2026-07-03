"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { LuTrash2 } from "react-icons/lu";
import { MdOutlineKeyboardArrowDown } from "react-icons/md";
import {
  downloadBulkTemplate,
  uploadBulkCustomers,
  uploadBulkVendors,
  downloadBulkVendorTemplate,
  uploadBulkTeams,
  downloadBulkTeamTemplate,
} from "@/services/uploadApi";
import {
  overlayTransitionClass,
  useOverlayAnimation,
} from "@/hooks/useOverlayAnimation";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  className?: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  title = "Modal Title",
  subtitle,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  className = "",
}) => {
  const { shouldRender, isVisible } = useOverlayAnimation(isOpen);

  const handleEscape = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape" && closeOnEscape) {
        onClose();
      }
    },
    [onClose, closeOnEscape],
  );

  const handleOverlayClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget && closeOnOverlayClick) {
        onClose();
      }
    },
    [onClose, closeOnOverlayClick],
  );

  useEffect(() => {
    const cleanup = () => {
      document.body.style.overflow = "unset";
      document.removeEventListener("keydown", handleEscape);
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      if (closeOnEscape) {
        document.addEventListener("keydown", handleEscape);
      }
    }
    return cleanup;
  }, [isOpen, closeOnEscape, handleEscape]);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 ${overlayTransitionClass} ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      <div
        className={`flex w-[min(700px,calc(100vw-2rem))] max-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-[24px] border border-[#E2E1E1] bg-white p-6 shadow-xl md:h-[495px] md:w-[700px] md:max-h-[495px] ${overlayTransitionClass} ${className} ${
          isVisible
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-2 scale-[0.98] opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative shrink-0">
          <h2
            id="modal-title"
            className="text-center text-[18px] font-semibold text-[#020202]"
          >
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 text-center text-[13px] font-normal text-[#818181]">
              {subtitle}
            </p>
          )}
          {showCloseButton && (
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
          )}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto pt-5">{children}</div>
      </div>
    </div>
  );
};

function UploadCloudIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M32 34H16C12.6863 34 10 31.3137 10 28C10 25.0416 12.0416 22.6667 14.8 22.1333C15.5467 17.6 19.4667 14 24 14C28.5333 14 32.4533 17.6 33.2 22.1333C35.9584 22.6667 38 25.0416 38 28C38 31.3137 35.3137 34 32 34Z"
        stroke="#7135AD"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M24 22V30"
        stroke="#7135AD"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M20 26L24 22L28 26"
        stroke="#7135AD"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DownloadTemplateIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M8 2.5V9"
        stroke="#126ACB"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M5.5 6.5L8 9L10.5 6.5"
        stroke="#126ACB"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.5 12.5H12.5"
        stroke="#126ACB"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M4.5 10.5V12.5"
        stroke="#126ACB"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M11.5 10.5V12.5"
        stroke="#126ACB"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

interface FileUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload?: (files: File[]) => void;
  acceptedTypes?: string[];
  maxFiles?: number;
  entity?: "customer" | "vendor" | "team" | "booking";
}

const FileUploadModal: React.FC<FileUploadProps> = ({
  isOpen,
  onClose,
  onUpload,
  acceptedTypes = [".xlsx", ".csv"],
  maxFiles = 5,
  entity = "customer",
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState("CSV");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setUploadedFiles([]);
      setUploadError(null);
      setIsDragging(false);
      setIsUploading(false);
    }
  }, [isOpen]);

  const handleSaveFiles = async () => {
    if (uploadedFiles.length === 0) return;

    const firstFile = uploadedFiles[0];
    if (!firstFile) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      if (entity === "booking") {
        setUploadError("Upload API is not available for bookings yet.");
        setIsUploading(false);
        return;
      }
      const result =
        entity === "vendor"
          ? await uploadBulkVendors(firstFile)
          : entity === "team"
            ? await uploadBulkTeams(firstFile)
            : await uploadBulkCustomers(firstFile);

      onUpload?.(uploadedFiles);
      setUploadedFiles([]);
      setIsUploading(false);
      onClose();
      return result;
    } catch (error: unknown) {
      console.error("Upload error:", error);
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Upload failed";
      setUploadError(message);
      setIsUploading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    const format = selectedFormat.toLowerCase();

    if (format === "pdf" || format === "docx") {
      alert("Only CSV or XLSX templates available.");
      return;
    }

    if (entity === "booking") {
      alert("Template is not available for bookings yet.");
      return;
    }

    const allowedFormat = format === "csv" ? "csv" : "xlsx";
    if (entity === "vendor") {
      await downloadBulkVendorTemplate(allowedFormat);
    } else if (entity === "team") {
      await downloadBulkTeamTemplate(allowedFormat);
    } else {
      await downloadBulkTemplate(allowedFormat);
    }
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const validateFile = (file: File): boolean => {
    const extension = "." + file.name.split(".").pop()?.toLowerCase();
    return acceptedTypes.includes(extension);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (uploadedFiles.length >= maxFiles) return;

      const files = Array.from(e.dataTransfer.files);
      const validFiles = files.filter(validateFile).slice(0, maxFiles);
      setUploadedFiles((prev) => [...prev, ...validFiles].slice(0, maxFiles));
    },
    [maxFiles, uploadedFiles.length],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (uploadedFiles.length >= maxFiles) return;
      if (e.target.files) {
        const files = Array.from(e.target.files);
        const validFiles = files.filter(validateFile).slice(0, maxFiles);
        setUploadedFiles((prev) => [...prev, ...validFiles].slice(0, maxFiles));
      }
      e.target.value = "";
    },
    [maxFiles, uploadedFiles.length],
  );

  const handleBrowseClick = () => {
    if (uploadedFiles.length >= maxFiles) return;
    fileInputRef.current?.click();
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const dropZoneDisabled = uploadedFiles.length >= maxFiles;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upload"
      subtitle="Please upload the required file(s) here"
    >
      <div className="flex h-full min-h-0 flex-col">
        <div className="min-h-0 flex-1 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex h-[45px] w-full max-w-[282px] items-stretch overflow-hidden rounded-[16px] border border-[#E2E1E1] bg-white md:w-[282px]">
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="group flex flex-1 items-center justify-center gap-2 whitespace-nowrap px-3 font-[Poppins,sans-serif] text-[14px] font-medium leading-[24px] tracking-[0] text-[#126ACB] transition-colors hover:bg-[#F0F6FD]"
            >
              <DownloadTemplateIcon />
              <span className="group-hover:underline">Download Template</span>
            </button>

            <div className="w-px shrink-0 self-stretch bg-[#E2E1E1]" aria-hidden />

            <div className="relative flex w-[76px] shrink-0 items-center">
              <select
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value)}
                className="h-[45px] w-full cursor-pointer appearance-none bg-white py-0 pl-3 pr-8 text-center font-[Poppins,sans-serif] text-[14px] font-medium leading-[24px] tracking-[0] text-[#020202] transition-colors hover:bg-[#FAFAFA]"
              >
                <option value="CSV">CSV</option>
                <option value="XLSX">XLSX</option>
              </select>
              <MdOutlineKeyboardArrowDown
                className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[#818181]"
                aria-hidden
              />
            </div>
          </div>

          <button
            type="button"
            className="text-[13px] font-medium text-[#818181] underline underline-offset-2 transition-colors hover:text-[#414141]"
          >
            Past Uploads
          </button>
        </div>

        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`rounded-[12px] border-2 border-dashed px-6 py-10 text-center transition-colors ${
            dropZoneDisabled
              ? "cursor-not-allowed border-[#E2E1E1] bg-[#FAFAFA] opacity-60"
              : isDragging
                ? "border-[#7135AD] bg-[#FAF7FD]"
                : "border-[#D1D5DB] bg-white"
          }`}
        >
          <div className="flex flex-col items-center gap-3">
            <UploadCloudIcon />
            <div className="space-y-1">
              <p className="text-[14px] font-medium text-[#020202]">
                {dropZoneDisabled
                  ? "Maximum files selected"
                  : "Choose a file or drag & drop it here"}
              </p>
              <p className="text-[12px] text-[#818181]">
                PDF, CSV and DOCX, up to 50KB
              </p>
            </div>
            <button
              type="button"
              onClick={handleBrowseClick}
              disabled={dropZoneDisabled}
              className="mt-1 rounded-[8px] border border-[#7135AD] bg-white px-5 py-2 text-[13px] font-medium text-[#7135AD] transition-colors hover:bg-[#FAF7FD] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Browse File
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple={maxFiles > 1}
              accept={acceptedTypes.join(",")}
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>

        {uploadError && (
          <p className="text-center text-[13px] text-[#DD1425]">{uploadError}</p>
        )}

        {uploadedFiles.length > 0 && (
          <div className="space-y-2">
            {uploadedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between rounded-[8px] border border-[#E2E1E1] bg-[#FAFAFA] px-3 py-2"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span className="truncate text-[13px] text-[#414141]">
                    {file.name}
                  </span>
                  <span className="shrink-0 text-[12px] text-[#818181]">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="shrink-0 p-1 text-[#818181] transition-colors hover:text-[#DD1425]"
                  aria-label={`Remove ${file.name}`}
                >
                  <LuTrash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
        </div>

        <div className="flex shrink-0 justify-end pt-1">
          <button
            type="button"
            onClick={handleSaveFiles}
            disabled={uploadedFiles.length === 0 || isUploading}
            className={`rounded-[10px] px-5 py-2.5 text-[14px] font-medium text-white transition-colors ${
              uploadedFiles.length === 0 || isUploading
                ? "cursor-not-allowed bg-[#C9A8E8]"
                : "bg-[#7135AD] hover:bg-[#5C2B8E]"
            }`}
          >
            {isUploading ? "Uploading..." : "Save File(s)"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default FileUploadModal;
