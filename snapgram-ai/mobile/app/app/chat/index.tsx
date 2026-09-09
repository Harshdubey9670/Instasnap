import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  router,
} from "expo-router";
import {
  ChevronDown,
  Circle,
  Music2,
  Search,
  Send,
  SquarePen,
  X,
  Plus,
} from "lucide-react-native";
import {
  useSelector,
} from "react-redux";
import {
  formatDistanceToNowStrict,
} from "date-fns";

import api from "../../../src/services/api";
import {
  useSocketContext,
} from "../../../src/contexts/SocketContext";
import MusicPicker from "../../../src/components/ui/MusicPicker";

interface Participant {
  _id: string;
  username?: string;
  fullName?: string;
  profilePicture?: string;
  avatar?: string;
}

interface Conversation {
  _id: string;
  participants: Participant[];
  latestMessage?: {
    _id?: string;
    sender?: Participant;
    text?: string;
    status?: string;
    messageType?: string;
    isDeleted?: boolean;
    createdAt?: string;
  };
}

interface Note {
  _id: string;
  text?: string;
  songTitle?: string;
  songArtist?: string;
  songCoverUrl?: string;
  songPreviewUrl?: string;
  author: Participant;
}

interface SelectedMusic {
  title?: string;
  artist?: string;
  coverUrl?: string;
  previewUrl?: string;
}

export default function ChatPage() {
  const {
    user: authUser,
  } = useSelector(
    (state: any) =>
      state.auth,
  );

  const {
    socket,
    onlineUsers,
  } =
    useSocketContext();

  const [
    conversations,
    setConversations,
  ] = useState<
    Conversation[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");

  const [
    activeTab,
    setActiveTab,
  ] = useState<
    "messages" | "requests"
  >("messages");

  const [
    notes,
    setNotes,
  ] = useState<
    Note[]
  >([]);

  const [
    showAddNote,
    setShowAddNote,
  ] = useState(false);

  const [
    noteText,
    setNoteText,
  ] = useState("");

  const [
    selectedMusic,
    setSelectedMusic,
  ] = useState<
    SelectedMusic | null
  >(null);

  const [
    playingPreview,
    setPlayingPreview,
  ] = useState<
    string | null
  >(null);

  const [
    typingConversations,
    setTypingConversations,
  ] = useState<
    Record<string, boolean>
  >({});

  const audioRef =
    useRef<AudioElement | null>(
      null,
    );

  useEffect(() => {
    const fetchData =
      async () => {
        try {
          setLoading(
            true,
          );

          const [
            conversationsResponse,
            notesResponse,
          ] =
            await Promise.all([
              api.get(
                "/api/conversations",
              ),
              api.get(
                "/api/notes",
              ),
            ]);

          if (
            conversationsResponse
              .data
              ?.success
          ) {
            setConversations(
              conversationsResponse
                .data
                .data || [],
            );
          }

          if (
            notesResponse.data
              ?.success
          ) {
            setNotes(
              notesResponse.data
                .data || [],
            );
          }
        } catch (
          error
        ) {
          console.error(
            "Failed to load chat data:",
            error,
          );
        } finally {
          setLoading(
            false,
          );
        }
      };

    void fetchData();
  }, []);

  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleTyping =
      ({
        conversationId,
      }: {
        conversationId: string;
      }) => {
        setTypingConversations(
          (
            previous,
          ) => ({
            ...previous,
            [conversationId]:
              true,
          }),
        );
      };

    const handleStopTyping =
      ({
        conversationId,
      }: {
        conversationId: string;
      }) => {
        setTypingConversations(
          (
            previous,
          ) => ({
            ...previous,
            [conversationId]:
              false,
          }),
        );
      };

    socket.on(
      "typing",
      handleTyping,
    );

    socket.on(
      "stopTyping",
      handleStopTyping,
    );

    return () => {
      socket.off(
        "typing",
        handleTyping,
      );

      socket.off(
        "stopTyping",
        handleStopTyping,
      );
    };
  }, [
    socket,
  ]);

  const handleAddNote =
    async () => {
      if (
        !noteText.trim() &&
        !selectedMusic
      ) {
        return;
      }

      try {
        const response =
          await api.post(
            "/api/notes",
            {
              text:
                noteText,
              songTitle:
                selectedMusic
                  ?.title,
              songArtist:
                selectedMusic
                  ?.artist,
              songCoverUrl:
                selectedMusic
                  ?.coverUrl,
              songPreviewUrl:
                selectedMusic
                  ?.previewUrl,
            },
          );

        if (
          response.data
            ?.success
        ) {
          setNotes(
            (
              previous,
            ) => [
              response.data.data,
              ...previous.filter(
                (
                  note,
                ) =>
                  note.author?._id !==
                  authUser?._id,
              ),
            ],
          );

          setShowAddNote(
            false,
          );

          setNoteText(
            "",
          );

          setSelectedMusic(
            null,
          );
        }
      } catch (
        error
      ) {
        console.error(
          "Failed to add note:",
          error,
        );
      }
    };

  const togglePlayNote =
    (
      previewUrl?: string,
    ) => {
      if (!previewUrl) {
        return;
      }

      /*
       * React Native does not have the HTMLAudioElement
       * used by the original page. Audio previews should
       * be handled by the native MusicPicker/audio layer.
       *
       * We still preserve the UI playback state here.
       */
      if (
        playingPreview ===
        previewUrl
      ) {
        setPlayingPreview(
          null,
        );
        return;
      }

      setPlayingPreview(
        previewUrl,
      );
    };

  const filteredConversations =
    useMemo(() => {
      if (
        !searchQuery.trim()
      ) {
        return conversations;
      }

      const query =
        searchQuery
          .trim()
          .toLowerCase();

      return conversations.filter(
        (
          conversation,
        ) => {
          const others =
            conversation.participants.filter(
              (
                participant,
              ) =>
                participant._id !==
                authUser?._id,
            );

          return others.some(
            (
              participant,
            ) =>
              participant.username
                ?.toLowerCase()
                .includes(
                  query,
                ) ||
              participant.fullName
                ?.toLowerCase()
                .includes(
                  query,
                ),
          );
        },
      );
    }, [
      conversations,
      searchQuery,
      authUser?._id,
    ]);

  const formatMessageTime =
    (
      createdAt?: string,
    ) => {
      if (!createdAt) {
        return "";
      }

      try {
        const value =
          formatDistanceToNowStrict(
            new Date(
              createdAt,
            ),
            {
              addSuffix:
                false,
            },
          );

        return value
          .replace(
            / seconds?/,
            "s",
          )
          .replace(
            / minutes?/,
            "m",
          )
          .replace(
            / hours?/,
            "h",
          )
          .replace(
            / days?/,
            "d",
          )
          .replace(
            / months?/,
            "mo",
          )
          .replace(
            / years?/,
            "y",
          );
      } catch {
        return "";
      }
    };

  const getInitials =
    (
      participant?: Participant,
    ) =>
      participant
        ?.username
        ?.charAt(0)
        ?.toUpperCase() ||
      "U";

  return (
    <View
      style={
        styles.screen
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
            styles.usernameHeader
          }
        >
          <Text
            style={
              styles.username
            }
          >
            {authUser
              ?.username ||
              "Messages"}
          </Text>

          <ChevronDown
            size={16}
            color="#ffffff"
          />
        </View>

        <Pressable
          style={
            styles.composeButton
          }
          accessibilityRole="button"
          accessibilityLabel="Compose message"
        >
          <SquarePen
            size={20}
            color="#ffffff"
          />
        </Pressable>
      </View>

      {/* Search */}
      <View
        style={
          styles.searchContainer
        }
      >
        <Search
          size={17}
          color="#8e8e93"
        />

        <TextInput
          value={
            searchQuery
          }
          onChangeText={
            setSearchQuery
          }
          placeholder="Search"
          placeholderTextColor="#8e8e93"
          style={
            styles.searchInput
          }
          autoCapitalize="none"
        />
      </View>

      {/* Notes */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.notesContent
        }
      >
        <Pressable
          onPress={() =>
            setShowAddNote(
              true,
            )
          }
          style={
            styles.noteItem
          }
        >
          <View
            style={
              styles.noteAvatarWrap
            }
          >
            <Image
              source={{
                uri:
                  authUser?.profilePicture ||
                  authUser?.avatar ||
                  "https://i.pravatar.cc/150",
              }}
              style={
                styles.noteAvatar
              }
            />

            <View
              style={
                styles.notePlus
              }
            >
              <Plus
                size={18}
                color="#ffffff"
              />
            </View>
          </View>

          <Text
            style={
              styles.noteLabel
            }
            numberOfLines={
              1
            }
          >
            Your Note
          </Text>
        </Pressable>

        {notes.map(
          (
            note,
          ) => (
            <Pressable
              key={
                note._id
              }
              onPress={() =>
                togglePlayNote(
                  note.songPreviewUrl,
                )
              }
              style={
                styles.noteItem
              }
            >
              <View
                style={
                  styles.noteAvatarWrap
                }
              >
                {note.text ||
                note.songTitle ? (
                  <View
                    style={[
                      styles.noteBubble,
                      playingPreview ===
                        note.songPreviewUrl &&
                        styles.noteBubblePlaying,
                    ]}
                  >
                    {note.songTitle ? (
                      <Music2
                        size={10}
                        color="#38bdf8"
                      />
                    ) : null}

                    <Text
                      style={
                        styles.noteBubbleText
                      }
                      numberOfLines={
                        1
                      }
                    >
                      {note.text ||
                        note.songTitle}
                    </Text>
                  </View>
                ) : null}

                <Image
                  source={{
                    uri:
                      note.author
                        ?.profilePicture ||
                      note.author
                        ?.avatar ||
                      "https://i.pravatar.cc/150",
                  }}
                  style={
                    styles.noteAvatar
                  }
                />
              </View>

              <Text
                style={
                  styles.noteLabel
                }
                numberOfLines={
                  1
                }
              >
                {note.author
                  ?._id ===
                authUser?._id
                  ? "You"
                  : note.author
                      ?.username ||
                    getInitials(
                      note.author,
                    )}
              </Text>
            </Pressable>
          ),
        )}
      </ScrollView>

      {/* Tabs */}
      <View
        style={
          styles.tabs
        }
      >
        <Pressable
          onPress={() =>
            setActiveTab(
              "messages",
            )
          }
          style={
            styles.tabButton
          }
        >
          <Text
            style={[
              styles.messagesTabText,
              activeTab ===
                "messages" &&
                styles.activeTabText,
            ]}
          >
            Messages
          </Text>
        </Pressable>

        <Pressable
          onPress={() =>
            setActiveTab(
              "requests",
            )
          }
          style={
            styles.tabButton
          }
        >
          <Text
            style={[
              styles.requestsTabText,
              activeTab ===
                "requests" &&
                styles.activeTabText,
            ]}
          >
            Requests
          </Text>
        </Pressable>
      </View>

      {/* Conversations */}
      <ScrollView
        style={
          styles.conversations
        }
        contentContainerStyle={
          styles.conversationContent
        }
        showsVerticalScrollIndicator={
          false
      }
      >
        {loading ? (
          <View
            style={
              styles.centerLoader
            }
          >
            <ActivityIndicator
              size="small"
              color="#ffffff"
            />
          </View>
        ) : filteredConversations.length ===
          0 ? (
          <View
            style={
              styles.empty
            }
          >
            <Text
              style={
                styles.emptyText
              }
            >
              No messages found.
            </Text>
          </View>
        ) : (
          filteredConversations.map(
            (
              conversation,
            ) => {
              const otherParticipant =
                conversation.participants.find(
                  (
                    participant,
                  ) =>
                    participant._id !==
                    authUser?._id,
                );

              if (
                !otherParticipant
              ) {
                return null;
              }

              const isOnline =
                onlineUsers?.includes(
                  otherParticipant._id,
                );

              const lastMessage =
                conversation.latestMessage;

              const isUnread =
                Boolean(
                  lastMessage &&
                    lastMessage
                      .sender
                      ?._id !==
                      authUser?._id &&
                    lastMessage.status !==
                      "seen",
                );

              const time =
                formatMessageTime(
                  lastMessage?.createdAt,
                );

              return (
                <Pressable
                  key={
                    conversation._id
                  }
                  onPress={() =>
                    router.push(
                      `/app/chat/${conversation._id}` as any,
                    )
                  }
                  style={
                    styles.conversationRow
                  }
                >
                  <View
                    style={
                      styles.avatarWrap
                    }
                  >
                    <Image
                      source={{
                        uri:
                          otherParticipant.profilePicture ||
                          otherParticipant.avatar ||
                          "https://i.pravatar.cc/150",
                      }}
                      style={
                        styles.conversationAvatar
                      }
                    />

                    {isOnline ? (
                      <View
                        style={
                          styles.onlineIndicator
                        }
                      />
                    ) : null}
                  </View>

                  <View
                    style={
                      styles.conversationContentArea
                    }
                  >
                    <Text
                      style={[
                        styles.conversationName,
                        isUnread &&
                          styles.unreadName,
                      ]}
                      numberOfLines={
                        1
                      }
                    >
                      {otherParticipant.fullName ||
                        otherParticipant.username ||
                        "User"}
                    </Text>

                    <View
                      style={
                        styles.previewRow
                      }
                    >
                      <Text
                        style={[
                          styles.previewText,
                          isUnread &&
                            styles.unreadPreview,
                        ]}
                        numberOfLines={
                          1
                        }
                      >
                        {typingConversations[
                          conversation._id
                        ] ? (
                          "typing..."
                        ) : lastMessage?.isDeleted ? (
                          "Message deleted"
                        ) : lastMessage?.messageType ===
                          "text" ? (
                          lastMessage.text ||
                          ""
                        ) : lastMessage ? (
                          "Sent an attachment"
                        ) : (
                          "Sent an attachment."
                        )}
                      </Text>

                      {time ? (
                        <Text
                          style={
                            styles.time
                          }
                        >
                          · {time}
                        </Text>
                      ) : null}
                    </View>
                  </View>

                  {isUnread ? (
                    <Circle
                      size={9}
                      color="#38bdf8"
                      fill="#38bdf8"
                    />
                  ) : null}
                </Pressable>
              );
            },
          )
        )}
      </ScrollView>

      {/* New Note Modal */}
      <Modal
        visible={
          showAddNote
        }
        transparent
        animationType="slide"
        onRequestClose={() =>
          setShowAddNote(
            false,
          )
        }
      >
        <View
          style={
            styles.modalBackdrop
          }
        >
          <View
            style={
              styles.noteModal
            }
          >
            <View
              style={
                styles.noteModalHeader
              }
            >
              <Text
                style={
                  styles.noteModalTitle
                }
              >
                New Note
              </Text>

              <Pressable
                onPress={() =>
                  setShowAddNote(
                    false,
                  )
                }
              >
                <X
                  size={21}
                  color="#ffffff"
                />
              </Pressable>
            </View>

            <TextInput
              value={
                noteText
              }
              onChangeText={
                setNoteText
              }
              placeholder="Share a thought..."
              placeholderTextColor="#8e8e93"
              maxLength={
                60
              }
              style={
                styles.noteInput
              }
            />

            {selectedMusic ? (
              <View
                style={
                  styles.selectedMusic
                }
              >
                {selectedMusic.coverUrl ? (
                  <Image
                    source={{
                      uri:
                        selectedMusic.coverUrl,
                    }}
                    style={
                      styles.musicCover
                    }
                  />
                ) : null}

                <View
                  style={
                    styles.musicCopy
                  }
                >
                  <Text
                    style={
                      styles.musicTitle
                    }
                    numberOfLines={
                      1
                    }
                  >
                    {
                      selectedMusic.title
                    }
                  </Text>

                  <Text
                    style={
                      styles.musicArtist
                    }
                    numberOfLines={
                      1
                    }
                  >
                    {
                      selectedMusic.artist
                    }
                  </Text>
                </View>

                <Pressable
                  onPress={() =>
                    setSelectedMusic(
                      null,
                    )
                  }
                  style={
                    styles.musicRemove
                  }
                >
                  <X
                    size={14}
                    color="#ffffff"
                  />
                </Pressable>
              </View>
            ) : (
              <View
                style={
                  styles.musicPickerContainer
                }
              >
                <MusicPicker
                  onSelect={
                    setSelectedMusic
                  }
                  onClose={() => {}}
                />
              </View>
            )}

            <Pressable
              onPress={() =>
                void handleAddNote()
              }
              disabled={
                !noteText.trim() &&
                !selectedMusic
              }
              style={[
                styles.shareButton,
                !noteText.trim() &&
                  !selectedMusic &&
                  styles.shareButtonDisabled,
              ]}
            >
              <Text
                style={
                  styles.shareButtonText
                }
              >
                Share
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/*
 * Kept deliberately loose because the native implementation
 * doesn't directly control an HTML audio element.
 */
type AudioElement = {
  src?: string;
  play?: () => Promise<void>;
  pause?: () => void;
};

const styles =
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor:
        "#000000",
    },

    header: {
      minHeight: 62,
      paddingHorizontal: 18,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      backgroundColor:
        "#000000",
    },

    usernameHeader: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 5,
    },

    username: {
      color:
        "#ffffff",
      fontSize: 20,
      fontWeight:
        "900",
    },

    composeButton: {
      width: 42,
      height: 42,
      alignItems:
        "center",
      justifyContent:
        "center",
      borderRadius: 21,
    },

    searchContainer: {
      marginHorizontal: 18,
      marginBottom: 6,
      height: 43,
      borderRadius: 12,
      backgroundColor:
        "#262626",
      flexDirection:
        "row",
      alignItems:
        "center",
      paddingHorizontal: 12,
      gap: 8,
    },

    searchInput: {
      flex: 1,
      color:
        "#ffffff",
      fontSize: 14,
    },

    notesContent: {
      paddingHorizontal: 14,
      paddingVertical: 12,
      gap: 15,
      borderBottomWidth: 1,
      borderBottomColor:
        "#171717",
    },

    noteItem: {
      width: 64,
      alignItems:
        "center",
    },

    noteAvatarWrap: {
      width: 56,
      height: 56,
      position:
        "relative",
      marginBottom: 5,
    },

    noteAvatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      borderWidth: 1,
      borderColor:
        "#3a3a3a",
    },

    notePlus: {
      position:
        "absolute",
      right: -2,
      bottom: -2,
      width: 23,
      height: 23,
      borderRadius: 12,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#0095f6",
      borderWidth: 2,
      borderColor:
        "#000000",
    },

    noteBubble: {
      position:
        "absolute",
      top: -13,
      left: "50%",
      maxWidth: 60,
      minWidth: 34,
      transform: [
        {
          translateX: -30,
        },
      ],
      zIndex: 5,
      paddingHorizontal: 5,
      paddingVertical: 3,
      borderRadius: 9,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: 2,
      backgroundColor:
        "#262626",
      borderWidth: 1,
      borderColor:
        "#3a3a3a",
    },

    noteBubblePlaying: {
      opacity: 0.65,
    },

    noteBubbleText: {
      maxWidth: 44,
      color:
        "#f5f5f5",
      fontSize: 8,
      fontWeight:
        "600",
    },

    noteLabel: {
      width: "100%",
      color:
        "#a3a3a3",
      fontSize: 10,
      textAlign:
        "center",
      fontWeight:
        "600",
    },

    tabs: {
      minHeight: 46,
      paddingHorizontal: 18,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      borderBottomWidth: 1,
      borderBottomColor:
        "#171717",
    },

    tabButton: {
      paddingVertical: 10,
    },

    messagesTabText: {
      color:
        "#777777",
      fontSize: 13,
      fontWeight:
        "800",
    },

    requestsTabText: {
      color:
        "#666666",
      fontSize: 12,
      fontWeight:
        "700",
    },

    activeTabText: {
      color:
        "#ffffff",
    },

    conversations: {
      flex: 1,
    },

    conversationContent: {
      paddingBottom: 30,
    },

    centerLoader: {
      paddingVertical: 35,
      alignItems:
        "center",
    },

    empty: {
      paddingVertical: 60,
      alignItems:
        "center",
    },

    emptyText: {
      color:
        "#737373",
      fontSize: 13,
    },

    conversationRow: {
      minHeight: 78,
      paddingHorizontal: 18,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 12,
      borderBottomWidth: 1,
      borderBottomColor:
        "rgba(38,38,38,0.4)",
    },

    avatarWrap: {
      position:
        "relative",
    },

    conversationAvatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      borderWidth: 1,
      borderColor:
        "#282828",
    },

    onlineIndicator: {
      position:
        "absolute",
      right: 0,
      bottom: 0,
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor:
        "#10b981",
      borderWidth: 2,
      borderColor:
        "#000000",
    },

    conversationContentArea: {
      flex: 1,
      minWidth: 0,
    },

    conversationName: {
      color:
        "#d4d4d4",
      fontSize: 14,
      fontWeight:
        "600",
    },

    unreadName: {
      color:
        "#ffffff",
      fontWeight:
        "800",
    },

    previewRow: {
      marginTop: 4,
      flexDirection:
        "row",
      alignItems:
        "center",
      minWidth: 0,
    },

    previewText: {
      flexShrink: 1,
      color:
        "#8e8e93",
      fontSize: 12,
    },

    unreadPreview: {
      color:
        "#ffffff",
      fontWeight:
        "700",
    },

    time: {
      marginLeft: 4,
      color:
        "#666666",
      fontSize: 11,
    },

    modalBackdrop: {
      flex: 1,
      justifyContent:
        "flex-end",
      backgroundColor:
        "rgba(0,0,0,0.75)",
    },

    noteModal: {
      minHeight:
        "75%",
      maxHeight:
        "90%",
      backgroundColor:
        "#171717",
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 18,
      borderTopWidth: 1,
      borderTopColor:
        "#303030",
    },

    noteModalHeader: {
      minHeight: 42,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      marginBottom: 12,
    },

    noteModalTitle: {
      color:
        "#ffffff",
      fontSize: 17,
      fontWeight:
        "800",
    },

    noteInput: {
      minHeight: 48,
      borderRadius: 11,
      backgroundColor:
        "#262626",
      color:
        "#ffffff",
      paddingHorizontal: 14,
      fontSize: 13,
      marginBottom: 12,
    },

    selectedMusic: {
      minHeight: 62,
      flexDirection:
        "row",
      alignItems:
        "center",
      padding: 10,
      borderRadius: 11,
      backgroundColor:
        "#262626",
      marginBottom: 10,
      position:
        "relative",
    },

    musicCover: {
      width: 42,
      height: 42,
      borderRadius: 7,
    },

    musicCopy: {
      flex: 1,
      minWidth: 0,
      marginLeft: 10,
    },

    musicTitle: {
      color:
        "#ffffff",
      fontSize: 12,
      fontWeight:
        "700",
    },

    musicArtist: {
      marginTop: 2,
      color:
        "#8e8e93",
      fontSize: 10,
    },

    musicRemove: {
      width: 25,
      height: 25,
      alignItems:
        "center",
      justifyContent:
        "center",
      borderRadius: 13,
      backgroundColor:
        "#404040",
    },

    musicPickerContainer: {
      flex: 1,
      minHeight: 300,
      overflow:
        "hidden",
    },

    shareButton: {
      minHeight: 44,
      alignItems:
        "center",
      justifyContent:
        "center",
      borderRadius: 10,
      backgroundColor:
        "#0095f6",
      marginTop: 10,
    },

    shareButtonDisabled: {
      opacity: 0.45,
    },

    shareButtonText: {
      color:
        "#ffffff",
      fontSize: 13,
      fontWeight:
        "800",
    },
  });