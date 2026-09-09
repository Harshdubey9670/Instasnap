import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  BellOff,
  ChevronRight,
  UserMinus,
  UserX,
  Users,
} from "lucide-react-native";
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

const PrivacySettings = () => {
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
          Privacy & Safety
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
          Control who can see your content
          and interact with you.
        </Text>
      </View>

      <SettingsCard
        title="Account Privacy"
        dark={dark}
      >
        <SettingToggle
          label="Private Account"
          description="Only approved followers can see your posts and stories."
          checked={
            settings?.privacy
              ?.isPrivate ||
            false
          }
          onChange={(value) =>
            handleUpdate(
              "privacy",
              "isPrivate",
              value,
            )
          }
        />

        <SettingToggle
          label="Activity Status"
          description="Allow accounts you follow to see when you were last active."
          checked={
            settings?.privacy
              ?.activityStatus ||
            false
          }
          onChange={(value) =>
            handleUpdate(
              "privacy",
              "activityStatus",
              value,
            )
          }
        />

        <SettingToggle
          label="Read Receipts"
          description="Let people know when you've read their messages."
          checked={
            settings?.privacy
              ?.readReceipts ??
            true
          }
          onChange={(value) =>
            handleUpdate(
              "privacy",
              "readReceipts",
              value,
            )
          }
        />

        <SettingToggle
          label="Hide Followers"
          description="Hide your followers list from other users."
          checked={
            settings?.privacy
              ?.hideFollowers ||
            false
          }
          onChange={(value) =>
            handleUpdate(
              "privacy",
              "hideFollowers",
              value,
            )
          }
        />

        <SettingToggle
          label="Hide Following"
          description="Hide the list of people you follow."
          checked={
            settings?.privacy
              ?.hideFollowing ||
            false
          }
          onChange={(value) =>
            handleUpdate(
              "privacy",
              "hideFollowing",
              value,
            )
          }
        />
      </SettingsCard>

      <SettingsCard
        title="Manage Connections"
        dark={dark}
      >
        <ConnectionRow
          icon={
            <Users
              size={20}
              color="#22c55e"
            />
          }
          title="Close Friends"
          description="Share stories with a select group"
          color="#22c55e"
        />

        <ConnectionRow
          icon={
            <UserX
              size={20}
              color="#ef4444"
            />
          }
          title="Blocked Users"
          description="Manage blocked accounts"
          color="#ef4444"
        />

        <ConnectionRow
          icon={
            <UserMinus
              size={20}
              color="#f97316"
            />
          }
          title="Restricted Users"
          description="Limit interactions without blocking"
          color="#f97316"
        />

        <ConnectionRow
          icon={
            <BellOff
              size={20}
              color="#a855f7"
            />
          }
          title="Muted Users"
          description="Hide posts and stories"
          color="#a855f7"
        />
      </SettingsCard>

      <SettingsCard
        title="Interactions"
        dark={dark}
      >
        <SettingSelect
          label="Who Can Message You"
          description="Choose who can send you direct messages."
          value={
            settings?.privacy
              ?.whoCanMessage ||
            "everyone"
          }
          options={[
            {
              value: "everyone",
              label: "Everyone",
            },
            {
              value: "following",
              label: "People you follow",
            },
            {
              value: "nobody",
              label: "Nobody",
            },
          ]}
          onChange={(value) =>
            handleUpdate(
              "privacy",
              "whoCanMessage",
              String(value),
            )
          }
        />

        <SettingSelect
          label="Story Privacy"
          description="Choose who can see your stories."
          value={
            settings?.privacy
              ?.storyPrivacy ||
            "everyone"
          }
          options={[
            {
              value: "everyone",
              label: "Everyone",
            },
            {
              value: "following",
              label: "People you follow",
            },
            {
              value: "closeFriends",
              label: "Close Friends Only",
            },
          ]}
          onChange={(value) =>
            handleUpdate(
              "privacy",
              "storyPrivacy",
              String(value),
            )
          }
        />

        <SettingSelect
          label="Story Replies"
          description="Choose who can reply to your stories."
          value={
            settings?.privacy
              ?.storyReplies ||
            "everyone"
          }
          options={[
            {
              value: "everyone",
              label: "Everyone",
            },
            {
              value: "following",
              label: "People you follow",
            },
            {
              value: "nobody",
              label: "Nobody",
            },
          ]}
          onChange={(value) =>
            handleUpdate(
              "privacy",
              "storyReplies",
              String(value),
            )
          }
        />

        <SettingSelect
          label="Tags & Mentions"
          description="Choose who can tag or mention you in posts and comments."
          value={
            settings?.privacy
              ?.whoCanTag ||
            "everyone"
          }
          options={[
            {
              value: "everyone",
              label: "Everyone",
            },
            {
              value: "following",
              label: "People you follow",
            },
            {
              value: "nobody",
              label: "Nobody",
            },
          ]}
          onChange={(value) =>
            handleUpdate(
              "privacy",
              "whoCanTag",
              String(value),
            )
          }
        />
      </SettingsCard>

      <SettingsCard
        title="Safety Filters"
        dark={dark}
      >
        <SettingToggle
          label="Filter Offensive Comments"
          description="Automatically hide comments that may be offensive."
          checked={
            settings?.privacy
              ?.filterOffensiveComments ??
            true
          }
          onChange={(value) =>
            handleUpdate(
              "privacy",
              "filterOffensiveComments",
              value,
            )
          }
        />
      </SettingsCard>
    </View>
  );
};

const ConnectionRow = ({
  icon,
  title,
  description,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}) => (
  <Pressable
    style={({ pressed }) => [
      styles.connectionRow,
      pressed && styles.pressed,
    ]}
  >
    <View style={styles.connectionLeft}>
      <View
        style={[
          styles.connectionIcon,
          {
            backgroundColor: `${color}15`,
          },
        ]}
      >
        {icon}
      </View>

      <View style={styles.connectionCopy}>
        <Text style={styles.connectionTitle}>
          {title}
        </Text>

        <Text style={styles.connectionDescription}>
          {description}
        </Text>
      </View>
    </View>

    <ChevronRight
      size={19}
      color="#64748b"
    />
  </Pressable>
);

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

  connectionRow: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "space-between",
    borderRadius: 12,
    paddingVertical: 8,
  },

  connectionLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
  },

  connectionIcon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    marginRight: 12,
  },

  connectionCopy: {
    flex: 1,
    minWidth: 0,
  },

  connectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
  },

  connectionDescription: {
    marginTop: 3,
    fontSize: 12,
    color: "#64748b",
  },

  pressed: {
    opacity: 0.75,
  },
});

export default PrivacySettings;