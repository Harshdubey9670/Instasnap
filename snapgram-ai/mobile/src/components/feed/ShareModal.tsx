import React, {
  useState,
} from "react";
import {
  Linking,
  Modal,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  Check,
  Copy,
  Globe,
  Link2,
  MessageCircle,
  Send,
  Share2,
  X,
} from "lucide-react-native";
import * as Clipboard from "expo-clipboard";

import { useToast } from "../ui/Toast";
import { useTheme } from "../../contexts/ThemeContext";

interface SharePostUser {
  _id?: string;
  username?: string;
}

interface SharePost {
  _id: string;
  caption?: string;
  user?: SharePostUser;
  media?: Array<{
    url?: string;
  }>;
}

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: SharePost | null;
}

export const ShareModal = ({
  isOpen,
  onClose,
  post,
}: ShareModalProps) => {
  const {
    toast,
  } = useToast();

  const {
    effectiveTheme,
  } = useTheme();

  const [
    copied,
    setCopied,
  ] = useState(false);

  if (!post) {
    return null;
  }

  const dark =
    effectiveTheme ===
    "dark";

  /*
   * Preserve the existing web component's URL behavior:
   * it currently points to /app/profile/{userId}, not
   * /app/post/{postId}.
   */
  const publicBaseUrl =
    process.env
      .EXPO_PUBLIC_PUBLIC_URL ||
    process.env
      .EXPO_PUBLIC_API_URL ||
    "";

  const postUrl =
    `${publicBaseUrl}/app/profile/${post.user?._id || ""}`;

  const postTitle =
    post.caption
      ? `${post.user?.username || "User"}: ${post.caption.slice(
          0,
          80,
        )}${
          post.caption.length >
          80
            ? "…"
            : ""
        }`
      : `Post by @${post.user?.username || "user"}`;

  const postImage =
    post.media?.[0]?.url;

  const handleNativeShare =
    async () => {
      try {
        await Share.share({
          message:
            `${postTitle}\n${postUrl}`,
          url:
            postUrl,
          title:
            postTitle,
        });

        onClose();
      } catch (error) {
        console.error(
          "Native share failed:",
          error,
        );

        toast({
          variant:
            "error",
          title:
            "Share failed",
          description:
            "Could not open the share dialog.",
        });
      }
    };

  const handleCopy =
    async () => {
      try {
        await Clipboard.setStringAsync(
          postUrl,
        );

        setCopied(
          true,
        );

        toast({
          variant:
            "success",
          title:
            "Link copied!",
          description:
            "Post link copied to clipboard.",
        });

        setTimeout(
          () =>
            setCopied(
              false,
            ),
          2500,
        );
      } catch {
        toast({
          variant:
            "error",
          title:
            "Failed",
          description:
            "Could not copy link.",
        });
      }
    };

  const openExternal =
    async (
      url: string,
    ) => {
      try {
        const supported =
          await Linking.canOpenURL(
            url,
          );

        if (!supported) {
          throw new Error(
            "URL cannot be opened",
          );
        }

        await Linking.openURL(
          url,
        );

        onClose();
      } catch {
        toast({
          variant:
            "error",
          title:
            "Share failed",
          description:
            "Could not open the external app or link.",
        });
      }
    };

  const handleShare =
    async (
      option:
        | "twitter"
        | "facebook"
        | "whatsapp",
    ) => {
      switch (option) {
        case "twitter":
          await openExternal(
            `https://twitter.com/intent/tweet?url=${encodeURIComponent(
              postUrl,
            )}&text=${encodeURIComponent(
              postTitle,
            )}`,
          );
          break;

        case "facebook":
          await openExternal(
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
              postUrl,
            )}`,
          );
          break;

        case "whatsapp":
          await openExternal(
            `https://api.whatsapp.com/send?text=${encodeURIComponent(
              `${postTitle} ${postUrl}`,
            )}`,
          );
          break;
      }
    };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={
        onClose
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
          onPress={
            onClose
          }
        />

        <View
          style={[
            styles.sheet,
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
            style={
              styles.handle
            }
          />

          <View
            style={
              styles.header
            }
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
              Share Post
            </Text>

            <Pressable
              onPress={
                onClose
              }
              hitSlop={8}
              style={
                styles.closeButton
              }
              accessibilityRole="button"
              accessibilityLabel="Close share dialog"
            >
              <X
                size={20}
                color={
                  dark
                    ? "#94a3b8"
                    : "#64748b"
                }
              />
            </Pressable>
          </View>

          <View
            style={[
              styles.preview,
              {
                backgroundColor:
                  dark
                    ? "#1e112c"
                    : "#f1f5f9",
                borderColor:
                  dark
                    ? "#2d1b3b"
                    : "#e2e8f0",
              },
            ]}
          >
            {postImage ? (
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
                  Media
                </Text>
              </View>
            ) : null}

            <View
              style={
                styles.previewText
              }
            >
              <Text
                style={[
                  styles.username,
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
                @{post.user?.username}
              </Text>

              {post.caption ? (
                <Text
                  style={[
                    styles.caption,
                    {
                      color:
                        dark
                          ? "#94a3b8"
                          : "#64748b",
                    },
                  ]}
                  numberOfLines={
                    2
                  }
                >
                  {
                    post.caption
                  }
                </Text>
              ) : null}
            </View>
          </View>

          <Pressable
            onPress={
              handleCopy
            }
            style={[
              styles.copyRow,
              {
                backgroundColor:
                  dark
                    ? "#1e112c"
                    : "#f1f5f9",
                borderColor:
                  dark
                    ? "#2d1b3b"
                    : "#e2e8f0",
              },
            ]}
          >
            <Link2
              size={18}
              color={
                dark
                  ? "#94a3b8"
                  : "#64748b"
              }
            />

            <Text
              style={[
                styles.urlText,
                {
                  color:
                    dark
                      ? "#94a3b8"
                      : "#64748b",
                },
              ]}
              numberOfLines={
                1
              }
            >
              {
                postUrl
              }
            </Text>

            <View
              style={[
                styles.copyButton,
                copied &&
                  styles.copyButtonCopied,
              ]}
            >
              {copied ? (
                <Check
                  size={14}
                  color="#ffffff"
                />
              ) : (
                <Copy
                  size={14}
                  color="#ffffff"
                />
              )}

              <Text
                style={
                  styles.copyButtonText
                }
              >
                {copied
                  ? "Copied"
                  : "Copy"}
              </Text>
            </View>
          </Pressable>

          <Pressable
            onPress={
              handleNativeShare
            }
            style={[
              styles.shareOption,
              {
                backgroundColor:
                  dark
                    ? "rgba(168,85,247,0.12)"
                    : "rgba(168,85,247,0.10)",
              },
            ]}
          >
            <View
              style={[
                styles.optionIcon,
                {
                  backgroundColor:
                    dark
                      ? "#1e112c"
                      : "#ffffff",
                },
              ]}
            >
              <Share2
                size={20}
                color="#a855f7"
              />
            </View>

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
              Share via…
            </Text>
          </Pressable>

          <View
            style={
              styles.grid
            }
          >
            <ShareOption
              icon={
                <Globe
                  size={20}
                  color="#38bdf8"
                />
              }
              label="Share to X"
              onPress={() =>
                void handleShare(
                  "twitter",
                )
              }
              dark={dark}
            />

            <ShareOption
              icon={
                <Globe
                  size={20}
                  color="#3b82f6"
                />
              }
              label="Share to Facebook"
              onPress={() =>
                void handleShare(
                  "facebook",
                )
              }
              dark={dark}
            />

            <ShareOption
              icon={
                <MessageCircle
                  size={20}
                  color="#22c55e"
                />
              }
              label="Share to WhatsApp"
              onPress={() =>
                void handleShare(
                  "whatsapp",
                )
              }
              dark={dark}
            />

            <ShareOption
              icon={
                <Send
                  size={20}
                  color="#a855f7"
                />
              }
              label="Send"
              onPress={
                handleNativeShare
              }
              dark={dark}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

interface ShareOptionProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  dark: boolean;
}

const ShareOption = ({
  icon,
  label,
  onPress,
  dark,
}: ShareOptionProps) => (
  <Pressable
    onPress={
      onPress
    }
    style={({ pressed }) => [
      styles.option,
      {
        backgroundColor:
          dark
            ? "#1e112c"
            : "#f1f5f9",
        borderColor:
          dark
            ? "#2d1b3b"
            : "#e2e8f0",
      },
      pressed &&
        styles.optionPressed,
    ]}
  >
    <View
      style={
        styles.optionIcon
      }
    >
      {icon}
    </View>

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
      numberOfLines={2}
    >
      {label}
    </Text>
  </Pressable>
);

const styles =
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent:
        "flex-end",
    },

    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor:
        "rgba(0,0,0,0.60)",
    },

    sheet: {
      width: "100%",
      padding: 20,

      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,

      borderWidth: 1,

      shadowColor:
        "#000000",
      shadowOffset: {
        width: 0,
        height: -8,
      },
      shadowOpacity: 0.20,
      shadowRadius: 28,
      elevation: 20,
    },

    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      alignSelf: "center",
      backgroundColor:
        "#cbd5e1",
      marginBottom: 18,
    },

    header: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      marginBottom: 18,
    },

    title: {
      fontSize: 19,
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

    preview: {
      minHeight: 72,
      flexDirection:
        "row",
      alignItems:
        "center",
      borderRadius: 18,
      borderWidth: 1,
      padding: 10,
      marginBottom: 14,
    },

    previewImage: {
      width: 56,
      height: 56,
      borderRadius: 12,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#111827",
      marginRight: 10,
    },

    previewImageText: {
      color:
        "rgba(255,255,255,0.55)",
      fontSize: 10,
    },

    previewText: {
      flex: 1,
      minWidth: 0,
    },

    username: {
      fontSize: 13,
      fontWeight: "600",
    },

    caption: {
      marginTop: 3,
      fontSize: 12,
      lineHeight: 17,
    },

    copyRow: {
      minHeight: 54,

      flexDirection:
        "row",
      alignItems:
        "center",

      paddingHorizontal: 10,

      borderWidth: 1,
      borderRadius: 18,

      marginBottom: 14,
    },

    urlText: {
      flex: 1,
      marginHorizontal: 8,
      fontSize: 12,
    },

    copyButton: {
      minHeight: 34,
      paddingHorizontal: 10,

      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",

      gap: 4,

      borderRadius: 10,
      backgroundColor:
        "#a855f7",
    },

    copyButtonCopied: {
      backgroundColor:
        "#22c55e",
    },

    copyButtonText: {
      color: "#ffffff",
      fontSize: 12,
      fontWeight: "600",
    },

    shareOption: {
      minHeight: 62,
      flexDirection:
        "row",
      alignItems:
        "center",
      padding: 10,
      borderRadius: 18,
      marginBottom: 14,
    },

    grid: {
      flexDirection:
        "row",
      flexWrap:
        "wrap",
      gap: 10,
    },

    option: {
      width: "48%",
      minHeight: 70,

      flexDirection:
        "row",
      alignItems:
        "center",

      padding: 10,

      borderRadius: 18,
      borderWidth: 1,

      gap: 8,
    },

    optionPressed: {
      opacity: 0.80,
      transform: [
        {
          scale: 0.98,
        },
      ],
    },

    optionIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,

      alignItems:
        "center",
      justifyContent:
        "center",

      backgroundColor:
        "rgba(168,85,247,0.10)",
    },

    optionText: {
      flex: 1,
      fontSize: 12,
      fontWeight: "600",
    },
  });