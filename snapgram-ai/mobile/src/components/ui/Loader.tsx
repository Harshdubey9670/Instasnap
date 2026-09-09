import React, {
  useEffect,
  useRef,
} from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

interface LoaderProps {
  size?:
    | "sm"
    | "md"
    | "lg"
    | "xl";
  className?: string;
  style?: StyleProp<ViewStyle>;
}

interface SkeletonProps {
  className?: string;
  style?: StyleProp<ViewStyle>;
}

export const Loader = ({
  size = "md",
  style,
}: LoaderProps) => {
  const rotation =
    useRef(
      new Animated.Value(0),
    ).current;

  useEffect(() => {
    const animation =
      Animated.loop(
        Animated.timing(
          rotation,
          {
            toValue: 1,
            duration: 900,
            easing:
              Easing.linear,
            useNativeDriver: true,
          },
        ),
      );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [rotation]);

  const dimension =
    getLoaderSize(size);

  const rotate =
    rotation.interpolate({
      inputRange: [0, 1],
      outputRange: [
        "0deg",
        "360deg",
      ],
    });

  return (
    <View
      style={[
        styles.container,
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.spinner,
          {
            width:
              dimension,
            height:
              dimension,
            borderRadius:
              dimension / 2,
            borderColor:
              "rgba(168,85,247,0.22)",
            borderTopColor:
              "#a855f7",
            transform: [
              {
                rotate,
              },
            ],
          },
        ]}
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel="Loading"
      />
    </View>
  );
};

export const Skeleton = ({
  style,
}: SkeletonProps) => {
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
              easing:
                Easing.inOut(
                  Easing.ease,
                ),
              useNativeDriver: true,
            },
          ),
          Animated.timing(
            opacity,
            {
              toValue: 0.45,
              duration: 700,
              easing:
                Easing.inOut(
                  Easing.ease,
                ),
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
        styles.skeleton,
        {
          opacity,
          backgroundColor:
            "#e2e8f0",
        },
        style,
      ]}
    />
  );
};

function getLoaderSize(
  size:
    | "sm"
    | "md"
    | "lg"
    | "xl",
): number {
  switch (size) {
    case "sm":
      return 16;

    case "lg":
      return 48;

    case "xl":
      return 64;

    case "md":
    default:
      return 32;
  }
}

const styles =
  StyleSheet.create({
    container: {
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    spinner: {
      borderWidth: 3,
    },

    skeleton: {
      minHeight: 16,
      borderRadius: 6,
    },
  });