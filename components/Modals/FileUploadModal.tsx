"use client";

import React, { useState, useCallback, useRef } from "react";

// Modal Component
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  customWidth?: string;
  customeHeight?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
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
  size = "sm",
  customWidth,
  customeHeight,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  className = "",
}) => {
  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    full: "max-w-full mx-4",
  };

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  const handleEscape = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape" && closeOnEscape) {
        onClose();
      }
    },
    [onClose, closeOnEscape]
  );

  const handleOverlayClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget && closeOnOverlayClick) {
        onClose();
      }
    },
    [onClose, closeOnOverlayClick]
  );

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      if (closeOnEscape) {
        document.addEventListener("keydown", handleEscape);
      }
      return () => {
        document.body.style.overflow = "unset";
        document.removeEventListener("keydown", handleEscape);
      };
    }
    return;
  }, [isOpen, closeOnEscape, handleEscape]);

  const modalWidthClass = customWidth ? customWidth : sizeClasses[size];
  const modalHeightClass = customeHeight ? customeHeight : "";

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex justify-center items-center md:items-center transition-opacity duration-300"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      <div
        className={`
          bg-white rounded-t-2xl md:rounded-lg shadow-xl overflow-hidden
          transition-all duration-300 transform ${modalWidthClass} ${modalHeightClass}
          ${isMobile ? "absolute bottom-0 w-full" : ""}
          ${className}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between mt-3 items-center p-4">
          <h2
            id="modal-title"
            className="text-black text-xl md:text-2xl font-bold flex-1 text-center pr-2"
          >
            {title}
          </h2>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
              aria-label="Close modal"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
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
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
          {children}
        </div>
      </div>
    </div>
  );
};

// File Upload Component
interface FileUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload?: (files: File[]) => void;
  acceptedTypes?: string[];
  maxFiles?: number;
}

const FileUploadModal: React.FC<FileUploadProps> = ({
  isOpen,
  onClose,
  onUpload,
  acceptedTypes = [".pdf", ".csv", ".docx"],
  maxFiles = 5,
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState("CSV");
  const fileInputRef = useRef<HTMLInputElement>(null);

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

      const files = Array.from(e.dataTransfer.files);
      const validFiles = files.filter(validateFile).slice(0, maxFiles);
      setUploadedFiles((prev) => [...prev, ...validFiles].slice(0, maxFiles));
    },
    [maxFiles, acceptedTypes]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const files = Array.from(e.target.files);
        const validFiles = files.filter(validateFile).slice(0, maxFiles);
        setUploadedFiles((prev) => [...prev, ...validFiles].slice(0, maxFiles));
      }
    },
    [maxFiles, acceptedTypes]
  );

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleUpload = () => {
    if (uploadedFiles.length > 0) {
      console.log("Uploading files:", uploadedFiles);
      setUploadedFiles([]);
    }
  };

  const handleSaveFiles = () => {
    if (onUpload) {
      onUpload(uploadedFiles);
    }
    onClose();
  };

  const handleDownloadTemplate = () => {
    // A sample CSV template
    const csvContent = "Column1,Column2,Column3\nSample1,Sample2,Sample3";
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `template.${selectedFormat.toLowerCase()}`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upload Files"
      size="xl"
      customWidth="w-[650px]"
      className="max-w-3xl"
    >
      <div className="space-y-4 p-3 ">
        <p className="text-gray-500 text-center mb-6 -mt-8">
          Please upload the required file here
        </p>

        <div className="border border-gray-200 rounded-[12px] py-6 px-6">
          {/* Download Template Section */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2 px-4 py-2 border-2 border-[#5856D6] text-[#5856D6] rounded-lg hover:bg-blue-50 transition-colors font-medium"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Download Template
            </button>

            {/* Format Dropdown */}
            <div className="relative">
              <select
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value)}
                className="appearance-none px-4 py-2 pr-10 border-2 border-gray-300 rounded-lg bg-white cursor-pointer hover:border-gray-400 transition-colors font-medium"
              >
                <option value="CSV">CSV</option>
                <option value="PDF">PDF</option>
                <option value="DOCX">DOCX</option>
              </select>
              <svg
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>

          {/* Drag and Drop Area */}
          <div
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
            border-2 border-dashed rounded-xl p-6 mb-2 text-center transition-colors
            ${
              isDragging
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 bg-gray-50"
            }
          `}
          >
            <div className="flex flex-col items-center gap-4">
              <svg
                className="w-12 h-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <div>
                <p className="text-gray-700 font-medium mb-1">
                  Drag and drop files here
                </p>
                <p className="text-gray-500 mb-3">OR</p>
                <button
                  onClick={handleBrowseClick}
                  className="text-blue-600 hover:text-blue-700 font-medium underline"
                >
                  Browse Files
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={acceptedTypes.join(",")}
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-500 mb-3">
            Accepted File Types: {acceptedTypes.join(", ")}
          </p>

          {/* Uploaded Files List */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-2 mt-3">
              <h3 className="font-medium text-gray-700">Uploaded Files:</h3>
              {uploadedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <svg
                      className="w-5 h-5 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <span className="text-sm text-gray-700">{file.name}</span>
                    <span className="text-xs text-gray-500">
                      ({(file.size / 1024).toFixed(2)} KB)
                    </span>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
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
              ))}
            </div>
          )}

          <div className="flex justify-between pt-4 -mb-2">
            <button
              onClick={handleUpload}
              disabled={uploadedFiles.length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Upload
            </button>
          </div>
        </div>
        <div className="flex justify-end">
          <button
            onClick={handleSaveFiles}
            disabled={uploadedFiles.length === 0}
            className="px-6 py-2   bg-green-700 text-white rounded-lg hover:bg-green-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Save Uploaded Files
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default FileUploadModal;
