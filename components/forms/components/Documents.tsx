"use client";

import React, { useMemo, useRef, useState } from "react";
import { MdOutlineFileUpload } from "react-icons/md";
import { FiTrash2 } from "react-icons/fi";
import { FaRegFolder } from "react-icons/fa";

export type DocumentCategory = "vendorVoucher" | "vendorInvoice";

export interface ExistingDocument {
  originalName?: string;
  fileName?: string;
  url?: string;
  key?: string;
  size?: number;
  mimeType?: string;
  uploadedAt?: string | Date;
  _id?: string;
  documentCategory?: DocumentCategory | string;
}

type ExistingDocumentBuckets = Partial<Record<DocumentCategory, ExistingDocument[]>>;

interface DocumentsProps {
  existingDocuments?: ExistingDocument[] | ExistingDocumentBuckets;
  onAddDocuments?: ((files: File[], category: DocumentCategory) => void) | undefined;
  onRemoveDocuments?: ((files: File[], category: DocumentCategory) => void) | undefined;
  isReadOnly?: boolean;
  maxDocuments?: number;
}

const DOCUMENT_SECTIONS: Array<{
  category: DocumentCategory;
  label: string;
}> = [
  { category: "vendorVoucher", label: "Vendor Voucher(s)" },
  { category: "vendorInvoice", label: "Vendor Invoice(s)" },
];

const inferDocumentCategory = (doc: ExistingDocument): DocumentCategory => {
  const category = String(doc.documentCategory ?? "").toLowerCase();
  if (category.includes("invoice")) return "vendorInvoice";
  if (category.includes("voucher")) return "vendorVoucher";

  const documentName = String(
    doc.originalName ?? doc.fileName ?? doc.key ?? "",
  ).toLowerCase();

  if (documentName.includes("invoice")) return "vendorInvoice";
  return "vendorVoucher";
};

const normalizeExistingDocuments = (
  existingDocuments: DocumentsProps["existingDocuments"],
): Record<DocumentCategory, ExistingDocument[]> => {
  if (Array.isArray(existingDocuments)) {
    return existingDocuments.reduce<Record<DocumentCategory, ExistingDocument[]>>(
      (acc, doc) => {
        acc[inferDocumentCategory(doc)].push(doc);
        return acc;
      },
      { vendorVoucher: [], vendorInvoice: [] },
    );
  }

  return {
    vendorVoucher: Array.isArray(existingDocuments?.vendorVoucher)
      ? existingDocuments.vendorVoucher
      : [],
    vendorInvoice: Array.isArray(existingDocuments?.vendorInvoice)
      ? existingDocuments.vendorInvoice
      : [],
  };
};

const Documents: React.FC<DocumentsProps> = ({
  existingDocuments = [],
  onAddDocuments,
  onRemoveDocuments,
  isReadOnly = false,
  maxDocuments = 3,
}) => {
  const voucherInputRef = useRef<HTMLInputElement | null>(null);
  const invoiceInputRef = useRef<HTMLInputElement | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<Record<DocumentCategory, File[]>>({
    vendorVoucher: [],
    vendorInvoice: [],
  });

  const existingDocumentBuckets = useMemo(
    () => normalizeExistingDocuments(existingDocuments),
    [existingDocuments],
  );

  const getInputRef = (category: DocumentCategory) =>
    category === "vendorVoucher" ? voucherInputRef : invoiceInputRef;

  const handleFileChange = (category: DocumentCategory) => {
    const inputRef = getInputRef(category);
    const files = inputRef.current?.files;
    if (!files) return;

    const selected = Array.from(files);
    const existingCount = existingDocumentBuckets[category].length;
    const uploadedCount = attachedFiles[category].length;
    const remainingSlots = maxDocuments - existingCount - uploadedCount;
    const toAdd = remainingSlots > 0 ? selected.slice(0, remainingSlots) : [];

    if (toAdd.length === 0) {
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setAttachedFiles((prev) => ({
      ...prev,
      [category]: [...prev[category], ...toAdd],
    }));
    onAddDocuments?.(toAdd, category);

    if (inputRef.current) inputRef.current.value = "";
  };

  const handleDeleteFile = (category: DocumentCategory, index: number) => {
    const removed = attachedFiles[category][index];
    setAttachedFiles((prev) => ({
      ...prev,
      [category]: prev[category].filter((_, i) => i !== index),
    }));
    if (removed) onRemoveDocuments?.([removed], category);
  };

  return (
    <div className="w-full border border-[#E2E1E1] rounded-[12px] p-3">
      <h2 className="text-[13px] font-[500] mb-2">Documents</h2>
      <hr className="mt-1 mb-3 border-t border-[#E2E1E1]" />

      <div className="flex flex-row items-start justify-between gap-8">
        {DOCUMENT_SECTIONS.map(({ category, label }) => {
          const existingFiles = existingDocumentBuckets[category];
          const uploadedFiles = attachedFiles[category];
          const totalDocumentsCount = existingFiles.length + uploadedFiles.length;
          const isDocumentLimitReached = totalDocumentsCount >= maxDocuments;

          return (
            <div key={category} className="w-full flex flex-col items-start gap-3">
              <div className="px-[10px] py-[2px] text-[#414141] text-[13px] font-[500] rounded-[6px] border border-[#E2E1E1] bg-[#F9F9F9] mb-[12px]">
                {label}
              </div>

              <input
                type="file"
                ref={getInputRef(category)}
                className="hidden"
                onChange={() => handleFileChange(category)}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.txt"
                multiple
              />

              <button
                type="button"
                onClick={() => {
                  if (isDocumentLimitReached) return;
                  getInputRef(category).current?.click();
                }}
                disabled={isDocumentLimitReached || isReadOnly}
                className="px-3 py-1 flex gap-1 bg-white text-[#7135AD] border border-[#7135AD] rounded-[10px] text-[12px] hover:cursor-pointer hover:border-[#C6AEDE] font-[600] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
              >
                <MdOutlineFileUpload size={18} /> Attach Files
              </button>

              <div className="mt-1 flex w-full flex-col gap-2">
                {existingFiles.map((doc, index) => (
                  <div
                    key={`${doc.key || doc.fileName || doc.originalName}-${index}`}
                    onClick={() => doc.url && window.open(doc.url, "_blank")}
                    className="flex items-center justify-between w-full bg-white rounded-[15px] px-3 py-2 hover:cursor-pointer transition"
                  >
                    <button
                      type="button"
                      className="text-[#7135AD] p-1.5 -ml-2 rounded-[15px] bg-[#126ACB0D] text-[13px] truncate flex items-center gap-2 hover:cursor-pointer transition-colors"
                      title="Click to view document"
                    >
                      <FaRegFolder className="text-[#7135AD] w-3 h-3" />
                      {doc.originalName || doc.fileName}
                    </button>
                  </div>
                ))}

                {uploadedFiles.map((file, index) => (
                  <div
                    key={`${category}-${file.name}-${index}`}
                    className="flex items-center justify-between w-full bg-white rounded-[15px] px-3 py-2 hover:bg-gray-50 transition"
                  >
                    <span className="text-[#7135AD] p-1.5 -ml-2 rounded-[15px] bg-[#126ACB0D] text-[13px] truncate flex items-center gap-2">
                      <FaRegFolder className="text-[#7135AD] w-3 h-3" />
                      {file.name}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleDeleteFile(category, index)}
                      className="text-[#EB382B] hover:cursor-pointer"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="text-[#EB382B] font-[500] text-[0.65rem] mt-1">
                Note: Maximum of {maxDocuments} files can be uploaded
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Documents;
