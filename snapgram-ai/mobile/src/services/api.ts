import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";
import { router } from "expo-router";

import {
  getAuthToken,
  removeAuthToken,
} from "../utils/authStorage";
import {
  getCurrentPath,
  isProtectedPath,
} from "../navigation/navigation";

import { Platform } from "react-native";

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === "android" ? "http://10.0.2.2:5001" : "http://localhost:5001");

const api = axios.create({
  baseURL: API_URL,
  // Keep this enabled because your existing backend is configured
  // to support credentials/CORS. Native requests do not use browser
  // CORS in the same way, but keeping the setting does not change
  // the existing API contract.
  withCredentials: true,
});

api.interceptors.request.use(
  async (
    config: InternalAxiosRequestConfig,
  ) => {
    try {
      const token = await getAuthToken();

      if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error(
        "Failed to attach authentication token:",
        error,
      );
    }

    return config;
  },
  (error: unknown) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      const currentPath = getCurrentPath();

      // Match the original web behavior:
      // only redirect automatically while inside /app.
      if (isProtectedPath(currentPath)) {
        await removeAuthToken();

        try {
          router.replace("/auth/login");
        } catch (navigationError) {
          console.error(
            "Failed to redirect to login:",
            navigationError,
          );
        }
      }
    }

    return Promise.reject(error);
  },
);

export default api;