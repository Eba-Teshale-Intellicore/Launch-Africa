import axios from "axios";
import { getAccessToken } from "@/src/lib/auth-session";

const api = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1",

  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },

  timeout: 15000,
});

// api.interceptors.request.use((config) => {
//   const accessToken = getAccessToken();

//   if (accessToken) {
//     config.headers.Authorization = `Bearer ${accessToken}`;
//   }

//   return config;
// });
api.interceptors.request.use((config) => {
  const isPublicAuthEndpoint =
    config.url?.includes("/auth/login/") ||
    config.url?.includes("/auth/register/");

  if (isPublicAuthEndpoint) {
    delete config.headers.Authorization;
    return config;
  }

  const accessToken = getAccessToken();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  } else {
    delete config.headers.Authorization;
  }

  return config;
});

export default api;
