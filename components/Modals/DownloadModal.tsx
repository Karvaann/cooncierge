import Modal from "../Modal";

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DownloadModal: React.FC<DownloadModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      customWidth="w-[27rem]"
      title="Download"
    >
      <div className="px-3 py-3">
        {/* Title */}
        <div className="text-center mb-3 -mt-8">
          <p className="text-gray-400 text-[0.75rem]">
            Download selected entries from here
          </p>
        </div>

        <hr className="mt-2 mb-4 border-gray-200" />

        {/* Form Section */}
        <div className="space-y-4 mb-6">
          {/* File Name */}
          <div className="flex flex-col">
            <label className="text-gray-700 font-medium text-[0.75rem] mb-1">
              File Name
            </label>
            <input
              type="text"
              placeholder="Enter file name here"
              className="border border-gray-300 rounded-md px-3 py-1.5 text-[0.75rem] text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-green-600 w-[23.5rem]"
            />
          </div>

          {/* File Type */}
          <div className="flex flex-col">
            <label className="text-gray-700 font-medium text-[0.75rem] mb-1">
              File Type
            </label>
            <select className="border border-gray-300 rounded-md px-3 py-1.5 text-[0.75rem] text-gray-700 focus:outline-none focus:ring-1 focus:ring-green-600 w-[23.5rem] bg-white">
              <option value="">Select File Type</option>
              <option value="pdf">PDF</option>
              <option value="csv">CSV</option>
              <option value="xlsx">Excel</option>
            </select>
          </div>
        </div>

        {/* Download Button */}
        <div className="flex justify-end mt-3">
          <button className="bg-[#0D4B37] hover:bg-[#093C2C] text-white font-medium text-[0.75rem] px-4 py-1.5 rounded-md transition-colors">
            Download
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DownloadModal;
