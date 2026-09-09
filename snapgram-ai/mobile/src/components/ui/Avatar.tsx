import React, {
  forwardRef,
  useState,
} from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageProps,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from "react-native";
import {
  User,
} from "lucide-react-native";

import { useTheme } from "../../contexts/ThemeContext";

type AvatarSize =
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "xl";

interface AvatarProps
  extends Omit<ViewProps, "style"> {
  src?: ImageProps["source"] | string | null;
  alt?: string;
  size?: AvatarSize;
  fallback?: React.ReactNode;
  isOnline?: boolean;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

const Avatar = forwardRef<
  View,
  AvatarProps
>(
  (
    {
      src,
      alt = "Avatar",
      size = "md",
      fallback,
      isOnline = false,
      style,
      className: _className,
      ...props
    },
    ref,
  ) => {
    const [error, setError] =
      useState(false);

    const {
      effectiveTheme,
    } = useTheme();

    const dark =
      effectiveTheme === "dark";

    const dimensions =
      getAvatarSize(size);

    const backgroundColor = dark
      ? "#1e112c"
      : "#f1f5f9";

    const surfaceColor = dark
      ? "#130a1c"
      : "#ffffff";

    const fallbackBackground =
      dark
        ? "#581c87"
        : "#f3e8ff";

    const fallbackIconColor =
      dark
        ? "#d8b4fe"
        : "#7e22ce";

    const imageSource =
      resolveImageSource(src);

    return (
      <View
        ref={ref}
        style={styles.wrapper}
        {...props}
      >
        <View
          style={[
            styles.avatar,
            {
              width:
                dimensions.size,
              height:
                dimensions.size,
              borderRadius:
                dimensions.size /
                2,
              backgroundColor,
              borderColor:
                surfaceColor,
              borderWidth: 2,
            },
            style,
          ]}
          accessible
          accessibilityRole="image"
          accessibilityLabel={
            alt
          }
        >
          {imageSource &&
          !error ? (
            <Image
              source={imageSource}
              style={[
                styles.image,
                {
                  width:
                    dimensions.size,
                  height:
                    dimensions.size,
                  borderRadius:
                    dimensions.size /
                    2,
                },
              ]}
              resizeMode="cover"
              accessible
              accessibilityLabel={
                alt
              }
              onError={() =>
                setError(true)
              }
            />
          ) : (
            <View
              style={[
                styles.fallback,
                {
                  backgroundColor:
                    fallbackBackground,
                },
              ]}
            >
              {typeof fallback === "string" || typeof fallback === "number" ? (
                <Text
                  style={[
                    styles.fallbackText,
                    {
                      fontSize: Math.max(12, Math.round(dimensions.size * 0.4)),
                      color: fallbackIconColor,
                    },
                  ]}
                >
                  {fallback}
                </Text>
              ) : (
                fallback || (
                  <User
                    size={
                      Math.max(
                        16,
                        Math.round(
                          dimensions.size *
                            0.5,
                        ),
                      )
                    }
                    color={
                      fallbackIconColor
                    }
                    strokeWidth={2}
                  />
                )
              )}
            </View>
          )}
        </View>

        {isOnline ? (
          <View
            style={[
              styles.onlineIndicator,
              {
                width:
                  dimensions.onlineSize,
                height:
                  dimensions.onlineSize,
                borderRadius:
                  dimensions.onlineSize /
                  2,
                backgroundColor:
                  "#22c55e",
                borderColor:
                  dark
                    ? "#0a0510"
                    : "#f8fafc",
                borderWidth: 2,
              },
            ]}
            accessible
            accessibilityLabel="Online"
          />
        ) : null}
      </View>
    );
  },
);

Avatar.displayName =
  "Avatar";

function resolveImageSource(
  src:
    | ImageProps["source"]
    | string
    | null
    | undefined,
): ImageProps["source"] | null {
  if (!src) {
    return null;
  }

  if (
    typeof src === "string"
  ) {
    return {
      uri: src,
    };
  }

  return src;
}

function getAvatarSize(
  size: AvatarSize,
) {
  switch (size) {
    case "xs":
      return {
        size: 24,
        onlineSize: 6,
      };

    case "sm":
      return {
        size: 32,
        onlineSize: 8,
      };

    case "lg":
      return {
        size: 64,
        onlineSize: 12,
      };

    case "xl":
      return {
        size: 96,
        onlineSize: 16,
      };

    case "md":
    default:
      return {
        size: 48,
        onlineSize: 12,
      };
  }
}

const styles =
  StyleSheet.create({
    wrapper: {
      position:
        "relative",
      alignSelf:
        "flex-start",
    },

    avatar: {
      overflow:
        "hidden",
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    image: {
      width: "100%",
      height: "100%",
    },

    fallback: {
      width: "100%",
      height: "100%",
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    onlineIndicator: {
      position:
        "absolute",
      right: 0,
      bottom: 0,
    },

    fallbackText: {
      fontWeight: "600",
      textAlign: "center",
    },
  });

export { Avatar };