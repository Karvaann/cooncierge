import type { ReactNode } from "react";
import { MdOutlineKeyboardArrowDown } from "react-icons/md";

type TableHeaderActionsProps = {
  selectMode: boolean;
  isAllSelected: boolean;
  isMenuOpen: boolean;
  onMenuToggle: () => void;
  onCancelSelect: () => void;
  onSelectAllToggle: () => void;
  menu: ReactNode;
  /** Bulk actions menu (three dots) shown only in select mode */
  selectModeMenu?: ReactNode;
  extraAction?: ReactNode;
};

export default function TableHeaderActions({
  selectMode,
  isAllSelected,
  isMenuOpen,
  onMenuToggle,
  onCancelSelect,
  onSelectAllToggle,
  menu,
  selectModeMenu,
  extraAction,
}: TableHeaderActionsProps) {
  return (
    <div className="flex items-center gap-3">
      {selectMode ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancelSelect}
            className="inline-flex h-10 cursor-pointer items-center rounded-[14px] border border-[#E2E1E1] bg-white px-5 text-[14px] font-medium text-[#414141] transition-colors hover:bg-[#FAFAFA]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSelectAllToggle}
            className="inline-flex h-10 cursor-pointer items-center rounded-[14px] border border-[#E2E1E1] bg-white px-5 text-[14px] font-medium text-[#414141] transition-colors hover:bg-[#FAFAFA]"
          >
            {isAllSelected ? "Deselect all" : "Select all"}
          </button>
          {selectModeMenu}
        </div>
      ) : (
        <div className="relative inline-flex">
          <button
            type="button"
            onClick={onMenuToggle}
            className={`inline-flex cursor-pointer items-stretch overflow-hidden border border-[#7135AD66] bg-white text-[14px] font-[600] text-[#414141] transition-colors hover:bg-[#FAFAFA] ${
              isMenuOpen ? "rounded-t-[14px] rounded-b-none" : "rounded-[14px]"
            }`}
          >
            <span className="flex items-center px-[14px] py-[8px]">
              More Actions
            </span>
            <span className="flex items-center border-l border-[#7135AD66] px-[10px] py-[8px]">
              <MdOutlineKeyboardArrowDown className="text-[18px] text-[#414141]" />
            </span>
          </button>
          {menu}
        </div>
      )}

      {extraAction}
    </div>
  );
}
