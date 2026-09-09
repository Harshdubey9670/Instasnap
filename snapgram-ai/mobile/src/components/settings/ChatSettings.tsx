import React from "react";
import {
  StyleSheet,
  Text,
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
import {
  type AppDispatch,
  type RootState,
} from "../../store/store";
import { useToast } from "../ui/Toast";
import { useTheme } from "../../contexts/ThemeContext";
import { SettingToggle } from "./SettingToggle";
import { SettingSelect } from "./SettingSelect";

const ChatSettings = () => {
  const { settings } = useSelector(
    (state: RootState) => state.auth,
  );

  const dispatch = useDispatch<AppDispatch>();
  const { toast } = useToast();
  const { effectiveTheme } = useTheme();

  const dark = effectiveTheme === "dark";

  const handleUpdate = async (
    category: string,
    key: string,
    value: string | boolean,
  ) => {
    const updates = {
      [category]: {
        [key]: value,
      },
    };

    dispatch(
      optimisticUpdateSetting(updates),
    );

    try {
      await dispatch(
        updateSettings(updates),
      ).unwrap();
    } catch {
      toast({
        variant: "error",
        title: "Error",
        description:
          "Failed to update setting",
      });
    }
  };

  return (
    <View style={styles.container}>
      <View>
        <Text
          style={[
            styles.title,
            {
              color: dark
                ? "#f8fafc"
                : "#0f172a",
            },
          ]}
        >
          Chat & Messages
        </Text>

        <Text
          style={[
            styles.description,
            {
              color: dark
                ? "#94a3b8"
                : "#64748b",
            },
          ]}
        >
          Customize your direct messaging
          experience.
        </Text>
      </View>

      <SettingsCard
        title="Appearance"
        dark={dark}
      >
        <SettingSelect
          label="Chat Theme"
          description="Choose a default color theme for your chats."
          value={
            settings?.chat?.theme ||
            "default"
          }
          options={[
            {
              value: "default",
              label: "Default (Blue)",
            },
            {
              value: "monochrome",
              label: "Monochrome",
            },
            {
              value: "sunset",
              label: "Sunset Gradient",
            },
            {
              value: "neon",
              label: "Neon Cyber",
            },
          ]}
          onChange={(value) =>
            handleUpdate(
              "chat",
              "theme",
              String(value),
            )
          }
        />
      </SettingsCard>

      <SettingsCard
        title="Privacy"
        dark={dark}
      >
        <SettingToggle
          label="Auto Delete Messages"
          description="Automatically delete messages after 24 hours."
          checked={
            settings?.chat
              ?.autoDeleteMessages ||
            false
          }
          onChange={(value) =>
            handleUpdate(
              "chat",
              "autoDeleteMessages",
              value,
            )
          }
        />

        <SettingToggle
          label="Disappearing Mode"
          description="Messages vanish immediately after they are seen."
          checked={
            settings?.chat
              ?.disappearingMode ||
            false
          }
          onChange={(value) =>
            handleUpdate(
              "chat",
              "disappearingMode",
              value,
            )
          }
        />

        <SettingToggle
          label="Screenshot Detection"
          description="Notify you if someone takes a screenshot of your chat."
          checked={
            settings?.chat
              ?.screenshotDetection ??
            true
          }
          onChange={(value) =>
            handleUpdate(
              "chat",
              "screenshotDetection",
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
        backgroundColor: dark
          ? "#130a1c"
          : "#ffffff",
        borderColor: dark
          ? "#2d1b3b"
          : "#e2e8f0",
      },
    ]}
  >
    <Text
      style={[
        styles.cardTitle,
        {
          color: dark
            ? "#f8fafc"
            : "#0f172a",
          borderBottomColor: dark
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

const styles = StyleSheet.create({
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

export default ChatSettings;