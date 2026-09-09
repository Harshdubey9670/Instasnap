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

const MediaVaultSettings = () => {
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
          Media & Vault
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
          Manage camera quality, post
          archiving, and memory backups.
        </Text>
      </View>

      <SettingsCard
        title="Camera Settings"
        dark={dark}
      >
        <SettingSelect
          label="Camera Upload Quality"
          description="High quality uploads use more data."
          value={
            settings?.media
              ?.cameraQuality ||
            "high"
          }
          options={[
            {
              value: "standard",
              label: "Standard (Data Saver)",
            },
            {
              value: "high",
              label: "High Quality",
            },
          ]}
          onChange={(value) =>
            handleUpdate(
              "media",
              "cameraQuality",
              String(value),
            )
          }
        />

        <SettingToggle
          label="Save Original Photos"
          description="Save unedited photos to your camera roll."
          checked={
            settings?.media
              ?.saveOriginalPhotos ??
            true
          }
          onChange={(value) =>
            handleUpdate(
              "media",
              "saveOriginalPhotos",
              value,
            )
          }
        />

        <SettingToggle
          label="Save Original Videos"
          description="Save unedited videos to your camera roll."
          checked={
            settings?.media
              ?.saveOriginalVideos ??
            true
          }
          onChange={(value) =>
            handleUpdate(
              "media",
              "saveOriginalVideos",
              value,
            )
          }
        />
      </SettingsCard>

      <SettingsCard
        title="Archiving & Vault"
        dark={dark}
      >
        <SettingToggle
          label="Auto-Archive Stories"
          description="Automatically save stories to your archive after 24 hours."
          checked={
            settings?.media
              ?.autoArchiveStories ??
            true
          }
          onChange={(value) =>
            handleUpdate(
              "media",
              "autoArchiveStories",
              value,
            )
          }
        />

        <SettingToggle
          label="Auto-Archive Posts"
          description="Automatically move old posts to archive after 1 year."
          checked={
            settings?.media
              ?.autoArchivePosts ||
            false
          }
          onChange={(value) =>
            handleUpdate(
              "media",
              "autoArchivePosts",
              value,
            )
          }
        />

        <SettingToggle
          label="Vault Cloud Backup"
          description="Securely backup your Memories Vault to the cloud."
          checked={
            settings?.media
              ?.vaultBackup ??
            true
          }
          onChange={(value) =>
            handleUpdate(
              "media",
              "vaultBackup",
              value,
            )
          }
        />
      </SettingsCard>

      <SettingsCard
        title="Sharing"
        dark={dark}
      >
        <SettingToggle
          label="Watermark Downloads"
          description="Add your username watermark when others download your content."
          checked={
            settings?.media
              ?.watermarkDownloads ??
            true
          }
          onChange={(value) =>
            handleUpdate(
              "media",
              "watermarkDownloads",
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

export default MediaVaultSettings;