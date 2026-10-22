import api from "@/lib/api";
import {
  clearAuthSession,
  getRefreshToken,
  setAuthTokens,
} from "@/lib/auth-session";

import type {
  ApiMessage,
  AuthResponse,
  AuthUser,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
} from "@/types/auth";

export async function registerUser(
  payload: RegisterRequest,
): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/register/", payload);

  setAuthTokens(data.tokens);
  return data;
}

export async function loginUser(payload: LoginRequest): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/login/", payload);

  setAuthTokens(data.tokens);
  return data;
}

export async function requestPasswordReset(
  payload: ForgotPasswordRequest,
): Promise<ApiMessage> {
  const { data } = await api.post<ApiMessage>(
    "/auth/forgot-password/",
    payload,
  );

  return data;
}

export async function resetPassword(
  payload: ResetPasswordRequest,
): Promise<ApiMessage> {
  const { data } = await api.post<ApiMessage>("/auth/reset-password/", payload);

  return data;
}

export async function logoutUser(): Promise<ApiMessage> {
  const refresh = getRefreshToken();

  if (!refresh) {
    clearAuthSession();
    return { detail: "Local session cleared." };
  }

  try {
    const { data } = await api.post<ApiMessage>("/auth/logout/", { refresh });

    return data;
  } finally {
    clearAuthSession();
  }
}
export async function changePassword(
  payload: ChangePasswordRequest,
): Promise<ApiMessage> {
  const { data } = await api.post<ApiMessage>(
    "/auth/change-password/",
    payload,
  );

  return data;
}

export async function getCurrentUser(): Promise<AuthUser> {
  const { data } = await api.get<AuthUser>("/auth/me/");
  return data;
}
