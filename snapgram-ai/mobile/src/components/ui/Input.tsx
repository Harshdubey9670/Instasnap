import React, {
  forwardRef,
} from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from "react-native";

import { useTheme } from "../../contexts/ThemeContext";
import { fonts } from "../../theme/fonts";

type InputType =
  | "text"
  | "password"
  | "email"
  | "number"
  | "tel"
  | "search"
  | "url";

interface InputProps
  extends Omit<
    TextInputProps,
    "style"
  > {
  type?: InputType;
  /** Optional label rendered above the input field — matches web Input label prop */
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
}

const Input = forwardRef<
  TextInput,
  InputProps
>(
  (
    {
      type = "text",
      label,
      error,
      leftIcon,
      rightIcon,
      editable = true,
      style,
      inputStyle,
      className: _className,
      placeholderTextColor,
      ...props
    },
    ref,
  ) => {
    const {
      effectiveTheme,
    } = useTheme();

    const dark =
      effectiveTheme === "dark";

    const borderColor =
      error
        ? "#ef4444"
        : dark
          ? "#2d1b3b"
          : "#e2e8f0";

    const backgroundColor =
      dark
        ? "#1e112c"
        : "#f1f5f9";

    const textColor =
      dark
        ? "#f8fafc"
        : "#0f172a";

    const secondaryColor =
      dark
        ? "#94a3b8"
        : "#64748b";

    const actualKeyboardType =
      getKeyboardType(type);

    const secureTextEntry =
      type === "password";

    return (
      <View style={styles.container}>
        {/* Optional label above the field — matches web Input label prop */}
        {label ? (
          <Text
            style={[
              styles.label,
              { color: dark ? "#cbd5e1" : "#374151" },
            ]}
          >
            {label}
          </Text>
        ) : null}
        <View
          style={[
            styles.inputWrapper,
            {
              backgroundColor,
              borderColor,
            },
            !editable &&
              styles.disabled,
            style,
          ]}
        >
          {leftIcon ? (
            <View
              style={
                styles.leftIcon
              }
            >
              {leftIcon}
            </View>
          ) : null}

          <TextInput
            ref={ref}
            editable={editable}
            secureTextEntry={
              secureTextEntry
            }
            keyboardType={
              actualKeyboardType
            }
            placeholderTextColor={
              placeholderTextColor ||
              secondaryColor
            }
            selectionColor={
              "#a855f7"
            }
            cursorColor={
              "#a855f7"
            }
            style={[
              styles.input,
              {
                color: textColor,
                fontFamily: fonts.regular,   // Inter instead of system font
              },
              leftIcon ? styles.inputWithLeftIcon : null,
              rightIcon ? styles.inputWithRightIcon : null,
              inputStyle,
            ]}
            {...props}
          />

          {rightIcon ? (
            <View
              style={
                styles.rightIcon
              }
            >
              {rightIcon}
            </View>
          ) : null}
        </View>

        {error ? (
          <Text
            style={
              styles.errorText
            }
          >
            {error}
          </Text>
        ) : null}
      </View>
    );
  },
);

Input.displayName =
  "Input";

function getKeyboardType(
  type: InputType,
): TextInputProps["keyboardType"] {
  switch (type) {
    case "email":
      return "email-address";

    case "number":
      return "numeric";

    case "tel":
      return "phone-pad";

    case "search":
      return "web-search";

    case "url":
      return "url";

    case "password":
    case "text":
    default:
      return "default";
  }
}

const styles =
  StyleSheet.create({
    container: {
      width: "100%",
    },

    label: {
      fontSize: 14,
      fontFamily: fonts.semibold,
      marginBottom: 6,
      // color set dynamically (theme-aware)
    },

    inputWrapper: {
      position:
        "relative",
      width: "100%",
      minHeight: 48,

      flexDirection:
        "row",
      alignItems:
        "center",

      borderWidth: 1,
      borderRadius: 12,  // matches web rounded-xl (was 16)
    },

    input: {
      flex: 1,
      minHeight: 46,

      paddingHorizontal: 14,
      paddingVertical: 12,

      fontSize: 14,
      lineHeight: 20,
      fontFamily: fonts.regular,  // Inter instead of system font
    },

    inputWithLeftIcon: {
      paddingLeft: 4,
    },

    inputWithRightIcon: {
      paddingRight: 4,
    },

    leftIcon: {
      width: 40,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    rightIcon: {
      width: 40,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    disabled: {
      opacity: 0.5,
    },

    errorText: {
      marginTop: 4,
      fontSize: 12,
      lineHeight: 16,
      color: "#ef4444",
    },
  });

export { Input };