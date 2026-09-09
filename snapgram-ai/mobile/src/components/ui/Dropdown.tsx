import React, {
  forwardRef,
  useRef,
  useState,
} from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextProps,
  type ViewProps,
  type ViewStyle,
} from "react-native";

import { useTheme } from "../../contexts/ThemeContext";

type DropdownAlign =
  | "left"
  | "right";

interface DropdownProps
  extends Omit<ViewProps, "style"> {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: DropdownAlign;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

interface DropdownItemProps
  extends Omit<
    TextProps,
    "style"
  > {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  danger?: boolean;
  style?: StyleProp<ViewStyle>;
}

interface DropdownSeparatorProps {
  style?: StyleProp<ViewStyle>;
}

export const Dropdown = ({
  trigger,
  children,
  align = "right",
  style,
}: DropdownProps) => {
  const [isOpen, setIsOpen] =
    useState(false);

  const [triggerFrame, setTriggerFrame] =
    useState({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    });

  const triggerRef =
    useRef<View>(null);

  const {
    effectiveTheme,
  } = useTheme();

  const dark =
    effectiveTheme === "dark";

  const openDropdown = () => {
    triggerRef.current?.measureInWindow(
      (x, y, width, height) => {
        setTriggerFrame({
          x,
          y,
          width,
          height,
        });

        setIsOpen(true);
      },
    );
  };

  const closeDropdown = () => {
    setIsOpen(false);
  };

  const menuBackground =
    dark
      ? "rgba(19,10,28,0.97)"
      : "rgba(255,255,255,0.96)";

  const menuBorder =
    dark
      ? "rgba(168,85,247,0.15)"
      : "rgba(255,255,255,0.40)";

  const menuText =
    dark
      ? "#f8fafc"
      : "#0f172a";

  return (
    <>
      <View
        ref={triggerRef}
        style={style}
      >
        <Pressable
          onPress={
            openDropdown
          }
          accessibilityRole="button"
          accessibilityState={{
            expanded: isOpen,
          }}
        >
          {trigger}
        </Pressable>
      </View>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={
          closeDropdown
        }
      >
        <Pressable
          style={styles.overlay}
          onPress={
            closeDropdown
          }
        >
          <View
            style={[
              styles.dropdown,
              {
                backgroundColor:
                  menuBackground,
                borderColor:
                  menuBorder,
              },
              getDropdownPosition(
                triggerFrame,
                align,
              ),
            ]}
          >
            <View
              onStartShouldSetResponder={() =>
                true
              }
            >
              {children}
            </View>
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

export const DropdownItem =
  forwardRef<
    View,
    DropdownItemProps
  >(
    (
      {
        children,
        onClick,
        danger = false,
        style,
        className: _className,
      },
      ref,
    ) => {
      const {
        effectiveTheme,
      } = useTheme();

      const dark =
        effectiveTheme === "dark";

      const textColor = danger
        ? "#ef4444"
        : dark
          ? "#f8fafc"
          : "#0f172a";

      const pressedBackground =
        dark
          ? "rgba(255,255,255,0.07)"
          : "rgba(15,23,42,0.06)";

      return (
        <Pressable
          ref={ref}
          onPress={
            onClick
          }
          style={({ pressed }) => [
            styles.item,
            pressed && {
              backgroundColor:
                pressedBackground,
            },
            style,
          ]}
          accessibilityRole="button"
        >
          {typeof children ===
          "string" ? (
            <Text
              style={[
                styles.itemText,
                {
                  color:
                    textColor,
                },
              ]}
            >
              {children}
            </Text>
          ) : (
            children
          )}
        </Pressable>
      );
    },
  );

DropdownItem.displayName =
  "DropdownItem";

export const DropdownSeparator =
  ({
    style,
  }: DropdownSeparatorProps) => {
    const {
      effectiveTheme,
    } = useTheme();

    return (
      <View
        style={[
          styles.separator,
          {
            backgroundColor:
              effectiveTheme ===
              "dark"
                ? "#2d1b3b"
                : "#e2e8f0",
          },
          style,
        ]}
      />
    );
  };

function getDropdownPosition(
  frame: {
    x: number;
    y: number;
    width: number;
    height: number;
  },
  align: DropdownAlign,
) {
  const estimatedWidth = 200;

  return {
    position:
      "absolute" as const,

    top:
      frame.y +
      frame.height +
      8,

    ...(align === "right"
      ? {
          right:
            Math.max(
              8,
              360 -
                (frame.x +
                  frame.width),
            ),
        }
      : {
          left:
            frame.x,
        }),

    minWidth:
      estimatedWidth,
  };
}

const styles =
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor:
        "transparent",
    },

    dropdown: {
      padding: 4,
      borderWidth: 1,
      borderRadius: 16,

      shadowColor:
        "#000000",
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: 0.12,
      shadowRadius: 30,

      elevation: 10,
    },

    item: {
      minHeight: 40,

      flexDirection:
        "row",
      alignItems:
        "center",

      paddingHorizontal:
        12,
      paddingVertical: 8,

      borderRadius: 10,
    },

    itemText: {
      fontSize: 14,
      lineHeight: 20,
    },

    separator: {
      height: 1,
      marginVertical: 4,
    },
  });