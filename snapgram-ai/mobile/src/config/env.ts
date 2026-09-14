import { Platform } from "react-native";

/**
 * Authoritative Environment & API Configuration Module
 *
 * Rules:
 * 1. In DEVELOPMENT (__DEV__ === true):
 *    Allows EXPO_PUBLIC_API_URL, or developer defaults (Android emulator 10.0.2.2 or localhost).
 * 2. In PRODUCTION (__DEV__ === false):
 *    STRICTLY requires a valid HTTPS public URL.
 *    Throws an explicit fatal error if missing or pointing to:
 *    localhost, 127.0.0.1, 10.0.2.2, 192.168.*, 172.16-31.*, 10.*, or non-HTTPS.
 */

const FORBIDDEN_PROD_PATTERNS = [
  /^https?:\/\/localhost(:\d+)?/i,
  /^https?:\/\/127\.0\.0\.1(:\d+)?/i,
  /^https?:\/\/10\.0\.2\.2(:\d+)?/i,
  /^https?:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?/i,
  /^https?:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?/i,
  /^https?:\/\/172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}(:\d+)?/i,
];

export const getApiBaseUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

  // In production builds, enforce HTTPS and reject local/dev IP addresses
  if (!__DEV__) {
    if (!envUrl) {
      throw new Error(
        "[FATAL CONFIG] Missing EXPO_PUBLIC_API_URL in production build. A valid public HTTPS backend URL is required."
      );
    }

    if (!envUrl.startsWith("https://")) {
      throw new Error(
        `[FATAL CONFIG] Insecure protocol in production EXPO_PUBLIC_API_URL: "${envUrl}". Production API must use HTTPS.`
      );
    }

    for (const pattern of FORBIDDEN_PROD_PATTERNS) {
      if (pattern.test(envUrl)) {
        throw new Error(
          `[FATAL CONFIG] Development or local network endpoint detected in production build: "${envUrl}". Production builds must point to an authorized public host.`
        );
      }
    }

    return envUrl.replace(/\/+$/, "");
  }

  // In development, allow configured URL or safe local defaults
  if (envUrl) {
    return envUrl.replace(/\/+$/, "");
  }

  return Platform.OS === "android" ? "http://10.0.2.2:5001" : "http://localhost:5001";
};

export const getSocketBaseUrl = (): string => {
  return getApiBaseUrl();
};
