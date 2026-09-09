import React, {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  Music,
  Pause,
  Play,
  Search,
  X,
} from "lucide-react-native";
import {
  Audio,
  type AVPlaybackStatus,
  type AVPlaybackSource,
} from "expo-av";

interface MusicTrack {
  trackId: number;
  trackName: string;
  artistName: string;
  artworkUrl100?: string;
  previewUrl?: string;
}

interface MusicPickerProps {
  onSelect: (track: {
    title: string;
    artist: string;
    coverUrl?: string;
    previewUrl?: string;
  }) => void;
  onClose: () => void;
}

const MusicPicker = ({
  onSelect,
  onClose,
}: MusicPickerProps) => {
  const [query, setQuery] =
    useState("");

  const [results, setResults] =
    useState<MusicTrack[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [playingPreview, setPlayingPreview] =
    useState<string | null>(null);

  const soundRef =
    useRef<Audio.Sound | null>(
      null,
    );

  const searchTimeoutRef =
    useRef<
      ReturnType<typeof setTimeout> | null
    >(null);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(
          searchTimeoutRef.current,
        );
      }

      void stopCurrentPreview();
    };
  }, []);

  const stopCurrentPreview =
    async () => {
      const sound =
        soundRef.current;

      if (!sound) {
        return;
      }

      try {
        await sound.stopAsync();
        await sound.unloadAsync();
      } catch {
        // Sound may already be unloaded.
      }

      soundRef.current = null;
      setPlayingPreview(null);
    };

  const searchMusic = (
    text: string,
  ) => {
    setQuery(text);

    if (
      searchTimeoutRef.current
    ) {
      clearTimeout(
        searchTimeoutRef.current,
      );
    }

    if (
      text.trim().length < 2
    ) {
      setResults([]);
      setLoading(false);
      return;
    }

    searchTimeoutRef.current =
      setTimeout(() => {
        void performSearch(
          text,
        );
      }, 300);
  };

  const performSearch =
    async (
      text: string,
    ) => {
      setLoading(true);

      try {
        const url =
          `https://itunes.apple.com/search?term=${encodeURIComponent(
            text.trim(),
          )}&media=music&limit=15`;

        const response =
          await fetch(url);

        if (!response.ok) {
          throw new Error(
            `Music search failed: ${response.status}`,
          );
        }

        const data =
          (await response.json()) as {
            results?: MusicTrack[];
          };

        setResults(
          data.results || [],
        );
      } catch (error) {
        console.error(
          "Failed to fetch music:",
          error,
        );

        setResults([]);
      } finally {
        setLoading(false);
      }
    };

  const togglePlay =
    async (
      previewUrl?: string,
    ) => {
      if (!previewUrl) {
        return;
      }

      if (
        playingPreview ===
        previewUrl
      ) {
        await stopCurrentPreview();
        return;
      }

      await stopCurrentPreview();

      try {
        const source:
          AVPlaybackSource = {
          uri: previewUrl,
        };

        const {
          sound,
        } =
          await Audio.Sound.createAsync(
            source,
            {
              shouldPlay: true,
              volume: 1,
              isMuted: false,
            },
          );

        soundRef.current =
          sound;

        setPlayingPreview(
          previewUrl,
        );

        sound.setOnPlaybackStatusUpdate(
          (
            status: AVPlaybackStatus,
          ) => {
            if (
              !status.isLoaded
            ) {
              return;
            }

            if (
              status.didJustFinish
            ) {
              void stopCurrentPreview();
            }
          },
        );
      } catch (error) {
        console.error(
          "Failed to play preview:",
          error,
        );

        setPlayingPreview(
          null,
        );
      }
    };

  const handleSelect = (
    track: MusicTrack,
  ) => {
    void stopCurrentPreview();

    onSelect({
      title:
        track.trackName,
      artist:
        track.artistName,
      coverUrl:
        track.artworkUrl100,
      previewUrl:
        track.previewUrl,
    });
  };

  const renderTrack = ({
    item,
  }: {
    item: MusicTrack;
  }) => {
    const isPlaying =
      playingPreview ===
      item.previewUrl;

    return (
      <View
        style={[
          styles.track,
          isPlaying &&
            styles.trackPlaying,
        ]}
      >
        <Pressable
          onPress={() =>
            void togglePlay(
              item.previewUrl,
            )
          }
          style={
            styles.coverButton
          }
          disabled={
            !item.previewUrl
          }
          accessibilityRole="button"
          accessibilityLabel={
            isPlaying
              ? `Pause ${item.trackName}`
              : `Play preview of ${item.trackName}`
          }
        >
          {item.artworkUrl100 ? (
            <Image
              source={{
                uri:
                  item.artworkUrl100,
              }}
              style={
                styles.cover
              }
            />
          ) : (
            <View
              style={
                styles.coverPlaceholder
              }
            >
              <Music
                size={18}
                color="#94a3b8"
              />
            </View>
          )}

          <View
            style={
              styles.coverOverlay
            }
          >
            {isPlaying ? (
              <Pause
                size={20}
                color="#ffffff"
              />
            ) : (
              <Play
                size={20}
                color="#ffffff"
              />
            )}
          </View>
        </Pressable>

        <View
          style={
            styles.trackInfo
          }
        >
          <Text
            style={
              styles.trackTitle
            }
            numberOfLines={1}
          >
            {item.trackName}
          </Text>

          <Text
            style={
              styles.artist
            }
            numberOfLines={1}
          >
            {item.artistName}
          </Text>
        </View>

        <Pressable
          onPress={() =>
            handleSelect(
              item,
            )
          }
          style={({ pressed }) => [
            styles.addButton,
            pressed &&
              styles.addButtonPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Add ${item.trackName}`}
        >
          <Text
            style={
              styles.addText
            }
          >
            Add
          </Text>
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
        style={
          styles.header
        }
      >
        <View
          style={
            styles.headerTitle
          }
        >
          <Music
            size={16}
            color="#7dd3fc"
          />

          <Text
            style={
              styles.headerText
            }
          >
            Choose Music
          </Text>
        </View>

        <Pressable
          onPress={
            onClose
          }
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Close music picker"
          style={
            styles.closeButton
          }
        >
          <X
            size={20}
            color="#a3a3a3"
          />
        </Pressable>
      </View>

      <View
        style={
          styles.searchSection
        }
      >
        <Search
          size={16}
          color="#a3a3a3"
          style={
            styles.searchIcon
          }
        />

        <TextInput
          autoFocus
          value={query}
          onChangeText={
            searchMusic
          }
          placeholder="Search global music..."
          placeholderTextColor="#737373"
          style={
            styles.searchInput
          }
          returnKeyType="search"
        />
      </View>

      <View
        style={
          styles.resultsContainer
        }
      >
        {loading ? (
          <View
            style={
              styles.centerMessage
            }
          >
            <ActivityIndicator
              size="small"
              color="#a855f7"
            />

            <Text
              style={
                styles.loadingText
              }
            >
              Searching global library...
            </Text>
          </View>
        ) : null}

        {!loading &&
        results.length === 0 &&
        query.trim().length > 1 ? (
          <View
            style={
              styles.centerMessage
            }
          >
            <Text
              style={
                styles.emptyText
              }
            >
              No songs found.
            </Text>
          </View>
        ) : null}

        <FlatList
          data={results}
          keyExtractor={(
            item,
          ) =>
            String(
              item.trackId,
            )}
          renderItem={
            renderTrack
          }
          contentContainerStyle={
            styles.listContent
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={
            false
        }

        />
      </View>
    </View>
  );
};

const styles =
  StyleSheet.create({
    container: {
      width: "100%",
      maxHeight: 400,
      backgroundColor:
        "#171717",
      borderRadius: 12,
      overflow:
        "hidden",
      borderWidth: 1,
      borderColor:
        "#262626",
      shadowColor:
        "#000000",
      shadowOffset: {
        width: 0,
        height: 12,
      },
      shadowOpacity: 0.35,
      shadowRadius: 24,
      elevation: 12,
    },

    header: {
      height: 60,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor:
        "#262626",
    },

    headerTitle: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 8,
    },

    headerText: {
      color: "#ffffff",
      fontSize: 16,
      fontWeight: "600",
    },

    closeButton: {
      padding: 4,
    },

    searchSection: {
      height: 60,
      flexDirection:
        "row",
      alignItems:
        "center",
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor:
        "#262626",
    },

    searchIcon: {
      marginRight: 8,
    },

    searchInput: {
      flex: 1,
      minHeight: 42,
      color: "#ffffff",
      fontSize: 14,
      backgroundColor:
        "#262626",
      borderRadius: 8,
      paddingHorizontal: 12,
    },

    resultsContainer: {
      flex: 1,
      minHeight: 250,
    },

    listContent: {
      padding: 8,
    },

    centerMessage: {
      paddingTop: 16,
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: 8,
    },

    loadingText: {
      color: "#a3a3a3",
      fontSize: 14,
    },

    emptyText: {
      color: "#737373",
      fontSize: 14,
    },

    track: {
      minHeight: 68,
      flexDirection:
        "row",
      alignItems:
        "center",
      padding: 8,
      borderRadius: 10,
    },

    trackPlaying: {
      backgroundColor:
        "#262626",
    },

    coverButton: {
      width: 48,
      height: 48,
      borderRadius: 6,
      overflow:
        "hidden",
      position:
        "relative",
    },

    cover: {
      width: 48,
      height: 48,
      opacity: 0.82,
    },

    coverPlaceholder: {
      width: 48,
      height: 48,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#262626",
    },

    coverOverlay: {
      ...StyleSheet.absoluteFillObject,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "rgba(0,0,0,0.20)",
    },

    trackInfo: {
      flex: 1,
      minWidth: 0,
      marginLeft: 12,
      marginRight: 8,
    },

    trackTitle: {
      color: "#ffffff",
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "500",
    },

    artist: {
      color: "#a3a3a3",
      fontSize: 12,
      lineHeight: 18,
      marginTop: 2,
    },

    addButton: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 999,
      backgroundColor:
        "#262626",
      borderWidth: 1,
      borderColor:
        "#404040",
    },

    addButtonPressed: {
      backgroundColor:
        "#404040",
    },

    addText: {
      color: "#ffffff",
      fontSize: 12,
      fontWeight: "600",
    },
  });

export default MusicPicker;