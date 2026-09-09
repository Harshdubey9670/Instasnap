import React, {
  useEffect,
  useRef,
} from "react";
import {
  Animated,
  StyleSheet,
  View,
} from "react-native";

export const FeedSkeleton = () => {
  return (
    <View style={styles.container}>
      {[0, 1].map((item) => (
        <SkeletonCard
          key={item}
        />
      ))}
    </View>
  );
};

const SkeletonCard = () => {
  const opacity =
    useRef(
      new Animated.Value(0.45),
    ).current;

  useEffect(() => {
    const animation =
      Animated.loop(
        Animated.sequence([
          Animated.timing(
            opacity,
            {
              toValue: 0.85,
              duration: 700,
              useNativeDriver: true,
            },
          ),
          Animated.timing(
            opacity,
            {
              toValue: 0.45,
              duration: 700,
              useNativeDriver: true,
            },
          ),
        ]),
      );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.card,
        {
          opacity,
        },
      ]}
    >
      <View
        style={styles.header}
      >
        <View
          style={styles.headerUser}
        >
          <View
            style={styles.avatar}
          />

          <View
            style={styles.headerText}
          >
            <View
              style={
                styles.username
              }
            />

            <View
              style={
                styles.location
              }
            />
          </View>
        </View>

        <View
          style={
            styles.menu
          }
        />
      </View>

      <View
        style={
          styles.media
        }
      />

      <View
        style={
          styles.actionsSection
        }
      >
        <View
          style={
            styles.actionsRow
          }
        >
          <View
            style={
              styles.leftActions
            }
          >
            <View
              style={
                styles.action
              }
            />

            <View
              style={
                styles.action
              }
            />

            <View
              style={
                styles.action
              }
            />
          </View>

          <View
            style={
              styles.action
            }
          />
        </View>

        <View
          style={
            styles.likes
          }
        />

        <View
          style={
            styles.captionLarge
          }
        />

        <View
          style={
            styles.captionMedium
          }
        />

        <View
          style={
            styles.captionSmall
          }
        />
      </View>
    </Animated.View>
  );
};

const styles =
  StyleSheet.create({
    container: {
      width: "100%",
      gap: 24,
    },

    card: {
      width: "100%",
      overflow:
        "hidden",
      borderRadius: 24,
      backgroundColor:
        "#ffffff",
      borderWidth: 1,
      borderColor:
        "#e2e8f0",
    },

    header: {
      minHeight: 72,
      paddingHorizontal: 16,
      paddingVertical: 14,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
    },

    headerUser: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 12,
    },

    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor:
        "#f1f5f9",
    },

    headerText: {
      gap: 8,
    },

    username: {
      width: 96,
      height: 12,
      borderRadius: 6,
      backgroundColor:
        "#f1f5f9",
    },

    location: {
      width: 64,
      height: 10,
      borderRadius: 5,
      backgroundColor:
        "#f1f5f9",
    },

    menu: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor:
        "#f1f5f9",
    },

    media: {
      width: "100%",
      aspectRatio: 1,
      backgroundColor:
        "#f1f5f9",
    },

    actionsSection: {
      paddingHorizontal: 16,
      paddingVertical: 16,
    },

    actionsRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      marginBottom: 16,
    },

    leftActions: {
      flexDirection:
        "row",
      gap: 16,
    },

    action: {
      width: 24,
      height: 24,
      borderRadius: 6,
      backgroundColor:
        "#f1f5f9",
    },

    likes: {
      width: 72,
      height: 12,
      borderRadius: 6,
      backgroundColor:
        "#f1f5f9",
      marginBottom: 10,
    },

    captionLarge: {
      width: "72%",
      height: 10,
      borderRadius: 5,
      backgroundColor:
        "#f1f5f9",
      marginBottom: 8,
    },

    captionMedium: {
      width: "52%",
      height: 10,
      borderRadius: 5,
      backgroundColor:
        "#f1f5f9",
      marginBottom: 8,
    },

    captionSmall: {
      width: "35%",
      height: 10,
      borderRadius: 5,
      backgroundColor:
        "#f1f5f9",
    },
  });