import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  Code,
  FileText,
  Info,
  ShieldAlert,
} from "lucide-react-native";
import {
  useTheme,
} from "../../contexts/ThemeContext";

const AboutSettings =
  () => {
    const {
      effectiveTheme,
    } = useTheme();

    const dark =
      effectiveTheme ===
      "dark";

    const surface =
      dark
        ? "#130a1c"
        : "#ffffff";

    const base =
      dark
        ? "#0a0510"
        : "#f8fafc";

    const text =
      dark
        ? "#f8fafc"
        : "#0f172a";

    const secondary =
      dark
        ? "#94a3b8"
        : "#64748b";

    const border =
      dark
        ? "#2d1b3b"
        : "#e2e8f0";

    return (
      <View
        style={
          styles.container
        }
      >
        <View>
          <Text
            style={[
              styles.title,
              {
                color:
                  text,
              },
            ]}
          >
            About
          </Text>

          <Text
            style={[
              styles.description,
              {
                color:
                  secondary,
              },
            ]}
          >
            Learn more about InstaSnap AI.
          </Text>
        </View>

        <View
          style={[
            styles.aboutCard,
            {
              backgroundColor:
                surface,
              borderColor:
                border,
            },
          ]}
        >
          <View
            style={
              styles.logo
            }
          >
            <Code
              size={40}
              color="#ffffff"
            />
          </View>

          <Text
            style={[
              styles.appName,
              {
                color:
                  text,
              },
            ]}
          >
            InstaSnap AI
          </Text>

          <Text
            style={[
              styles.version,
              {
                color:
                  secondary,
              },
            ]}
          >
            Version 1.0.0 (Build 42)
          </Text>

          <Text
            style={[
              styles.aboutText,
              {
                color:
                  secondary,
              },
            ]}
          >
            Built with React, Redux, Node.js, and MongoDB.
          </Text>
        </View>

        <View
          style={[
            styles.section,
            {
              backgroundColor:
                surface,
              borderColor:
                border,
            },
          ]}
        >
          <Text
            style={[
              styles.sectionTitle,
              {
                color:
                  text,
                borderBottomColor:
                  border,
              },
            ]}
          >
            Legal
          </Text>

          <LegalRow
            icon={
              <FileText
                size={20}
                color={
                  secondary
                }
              />
            }
            title="Terms of Service"
            base={base}
            text={text}
            border={border}
          />

          <LegalRow
            icon={
              <ShieldAlert
                size={20}
                color={
                  secondary
                }
              />
            }
            title="Privacy Policy"
            base={base}
            text={text}
            border={border}
          />

          <LegalRow
            icon={
              <Info
                size={20}
                color={
                  secondary
                }
              />
            }
            title="Open Source Libraries"
            base={base}
            text={text}
            border={border}
          />
        </View>
      </View>
    );
  };

const LegalRow = ({
  icon,
  title,
  base,
  text,
  border,
}: {
  icon: React.ReactNode;
  title: string;
  base: string;
  text: string;
  border: string;
}) => (
  <Pressable
    style={({ pressed }) => [
      styles.legalRow,
      {
        borderBottomColor:
          border,
      },
      pressed &&
        styles.pressed,
    ]}
  >
    <View
      style={
        styles.legalLeft
      }
    >
      <View
        style={[
          styles.legalIcon,
          {
            backgroundColor:
              base,
          },
        ]}
      >
        {icon}
      </View>

      <Text
        style={[
          styles.legalTitle,
          {
            color:
              text,
          },
        ]}
      >
        {title}
      </Text>
    </View>
  </Pressable>
);

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      gap: 22,
      paddingBottom: 32,
    },

    title: {
      fontSize: 26,
      fontWeight: "800",
    },

    description: {
      marginTop: 5,
      fontSize: 14,
    },

    aboutCard: {
      minHeight: 260,

      alignItems:
        "center",
      justifyContent:
        "center",

      padding: 24,

      borderRadius: 20,
      borderWidth: 1,

      shadowColor:
        "#000000",
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.05,
      shadowRadius: 12,
      elevation: 2,
    },

    logo: {
      width: 80,
      height: 80,

      alignItems:
        "center",
      justifyContent:
        "center",

      borderRadius: 16,

      backgroundColor:
        "#a855f7",

      marginBottom: 16,
    },

    appName: {
      fontSize: 20,
      fontWeight: "800",
    },

    version: {
      marginTop: 4,
      fontSize: 12,
    },

    aboutText: {
      marginTop: 9,
      fontSize: 11,
      lineHeight: 17,
      textAlign:
        "center",
    },

    section: {
      borderWidth: 1,
      borderRadius: 20,
      padding: 16,
    },

    sectionTitle: {
      fontSize: 17,
      fontWeight: "800",
      paddingBottom: 10,
      marginBottom: 4,
      borderBottomWidth: 1,
    },

    legalRow: {
      minHeight: 62,
      justifyContent:
        "center",
      borderBottomWidth: 1,
    },

    legalLeft: {
      flexDirection:
        "row",
      alignItems:
        "center",
    },

    legalIcon: {
      width: 40,
      height: 40,
      alignItems:
        "center",
      justifyContent:
        "center",
      borderRadius: 10,
      marginRight: 12,
    },

    legalTitle: {
      fontSize: 14,
      fontWeight: "700",
    },

    pressed: {
      opacity: 0.75,
    },
  });

export default AboutSettings;