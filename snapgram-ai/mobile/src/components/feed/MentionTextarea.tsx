import React, {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputSelectionChangeEventData,
} from "react-native";
import {
  AtSign,
} from "lucide-react-native";

import { Avatar } from "../ui/Avatar";
import api from "../../services/api";

interface MentionUser {
  _id: string;
  username: string;
  fullName?: string;
  profilePicture?: string;
  avatar?: string;
}

interface MentionTextareaProps {
  value: string;
  onChange:
    | ((event: {
        target: {
          value: string;
        };
      }) => void)
    | ((value: string) => void);

  placeholder?: string;
  maxLength?: number;
  className?: string;
  style?: any;
}

export const MentionTextarea = ({
  value,
  onChange,
  placeholder,
  maxLength,
  style,
}: MentionTextareaProps) => {
  const [
    mentionQuery,
    setMentionQuery,
  ] = useState<
    string | null
  >(null);

  const [
    suggestions,
    setSuggestions,
  ] = useState<MentionUser[]>(
    [],
  );

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    activeIndex,
    setActiveIndex,
  ] = useState(0);

  const [
    selection,
    setSelection,
  ] = useState({
    start:
      value.length,
    end:
      value.length,
  });

  const inputRef =
    useRef<TextInput>(null);

  const emitChange =
    (nextValue: string) => {
      /*
       * Support both common forms:
       *
       * onChangeText-style:
       *   (value: string) => void
       *
       * web-compatible:
       *   ({ target: { value } }) => void
       */
      try {
        (
          onChange as (
            value: string,
          ) => void
        )(nextValue);
      } catch {
        (
          onChange as (
            event: {
              target: {
                value: string;
              };
            },
          ) => void
        )({
          target: {
            value:
              nextValue,
          },
        });
      }
    };

  useEffect(() => {
    if (
      mentionQuery ===
      null
    ) {
      setSuggestions([]);
      return;
    }

    const timer =
      setTimeout(
        () => {
          if (
            !mentionQuery
          ) {
            setSuggestions(
              [],
            );
            setLoading(
              false,
            );
            return;
          }

          void fetchSuggestions(
            mentionQuery,
          );
        },
        250,
      );

    return () =>
      clearTimeout(
        timer,
      );
  }, [mentionQuery]);

  const fetchSuggestions =
    async (
      query: string,
    ) => {
      setLoading(
        true,
      );

      try {
        const response =
          await api.get(
            `/api/search/users?q=${encodeURIComponent(
              query,
            )}`,
          );

        if (
          response.data
            ?.success
        ) {
          setSuggestions(
            (
              response.data
                .data || []
            ).slice(
              0,
              6,
            ),
          );

          setActiveIndex(0);
        }
      } catch {
        setSuggestions(
          [],
        );
      } finally {
        setLoading(
          false,
        );
      }
    };

  const handleChangeText =
    (
      nextValue: string,
    ) => {
      emitChange(
        nextValue,
      );

      const cursorPos =
        selection.start;

      const textBeforeCursor =
        nextValue.slice(
          0,
          cursorPos,
        );

      const mentionMatch =
        textBeforeCursor.match(
          /@(\w*)$/,
        );

      if (mentionMatch) {
        setMentionQuery(
          mentionMatch[1],
        );
      } else {
        setMentionQuery(
          null,
        );
        setSuggestions(
          [],
        );
      }
    };

  const handleSelectionChange =
    (
      event: NativeSyntheticEvent<TextInputSelectionChangeEventData>,
    ) => {
      setSelection(
        event.nativeEvent
          .selection,
      );

      const cursorPos =
        event.nativeEvent
          .selection.start;

      const textBeforeCursor =
        value.slice(
          0,
          cursorPos,
        );

      const mentionMatch =
        textBeforeCursor.match(
          /@(\w*)$/,
        );

      if (mentionMatch) {
        setMentionQuery(
          mentionMatch[1],
        );
      } else {
        setMentionQuery(
          null,
        );
        setSuggestions(
          [],
        );
      }
    };

  const insertMention =
    (
      user: MentionUser,
    ) => {
      const cursorPos =
        selection.start;

      const textBeforeCursor =
        value.slice(
          0,
          cursorPos,
        );

      const textAfterCursor =
        value.slice(
          cursorPos,
        );

      const replaced =
        textBeforeCursor.replace(
          /@(\w*)$/,
          `@${user.username} `,
        );

      const newValue =
        replaced +
        textAfterCursor;

      emitChange(
        newValue,
      );

      setMentionQuery(
        null,
      );

      setSuggestions(
        [],
      );

      const newCursorPosition =
        replaced.length;

      requestAnimationFrame(
        () => {
          inputRef.current?.focus();

          setSelection({
            start:
              newCursorPosition,
            end:
              newCursorPosition,
          });
        },
      );
    };

  const showDropdown =
    mentionQuery !==
      null &&
    (
      loading ||
      suggestions.length >
        0
    );

  return (
    <View
      style={
        styles.container
      }
    >
      <TextInput
        ref={inputRef}
        value={
          value
        }
        onChangeText={
          handleChangeText
        }
        onSelectionChange={
          handleSelectionChange
        }
        placeholder={
          placeholder
        }
        maxLength={
          maxLength
        }
        multiline
        textAlignVertical="top"
        style={[
          styles.input,
          style,
        ]}
      />

      {showDropdown ? (
        <View
          style={
            styles.dropdown
          }
        >
          {loading ? (
            <View
              style={
                styles.loadingRow
              }
            >
              <ActivityIndicator
                size="small"
                color="#a855f7"
              />
            </View>
          ) : suggestions.length ===
            0 ? (
            <View
              style={
                styles.emptyRow
              }
            >
              <AtSign
                size={16}
                color="#64748b"
              />

              <Text
                style={
                  styles.emptyText
                }
              >
                No users found
              </Text>
            </View>
          ) : (
            <FlatList
              data={
                suggestions
              }
              keyExtractor={(
                item,
              ) =>
                item._id}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={
                false
              }
              renderItem={({
                item,
                index,
              }) => (
                <Pressable
                  onPress={() =>
                    insertMention(
                      item,
                    )
                  }
                  style={[
                    styles.suggestion,
                    index ===
                      activeIndex &&
                      styles.activeSuggestion,
                  ]}
                >
                  <Avatar
                    src={
                      item.profilePicture ||
                      item.avatar
                    }
                    alt={
                      item.username
                    }
                    size="sm"
                    fallback={
                      item.username
                        ?.charAt(
                          0,
                        )
                        ?.toUpperCase() ||
                      "U"
                    }
                  />

                  <View
                    style={
                      styles.suggestionText
                    }
                  >
                    <Text
                      style={
                        styles.username
                      }
                      numberOfLines={
                        1
                      }
                    >
                      @{item.username}
                    </Text>

                    {item.fullName ? (
                      <Text
                        style={
                          styles.fullName
                        }
                        numberOfLines={
                          1
                        }
                      >
                        {
                          item.fullName
                        }
                      </Text>
                    ) : null}
                  </View>
                </Pressable>
              )}
            />
          )}
        </View>
      ) : null}
    </View>
  );
};

const styles =
  StyleSheet.create({
    container: {
      position:
        "relative",
      width: "100%",
    },

    input: {
      width: "100%",
      minHeight: 100,

      paddingHorizontal: 12,
      paddingVertical: 12,

      fontSize: 14,
      lineHeight: 20,

      color: "#0f172a",
      backgroundColor:
        "transparent",
    },

    dropdown: {
      position:
        "absolute",
      left: 0,
      right: 0,
      top: "100%",

      maxHeight: 224,

      overflow:
        "hidden",

      zIndex: 100,
      elevation: 10,

      backgroundColor:
        "#ffffff",

      borderWidth: 1,
      borderColor:
        "#e2e8f0",

      borderRadius: 16,

      shadowColor:
        "#000000",
      shadowOffset: {
        width: 0,
        height: 10,
      },
      shadowOpacity: 0.16,
      shadowRadius: 20,
    },

    loadingRow: {
      minHeight: 56,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    emptyRow: {
      minHeight: 52,

      flexDirection:
        "row",
      alignItems:
        "center",

      paddingHorizontal: 16,
      gap: 8,
    },

    emptyText: {
      fontSize: 13,
      color: "#64748b",
    },

    suggestion: {
      minHeight: 58,

      flexDirection:
        "row",
      alignItems:
        "center",

      paddingHorizontal: 12,
      paddingVertical: 8,

      gap: 10,
    },

    activeSuggestion: {
      backgroundColor:
        "rgba(168,85,247,0.10)",
    },

    suggestionText: {
      flex: 1,
      minWidth: 0,
    },

    username: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "600",
      color: "#0f172a",
    },

    fullName: {
      marginTop: 2,
      fontSize: 11,
      lineHeight: 15,
      color: "#64748b",
    },
  });