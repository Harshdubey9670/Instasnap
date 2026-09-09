import React, {
  useEffect,
  useRef,
} from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useTheme } from "../../contexts/ThemeContext";

export const GlobalLoadingOverlay =
  () => {
    const {
      effectiveTheme,
    } = useTheme();

    const dark =
      effectiveTheme === "dark";

    const opacity =
      useRef(
        new Animated.Value(0),
      ).current;

    const pulse =
      useRef(
        new Animated.Value(0.85),
      ).current;

    useEffect(() => {
      Animated.timing(
        opacity,
        {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        },
      ).start();

      const animation =
        Animated.loop(
          Animated.sequence([
            Animated.timing(
              pulse,
              {
                toValue: 0.55,
                duration: 900,
                easing:
                  Easing.inOut(
                    Easing.ease,
                  ),
                useNativeDriver: true,
              },
            ),
            Animated.timing(
              pulse,
              {
                toValue: 0.95,
                duration: 900,
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
        opacity.stopAnimation();
        pulse.stopAnimation();
      };
    }, [
      opacity,
      pulse,
    ]);

    return (
      <Animated.View
        style={[
          styles.overlay,
          {
            backgroundColor:
              dark
                ? "rgba(10,5,16,0.80)"
                : "rgba(248,250,252,0.80)",
            opacity,
          },
        ]}
        pointerEvents="auto"
      >
        <ActivityIndicator
          size="large"
          color="#a855f7"
        />

        <Animated.Text
          style={[
            styles.title,
            {
              color:
                dark
                  ? "#f8fafc"
                  : "#0f172a",
              opacity: pulse,
            },
          ]}
        >
          Loading SnapGram AI...
        </Animated.Text>
      </Animated.View>
    );
  };

const styles =
  StyleSheet.create({
    overlay: {
      position:
        "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,

      zIndex: 10000,
      elevation: 10000,

      alignItems:
        "center",
      justifyContent:
        "center",

      padding: 24,
    },

    title: {
      marginTop: 16,
      fontSize: 20,
      lineHeight: 26,
      fontWeight: "600",
      textAlign: "center",
    },
  });