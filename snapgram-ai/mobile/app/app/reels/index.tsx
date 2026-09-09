import React, {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  router,
} from "expo-router";
import {
  Video,
  ResizeMode,
  AVPlaybackStatus,
} from "expo-av";
import {
  Heart,
  MessageCircle,
  Music2,
  Plus,
  Repeat,
  Share2,
  Volume2,
  VolumeX,
} from "lucide-react-native";
import { Avatar } from "../../../src/components/ui/Avatar";
import {
  useSelector,
} from "react-redux";

import api from "../../../src/services/api";
import {
  useToast,
} from "../../../src/components/ui/Toast";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } =
  Dimensions.get("window");

const REEL_HEIGHT = SCREEN_HEIGHT;

type User = {
  _id: string;
  username?: string;
  fullName?: string;
  profilePicture?: string;
  avatar?: string;
};

type ReelVideo = {
  url?: string;
  thumbnailUrl?: string;
};

type ReelMusic = {
  title?: string;
  artist?: string;
};

type Reel = {
  _id: string;
  caption?: string;
  video?: ReelVideo;
  user?: User;
  likes?: Array<string | { _id: string }>;
  commentsCount?: number;
  sharesCount?: number;
  music?: ReelMusic;
};

type RootState = {
  auth: {
    user?: User | null;
  };
};

type ReelItemProps = {
  reel: Reel;
  isActive: boolean;
  isMuted: boolean;
  onMuteToggle: () => void;
};

const ReelItem = memo(
  ({
    reel,
    isActive,
    isMuted,
    onMuteToggle,
  }: ReelItemProps) => {
    const { user: authUser } =
      useSelector(
        (state: RootState) => state.auth,
      );

    const { toast } =
      useToast();

    const videoRef =
      useRef<Video | null>(null);

    const [
      liked,
      setLiked,
    ] = useState(() => {
      const authId =
        authUser?._id;

      if (!authId) {
        return false;
      }

      return (
        reel.likes?.some(
          (like) =>
            typeof like ===
              "string"
              ? like === authId
              : like?._id === authId,
        ) ?? false
      );
    });

    const [
      likesCount,
      setLikesCount,
    ] = useState(
      reel.likes?.length ?? 0,
    );

    const [
      isFollowing,
      setIsFollowing,
    ] = useState(false);

    const [
      showHeart,
      setShowHeart,
    ] = useState(false);

    const [
      heartPosition,
      setHeartPosition,
    ] = useState({
      x: 50,
      y: 50,
    });

    const tapCountRef =
      useRef(0);

    const tapTimerRef =
      useRef<
        ReturnType<typeof setTimeout> | null
      >(null);

    useEffect(() => {
      const video =
        videoRef.current;

      if (!video) {
        return;
      }

      const syncPlayback =
        async () => {
          try {
            if (isActive) {
              await video.playAsync();
            } else {
              await video.pauseAsync();
              await video.setPositionAsync(
                0,
              );
            }
          } catch {
            // Autoplay can be denied by platform/device.
          }
        };

      void syncPlayback();
    }, [isActive]);

    useEffect(() => {
      const video =
        videoRef.current;

      if (!video) {
        return;
      }

      void video.setIsMutedAsync(
        isMuted,
      );
    }, [isMuted]);

    useEffect(() => {
      return () => {
        if (tapTimerRef.current) {
          clearTimeout(
            tapTimerRef.current,
          );
        }
      };
    }, []);

    const formatCount =
      useCallback((count = 0) => {
        if (
          count >= 1_000_000
        ) {
          return `${(
            count / 1_000_000
          ).toFixed(1)}M`;
        }

        if (
          count >= 1_000
        ) {
          return `${(
            count / 1_000
          ).toFixed(1)}K`;
        }

        return String(count);
      }, []);

    const triggerLike =
      useCallback(async () => {
        setLiked(true);
        setLikesCount(
          (value) => value + 1,
        );

        try {
          await api.put(
            `/api/reels/${reel._id}/like`,
          );
        } catch {
          setLiked(false);
          setLikesCount(
            (value) =>
              Math.max(
                0,
                value - 1,
              ),
          );
        }
      }, [reel._id]);

    const handleLike =
      useCallback(async () => {
        const nextLiked =
          !liked;

        setLiked(nextLiked);

        setLikesCount(
          (value) =>
            Math.max(
              0,
              nextLiked
                ? value + 1
                : value - 1,
            ),
        );

        try {
          await api.put(
            `/api/reels/${reel._id}/like`,
          );
        } catch {
          setLiked(
            !nextLiked,
          );

          setLikesCount(
            (value) =>
              Math.max(
                0,
                nextLiked
                  ? value - 1
                  : value + 1,
              ),
          );
        }
      }, [
        liked,
        reel._id,
      ]);

    const handleTap =
      useCallback(
        (event: any) => {
          tapCountRef.current +=
            1;

          if (
            tapCountRef.current ===
            1
          ) {
            tapTimerRef.current =
              setTimeout(() => {
                tapCountRef.current =
                  0;
              }, 300);

            return;
          }

          if (
            tapCountRef.current ===
            2
          ) {
            if (
              tapTimerRef.current
            ) {
              clearTimeout(
                tapTimerRef.current,
              );
            }

            tapCountRef.current =
              0;

            const {
              locationX,
              locationY,
            } =
              event.nativeEvent;

            setHeartPosition({
              x:
                (locationX /
                  SCREEN_WIDTH) *
                100,
              y:
                (locationY /
                  REEL_HEIGHT) *
                100,
            });

            if (!liked) {
              void triggerLike();
            }

            setShowHeart(true);

            setTimeout(() => {
              setShowHeart(false);
            }, 800);
          }
        },
        [
          liked,
          triggerLike,
        ],
      );

    const handleShare =
      useCallback(async () => {
        try {
          await api.put(
            `/api/reels/${reel._id}/share`,
          );

          const url =
            `snapgram://app/reels/${reel._id}`;

          await Share.share({
            title:
              reel.caption ||
              "SnapGram Reel",
            message: url,
            url,
          });
        } catch {
          toast({
            variant:
              "error",
            title:
              "Share failed",
            description:
              "Unable to share this reel.",
          });
        }
      }, [
        reel._id,
        reel.caption,
        toast,
      ]);

    const handleView =
      useCallback(async () => {
        try {
          await api.put(
            `/api/reels/${reel._id}/view`,
          );
        } catch {
          // View analytics should not break playback.
        }
      }, [reel._id]);

    useEffect(() => {
      if (isActive) {
        void handleView();
      }
    }, [
      isActive,
      handleView,
    ]);

    const avatar =
      reel.user
        ?.profilePicture ||
      reel.user?.avatar ||
      "https://i.pravatar.cc/150";

    const videoUrl =
      reel.video?.url;

    return (
      <View
        style={styles.reelContainer}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={handleTap}
        >
          {videoUrl ? (
            <Video
              ref={videoRef}
              source={{
                uri: videoUrl,
              }}
              style={
                styles.video
              }
              resizeMode={
                ResizeMode.COVER
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
              posterSource={
                reel.video
                  ?.thumbnailUrl
                    ? {
                        uri:
                          reel.video
                            .thumbnailUrl,
                      }
                    : undefined
              }
              usePoster={
                Boolean(
                  reel.video
                    ?.thumbnailUrl,
                )
              }
            />
          ) : (
            <View
              style={
                styles.missingVideo
              }
            >
              <Text
                style={
                  styles.missingVideoText
                }
              >
                Video unavailable
              </Text>
            </View>
          )}
        </Pressable>

        <View
          pointerEvents="none"
          style={
            styles.topGradient
          }
        />

        <View
          pointerEvents="none"
          style={
            styles.bottomGradient
          }
        />

        {showHeart && (
          <View
            pointerEvents="none"
            style={[
              styles.doubleTapHeart,
              {
                left:
                  SCREEN_WIDTH *
                  (heartPosition.x /
                    100),
                top:
                  REEL_HEIGHT *
                  (heartPosition.y /
                    100),
              },
            ]}
          >
            <Heart
              size={96}
              color="#ffffff"
              fill="#ffffff"
            />
          </View>
        )}

        <View
          style={
            styles.actions
          }
        >
          <View
            style={
              styles.profileAction
            }
          >
            <Pressable
              onPress={() => {
                if (
                  reel.user?._id
                ) {
                  router.push(
                    `/app/profile/${reel.user._id}`,
                  );
                }
              }}
            >
              <View style={styles.avatarRing}>
  <Avatar
    src={
      reel.user?.profilePicture ||
      reel.user?.avatar
    }
    fallback={
      reel.user?.username?.charAt(0) ||
      "U"
    }
    style={styles.nativeAvatar}
  />
</View>
            </Pressable>

            {!isFollowing && (
              <Pressable
                onPress={() =>
                  setIsFollowing(
                    true,
                  )
                }
                style={
                  styles.followButton
                }
              >
                <Plus
                  size={14}
                  color="#ffffff"
                  strokeWidth={3}
                />
              </Pressable>
            )}
          </View>

          <Pressable
            onPress={() =>
              void handleLike()
            }
            style={
              styles.actionButton
            }
          >
            <Heart
              size={31}
              color={
                liked
                  ? "#ef4444"
                  : "#ffffff"
              }
              fill={
                liked
                  ? "#ef4444"
                  : "transparent"
              }
            />
            <Text
              style={
                styles.actionCount
              }
            >
              {formatCount(
                likesCount,
              )}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {}}
            style={
              styles.actionButton
            }
          >
            <MessageCircle
              size={31}
              color="#ffffff"
              fill="rgba(255,255,255,0.08)"
            />
            <Text
              style={
                styles.actionCount
              }
            >
              {formatCount(
                reel.commentsCount ||
                  0,
              )}
            </Text>
          </Pressable>

          <Pressable
            onPress={() =>
              void handleShare()
            }
            style={
              styles.actionButton
            }
          >
            <Share2
              size={30}
              color="#ffffff"
            />
            <Text
              style={
                styles.actionCount
              }
            >
              {formatCount(
                reel.sharesCount ||
                  0,
              )}
            </Text>
          </Pressable>

          <Pressable
            onPress={() =>
              router.push(
                `/app/reels/create?remix=${reel._id}`,
              )
            }
            style={
              styles.actionButton
            }
          >
            <Repeat
              size={29}
              color="#ffffff"
            />
            <Text
              style={
                styles.remixText
              }
            >
              Remix
            </Text>
          </Pressable>

          <Pressable
            onPress={onMuteToggle}
            style={
              styles.actionButton
            }
          >
            {isMuted ? (
              <VolumeX
                size={28}
                color="#ffffff"
              />
            ) : (
              <Volume2
                size={28}
                color="#ffffff"
              />
            )}
          </Pressable>
        </View>

        <View
          style={
            styles.bottomInfo
          }
        >
          <Pressable
            onPress={() => {
              if (
                reel.user?._id
              ) {
                router.push(
                  `/app/profile/${reel.user._id}`,
                );
              }
            }}
          >
            <Text
              style={
                styles.username
              }
            >
              @{reel.user?.username ||
                "user"}
            </Text>
          </Pressable>

          {reel.caption ? (
            <Text
              style={
                styles.caption
              }
              numberOfLines={3}
            >
              {reel.caption}
            </Text>
          ) : null}

          {reel.music?.title ? (
            <View
              style={
                styles.musicTicker
              }
            >
              <Music2
                size={14}
                color="#ffffff"
              />

              <Text
                style={
                  styles.musicText
                }
                numberOfLines={1}
              >
                {reel.music.title}
                {reel.music.artist
                  ? ` · ${reel.music.artist}`
                  : ""}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    );
  },
);

ReelItem.displayName =
  "ReelItem";

export default function ReelsScreen() {
  const [
    reels,
    setReels,
  ] = useState<Reel[]>([]);

  const [
    page,
    setPage,
  ] = useState(1);

  const [
    hasMore,
    setHasMore,
  ] = useState(true);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    loadingMore,
    setLoadingMore,
  ] = useState(false);

  const [
    activeIndex,
    setActiveIndex,
  ] = useState(0);

  const [
    isMuted,
    setIsMuted,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const fetchReels =
    useCallback(
      async (
        pageNumber: number,
      ) => {
        if (
          pageNumber === 1
        ) {
          setLoading(true);
        } else {
          setLoadingMore(
            true,
          );
        }

        try {
          const response =
            await api.get(
              `/api/reels?page=${pageNumber}&limit=8`,
            );

          if (
            response.data
              ?.success
          ) {
            const nextReels =
              response.data.data ||
              [];

            setReels(
              (previous) =>
                pageNumber === 1
                  ? nextReels
                  : [
                      ...previous,
                      ...nextReels,
                    ],
            );

            setHasMore(
              Boolean(
                response.data
                  .pagination
                  ?.hasMore,
              ),
            );
          }
        } catch (error) {
          console.error(
            "Failed to load reels:",
            error,
          );
        } finally {
          setLoading(false);
          setLoadingMore(
            false,
          );
        }
      },
      [],
    );

  useEffect(() => {
    void fetchReels(1);
  }, [fetchReels]);

  const handleRefresh =
    async () => {
      setRefreshing(true);
      setPage(1);
      await fetchReels(1);
      setActiveIndex(0);
      setRefreshing(false);
    };

  const handleViewableItemsChanged =
    useRef(
      ({
        viewableItems,
      }: {
        viewableItems: Array<{
          item: Reel;
          index: number | null;
          isViewable: boolean;
        }>;
      }) => {
        const firstVisible =
          viewableItems.find(
            (item) =>
              item.isViewable,
          );

        if (
          firstVisible &&
          firstVisible.index !==
            null
        ) {
          const index =
            firstVisible.index;

          setActiveIndex(
            index,
          );

          if (
            index >=
              reels.length - 2 &&
            hasMore &&
            !loadingMore
          ) {
            const nextPage =
              page + 1;

            setPage(
              nextPage,
            );

            void fetchReels(
              nextPage,
            );
          }
        }
      },
    ).current;

  const viewabilityConfig =
    useRef({
      itemVisiblePercentThreshold: 70,
    }).current;

  if (loading && !refreshing) {
    return (
      <View
        style={
          styles.fullScreenBlack
        }
      >
        <ActivityIndicator
          size="large"
          color="#ffffff"
        />
      </View>
    );
  }

  if (!reels.length) {
    return (
      <View
        style={
          styles.emptyContainer
        }
      >
        <Text
          style={
            styles.emptyTitle
          }
        >
          No reels yet
        </Text>

        <Text
          style={
            styles.emptyDescription
          }
        >
          Be the first to upload a reel.
        </Text>

        <Pressable
          onPress={() =>
            router.push(
              "/app/reels/create",
            )
          }
          style={
            styles.createButton
          }
        >
          <Plus
            size={18}
            color="#ffffff"
          />

          <Text
            style={
              styles.createButtonText
            }
          >
            Upload Reel
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View
      style={
        styles.screen
      }
    >
      <FlatList
        data={reels}
        keyExtractor={(item) =>
          item._id
        }
        renderItem={({
          item,
          index,
        }) => (
          <ReelItem
            reel={item}
            isActive={
              index ===
              activeIndex
            }
            isMuted={
              isMuted
            }
            onMuteToggle={() =>
              setIsMuted(
                (value) =>
                  !value,
              )
            }
          />
        )}
        pagingEnabled
        snapToInterval={
          REEL_HEIGHT
        }
        decelerationRate="fast"
        showsVerticalScrollIndicator={
          false
        }
        disableIntervalMomentum
        removeClippedSubviews
        initialNumToRender={2}
        windowSize={3}
        maxToRenderPerBatch={2}
        refreshing={refreshing}
        onRefresh={
          handleRefresh
        }
        onViewableItemsChanged={
          handleViewableItemsChanged
        }
        viewabilityConfig={
          viewabilityConfig
        }
        getItemLayout={(
          _data,
          index,
        ) => ({
          length:
            REEL_HEIGHT,
          offset:
            REEL_HEIGHT *
            index,
          index,
        })}
        ListFooterComponent={
          loadingMore ? (
            <View
              style={
                styles.loadingMore
              }
            >
              <ActivityIndicator
                color="#ffffff"
              />
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles =
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor:
        "#000000",
    },

    fullScreenBlack: {
      flex: 1,
      backgroundColor:
        "#000000",
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    reelContainer: {
      width:
        SCREEN_WIDTH,
      height:
        REEL_HEIGHT,
      backgroundColor:
        "#000000",
      position:
        "relative",
      overflow:
        "hidden",
    },

    video: {
      width: "100%",
      height: "100%",
      backgroundColor:
        "#000000",
    },

    missingVideo: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#111111",
    },

    missingVideoText: {
      color:
        "#ffffff",
      fontSize: 16,
      fontWeight:
        "700",
    },

    topGradient: {
      position:
        "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 180,
      backgroundColor:
        "rgba(0,0,0,0.20)",
    },

    bottomGradient: {
      position:
        "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: 320,
      backgroundColor:
        "rgba(0,0,0,0.48)",
    },

    doubleTapHeart: {
      position:
        "absolute",
      marginLeft: -48,
      marginTop: -48,
      zIndex: 20,
    },

    actions: {
      position:
        "absolute",
      right: 12,
      bottom: 110,
      alignItems:
        "center",
      gap: 20,
      zIndex: 30,
    },

    profileAction: {
      alignItems:
        "center",
      marginBottom: 6,
    },

    avatarRing: {
      width: 52,
      height: 52,
      borderRadius: 26,
      borderWidth: 2,
      borderColor:
        "#ffffff",
      alignItems:
        "center",
      justifyContent:
        "center",
    },
    nativeAvatar: {
  width: 44,
  height: 44,
  borderRadius: 22,
},

    

    followButton: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#a855f7",
      borderWidth: 2,
      borderColor:
        "#000000",
      marginTop: -8,
    },

    actionButton: {
      alignItems:
        "center",
      justifyContent:
        "center",
      minWidth: 42,
    },

    actionCount: {
      marginTop: 5,
      color:
        "#ffffff",
      fontSize: 12,
      fontWeight:
        "700",
      textShadowColor:
        "rgba(0,0,0,0.5)",
      textShadowOffset: {
        width: 0,
        height: 1,
      },
      textShadowRadius: 2,
    },

    remixText: {
      marginTop: 5,
      color:
        "#ffffff",
      fontSize: 10,
      fontWeight:
        "700",
    },

    bottomInfo: {
      position:
        "absolute",
      left: 14,
      right: 76,
      bottom: 26,
      zIndex: 30,
    },

    username: {
      color:
        "#ffffff",
      fontSize: 16,
      fontWeight:
        "800",
      marginBottom: 6,
    },

    caption: {
      color:
        "rgba(255,255,255,0.94)",
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 8,
    },

    musicTicker: {
      alignSelf:
        "flex-start",
      maxWidth: 240,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 7,
      paddingHorizontal:
        10,
      paddingVertical:
        6,
      backgroundColor:
        "rgba(0,0,0,0.38)",
      borderRadius: 999,
    },

    musicText: {
      color:
        "#ffffff",
      fontSize: 12,
      fontWeight:
        "600",
      flexShrink: 1,
    },

    loadingMore: {
      height:
        REEL_HEIGHT,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#000000",
    },

    emptyContainer: {
      flex: 1,
      backgroundColor:
        "#000000",
      alignItems:
        "center",
      justifyContent:
        "center",
      padding: 24,
    },

    emptyTitle: {
      color:
        "#ffffff",
      fontSize: 24,
      fontWeight:
        "800",
    },

    emptyDescription: {
      color:
        "rgba(255,255,255,0.65)",
      fontSize: 14,
      marginTop: 8,
      marginBottom: 24,
      textAlign:
        "center",
    },

    createButton: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 7,
      paddingHorizontal:
        22,
      paddingVertical:
        13,
      borderRadius: 999,
      backgroundColor:
        "#a855f7",
    },

    createButtonText: {
      color:
        "#ffffff",
      fontSize: 14,
      fontWeight:
        "800",
    },
  });