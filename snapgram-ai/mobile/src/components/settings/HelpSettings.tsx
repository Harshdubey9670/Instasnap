import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  ExternalLink,
  Flag,
  HelpCircle,
  MessageSquare,
} from "lucide-react-native";
import { useTheme } from "../../contexts/ThemeContext";

const HelpSettings = () => {
  const { effectiveTheme } = useTheme();
  const dark = effectiveTheme === "dark";

  const surface = dark
    ? "#130a1c"
    : "#ffffff";

  const text = dark
    ? "#f8fafc"
    : "#0f172a";

  const secondary = dark
    ? "#94a3b8"
    : "#64748b";

  const border = dark
    ? "#2d1b3b"
    : "#e2e8f0";

  return (
    <View style={styles.container}>
      <View>
        <Text
          style={[
            styles.title,
            { color: text },
          ]}
        >
          Help & Support
        </Text>

        <Text
          style={[
            styles.description,
            { color: secondary },
          ]}
        >
          Get assistance or find answers to
          your questions.
        </Text>
      </View>

      <View
        style={[
          styles.card,
          {
            backgroundColor: surface,
            borderColor: border,
          },
        ]}
      >
        <Text
          style={[
            styles.cardTitle,
            {
              color: text,
              borderBottomColor: border,
            },
          ]}
        >
          Support Center
        </Text>

        <HelpRow
          icon={
            <HelpCircle
              size={20}
              color="#a855f7"
            />
          }
          title="Help Center"
          description="Find articles and answers"
          iconBackground="rgba(168,85,247,0.10)"
          secondary={secondary}
        />

        <HelpRow
          icon={
            <MessageSquare
              size={20}
              color="#a855f7"
            />
          }
          title="Support Inbox"
          description="Check replies from our team"
          iconBackground="rgba(168,85,247,0.10)"
          secondary={secondary}
        />
      </View>

      <View
        style={[
          styles.card,
          {
            backgroundColor: surface,
            borderColor: border,
          },
        ]}
      >
        <Text
          style={[
            styles.cardTitle,
            {
              color: text,
              borderBottomColor: border,
            },
          ]}
        >
          Feedback
        </Text>

        <HelpRow
          icon={
            <Flag
              size={20}
              color="#f97316"
            />
          }
          title="Report a Problem"
          description="Let us know if something is broken"
          iconBackground="rgba(249,115,22,0.10)"
          secondary={secondary}
          showExternal={false}
        />
      </View>
    </View>
  );
};

const HelpRow = ({
  icon,
  title,
  description,
  iconBackground,
  secondary,
  showExternal = true,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  iconBackground: string;
  secondary: string;
  showExternal?: boolean;
}) => (
  <Pressable
    style={({ pressed }) => [
      styles.row,
      pressed && styles.pressed,
    ]}
  >
    <View style={styles.rowLeft}>
      <View
        style={[
          styles.iconBox,
          {
            backgroundColor:
              iconBackground,
          },
        ]}
      >
        {icon}
      </View>

      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>
          {title}
        </Text>

        <Text
          style={[
            styles.rowDescription,
            { color: secondary },
          ]}
        >
          {description}
        </Text>
      </View>
    </View>

    {showExternal ? (
      <ExternalLink
        size={20}
        color={secondary}
      />
    ) : null}
  </Pressable>
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
    padding: 16,
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: "800",
    paddingBottom: 10,
    marginBottom: 2,
    borderBottomWidth: 1,
  },

  row: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderRadius: 12,
  },

  rowLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
  },

  iconBox: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    marginRight: 12,
  },

  rowText: {
    flex: 1,
    minWidth: 0,
  },

  rowTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
  },

  rowDescription: {
    marginTop: 3,
    fontSize: 12,
  },

  pressed: {
    opacity: 0.75,
  },
});

export default HelpSettings;