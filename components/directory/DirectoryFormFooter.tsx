"use client";

import React from "react";
import Button from "@/components/Button";

type DirectoryFormMode = "create" | "edit" | "view";

interface DirectoryFormFooterProps {
  mode: DirectoryFormMode;
  onClose: () => void;
  onUpdate?: () => void;
  updateLabel?: string;
  isSubmitting?: boolean;
  submittingLabel?: string;
}

const DirectoryFormFooter: React.FC<DirectoryFormFooterProps> = ({
  mode,
  onClose,
  onUpdate,
  updateLabel = "Update",
  isSubmitting = false,
  submittingLabel = "Saving...",
}) => {
  return (
    <div className="z-30 shrink-0 border-t border-gray-200 bg-white px-4 py-3">
      <div className="flex justify-end gap-2">
        {mode === "view" ? (
          <Button
            text="Close"
            onClick={onClose}
            bgColor="bg-white"
            textColor="text-gray-700"
            className="rounded-[15px] border border-gray-300 px-4 py-2 hover:bg-gray-100"
          />
        ) : mode === "edit" ? (
          <>
            <Button
              text="Cancel"
              onClick={onClose}
              bgColor="bg-white"
              textColor="text-[#7135AD]"
              className="rounded-[15px] border border-[#7135AD] px-4 py-2 hover:bg-[#7135AD0D]"
            />
            <Button
              text={isSubmitting ? submittingLabel : updateLabel}
              onClick={onUpdate ?? (() => {})}
              disabled={isSubmitting}
              bgColor="bg-[#7135AD]"
              textColor="text-white"
              className="rounded-[15px] px-4 py-2 hover:opacity-90"
            />
          </>
        ) : (
          <>
            <Button
              text={isSubmitting ? submittingLabel : "Save Details"}
              type="submit"
              disabled={isSubmitting}
              bgColor="bg-[#7135AD]"
              textColor="text-white"
              className="rounded-[15px] px-4 py-2 hover:opacity-90"
            />
          </>
        )}
      </div>
    </div>
  );
};

export default DirectoryFormFooter;
