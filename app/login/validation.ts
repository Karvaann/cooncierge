import type { AxiosError } from "axios";
import { isValidEmail } from "@/utils/inputValidators";
import type { SignInErrorState } from "@/app/login/types";

export const SIGN_IN_ERRORS = {
  emailRequired: "Please enter your email",
  emailInvalid: "Please enter a valid email address",
  emailNotFound: "User not found with this email",
  passwordRequired: "Please enter your password",
  passwordIncorrect: "Incorrect password entered",
  loginFailed: "Login failed, please try again",
} as const;

export interface SignInFieldErrors {
  email: string | null;
  password: string | null;
}

export function toSignInErrorMessage(fieldErrors: SignInFieldErrors): string | null {
  const hasEmail = Boolean(fieldErrors.email);
  const hasPassword = Boolean(fieldErrors.password);

  if (!hasEmail && !hasPassword) {
    return null;
  }

  if (hasEmail && hasPassword) {
    const bothEmpty =
      fieldErrors.email === SIGN_IN_ERRORS.emailRequired &&
      fieldErrors.password === SIGN_IN_ERRORS.passwordRequired;

    if (bothEmpty) {
      return "Please enter your email and password";
    }

    if (fieldErrors.email === SIGN_IN_ERRORS.emailInvalid) {
      return "The email entered is not valid";
    }

    return "Email and password are incorrect";
  }

  if (hasPassword) {
    if (fieldErrors.password === SIGN_IN_ERRORS.passwordRequired) {
      return "Please enter your password";
    }

    return "The password entered is wrong.";
  }

  if (fieldErrors.email === SIGN_IN_ERRORS.emailRequired) {
    return "Please enter your email";
  }

  if (fieldErrors.email === SIGN_IN_ERRORS.emailInvalid) {
    return "The email entered is not valid";
  }

  return "Email and password are incorrect";
}

export function toSignInErrorState(fieldErrors: SignInFieldErrors): SignInErrorState {
  return {
    message: toSignInErrorMessage(fieldErrors),
    fields: {
      email: Boolean(fieldErrors.email),
      password: Boolean(fieldErrors.password),
    },
  };
}

export function emptySignInErrorState(): SignInErrorState {
  return {
    message: null,
    fields: {
      email: false,
      password: false,
    },
  };
}

export function validateSignInFields(email: string, password: string): SignInFieldErrors {
  const trimmedEmail = email.trim();
  const errors: SignInFieldErrors = {
    email: null,
    password: null,
  };

  if (!trimmedEmail) {
    errors.email = SIGN_IN_ERRORS.emailRequired;
  } else if (!isValidEmail(trimmedEmail)) {
    errors.email = SIGN_IN_ERRORS.emailInvalid;
  }

  if (!password) {
    errors.password = SIGN_IN_ERRORS.passwordRequired;
  }

  return errors;
}

export function hasFieldErrors(errors: SignInFieldErrors) {
  return Boolean(errors.email || errors.password);
}

export function getSignInApiFieldErrors(error: unknown): SignInFieldErrors {
  const err = error as AxiosError<{ message?: string }>;
  const status = err.response?.status;
  const message = err.response?.data?.message;

  if (status === 404) {
    return {
      email: message || SIGN_IN_ERRORS.emailNotFound,
      password: null,
    };
  }

  if (status === 401) {
    return {
      email: null,
      password: SIGN_IN_ERRORS.passwordIncorrect,
    };
  }

  if (status === 400) {
    const lowerMessage = message?.toLowerCase() ?? "";

    return {
      email: lowerMessage.includes("email") ? SIGN_IN_ERRORS.emailRequired : null,
      password: lowerMessage.includes("password") ? SIGN_IN_ERRORS.passwordRequired : null,
    };
  }

  if (status === 403) {
    return {
      email: message || SIGN_IN_ERRORS.loginFailed,
      password: null,
    };
  }

  return {
    email: null,
    password: message || SIGN_IN_ERRORS.loginFailed,
  };
}
