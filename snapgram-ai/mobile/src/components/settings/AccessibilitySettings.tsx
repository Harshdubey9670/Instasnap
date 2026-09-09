import React from "react";
import {
  Text,
  StyleSheet,
  View,
} from "react-native";
import {
  useDispatch,
  useSelector,
} from "react-redux";

import {
  optimisticUpdateSetting,
  updateSettings,
} from "../../store/authSlice";
import type {
  RootState,
  AppDispatch,
} from "../../store/store";

import {
  useToast,
} from "../ui/Toast";
import {
  SettingToggle,
} from "./SettingToggle";
import {
  useTheme,
} from "../../contexts/ThemeContext";

const AccessibilitySettings =
  () => {
    const {
      settings,
    } = useSelector(
      (state: RootState) =>
        state.auth,
    );

    const dispatch =
      useDispatch<AppDispatch>();

    const {
      toast,
    } = useToast();

    const {
      effectiveTheme,
    } = useTheme();

    const dark =
      effectiveTheme ===
      "dark";

    const handleUpdate =
      async (
        category: string,
        key: string,
        value: boolean,
      ) => {
        const updates = {
          [category]: {
            [key]: value,
          },
        };

        dispatch(
          optimisticUpdateSetting(
            updates,
          ),
        );

        try {
          await dispatch(
            updateSettings(
              updates,
            ),
          ).unwrap();
        } catch {
          toast({
            variant:
              "error",
            title:
              "Error",
            description:
              "Failed to update setting",
          });
        }
      };

    return (
      <View
        style={
          styles.container
        }
      >
        <View>
          <Text
            style={[
              styles.title,
              {
                color:
                  dark
                    ? "#f8fafc"
                    : "#0f172a",
              },
            ]}
          >
            Accessibility
          </Text>

          <Text
            style={[
              styles.description,
              {
                color:
                  dark
                    ? "#94a3b8"
                    : "#64748b",
              },
            ]}
          >
            Customize the app to fit your needs.
          </Text>
        </View>

        <SettingsCard
          title="Vision"
          dark={dark}
        >
          <SettingToggle
            label="High Contrast"
            description="Increase color contrast for easier reading."
            checked={
              settings
                ?.accessibility
                ?.highContrast ||
              false
            }
            onChange={(
              value,
            ) =>
              handleUpdate(
                "accessibility",
                "highContrast",
                value,
              )
            }
          />

          <SettingToggle
            label="Screen Reader Optimizations"
            description="Enhance labels and focus rings for screen reader navigation."
            checked={
              settings
                ?.accessibility
                ?.screenReader ||
              false
            }
            onChange={(
              value,
            ) =>
              handleUpdate(
                "accessibility",
                "screenReader",
                value,
              )
            }
          />
        </SettingsCard>

        <SettingsCard
          title="Motion"
          dark={dark}
        >
          <SettingToggle
            label="Reduce Motion"
            description="Disable or reduce UI animations and transitions."
            checked={
              settings
                ?.accessibility
                ?.reduceMotion ||
              false
            }
            onChange={(
              value,
            ) =>
              handleUpdate(
                "accessibility",
                "reduceMotion",
                value,
              )
            }
          />
        </SettingsCard>
      </View>
    );
  };

const SettingsCard = ({
  title,
  dark,
  children,
}: {
  title: string;
  dark: boolean;
  children: React.ReactNode;
}) => (
  <View
    style={[
      styles.card,
      {
        backgroundColor:
          dark
            ? "#130a1c"
            : "#ffffff",
        borderColor:
          dark
            ? "#2d1b3b"
            : "#e2e8f0",
      },
    ]}
  >
    <Text
      style={[
        styles.cardTitle,
        {
          color:
            dark
              ? "#f8fafc"
              : "#0f172a",
          borderBottomColor:
            dark
              ? "#2d1b3b"
              : "#e2e8f0",
        },
      ]}
    >
      {title}
    </Text>

    {children}
  </View>
);

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      gap: 20,
      paddingBottom: 32,
    },

    title: {
      fontSize: 26,
      fontWeight: "800",
    },

    description: {
      marginTop: 5,
      fontSize: 14,
    },

    card: {
      borderWidth: 1,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingBottom: 8,
      paddingTop: 16,
    },

    cardTitle: {
      fontSize: 17,
      fontWeight: "800",
      paddingBottom: 10,
      marginBottom: 2,
      borderBottomWidth: 1,
    },
  });

export default AccessibilitySettings;