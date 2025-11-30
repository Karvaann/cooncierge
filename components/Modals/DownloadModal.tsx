import { useState } from "react";
import Modal from "../Modal";
import {
  exportCSV,
  exportPDF,
  exportDOCX,
  exportXLSX,
} from "@/utils/exportUtils";
import { DeletableItem } from "./DeleteModal";

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: DeletableItem[];
  entity: "customer" | "vendor" | "team";
}

const DownloadModal: React.FC<DownloadModalProps> = ({
  isOpen,
  onClose,
  items,
  entity,
}) => {
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState("");

  // Format rows based on entity
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

    if (entity === "vendor") {
      return items.map((item) => ({
        "Vendor ID": item.id,
        "Vendor Name": item.vendorName,
        POC: item.poc, // assuming 'owner' is POC in deletableItem
        Rating: item.rating,
        "Date Modified": item.dateModified,
      }));
    }

    if (entity === "team") {
      return items.map((item) => ({
        ID: item.id,
        "Member Name": item.memberName,
        Alias: item.alias, // using owner to store alias
        "User Status": item.userStatus, // rating used as status
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      customWidth="w-[27rem]"
      title="Download"
    >
      <div className="px-3 py-3">
        <div className="text-center mb-3 -mt-8">
          <p className="text-gray-400 text-[0.75rem]">
            Download selected entries from here
          </p>
        </div>

        <hr className="mt-2 mb-4 border-gray-200" />

        <div className="space-y-4 mb-6">
          {/* File Name */}
          <div className="flex flex-col">
            <label className="text-gray-700 font-medium text-[0.75rem] mb-1">
              File Name
            </label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="Enter file name here"
              className="border border-gray-300 rounded-md px-3 py-1.5 text-[0.75rem] text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-green-600 w-[23.5rem]"
            />
          </div>

          {/* File Type */}
          <div className="flex flex-col">
            <label className="text-gray-700 font-medium text-[0.75rem] mb-1">
              File Type
            </label>
            <select
              value={fileType}
              onChange={(e) => setFileType(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-[0.75rem] text-gray-700 focus:outline-none focus:ring-1 focus:ring-green-600 w-[23.5rem] bg-white"
            >
              <option value="">Select File Type</option>
              <option value="pdf">PDF</option>
              <option value="csv">CSV</option>
              <option value="docx">DOCX (Word)</option>
              <option value="xlsx">Excel (.xlsx)</option>
            </select>
          </div>
        </div>

        {/* Download Button */}
        <div className="flex justify-end mt-3">
          <button
            onClick={handleDownload}
            className="bg-[#0D4B37] hover:bg-[#093C2C] text-white font-medium text-[0.75rem] px-4 py-1.5 rounded-md transition-colors"
          >
            Download
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DownloadModal;
