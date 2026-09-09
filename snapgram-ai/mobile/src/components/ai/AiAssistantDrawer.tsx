import React, {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  Bot,
  Download,
  PlusSquare,
  RefreshCw,
  Send,
  Sparkles,
  X,
} from "lucide-react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { LinearGradient } from "expo-linear-gradient";

import {
  chatAssistant,
  generateImage,
} from "../../services/aiService";

import api from "../../services/api";

import {
  trackEvent,
} from "../../utils/analytics";

import {
  getCurrentPath,
} from "../../navigation/navigation";

interface ChatMessage {
  id: string;
  sender: "bot" | "user";
  text?: string;
  imageUrl?: string;
  prompt?: string;
}

const INITIAL_MESSAGE: ChatMessage = {
  id: "initial-ai-message",
  sender: "bot",
  text:
    'Hello! I am your SnapGram AI Copilot.\n\nTip: You can now ask me to generate images! Start your message with "/image" or "Generate an image of...".',
};

export const AiAssistantDrawer =
  () => {
    const [
      isOpen,
      setIsOpen,
    ] = useState(false);

    const [
      input,
      setInput,
    ] = useState("");

    const [
      loading,
      setLoading,
    ] = useState(false);

    const [
      messages,
      setMessages,
    ] = useState<
      ChatMessage[]
    >([
      INITIAL_MESSAGE,
    ]);

    const [
      downloadingImageId,
      setDownloadingImageId,
    ] = useState<
      string | null
    >(null);

    const listRef =
      useRef<
        FlatList<ChatMessage>
      >(null);

    useEffect(() => {
      if (
        isOpen &&
        messages.length >
          0
      ) {
        requestAnimationFrame(
          () => {
            listRef.current?.scrollToEnd(
              {
                animated: true,
              },
            );
          },
        );
      }
    }, [
      messages,
      isOpen,
      loading,
    ]);

    const handleSend =
      async () => {
        const query =
          input.trim();

        if (
          !query ||
          loading
        ) {
          return;
        }

        const userMessage: ChatMessage =
          {
            id: `user-${Date.now()}`,
            sender: "user",
            text: query,
          };

        const newMessages = [
          ...messages,
          userMessage,
        ];

        setMessages(
          newMessages,
        );

        setInput("");
        setLoading(
          true,
        );

        try {
          const lowerQuery =
            query.toLowerCase();

          const isImageRequest =
            lowerQuery.startsWith(
              "/image",
            ) ||
            lowerQuery.includes(
              "generate an image",
            ) ||
            lowerQuery.includes(
              "create an image",
            );

          if (
            isImageRequest
          ) {
            const cleanPrompt =
              query
                .replace(
                  /^\/image/i,
                  "",
                )
                .trim() ||
              "A beautiful cinematic shot";

            const response =
              await generateImage(
                cleanPrompt,
              );

            if (
              response.success
            ) {
              const imageMessage: ChatMessage =
                {
                  id: `image-${Date.now()}`,
                  sender:
                    "bot",
                  imageUrl:
                    response.data
                      .url,
                  prompt:
                    response.data
                      .prompt,
                };

              setMessages([
                ...newMessages,
                imageMessage,
              ]);
            } else {
              throw new Error(
                "Failed to generate",
              );
            }
          } else {
            const currentPath =
              getCurrentPath();

            const context =
              currentPath.startsWith(
                "/app/chat",
              )
                ? "(User is currently viewing a Chat)"
                : "";

            const response =
              await chatAssistant(
                `${context} ${query}`.trim(),
              );

            const botMessage: ChatMessage =
              {
                id: `bot-${Date.now()}`,
                sender:
                  "bot",
                text:
                  response.data
                    .reply,
              };

            setMessages([
              ...newMessages,
              botMessage,
            ]);
          }
        } catch (
          error
        ) {
          console.error(
            "AI assistant error:",
            error,
          );

          setMessages([
            ...newMessages,
            {
              id: `error-${Date.now()}`,
              sender:
                "bot",
              text:
                "Sorry, I encountered an issue generating a response. Please try again.",
            },
          ]);
        } finally {
          setLoading(
            false,
          );
        }
      };

    const handleShareToChat =
      async (
        imageUrl: string,
      ) => {
        const currentPath =
          getCurrentPath();

        const match =
          currentPath.match(
            /\/app\/chat\/([a-zA-Z0-9_]+)/,
          );

        if (
          !match?.[1]
        ) {
          Alert.alert(
            "Open a Chat",
            "Please open a specific chat to share this image directly!",
          );

          return;
        }

        const chatId =
          match[1];

        try {
          await api.post(
            `/api/messages/${chatId}`,
            {
              messageType:
                "image",
              mediaUrl:
                imageUrl,
            },
          );

          trackEvent(
            "ai_image_shared",
            "chat",
          );

          setIsOpen(
            false,
          );
        } catch (
          error
        ) {
          console.error(
            "Failed to share AI image:",
            error,
          );

          Alert.alert(
            "Error",
            "Failed to share to chat",
          );
        }
      };

    const handleCreatePost =
      (
        _imageUrl: string,
        _prompt?: string,
      ) => {
        trackEvent(
          "ai_image_shared",
          "post",
        );

        setIsOpen(
          false,
        );

        /*
         * This intentionally preserves the behavior of the web source.
         * The source only displayed an alert instead of actually routing
         * to the create-post screen.
         */
        Alert.alert(
          "Image Ready",
          "Image ready! In a full implementation, this would navigate to the Create Post screen pre-filled with this image.",
        );
      };

    const handleDownloadImage =
      async (
        imageUrl: string,
        messageId: string,
      ) => {
        try {
          setDownloadingImageId(
            messageId,
          );

          const extension =
            imageUrl
              .split("?")[0]
              .split(".")
              .pop() || "png";

          const filename =
            `snapgram_ai_${Date.now()}.${extension}`;

          const fileUri =
            `${FileSystem.cacheDirectory}${filename}`;

          const download =
            await FileSystem.downloadAsync(
              imageUrl,
              fileUri,
            );

          const sharingAvailable =
            await Sharing.isAvailableAsync();

          if (
            sharingAvailable
          ) {
            await Sharing.shareAsync(
              download.uri,
              {
                dialogTitle:
                  "Save AI generated image",
                mimeType:
                  "image/*",
                UTI:
                  "public.image",
              },
            );
          } else {
            Alert.alert(
              "Image Saved",
              "The generated image was downloaded to the app cache.",
            );
          }
        } catch (
          error
        ) {
          console.error(
            "Failed to save AI image:",
            error,
          );

          Alert.alert(
            "Error",
            "Failed to save image to device",
          );
        } finally {
          setDownloadingImageId(
            null,
          );
        }
      };

    const renderMessage =
      ({
        item,
      }: {
        item: ChatMessage;
      }) => {
        const isUser =
          item.sender ===
          "user";

        return (
          <View
            style={[
              styles.messageRow,
              {
                justifyContent:
                  isUser
                    ? "flex-end"
                    : "flex-start",
              },
            ]}
          >
            {!isUser ? (
              <View
                style={
                  styles.botIcon
                }
              >
                <Bot
                  size={16}
                  color="#a855f7"
                />
              </View>
            ) : null}

            {item.imageUrl ? (
              <View
                style={
                  styles.imageMessageContainer
                }
              >
                <View
                  style={
                    styles.generatedImageCard
                  }
                >
                  <Image
                    source={{
                      uri:
                        item.imageUrl,
                    }}
                    style={
                      styles.generatedImage
                    }
                    resizeMode="cover"
                  />

                  <View
                    style={
                      styles.imageActionsContainer
                    }
                  >
                    {item.prompt ? (
                      <Text
                        style={
                          styles.prompt
                        }
                        numberOfLines={
                          3
                        }
                      >
                        "{item.prompt}"
                      </Text>
                    ) : null}

                    <View
                      style={
                        styles.actionGrid
                      }
                    >
                      <Pressable
                        onPress={() =>
                          void handleShareToChat(
                            item.imageUrl!,
                          )
                        }
                        style={[
                          styles.actionButton,
                          styles.actionPrimary,
                        ]}
                      >
                        <Send
                          size={13}
                          color="#ffffff"
                        />

                        <Text
                          style={
                            styles.actionPrimaryText
                          }
                        >
                          Send to Chat
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={() =>
                          handleCreatePost(
                            item.imageUrl!,
                            item.prompt,
                          )
                        }
                        style={[
                          styles.actionButton,
                          styles.actionSecondary,
                        ]}
                      >
                        <PlusSquare
                          size={13}
                          color="#f8fafc"
                        />

                        <Text
                          style={
                            styles.actionSecondaryText
                          }
                        >
                          Create Post
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={() =>
                          void handleDownloadImage(
                            item.imageUrl!,
                            item.id,
                          )
                        }
                        disabled={
                          downloadingImageId ===
                          item.id
                        }
                        style={[
                          styles.actionButton,
                          styles.actionSecondary,
                          styles.saveButton,
                        ]}
                      >
                        {downloadingImageId ===
                        item.id ? (
                          <ActivityIndicator
                            size="small"
                            color="#f8fafc"
                          />
                        ) : (
                          <Download
                            size={13}
                            color="#f8fafc"
                          />
                        )}

                        <Text
                          style={
                            styles.actionSecondaryText
                          }
                        >
                          Save to Device
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              </View>
            ) : (
              <View
                style={[
                  styles.textBubble,
                  isUser
                    ? styles.userBubble
                    : styles.botBubble,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    isUser
                      ? styles.userMessageText
                      : styles.botMessageText,
                  ]}
                >
                  {
                    item.text
                  }
                </Text>
              </View>
            )}
          </View>
        );
      };

    return (
      <>
        {/* Floating AI Button */}
        <Pressable
          onPress={() =>
            setIsOpen(
              (
                current,
              ) =>
                !current,
            )
          }
          style={({ pressed }) => [
            styles.floatingButton,
            pressed &&
              styles.floatingButtonPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="AI Copilot Assistant"
        >
          <LinearGradient
            colors={["#a855f7", "#ec4899"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.floatingGradient}
          >
            <Sparkles
              size={26}
              color="#ffffff"
            />
          </LinearGradient>
        </Pressable>

        {/* Drawer */}
        <Modal
          visible={
            isOpen
          }
          transparent
          animationType="slide"
          onRequestClose={() =>
            setIsOpen(
              false,
            )
          }
          statusBarTranslucent
        >
          <KeyboardAvoidingView
            style={
              styles.modalRoot
            }
            behavior={
              Platform.OS ===
              "ios"
                ? "padding"
                : undefined
            }
          >
            <Pressable
              style={
                styles.backdrop
              }
              onPress={() =>
                setIsOpen(
                  false,
                )
              }
            />

            <View
              style={
                styles.drawer
              }
            >
              {/* Header */}
              <View
                style={
                  styles.header
                }
              >
                <View
                  style={
                    styles.headerLeft
                  }
                >
                  <Bot
                    size={20}
                    color="#ffffff"
                  />

                  <Text
                    style={
                      styles.headerTitle
                    }
                  >
                    SnapGram AI Copilot
                  </Text>
                </View>

                <Pressable
                  onPress={() =>
                    setIsOpen(
                      false,
                    )
                  }
                  style={
                    styles.closeButton
                  }
                  accessibilityRole="button"
                  accessibilityLabel="Close AI Copilot"
                >
                  <X
                    size={20}
                    color="#ffffff"
                  />
                </Pressable>
              </View>

              {/* Messages */}
              <View
                style={
                  styles.messages
                }
              >
                <FlatList
                  ref={
                    listRef
                  }
                  data={
                    messages
                  }
                  renderItem={
                    renderMessage
                  }
                  keyExtractor={(
                    item,
                  ) =>
                    item.id
                  }
                  contentContainerStyle={
                    styles.messagesContent
                  }
                  showsVerticalScrollIndicator={
                    false
                  }
                  keyboardShouldPersistTaps="handled"
                  ListFooterComponent={
                    loading ? (
                      <View
                        style={
                          styles.loadingRow
                        }
                      >
                        <RefreshCw
                          size={14}
                          color="#a855f7"
                        />

                        <Text
                          style={
                            styles.loadingText
                          }
                        >
                          AI is generating...
                        </Text>
                      </View>
                    ) : null
                  }
                />
              </View>

              {/* Input */}
              <View
                style={
                  styles.inputArea
                }
              >
                <TextInput
                  value={
                    input
                  }
                  onChangeText={
                    setInput
                  }
                  onSubmitEditing={() =>
                    void handleSend()
                  }
                  editable={
                    !loading
                  }
                  returnKeyType="send"
                  placeholder="Ask AI or type '/image a cat'..."
                  placeholderTextColor="#64748b"
                  style={
                    styles.input
                  }
                />

                <Pressable
                  onPress={() =>
                    void handleSend()
                  }
                  disabled={
                    !input.trim() ||
                    loading
                  }
                  style={[
                    styles.sendButton,
                    (
                      !input.trim() ||
                      loading
                    ) &&
                      styles.sendButtonDisabled,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Send AI prompt"
                >
                  {loading ? (
                    <ActivityIndicator
                      size="small"
                      color="#ffffff"
                    />
                  ) : (
                    <Send
                      size={16}
                      color="#ffffff"
                    />
                  )}
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </>
    );
  };

const styles =
  StyleSheet.create({
    floatingButton: {
      position:
        "absolute",

      right: 16,
      bottom:
        Platform.OS ===
        "ios"
          ? 74
          : 68,

      zIndex: 550,
      elevation: 12,

      shadowColor:
        "#ec4899",
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.45,
      shadowRadius: 10,
    },

    floatingGradient: {
      width: 52,
      height: 52,
      borderRadius: 26,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    floatingButtonPressed: {
      transform: [
        {
          scale: 0.92,
        },
      ],
      opacity: 0.9,
    },

    modalRoot: {
      flex: 1,
      justifyContent:
        "flex-end",
    },

    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor:
        "rgba(0,0,0,0.52)",
    },

    drawer: {
      width: "100%",
      height:
        Platform.OS ===
        "ios"
          ? "82%"
          : "84%",

      overflow:
        "hidden",

      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,

      backgroundColor:
        "#130a1c",

      borderWidth: 1,
      borderColor:
        "#2d1b3b",
    },

    header: {
      minHeight: 58,

      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",

      paddingHorizontal:
        15,

      backgroundColor:
        "#a855f7",
    },

    headerLeft: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 8,
    },

    headerTitle: {
      color:
        "#ffffff",
      fontSize: 14,
      fontWeight:
        "900",
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

    messages: {
      flex: 1,
      backgroundColor:
        "#0a0510",
    },

    messagesContent: {
      padding: 14,
      paddingBottom: 20,
      gap: 12,
    },

    messageRow: {
      width: "100%",
      flexDirection:
        "row",
      alignItems:
        "flex-start",
      gap: 7,
    },

    botIcon: {
      width: 28,
      height: 28,

      alignItems:
        "center",
      justifyContent:
        "center",

      borderRadius: 14,

      backgroundColor:
        "rgba(168,85,247,0.18)",

      marginTop: 3,
    },

    textBubble: {
      maxWidth:
        "82%",

      paddingHorizontal: 12,
      paddingVertical: 10,

      borderRadius: 17,
    },

    userBubble: {
      backgroundColor:
        "#a855f7",
      borderTopRightRadius: 4,
    },

    botBubble: {
      backgroundColor:
        "#130a1c",
      borderWidth: 1,
      borderColor:
        "#2d1b3b",
      borderTopLeftRadius: 4,
    },

    messageText: {
      fontSize: 12,
      lineHeight: 18,
    },

    userMessageText: {
      color:
        "#ffffff",
      fontWeight:
        "600",
    },

    botMessageText: {
      color:
        "#f8fafc",
    },

    imageMessageContainer: {
      width: "84%",
    },

    generatedImageCard: {
      overflow:
        "hidden",

      borderRadius: 17,

      backgroundColor:
        "#130a1c",

      borderWidth: 1,
      borderColor:
        "#2d1b3b",
    },

    generatedImage: {
      width: "100%",
      height: 230,
      backgroundColor:
        "#000000",
    },

    imageActionsContainer: {
      padding: 10,
    },

    prompt: {
      marginBottom: 9,

      color:
        "#94a3b8",

      fontSize: 9,
      lineHeight: 14,

      fontStyle:
        "italic",
    },

    actionGrid: {
      flexDirection:
        "row",
      flexWrap:
        "wrap",
      gap: 6,
    },

    actionButton: {
      minHeight: 34,

      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",

      gap: 5,

      paddingHorizontal: 8,

      borderRadius: 8,
    },

    actionPrimary: {
      flex: 1,
      minWidth: "46%",
      backgroundColor:
        "#a855f7",
    },

    actionSecondary: {
      flex: 1,
      minWidth: "46%",

      backgroundColor:
        "#0a0510",

      borderWidth: 1,
      borderColor:
        "#2d1b3b",
    },

    saveButton: {
      width: "100%",
      flexGrow: 0,
      flexBasis: "100%",
    },

    actionPrimaryText: {
      color:
        "#ffffff",
      fontSize: 9,
      fontWeight:
        "800",
    },

    actionSecondaryText: {
      color:
        "#f8fafc",
      fontSize: 9,
      fontWeight:
        "700",
    },

    loadingRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: 7,

      paddingVertical: 12,
    },

    loadingText: {
      color:
        "#94a3b8",
      fontSize: 10,
    },

    inputArea: {
      minHeight: 68,

      flexDirection:
        "row",
      alignItems:
        "center",

      gap: 8,

      paddingHorizontal: 12,
      paddingTop: 8,

      paddingBottom:
        Platform.OS ===
        "ios"
          ? 23
          : 9,

      backgroundColor:
        "#130a1c",

      borderTopWidth: 1,
      borderTopColor:
        "#2d1b3b",
    },

    input: {
      flex: 1,

      minHeight: 44,

      paddingHorizontal: 12,

      borderRadius: 12,

      backgroundColor:
        "#0a0510",

      borderWidth: 1,
      borderColor:
        "#2d1b3b",

      color:
        "#f8fafc",

      fontSize: 11,
    },

    sendButton: {
      width: 44,
      height: 44,

      alignItems:
        "center",
      justifyContent:
        "center",

      borderRadius: 12,

      backgroundColor:
        "#a855f7",
    },

    sendButtonDisabled: {
      opacity: 0.4,
    },
  });

export default AiAssistantDrawer;