import React, {
  useRef,
  useEffect,
} from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import {
  AlertCircle,
  RefreshCw,
} from "lucide-react-native";

import { useTheme } from "../../contexts/ThemeContext";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

export const ErrorState = ({
  title = "Something went wrong",
  message = "We couldn't load this content. Please try again.",
  onRetry,
  style,
}: ErrorStateProps) => {
  const {
    effectiveTheme,
  } = useTheme();

  const dark =
    effectiveTheme === "dark";

  const opacity =
    useRef(
      new Animated.Value(0),
    ).current;

  const translateY =
    useRef(
      new Animated.Value(10),
    ).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        easing:
          Easing.out(
            Easing.cubic,
          ),
        useNativeDriver: true,
      }),
      Animated.timing(
        translateY,
        {
          toValue: 0,
          duration: 250,
          easing:
            Easing.out(
              Easing.cubic,
            ),
          useNativeDriver: true,
        },
      ),
    ]).start();

    return () => {
      opacity.stopAnimation();
      translateY.stopAnimation();
    };
  }, [
    opacity,
    translateY,
  ]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor:
            dark
              ? "#130a1c"
              : "#ffffff",

          borderColor:
            dark
              ? "#2d1b3b"
              : "#e2e8f0",

          opacity,

          transform: [
            {
              translateY,
            },
          ],
        },
        style,
      ]}
    >
      <View
        style={
          styles.iconCircle
        }
      >
        <AlertCircle
          size={32}
          color="#ef4444"
          strokeWidth={2}
        />
      </View>

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
        {title}
      </Text>

      <Text
        style={[
          styles.message,
          {
            color:
              dark
                ? "#94a3b8"
                : "#64748b",
          },
        ]}
      >
        {message}
      </Text>

      {onRetry ? (
        <Pressable
          onPress={
            onRetry
          }
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.retryButton,
            pressed &&
              styles.retryPressed,
          ]}
        >
          <RefreshCw
            size={16}
            color="#ffffff"
            strokeWidth={2}
          />

          <Text
            style={
              styles.retryText
            }
          >
            Retry
          </Text>
        </Pressable>
      ) : null}
    </Animated.View>
  );
};

const styles =
  StyleSheet.create({
    container: {
      width: "100%",
      minHeight: 240,

      alignItems:
        "center",
      justifyContent:
        "center",

      paddingHorizontal: 16,
      paddingVertical: 64,

      borderWidth: 1,
      borderRadius: 16,
    },

    iconCircle: {
      width: 64,
      height: 64,

      borderRadius: 32,

      marginBottom: 16,

      alignItems:
        "center",
      justifyContent:
        "center",

      backgroundColor:
        "rgba(239,68,68,0.10)",
    },

    title: {
      fontSize: 20,
      lineHeight: 26,
      fontWeight: "700",
      textAlign: "center",
      marginBottom: 8,
    },

    message: {
      maxWidth: 360,
      fontSize: 14,
      lineHeight: 20,
      textAlign: "center",
      marginBottom: 24,
    },

    retryButton: {
      minHeight: 42,

      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",

      paddingHorizontal:
        24,
      paddingVertical:
        10,

      gap: 8,

      borderRadius: 12,

      backgroundColor:
        "#a855f7",
    },

    retryPressed: {
      opacity: 0.90,

      transform: [
        {
          scale: 0.96,
        },
      ],
    },

    retryText: {
      color: "#ffffff",
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "600",
    },
  });