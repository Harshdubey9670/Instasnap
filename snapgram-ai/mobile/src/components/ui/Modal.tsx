import React from "react";
import {
  Modal as NativeModal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import {
  X,
} from "lucide-react-native";

import { useTheme } from "../../contexts/ThemeContext";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  closeOnOutsideClick?: boolean;
  style?: StyleProp<ViewStyle>;
}

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  closeOnOutsideClick = true,
  style,
}: ModalProps) => {
  const {
    effectiveTheme,
  } = useTheme();

  const dark =
    effectiveTheme === "dark";

  const backgroundColor =
    dark
      ? "rgba(19,10,28,0.97)"
      : "rgba(255,255,255,0.96)";

  const borderColor =
    dark
      ? "rgba(168,85,247,0.15)"
      : "rgba(255,255,255,0.40)";

  const textPrimary =
    dark
      ? "#f8fafc"
      : "#0f172a";

  const textSecondary =
    dark
      ? "#94a3b8"
      : "#64748b";

  return (
    <NativeModal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={
        onClose
      }
      statusBarTranslucent
    >
      <View
        style={styles.container}
      >
        <Pressable
          style={styles.overlay}
          onPress={
            closeOnOutsideClick
              ? onClose
              : undefined
          }
        />

        <View
          style={[
            styles.modal,
            {
              backgroundColor,
              borderColor,
            },
            style,
          ]}
        >
          <View
            style={
              styles.header
            }
          >
            {title ? (
              <Text
                style={[
                  styles.title,
                  {
                    color:
                      textPrimary,
                  },
                ]}
                numberOfLines={2}
              >
                {title}
              </Text>
            ) : (
              <View
                style={
                  styles.titleSpacer
                }
              />
            )}

            <Pressable
              onPress={
                onClose
              }
              accessibilityRole="button"
              accessibilityLabel="Close modal"
              hitSlop={8}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && {
                  backgroundColor:
                    dark
                      ? "rgba(255,255,255,0.08)"
                      : "#f1f5f9",
                },
              ]}
            >
              <X
                size={20}
                color={
                  textSecondary
                }
                strokeWidth={2}
              />
            </Pressable>
          </View>

          <View
            style={
              styles.content
            }
          >
            {children}
          </View>
        </View>
      </View>
    </NativeModal>
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

      paddingHorizontal: 16,
      paddingVertical: 24,
    },

    overlay: {
      ...StyleSheet.absoluteFillObject,

      backgroundColor:
        "rgba(0,0,0,0.40)",
    },

    modal: {
      width: "100%",
      maxWidth: 520,
      maxHeight: "90%",

      overflow:
        "hidden",

      borderWidth: 1,
      borderRadius: 24,

      shadowColor:
        "#000000",
      shadowOffset: {
        width: 0,
        height: 12,
      },
      shadowOpacity: 0.22,
      shadowRadius: 32,

      elevation: 16,
    },

    header: {
      minHeight: 60,

      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",

      paddingHorizontal: 24,
      paddingTop: 20,
      paddingBottom: 12,
    },

    title: {
      flex: 1,

      marginRight: 12,

      fontSize: 20,
      lineHeight: 26,
      fontWeight: "600",
    },

    titleSpacer: {
      flex: 1,
    },

    closeButton: {
      width: 40,
      height: 40,

      alignItems:
        "center",
      justifyContent:
        "center",

      borderRadius: 20,
    },

    content: {
      paddingHorizontal: 24,
      paddingBottom: 24,
    },
  });

export { Modal };