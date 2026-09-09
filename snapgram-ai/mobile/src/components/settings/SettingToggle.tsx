import React, {
  useEffect,
  useRef,
} from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface SettingToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (
    value: boolean,
  ) => void;
  disabled?: boolean;
}

export const SettingToggle = ({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}: SettingToggleProps) => {
  const translateX =
    useRef(
      new Animated.Value(
        checked ? 20 : 0,
      ),
    ).current;

  useEffect(() => {
    Animated.spring(
      translateX,
      {
        toValue:
          checked
            ? 20
            : 0,
        friction: 7,
        tension: 120,
        useNativeDriver: true,
      },
    ).start();
  }, [
    checked,
    translateX,
  ]);

  return (
    <View
      style={
        styles.container
      }
    >
      <View
        style={
          styles.copy
        }
      >
        <Text
          style={[
            styles.label,
            disabled &&
              styles.disabledText,
          ]}
        >
          {label}
        </Text>

        {description ? (
          <Text
            style={[
              styles.description,
              disabled &&
                styles.disabledText,
            ]}
          >
            {description}
          </Text>
        ) : null}
      </View>

      <Pressable
        onPress={() =>
          onChange(
            !checked,
          )
        }
        disabled={
          disabled
        }
        style={({ pressed }) => [
          styles.track,
          checked &&
            styles.trackChecked,
          disabled &&
            styles.disabled,
          pressed &&
            !disabled &&
            styles.pressed,
        ]}
        accessibilityRole="switch"
        accessibilityState={{
          checked,
          disabled,
        }}
        accessibilityLabel={
          label
        }
      >
        <Animated.View
          style={[
            styles.thumb,
            {
              transform: [
                {
                  translateX,
                },
              ],
            },
          ]}
        />
      </Pressable>
    </View>
  );
};

const styles =
  StyleSheet.create({
    container: {
      minHeight: 64,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      paddingVertical: 8,
    },

    copy: {
      flex: 1,
      paddingRight: 14,
    },

    label: {
      fontSize: 14,
      fontWeight: "700",
      color: "#0f172a",
    },

    description: {
      marginTop: 3,
      fontSize: 12,
      lineHeight: 17,
      color: "#64748b",
    },

    disabledText: {
      opacity: 0.55,
    },

    track: {
      width: 44,
      height: 24,
      borderRadius: 12,
      padding: 1,
      justifyContent:
        "center",
      backgroundColor:
        "#cbd5e1",
    },

    trackChecked: {
      backgroundColor:
        "#a855f7",
    },

    thumb: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor:
        "#ffffff",

      shadowColor:
        "#000000",
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.18,
      shadowRadius: 2,
      elevation: 2,
    },

    disabled: {
      opacity: 0.5,
    },

    pressed: {
      transform: [
        {
          scale: 0.96,
        },
      ],
    },
  });

export default SettingToggle;