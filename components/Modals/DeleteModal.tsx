"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";

// ============================================================================
// EXAMPLE MODAL COMPONENT (Comment out when using your own Modal component)
// ============================================================================
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  customWidth?: string;
  className?: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  title = "Modal Title",
  customWidth,
  className = "",
}) => {
  const handleEscape = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  const handleOverlayClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", handleEscape);
      return () => {
        document.body.style.overflow = "unset";
        document.removeEventListener("keydown", handleEscape);
      };
    }
    return;
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex justify-center items-center transition-opacity duration-300"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`bg-white rounded-lg shadow-xl overflow-hidden transition-all duration-300 transform ${customWidth} ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between mt-3 items-center px-6 py-4">
          <h2 className="text-black text-xl md:text-2xl font-semibold flex-1 text-center">
            {title}
          </h2>
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
        </div>
        <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">{children}</div>
      </div>
    </div>
  );
};

// ============================================================================
// EXAMPLE TABLE COMPONENT (Comment out when using your own Table component)
// ============================================================================
interface TableProps {
  data: React.ReactNode[][];
  columns: string[];
  initialRowsPerPage?: number;
  maxRowsPerPageOptions?: number[];
  hideRowsPerPage?: boolean;
}

const Table: React.FC<TableProps> = ({
  data,
  columns,
  initialRowsPerPage = 10,
  maxRowsPerPageOptions = [5, 10, 25, 50],
  hideRowsPerPage,
}) => {
  const [page, setPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(initialRowsPerPage);

  const totalRows = useMemo(() => data.length, [data.length]);
  const totalPages = useMemo(
    () => Math.ceil(totalRows / rowsPerPage),
    [totalRows, rowsPerPage]
  );
  const paginatedRows = useMemo(
    () => data.slice((page - 1) * rowsPerPage, page * rowsPerPage),
    [data, page, rowsPerPage]
  );

  const emptyRows = useMemo(
    () =>
      Array.from({ length: Math.max(0, rowsPerPage - paginatedRows.length) }),
    [rowsPerPage, paginatedRows.length]
  );

  const paginationButtons = useMemo(
    () =>
      Array.from({ length: totalPages }).map((_, idx) => (
        <button
          key={idx}
          className={`w-8 h-8 rounded-full font-bold border border-gray-300 flex items-center justify-center transition-colors ${
            page === idx + 1
              ? "bg-[#155e75] text-white"
              : "bg-white text-[#155e75] hover:bg-gray-50"
          }`}
          onClick={() => setPage(idx + 1)}
        >
          {idx + 1}
        </button>
      )),
    [totalPages, page]
  );

  const handlePreviousPage = useCallback(() => {
    setPage((prev) => Math.max(1, prev - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setPage((prev) => Math.min(totalPages, prev + 1));
  }, [totalPages]);

  const handleRowsPerPageChange = useCallback((newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage);
    setPage(1);
  }, []);

  const displayText = useMemo(() => {
    const start = (page - 1) * rowsPerPage + 1;
    const end = Math.min(page * rowsPerPage, totalRows);
    return `Showing ${start}-${end} of ${totalRows} entries`;
  }, [page, rowsPerPage, totalRows]);

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="min-w-full text-sm rounded-xl overflow-hidden">
          <thead>
            <tr className="bg-[#0D4B37] text-white rounded-t-xl">
              {columns.map((col, index) => (
                <th
                  key={`${col}-${index}`}
                  className="px-4 py-3 text-center text-gray-200 font-semibold text-sm"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((row, idx) => (
              <tr
                key={`row-${page}-${idx}`}
                className={`${
                  idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                } hover:bg-gray-100 transition-colors`}
              >
                {row}
              </tr>
            ))}
            {emptyRows.map((_, idx) => (
              <tr
                key={`empty-${idx}`}
                className={`${
                  (paginatedRows.length + idx) % 2 === 0
                    ? "bg-white"
                    : "bg-gray-50"
                } h-14`}
              >
                <td className="px-4 py-3" colSpan={columns.length}></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div
        className={`flex items-center justify-between mt-4 flex-wrap gap-4 ${
          hideRowsPerPage ? "justify-between" : ""
        }`}
      >
        {!hideRowsPerPage && (
          <div className="flex items-center gap-2">
            <span className="text-gray-600">Rows per page:</span>
            <select
              className="border border-gray-300 rounded px-2 py-1 text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-[#155e75] transition-colors"
              value={rowsPerPage}
              onChange={(e) => handleRowsPerPageChange(Number(e.target.value))}
            >
              {maxRowsPerPageOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="text-gray-600 text-sm">{displayText}</div>

        <div className="flex items-center gap-2">
          <button
            className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#155e75] hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={page === 1}
            onClick={handlePreviousPage}
          >
            {"<"}
          </button>
          {paginationButtons}
          <button
            className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#155e75] hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={page === totalPages}
            onClick={handleNextPage}
          >
            {">"}
          </button>
        </div>
      </div>
    </>
  );
};

// ============================================================================
// DELETE CUSTOMERS MODAL - YOUR ACTUAL COMPONENT
// ============================================================================

interface Customer {
  id: string;
  name: string;
  avatar: string;
  subtitle: string;
  owner: string;
  rating: number;
  dateModified: string;
  isLinked: boolean;
}

const DeleteCustomersModal: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(true);

  // Sample customer data matching the screenshot
  const customers: Customer[] = [
    {
      id: "CU-AB001",
      name: "Jatin Sharma",
      avatar: "https://i.pravatar.cc/150?img=1",
      subtitle: "Karvaann",
      owner: "Sumit Jain",
      rating: 5,
      dateModified: "10-09-2025",
      isLinked: true,
    },
    {
      id: "CU-AB002",
      name: "Deepanshu",
      avatar: "https://i.pravatar.cc/150?img=2",
      subtitle: "Karvaann",
      owner: "Sumit Jain",
      rating: 2,
      dateModified: "09-09-2025",
      isLinked: false,
    },
    {
      id: "CU-AB003",
      name: "Anand Mishra",
      avatar: "https://i.pravatar.cc/150?img=3",
      subtitle: "Karvaann",
      owner: "Apurav Mishra",
      rating: 3,
      dateModified: "09-09-2025",
      isLinked: false,
    },
    {
      id: "CU-AB004",
      name: "Anand Mishra",
      avatar: "https://i.pravatar.cc/150?img=4",
      subtitle: "Karvaann",
      owner: "Harish Chaudhary",
      rating: 1,
      dateModified: "07-09-2025",
      isLinked: true,
    },
    {
      id: "CU-AB005",
      name: "Anand Mishra",
      avatar: "https://i.pravatar.cc/150?img=5",
      subtitle: "Karvaann",
      owner: "Dhruv Pandey",
      rating: 4,
      dateModified: "31-08-2025",
      isLinked: false,
    },
  ];

  const getRatingIcon = (rating: number) => {
    const colors = {
      1: "bg-red-100 text-red-500",
      2: "bg-orange-100 text-orange-500",
      3: "bg-yellow-100 text-yellow-500",
      4: "bg-green-100 text-green-500",
      5: "bg-green-100 text-green-500",
    };

    return (
      <div
        className={`flex items-center gap-1 px-2 py-1 rounded-full ${
          colors[rating as keyof typeof colors]
        }`}
      >
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
        <span className="text-sm font-semibold">{rating}</span>
      </div>
    );
  };

  const columns = [
    "Customer ID",
    "Name",
    "Owner",
    "Rating",
    "Date Modified",
    "Booking History",
  ];

  const tableData = customers.map((customer) => [
    <td key="id" className="px-4 py-3">
      <div className="flex items-center gap-3">
        {customer.isLinked && (
          <svg
            className="w-5 h-5 text-red-500"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
        )}
        <span className={customer.isLinked ? "text-gray-400" : "text-gray-800"}>
          {customer.id}
        </span>
      </div>
    </td>,
    <td key="name" className="px-4 py-3">
      <div className="flex items-center gap-3">
        <img
          src={customer.avatar}
          alt={customer.name}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div>
          <div
            className={
              customer.isLinked
                ? "text-gray-400 font-medium"
                : "text-gray-800 font-medium"
            }
          >
            {customer.name}
          </div>
          <div className="text-gray-400 text-xs">{customer.subtitle}</div>
        </div>
      </div>
    </td>,
    <td key="owner" className="px-4 py-3">
      <span className={customer.isLinked ? "text-gray-400" : "text-gray-800"}>
        {customer.owner}
      </span>
    </td>,
    <td key="rating" className="px-4 py-3">
      <div className="flex justify-center">
        {getRatingIcon(customer.rating)}
      </div>
    </td>,
    <td key="date" className="px-4 py-3">
      <span className={customer.isLinked ? "text-gray-400" : "text-gray-800"}>
        {customer.dateModified}
      </span>
    </td>,
    <td key="history" className="px-4 py-3">
      <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 text-sm transition-colors">
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        Booking History
      </button>
    </td>,
  ]);

  const linkedCustomers = customers.filter((c) => c.isLinked).map((c) => c.id);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
      >
        Open Delete Customers Modal
      </button>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Delete Customers"
        customWidth="w-[90vw]"
        className="max-w-[1400px]"
      >
        <div className="space-y-6">
          {/* Warning Message */}
          <div className="flex items-center justify-center gap-2 text-red-500 text-sm">
            <span>Entries with</span>
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
            <span>cannot be deleted as they are linked</span>
          </div>

          {/* Table */}
          <Table
            data={tableData}
            columns={columns}
            initialRowsPerPage={10}
            maxRowsPerPageOptions={[5, 10, 25, 50]}
            hideRowsPerPage={false}
          />

          {/* Footer Message */}
          <div className="text-right text-gray-600 text-sm pt-2">
            <span className="font-semibold">{linkedCustomers.join(", ")}</span>{" "}
            are linked and cannot be deleted.
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              No, Cancel
            </button>
            <button
              onClick={() => {
                alert("Deleting non-linked customers...");
              }}
              className="px-6 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
            >
              Remove & Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DeleteCustomersModal;
