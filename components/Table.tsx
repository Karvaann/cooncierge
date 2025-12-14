"use client";

import React, { useState, useMemo, useCallback } from "react";
import DropDown from "./DropDown";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

// Type definitions
interface TableProps {
  data: React.ReactNode[][];
  columns: string[];
  initialRowsPerPage?: number;
  maxRowsPerPageOptions?: number[];
  columnIconMap?: Record<string, React.ReactNode>;
  onSort?: (column: string) => void;
  hideRowsPerPage?: boolean;
  showCheckboxColumn?: boolean;
  /* NEW optional DnD props */
  enableDragAndDrop?: boolean; // default false
  rowIds?: string[];
  droppableId?: string;
  headerClassName?: string;
  categoryName?: string;
  sortableHeaderHoverClass?: string;
  hideEntriesText?: boolean;
}

const Table: React.FC<TableProps> = ({
  data,
  columns,
  initialRowsPerPage = 10,
  maxRowsPerPageOptions = [2, 5, 10, 25, 50],
  columnIconMap,
  onSort,
  hideRowsPerPage,
  showCheckboxColumn = false,
  enableDragAndDrop = false,
  rowIds = [],
  droppableId = "table-droppable",
  headerClassName = "",
  categoryName = "",
  sortableHeaderHoverClass = "",
  hideEntriesText = false,
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
          className={`w-6 h-6 rounded-md font-normal text-[0.85rem] flex items-center justify-center transition-colors ${
            page === idx + 1
              ? "bg-gray-100 text-gray-600"
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
    return `Showing ${start}-${end} of ${totalRows} ${
      categoryName || "entries"
    }`;
  }, [page, rowsPerPage, totalRows]);

  // Helper to generate a stable draggableId for each visible row
  const getDraggableId = (visibleIndex: number) => {
    // compute global index for the row
    const globalIndex = (page - 1) * rowsPerPage + visibleIndex;
    return rowIds && rowIds[globalIndex]
      ? String(rowIds[globalIndex])
      : `row-${globalIndex}`;
  };

  return (
    <>
      <div className="overflow-visible rounded-xl border border-gray-100">
        <table className="w-full text-sm rounded-xl overflow-hidden">
          <thead>
            <tr
              className={`rounded-t-xl text-white ${
                headerClassName || "bg-[#0D4B37]"
              }`}
            >
              {showCheckboxColumn && (
                <th className="px-3 py-2 w-[3rem] text-center"></th>
              )}
              {columns.map((col, index) => (
                <th
                  key={`${col}-${index}`}
                  onClick={() => {
                    if (!onSort) return;

                    if (
                      col === "Rating" ||
                      col === "Date Modified" ||
                      col === "Date Created" ||
                      col === "Travel Date" ||
                      col === "Joining Date"
                    ) {
                      onSort(col);
                    }
                  }}
                  className={`px-4 py-2 text-center text-gray-200 font-semibold leading-4 tracking-[0.6px] text-[0.65rem]
          ${
            col === "Rating" ||
            col === "Date Modified" ||
            col === "Date Created" ||
            col === "Travel Date" ||
            col === "Joining Date"
              ? `cursor-pointer hover:${
                  sortableHeaderHoverClass || "bg-[#0f5a43]"
                }`
              : ""
          }
        `}
                >
                  <div className="flex items-center justify-center gap-2">
                    <span> {col} </span>
                    {columnIconMap?.[col]}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          {/* ---------- BODY: conditional Droppable/Draggable rendering ---------- */}
          {enableDragAndDrop ? (
            // If DnD enabled, render Droppable + Draggable rows (NOTE: DragDropContext should wrap this component externally
            // if you want cross-table dragging between multiple Table instances)
            <Droppable droppableId={droppableId}>
              {(provided) => (
                <tbody ref={provided.innerRef} {...provided.droppableProps}>
                  {paginatedRows.map((row, idx) => (
                    <Draggable
                      key={getDraggableId(idx)}
                      draggableId={getDraggableId(idx)}
                      index={idx}
                    >
                      {(drag) => (
                        <tr
                          ref={drag.innerRef}
                          {...drag.draggableProps}
                          // NOTE: We attach dragHandleProps to the entire row for simplicity.
                          // If you want handle-only dragging later, we can change this to pass handle props
                          // to a specific cell by cloning the row's first child.
                          {...drag.dragHandleProps}
                          className={`${
                            idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                          } hover:bg-gray-100 transition-colors h-[2.8rem] text-[0.75rem]`}
                        >
                          {row}
                        </tr>
                      )}
                    </Draggable>
                  ))}

                  {/* Fill empty rows to keep table height consistent */}
                  {emptyRows.map((_, idx) => (
                    <tr
                      key={`empty-${idx}`}
                      className={`${
                        (paginatedRows.length + idx) % 2 === 0
                          ? "bg-white"
                          : "bg-gray-50"
                      } h-[2.8rem] text-[0.75rem]`}
                    >
                      <td
                        className="px-4 py-3"
                        colSpan={columns.length + (showCheckboxColumn ? 1 : 0)}
                      ></td>
                    </tr>
                  ))}

                  {provided.placeholder}
                </tbody>
              )}
            </Droppable>
          ) : (
            // Non-DnD
            <tbody>
              {paginatedRows.map((row, idx) => (
                <tr
                  key={`row-${page}-${idx}`}
                  className={`${
                    idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                  } hover:bg-gray-100 transition-colors h-[2.8rem] text-[0.75rem]`}
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
                  } h-[2.8rem] text-[0.75rem]`}
                >
                  <td
                    className="px-4 py-3"
                    colSpan={columns.length + (showCheckboxColumn ? 1 : 0)}
                  ></td>
                </tr>
              ))}
            </tbody>
          )}
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
            <span className="text-gray-600 text-[0.75rem]">Rows per page:</span>
            <DropDown
              options={maxRowsPerPageOptions.map((o) => ({
                value: String(o),
                label: String(o),
              }))}
              value={String(rowsPerPage)}
              onChange={(v) => handleRowsPerPageChange(Number(v))}
              customWidth="w-[3.5rem]"
              menuWidth="w-[3.5rem]"
              className=""
            />
          </div>
        )}

        {!hideEntriesText && (
          <div className="text-gray-600 text-[0.75rem]">{displayText}</div>
        )}

        <div className="flex items-center gap-2">
          <button
            className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-[#155e75] hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={page === 1}
            onClick={handlePreviousPage}
            aria-label="Previous page"
          >
            {"<"}
          </button>

          {paginationButtons}

          <button
            className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-[#155e75] hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
