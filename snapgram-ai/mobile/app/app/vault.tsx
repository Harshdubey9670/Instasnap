// FILE: mobile/app/app/vault.tsx

import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CloudCheck,
  Download,
  Eye,
  EyeOff,
  Fingerprint,
  FolderPlus,
  Heart,
  Key,
  Lock,
  Plus,
  RotateCcw,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  Trash2,
  Unlock,
} from "lucide-react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

import {
  verifyVaultPin,
  setVaultPin,
  getMemories,
  addMemory,
  toggleFavoriteMemory,
  softDeleteMemory,
  getTrashBin,
  restoreMemory,
  getVaultAlbums,
  createVaultAlbum,
  generateShareLink,
} from "../../src/services/vaultService";
import { useToast } from "../../src/components/ui/Toast";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Memory = {
  _id: string;
  title?: string;
  mediaUrl?: string;
  mediaType?: "image" | "video" | string;
  isPrivate?: boolean;
  isFavorite?: boolean;
  memoryDate?: string;
};

type Album = {
  _id: string;
  name: string;
  isHidden?: boolean;
};

export default function VaultScreen() {
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();

  const [isUnlocked, setIsUnlocked] =
    useState(false);
  const [pinInput, setPinInput] =
    useState("");
  const [pinError, setPinError] =
    useState("");

  const [failedAttempts, setFailedAttempts] =
    useState(0);
  const [isLockedOut, setIsLockedOut] =
    useState(false);
  const [lockoutTimer, setLockoutTimer] =
    useState(0);

  const [activeTab, setActiveTab] =
    useState(
      "timeline",
    );
  const [searchQuery, setSearchQuery] =
    useState("");
  const [dateFilter, setDateFilter] =
    useState("all");
  const [loading, setLoading] =
    useState(true);

  const [memories, setMemories] =
    useState<Memory[]>([]);
  const [albums, setAlbums] =
    useState<Album[]>([]);
  const [trashBin, setTrashBin] =
    useState<Memory[]>([]);

  const [showAddModal, setShowAddModal] =
    useState(false);
  const [newTitle, setNewTitle] =
    useState("");
  const [newMediaUrl, setNewMediaUrl] =
    useState("");
  const [isPrivate, setIsPrivate] =
    useState(true);

  const [showAlbumModal, setShowAlbumModal] =
    useState(false);
  const [newAlbumName, setNewAlbumName] =
    useState("");
  const [isHiddenAlbum, setIsHiddenAlbum] =
    useState(false);

  const [showShareModal, setShowShareModal] =
    useState(false);
  const [generatedLink, setGeneratedLink] =
    useState("");
  const [newPin, setNewPin] =
    useState("");

  const inactivityTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(
      null,
    );

  useEffect(() => {
    if (!isUnlocked) {
      return;
    }

    const resetTimer = () => {
      if (inactivityTimerRef.current) {
        clearTimeout(
          inactivityTimerRef.current,
        );
      }

      inactivityTimerRef.current =
        setTimeout(() => {
          setIsUnlocked(false);
          showToast(
            "info",
            "Vault auto-locked due to inactivity",
            "",
          );
        }, 60000);
    };

    resetTimer();

    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(
          inactivityTimerRef.current,
        );
      }
    };
  }, [isUnlocked, showToast]);

  useEffect(() => {
    if (
      (activeTab === "private" ||
        activeTab === "security") &&
      !isUnlocked
    ) {
      return;
    }

    void fetchVaultData();
  }, [
    isUnlocked,
    activeTab,
    searchQuery,
    dateFilter,
  ]);

  const fetchVaultData = async () => {
    setLoading(true);

    try {
      if (
        activeTab ===
        "timeline"
      ) {
        const res =
          await getMemories({
            search: searchQuery,
            isPrivate: false,
          });

        let data: Memory[] =
          res.data || [];

        if (
          dateFilter ===
          "flashback"
        ) {
          const today =
            new Date();

          data = data.filter(
            (memory) => {
              if (
                !memory.memoryDate
              ) {
                return false;
              }

              const date =
                new Date(
                  memory.memoryDate,
                );

              return (
                date.getDate() ===
                  today.getDate() &&
                date.getMonth() ===
                  today.getMonth()
              );
            },
          );
        }

        setMemories(data);
      } else if (
        activeTab ===
        "private"
      ) {
        const res =
          await getMemories({
            search: searchQuery,
            isPrivate: true,
          });

        setMemories(
          res.data || [],
        );
      } else if (
        activeTab ===
        "albums"
      ) {
        const res =
          await getVaultAlbums();

        setAlbums(
          res.data || [],
        );
      } else if (
        activeTab ===
        "favorites"
      ) {
        const res =
          await getMemories({
            favorite: "true",
          });

        setMemories(
          res.data || [],
        );
      } else if (
        activeTab ===
        "trash"
      ) {
        const res =
          await getTrashBin();

        setTrashBin(
          res.data || [],
        );
      }
    } catch (error) {
      console.error(
        "Failed to load vault data",
        error,
      );
    } finally {
      setLoading(false);
    }
  };

  const triggerFailedAttempt = () => {
    const next =
      failedAttempts + 1;

    setFailedAttempts(next);

    if (next >= 5) {
      setIsLockedOut(true);
      setLockoutTimer(30);
      setPinError(
        "Too many failed attempts! Vault locked for 30s.",
      );

      const interval =
        setInterval(() => {
          setLockoutTimer(
            (value) => {
              if (value <= 1) {
                clearInterval(
                  interval,
                );
                setIsLockedOut(
                  false,
                );
                setFailedAttempts(
                  0,
                );
                setPinError(
                  "",
                );
                return 0;
              }

              return value - 1;
            },
          );
        }, 1000);
    } else {
      setPinError(
        `Invalid PIN code (${5 - next} attempts remaining)`,
      );
    }

    setPinInput("");
  };

  const handlePinPress = (
    value: string,
  ) => {
    if (
      isLockedOut ||
      pinInput.length >= 4
    ) {
      return;
    }

    const next =
      pinInput + value;

    setPinInput(next);

    if (next.length !== 4) {
      return;
    }

    verifyVaultPin(next)
      .then(() => {
        setIsUnlocked(
          true,
        );
        setPinInput("");
        setPinError("");
        setFailedAttempts(
          0,
        );
      })
      .catch(() => {
        triggerFailedAttempt();
      });
  };

  const handleToggleFavorite =
    async (
      id: string,
    ) => {
      try {
        await toggleFavoriteMemory(id);
        await fetchVaultData();
      } catch {
        showToast(
          "error",
          "Failed",
          "Unable to update favorite.",
        );
      }
    };

  const handleSoftDelete =
    async (
      id: string,
    ) => {
      try {
        await softDeleteMemory(id);
        await fetchVaultData();
        showToast(
          "success",
          "Moved to Trash",
          "",
        );
      } catch {
        showToast(
          "error",
          "Failed",
          "Unable to move memory to trash.",
        );
      }
    };

  const handleRestore =
    async (
      id: string,
    ) => {
      try {
        await restoreMemory(
          id,
        );
        await fetchVaultData();
        showToast(
          "success",
          "Memory Restored",
          "",
        );
      } catch {
        showToast(
          "error",
          "Failed",
          "Unable to restore memory.",
        );
      }
    };

  const handleAddMemory =
    async () => {
      if (!newMediaUrl.trim()) {
        return;
      }

      try {
        await addMemory({
          title: newTitle,
          mediaUrl:
            newMediaUrl.trim(),
          isPrivate,
        });

        setShowAddModal(
          false,
        );
        setNewTitle("");
        setNewMediaUrl("");
        await fetchVaultData();

        showToast(
          "success",
          "Memory Added",
          "",
        );
      } catch {
        showToast(
          "error",
          "Failed",
          "Unable to add memory.",
        );
      }
    };

  const handleCreateAlbum =
    async () => {
      if (!newAlbumName.trim()) {
        return;
      }

      try {
        await createVaultAlbum({
          name:
            newAlbumName.trim(),
          isHidden:
            isHiddenAlbum,
        });

        setShowAlbumModal(
          false,
        );
        setNewAlbumName("");
        await fetchVaultData();

        showToast(
          "success",
          "Album Created",
          "",
        );
      } catch {
        showToast(
          "error",
          "Failed",
          "Unable to create album.",
        );
      }
    };

  const handleGenerateShare =
    async (
      id: string,
    ) => {
      try {
        const res =
          await generateShareLink(
            id,
          );

        setGeneratedLink(
          res.shareUrl,
        );
        setShowShareModal(
          true,
        );
      } catch {
        showToast(
          "error",
          "Failed",
          "Unable to generate share link.",
        );
      }
    };

  const handleUpdatePin =
    async () => {
      if (!/^\d{4}$/.test(newPin)) {
        showToast(
          "error",
          "Invalid PIN",
          "PIN must be exactly 4 digits.",
        );
        return;
      }

      try {
        await setVaultPin(
          newPin,
        );
        setNewPin("");
        showToast(
          "success",
          "Security PIN updated",
          "",
        );
      } catch {
        showToast(
          "error",
          "Failed",
          "Unable to update security PIN.",
        );
      }
    };

  const handleDownloadMemory =
    async (
      url: string,
      title?: string,
    ) => {
      try {
        const fileUri =
          FileSystem.cacheDirectory +
          `${(
            title ||
            "memory"
          ).replace(
            /[^a-zA-Z0-9-_]/g,
            "_",
          )}_${Date.now()}`;

        const download =
          await FileSystem.downloadAsync(
            url,
            fileUri,
          );

        if (
          await Sharing.isAvailableAsync()
        ) {
          await Sharing.shareAsync(
            download.uri,
          );
        }

        showToast(
          "success",
          "Memory Ready",
          "The memory is available to share/save from your device.",
        );
      } catch {
        showToast(
          "error",
          "Download Failed",
          "Unable to save this memory.",
        );
      }
    };

  const renderLockScreen =
    () => (
      <View
        style={
          styles.lockContainer
        }
      >
        <View
          style={
            styles.lockCard
          }
        >
          <View
            style={
              styles.lockIcon
            }
          >
            <Lock
              size={28}
              color="#a855f7"
            />
          </View>

          <Text
            style={
              styles.lockTitle
            }
          >
            Private Memories Locked
          </Text>

          <Text
            style={
              styles.lockDescription
            }
          >
            Enter your 4-digit security
            PIN to unlock this tab
          </Text>

          <View
            style={
              styles.pinDots
            }
          >
            {[0, 1, 2, 3].map(
              (index) => (
                <View
                  key={index}
                  style={[
                    styles.pinDot,
                    pinInput.length >
                      index &&
                      styles.pinDotActive,
                  ]}
                />
              ),
            )}
          </View>

          {!!pinError && (
            <Text
              style={
                styles.pinError
              }
            >
              {pinError}
              {isLockedOut
                ? ` (${lockoutTimer}s)`
                : ""}
            </Text>
          )}

          <View
            style={
              styles.keypad
            }
          >
            {[
              "1",
              "2",
              "3",
              "4",
              "5",
              "6",
              "7",
              "8",
              "9",
            ].map((number) => (
              <Pressable
                key={number}
                disabled={
                  isLockedOut
                }
                onPress={() =>
                  handlePinPress(
                    number,
                  )
                }
                style={[
                  styles.keyButton,
                  isLockedOut &&
                    styles.keyButtonDisabled,
                ]}
              >
                <Text
                  style={
                    styles.keyText
                  }
                >
                  {number}
                </Text>
              </Pressable>
            ))}

            <Pressable
              onPress={() =>
                setIsUnlocked(
                  true,
                )
              }
              style={
                styles.biometricButton
              }
            >
              <Fingerprint
                size={21}
                color="#22c55e"
              />
            </Pressable>

            <Pressable
              disabled={
                isLockedOut
              }
              onPress={() =>
                handlePinPress(
                  "0",
                )
              }
              style={[
                styles.keyButton,
                isLockedOut &&
                  styles.keyButtonDisabled,
              ]}
            >
              <Text
                style={
                  styles.keyText
                }
              >
                0
              </Text>
            </Pressable>

            <Pressable
              onPress={() =>
                setPinInput("")
              }
              style={
                styles.clearKeyButton
              }
            >
              <Text
                style={
                  styles.clearKeyText
                }
              >
                Clear
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    );

  const renderMemory = ({
    item,
  }: {
    item: Memory;
  }) => {
    return (
      <View
        style={
          styles.memoryCard
        }
      >
        <View
          style={
            styles.memoryMediaWrap
          }
        >
          {item.mediaUrl ? (
            <Image
              source={{
                uri: item.mediaUrl,
              }}
              style={
                styles.memoryImage
              }
              resizeMode="cover"
            />
          ) : (
            <View
              style={
                styles.memoryImagePlaceholder
              }
            >
              <ShieldCheck
                size={28}
                color="#94a3b8"
              />
            </View>
          )}

          {item.mediaType ===
            "video" && (
            <View
              style={
                styles.videoBadge
              }
            >
              <Text
                style={
                  styles.videoBadgeText
                }
              >
                VIDEO
              </Text>
            </View>
          )}
        </View>

        <View
          style={
            styles.memoryBody
          }
        >
          <Text
            style={
              styles.memoryTitle
            }
            numberOfLines={2}
          >
            {item.title ||
              "Untitled Memory"}
          </Text>

          {!!item.memoryDate && (
            <View
              style={
                styles.metaRow
              }
            >
              <Calendar
                size={13}
                color="#64748b"
              />

              <Text
                style={
                  styles.metaText
                }
              >
                {new Date(
                  item.memoryDate,
                ).toLocaleDateString()}
              </Text>
            </View>
          )}

          <View
            style={
              styles.memoryActions
            }
          >
            {(activeTab ===
              "timeline" ||
              activeTab ===
                "private" ||
              activeTab ===
                "favorites") && (
              <Pressable
                onPress={() =>
                  void handleToggleFavorite(
                    item._id,
                  )
                }
                style={
                  styles.memoryAction
                }
              >
                <Heart
                  size={17}
                  color={
                    item.isFavorite
                      ? "#ef4444"
                      : "#64748b"
                  }
                  fill={
                    item.isFavorite
                      ? "#ef4444"
                      : "transparent"
                  }
                />
              </Pressable>
            )}

            <Pressable
              onPress={() =>
                void handleGenerateShare(
                  item._id,
                )
              }
              style={
                styles.memoryAction
              }
            >
              <Share2
                size={17}
                color="#64748b"
              />
            </Pressable>

            {activeTab !==
              "trash" && (
              <Pressable
                onPress={() =>
                  void handleSoftDelete(
                    item._id,
                  )
                }
                style={
                  styles.memoryAction
                }
              >
                <Trash2
                  size={17}
                  color="#ef4444"
                />
              </Pressable>
            )}

            <Pressable
              onPress={() =>
                void handleDownloadMemory(
                  item.mediaUrl ||
                    "",
                  item.title,
                )
              }
              style={
                styles.downloadButton
              }
            >
              <Download
                size={15}
                color="#ffffff"
              />

              <Text
                style={
                  styles.downloadText
                }
              >
                Save
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  const renderTrash = ({
    item,
  }: {
    item: Memory;
  }) => {
    return (
      <View
        style={
          styles.memoryCard
        }
      >
        <View
          style={
            styles.memoryMediaWrap
          }
        >
          {item.mediaUrl ? (
            <Image
              source={{
                uri: item.mediaUrl,
              }}
              style={
                styles.memoryImage
              }
              resizeMode="cover"
            />
          ) : null}
        </View>

        <View
          style={
            styles.memoryBody
          }
        >
          <Text
            style={
              styles.memoryTitle
            }
          >
            {item.title ||
              "Untitled Memory"}
          </Text>

          <Pressable
            onPress={() =>
              void handleRestore(
                item._id,
              )
            }
            style={
              styles.restoreButton
            }
          >
            <RotateCcw
              size={15}
              color="#22c55e"
            />

            <Text
              style={
                styles.restoreText
              }
            >
              Restore
            </Text>
          </Pressable>
        </View>
      </View>
    );
  };

  const renderAlbums = () => (
    <View>
      <Pressable
        onPress={() =>
          setShowAlbumModal(
            true,
          )
        }
        style={
          styles.createAlbumButton
        }
      >
        <FolderPlus
          size={18}
          color="#ffffff"
        />

        <Text
          style={
            styles.createAlbumText
          }
        >
          Create Album
        </Text>
      </Pressable>

      {albums.map((album) => (
        <View
          key={album._id}
          style={
            styles.albumCard
          }
        >
          <View
            style={
              styles.albumIcon
            }
          >
            {album.isHidden ? (
              <EyeOff
                size={20}
                color="#a855f7"
              />
            ) : (
              <FolderPlus
                size={20}
                color="#a855f7"
              />
            )}
          </View>

          <View
            style={
              styles.albumText
            }
          >
            <Text
              style={
                styles.albumName
              }
            >
              {album.name}
            </Text>

            <Text
              style={
                styles.albumSubtitle
              }
            >
              {album.isHidden
                ? "Hidden album"
                : "Vault album"}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );

  const isLocked =
    (activeTab ===
      "private" ||
      activeTab ===
        "security") &&
    !isUnlocked;

  return (
    <View
      style={styles.screen}
    >
      <FlatList
        data={
          activeTab ===
          "albums"
            ? []
            : activeTab ===
                "trash"
              ? trashBin
              : memories
        }
        keyExtractor={(item) =>
          String(item._id)
        }
        renderItem={
          activeTab ===
          "trash"
            ? renderTrash
            : renderMemory
        }
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
        ListHeaderComponent={
          <View>
            <View
              style={[
                styles.header,
                { paddingTop: (insets.top || 20) + 8 },
              ]}
            >
              <View
                style={
                  styles.headerLeft
                }
              >
                <Pressable
                  onPress={() => {
                    if (router.canGoBack()) {
                      router.back();
                    } else {
                      router.replace("/app");
                    }
                  }}
                  style={styles.backButton}
                >
                  <ArrowLeft
                    size={22}
                    color="#a855f7"
                  />
                </Pressable>

                <View
                  style={
                    styles.headerIcon
                  }
                >
                  <ShieldCheck
                    size={22}
                    color="#a855f7"
                  />
                </View>

                <View
                  style={
                    styles.headerText
                  }
                >
                  <Text
                    style={
                      styles.title
                    }
                  >
                    Secure Memories Vault
                  </Text>

                  <Text
                    style={
                      styles.subtitle
                    }
                  >
                    Private memories,
                    albums and backups
                  </Text>
                </View>
              </View>

              <View
                style={
                  styles.headerActions
                }
              >
                <View
                  style={
                    styles.syncedPill
                  }
                >
                  <CloudCheck
                    size={14}
                    color="#22c55e"
                  />
                  <Text
                    style={
                      styles.syncedText
                    }
                  >
                    Synced
                  </Text>
                </View>

                <Pressable
                  onPress={() =>
                    setShowAddModal(
                      true,
                    )
                  }
                  style={
                    styles.addButton
                  }
                >
                  <Plus
                    size={17}
                    color="#ffffff"
                  />
                </Pressable>

                <Pressable
                  onPress={() =>
                    setIsUnlocked(
                      false,
                    )
                  }
                  style={
                    styles.lockButton
                  }
                >
                  <Lock
                    size={17}
                    color="#64748b"
                  />
                </Pressable>
              </View>
            </View>

            <View
              style={
                styles.searchRow
              }
            >
              {activeTab ===
                "timeline" && (
                <Pressable
                  onPress={() =>
                    setDateFilter(
                      (previous) =>
                        previous ===
                        "flashback"
                          ? "all"
                          : "flashback",
                    )
                  }
                  style={[
                    styles.flashbackButton,
                    dateFilter ===
                      "flashback" &&
                      styles.flashbackActive,
                  ]}
                >
                  <Sparkles
                    size={14}
                    color={
                      dateFilter ===
                      "flashback"
                        ? "#f59e0b"
                        : "#64748b"
                    }
                  />

                  <Text
                    style={[
                      styles.flashbackText,
                      dateFilter ===
                        "flashback" &&
                        styles.flashbackTextActive,
                    ]}
                  >
                    On This Day
                  </Text>
                </Pressable>
              )}

              <View
                style={
                  styles.searchBox
                }
              >
                <Search
                  size={17}
                  color="#64748b"
                />

                <TextInput
                  value={searchQuery}
                  onChangeText={
                    setSearchQuery
                  }
                  placeholder="Search memories..."
                  placeholderTextColor="#94a3b8"
                  style={
                    styles.searchInput
                  }
                />
              </View>
            </View>

            <FlatList
              horizontal
              data={[
                {
                  id: "timeline",
                  label: "AI Timeline",
                  icon: Calendar,
                },
                {
                  id: "private",
                  label: "My Eyes Only",
                  icon: EyeOff,
                },
                {
                  id: "albums",
                  label: "Albums",
                  icon: FolderPlus,
                },
                {
                  id: "favorites",
                  label: "Favorites",
                  icon: Heart,
                },
                {
                  id: "trash",
                  label: "Trash Bin",
                  icon: Trash2,
                },
                {
                  id: "security",
                  label: "Security & PIN",
                  icon: Key,
                },
              ]}
              keyExtractor={(item) =>
                item.id
              }
              showsHorizontalScrollIndicator={
                false
              }
              contentContainerStyle={
                styles.vaultTabs
              }
              renderItem={({ item }) => {
                const Icon =
                  item.icon;
                const active =
                  activeTab ===
                  item.id;

                return (
                  <Pressable
                    onPress={() =>
                      setActiveTab(
                        item.id,
                      )
                    }
                    style={[
                      styles.vaultTab,
                      active &&
                        styles.vaultTabActive,
                    ]}
                  >
                    <Icon
                      size={14}
                      color={
                        active
                          ? "#a855f7"
                          : "#64748b"
                      }
                    />

                    <Text
                      style={[
                        styles.vaultTabText,
                        active &&
                          styles.vaultTabTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              }}
            />

            {isLocked
              ? renderLockScreen()
              : activeTab ===
                  "security"
                ? (
                  <View
                    style={
                      styles.securityCard
                    }
                  >
                    <Key
                      size={22}
                      color="#a855f7"
                    />

                    <Text
                      style={
                        styles.securityTitle
                      }
                    >
                      Vault Security & PIN
                    </Text>

                    <TextInput
                      value={newPin}
                      onChangeText={(value) =>
                        setNewPin(
                          value.replace(
                            /\D/g,
                            "",
                          ).slice(0, 4),
                        )
                      }
                      secureTextEntry
                      keyboardType="number-pad"
                      placeholder="New 4-digit PIN"
                      placeholderTextColor="#94a3b8"
                      style={
                        styles.pinInput
                      }
                    />

                    <Pressable
                      onPress={() =>
                        void handleUpdatePin()
                      }
                      style={
                        styles.securityButton
                      }
                    >
                      <Unlock
                        size={16}
                        color="#ffffff"
                      />

                      <Text
                        style={
                          styles.securityButtonText
                        }
                      >
                        Update Security PIN
                      </Text>
                    </Pressable>
                  </View>
                )
                : activeTab ===
                    "albums"
                  ? renderAlbums()
                  : null}

            {!isLocked &&
              loading && (
                <View
                  style={
                    styles.inlineLoader
                  }
                >
                  <ActivityIndicator
                    size="large"
                    color="#a855f7"
                  />
                </View>
              )}
          </View>
        }
        ListEmptyComponent={
          !loading &&
          !isLocked &&
          activeTab !== "albums" &&
          activeTab !== "security" ? (
            <View
              style={
                styles.emptyState
              }
            >
              <View
                style={
                  styles.emptyIcon
                }
              >
                {activeTab ===
                "trash" ? (
                  <Trash2
                    size={28}
                    color="#94a3b8"
                  />
                ) : (
                  <ShieldCheck
                    size={28}
                    color="#94a3b8"
                  />
                )}
              </View>

              <Text
                style={
                  styles.emptyTitle
                }
              >
                Nothing here yet
              </Text>

              <Text
                style={
                  styles.emptyDescription
                }
              >
                No vault items are available
                for this section.
              </Text>
            </View>
          ) : null
        }
      />

      <Modal
        visible={
          showAddModal
        }
        transparent
        animationType="slide"
        onRequestClose={() =>
          setShowAddModal(
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
              styles.modalCard
            }
          >
            <Text
              style={
                styles.modalTitle
              }
            >
              Add Memory
            </Text>

            <TextInput
              value={newTitle}
              onChangeText={
                setNewTitle
              }
              placeholder="Memory title"
              placeholderTextColor="#94a3b8"
              style={
                styles.modalInput
              }
            />

            <TextInput
              value={newMediaUrl}
              onChangeText={
                setNewMediaUrl
              }
              placeholder="Media URL"
              placeholderTextColor="#94a3b8"
              autoCapitalize="none"
              style={
                styles.modalInput
              }
            />

            <Pressable
              onPress={() =>
                setIsPrivate(
                  (value) =>
                    !value,
                )
              }
              style={
                styles.privateToggle
              }
            >
              {isPrivate ? (
                <Lock
                  size={16}
                  color="#a855f7"
                />
              ) : (
                <Eye
                  size={16}
                  color="#64748b"
                />
              )}

              <Text
                style={
                  styles.privateToggleText
                }
              >
                {isPrivate
                  ? "Private memory"
                  : "Public memory"}
              </Text>
            </Pressable>

            <View
              style={
                styles.modalButtons
              }
            >
              <Pressable
                onPress={() =>
                  setShowAddModal(
                    false,
                  )
                }
                style={
                  styles.cancelButton
                }
              >
                <Text
                  style={
                    styles.cancelText
                  }
                >
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                onPress={() =>
                  void handleAddMemory()
                }
                style={
                  styles.modalPrimaryButton
                }
              >
                <Text
                  style={
                    styles.modalPrimaryText
                  }
                >
                  Add Memory
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={
          showAlbumModal
        }
        transparent
        animationType="slide"
        onRequestClose={() =>
          setShowAlbumModal(
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
              styles.modalCard
            }
          >
            <Text
              style={
                styles.modalTitle
              }
            >
              Create Album
            </Text>

            <TextInput
              value={newAlbumName}
              onChangeText={
                setNewAlbumName
              }
              placeholder="Album name"
              placeholderTextColor="#94a3b8"
              style={
                styles.modalInput
              }
            />

            <Pressable
              onPress={() =>
                setIsHiddenAlbum(
                  (value) =>
                    !value,
                )
              }
              style={
                styles.privateToggle
              }
            >
              {isHiddenAlbum ? (
                <EyeOff
                  size={16}
                  color="#a855f7"
                />
              ) : (
                <Eye
                  size={16}
                  color="#64748b"
                />
              )}

              <Text
                style={
                  styles.privateToggleText
                }
              >
                {isHiddenAlbum
                  ? "Hidden album"
                  : "Visible album"}
              </Text>
            </Pressable>

            <View
              style={
                styles.modalButtons
              }
            >
              <Pressable
                onPress={() =>
                  setShowAlbumModal(
                    false,
                  )
                }
                style={
                  styles.cancelButton
                }
              >
                <Text
                  style={
                    styles.cancelText
                  }
                >
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                onPress={() =>
                  void handleCreateAlbum()
                }
                style={
                  styles.modalPrimaryButton
                }
              >
                <Text
                  style={
                    styles.modalPrimaryText
                  }
                >
                  Create
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={
          showShareModal
        }
        transparent
        animationType="fade"
        onRequestClose={() =>
          setShowShareModal(
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
              styles.shareModal
            }
          >
            <Share2
              size={24}
              color="#a855f7"
            />

            <Text
              style={
                styles.modalTitle
              }
            >
              Share Link
            </Text>

            <Text
              style={
                styles.shareLink
              }
              numberOfLines={4}
            >
              {generatedLink}
            </Text>

            <Pressable
              onPress={() =>
                setShowShareModal(
                  false,
                )
              }
              style={
                styles.modalPrimaryButton
              }
            >
              <Text
                style={
                  styles.modalPrimaryText
                }
              >
                Done
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  content: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 30,
  },

  header: {
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },

  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },

  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(168,85,247,0.10)",
    borderWidth: 1,
    borderColor: "rgba(168,85,247,0.20)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },

  headerText: {
    flex: 1,
    minWidth: 0,
  },

  title: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
  },

  subtitle: {
    marginTop: 2,
    fontSize: 10,
    color: "#64748b",
  },

  headerActions: {
    alignItems: "flex-end",
    gap: 6,
  },

  syncedPill: {
    minHeight: 26,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: "rgba(34,197,94,0.10)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.20)",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  syncedText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#16a34a",
  },

  addButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#a855f7",
    alignItems: "center",
    justifyContent: "center",
  },

  lockButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },

  searchRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  flashbackButton: {
    minHeight: 40,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  flashbackActive: {
    backgroundColor: "rgba(245,158,11,0.10)",
    borderColor: "rgba(245,158,11,0.35)",
  },

  flashbackText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748b",
  },

  flashbackTextActive: {
    color: "#f59e0b",
  },

  searchBox: {
    flex: 1,
    minHeight: 40,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    gap: 6,
  },

  searchInput: {
    flex: 1,
    color: "#0f172a",
    fontSize: 12,
  },

  vaultTabs: {
    gap: 8,
    paddingVertical: 14,
  },

  vaultTab: {
    minHeight: 38,
    paddingHorizontal: 11,
    borderRadius: 11,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  vaultTabActive: {
    backgroundColor: "rgba(168,85,247,0.10)",
    borderColor: "rgba(168,85,247,0.30)",
  },

  vaultTabText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748b",
  },

  vaultTabTextActive: {
    color: "#a855f7",
  },

  inlineLoader: {
    paddingVertical: 50,
    alignItems: "center",
  },

  emptyState: {
    paddingVertical: 44,
    alignItems: "center",
  },

  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#eef2f7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0f172a",
  },

  emptyDescription: {
    marginTop: 5,
    fontSize: 12,
    lineHeight: 18,
    color: "#64748b",
    textAlign: "center",
    paddingHorizontal: 30,
  },

  memoryCard: {
    marginBottom: 10,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  memoryMediaWrap: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#0f172a",
    position: "relative",
  },

  memoryImage: {
    width: "100%",
    height: "100%",
  },

  memoryImagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  videoBadge: {
    position: "absolute",
    right: 8,
    top: 8,
    minHeight: 24,
    paddingHorizontal: 7,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
  },

  videoBadgeText: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "800",
  },

  memoryBody: {
    padding: 12,
  },

  memoryTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
  },

  metaRow: {
    marginTop: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  metaText: {
    fontSize: 11,
    color: "#64748b",
  },

  memoryActions: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  memoryAction: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },

  downloadButton: {
    minHeight: 34,
    paddingHorizontal: 10,
    borderRadius: 17,
    backgroundColor: "#a855f7",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginLeft: "auto",
  },

  downloadText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "700",
  },

  restoreButton: {
    marginTop: 10,
    alignSelf: "flex-start",
    minHeight: 36,
    paddingHorizontal: 11,
    borderRadius: 10,
    backgroundColor: "rgba(34,197,94,0.08)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.20)",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  restoreText: {
    color: "#16a34a",
    fontSize: 11,
    fontWeight: "700",
  },

  createAlbumButton: {
    minHeight: 44,
    borderRadius: 13,
    backgroundColor: "#a855f7",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
    marginBottom: 10,
  },

  createAlbumText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
  },

  albumCard: {
    minHeight: 70,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  albumIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "rgba(168,85,247,0.10)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  albumText: {
    flex: 1,
  },

  albumName: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0f172a",
  },

  albumSubtitle: {
    marginTop: 2,
    fontSize: 10,
    color: "#64748b",
  },

  lockContainer: {
    paddingVertical: 22,
    alignItems: "center",
  },

  lockCard: {
    width: "100%",
    borderRadius: 20,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 20,
    alignItems: "center",
  },

  lockIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "rgba(168,85,247,0.10)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  lockTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
    textAlign: "center",
  },

  lockDescription: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
    color: "#64748b",
    textAlign: "center",
    maxWidth: 260,
  },

  pinDots: {
    marginTop: 16,
    flexDirection: "row",
    gap: 12,
  },

  pinDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#a855f7",
    backgroundColor: "#ffffff",
  },

  pinDotActive: {
    backgroundColor: "#a855f7",
  },

  pinError: {
    marginTop: 12,
    color: "#ef4444",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
  },

  keypad: {
    width: "100%",
    marginTop: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8,
  },

  keyButton: {
    width: "31%",
    minHeight: 50,
    borderRadius: 13,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },

  keyButtonDisabled: {
    opacity: 0.4,
  },

  keyText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },

  biometricButton: {
    width: "31%",
    minHeight: 50,
    borderRadius: 13,
    backgroundColor: "rgba(34,197,94,0.08)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.20)",
    alignItems: "center",
    justifyContent: "center",
  },

  clearKeyButton: {
    width: "31%",
    minHeight: 50,
    borderRadius: 13,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },

  clearKeyText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748b",
  },

  securityCard: {
    borderRadius: 18,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
    marginBottom: 10,
  },

  securityTitle: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
  },

  pinInput: {
    marginTop: 12,
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
    textAlign: "center",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 7,
    color: "#0f172a",
  },

  securityButton: {
    marginTop: 12,
    minHeight: 46,
    borderRadius: 13,
    backgroundColor: "#a855f7",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  securityButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
  },

  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.55)",
  },

  modalCard: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 18,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 12,
  },

  modalInput: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 12,
    color: "#0f172a",
    fontSize: 13,
    marginBottom: 10,
  },

  privateToggle: {
    minHeight: 40,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    borderRadius: 11,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  privateToggleText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
  },

  modalButtons: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },

  cancelButton: {
    minHeight: 42,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },

  cancelText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
  },

  modalPrimaryButton: {
    minHeight: 42,
    paddingHorizontal: 15,
    borderRadius: 12,
    backgroundColor: "#a855f7",
    alignItems: "center",
    justifyContent: "center",
  },

  modalPrimaryText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#ffffff",
  },

  shareModal: {
    marginHorizontal: 20,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    padding: 20,
  },

  shareLink: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    color: "#334155",
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
  },
});
``