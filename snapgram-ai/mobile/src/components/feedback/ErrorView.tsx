import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  AlertTriangle,
  RefreshCw,
} from "lucide-react-native";

import {
  Button,
} from "../ui/Button";

interface ErrorViewProps {
  error?: Error | unknown;
  resetErrorBoundary?: () => void;
  title?: string;
}

const getErrorMessage = (
  error: unknown,
): string => {
  if (!error) {
    return "";
  }

  if (
    error instanceof Error
  ) {
    return error.message;
  }

  if (
    typeof error ===
    "string"
  ) {
    return error;
  }

  try {
    return JSON.stringify(
      error,
    );
  } catch {
    return String(
      error,
    );
  }
};

export const ErrorView = ({
  error,
  resetErrorBoundary,
  title = "Something went wrong!",
}: ErrorViewProps) => {
  const errorMessage =
    getErrorMessage(
      error,
    );

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
        <AlertTriangle
          size={32}
          color="#ef4444"
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

      {errorMessage ? (
        <View
          style={
            styles.errorBox
          }
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={
              false
            }
          >
            <Text
              style={
                styles.errorText
              }
            >
              {errorMessage}
            </Text>
          </ScrollView>
        </View>
      ) : null}

      {resetErrorBoundary ? (
        <Button
          onPress={
            resetErrorBoundary
          }
          variant="outline"
          leftIcon={
            <RefreshCw
              size={16}
              color="#0f172a"
            />
          }
        >
          Try again
        </Button>
      ) : null}
    </View>
  );
};

const styles =
  StyleSheet.create({
    container: {
      width: "100%",
      minHeight: 400,

      alignItems:
        "center",
      justifyContent:
        "center",

      padding: 24,
    },

    iconCircle: {
      width: 64,
      height: 64,

      borderRadius: 32,

      alignItems:
        "center",
      justifyContent:
        "center",

      backgroundColor:
        "#fef2f2",

      marginBottom: 16,
    },

    title: {
      marginBottom: 10,

      fontSize: 20,
      lineHeight: 27,

      fontWeight:
        "700",

      color:
        "#0f172a",

      textAlign:
        "center",
    },

    errorBox: {
      width: "100%",
      maxWidth: 520,

      maxHeight: 160,

      padding: 14,

      marginBottom: 20,

      borderRadius: 10,

      backgroundColor:
        "#f1f5f9",
    },

    errorText: {
      color:
        "#ef4444",

      fontSize: 12,
      lineHeight: 18,

      fontFamily:
        "monospace",
    },
  });

export default ErrorView;