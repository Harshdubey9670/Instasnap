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
import { SettingSelect } from "./SettingSelect";
import { SettingToggle } from "./SettingToggle";

const LanguageSettings = () => {
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
          Language
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
          Customize your language and
          translation preferences.
        </Text>
      </View>

      <SettingsCard
        title="App Language"
        dark={dark}
      >
        <SettingSelect
          label="Display Language"
          description="Choose the language for buttons, menus, and other interface text."
          value={
            settings?.language
              ?.preferred || "en"
          }
          options={[
            {
              value: "en",
              label: "English (US)",
            },
            {
              value: "hi",
              label: "Hindi",
            },
            {
              value: "es",
              label: "Español",
            },
            {
              value: "ar",
              label: "العربية (Arabic)",
            },
            {
              value: "fr",
              label: "Français",
            },
            {
              value: "de",
              label: "Deutsch",
            },
          ]}
          onChange={(value) =>
            handleUpdate(
              "language",
              "preferred",
              String(value),
            )
          }
        />
      </SettingsCard>

      <SettingsCard
        title="Translations"
        dark={dark}
      >
        <SettingToggle
          label="Auto-Translate Posts"
          description="Automatically translate post captions and comments to your display language."
          checked={
            settings?.language
              ?.autoTranslate ??
            true
          }
          onChange={(value) =>
            handleUpdate(
              "language",
              "autoTranslate",
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

export default LanguageSettings;