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
      customWidth="w-[500px]"
      title="Download"
    >
      <div className="px-4 py-4">
        {/* Title and subtitle */}
        <div className="text-center mb-4 -mt-10">
          <p className="text-gray-400 mt-1">
            Download selected entries from here
          </p>
        </div>

        <hr className="mt-4 mb-6 border-gray-200" />

        {/* Form Section */}
        <div className="space-y-5 mb-9">
          {/* File Name */}
          <div className="flex flex-col">
            <label className="text-gray-800 font-medium mb-2">File Name</label>
            <input
              type="text"
              placeholder="Enter file name here"
              className="border border-gray-300 rounded-lg px-4 py-2.5 text-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>

          {/* File Type */}
          <div className="flex flex-col">
            <label className="text-gray-800 font-medium mb-2">File Type</label>
            <select className="border border-gray-300 rounded-lg px-4 py-2.5 text-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-600">
              <option value="">Select File Type</option>
              <option value="pdf">PDF</option>
              <option value="csv">CSV</option>
              <option value="xlsx">Excel</option>
            </select>
          </div>
        </div>

        {/* Download Button */}
        <div className="flex justify-end mt-6">
          <button className="bg-[#0D4B37] hover:bg-green-900 text-white font-medium px-6 py-2.5 rounded-lg transition-colors">
            Download
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DownloadModal;
