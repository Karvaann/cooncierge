import { isValidEmail } from "./inputValidators";

export const validateFullName = (name?: string): string | null => {
  if (!name || String(name).trim() === "") {
    return "Please enter full name to proceed";
  }
  return null;
};

export const validateFirstName = (firstname?: string): string | null => {
  if (!firstname || String(firstname).trim() === "") {
    return "Please enter first name to proceed";
  }
  return null;
};

export const validateEmailFormat = (email?: string): string | null => {
  if (!email) return null;
  if (!isValidEmail(String(email))) return "Email format is invalid";
  return null;
};

export default {
  validateFullName,
  validateFirstName,
  validateEmailFormat,
};
