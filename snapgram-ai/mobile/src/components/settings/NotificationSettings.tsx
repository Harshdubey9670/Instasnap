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

const NotificationSettings = () => {
  const { settings } = useSelector(
    (state: RootState) => state.auth,
  );

  const dispatch = useDispatch<AppDispatch>();
  const { toast } = useToast();
  const { effectiveTheme } = useTheme();

  const dark = effectiveTheme === "dark";

  const handleUpdate = async (
    type: string,
    key: string,
    value: boolean,
  ) => {
    const updates = {
      notifications: {
        [type]: {
          ...(settings?.notifications?.[
            type as
              | "push"
              | "email"
          ] || {}),
          [key]: value,
        },
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
          "Failed to update notification settings",
      });
    }
  };

  const handlePauseAll =
    async (value: boolean) => {
      const updates = {
        notifications: {
          pauseAll: value,
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
            "Failed to update notification settings",
        });
      }
    };

  const isPaused =
    settings?.notifications
      ?.pauseAll || false;

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
          Notifications
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
          Choose how you want to be notified
          about activity.
        </Text>
      </View>

      <SettingsCard dark={dark}>
        <SettingToggle
          label="Pause All Notifications"
          description="Temporarily mute all push notifications."
          checked={isPaused}
          onChange={
            handlePauseAll
          }
        />
      </SettingsCard>

      <View
        style={
          isPaused
            ? styles.disabledGroup
            : undefined
        }
      >
        <SettingsCard
          title="Push Notifications"
          dark={dark}
        >
          <SettingToggle
            label="Likes & Comments"
            checked={
              settings?.notifications
                ?.push?.likes ??
              true
            }
            disabled={isPaused}
            onChange={(value) =>
              handleUpdate(
                "push",
                "likes",
                value,
              )
            }
          />

          <SettingToggle
            label="Mentions & Tags"
            checked={
              settings?.notifications
                ?.push?.mentions ??
              true
            }
            disabled={isPaused}
            onChange={(value) =>
              handleUpdate(
                "push",
                "mentions",
                value,
              )
            }
          />

          <SettingToggle
            label="Direct Messages"
            checked={
              settings?.notifications
                ?.push?.messages ??
              true
            }
            disabled={isPaused}
            onChange={(value) =>
              handleUpdate(
                "push",
                "messages",
                value,
              )
            }
          />

          <SettingToggle
            label="New Followers"
            checked={
              settings?.notifications
                ?.push?.newFollowers ??
              true
            }
            disabled={isPaused}
            onChange={(value) =>
              handleUpdate(
                "push",
                "newFollowers",
                value,
              )
            }
          />

          <SettingToggle
            label="Live Videos"
            checked={
              settings?.notifications
                ?.push?.live ??
              true
            }
            disabled={isPaused}
            onChange={(value) =>
              handleUpdate(
                "push",
                "live",
                value,
              )
            }
          />
        </SettingsCard>

        <SettingsCard
          title="Email Notifications"
          dark={dark}
        >
          <SettingToggle
            label="Security Alerts"
            description="Important alerts about your account security."
            checked={
              settings?.notifications
                ?.email
                ?.securityAlerts ??
              true
            }
            disabled={isPaused}
            onChange={(value) =>
              handleUpdate(
                "email",
                "securityAlerts",
                value,
              )
            }
          />

          <SettingToggle
            label="News & Updates"
            description="Feature updates and community news."
            checked={
              settings?.notifications
                ?.email
                ?.news ??
              true
            }
            disabled={isPaused}
            onChange={(value) =>
              handleUpdate(
                "email",
                "news",
                value,
              )
            }
          />

          <SettingToggle
            label="Marketing Emails"
            checked={
              settings?.notifications
                ?.email
                ?.marketing ??
              false
            }
            disabled={isPaused}
            onChange={(value) =>
              handleUpdate(
                "email",
                "marketing",
                value,
              )
            }
          />
        </SettingsCard>
      </View>
    </View>
  );
};

const SettingsCard = ({
  title,
  dark,
  children,
}: {
  title?: string;
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
    {title ? (
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
    ) : null}

    {children}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 20,
    paddingBottom: 32,
  },

  disabledGroup: {
    opacity: 0.5,
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

export default NotificationSettings;