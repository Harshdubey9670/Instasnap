import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import {
  useColorScheme,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { useSelector } from "react-redux";

import type { RootState } from "../store/store";

type ThemePreference =
  | "light"
  | "dark"
  | "system";

interface ThemeContextValue {
  theme: ThemePreference;
  effectiveTheme: "light" | "dark";
  toggleTheme: () => void;
  setTheme: (
    theme: ThemePreference,
  ) => void;
}

const ThemeContext =
  createContext<ThemeContextValue | undefined>(
    undefined,
  );

const THEME_STORAGE_KEY =
  "theme";

export function ThemeProvider({
  children,
}: PropsWithChildren) {
  const systemColorScheme =
    useColorScheme();

  const authTheme =
    useSelector(
      (state: RootState) =>
        state.auth.settings?.accessibility
          ?.theme as
          | ThemePreference
          | undefined,
    );

  const [theme, setThemeState] =
    useState<ThemePreference>("system");

  useEffect(() => {
    let mounted = true;

    const loadStoredTheme =
      async () => {
        try {

          const storedTheme =
            await SecureStore.getItemAsync(
              THEME_STORAGE_KEY,
            );

          if (
            mounted &&
            (
              storedTheme === "light" ||
              storedTheme === "dark" ||
              storedTheme === "system"
            )
          ) {
            setThemeState(
              storedTheme,
            );
          }
        } catch (error) {
          console.error(
            "Failed to load theme:",
            error,
          );
        }
      };

    loadStoredTheme();

    return () => {
      mounted = false;
    };
  }, []);

  const activeThemePreference =
    authTheme || theme;

  const effectiveTheme =
    activeThemePreference === "system"
      ? systemColorScheme ===
          "dark"
        ? "dark"
        : "light"
      : activeThemePreference;

  useEffect(() => {
    if (authTheme) {
      return;
    }

    const persistTheme =
      async () => {
        try {
  
          await SecureStore.setItemAsync(
            THEME_STORAGE_KEY,
            activeThemePreference,
          );
        } catch (error) {
          console.error(
            "Failed to save theme:",
            error,
          );
        }
      };

    persistTheme();
  }, [
    activeThemePreference,
    authTheme,
  ]);

  const setTheme = useCallback(
    (
      nextTheme: ThemePreference,
    ) => {
      setThemeState(nextTheme);
    },
    [],
  );

  const toggleTheme = useCallback(() => {
    setThemeState(
      effectiveTheme === "dark"
        ? "light"
        : "dark",
    );
  }, [effectiveTheme]);

  const value =
    useMemo<ThemeContextValue>(
      () => ({
        theme:
          activeThemePreference,
        effectiveTheme,
        toggleTheme,
        setTheme,
      }),
      [
        activeThemePreference,
        effectiveTheme,
        toggleTheme,
        setTheme,
      ],
    );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context =
    useContext(ThemeContext);

  if (!context) {
    throw new Error(
      "useTheme must be used within a ThemeProvider",
    );
  }

  return context;
}