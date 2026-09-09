import React, {
  useEffect,
  useRef,
} from "react";
import {
  Animated,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  Avatar,
} from "../ui/Avatar";

interface OtherUser {
  _id?: string;
  username?: string;
  profilePicture?: string;
  avatar?: string;
}

interface ConversationPresenceAvatarProps {
  otherUser?: OtherUser | null;
  isPresent: boolean;
  isTyping: boolean;
}

export const ConversationPresenceAvatar =
  ({
    otherUser,
    isPresent,
    isTyping,
  }: ConversationPresenceAvatarProps) => {
    const presenceOpacity =
      useRef(
        new Animated.Value(0),
      ).current;

    const presenceScale =
      useRef(
        new Animated.Value(0.5),
      ).current;

    const presenceY =
      useRef(
        new Animated.Value(20),
      ).current;

    const avatarY =
      useRef(
        new Animated.Value(0),
      ).current;

    const avatarScale =
      useRef(
        new Animated.Value(1),
      ).current;

    const dotAnimations =
      [
        useRef(
          new Animated.Value(0),
        ).current,
        useRef(
          new Animated.Value(0),
        ).current,
        useRef(
          new Animated.Value(0),
        ).current,
      ];

    useEffect(() => {
      Animated.parallel([
        Animated.spring(
          presenceOpacity,
          {
            toValue:
              isPresent
                ? 1
                : 0,
            useNativeDriver:
              true,
          },
        ),

        Animated.spring(
          presenceScale,
          {
            toValue:
              isPresent
                ? 1
                : 0.5,
            friction: 7,
            tension: 80,
            useNativeDriver:
              true,
          },
        ),

        Animated.spring(
          presenceY,
          {
            toValue:
              isPresent
                ? 0
                : 20,
            friction: 7,
            tension: 80,
            useNativeDriver:
              true,
          },
        ),
      ]).start();
    }, [
      isPresent,
      presenceOpacity,
      presenceScale,
      presenceY,
    ]);

    useEffect(() => {
      const animation =
        Animated.loop(
          Animated.sequence([
            Animated.timing(
              avatarY,
              {
                toValue:
                  isTyping
                    ? -6
                    : -3,
                duration:
                  isTyping
                    ? 300
                    : 1500,
                useNativeDriver:
                  true,
              },
            ),

            Animated.timing(
              avatarY,
              {
                toValue: 0,
                duration:
                  isTyping
                    ? 300
                    : 1500,
                useNativeDriver:
                  true,
              },
            ),
          ]),
        );

      const scaleAnimation =
        Animated.loop(
          Animated.sequence([
            Animated.timing(
              avatarScale,
              {
                toValue:
                  isTyping
                    ? 1.05
                    : 1,
                duration:
                  isTyping
                    ? 300
                    : 1500,
                useNativeDriver:
                  true,
              },
            ),

            Animated.timing(
              avatarScale,
              {
                toValue: 1,
                duration:
                  isTyping
                    ? 300
                    : 1500,
                useNativeDriver:
                  true,
              },
            ),
          ]),
        );

      animation.start();
      scaleAnimation.start();

      return () => {
        animation.stop();
        scaleAnimation.stop();
      };
    }, [
      avatarScale,
      avatarY,
      isTyping,
    ]);

    useEffect(() => {
      if (!isTyping) {
        dotAnimations.forEach(
          (value) =>
            value.setValue(0),
        );
        return;
      }

      const animations =
        dotAnimations.map(
          (
            value,
            index,
          ) =>
            Animated.loop(
              Animated.sequence([
                Animated.timing(
                  value,
                  {
                    toValue:
                      -3,
                    duration: 300,
                    delay:
                      index *
                      200,
                    useNativeDriver:
                      true,
                  },
                ),
                Animated.timing(
                  value,
                  {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver:
                      true,
                  },
                ),
              ]),
            ),
          );

      animations.forEach(
        (animation) =>
          animation.start(),
      );

      return () => {
        animations.forEach(
          (animation) =>
            animation.stop(),
        );
      };
    }, [
      dotAnimations,
      isTyping,
    ]);

    if (!otherUser) {
      return null;
    }

    return (
      <Animated.View
        pointerEvents="none"
        style={[
          styles.container,
          {
            opacity:
              presenceOpacity,
            transform: [
              {
                scale:
                  presenceScale,
              },
              {
                translateY:
                  presenceY,
              },
            ],
          },
        ]}
      >
        <View
          style={
            styles.avatarContainer
          }
        >
          <Animated.View
            style={[
              styles.avatarWrapper,
              {
                transform: [
                  {
                    translateY:
                      avatarY,
                  },
                  {
                    scale:
                      avatarScale,
                  },
                ],
              },
            ]}
          >
            <Avatar
              src={
                otherUser.profilePicture ||
                otherUser.avatar
              }
              fallback={
                otherUser.username
                  ?.charAt(0)
                  ?.toUpperCase() ||
                "U"
              }
              size="sm"
            />
          </Animated.View>

          {isTyping ? (
            <View
              style={
                styles.typingBubble
              }
            >
              {dotAnimations.map(
                (
                  animation,
                  index,
                ) => (
                  <Animated.View
                    key={
                      index
                    }
                    style={[
                      styles.dot,
                      {
                        transform: [
                          {
                            translateY:
                              animation,
                          },
                        ],
                      },
                    ]}
                  />
                ),
              )}
            </View>
          ) : null}
        </View>
      </Animated.View>
    );
  };

const styles =
  StyleSheet.create({
    container: {
      position:
        "absolute",
      left: 16,
      bottom: 8,

      flexDirection:
        "row",
      alignItems:
        "flex-end",

      zIndex: 20,
    },

    avatarContainer: {
      position:
        "relative",
    },

    avatarWrapper: {
      width: 46,
      height: 46,

      alignItems:
        "center",
      justifyContent:
        "center",

      borderRadius: 23,

      borderWidth: 2,
      borderColor:
        "rgba(168,85,247,0.50)",

      backgroundColor:
        "#130a1c",

      shadowColor:
        "#000000",
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.20,
      shadowRadius: 7,
      elevation: 5,
    },

    typingBubble: {
      position:
        "absolute",
      top: -7,
      right: -8,

      minWidth: 34,
      height: 23,

      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",

      gap: 3,

      paddingHorizontal: 7,

      borderRadius: 14,

      backgroundColor:
        "#f1f5f9",

      borderWidth: 1,
      borderColor:
        "#e2e8f0",

      shadowColor:
        "#000000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.12,
      shadowRadius: 4,
      elevation: 3,
    },

    dot: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
      backgroundColor:
        "#a855f7",
    },
  });

export default ConversationPresenceAvatar;