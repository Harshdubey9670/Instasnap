import React from "react";
import {
  StyleSheet,
  Text,
  type StyleProp,
  type TextStyle,
} from "react-native";
import {
  router,
} from "expo-router";

interface RenderCaptionProps {
  caption?: string | null;
  style?: StyleProp<TextStyle>;
}

export const RenderCaption = ({
  caption,
  style,
}: RenderCaptionProps) => {
  if (!caption) {
    return null;
  }

  const parts =
    caption.split(
      /(#\w+|@\w+)/g,
    );

  return (
    <Text
      style={[
        {
          color:
            "#0f172a",
          fontSize: 14,
          lineHeight: 20,
        },
        style,
      ]}
    >
      {parts.map(
        (
          part,
          index,
        ) => {
          if (
            /^#\w+$/.test(
              part,
            )
          ) {
            const tag =
              part
                .slice(
                  1,
                )
                .toLowerCase();

            return (
              <Text
                key={index}
                onPress={() =>
                  router.push(
                    `/app/hashtag/${tag}` as any,
                  )
                }
                style={
                  styles.hashtag
                }
                accessibilityRole="link"
              >
                {part}
              </Text>
            );
          }

          if (
            /^@\w+$/.test(
              part,
            )
          ) {
            const username =
              part
                .slice(
                  1,
                )
                .toLowerCase();

            return (
              <Text
                key={index}
                onPress={() =>
                  router.push(
                    `/app/profile/u/${username}` as any,
                  )
                }
                style={
                  styles.mention
                }
                accessibilityRole="link"
              >
                {part}
              </Text>
            );
          }

          return (
            <Text
              key={index}
            >
              {part}
            </Text>
          );
        },
      )}
    </Text>
  );
};

const styles =
  StyleSheet.create({
    hashtag: {
      color:
        "#a855f7",
      fontWeight:
        "500",
    },

    mention: {
      color:
        "#38bdf8",
      fontWeight:
        "500",
    },
  });