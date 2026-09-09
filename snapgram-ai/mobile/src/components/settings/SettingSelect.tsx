import React, {
  useState,
} from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  ChevronDown,
  Check,
  X,
} from "lucide-react-native";
import {
  useTheme,
} from "../../contexts/ThemeContext";

export interface SettingOption {
  value:
    | string
    | number;
  label: string;
}

interface SettingSelectProps {
  label: string;
  description?: string;
  value:
    | string
    | number;
  options: SettingOption[];
  onChange: (
    value:
      | string
      | number,
  ) => void;
  disabled?: boolean;
}

export const SettingSelect = ({
  label,
  description,
  value,
  options,
  onChange,
  disabled = false,
}: SettingSelectProps) => {
  const [
    open,
    setOpen,
  ] = useState(false);

  const {
    effectiveTheme,
  } = useTheme();

  const dark =
    effectiveTheme ===
    "dark";

  const selected =
    options.find(
      (option) =>
        String(
          option.value,
        ) ===
        String(
          value,
        ),
    );

  const selectValue =
    (
      nextValue:
        | string
        | number,
    ) => {
      onChange(
        nextValue,
      );

      setOpen(false);
    };

  return (
    <>
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
              {
                color:
                  dark
                    ? "#f8fafc"
                    : "#0f172a",
              },
            ]}
          >
            {label}
          </Text>

          {description ? (
            <Text
              style={[
                styles.description,
                {
                  color:
                    dark
                      ? "#94a3b8"
                      : "#64748b",
                },
              ]}
            >
              {description}
            </Text>
          ) : null}
        </View>

        <Pressable
          onPress={() =>
            setOpen(true)
          }
          disabled={
            disabled
          }
          style={({ pressed }) => [
            styles.selectButton,
            {
              backgroundColor:
                dark
                  ? "#0a0510"
                  : "#f8fafc",
              borderColor:
                dark
                  ? "#2d1b3b"
                  : "#e2e8f0",
            },
            disabled &&
              styles.disabled,
            pressed &&
              styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={`${label}: ${
            selected?.label ||
            value
          }`}
        >
          <Text
            style={[
              styles.selectedText,
              {
                color:
                  dark
                    ? "#f8fafc"
                    : "#0f172a",
              },
            ]}
            numberOfLines={
              1
            }
          >
            {selected?.label ||
              String(value)}
          </Text>

          <ChevronDown
            size={18}
            color={
              dark
                ? "#94a3b8"
                : "#64748b"
            }
          />
        </Pressable>
      </View>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setOpen(false)
        }
      >
        <View
          style={
            styles.overlay
          }
        >
          <Pressable
            style={
              styles.backdrop
            }
            onPress={() =>
              setOpen(false)
            }
          />

          <View
            style={[
              styles.picker,
              {
                backgroundColor:
                  dark
                    ? "#130a1c"
                    : "#ffffff",
                borderColor:
                  dark
                    ? "#2d1b3b"
                    : "#e2e8f0",
              },
            ]}
          >
            <View
              style={[
                styles.pickerHeader,
                {
                  borderBottomColor:
                    dark
                      ? "#2d1b3b"
                      : "#e2e8f0",
                },
              ]}
            >
              <Text
                style={[
                  styles.pickerTitle,
                  {
                    color:
                      dark
                        ? "#f8fafc"
                        : "#0f172a",
                  },
                ]}
              >
                {label}
              </Text>

              <Pressable
                onPress={() =>
                  setOpen(
                    false,
                  )
                }
                style={
                  styles.closeButton
                }
              >
                <X
                  size={19}
                  color={
                    dark
                      ? "#94a3b8"
                      : "#64748b"
                  }
                />
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={
                styles.options
              }
              showsVerticalScrollIndicator={
                false
              }
            >
              {options.map(
                (
                  option,
                ) => {
                  const active =
                    String(
                      option.value,
                    ) ===
                    String(
                      value,
                    );

                  return (
                    <Pressable
                      key={`${option.value}`}
                      onPress={() =>
                        selectValue(
                          option.value,
                        )
                      }
                      style={[
                        styles.option,
                        active &&
                          styles.activeOption,
                        {
                          borderBottomColor:
                            dark
                              ? "#2d1b3b"
                              : "#e2e8f0",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          {
                            color:
                              dark
                                ? "#f8fafc"
                                : "#0f172a",
                          },
                        ]}
                      >
                        {
                          option.label
                        }
                      </Text>

                      {active ? (
                        <Check
                          size={
                            20
                          }
                          color="#a855f7"
                        />
                      ) : null}
                    </Pressable>
                  );
                },
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles =
  StyleSheet.create({
    container: {
      minHeight: 76,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      paddingVertical: 8,
      gap: 12,
    },

    copy: {
      flex: 1,
      minWidth: 0,
      paddingRight: 8,
    },

    label: {
      fontSize: 14,
      fontWeight: "700",
    },

    description: {
      marginTop: 3,
      fontSize: 12,
      lineHeight: 17,
    },

    disabledText: {
      opacity: 0.55,
    },

    selectButton: {
      width: 160,
      minHeight: 44,

      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",

      paddingHorizontal: 12,

      borderWidth: 1,
      borderRadius: 10,
    },

    selectedText: {
      flex: 1,
      marginRight: 6,
      fontSize: 12,
      fontWeight: "600",
    },

    disabled: {
      opacity: 0.5,
    },

    pressed: {
      opacity: 0.8,
      transform: [
        {
          scale: 0.98,
        },
      ],
    },

    overlay: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
      padding: 18,
    },

    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor:
        "rgba(0,0,0,0.55)",
    },

    picker: {
      width: "100%",
      maxWidth: 450,
      maxHeight: "72%",

      borderRadius: 20,
      borderWidth: 1,

      overflow:
        "hidden",

      shadowColor:
        "#000000",
      shadowOffset: {
        width: 0,
        height: 12,
      },
      shadowOpacity: 0.22,
      shadowRadius: 28,
      elevation: 16,
    },

    pickerHeader: {
      minHeight: 58,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      paddingHorizontal: 16,
      borderBottomWidth: 1,
    },

    pickerTitle: {
      fontSize: 17,
      fontWeight: "800",
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

    options: {
      paddingVertical: 4,
    },

    option: {
      minHeight: 52,

      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",

      paddingHorizontal: 16,

      borderBottomWidth: 1,
    },

    activeOption: {
      backgroundColor:
        "rgba(168,85,247,0.08)",
    },

    optionText: {
      flex: 1,
      fontSize: 14,
      fontWeight: "600",
    },
  });

export default SettingSelect;