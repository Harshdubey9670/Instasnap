import React from "react";
import {
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  FolderSearch,
} from "lucide-react-native";

import {
  Button,
} from "../ui/Button";

interface EmptyStateProps {
  icon?: React.ComponentType<any>;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState = ({
  icon: Icon = FolderSearch,
  title = "No results found",
  description = "There are currently no items to display here.",
  actionLabel,
  onAction,
}: EmptyStateProps) => {
  return (
    <View
      style={
        styles.container
      }
    >
      <View
        style={
          styles.iconCircle
        }
      >
        <Icon
          size={40}
          color="#64748b"
          strokeWidth={2}
        />
      </View>

      <Text
        style={
          styles.title
        }
      >
        {title}
      </Text>

      <Text
        style={
          styles.description
        }
      >
        {description}
      </Text>

      {actionLabel &&
      onAction ? (
        <View
          style={
            styles.action
          }
        >
          <Button
            onPress={
              onAction
            }
            variant="outline"
          >
            {actionLabel}
          </Button>
        </View>
      ) : null}
    </View>
  );
};

const styles =
  StyleSheet.create({
    container: {
      width: "100%",

      alignItems:
        "center",
      justifyContent:
        "center",

      padding: 32,

      textAlign:
        "center",
    },

    iconCircle: {
      width: 80,
      height: 80,

      borderRadius: 40,

      alignItems:
        "center",
      justifyContent:
        "center",

      backgroundColor:
        "#f1f5f9",

      marginBottom: 16,
    },

    title: {
      marginBottom: 8,

      fontSize: 18,
      lineHeight: 24,

      fontWeight:
        "700",

      color:
        "#0f172a",

      textAlign:
        "center",
    },

    description: {
      maxWidth: 320,

      marginBottom: 24,

      fontSize: 13,
      lineHeight: 19,

      color:
        "#64748b",

      textAlign:
        "center",
    },

    action: {
      alignItems:
        "center",
    },
  });

export default EmptyState;