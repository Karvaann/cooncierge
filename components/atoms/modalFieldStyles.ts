/** Base class for modal/sidesheet text inputs, selects, and textareas */
export const MODAL_FIELD_INPUT_CLASS =
  "modal-field-input w-full px-3 py-2 text-[13px] disabled:bg-gray-100 disabled:text-gray-700 disabled:cursor-not-allowed";

/** DropDown trigger button — matches modal input width and styling */
export const MODAL_FIELD_DROPDOWN_BUTTON_CLASS =
  "modal-field-input w-full min-h-[42px] px-3 py-2 text-[12px] disabled:bg-gray-100 disabled:text-gray-700 disabled:cursor-not-allowed";

/** Wrapper for compound fields (phone code + number, currency amount, etc.) */
export const MODAL_FIELD_INPUT_GROUP_CLASS = "modal-field-input-group";

/** Inner input inside a compound field group */
export const MODAL_FIELD_INPUT_GROUP_INNER_CLASS =
  "flex-1 min-w-0 border-0 bg-transparent outline-none text-[13px] text-gray-700 px-3 py-2 disabled:bg-gray-100 disabled:text-gray-700 disabled:cursor-not-allowed";

/** Inner input with no padding — for fields where the group wrapper handles spacing */
export const MODAL_FIELD_INPUT_GROUP_INNER_PLAIN_CLASS =
  "flex-1 min-w-0 border-0 bg-transparent outline-none text-[13px] text-gray-700 p-0 placeholder:text-gray-400 disabled:bg-transparent disabled:text-gray-700 disabled:cursor-not-allowed";
