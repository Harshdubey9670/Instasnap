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

export const Footer = () => {
  const year =
    new Date().getFullYear();

  return (
    <View
      style={
        styles.footer
      }
    >
      <View
        style={
          styles.content
        }
      >
        <Text
          style={
            styles.copyright
          }
        >
          © {year} SnapGram AI.
          All rights reserved.
        </Text>

        <View
          style={
            styles.links
          }
        >
          <FooterLink
            label="About"
            path="/about"
          />

          <FooterLink
            label="Privacy"
            path="/privacy"
          />

          <FooterLink
            label="Terms"
            path="/terms"
          />
        </View>
      </View>
    </View>
  );
};

interface FooterLinkProps {
  label: string;
  path: string;
}

const FooterLink = ({
  label,
  path,
}: FooterLinkProps) => (
  <Pressable
    onPress={() =>
      router.push(
        path as any,
      )
    }
  >
    <Text
      style={
        styles.link
      }
    >
      {label}
    </Text>
  </Pressable>
);

const styles =
  StyleSheet.create({
    footer: {
      width: "100%",
      paddingVertical: 24,
      backgroundColor:
        "#f8fafc",
      borderTopWidth: 1,
      borderTopColor:
        "#e2e8f0",
    },

    content: {
      width: "100%",
      paddingHorizontal: 16,
      alignItems:
        "center",
      gap: 16,
    },

    copyright: {
      color: "#64748b",
      fontSize: 14,
      textAlign:
        "center",
    },

    links: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 24,
    },

    link: {
      color: "#64748b",
      fontSize: 14,
    },
  });