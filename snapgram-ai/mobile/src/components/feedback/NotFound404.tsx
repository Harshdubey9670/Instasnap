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
  ArrowLeft,
  Home,
} from "lucide-react-native";
import {
  router,
} from "expo-router";

import {
  Button,
} from "../ui/Button";

export const NotFound404 =
  () => {
    const fadeIn =
      useRef(
        new Animated.Value(
          0,
        ),
      ).current;

    const slideDown =
      useRef(
        new Animated.Value(
          -20,
        ),
      ).current;

    const textOpacity =
      useRef(
        new Animated.Value(
          0,
        ),
      ).current;

    const buttonsOpacity =
      useRef(
        new Animated.Value(
          0,
        ),
      ).current;

    const buttonsY =
      useRef(
        new Animated.Value(
          20,
        ),
      ).current;

    useEffect(() => {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(
            fadeIn,
            {
              toValue: 1,
              duration: 500,
              useNativeDriver:
                true,
            },
          ),

          Animated.timing(
            slideDown,
            {
              toValue: 0,
              duration: 500,
              useNativeDriver:
                true,
            },
          ),
        ]),

        Animated.timing(
          textOpacity,
          {
            toValue: 1,
            duration: 500,
            delay: 200,
            useNativeDriver:
              true,
          },
        ),

        Animated.parallel([
          Animated.timing(
            buttonsOpacity,
            {
              toValue: 1,
              duration: 500,
              delay: 200,
              useNativeDriver:
                true,
            },
          ),

          Animated.timing(
            buttonsY,
            {
              toValue: 0,
              duration: 500,
              delay: 200,
              useNativeDriver:
                true,
            },
          ),
        ]),
      ]).start();
    }, [
      buttonsOpacity,
      buttonsY,
      fadeIn,
      slideDown,
      textOpacity,
    ]);

    return (
      <View
        style={
          styles.container
        }
      >
        <Animated.View
          style={[
            styles.hero,
            {
              opacity:
                fadeIn,
              transform: [
                {
                  translateY:
                    slideDown,
                },
              ],
            },
          ]}
        >
          <Text
            style={
              styles.code
            }
          >
            404
          </Text>

          <View
            style={
              styles.heroTitleOverlay
            }
          >
            <Text
              style={
                styles.pageTitle
              }
            >
              Page not found
            </Text>
          </View>
        </Animated.View>

        <Animated.View
          style={{
            opacity:
              textOpacity,
          }}
        >
          <Text
            style={
              styles.description
            }
          >
            Oops! The page you are looking for
            might have been removed, had its name
            changed, or is temporarily unavailable.
          </Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.buttons,
            {
              opacity:
                buttonsOpacity,
              transform: [
                {
                  translateY:
                    buttonsY,
                },
              ],
            },
          ]}
        >
          <Button
            onPress={() =>
              router.back()
            }
            variant="outline"
            leftIcon={
              <ArrowLeft
                size={16}
                color="#0f172a"
              />
            }
          >
            Go Back
          </Button>

          <Button
            onPress={() =>
              router.replace(
                "/",
              )
            }
            variant="gradient"
            leftIcon={
              <Home
                size={16}
                color="#ffffff"
              />
            }
          >
            Back to Home
          </Button>
        </Animated.View>
      </View>
    );
  };

const styles =
  StyleSheet.create({
    container: {
      flex: 1,

      alignItems:
        "center",
      justifyContent:
        "center",

      padding: 20,

      backgroundColor:
        "#f8fafc",
    },

    hero: {
      position:
        "relative",

      alignItems:
        "center",
      justifyContent:
        "center",

      marginBottom: 28,
    },

    code: {
      fontSize: 132,
      lineHeight: 140,

      fontWeight:
        "900",

      color:
        "#a855f7",

      opacity: 0.12,
    },

    heroTitleOverlay: {
      position:
        "absolute",

      left: 0,
      right: 0,
      top: 0,
      bottom: 0,

      alignItems:
        "center",
      justifyContent:
        "center",
    },

    pageTitle: {
      fontSize: 32,
      lineHeight: 40,

      fontWeight:
        "800",

      color:
        "#0f172a",

      textAlign:
        "center",
    },

    description: {
      maxWidth: 400,

      marginBottom: 28,

      fontSize: 14,
      lineHeight: 21,

      color:
        "#64748b",

      textAlign:
        "center",
    },

    buttons: {
      flexDirection:
        "row",
      flexWrap:
        "wrap",

      justifyContent:
        "center",

      gap: 12,
    },
  });

export default NotFound404;