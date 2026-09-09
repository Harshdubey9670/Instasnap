import React, {
  useState,
} from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import {
  useDispatch,
  useSelector,
} from "react-redux";

import {
  optimisticUpdateSetting,
  updateSettings,
} from "../../store/authSlice";
import {
  type AppDispatch,
  type RootState,
} from "../../store/store";
import { useToast } from "../ui/Toast";
import { useTheme } from "../../contexts/ThemeContext";
import { SettingToggle } from "./SettingToggle";
import { SettingSelect } from "./SettingSelect";

const TimeManagementSettings =
  () => {
    const { settings } = useSelector(
      (state: RootState) => state.auth,
    );

    const dispatch = useDispatch<AppDispatch>();
    const { toast } = useToast();
    const { effectiveTheme } =
      useTheme();

    const dark =
      effectiveTheme === "dark";

    const [
      activeTimeField,
      setActiveTimeField,
    ] = useState<
      "start" | "end" | null
    >(null);

    const parseTime = (
      value: string,
    ) => {
      const [hours, minutes] =
        value
          .split(":")
          .map(Number);

      const date = new Date();

      date.setHours(
        Number.isFinite(hours)
          ? hours
          : 0,
        Number.isFinite(minutes)
          ? minutes
          : 0,
        0,
        0,
      );

      return date;
    };

    const formatTime = (
      date: Date,
    ) =>
      `${String(
        date.getHours(),
      ).padStart(
        2,
        "0",
      )}:${String(
        date.getMinutes(),
      ).padStart(
        2,
        "0",
      )}`;

    const handleUpdate =
      async (
        category: string,
        key: string,
        value:
          | string
          | number
          | boolean,
      ) => {
        const updates = {
          [category]: {
            [key]: value,
          },
        };

        dispatch(
          optimisticUpdateSetting(
            updates,
          ),
        );

        try {
          await dispatch(
            updateSettings(
              updates,
            ),
          ).unwrap();
        } catch {
          toast({
            variant: "error",
            title: "Error",
            description:
              "Failed to update setting",
          });
        }
      };

    const handleTimeChange =
      (
        event: DateTimePickerEvent,
        selectedDate?: Date,
      ) => {
        if (
          event.type ===
          "dismissed"
        ) {
          setActiveTimeField(
            null,
          );
          return;
        }

        if (
          !selectedDate ||
          !activeTimeField
        ) {
          return;
        }

        void handleUpdate(
          "timeManagement",
          activeTimeField ===
            "start"
            ? "quietModeStart"
            : "quietModeEnd",
          formatTime(
            selectedDate,
          ),
        );

        if (
          Platform.OS ===
          "android"
        ) {
          setActiveTimeField(
            null,
          );
        }
      };

    const quietMode =
      settings
        ?.timeManagement
        ?.quietMode ||
      false;

    const currentTimeValue =
      activeTimeField ===
      "start"
        ? settings
            ?.timeManagement
            ?.quietModeStart ||
          "22:00"
        : settings
            ?.timeManagement
            ?.quietModeEnd ||
          "07:00";

    return (
      <View
        style={styles.container}
      >
        <View>
          <Text
            style={[
              styles.title,
              {
                color:
                  dark
                    ? "#f8fafc"
                    : "#0f172a",
              },
            ]}
          >
            Time Management
          </Text>

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
            Manage your time spent on
            SnapGram AI.
          </Text>
        </View>

        <SettingsCard
          title="Daily Usage"
          dark={dark}
        >
          <SettingSelect
            label="Daily Time Limit"
            description="We'll remind you when you've reached your daily limit."
            value={
              settings
                ?.timeManagement
                ?.dailyLimitMinutes ||
              0
            }
            options={[
              {
                value: 0,
                label: "No Limit",
              },
              {
                value: 15,
                label: "15 Minutes",
              },
              {
                value: 30,
                label: "30 Minutes",
              },
              {
                value: 60,
                label: "1 Hour",
              },
              {
                value: 120,
                label: "2 Hours",
              },
            ]}
            onChange={(value) =>
              handleUpdate(
                "timeManagement",
                "dailyLimitMinutes",
                Number(value),
              )
            }
          />

          <SettingSelect
            label="Take a Break Reminders"
            description="We'll remind you to take a break when you use the app consecutively."
            value={
              settings
                ?.timeManagement
                ?.breakReminderMinutes ||
              0
            }
            options={[
              {
                value: 0,
                label: "Off",
              },
              {
                value: 10,
                label:
                  "Every 10 Minutes",
              },
              {
                value: 20,
                label:
                  "Every 20 Minutes",
              },
              {
                value: 30,
                label:
                  "Every 30 Minutes",
              },
            ]}
            onChange={(value) =>
              handleUpdate(
                "timeManagement",
                "breakReminderMinutes",
                Number(value),
              )
            }
          />
        </SettingsCard>

        <SettingsCard
          title="Quiet Mode"
          dark={dark}
        >
          <SettingToggle
            label="Enable Quiet Mode"
            description="Mute push notifications during specific hours."
            checked={quietMode}
            onChange={(value) =>
              handleUpdate(
                "timeManagement",
                "quietMode",
                value,
              )
            }
          />

          <View
            style={[
              styles.timeRow,
              !quietMode &&
                styles.timeRowDisabled,
            ]}
          >
            <TimeButton
              label="Start Time"
              value={
                settings
                  ?.timeManagement
                  ?.quietModeStart ||
                "22:00"
              }
              dark={dark}
              disabled={!quietMode}
              onPress={() =>
                setActiveTimeField(
                  "start",
                )
              }
            />

            <TimeButton
              label="End Time"
              value={
                settings
                  ?.timeManagement
                  ?.quietModeEnd ||
                "07:00"
              }
              dark={dark}
              disabled={!quietMode}
              onPress={() =>
                setActiveTimeField(
                  "end",
                )
              }
            />
          </View>
        </SettingsCard>

        {activeTimeField &&
        Platform.OS === "android" ? (
          <DateTimePicker
            mode="time"
            value={parseTime(
              currentTimeValue,
            )}
            onChange={
              handleTimeChange
            }
          />
        ) : null}

        {activeTimeField &&
        Platform.OS === "ios" ? (
          <Modal
            visible
            transparent
            animationType="slide"
            onRequestClose={() =>
              setActiveTimeField(
                null,
              )
            }
          >
            <View
              style={
                styles.pickerOverlay
              }
            >
              <Pressable
                style={
                  styles.pickerBackdrop
                }
                onPress={() =>
                  setActiveTimeField(
                    null,
                  )
                }
              />

              <View
                style={[
                  styles.pickerSheet,
                  {
                    backgroundColor:
                      dark
                        ? "#130a1c"
                        : "#ffffff",
                  },
                ]}
              >
                <View
                  style={
                    styles.pickerHeader
                  }
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
                    {activeTimeField ===
                    "start"
                      ? "Start Time"
                      : "End Time"}
                  </Text>

                  <Pressable
                    onPress={() =>
                      setActiveTimeField(
                        null,
                      )
                    }
                  >
                    <Text
                      style={
                        styles.doneText
                      }
                    >
                      Done
                    </Text>
                  </Pressable>
                </View>

                <DateTimePicker
                  mode="time"
                  value={parseTime(
                    currentTimeValue,
                  )}
                  onChange={
                    handleTimeChange
                  }
                  display="spinner"
                  textColor={
                    dark
                      ? "#ffffff"
                      : "#000000"
                  }
                  themeVariant={
                    dark
                      ? "dark"
                      : "light"
                  }
                />
              </View>
            </View>
          </Modal>
        ) : null}
      </View>
    );
  };

const TimeButton = ({
  label,
  value,
  dark,
  disabled,
  onPress,
}: {
  label: string;
  value: string;
  dark: boolean;
  disabled: boolean;
  onPress: () => void;
}) => (
  <View style={styles.timeField}>
    <Text
      style={[
        styles.timeLabel,
        {
          color:
            dark
              ? "#94a3b8"
              : "#64748b",
        },
      ]}
    >
      {label}
    </Text>

    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.timeButton,
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
      ]}
    >
      <Text
        style={[
          styles.timeValue,
          {
            color:
              dark
                ? "#f8fafc"
                : "#0f172a",
          },
        ]}
      >
        {value}
      </Text>
    </Pressable>
  </View>
);

const SettingsCard = ({
  title,
  dark,
  children,
}: {
  title: string;
  dark: boolean;
  children: React.ReactNode;
}) => (
  <View
    style={[
      styles.card,
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
    <Text
      style={[
        styles.cardTitle,
        {
          color:
            dark
              ? "#f8fafc"
              : "#0f172a",
          borderBottomColor:
            dark
              ? "#2d1b3b"
              : "#e2e8f0",
        },
      ]}
    >
      {title}
    </Text>

    {children}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 20,
    paddingBottom: 32,
  },

  title: {
    fontSize: 26,
    fontWeight: "800",
  },

  description: {
    marginTop: 5,
    fontSize: 14,
    lineHeight: 20,
  },

  card: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: "800",
    paddingBottom: 10,
    marginBottom: 2,
    borderBottomWidth: 1,
  },

  timeRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },

  timeRowDisabled: {
    opacity: 0.5,
  },

  timeField: {
    flex: 1,
  },

  timeLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
  },

  timeButton: {
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 10,
  },

  timeValue: {
    fontSize: 13,
    fontWeight: "700",
  },

  disabled: {
    opacity: 0.55,
  },

  pickerOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },

  pickerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor:
      "rgba(0,0,0,0.55)",
  },

  pickerSheet: {
    width: "100%",
    paddingBottom: 28,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },

  pickerHeader: {
    minHeight: 56,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  pickerTitle: {
    fontSize: 17,
    fontWeight: "800",
  },

  doneText: {
    color: "#a855f7",
    fontSize: 13,
    fontWeight: "800",
  },
});

export default TimeManagementSettings;