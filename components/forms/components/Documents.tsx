"use client";

import React, { useRef, useState } from "react";
import { MdOutlineFileUpload } from "react-icons/md";
import { FiTrash2 } from "react-icons/fi";
import { FaRegFolder } from "react-icons/fa";

export interface ExistingDocument {
  originalName?: string;
  fileName?: string;
  url?: string;
  key?: string;
  size?: number;
  mimeType?: string;
  uploadedAt?: string | Date;
  _id?: string;
}

interface DocumentsProps {
  existingDocuments?: ExistingDocument[];
  onAddDocuments?: ((files: File[]) => void) | undefined;
  onRemoveDocuments?: ((files: File[]) => void) | undefined;
  isReadOnly?: boolean;
  maxDocuments?: number;
}

const Documents: React.FC<DocumentsProps> = ({
  existingDocuments = [],
  onAddDocuments,
  onRemoveDocuments,
  isReadOnly = false,
  maxDocuments = 3,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  const existingDocumentsCount = Array.isArray(existingDocuments)
    ? existingDocuments.length
    : 0;
  const totalDocumentsCount = existingDocumentsCount + attachedFiles.length;
  const isDocumentLimitReached = totalDocumentsCount >= maxDocuments;

  const handleFileChange = () => {
    const files = fileInputRef.current?.files;
    if (!files) return;

    const selected = Array.from(files);
    const remainingSlots = maxDocuments - totalDocumentsCount;
    const toAdd = remainingSlots > 0 ? selected.slice(0, remainingSlots) : [];

    if (toAdd.length === 0) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setAttachedFiles((prev) => [...prev, ...toAdd]);
    onAddDocuments?.(toAdd);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDeleteFile = (index: number) => {
    const removed = attachedFiles[index];
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
    if (removed) onRemoveDocuments?.([removed]);
  };

  return (
    <div className="w-full border border-[#E2E1E1] rounded-[12px] p-3">
      <h2 className="text-[13px] font-[500] mb-2">Documents</h2>
      <hr className="mt-1 mb-3 border-t border-[#E2E1E1]" />

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.txt"
        multiple
      />

      <button
        type="button"
        onClick={() => {
          if (isDocumentLimitReached) return;
          fileInputRef.current?.click();
        }}
        disabled={isDocumentLimitReached || isReadOnly}
        className="px-3 py-1 flex gap-1 bg-white text-[#7135AD] border border-[#7135AD] rounded-[10px] text-[12px] hover:cursor-pointer hover:border-[#C6AEDE] font-[600] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
      >
        <MdOutlineFileUpload size={18} /> Attach Files
      </button>

      {/* Preview Files */}
      <div className="mt-1 flex flex-col gap-2">
        {Array.isArray(existingDocuments) &&
          existingDocuments.length > 0 &&
          existingDocuments.map((doc, i) => (
            <div
              key={`${doc.key || doc.fileName || doc.originalName}-${i}`}
              onClick={() => doc.url && window.open(doc.url, "_blank")}
              className="flex items-center justify-between w-full bg-white rounded-[15px] px-3 py-2 hover:cursor-pointer transition"
            >
              <button
                type="button"
                className="text-[#7135AD] p-1.5 -ml-2 rounded-[15px] bg-[#126ACB0D] text-[13px] truncate flex items-center gap-2 hover:cursor-pointer transition-colors cursor-pointer"
                title="Click to view document"
              >
                <FaRegFolder className="text-[#7135AD] w-3 h-3" />
                {doc.originalName || doc.fileName}
              </button>
            </div>
          ))}

        {attachedFiles.map((file, i) => (
          <div
            key={i}
            className="flex items-center justify-between w-full bg-white rounded-[15px] px-3 py-2 hover:bg-gray-50 transition"
          >
            <span className="text-[#7135AD] p-1.5 -ml-2 rounded-[15px] bg-[#126ACB0D] text-[13px] truncate flex items-center gap-2">
              <FaRegFolder className="text-[#7135AD] w-3 h-3" />
              {file.name}
            </span>

            <button
              type="button"
              onClick={() => handleDeleteFile(i)}
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
};

export default Documents;