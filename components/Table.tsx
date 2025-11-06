"use client";

import React, { useState, useMemo, useCallback } from "react";

// Type definitions
interface TableProps {
  data: React.ReactNode[][];
  columns: string[];
  initialRowsPerPage?: number;
  maxRowsPerPageOptions?: number[];
  columnIconMap?: Record<string, React.ReactNode>;
  onSort?: (column: string) => void;
  hideRowsPerPage?: boolean;
}

const Table: React.FC<TableProps> = ({
  data,
  columns,
  initialRowsPerPage = 10,
  maxRowsPerPageOptions = [2, 5, 10, 25, 50],
  columnIconMap,
  onSort,
  hideRowsPerPage,
}) => {
  const [page, setPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(initialRowsPerPage);

  // Memoized calculations
  const totalRows = useMemo(() => data.length, [data.length]);
  const totalPages = useMemo(
    () => Math.ceil(totalRows / rowsPerPage),
    [totalRows, rowsPerPage]
  );

  const paginatedRows = useMemo(
    () => data.slice((page - 1) * rowsPerPage, page * rowsPerPage),
    [data, page, rowsPerPage]
  );

  // Memoized empty rows for consistent table height
  const emptyRows = useMemo(
    () =>
      Array.from({ length: Math.max(0, rowsPerPage - paginatedRows.length) }),
    [rowsPerPage, paginatedRows.length]
  );

  // Memoized pagination buttons
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
          aria-label={`Go to page ${idx + 1}`}
        >
          {idx + 1}
        </button>
      )),
    [totalPages, page]
  );

  // Optimized handlers
  const handlePreviousPage = useCallback(() => {
    setPage((prev) => Math.max(1, prev - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setPage((prev) => Math.min(totalPages, prev + 1));
  }, [totalPages]);

  const handleRowsPerPageChange = useCallback((newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage);
    setPage(1); // Reset to first page when changing rows per page
  }, []);

  // Memoized display text
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
                  className="px-4 py-3 text-left text-gray-200 font-semibold text-sm"
                >
                  <div className="flex items-center justify-center gap-2">
                    <span> {col} </span>
                    {columnIconMap?.[col]}
                  </div>
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

            {/* Fill empty rows to keep table height consistent */}
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

      {/* Pagination Controls */}
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
            aria-label="Previous page"
          >
            {"<"}
          </button>

          {paginationButtons}

          <button
            className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#155e75] hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={page === totalPages}
            onClick={handleNextPage}
            aria-label="Next page"
          >
            {">"}
          </button>
        </div>
      </div>
    </>
  );
};

export default React.memo(Table);
