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

import { getApiBaseUrl } from "../config/env";

const api = axios.create({
  baseURL: getApiBaseUrl(),
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