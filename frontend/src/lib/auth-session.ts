import type { AuthTokens } from "@/types/auth";

let currentTokens: AuthTokens | null = null;

export function setAuthTokens(tokens: AuthTokens): void {
  currentTokens = tokens;
}

export function getAccessToken(): string | null {
  return currentTokens?.access ?? null;
}

export function getRefreshToken(): string | null {
  return currentTokens?.refresh ?? null;
}

export function clearAuthSession(): void {
  currentTokens = null;
}
