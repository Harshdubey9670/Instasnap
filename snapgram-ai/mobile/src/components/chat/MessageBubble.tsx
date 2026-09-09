import React from "react";
import {
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  AlertCircle,
  Camera,
  Check,
  CheckCheck,
  Play,
} from "lucide-react-native";
import {
  Video,
  ResizeMode,
  Audio,
} from "expo-av";
import {
  format,
} from "date-fns";
import {
  Image,
} from "react-native";

interface MessageBubbleProps {
  msg: any;
  isMine: boolean;
  reactions: string[];
  reactionMenuMsgId: string | null;
  setReactionMenuMsgId: (
    id: string | null,
  ) => void;
  handleAddReaction: (
    msgId: string,
    emoji: string,
  ) => void;
  setActiveSnap: (
    snap: any,
  ) => void;
  onImageClick?: (
    src: string,
  ) => void;
  onOpenStory?: (
    story: any,
  ) => void;
  isFirstInGroup: boolean;
}

const QUICK_REACTIONS = [
  "❤️",
  "😂",
  "😮",
  "😢",
  "🔥",
  "👍",
];

const MessageBubble = ({
  msg,
  isMine,
  reactions,
  reactionMenuMsgId,
  setReactionMenuMsgId,
  handleAddReaction,
  setActiveSnap,
  onImageClick,
  onOpenStory,
  isFirstInGroup,
}: MessageBubbleProps) => {
  const storyObj =
    typeof msg.story ===
    "object"
      ? msg.story
      : null;

  const isStoryExpired =
    Boolean(
      storyObj?.expiresAt,
    ) &&
    new Date(
      storyObj.expiresAt,
    ).getTime() <
      Date.now();

  const isStoryUnavailable =
    msg.messageType ===
      "story_share" &&
    (!storyObj ||
      isStoryExpired);

  const timestamp =
    msg.createdAt
      ? format(
          new Date(
            msg.createdAt,
          ),
          "h:mm a",
        )
      : "";

  const handleFileOpen =
    async () => {
      if (
        msg.mediaUrl
      ) {
        try {
          await Linking.openURL(
            msg.mediaUrl,
          );
        } catch (
          error
        ) {
          console.error(
            "Unable to open file:",
            error,
          );
        }
      }
    };

  const handleReaction =
    () => {
      setReactionMenuMsgId(
        msg._id,
      );
    };

  return (
    <View
      style={[
        styles.wrapper,
        {
          alignItems:
            isMine
              ? "flex-end"
              : "flex-start",
        },
      ]}
    >
      {msg.isSnap ? (
        <Pressable
          onPress={() =>
            setActiveSnap(
              msg,
            )
          }
          style={[
            styles.snapBubble,
            isMine
              ? styles.snapMine
              : styles.snapOther,
          ]}
        >
          <View
            style={
              styles.snapIcon
            }
          >
            <Camera
              size={20}
              color="#ffffff"
            />
          </View>

          <View>
            <Text
              style={
                styles.snapTitle
              }
            >
              {msg.isOpened
                ? "Snap Opened"
                : "Tap to View Snap"}
            </Text>

            <Text
              style={
                styles.snapSubtitle
              }
            >
              {msg.snapTimer ||
                10}
              s •{" "}
              {msg.viewMode ===
              "view_once"
                ? "View Once"
                : "Replay Once"}
            </Text>
          </View>
        </Pressable>
      ) : (
        <Pressable
          onLongPress={
            handleReaction
          }
          style={[
            styles.messageBubble,
            isMine
              ? styles.mine
              : styles.other,
            isFirstInGroup
              ? isMine
                ? styles.mineFirst
                : styles.otherFirst
              : isMine
                ? styles.mineContinuation
                : styles.otherContinuation,
            msg.status ===
              "sending" &&
              styles.sending,
          ]}
        >
          {msg.messageType ===
          "story_share" ? (
            isStoryUnavailable ? (
              <View
                style={
                  styles.storyUnavailable
                }
              >
                <AlertCircle
                  size={20}
                  color="#fbbf24"
                />

                <View
                  style={
                    styles.storyUnavailableCopy
                  }
                >
                  <Text
                    style={
                      styles.storyUnavailableTitle
                    }
                  >
                    Story unavailable
                  </Text>

                  <Text
                    style={
                      styles.storyUnavailableText
                    }
                  >
                    This story has expired or
                    been removed
                  </Text>
                </View>
              </View>
            ) : (
              <View
                style={
                  styles.storyCard
                }
              >
                <View
                  style={
                    styles.storyHeader
                  }
                >
                  <Image
                    source={{
                      uri:
                        storyObj
                          ?.user
                          ?.profilePicture ||
                        storyObj
                          ?.user
                          ?.avatar ||
                        "https://i.pravatar.cc/150",
                    }}
                    style={
                      styles.storyAvatar
                    }
                  />

                  <Text
                    style={
                      styles.storyUsername
                    }
                    numberOfLines={
                      1
                    }
                  >
                    @
                    {storyObj
                      ?.user
                      ?.username ||
                      "user"}
                    's story
                  </Text>
                </View>

                <Pressable
                  onPress={() => {
                    if (
                      storyObj &&
                      onOpenStory
                    ) {
                      onOpenStory(
                        storyObj,
                      );
                    }
                  }}
                  style={
                    styles.storyMedia
                  }
                >
                  {storyObj?.media?.[0]
                    ?.type ===
                  "video" ? (
                    <>
                      <Video
                        source={{
                          uri:
                            storyObj
                              .media[0]
                              .url,
                        }}
                        style={
                          styles.storyMediaImage
                        }
                        resizeMode={
                          ResizeMode.COVER
                        }
                        shouldPlay={
                          false
                        }
                      />

                      <View
                        style={
                          styles.storyPlay
                        }
                      >
                        <Play
                          size={18}
                          color="#ffffff"
                          fill="#ffffff"
                        />
                      </View>
                    </>
                  ) : (
                    <>
                      <Image
                        source={{
                          uri:
                            storyObj
                              ?.media?.[0]
                              ?.url ||
                            msg.mediaUrl,
                        }}
                        style={
                          styles.storyMediaImage
                        }
                      />

                      <View
                        style={
                          styles.storyPlay
                        }
                      >
                        <Play
                          size={18}
                          color="#ffffff"
                          fill="#ffffff"
                        />
                      </View>
                    </>
                  )}
                </Pressable>
              </View>
            )
          ) : null}

          {msg.messageType ===
            "image" &&
          msg.mediaUrl ? (
            <Pressable
              onPress={() =>
                onImageClick?.(
                  msg.mediaUrl,
                )
              }
            >
              <Image
                source={{
                  uri:
                    msg.mediaUrl,
                }}
                style={
                  styles.attachmentImage
                }
                resizeMode="cover"
              />
            </Pressable>
          ) : null}

          {msg.messageType ===
            "video" &&
          msg.mediaUrl ? (
            <Video
              source={{
                uri:
                  msg.mediaUrl,
              }}
              style={
                styles.attachmentVideo
              }
              resizeMode={
                ResizeMode.CONTAIN
              }
              useNativeControls
              shouldPlay={false}
            />
          ) : null}

          {msg.messageType ===
            "file" &&
          msg.mediaUrl ? (
            <Pressable
              onPress={() =>
                void handleFileOpen()
              }
              style={
                styles.fileAttachment
              }
            >
              <Text
                style={
                  styles.fileText
                }
              >
                📄 Download File
              </Text>
            </Pressable>
          ) : null}

          {msg.messageType ===
          "voice" ? (
            <VoiceMessage
              uri={
                msg.mediaUrl
              }
              duration={
                msg.duration ||
                0
              }
            />
          ) : msg.text ? (
            <Text
              style={[
                styles.messageText,
                {
                  color:
                    isMine
                      ? "#ffffff"
                      : "#0f172a",
                },
              ]}
            >
              {msg.text}
            </Text>
          ) : null}

          {reactions.length >
          0 ? (
            <View
              style={
                styles.reactions
              }
            >
              {reactions.map(
                (
                  reaction,
                  index,
                ) => (
                  <Text
                    key={`${reaction}-${index}`}
                    style={
                      styles.reaction
                    }
                  >
                    {
                      reaction
                    }
                  </Text>
                ),
              )}
            </View>
          ) : null}
        </Pressable>
      )}

      {reactionMenuMsgId ===
      msg._id ? (
        <View
          style={
            styles.reactionMenu
          }
        >
          {QUICK_REACTIONS.map(
            (
              emoji,
            ) => (
              <Pressable
                key={
                  emoji
                }
                onPress={() =>
                  handleAddReaction(
                    msg._id,
                    emoji,
                  )
                }
                style={
                  styles.reactionButton
                }
              >
                <Text
                  style={
                    styles.reactionEmoji
                  }
                >
                  {
                    emoji
                  }
                </Text>
              </Pressable>
            ),
          )}

          <Pressable
            onPress={() =>
              setReactionMenuMsgId(
                null,
              )
            }
            style={
              styles.reactionClose
            }
          >
            <Text
              style={
                styles.reactionCloseText
              }
            >
              ✕
            </Text>
          </Pressable>
        </View>
      ) : null}

      <View
        style={
          styles.timestampRow
        }
      >
        <Text
          style={
            styles.timestamp
          }
        >
          {
            timestamp
          }
        </Text>

        {isMine ? (
          msg.status ===
          "sending" ? (
            <Text
              style={
                styles.receipt
              }
            >
              ...
            </Text>
          ) : msg.status ===
            "seen" ? (
            <CheckCheck
              size={14}
              color="#3b82f6"
            />
          ) : msg.status ===
            "delivered" ? (
            <CheckCheck
              size={14}
              color="#64748b"
            />
          ) : (
            <Check
              size={14}
              color="#64748b"
            />
          )
        ) : null}
      </View>
    </View>
  );
};

const VoiceMessage = ({
  uri,
  duration,
}: {
  uri?: string;
  duration: number;
}) => {
  const [
    playing,
    setPlaying,
  ] = React.useState(
    false,
  );

  const soundRef =
    React.useRef<any>(
      null,
    );

  const togglePlayback =
    async () => {
      if (!uri) {
        return;
      }

      try {
        if (!soundRef.current) {
          const {
            sound,
          } =
            await Audio.Sound.createAsync(
              {
                uri,
              },
              {
                shouldPlay:
                  true,
              },
            );

          soundRef.current =
            sound;

          sound.setOnPlaybackStatusUpdate(
            (
              status: any,
            ) => {
              if (
                status.isLoaded &&
                status.didJustFinish
              ) {
                setPlaying(
                  false,
                );

                void sound.unloadAsync();

                soundRef.current =
                  null;
              }
            },
          );

          setPlaying(
            true,
          );
        } else {
          if (
            playing
          ) {
            await soundRef.current.pauseAsync();
            setPlaying(
              false,
            );
          } else {
            await soundRef.current.playAsync();
            setPlaying(
              true,
            );
          }
        }
      } catch (
        error
      ) {
        console.error(
          "Voice playback failed:",
          error,
        );
      }
    };

  return (
    <View
      style={
        styles.voiceRow
      }
    >
      <Pressable
        onPress={() =>
          void togglePlayback()
        }
        style={
          styles.voicePlay
        }
      >
        <Text
          style={
            styles.voicePlayText
          }
        >
          {playing
            ? "❚❚"
            : "▶"}
        </Text>
      </Pressable>

      <View
        style={
          styles.voiceBar
        }
      >
        <View
          style={
            styles.voiceProgress
          }
        />
      </View>

      <Text
        style={[
          styles.voiceDuration,
          {
            color:
              "#64748b",
          },
        ]}
      >
        {duration}s
      </Text>
    </View>
  );
};

const styles =
  StyleSheet.create({
    wrapper: {
      width: "100%",
      marginVertical: 2,
    },

    messageBubble: {
      maxWidth:
        "82%",

      padding: 13.5,

      position:
        "relative",
    },

    mine: {
      backgroundColor:
        "#a855f7",
    },

    other: {
      backgroundColor:
        "#f8fafc",
      borderWidth: 1,
      borderColor:
        "#e2e8f0",
    },

    mineFirst: {
      borderTopLeftRadius:
        18,
      borderBottomLeftRadius:
        18,
      borderTopRightRadius:
        4,
      borderBottomRightRadius:
        18,
    },

    mineContinuation: {
      borderRadius:
        18,
      borderTopRightRadius:
        4,
      borderBottomRightRadius:
        4,
    },

    otherFirst: {
      borderTopLeftRadius:
        4,
      borderTopRightRadius:
        18,
      borderBottomLeftRadius:
        18,
      borderBottomRightRadius:
        18,
    },

    otherContinuation: {
      borderRadius:
        18,
      borderTopLeftRadius:
        4,
      borderBottomLeftRadius:
        4,
    },

    sending: {
      opacity: 0.65,
    },

    messageText: {
      fontSize: 14,
      lineHeight: 20,
    },

    snapBubble: {
      flexDirection:
        "row",
      alignItems:
        "center",

      gap: 11,

      padding: 14,

      borderRadius: 17,

      borderWidth: 1,
    },

    snapMine: {
      backgroundColor:
        "rgba(168,85,247,0.18)",
      borderColor:
        "rgba(168,85,247,0.45)",
    },

    snapOther: {
      backgroundColor:
        "#130a1c",
      borderColor:
        "rgba(255,255,255,0.10)",
    },

    snapIcon: {
      width: 40,
      height: 40,

      alignItems:
        "center",
      justifyContent:
        "center",

      borderRadius: 20,

      backgroundColor:
        "#a855f7",
    },

    snapTitle: {
      color:
        "#f8fafc",
      fontSize: 13,
      fontWeight:
        "800",
    },

    snapSubtitle: {
      marginTop: 3,
      color:
        "#94a3b8",
      fontSize: 10,
    },

    storyCard: {
      width: 240,

      overflow:
        "hidden",

      borderRadius: 13,

      backgroundColor:
        "#000000",

      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.15)",
    },

    storyHeader: {
      minHeight: 42,

      flexDirection:
        "row",
      alignItems:
        "center",

      paddingHorizontal: 10,

      backgroundColor:
        "rgba(0,0,0,0.45)",
    },

    storyAvatar: {
      width: 25,
      height: 25,
      borderRadius: 13,
      marginRight: 8,
    },

    storyUsername: {
      flex: 1,
      color:
        "#ffffff",
      fontSize: 10,
      fontWeight:
        "700",
    },

    storyMedia: {
      width: 240,
      height: 360,

      alignItems:
        "center",
      justifyContent:
        "center",
    },

    storyMediaImage: {
      width: "100%",
      height: "100%",
    },

    storyPlay: {
      position:
        "absolute",

      width: 40,
      height: 40,

      alignItems:
        "center",
      justifyContent:
        "center",

      borderRadius: 20,

      backgroundColor:
        "rgba(0,0,0,0.55)",

      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.20)",
    },

    storyUnavailable: {
      flexDirection:
        "row",
      gap: 10,
      padding: 12,
    },

    storyUnavailableCopy: {
      flex: 1,
    },

    storyUnavailableTitle: {
      color:
        "#ffffff",
      fontSize: 11,
      fontWeight:
        "800",
    },

    storyUnavailableText: {
      marginTop: 3,
      color:
        "rgba(255,255,255,0.50)",
      fontSize: 9,
    },

    attachmentImage: {
      width: 220,
      height: 220,
      borderRadius: 12,
      marginBottom: 5,
    },

    attachmentVideo: {
      width: 220,
      height: 220,
      borderRadius: 12,
      marginBottom: 5,
      backgroundColor:
        "#000000",
    },

    fileAttachment: {
      minHeight: 40,
      justifyContent:
        "center",
      paddingHorizontal: 10,
      borderRadius: 9,
      backgroundColor:
        "rgba(0,0,0,0.08)",
      marginBottom: 4,
    },

    fileText: {
      color:
        "#0f172a",
      fontSize: 12,
      fontWeight:
        "700",
      textDecorationLine:
        "underline",
    },

    reactions: {
      position:
        "absolute",

      right: 7,
      bottom: -13,

      flexDirection:
        "row",

      paddingHorizontal: 8,
      paddingVertical: 2,

      borderRadius: 999,

      backgroundColor:
        "#ffffff",

      borderWidth: 1,
      borderColor:
        "#e2e8f0",

      elevation: 3,
      shadowColor:
        "#000000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.12,
      shadowRadius: 5,
    },

    reaction: {
      fontSize: 12,
    },

    reactionMenu: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 2,

      marginVertical: 5,
      paddingHorizontal: 8,
      paddingVertical: 5,

      borderRadius: 999,

      backgroundColor:
        "#ffffff",

      borderWidth: 1,
      borderColor:
        "#e2e8f0",

      elevation: 7,
    },

    reactionButton: {
      width: 35,
      height: 35,

      alignItems:
        "center",
      justifyContent:
        "center",
    },

    reactionEmoji: {
      fontSize: 19,
    },

    reactionClose: {
      paddingHorizontal: 7,
    },

    reactionCloseText: {
      color:
        "#64748b",
      fontSize: 11,
    },

    timestampRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 4,

      paddingHorizontal: 4,
      marginTop: 3,
    },

    timestamp: {
      color:
        "#64748b",
      fontSize: 9,
    },

    receipt: {
      color:
        "#64748b",
      fontSize: 11,
    },

    voiceRow: {
      minWidth: 170,

      flexDirection:
        "row",
      alignItems:
        "center",

      gap: 8,
    },

    voicePlay: {
      width: 34,
      height: 34,

      borderRadius: 17,

      alignItems:
        "center",
      justifyContent:
        "center",

      backgroundColor:
        "rgba(168,85,247,0.15)",
    },

    voicePlayText: {
      fontSize: 12,
      color:
        "#a855f7",
    },

    voiceBar: {
      flex: 1,
      height: 4,
      borderRadius: 2,
      backgroundColor:
        "#cbd5e1",
      overflow:
        "hidden",
    },

    voiceProgress: {
      width: "30%",
      height: "100%",
      backgroundColor:
        "#a855f7",
    },

    voiceDuration: {
      fontSize: 9,
      fontWeight:
        "700",
    },
  });

export default React.memo(
  MessageBubble,
);