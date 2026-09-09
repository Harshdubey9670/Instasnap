import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  router,
} from "expo-router";

import { Button } from "../ui/Button";
import { ThemeToggle } from "../ui/ThemeToggle";

export const PublicNavbar = () => {
  const scrollToSection =
    (id: string) => {
      /*
       * The web implementation uses document.getElementById()
       * and scrollIntoView().
       *
       * On native, section scrolling will be owned by the
       * landing-page ScrollView. The buttons remain here so
       * the public navigation API stays intact.
       */
      console.info(
        `Scroll to section: ${id}`,
      );
    };

  return (
    <View
      style={
        styles.container
      }
    >
      <View
        style={
          styles.content
        }
      >
        <Pressable
          onPress={() =>
            router.push(
              "/",
            )
          }
          accessibilityRole="button"
          accessibilityLabel="SnapGram AI home"
        >
          <Text
            style={
              styles.brand
            }
          >
            SnapGram AI
          </Text>
        </Pressable>

        <View
          style={
            styles.centerLinks
          }
        >
          <Pressable
            onPress={() =>
              scrollToSection(
                "features",
              )
            }
          >
            <Text
              style={
                styles.navLink
              }
            >
              Features
            </Text>
          </Pressable>

          <Pressable
            onPress={() =>
              scrollToSection(
                "testimonials",
              )
            }
          >
            <Text
              style={
                styles.navLink
              }
            >
              Testimonials
            </Text>
          </Pressable>

          <Pressable
            onPress={() =>
              scrollToSection(
                "faq",
              )
            }
          >
            <Text
              style={
                styles.navLink
              }
            >
              FAQ
            </Text>
          </Pressable>
        </View>

        <View
          style={
            styles.actions
          }
        >
          <View
            style={
              styles.themeButton
            }
          >
            <ThemeToggle />
          </View>

          <Button
            variant="ghost"
            size="sm"
            onPress={() =>
              router.push(
                "/auth/login",
              )
            }
          >
            Log in
          </Button>

          <Button
            variant="gradient"
            size="sm"
            onPress={() =>
              router.push(
                "/auth/signup",
              )
            }
          >
            Sign up
          </Button>
        </View>
      </View>
    </View>
  );
};

const styles =
  StyleSheet.create({
    container: {
      position:
        "absolute",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 500,
      elevation: 500,

      backgroundColor:
        "rgba(255,255,255,0.90)",

      borderBottomWidth: 1,
      borderBottomColor:
        "#e2e8f0",

      shadowColor:
        "#000000",
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.04,
      shadowRadius: 16,
    },

    content: {
      minHeight: 64,
      width: "100%",

      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",

      paddingHorizontal: 16,
    },

    brand: {
      fontSize: 24,
      fontWeight: "900",
      color: "#a855f7",
    },

    centerLinks: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 24,
    },

    navLink: {
      fontSize: 14,
      fontWeight: "500",
      color: "#64748b",
    },

    actions: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 8,
    },

    themeButton: {
      marginRight: 4,
    },
  });