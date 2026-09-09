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
  SettingSelect,
} from "./SettingSelect";
import {
  useTheme,
} from "../../contexts/ThemeContext";

const AppearanceSettings =
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
        value: string,
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
            Appearance
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
            Customize how InstaSnap AI looks on your device.
          </Text>
        </View>

        <SettingsCard
          title="Theme"
          dark={dark}
        >
          <SettingSelect
            label="App Theme"
            description="Choose your preferred color scheme."
            value={
              settings
                ?.accessibility
                ?.theme ||
              "system"
            }
            options={[
              {
                value:
                  "light",
                label:
                  "Light Mode",
              },
              {
                value:
                  "dark",
                label:
                  "Dark Mode",
              },
              {
                value:
                  "system",
                label:
                  "System Default",
              },
            ]}
            onChange={(value) =>
              handleUpdate(
                "accessibility",
                "theme",
                String(
                  value,
                ),
              )
            }
          />
        </SettingsCard>

        <SettingsCard
          title="Text Size"
          dark={dark}
        >
          <SettingSelect
            label="Font Size"
            description="Adjust the size of text throughout the app."
            value={
              settings
                ?.accessibility
                ?.fontSize ||
              "medium"
            }
            options={[
              {
                value:
                  "small",
                label:
                  "Small",
              },
              {
                value:
                  "medium",
                label:
                  "Medium",
              },
              {
                value:
                  "large",
                label:
                  "Large",
              },
            ]}
            onChange={(value) =>
              handleUpdate(
                "accessibility",
                "fontSize",
                String(
                  value,
                ),
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
      lineHeight: 20,
    },

    card: {
      borderWidth: 1,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 8,
    },

    cardTitle: {
      fontSize: 17,
      fontWeight: "800",
      paddingBottom: 10,
      marginBottom: 2,
      borderBottomWidth: 1,
    },
  });

export default AppearanceSettings;