import React, {
  useRef,
  useState,
} from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ViewToken,
} from "react-native";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Volume2,
  VolumeX,
} from "lucide-react-native";
import {
  Video,
  ResizeMode,
} from "expo-av";

interface MediaItem {
  url: string;
  type?: string;
  altText?: string;
}

interface FeedVideoItemProps {
  src: string;
  altText?: string;
  isActive?: boolean;
  onToggleMute?: () => void;
}

export function FeedVideoItem({
  src,
  altText,
  isActive = true,
}: FeedVideoItemProps) {
  const [
    isMuted,
    setIsMuted,
  ] = useState(true);

  const videoRef =
    useRef<Video>(null);

  const toggleMute =
    async () => {
      const nextMuted =
        !isMuted;

      setIsMuted(
        nextMuted,
      );

      try {
        await videoRef.current?.setIsMutedAsync(
          nextMuted,
        );
      } catch {
        // Video may not be mounted yet.
      }
    };

  return (
    <View
      style={
        styles.videoContainer
      }
    >
      <Video
        ref={videoRef}
        source={{
          uri: src,
        }}
        style={
          styles.video
        }
        resizeMode={
          ResizeMode.CONTAIN
        }
        shouldPlay={
          isActive
        }
        isLooping
        isMuted={
          isMuted
        }
        useNativeControls={
          false
        }
        accessibilityLabel={
          altText ||
          "Video post"
        }
      />

      <Pressable
        onPress={
          toggleMute
        }
        style={({ pressed }) => [
          styles.muteButton,
          pressed &&
            styles.muteButtonPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={
          isMuted
            ? "Unmute sound"
            : "Mute sound"
        }
      >
        {isMuted ? (
          <VolumeX
            size={17}
            color="#ffffff"
            strokeWidth={2}
          />
        ) : (
          <Volume2
            size={17}
            color="#ffffff"
            strokeWidth={2}
          />
        )}
      </Pressable>
    </View>
  );
}

interface PostMediaCarouselProps {
  mediaItems: MediaItem[];
  onDoubleTap: (
    event?: unknown,
  ) => void;
  showHeartOverlay: boolean;
}

export const PostMediaCarousel = ({
  mediaItems,
  onDoubleTap,
  showHeartOverlay,
}: PostMediaCarouselProps) => {
  const [
    currentMediaIndex,
    setCurrentMediaIndex,
  ] = useState(0);

  const [
    activeVideoIndex,
    setActiveVideoIndex,
  ] = useState(0);

  const [
    heartScale,
  ] = useState(
    new Animated.Value(0),
  );

  const [
    heartOpacity,
  ] = useState(
    new Animated.Value(0),
  );

  const flatListRef =
    useRef<
      FlatList<MediaItem>
    >(null);

  const lastTapRef =
    useRef(0);

  const screenWidth =
    Dimensions.get(
      "window",
    ).width;

  /*
   * The web implementation uses:
   *
   * aspect-[4/5]
   *
   * on smaller screens, with different aspect ratios
   * at larger breakpoints.
   *
   * We use a 4:5 mobile feed presentation here.
   */
  const mediaHeight =
    screenWidth * 1.25;

  const isCarousel =
    mediaItems.length > 1;

  const triggerDoubleTap =
    () => {
      const now =
        Date.now();

      const elapsed =
        now -
        lastTapRef.current;

      if (
        elapsed > 0 &&
        elapsed < 300
      ) {
        onDoubleTap();

        heartScale.setValue(
          0,
        );

        heartOpacity.setValue(
          1,
        );

        Animated.parallel([
          Animated.sequence([
            Animated.timing(
              heartScale,
              {
                toValue: 1.2,
                duration: 220,
                useNativeDriver: true,
              },
            ),
            Animated.timing(
              heartScale,
              {
                toValue: 1,
                duration: 120,
                useNativeDriver: true,
              },
            ),
          ]),
          Animated.timing(
            heartOpacity,
            {
              toValue: 0,
              duration: 800,
              delay: 150,
              useNativeDriver: true,
            },
          ),
        ]).start();
      }

      lastTapRef.current =
        now;
    };

  const handleScroll =
    (
      event: NativeSyntheticEvent<NativeScrollEvent>,
    ) => {
      const offsetX =
        event.nativeEvent
          .contentOffset.x;

      const width =
        event.nativeEvent
          .layoutMeasurement
          .width;

      if (!width) {
        return;
      }

      const index =
        Math.round(
          offsetX / width,
        );

      if (
        index !==
        currentMediaIndex
      ) {
        setCurrentMediaIndex(
          index,
        );

        setActiveVideoIndex(
          index,
        );
      }
    };

  const scrollTo =
    (
      index: number,
    ) => {
      if (
        index < 0 ||
        index >= mediaItems.length
      ) {
        return;
      }

      flatListRef.current?.scrollToIndex(
        {
          index,
          animated:
            true,
        },
      );

      setCurrentMediaIndex(
        index,
      );

      setActiveVideoIndex(
        index,
      );
    };

  const handleScrollToIndexFailed =
    ({
      index,
    }: {
      index: number;
    }) => {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex(
          {
            index,
            animated:
              true,
          },
        );
      }, 100);
    };

  const handleViewableItemsChanged =
    useRef(
      ({
        viewableItems,
      }: {
        viewableItems: Array<
          ViewToken
        >;
      }) => {
        const firstVisible =
          viewableItems.find(
            (item) =>
              item.isViewable,
          );

        if (
          firstVisible?.index !=
          null
        ) {
          setCurrentMediaIndex(
            firstVisible.index,
          );

          setActiveVideoIndex(
            firstVisible.index,
          );
        }
      },
    ).current;

  const renderMedia = ({
    item,
    index,
  }: {
    item: MediaItem;
    index: number;
  }) => {
    const isVideo =
      item.type ===
      "video";

    return (
      <View
        style={[
          styles.mediaSlide,
          {
            width:
              screenWidth,
            height:
              mediaHeight,
          },
        ]}
      >
        {!isVideo ? (
          <Image
            source={{
              uri: item.url,
            }}
            style={[
              styles.blurredBackground,
              {
                width:
                  screenWidth,
                height:
                  mediaHeight,
              },
            ]}
            resizeMode="cover"
            blurRadius={24}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          />
        ) : null}

        <View
          style={
            styles.darkOverlay
          }
        />

        <Pressable
          style={
            styles.mediaTouchable
          }
          onPress={
            triggerDoubleTap
          }
          accessibilityRole="button"
          accessibilityLabel={
            isVideo
              ? item.altText ||
                "Video post"
              : item.altText ||
                "Post content"
          }
        >
          {isVideo ? (
            <FeedVideoItem
              src={
                item.url
              }
              altText={
                item.altText
              }
              isActive={
                activeVideoIndex ===
                index
              }
            />
          ) : (
            <Image
              source={{
                uri: item.url,
              }}
              style={
                styles.foregroundImage
              }
              resizeMode="contain"
              accessibilityLabel={
                item.altText ||
                "Post content"
              }
            />
          )}
        </Pressable>
      </View>
    );
  };

  return (
    <View
      style={
        styles.container
      }
    >
      <View
        style={[
          styles.carouselContainer,
          {
            height:
              mediaHeight,
          },
        ]}
      >
        <FlatList
          ref={
            flatListRef
          }
          data={
            mediaItems
          }
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={
            false
          }
          scrollEventThrottle={
            16
          }
          bounces={
            isCarousel
          }
          decelerationRate="fast"
          snapToAlignment="start"
          keyExtractor={(
            item,
            index,
          ) =>
            `${item.url}-${index}`}
          renderItem={
            renderMedia
          }
          onScroll={
            handleScroll
          }
          onViewableItemsChanged={
            handleViewableItemsChanged
          }
          viewabilityConfig={{
            itemVisiblePercentThreshold:
              70,
          }}
          onScrollToIndexFailed={
            handleScrollToIndexFailed
          }
          getItemLayout={(
            _data,
            index,
          ) => ({
            length:
              screenWidth,
            offset:
              screenWidth *
              index,
            index,
          })}
          initialNumToRender={
            1
          }
          maxToRenderPerBatch={
            2
          }
          windowSize={3}
          removeClippedSubviews
        />

        {isCarousel ? (
          <>
            {currentMediaIndex >
            0 ? (
              <Pressable
                onPress={() =>
                  scrollTo(
                    currentMediaIndex -
                      1,
                  )
                }
                style={[
                  styles.navigationButton,
                  styles.leftNavigation,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Previous media"
              >
                <ChevronLeft
                  size={22}
                  color="#ffffff"
                />
              </Pressable>
            ) : null}

            {currentMediaIndex <
            mediaItems.length -
              1 ? (
              <Pressable
                onPress={() =>
                  scrollTo(
                    currentMediaIndex +
                      1,
                  )
                }
                style={[
                  styles.navigationButton,
                  styles.rightNavigation,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Next media"
              >
                <ChevronRight
                  size={22}
                  color="#ffffff"
                />
              </Pressable>
            ) : null}
          </>
        ) : null}

        {showHeartOverlay ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.heartOverlay,
              {
                opacity:
                  heartOpacity,
                transform: [
                  {
                    scale:
                      heartScale,
                  },
                ],
              },
            ]}
          >
            <Heart
              size={96}
              color="#ffffff"
              fill="#ffffff"
              strokeWidth={1.5}
            />
          </Animated.View>
        ) : null}
      </View>

      {isCarousel ? (
        <View
          style={
            styles.dotsContainer
          }
        >
          {mediaItems.map(
            (
              _item,
              index,
            ) => (
              <View
                key={
                  index
                }
                style={[
                  styles.dot,
                  index ===
                    currentMediaIndex
                    ? styles.activeDot
                    : styles.inactiveDot,
                ]}
              />
            ),
          )}
        </View>
      ) : null}
    </View>
  );
};

const styles =
  StyleSheet.create({
    container: {
      width: "100%",
      flexDirection:
        "column",
    },

    carouselContainer: {
      width: "100%",
      position:
        "relative",
      overflow:
        "hidden",
      backgroundColor:
        "#000000",
    },

    mediaSlide: {
      position:
        "relative",
      alignItems:
        "center",
      justifyContent:
        "center",
      overflow:
        "hidden",
      backgroundColor:
        "#000000",
    },

    blurredBackground: {
      position:
        "absolute",
      left: 0,
      top: 0,
      opacity: 0.40,
      transform: [
        {
          scale: 1.25,
        },
      ],
    },

    darkOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor:
        "rgba(0,0,0,0.10)",
    },

    mediaTouchable: {
      position:
        "absolute",
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,

      alignItems:
        "center",
      justifyContent:
        "center",

      zIndex: 10,
    },

    foregroundImage: {
      width: "100%",
      height: "100%",
    },

    videoContainer: {
      width: "100%",
      height: "100%",
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#000000",
    },

    video: {
      width: "100%",
      height: "100%",
      backgroundColor:
        "#000000",
    },

    muteButton: {
      position:
        "absolute",
      right: 12,
      bottom: 12,

      width: 42,
      height: 42,

      alignItems:
        "center",
      justifyContent:
        "center",

      borderRadius: 21,

      backgroundColor:
        "rgba(0,0,0,0.60)",

      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.10)",

      zIndex: 20,

      shadowColor:
        "#000000",
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.30,
      shadowRadius: 8,
      elevation: 6,
    },

    muteButtonPressed: {
      backgroundColor:
        "rgba(0,0,0,0.80)",
      transform: [
        {
          scale: 0.92,
        },
      ],
    },

    navigationButton: {
      position:
        "absolute",

      top: "50%",

      width: 38,
      height: 38,

      marginTop:
        -19,

      alignItems:
        "center",
      justifyContent:
        "center",

      borderRadius: 19,

      backgroundColor:
        "rgba(0,0,0,0.50)",

      zIndex: 30,
    },

    leftNavigation: {
      left: 8,
    },

    rightNavigation: {
      right: 8,
    },

    heartOverlay: {
      position:
        "absolute",
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,

      alignItems:
        "center",
      justifyContent:
        "center",

      zIndex: 40,
    },

    dotsContainer: {
      width: "100%",
      minHeight: 22,

      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "center",

      gap: 6,

      paddingTop: 6,
      paddingBottom: 4,

      backgroundColor:
        "#ffffff",
    },

    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },

    activeDot: {
      backgroundColor:
        "#a855f7",
    },

    inactiveDot: {
      backgroundColor:
        "rgba(100,116,139,0.30)",
    },
  });