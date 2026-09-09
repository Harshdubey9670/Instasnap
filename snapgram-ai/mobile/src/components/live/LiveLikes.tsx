import React, {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import {
  Heart,
} from "lucide-react-native";

import {
  useSocket,
} from "../../contexts/SocketContext";

interface FloatingLike {
  id: string;
  xOffset: number;
}

interface LiveLikesProps {
  streamId: string | null;
  isHost: boolean;
}

export const LiveLikes = ({
  streamId,
  isHost,
}: LiveLikesProps) => {
  const {
    socket,
  } = useSocket();

  const [
    likes,
    setLikes,
  ] = useState<
    FloatingLike[]
  >([]);

  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleLike =
      () => {
        const id =
          `${Date.now()}-${Math.random()}`;

        const xOffset =
          Math.random() *
            40 -
          20;

        setLikes(
          (previous) => [
            ...previous,
            {
              id,
              xOffset,
            },
          ],
        );

        setTimeout(
          () => {
            setLikes(
              (previous) =>
                previous.filter(
                  (
                    like,
                  ) =>
                    like.id !==
                    id,
                ),
            );
          },
          2000,
        );
      };

    socket.on(
      "live-like",
      handleLike,
    );

    return () => {
      socket.off(
        "live-like",
        handleLike,
      );
    };
  }, [socket]);

  const sendLike =
    () => {
      if (
        socket &&
        streamId
      ) {
        socket.emit(
          "live-like",
          {
            streamId,
          },
        );
      }
    };

  return (
    <>
      <View
        pointerEvents="none"
        style={
          styles.heartsContainer
        }
      >
        {likes.map(
          (
            like,
          ) => (
            <FloatingHeart
              key={
                like.id
              }
              xOffset={
                like.xOffset
              }
            />
          ),
        )}
      </View>

      {!isHost ? (
        <Pressable
          onPress={
            sendLike
          }
          style={
            styles.likeButton
          }
          accessibilityRole="button"
          accessibilityLabel="Send live like"
        >
          <Heart
            size={24}
            color="#ffffff"
          />
        </Pressable>
      ) : null}
    </>
  );
};

const FloatingHeart = ({
  xOffset,
}: {
  xOffset: number;
}) => {
  const translateY =
    useRef(
      new Animated.Value(
        50,
      ),
    ).current;

  const translateX =
    useRef(
      new Animated.Value(
        0,
      ),
    ).current;

  const opacity =
    useRef(
      new Animated.Value(
        0,
      ),
    ).current;

  const scale =
    useRef(
      new Animated.Value(
        0.5,
      ),
    ).current;

  useEffect(() => {
    Animated.parallel([
      Animated.sequence([
        Animated.timing(
          opacity,
          {
            toValue: 1,
            duration: 180,
            useNativeDriver:
              true,
          },
        ),
        Animated.timing(
          opacity,
          {
            toValue: 0,
            duration: 600,
            delay: 950,
            useNativeDriver:
              true,
          },
        ),
      ]),
      Animated.timing(
        translateY,
        {
          toValue: -200,
          duration: 2000,
          useNativeDriver:
            true,
        },
      ),
      Animated.sequence([
        Animated.timing(
          translateX,
          {
            toValue:
              xOffset,
            duration: 650,
            useNativeDriver:
              true,
          },
        ),
        Animated.timing(
          translateX,
          {
            toValue:
              -xOffset,
            duration: 650,
            useNativeDriver:
              true,
          },
        ),
        Animated.timing(
          translateX,
          {
            toValue:
              xOffset,
            duration: 700,
            useNativeDriver:
              true,
          },
        ),
      ]),
      Animated.sequence([
        Animated.timing(
          scale,
          {
            toValue: 1.2,
            duration: 300,
            useNativeDriver:
              true,
          },
        ),
        Animated.timing(
          scale,
          {
            toValue: 1,
            duration: 250,
            useNativeDriver:
              true,
          },
        ),
      ]),
    ]).start();
  }, [
    opacity,
    scale,
    translateX,
    translateY,
    xOffset,
  ]);

  return (
    <Animated.View
      style={[
        styles.floatingHeart,
        {
          opacity,
          transform: [
            {
              translateY,
            },
            {
              translateX,
            },
            {
              scale,
            },
          ],
        },
      ]}
    >
      <Heart
        size={32}
        color="#ef4444"
        fill="#ef4444"
      />
    </Animated.View>
  );
};

const styles =
  StyleSheet.create({
    heartsContainer: {
      position:
        "absolute",
      right: 16,
      bottom: 128,

      width: 48,
      height: 260,

      zIndex: 50,
    },

    floatingHeart: {
      position:
        "absolute",
      bottom: 0,
      left: 8,
    },

    likeButton: {
      position:
        "absolute",
      right: 16,
      bottom: 78,

      width: 48,
      height: 48,

      alignItems:
        "center",
      justifyContent:
        "center",

      borderRadius: 24,

      backgroundColor:
        "rgba(0,0,0,0.42)",

      zIndex: 50,

      shadowColor:
        "#000000",
      shadowOffset: {
        width: 0,
        height: 5,
      },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 6,
    },
  });

export default LiveLikes;