// utils/inputValidators.ts

/**
 * Allows only alphabets and spaces 
 */
export const allowOnlyText = (value: string): string => {
  return value.replace(/[^a-zA-Z\s]/g, "");
};

/**
 * Allows alphabets + spaces + dot
 */
export const allowTextWithDot = (value: string): string => {
  return value.replace(/[^a-zA-Z.\s]/g, "");
};

/**
 * Allows alphabets + spaces + hyphen

 */
export const allowTextWithHyphen = (value: string): string => {
  return value.replace(/[^a-zA-Z\s-]/g, "");
};

/**
 * Allows alphabets + numbers + spaces
 * Example: "Room 402", "Customer 12"
 */
export const allowTextAndNumbers = (value: string): string => {
  return value.replace(/[^a-zA-Z0-9\s]/g, "");
};

/**
 * Allows ONLY numbers
 */
export const allowOnlyNumbers = (value: string): string => {
  return value.replace(/[^0-9]/g, "");
};

/**
 * Allows numbers with optional decimal

 */
export const allowNumberWithDecimal = (value: string): string => {
  return value.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");
};

/**
 * Allows ONLY numbers and limits input to maxLength digits
 * Example: phone numbers (10 digits)
 */
export const allowOnly10Digits = (value: string): string => {
  return value.replace(/[^0-9]/g, "").slice(0, 10);
};

/**
 * Allows ONLY uppercase letters and numbers
 * Max length: 6
 * No spaces
 * Example: "AB12CD"
 */
export const allowUppercaseAlphanumeric6 = (value: string): string => {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);
};


/**
 * Generic name validator
 */
export const isValidName = (value: string): boolean => {
  return /^[a-zA-Z\s]{2,50}$/.test(value.trim());
};

/**
 * Email validator
 */
export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};
