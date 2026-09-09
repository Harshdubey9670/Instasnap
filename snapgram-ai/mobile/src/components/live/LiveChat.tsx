import React, {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  Send,
} from "lucide-react-native";
import {
  useSelector,
} from "react-redux";

import {
  useSocket,
} from "../../contexts/SocketContext";
import type {
  RootState,
} from "../../store/store";

interface LiveChatMessage {
  _id?: string;
  id?: string;
  text?: string;
  username?: string;
  user?: {
    username?: string;
  };
}

interface LiveChatProps {
  streamId: string | null;
  isHost: boolean;
}

export const LiveChat = ({
  streamId,
  isHost: _isHost,
}: LiveChatProps) => {
  const {
    socket,
  } = useSocket();

  const {
    user,
  } = useSelector(
    (state: RootState) =>
      state.auth,
  );

  const [
    messages,
    setMessages,
  ] = useState<
    LiveChatMessage[]
  >([]);

  const [
    inputText,
    setInputText,
  ] = useState("");

  const listRef =
    useRef<
      FlatList<LiveChatMessage>
    >(null);

  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleNewMessage =
      (
        message: LiveChatMessage,
      ) => {
        setMessages(
          (previous) => [
            ...previous,
            message,
          ],
        );
      };

    socket.on(
      "live-chat-message",
      handleNewMessage,
    );

    return () => {
      socket.off(
        "live-chat-message",
        handleNewMessage,
      );
    };
  }, [socket]);

  useEffect(() => {
    if (
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
  }, [messages]);

  const handleSend =
    () => {
      const text =
        inputText.trim();

      if (
        !text ||
        !socket ||
        !streamId
      ) {
        return;
      }

      socket.emit(
        "live-chat-message",
        {
          streamId,
          text,
        },
      );

      setInputText("");
    };

  return (
    <KeyboardAvoidingView
      pointerEvents="box-none"
      behavior={
        Platform.OS ===
        "ios"
          ? "padding"
          : undefined
      }
      style={
        styles.container
      }
    >
      <View
        style={
          styles.chatPanel
        }
      >
        <FlatList
          ref={
            listRef
          }
          data={
            messages
          }
          keyExtractor={(
            item,
            index,
          ) =>
            item._id ||
            item.id ||
            `${index}-${item.text || ""}`}
          showsVerticalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.messagesContent
          }
          renderItem={({
            item,
          }) => {
            const username =
              item.user
                ?.username ||
              item.username ||
              user?.username ||
              "Viewer";

            return (
              <View
                style={
                  styles.messageRow
                }
              >
                <View
                  style={
                    styles.messageBubble
                  }
                >
                  <Text
                    style={
                      styles.username
                    }
                  >
                    {username}
                  </Text>

                  <Text
                    style={
                      styles.messageText
                    }
                  >
                    {item.text ||
                      ""}
                  </Text>
                </View>
              </View>
            );
          }}
        />

        <View
          style={
            styles.inputRow
          }
        >
          <TextInput
            value={
              inputText
            }
            onChangeText={
              setInputText
            }
            placeholder="Add a comment..."
            placeholderTextColor="rgba(255,255,255,0.60)"
            returnKeyType="send"
            onSubmitEditing={
              handleSend
            }
            style={
              styles.input
            }
          />

          <Pressable
            onPress={
              handleSend
            }
            disabled={
              !inputText.trim() ||
              !socket ||
              !streamId
            }
            style={[
              styles.sendButton,
              (
                !inputText.trim() ||
                !socket ||
                !streamId
              ) &&
                styles.sendDisabled,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Send live chat message"
          >
            <Send
              size={17}
              color="#ffffff"
            />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles =
  StyleSheet.create({
    container: {
      position:
        "absolute",
      left: 16,
      right: 16,
      bottom: 78,
      maxWidth: 380,
      height: 288,
      zIndex: 40,
    },

    chatPanel: {
      flex: 1,
      justifyContent:
        "flex-end",
    },

    messagesContent: {
      flexGrow: 1,
      justifyContent:
        "flex-end",
      paddingBottom: 8,
      gap: 8,
    },

    messageRow: {
      width: "100%",
      alignItems:
        "flex-start",
    },

    messageBubble: {
      maxWidth: "90%",
      flexDirection:
        "row",
      alignItems:
        "flex-start",
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 16,
      backgroundColor:
        "rgba(0,0,0,0.60)",
      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.10)",
    },

    username: {
      marginRight: 7,
      fontSize: 10,
      lineHeight: 16,
      fontWeight: "800",
      color: "#c084fc",
    },

    messageText: {
      flexShrink: 1,
      fontSize: 10,
      lineHeight: 16,
      color: "#ffffff",
    },

    inputRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 8,
      marginTop: 8,
    },

    input: {
      flex: 1,
      minHeight: 44,
      paddingHorizontal: 16,
      borderRadius: 22,
      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.30)",
      backgroundColor:
        "rgba(0,0,0,0.60)",
      color: "#ffffff",
      fontSize: 12,
    },

    sendButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#a855f7",
      shadowColor:
        "#000000",
      shadowOffset: {
        width: 0,
        height: 5,
      },
      shadowOpacity: 0.25,
      shadowRadius: 9,
      elevation: 6,
    },

    sendDisabled: {
      opacity: 0.40,
    },
  });

export default LiveChat;