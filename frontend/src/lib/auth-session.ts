import type { AuthTokens } from "@/src/types/auth";

const STORAGE_KEY = "launchafrica_auth_tokens";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function setAuthTokens(tokens: AuthTokens): void {
  if (!isBrowser()) return;

  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
}

export function getAccessToken(): string | null {
  if (!isBrowser()) return null;

  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const tokens = JSON.parse(stored) as AuthTokens;
    return typeof tokens.access === "string" ? tokens.access : null;
  } catch {
    return null;
  }
}

export function getRefreshToken(): string | null {
  if (!isBrowser()) return null;

  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const tokens = JSON.parse(stored) as AuthTokens;
    return typeof tokens.refresh === "string" ? tokens.refresh : null;
  } catch {
    return null;
  }
}

export function clearAuthSession(): void {
  if (!isBrowser()) return;

  sessionStorage.removeItem(STORAGE_KEY);
}
