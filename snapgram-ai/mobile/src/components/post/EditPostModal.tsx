import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  MapPin,
  X,
} from "lucide-react-native";
import {
  Video,
  ResizeMode,
} from "expo-av";

import { useToast } from "../ui/Toast";
import api from "../../services/api";
import { Button } from "../ui/Button";
import { useTheme } from "../../contexts/ThemeContext";

interface PostMedia {
  url: string;
  type?: string;
}

interface Post {
  _id: string;
  caption?: string;
  location?: string;
  media?: PostMedia[];
}

interface EditPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post | null;
  onPostUpdated?: (
    post: unknown,
  ) => void;
}

export const EditPostModal = ({
  isOpen,
  onClose,
  post,
  onPostUpdated,
}: EditPostModalProps) => {
  const {
    effectiveTheme,
  } = useTheme();

  const {
    toast,
  } = useToast();

  const [
    caption,
    setCaption,
  ] = useState(
    post?.caption || "",
  );

  const [
    location,
    setLocation,
  ] = useState(
    post?.location || "",
  );

  const [
    loading,
    setLoading,
  ] = useState(false);

  useEffect(() => {
    if (!post) {
      return;
    }

    setCaption(
      post.caption || "",
    );

    setLocation(
      post.location || "",
    );
  }, [post]);

  const dark =
    effectiveTheme ===
    "dark";

  const hasChanges =
    caption !==
      (post?.caption || "") ||
    location !==
      (post?.location || "");

  const canSubmit =
    Boolean(post) &&
    !loading &&
    hasChanges;

  const handleSubmit =
    async () => {
      if (!post || !canSubmit) {
        return;
      }

      setLoading(true);

      try {
        const response =
          await api.put(
            `/api/posts/${post._id}`,
            {
              caption,
              location,
            },
          );

        toast({
          variant:
            "success",
          title:
            "Post updated successfully",
        });

        onPostUpdated?.(
          response.data.data,
        );

        onClose();
      } catch (error: any) {
        toast({
          variant:
            "error",
          title:
            error?.response
              ?.data
              ?.message ||
            "Failed to update post",
        });
      } finally {
        setLoading(false);
      }
    };

  const preview =
    useMemo(() => {
      if (
        !post?.media?.length
      ) {
        return null;
      }

      return post.media[0];
    }, [post]);

  if (!post) {
    return null;
  }

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!loading) {
          onClose();
        }
      }}
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
          onPress={() => {
            if (!loading) {
              onClose();
            }
          }}
        />

        <View
          style={[
            styles.modal,
            {
              backgroundColor:
                dark
                  ? "#130a1c"
                  : "#f8fafc",

              borderColor:
                dark
                  ? "#2d1b3b"
                  : "#e2e8f0",
            },
          ]}
        >
          <View
            style={[
              styles.header,
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
                styles.title,
                {
                  color:
                    dark
                      ? "#f8fafc"
                      : "#0f172a",
                },
              ]}
            >
              Edit Info
            </Text>

            <Pressable
              onPress={
                onClose
              }
              disabled={
                loading
              }
              hitSlop={8}
              style={
                styles.closeButton
              }
              accessibilityRole="button"
              accessibilityLabel="Close edit post"
            >
              <X
                size={24}
                color={
                  dark
                    ? "#94a3b8"
                    : "#64748b"
                }
              />
            </Pressable>
          </View>

          <ScrollView
            style={
              styles.scroll
            }
            contentContainerStyle={
              styles.content
            }
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={
              false
            }
          >
            {preview ? (
              <View
                style={
                  styles.preview
                }
              >
                {preview.type ===
                "video" ? (
                  <Video
                    source={{
                      uri:
                        preview.url,
                    }}
                    style={
                      styles.previewMedia
                    }
                    resizeMode={
                      ResizeMode.COVER
                    }
                    shouldPlay={
                      false
                    }
                    isLooping={
                      false
                    }
                    isMuted={
                      true
                    }
                  />
                ) : (
                  <View
                    style={
                      styles.previewImageContainer
                    }
                  >
                    <View
                      style={
                        styles.previewImage
                      }
                    >
                      <Text
                        style={
                          styles.previewImageText
                        }
                      >
                        Image
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            ) : null}

            <View
              style={
                styles.field
              }
            >
              <Text
                style={[
                  styles.label,
                  {
                    color:
                      dark
                        ? "#f8fafc"
                        : "#0f172a",
                  },
                ]}
              >
                Caption
              </Text>

              <TextInput
                value={
                  caption
                }
                onChangeText={(
                  value,
                ) =>
                  setCaption(
                    value,
                  )
                }
                placeholder="Write a caption..."
                placeholderTextColor={
                  dark
                    ? "#94a3b8"
                    : "#64748b"
                }
                maxLength={2200}
                multiline
                textAlignVertical="top"
                editable={
                  !loading
                }
                style={[
                  styles.textarea,
                  {
                    backgroundColor:
                      dark
                        ? "#1e112c"
                        : "#ffffff",
                    borderColor:
                      dark
                        ? "#2d1b3b"
                        : "#e2e8f0",
                    color:
                      dark
                        ? "#f8fafc"
                        : "#0f172a",
                  },
                ]}
              />

              <Text
                style={[
                  styles.counter,
                  {
                    color:
                      dark
                        ? "#94a3b8"
                        : "#64748b",
                  },
                ]}
              >
                {caption.length}
                /2200
              </Text>
            </View>

            <View
              style={
                styles.field
              }
            >
              <Text
                style={[
                  styles.label,
                  {
                    color:
                      dark
                        ? "#f8fafc"
                        : "#0f172a",
                  },
                ]}
              >
                Location
              </Text>

              <View
                style={[
                  styles.locationInput,
                  {
                    backgroundColor:
                      dark
                        ? "#1e112c"
                        : "#ffffff",
                    borderColor:
                      dark
                        ? "#2d1b3b"
                        : "#e2e8f0",
                  },
                ]}
              >
                <MapPin
                  size={18}
                  color={
                    dark
                      ? "#94a3b8"
                      : "#64748b"
                  }
                />

                <TextInput
                  value={
                    location
                  }
                  onChangeText={(
                    value,
                  ) =>
                    setLocation(
                      value,
                    )
                  }
                  placeholder="Add location"
                  placeholderTextColor={
                    dark
                      ? "#94a3b8"
                      : "#64748b"
                  }
                  maxLength={100}
                  editable={
                    !loading
                  }
                  style={[
                    styles.locationTextInput,
                    {
                      color:
                        dark
                          ? "#f8fafc"
                          : "#0f172a",
                    },
                  ]}
                />
              </View>
            </View>

            <View
              style={[
                styles.actions,
                {
                  borderTopColor:
                    dark
                      ? "#2d1b3b"
                      : "#e2e8f0",
                },
              ]}
            >
              <Button
                variant="ghost"
                onPress={
                  onClose
                }
                disabled={
                  loading
                }
              >
                Cancel
              </Button>

              <Button
                variant="gradient"
                onPress={() =>
                  void handleSubmit()
                }
                disabled={
                  !canSubmit
                }
                isLoading={
                  loading
                }
              >
                Done
              </Button>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles =
  StyleSheet.create({
    overlay: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
      padding: 16,
    },

    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor:
        "rgba(0,0,0,0.60)",
    },

    modal: {
      width: "100%",
      maxWidth: 500,
      maxHeight:
        "90%",

      borderWidth: 1,
      borderRadius: 24,
      overflow:
        "hidden",

      shadowColor:
        "#000000",
      shadowOffset: {
        width: 0,
        height: 12,
      },
      shadowOpacity: 0.22,
      shadowRadius: 30,
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
      paddingHorizontal: 16,
      borderBottomWidth: 1,
    },

    title: {
      fontSize: 18,
      fontWeight: "700",
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

    scroll: {
      flexGrow: 0,
    },

    content: {
      padding: 16,
      gap: 16,
    },

    preview: {
      width: 96,
      height: 96,
      alignSelf:
        "center",
      overflow:
        "hidden",
      borderRadius: 10,
      borderWidth: 1,
      borderColor:
        "#e2e8f0",
      backgroundColor:
        "#000000",
    },

    previewMedia: {
      width: "100%",
      height: "100%",
    },

    previewImageContainer: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#000000",
    },

    previewImage: {
      width: "100%",
      height: "100%",
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#111827",
    },

    previewImageText: {
      color:
        "rgba(255,255,255,0.45)",
      fontSize: 12,
    },

    field: {
      gap: 6,
    },

    label: {
      fontSize: 14,
      fontWeight: "600",
    },

    textarea: {
      minHeight: 96,
      borderWidth: 1,
      borderRadius: 12,
      padding: 12,
      fontSize: 14,
      lineHeight: 20,
    },

    counter: {
      fontSize: 12,
      textAlign:
        "right",
    },

    locationInput: {
      minHeight: 46,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 8,
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 12,
    },

    locationTextInput: {
      flex: 1,
      minHeight: 44,
      fontSize: 14,
    },

    actions: {
      flexDirection:
        "row",
      justifyContent:
        "flex-end",
      alignItems:
        "center",
      gap: 10,
      paddingTop: 16,
      borderTopWidth: 1,
    },
  });