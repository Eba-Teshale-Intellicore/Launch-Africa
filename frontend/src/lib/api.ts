import axios, { type InternalAxiosRequestConfig } from "axios";

import {
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  setAuthTokens,
} from "@/src/lib/auth-session";

import type { AuthTokens } from "@/src/types/auth";

const rawBaseURL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1";

const baseURL = rawBaseURL.replace(/\/+$/, "");

const api = axios.create({
  baseURL,
  headers: {
    Accept: "application/json",
  },
  timeout: 15000,
});

declare module "axios" {
  interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}

interface RefreshResponse {
  access: string;
  refresh?: string;
}

function isAuthEndpoint(url = ""): boolean {
  return ["/auth/login/", "/auth/register/", "/auth/token/refresh/"].some(
    (endpoint) => url.includes(endpoint),
  );
}

api.interceptors.request.use((config) => {
  if (isAuthEndpoint(config.url)) {
    delete config.headers.Authorization;
    return config;
  }

  const access = getAccessToken();

  if (access) {
    config.headers.Authorization = `Bearer ${access}`;
  } else {
    delete config.headers.Authorization;
  }

  return config;
});

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refresh = getRefreshToken();

  if (!refresh) {
    throw new Error("No refresh token available.");
  }

  if (!refreshPromise) {
    refreshPromise = axios
      .post<RefreshResponse>(
        `${baseURL}/auth/token/refresh/`,
        { refresh },
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          timeout: 15000,
        },
      )
      .then(({ data }) => {
        if (!data.access) {
          throw new Error("No access token returned.");
        }

        const tokens: AuthTokens = {
          access: data.access,
          refresh: data.refresh ?? refresh,
        };

        setAuthTokens(tokens);
        return tokens.access;
      })
      .catch((error: unknown) => {
        clearAuthSession();
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) {
      return Promise.reject(error);
    }

    const request = error.config as InternalAxiosRequestConfig | undefined;

    if (
      !request ||
      error.response?.status !== 401 ||
      request._retry ||
      isAuthEndpoint(request.url)
    ) {
      return Promise.reject(error);
    }

    request._retry = true;

    try {
      const access = await refreshAccessToken();

      request.headers.Authorization = `Bearer ${access}`;

      return api(request);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  },
);

export default api;
