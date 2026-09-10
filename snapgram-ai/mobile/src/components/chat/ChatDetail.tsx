import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  Audio,
  Video,
  ResizeMode,
} from "expo-av";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import {
  router,
  useLocalSearchParams,
} from "expo-router";
import {
  ArrowLeft,
  Clock,
  Grid,
  Loader2,
  Mic,
  Paperclip,
  Send,
  Smile,
  Video as VideoIcon,
  X,
  Phone,
} from "lucide-react-native";
import {
  isSameDay,
  isToday,
  isYesterday,
  format,
  formatDistanceToNow,
} from "date-fns";
import { useSelector } from "react-redux";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import api from "../../services/api";
import type {
  RootState,
} from "../../store/store";

import {
  useSocketContext,
} from "../../contexts/SocketContext";

import {
  useToast,
} from "../ui/Toast";

import {
  SnapViewerModal,
} from "./SnapViewerModal";

import {
  ConversationPresenceAvatar,
} from "./ConversationPresenceAvatar";

import MessageBubble from "./MessageBubble";

import {
  ImageViewerModal,
} from "./ImageViewerModal";

interface Message {
  _id: string;
  clientMessageId?: string;
  conversation?: any;
  sender?: any;
  text?: string;
  mediaUrl?: string | null;
  messageType?: string;
  status?: string;
  createdAt?: string;
  isSnap?: boolean;
  snapTimer?: number;
  isOpened?: boolean;
  viewMode?: string;
  story?: any;
  duration?: number;
}

interface ChatFile {
  uri: string;
  name: string;
  type: string;
  size?: number;
}

interface OtherUser {
  _id: string;
  username?: string;
  fullName?: string;
  profilePicture?: string;
  avatar?: string;
  lastSeen?: string;
}

const ChatDetail = () => {
  const insets = useSafeAreaInsets();
  const params =
    useLocalSearchParams<{
      id?: string;
    }>();

    const conversationId =
      Array.isArray(params.id)
        ? params.id[0]
        : params.id;

    const {
      user: authUser,
    } = useSelector(
      (state: RootState) =>
        state.auth,
    );

    const {
      socket,
      onlineUsers,
    } =
      useSocketContext();

    const {
      showToast,
    } = useToast();

    const getInitials = (userObj?: any) => {
      if (!userObj) return "U";
      if (typeof userObj === "string") return userObj.charAt(0).toUpperCase() || "U";
      return (
        userObj.fullName?.charAt(0)?.toUpperCase() ||
        userObj.username?.charAt(0)?.toUpperCase() ||
        "U"
      );
    };

    const [
      messages,
      setMessages,
    ] = useState<
      Message[]
    >([]);

    const [
      loading,
      setLoading,
    ] = useState(
      true,
    );

    const [
      otherUser,
      setOtherUser,
    ] =
      useState<OtherUser | null>(
        null,
      );

    const [
      hasMoreMessages,
      setHasMoreMessages,
    ] = useState(
      true,
    );

    const [
      isLoadingMore,
      setIsLoadingMore,
    ] = useState(
      false,
    );

    const [
      showNewMessageIndicator,
      setShowNewMessageIndicator,
    ] =
      useState(false);

    const [
      newMessage,
      setNewMessage,
    ] = useState("");

    const [
      isTyping,
      setIsTyping,
    ] = useState(
      false,
    );

    const [
      remoteTyping,
      setRemoteTyping,
    ] = useState(
      false,
    );

    const [
      isOtherUserPresent,
      setIsOtherUserPresent,
    ] =
      useState(false);

    const [
      isRecordingVoice,
      setIsRecordingVoice,
    ] = useState(
      false,
    );

    const [
      recordingSeconds,
      setRecordingSeconds,
    ] = useState(0);

    const [
      activeSnap,
      setActiveSnap,
    ] = useState<any>(
      null,
    );

    const [
      showMediaGallery,
      setShowMediaGallery,
    ] = useState(
      false,
    );

    const [
      showDisappearingSettings,
      setShowDisappearingSettings,
    ] =
      useState(false);

    const [
      disappearingMode,
      setDisappearingMode,
    ] = useState<
      "off" | "24h" | "7d"
    >("24h");

    const [
      selectedFiles,
      setSelectedFiles,
    ] = useState<
      ChatFile[]
    >([]);

    const [
      isUploading,
      setIsUploading,
    ] = useState(
      false,
    );

    const [
      activeImage,
      setActiveImage,
    ] = useState<
      string | null
    >(null);

    const [
      reactionMenuMsgId,
      setReactionMenuMsgId,
    ] = useState<
      string | null
    >(null);

    const [
      messageReactions,
      setMessageReactions,
    ] = useState<
      Record<
        string,
        string[]
      >
    >({});

    const [
      showEmojiPicker,
      setShowEmojiPicker,
    ] = useState(
      false,
    );

    const listRef =
      useRef<
        FlatList<Message>
      >(null);

    const typingTimeoutRef =
      useRef<
        ReturnType<
          typeof setTimeout
        > | null
      >(null);

    const voiceTimerRef =
      useRef<
        ReturnType<
          typeof setInterval
        > | null
      >(null);

    const recordingRef =
      useRef<
        Audio.Recording | null
      >(null);

    const initialScrollDoneRef =
      useRef(false);

    const fetchChat =
      useCallback(
        async () => {
          if (
            !conversationId
          ) {
            return;
          }

          try {
            setLoading(
              true,
            );

            const convRes =
              await api.get(
                "/api/conversations",
              );

            if (
              convRes.data
                ?.success
            ) {
              const currentConv =
                convRes.data.data?.find(
                  (
                    conversation: any,
                  ) =>
                    conversation._id ===
                    conversationId,
                );

              if (
                currentConv
              ) {
                const partner =
                  currentConv.participants?.find(
                    (
                      participant: any,
                    ) =>
                      participant._id !==
                      authUser?._id,
                  );

                if (
                  partner
                ) {
                  setOtherUser(
                    partner,
                  );
                }
              }
            }

            const msgRes =
              await api.get(
                `/api/messages/${conversationId}?limit=30`,
              );

            if (
              msgRes.data
                ?.success
            ) {
              const loadedMessages =
                msgRes.data.data ||
                [];

              setMessages(
                loadedMessages,
              );

              setHasMoreMessages(
                loadedMessages.length >=
                  30,
              );
            }
          } catch (
            error: any
          ) {
            console.error(
              "Error loading chat:",
              error,
            );

            if (
              error?.response
                ?.status ===
              404
            ) {
              showToast(
                "error",
                "Not Found",
                "This conversation could not be found.",
              );

              router.replace(
                "/app/messages" as any,
              );
            }
          } finally {
            setLoading(
              false,
            );

            setTimeout(
              () => {
                listRef.current?.scrollToEnd(
                  {
                    animated:
                      false,
                  },
                );

                initialScrollDoneRef.current =
                  true;
              },
              150,
            );
          }
        },
        [
          authUser?._id,
          conversationId,
          showToast,
        ],
      );

    useEffect(() => {
      if (
        conversationId
      ) {
        void fetchChat();
      }
    }, [
      conversationId,
      fetchChat,
    ]);

    const loadMoreMessages =
      useCallback(
        async () => {
          if (
            isLoadingMore ||
            !hasMoreMessages ||
            messages.length ===
              0 ||
            !conversationId
          ) {
            return;
          }

          try {
            setIsLoadingMore(
              true,
            );

            const oldestMessageId =
              messages[0]
                ?._id;

            const response =
              await api.get(
                `/api/messages/${conversationId}?before=${oldestMessageId}&limit=30`,
              );

            if (
              response.data
                ?.success
            ) {
              const older =
                response.data
                  .data || [];

              if (
                older.length <
                30
              ) {
                setHasMoreMessages(
                  false,
                );
              }

              if (
                older.length >
                0
              ) {
                setMessages(
                  (
                    previous,
                  ) => [
                    ...older,
                    ...previous,
                  ],
                );
              }
            }
          } catch (
            error
          ) {
            console.error(
              "Error loading more messages:",
              error,
            );
          } finally {
            setIsLoadingMore(
              false,
            );
          }
        },
        [
          conversationId,
          hasMoreMessages,
          isLoadingMore,
          messages,
        ],
      );

    const scrollToBottom =
      useCallback(
        (
          animated = true,
        ) => {
          listRef.current?.scrollToEnd(
            {
              animated,
            },
          );

          setShowNewMessageIndicator(
            false,
          );
        },
        [],
      );

    useEffect(() => {
      if (
        !initialScrollDoneRef.current
      ) {
        return;
      }

      const latest =
        messages[
          messages.length -
            1
        ];

      const isLatestMine =
        Boolean(
          latest &&
            (
              latest.sender?._id ||
              latest.sender
            ) ===
              authUser?._id,
        );

      if (
        isLatestMine ||
        remoteTyping
      ) {
        scrollToBottom(
          true,
        );
      }
    }, [
      messages.length,
      remoteTyping,
      authUser?._id,
      scrollToBottom,
    ]);

    useEffect(() => {
      if (
        !socket ||
        !conversationId
      ) {
        return;
      }

      socket.emit(
        "joinConversation",
        conversationId,
      );

      const handleNewMessage =
        (
          msg: Message,
        ) => {
          const msgConversation =
            typeof msg.conversation ===
            "object"
              ? msg.conversation
                  ?._id ||
                msg.conversation?.toString()
              : msg.conversation;

          if (
            msgConversation !==
            conversationId
          ) {
            return;
          }

          setMessages(
            (
              previous,
            ) => {
              const existingIndex =
                previous.findIndex(
                  (
                    message,
                  ) =>
                    message._id ===
                      msg._id ||
                    Boolean(
                      msg.clientMessageId &&
                        message.clientMessageId ===
                          msg.clientMessageId,
                    ),
                );

              if (
                existingIndex !==
                -1
              ) {
                const updated =
                  [
                    ...previous,
                  ];

                updated[
                  existingIndex
                ] = msg;

                return updated;
              }

              return [
                ...previous,
                msg,
              ];
            },
          );
        };

      const handleTyping =
        ({
          userId,
          conversationId:
            typingConversationId,
        }: {
          userId: string;
          conversationId: string;
        }) => {
          if (
            typingConversationId ===
              conversationId &&
            otherUser &&
            userId ===
              otherUser._id
          ) {
            setRemoteTyping(
              true,
            );
          }
        };

      const handleStopTyping =
        ({
          userId,
          conversationId:
            typingConversationId,
        }: {
          userId: string;
          conversationId: string;
        }) => {
          if (
            typingConversationId ===
              conversationId &&
            otherUser &&
            userId ===
              otherUser._id
          ) {
            setRemoteTyping(
              false,
            );
          }
        };

      const handleMessagesSeen =
        ({
          conversationId:
            seenConversationId,
        }: {
          conversationId: string;
        }) => {
          if (
            seenConversationId !==
            conversationId
          ) {
            return;
          }

          setMessages(
            (
              previous,
            ) =>
              previous.map(
                (
                  message,
                ) =>
                  (
                    message
                      .sender?._id ||
                    message.sender
                  ) ===
                    authUser?._id &&
                  message.status !==
                    "seen"
                    ? {
                        ...message,
                        status:
                          "seen",
                      }
                    : message,
              ),
          );
        };

      const handleScreenshotNotification =
        ({
          takenBy,
        }: {
          takenBy: string;
        }) => {
          showToast(
            "error",
            "Screenshot Detected",
            `📷 @${takenBy} took a screenshot of your snap!`,
          );
        };

      const handleChatScreenshotNotification =
        ({
          takenBy,
        }: {
          takenBy: string;
        }) => {
          showToast(
            "error",
            "Screenshot Detected",
            `📷 @${takenBy} took a screenshot of this chat!`,
          );
        };

      const handlePresenceUpdate =
        (
          userIds: string[],
        ) => {
          setIsOtherUserPresent(
            Boolean(
              otherUser &&
                userIds.includes(
                  otherUser._id,
                ),
            ),
          );
        };

      socket.on(
        "newMessage",
        handleNewMessage,
      );

      socket.on(
        "typing",
        handleTyping,
      );

      socket.on(
        "stopTyping",
        handleStopTyping,
      );

      socket.on(
        "messagesSeen",
        handleMessagesSeen,
      );

      socket.on(
        "screenshotNotification",
        handleScreenshotNotification,
      );

      socket.on(
        "chatScreenshotNotification",
        handleChatScreenshotNotification,
      );

      socket.on(
        "conversationPresenceUpdate",
        handlePresenceUpdate,
      );

      return () => {
        socket.emit(
          "leaveConversation",
          conversationId,
        );

        socket.off(
          "newMessage",
          handleNewMessage,
        );

        socket.off(
          "typing",
          handleTyping,
        );

        socket.off(
          "stopTyping",
          handleStopTyping,
        );

        socket.off(
          "messagesSeen",
          handleMessagesSeen,
        );

        socket.off(
          "screenshotNotification",
          handleScreenshotNotification,
        );

        socket.off(
          "chatScreenshotNotification",
          handleChatScreenshotNotification,
        );

        socket.off(
          "conversationPresenceUpdate",
          handlePresenceUpdate,
        );
      };
    }, [
      authUser?._id,
      conversationId,
      otherUser,
      showToast,
      socket,
    ]);

    useEffect(() => {
      return () => {
        if (
          typingTimeoutRef.current
        ) {
          clearTimeout(
            typingTimeoutRef.current,
          );
        }

        if (
          voiceTimerRef.current
        ) {
          clearInterval(
            voiceTimerRef.current,
          );
        }
      };
    }, []);

    const isOnline =
      Boolean(
        otherUser &&
          onlineUsers?.includes(
            otherUser._id,
          ),
      );

    const handleInputChange =
      (
        value: string,
      ) => {
        setNewMessage(
          value,
        );

        if (
          !socket ||
          !otherUser ||
          !conversationId
        ) {
          return;
        }

        if (
          !isTyping
        ) {
          setIsTyping(
            true,
          );

          socket.emit(
            "typing",
            conversationId,
          );
        }

        if (
          typingTimeoutRef.current
        ) {
          clearTimeout(
            typingTimeoutRef.current,
          );
        }

        typingTimeoutRef.current =
          setTimeout(
            () => {
              setIsTyping(
                false,
              );

              socket.emit(
                "stopTyping",
                conversationId,
              );
            },
            2000,
          );
      };

    const addSelectedFiles =
      (
        files: ChatFile[],
      ) => {
        setSelectedFiles(
          (
            previous,
          ) => [
            ...previous,
            ...files,
          ],
        );
      };

    const handlePickMedia =
      async () => {
        try {
          const result =
            await ImagePicker.launchImageLibraryAsync(
              {
                mediaTypes:
                  [
                    "images",
                    "videos",
                  ],
                allowsMultipleSelection:
                  true,
                quality: 1,
              } as any,
            );

          if (
            result.canceled
          ) {
            return;
          }

          const files =
            result.assets.map(
              (
                asset,
                index,
              ) => ({
                uri:
                  asset.uri,
                name:
                  asset.fileName ||
                  `media_${Date.now()}_${index}`,
                type:
                  asset.mimeType ||
                  (
                    asset.type ===
                    "video"
                      ? "video/mp4"
                      : "image/jpeg"
                  ),
                size:
                  asset.fileSize,
              }),
            );

          addSelectedFiles(
            files,
          );
        } catch (
          error
        ) {
          console.error(
            "Media selection failed:",
            error,
          );

          showToast(
            "error",
            "Error",
            "Unable to select media.",
          );
        }
      };

    const handlePickDocument =
      async () => {
        try {
          const result =
            await DocumentPicker.getDocumentAsync(
              {
                type: [
                  "application/pdf",
                  "application/msword",
                  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                  "text/plain",
                ],
                multiple:
                  false,
              },
            );

          if (
            result.canceled
          ) {
            return;
          }

          const asset =
            result.assets[0];

          if (
            asset
          ) {
            addSelectedFiles(
              [
                {
                  uri:
                    asset.uri,
                  name:
                    asset.name,
                  type:
                    asset.mimeType ||
                    "application/octet-stream",
                  size:
                    asset.size,
                },
              ],
            );
          }
        } catch (
          error
        ) {
          console.error(
            "Document selection failed:",
            error,
          );
        }
      };

    const removeSelectedFile =
      (
        index: number,
      ) => {
        setSelectedFiles(
          (
            previous,
          ) =>
            previous.filter(
              (
                _,
                itemIndex,
              ) =>
                itemIndex !==
                index,
            ),
        );
      };

    const buildUploadForm =
      (
        file: ChatFile,
      ) => {
        const formData =
          new FormData();

        formData.append(
          "image",
          {
            uri: file.uri,
            name:
              file.name,
            type:
              file.type,
          } as any,
        );

        return formData;
      };

    const handleSendMessage =
      async () => {
        if (
          (
            !newMessage.trim() &&
            selectedFiles.length ===
              0
          ) ||
          !otherUser ||
          !conversationId
        ) {
          return;
        }

        const text =
          newMessage;

        const currentFiles =
          [
            ...selectedFiles,
          ];

        setNewMessage(
          "",
        );

        setSelectedFiles(
          [],
        );

        setShowEmojiPicker(
          false,
        );

        if (
          socket &&
          isTyping
        ) {
          if (
            typingTimeoutRef.current
          ) {
            clearTimeout(
              typingTimeoutRef.current,
            );
          }

          setIsTyping(
            false,
          );

          socket.emit(
            "stopTyping",
            conversationId,
          );
        }

        let uploadedMediaUrl:
          | string
          | null =
          null;

        let messageType =
          "text";

        if (
          currentFiles.length >
          0
        ) {
          setIsUploading(
            true,
          );

          const file =
            currentFiles[0];

          if (
            file.type.startsWith(
              "image/",
            )
          ) {
            messageType =
              "image";
          } else if (
            file.type.startsWith(
              "video/",
            )
          ) {
            messageType =
              "video";
          } else {
            messageType =
              "file";
          }

          try {
            const uploadResponse =
              await api.post(
                "/api/upload",
                buildUploadForm(
                  file,
                ),
                {
                  headers: {
                    "Content-Type":
                      "multipart/form-data",
                  },
                },
              );

            if (
              uploadResponse.data
                ?.success
            ) {
              uploadedMediaUrl =
                uploadResponse.data.url ||
                uploadResponse.data
                  ?.data?.url;
            }
          } catch (
            error
          ) {
            console.error(
              "Upload error:",
              error,
            );

            showToast(
              "error",
              "Upload Failed",
              "Failed to upload file",
            );

            setIsUploading(
              false,
            );

            return;
          } finally {
            setIsUploading(
              false,
            );
          }
        }

        const clientMessageId =
          `temp-${Date.now()}`;

        const optimisticMessage:
          Message =
          {
            _id:
              clientMessageId,
            clientMessageId,
            conversation:
              conversationId,
            sender:
              authUser,
            text,
            mediaUrl:
              uploadedMediaUrl,
            messageType,
            status:
              "sending",
            createdAt:
              new Date().toISOString(),
          };

        setMessages(
          (
            previous,
          ) => [
            ...previous,
            optimisticMessage,
          ],
        );

        try {
          const response =
            await api.post(
              `/api/messages/${conversationId}`,
              {
                text,
                mediaUrl:
                  uploadedMediaUrl,
                messageType,
                clientMessageId,
              },
            );

          if (
            response.data
              ?.success
          ) {
            setMessages(
              (
                previous,
              ) =>
                previous.map(
                  (
                    message,
                  ) =>
                    message.clientMessageId ===
                    clientMessageId
                      ? response.data
                          .data
                      : message,
                ),
            );
          }
        } catch (
          error
        ) {
          console.error(
            "Message send failed:",
            error,
          );

          showToast(
            "error",
            "Send Failed",
            "Failed to send message",
          );

          setMessages(
            (
              previous,
            ) =>
              previous.map(
                (
                  message,
                ) =>
                  message.clientMessageId ===
                  clientMessageId
                    ? {
                        ...message,
                        status:
                          "failed",
                      }
                    : message,
              ),
          );
        }
      };

    const startVoiceRecording =
      async () => {
        try {
          const permission =
            await Audio.requestPermissionsAsync();

          if (
            !permission.granted
          ) {
            showToast(
              "error",
              "Microphone Denied",
              "Microphone access was denied.",
            );

            return;
          }

          await Audio.setAudioModeAsync(
            {
              allowsRecordingIOS:
                true,
              playsInSilentModeIOS:
                true,
            },
          );

          const recording =
            new Audio.Recording();

          await recording.prepareToRecordAsync(
            Audio.RecordingOptionsPresets
              .HIGH_QUALITY,
          );

          await recording.startAsync();

          recordingRef.current =
            recording;

          setIsRecordingVoice(
            true,
          );

          setRecordingSeconds(
            0,
          );

          voiceTimerRef.current =
            setInterval(
              () => {
                setRecordingSeconds(
                  (
                    seconds,
                  ) =>
                    seconds +
                    1,
                );
              },
              1000,
            );
        } catch (
          error
        ) {
          console.error(
            "Voice recording failed:",
            error,
          );

          showToast(
            "error",
            "Recording Failed",
            "Unable to start voice recording.",
          );
        }
      };

    const stopVoiceRecording =
      async () => {
        if (
          !recordingRef.current ||
          !isRecordingVoice
        ) {
          return;
        }

        const recording =
          recordingRef.current;

        recordingRef.current =
          null;

        setIsRecordingVoice(
          false,
        );

        if (
          voiceTimerRef.current
        ) {
          clearInterval(
            voiceTimerRef.current,
          );

          voiceTimerRef.current =
            null;
        }

        try {
          await recording.stopAndUnloadAsync();

          const uri =
            recording.getURI();

          if (!uri) {
            return;
          }

          const duration =
            recordingSeconds;

          setIsUploading(
            true,
          );

          const formData =
            new FormData();

          formData.append(
            "image",
            {
              uri,
              name:
                `voice_${Date.now()}.m4a`,
              type:
                "audio/m4a",
            } as any,
          );

          const uploadResponse =
            await api.post(
              "/api/upload",
              formData,
              {
                headers: {
                  "Content-Type":
                    "multipart/form-data",
                },
              },
            );

          const mediaUrl =
            uploadResponse.data
              ?.url ||
            uploadResponse.data
              ?.data?.url;

          if (
            !mediaUrl ||
            !conversationId
          ) {
            throw new Error(
              "Voice upload returned no media URL",
            );
          }

          const response =
            await api.post(
              `/api/messages/${conversationId}`,
              {
                messageType:
                  "voice",
                mediaUrl,
                duration,
              },
            );

          if (
            response.data
              ?.success
          ) {
            setMessages(
              (
                previous,
              ) => [
                ...previous,
                response.data
                  .data,
              ],
            );
          }
        } catch (
          error
        ) {
          console.error(
            "Voice upload failed:",
            error,
          );

          showToast(
            "error",
            "Upload Failed",
            "Failed to upload voice note",
          );
        } finally {
          setIsUploading(
            false,
          );

          setRecordingSeconds(
            0,
          );
        }
      };

    const handleAddReaction =
      useCallback(
        (
          messageId: string,
          emoji: string,
        ) => {
          setMessageReactions(
            (
              previous,
            ) => ({
              ...previous,
              [messageId]:
                [
                  ...(previous[
                    messageId
                  ] || []),
                  emoji,
                ],
            }),
          );

          setReactionMenuMsgId(
            null,
          );
        },
        [],
      );

    const emojis = [
      "😀",
      "😂",
      "😍",
      "🥰",
      "😎",
      "😮",
      "😢",
      "😭",
      "🔥",
      "❤️",
      "👍",
      "👏",
      "🎉",
      "✨",
      "🙏",
      "💯",
    ];

    const renderMessage =
      ({
        item,
        index,
      }: {
        item: Message;
        index: number;
      }) => {
        const previous =
          messages[
            index - 1
          ];

        const isMine =
          String(
            item.sender?._id ||
              item.sender,
          ) ===
          String(
            authUser?._id,
          );

        const previousIsMine =
          previous
            ? String(
                previous
                  .sender?._id ||
                  previous.sender,
              ) ===
              String(
                authUser?._id,
              )
            : null;

        const messageDate =
          new Date(
            item.createdAt ||
              Date.now(),
          );

        const previousDate =
          previous
            ? new Date(
                previous.createdAt ||
                  Date.now(),
              )
            : null;

        const showDateSeparator =
          !previous ||
          !previousDate ||
          !isSameDay(
            messageDate,
            previousDate,
          );

        let dateText =
          "";

        if (
          isToday(
            messageDate,
          )
        ) {
          dateText =
            "Today";
        } else if (
          isYesterday(
            messageDate,
          )
        ) {
          dateText =
            "Yesterday";
        } else {
          dateText =
            format(
              messageDate,
              "MMM d, yyyy",
            );
        }

        const isFirstInGroup =
          !previous ||
          showDateSeparator ||
          isMine !==
            previousIsMine;

        return (
          <View
            key={
              item.clientMessageId ||
              item._id
            }
          >
            {showDateSeparator ? (
              <View
                style={
                  styles.dateSeparator
                }
              >
                <Text
                  style={
                    styles.dateText
                  }
                >
                  {
                    dateText
                  }
                </Text>
              </View>
            ) : null}

            <View
              style={[
                styles.messageWrapper,
                isFirstInGroup &&
                  !showDateSeparator &&
                  index !== 0 &&
                  styles.messageGroupSpacing,
              ]}
            >
              <MessageBubble
                msg={item}
                isMine={isMine}
                isFirstInGroup={
                  isFirstInGroup
                }
                reactions={
                  messageReactions[
                    item._id
                  ] || []
                }
                reactionMenuMsgId={
                  reactionMenuMsgId
                }
                setReactionMenuMsgId={
                  setReactionMenuMsgId
                }
                handleAddReaction={
                  handleAddReaction
                }
                setActiveSnap={
                  setActiveSnap
                }
                onImageClick={
                  setActiveImage
                }
              />
            </View>
          </View>
        );
      };

    if (loading) {
      return (
        <View
          style={
            styles.loadingScreen
          }
        >
          <ActivityIndicator
            size="large"
            color="#a855f7"
          />
        </View>
      );
    }

    return (
      <KeyboardAvoidingView
        style={
          styles.container
        }
        behavior={
          Platform.OS ===
          "ios"
            ? "padding"
            : undefined
        }
      >
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              paddingTop: Math.max(insets.top, 16) + 4,
            },
          ]}
        >
          <View
            style={
              styles.headerLeft
            }
          >
            <Pressable
              onPress={() =>
                router.back()
              }
              style={
                styles.backButton
              }
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <ArrowLeft
                size={22}
                color="#ffffff"
              />
            </Pressable>

            <Pressable
              onPress={() => {
                if (
                  otherUser?._id
                ) {
                  router.push(
                    `/app/profile/${otherUser._id}` as any,
                  );
                }
              }}
              style={
                styles.avatarButton
              }
            >
              {otherUser?.profilePicture || otherUser?.avatar ? (
                <Image
                  source={{
                    uri:
                      otherUser.profilePicture ||
                      otherUser.avatar,
                  }}
                  style={
                    styles.headerAvatar
                  }
                />
              ) : (
                <View style={[styles.headerAvatar, styles.avatarFallback]}>
                  <Text style={styles.avatarFallbackText}>
                    {getInitials(otherUser)}
                  </Text>
                </View>
              )}

              {isOnline ? (
                <View
                  style={
                    styles.onlineDot
                  }
                />
              ) : null}
            </Pressable>

            <View
              style={
                styles.headerCopy
              }
            >
              <Text
                style={
                  styles.headerName
                }
                numberOfLines={
                  1
                }
              >
                {otherUser
                  ?.fullName ||
                  otherUser
                    ?.username ||
                  "Chat"}
              </Text>

              <Text
                style={
                  styles.headerStatus
                }
              >
                {remoteTyping
                  ? "Typing..."
                  : isOnline
                    ? "Active Now"
                    : otherUser?.lastSeen
                      ? `Active ${formatDistanceToNow(
                          new Date(
                            otherUser.lastSeen,
                          ),
                        )} ago`
                      : "Offline"}
              </Text>
            </View>
          </View>

          <View
            style={
              styles.headerActions
            }
          >
            <Pressable
              style={styles.headerAction}
              accessibilityRole="button"
              accessibilityLabel="Voice call"
              onPress={() => showToast("info", "Audio Call", "Voice calling is coming soon...")}
            >
              <Phone
                size={20}
                color="#ffffff"
              />
            </Pressable>

            <Pressable
              style={styles.headerAction}
              accessibilityRole="button"
              accessibilityLabel="Video call"
              onPress={() => showToast("info", "Video Call", "Video calling is coming soon...")}
            >
              <VideoIcon
                size={22}
                color="#ffffff"
              />
            </Pressable>

            <Pressable
              onPress={() =>
                setShowDisappearingSettings(
                  (
                    value,
                  ) =>
                    !value,
                )
              }
              style={[
                styles.headerAction,
                disappearingMode !==
                  "off" &&
                  styles.headerActionActive,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Disappearing messages settings"
            >
              <Clock
                size={20}
                color={
                  disappearingMode !==
                  "off"
                    ? "#a855f7"
                    : "#ffffff"
                }
              />
            </Pressable>

            <Pressable
              onPress={() =>
                setShowMediaGallery(
                  true,
                )
              }
              style={
                styles.headerAction
              }
              accessibilityRole="button"
              accessibilityLabel="Shared media gallery"
            >
              <Grid
                size={20}
                color="#ffffff"
              />
            </Pressable>
          </View>
        </View>

        {/* Disappearing settings */}
        {showDisappearingSettings ? (
          <View
            style={
              styles.disappearingBar
            }
          >
            <Text
              style={
                styles.disappearingLabel
              }
            >
              Disappearing Messages
            </Text>

            <View
              style={
                styles.modeRow
              }
            >
              {(
                [
                  "off",
                  "24h",
                  "7d",
                ] as const
              ).map(
                (
                  mode,
                ) => (
                  <Pressable
                    key={
                      mode
                    }
                    onPress={() =>
                      setDisappearingMode(
                        mode,
                      )
                    }
                    style={[
                      styles.modeButton,
                      disappearingMode ===
                        mode &&
                        styles.modeButtonActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.modeText,
                        disappearingMode ===
                          mode &&
                          styles.modeTextActive,
                      ]}
                    >
                      {
                        mode
                      }
                    </Text>
                  </Pressable>
                ),
              )}
            </View>
          </View>
        ) : null}

        {/* Messages */}
        <View
          style={
            styles.messagesContainer
          }
        >
          {isLoadingMore ? (
            <View
              style={
                styles.loadingMore
              }
            >
              <ActivityIndicator
                size="small"
                color="#a855f7"
              />
            </View>
          ) : null}

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
              item.clientMessageId ||
              item._id}
            showsVerticalScrollIndicator={
              false
            }
            contentContainerStyle={
              styles.messagesContent
            }
            onStartReached={() =>
              void loadMoreMessages()
            }
            onStartReachedThreshold={
              0.05
            }
            onContentSizeChange={() => {
              if (
                !initialScrollDoneRef.current
              ) {
                listRef.current?.scrollToEnd(
                  {
                    animated:
                      false,
                  },
                );
              }
            }}
            maintainVisibleContentPosition={{
              minIndexForVisible:
                0,
            }}
            ListFooterComponent={
              remoteTyping ? (
                <View
                  style={
                    styles.typingRow
                  }
                >
                  <Image
                    source={{
                      uri:
                        otherUser
                          ?.profilePicture ||
                        otherUser
                          ?.avatar ||
                        "https://i.pravatar.cc/150",
                    }}
                    style={
                      styles.typingAvatar
                    }
                  />

                  <View
                    style={
                      styles.typingBubble
                    }
                  >
                    <View
                      style={
                        styles.typingDot
                      }
                    />
                    <View
                      style={
                        styles.typingDot
                      }
                    />
                    <View
                      style={
                        styles.typingDot
                      }
                    />
                  </View>
                </View>
              ) : null
            }
          />

          {showNewMessageIndicator ? (
            <Pressable
              onPress={() =>
                scrollToBottom(
                  true,
                )
              }
              style={
                styles.newMessage
              }
            >
              <Text
                style={
                  styles.newMessageText
                }
              >
                ↓ New Message
              </Text>
            </Pressable>
          ) : null}
        </View>

        {/* Presence avatar */}
        <ConversationPresenceAvatar
          otherUser={
            otherUser
          }
          isPresent={
            isOtherUserPresent
          }
          isTyping={
            remoteTyping
          }
        />

        {/* Recording bar */}
        {isRecordingVoice ? (
          <View
            style={
              styles.recordingBar
            }
          >
            <View
              style={
                styles.recordingInfo
              }
            >
              <Mic
                size={17}
                color="#ef4444"
              />

              <Text
                style={
                  styles.recordingText
                }
              >
                Recording Voice Note...
                {" "}
                (
                {
                  recordingSeconds
                }
                s)
              </Text>
            </View>

            <Pressable
              onPress={() =>
                void stopVoiceRecording()
              }
              style={
                styles.sendVoiceButton
              }
            >
              <Text
                style={
                  styles.sendVoiceText
                }
              >
                Send
              </Text>
            </Pressable>
          </View>
        ) : null}

        {/* Selected media */}
        {selectedFiles.length >
        0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={
              false
            }
            contentContainerStyle={
              styles.selectedFiles
            }
          >
            {selectedFiles.map(
              (
                file,
                index,
              ) => (
                <View
                  key={`${file.uri}-${index}`}
                  style={
                    styles.selectedFile
                  }
                >
                  {file.type.startsWith(
                    "image/",
                  ) ? (
                    <Image
                      source={{
                        uri: file.uri,
                      }}
                      style={
                        styles.filePreview
                      }
                    />
                  ) : file.type.startsWith(
                      "video/",
                    ) ? (
                    <View
                      style={
                        styles.fileIcon
                      }
                    >
                      <VideoIcon
                        size={24}
                        color="#a855f7"
                      />
                    </View>
                  ) : (
                    <View
                      style={
                        styles.fileIcon
                      }
                    >
                      <Paperclip
                        size={22}
                        color="#a855f7"
                      />
                    </View>
                  )}

                  <Pressable
                    onPress={() =>
                      removeSelectedFile(
                        index,
                      )
                    }
                    style={
                      styles.removeFile
                    }
                  >
                    <X
                      size={13}
                      color="#ffffff"
                    />
                  </Pressable>
                </View>
              ),
            )}
          </ScrollView>
        ) : null}

        {/* Emoji picker */}
        {showEmojiPicker ? (
          <View
            style={
              styles.emojiPanel
            }
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
              contentContainerStyle={
                styles.emojiContent
              }
            >
              {emojis.map(
                (
                  emoji,
                ) => (
                  <Pressable
                    key={
                      emoji
                    }
                    onPress={() =>
                      setNewMessage(
                        (
                          previous,
                        ) =>
                          previous +
                          emoji,
                      )
                    }
                    style={
                      styles.emojiButton
                    }
                  >
                    <Text
                      style={
                        styles.emoji
                      }
                    >
                      {
                        emoji
                      }
                    </Text>
                  </Pressable>
                ),
              )}
            </ScrollView>
          </View>
        ) : null}

        {/* Composer */}
        <View
          style={
            styles.composer
          }
        >
          <Pressable
            onPress={
              handlePickMedia
            }
            style={
              styles.composerButton
            }
            accessibilityRole="button"
            accessibilityLabel="Attach image or video"
          >
            <Paperclip
              size={20}
              color="#a1a1aa"
            />
          </Pressable>

          <Pressable
            onPress={
              handlePickDocument
            }
            style={
              styles.composerButton
            }
            accessibilityRole="button"
            accessibilityLabel="Attach file"
          >
            <Grid
              size={19}
              color="#a1a1aa"
            />
          </Pressable>

          <Pressable
            onPress={() =>
              setShowEmojiPicker(
                (
                  value,
                ) =>
                  !value,
              )
            }
            style={
              styles.composerButton
            }
            accessibilityRole="button"
            accessibilityLabel="Emoji picker"
          >
            <Smile
              size={20}
              color="#a1a1aa"
            />
          </Pressable>

          <Pressable
            onPress={
              isRecordingVoice
                ? () =>
                    void stopVoiceRecording()
                : () =>
                    void startVoiceRecording()
            }
            style={[
              styles.composerButton,
              isRecordingVoice &&
                styles.recordingButton,
            ]}
            accessibilityRole="button"
            accessibilityLabel={
              isRecordingVoice
                ? "Stop recording"
                : "Start voice note"
            }
          >
            <Mic
              size={20}
              color={
                isRecordingVoice
                  ? "#ef4444"
                  : "#a1a1aa"
              }
            />
          </Pressable>

          <TextInput
            value={
              newMessage
            }
            onChangeText={
              handleInputChange
            }
            placeholder="Message..."
            placeholderTextColor="#71717a"
            multiline
            maxLength={5000}
            style={
              styles.input
            }
            onFocus={() =>
              setShowEmojiPicker(
                false,
              )
            }
          />

          <Pressable
            onPress={() =>
              void handleSendMessage()
            }
            disabled={
              (
                !newMessage.trim() &&
                selectedFiles.length ===
                  0
              ) ||
              isUploading
            }
            style={[
              styles.sendButton,
              (
                (
                  !newMessage.trim() &&
                  selectedFiles.length ===
                    0
                ) ||
                isUploading
              ) &&
                styles.sendButtonDisabled,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Send message"
          >
            {isUploading ? (
              <ActivityIndicator
                size="small"
                color="#ffffff"
              />
            ) : (
              <Send
                size={17}
                color="#ffffff"
              />
            )}
          </Pressable>
        </View>

        {/* Shared media gallery */}
        <Modal
          visible={
            showMediaGallery
          }
          transparent
          animationType="slide"
          onRequestClose={() =>
            setShowMediaGallery(
              false,
            )
          }
        >
          <View
            style={
              styles.galleryOverlay
            }
          >
            <View
              style={
                styles.galleryPanel
              }
            >
              <View
                style={
                  styles.galleryHeader
                }
              >
                <Text
                  style={
                    styles.galleryTitle
                  }
                >
                  Shared Media Gallery
                </Text>

                <Pressable
                  onPress={() =>
                    setShowMediaGallery(
                      false,
                    )
                  }
                >
                  <X
                    size={22}
                    color="#64748b"
                  />
                </Pressable>
              </View>

              <FlatList
                data={messages.filter(
                  (
                    message,
                  ) =>
                    Boolean(
                      message.mediaUrl,
                    ),
                )}
                numColumns={2}
                keyExtractor={(
                  item,
                  index,
                ) =>
                  `${item._id}-${index}`}
                contentContainerStyle={
                  styles.galleryGrid
                }
                renderItem={({
                  item,
                }) =>
                  item.mediaUrl ? (
                    <Pressable
                      style={
                        styles.galleryItem
                      }
                      onPress={() => {
                        if (
                          item.messageType ===
                          "image"
                        ) {
                          setActiveImage(
                            item.mediaUrl ||
                              null,
                          );
                          setShowMediaGallery(
                            false,
                          );
                        }
                      }}
                    >
                      {item.messageType ===
                      "video" ? (
                        <Video
                          source={{
                            uri:
                              item.mediaUrl,
                          }}
                          style={
                            styles.galleryMedia
                          }
                          resizeMode={
                            ResizeMode.COVER
                          }
                          shouldPlay={
                            false
                          }
                        />
                      ) : (
                        <Image
                          source={{
                            uri:
                              item.mediaUrl,
                          }}
                          style={
                            styles.galleryMedia
                          }
                        />
                      )}
                    </Pressable>
                  ) : null
                }
              />
            </View>
          </View>
        </Modal>

        <SnapViewerModal
          snap={
            activeSnap
          }
          onClose={() =>
            setActiveSnap(
              null,
            )
          }
          onSnapExpired={(
            id,
          ) =>
            setMessages(
              (
                previous,
              ) =>
                previous.filter(
                  (
                    message,
                  ) =>
                    message._id !==
                    id,
                ),
            )
          }
        />

        <ImageViewerModal
          src={
            activeImage
          }
          onClose={() =>
            setActiveImage(
              null,
            )
          }
        />
      </KeyboardAvoidingView>
    );
  };

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#000000",
    },

    loadingScreen: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#000000",
    },

    header: {
      minHeight: 60,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 10,
      borderBottomWidth: 1,
      borderBottomColor: "#18181b",
      backgroundColor: "#000000",
    },

    headerLeft: {
      flex: 1,
      minWidth: 0,
      flexDirection: "row",
      alignItems: "center",
    },

    backButton: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },

    avatarButton: {
      position: "relative",
      marginLeft: 2,
    },

    headerAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: "rgba(168,85,247,0.30)",
    },
    avatarFallback: {
      backgroundColor: "#2e1065",
      alignItems: "center",
      justifyContent: "center",
    },
    avatarFallbackText: {
      color: "#c084fc",
      fontSize: 16,
      fontWeight: "700",
    },

    onlineDot: {
      position: "absolute",
      right: -1,
      bottom: -1,
      width: 11,
      height: 11,
      borderRadius: 6,
      backgroundColor: "#10b981",
      borderWidth: 2,
      borderColor: "#000000",
    },

    headerCopy: {
      flex: 1,
      minWidth: 0,
      marginLeft: 9,
    },

    headerName: {
      color: "#ffffff",
      fontSize: 15,
      fontWeight: "700",
    },

    headerStatus: {
      marginTop: 2,
      color: "#8e8e93",
      fontSize: 11,
    },

    headerActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      marginLeft: 8,
    },

    headerAction: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 20,
    },

    headerActionActive: {
      backgroundColor: "rgba(168,85,247,0.18)",
    },

    disappearingBar: {
      minHeight: 52,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 14,
      borderBottomWidth: 1,
      borderBottomColor: "#27272a",
      backgroundColor: "#18181b",
    },

    disappearingLabel: {
      flex: 1,
      color: "#a1a1aa",
      fontSize: 11,
      fontWeight: "600",
    },

    modeRow: {
      flexDirection: "row",
      gap: 5,
    },

    modeButton: {
      minWidth: 38,
      paddingHorizontal: 9,
      paddingVertical: 6,
      alignItems: "center",
      borderRadius: 14,
      backgroundColor: "#27272a",
      borderWidth: 1,
      borderColor: "#3f3f46",
    },

    modeButtonActive: {
      backgroundColor: "#a855f7",
      borderColor: "#a855f7",
    },

    modeText: {
      color: "#d4d4d8",
      fontSize: 10,
      fontWeight: "700",
    },

    modeTextActive: {
      color: "#ffffff",
    },

    messagesContainer: {
      flex: 1,
      position: "relative",
    },

    messagesContent: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      paddingBottom: 20,
    },

    loadingMore: {
      height: 32,
      alignItems: "center",
      justifyContent: "center",
    },

    dateSeparator: {
      alignItems: "center",
      marginVertical: 14,
    },

    dateText: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
      color: "#9ca3af",
      backgroundColor: "rgba(255,255,255,0.08)",
      fontSize: 10,
      fontWeight: "600",
    },

    messageWrapper: {
      marginVertical: 2,
    },

    messageGroupSpacing: {
      marginTop: 10,
    },

    typingRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      marginTop: 12,
      marginBottom: 3,
    },

    typingAvatar: {
      width: 28,
      height: 28,
      borderRadius: 14,
      marginRight: 7,
      opacity: 0.7,
    },

    typingBubble: {
      minWidth: 56,
      height: 38,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      paddingHorizontal: 12,
      borderRadius: 19,
      backgroundColor: "#262626",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.06)",
    },

    typingDot: {
      width: 5,
      height: 5,
      borderRadius: 3,
      backgroundColor: "#8e8e93",
    },

    newMessage: {
      position:
        "absolute",
      bottom: 12,
      alignSelf:
        "center",

      paddingHorizontal: 16,
      paddingVertical: 8,

      borderRadius: 18,

      backgroundColor:
        "#a855f7",
      borderWidth: 1,
      borderColor:
        "#c084fc",

      shadowColor:
        "#000000",
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.18,
      shadowRadius: 8,
      elevation: 5,
    },

    newMessageText: {
      color:
        "#ffffff",
      fontSize: 10,
      fontWeight:
        "900",
    },

    recordingBar: {
      minHeight: 50,

      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",

      paddingHorizontal: 14,

      borderTopWidth: 1,
      borderTopColor:
        "rgba(239,68,68,0.20)",

      backgroundColor:
        "rgba(239,68,68,0.07)",
    },

    recordingInfo: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 7,
    },

    recordingText: {
      color:
        "#ef4444",
      fontSize: 11,
      fontWeight:
        "700",
    },

    sendVoiceButton: {
      paddingHorizontal: 13,
      paddingVertical: 7,
      borderRadius: 16,
      backgroundColor:
        "#ef4444",
    },

    sendVoiceText: {
      color:
        "#ffffff",
      fontSize: 10,
      fontWeight:
        "800",
    },

    selectedFiles: {
      gap: 9,
      paddingHorizontal: 12,
      paddingVertical: 9,
    },

    selectedFile: {
      width: 64,
      height: 64,
      position:
        "relative",

      overflow:
        "visible",

      borderRadius: 10,
    },

    filePreview: {
      width: "100%",
      height: "100%",
      borderRadius: 10,
      backgroundColor: "#27272a",
    },

    fileIcon: {
      width: "100%",
      height: "100%",
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#1c1c1e",
      borderWidth: 1,
      borderColor: "#2c2c2e",
    },

    removeFile: {
      position: "absolute",
      right: -5,
      top: -5,
      width: 20,
      height: 20,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 10,
      backgroundColor: "#ef4444",
    },

    emojiPanel: {
      minHeight: 54,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: "#27272a",
      backgroundColor: "#18181b",
    },

    emojiContent: {
      paddingHorizontal: 8,
      alignItems: "center",
    },

    emojiButton: {
      width: 40,
      height: 48,
      alignItems: "center",
      justifyContent: "center",
    },

    emoji: {
      fontSize: 23,
    },

    composer: {
      minHeight: 62,
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 1,
      paddingHorizontal: 7,
      paddingTop: 7,
      paddingBottom: Platform.OS === "ios" ? 22 : 8,
      backgroundColor: "#000000",
      borderTopWidth: 1,
      borderTopColor: "#18181b",
    },

    composerButton: {
      width: 39,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 20,
    },

    recordingButton: {
      backgroundColor: "rgba(239,68,68,0.15)",
    },

    input: {
      flex: 1,
      maxHeight: 115,
      minHeight: 44,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 20,
      backgroundColor: "#262626",
      borderWidth: 1,
      borderColor: "#38383a",
      color: "#ffffff",
      fontSize: 14,
    },

    sendButton: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 22,
      backgroundColor: "#a855f7",
    },

    sendButtonDisabled: {
      opacity: 0.4,
    },

    hiddenImage: {
      width: 0,
      height: 0,
    },

    galleryOverlay: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: "rgba(0,0,0,0.75)",
    },

    galleryPanel: {
      height: "82%",
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      backgroundColor: "#121212",
      overflow: "hidden",
    },

    galleryHeader: {
      minHeight: 60,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: "#27272a",
    },

    galleryTitle: {
      color: "#ffffff",
      fontSize: 16,
      fontWeight: "700",
    },

    galleryGrid: {
      padding: 7,
    },

    galleryItem: {
      flex: 1,
      aspectRatio: 1,
      margin: 3,
      borderRadius: 10,
      overflow: "hidden",
      backgroundColor: "#1c1c1e",
    },

    galleryMedia: {
      width: "100%",
      height: "100%",
    },
  });

export default ChatDetail;