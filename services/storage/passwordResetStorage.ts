const PASSWORD_RESET_SESSION_KEY = "passwordResetSession";

export interface PasswordResetSession {
  email: string;
  resetToken: string;
}

export function setPasswordResetSession(session: PasswordResetSession): void {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(PASSWORD_RESET_SESSION_KEY, JSON.stringify(session));
}

export function getPasswordResetSession(): PasswordResetSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.sessionStorage.getItem(PASSWORD_RESET_SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as PasswordResetSession;
    if (!parsed.email || !parsed.resetToken) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function clearPasswordResetSession(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(PASSWORD_RESET_SESSION_KEY);
}
