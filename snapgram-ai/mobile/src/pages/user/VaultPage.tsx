import React, { useState, useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  ShieldCheck,
  Lock,
  Search,
  Heart,
  Trash2,
  Key,
  Fingerprint,
  Plus,
  Sparkles,
  EyeOff,
  CloudCheck,
  FolderPlus,
  Calendar,
  Download,
  AlertTriangle,
  X,
} from "lucide-react-native";
import {
  verifyVaultPin,
  setVaultPin,
  getMemories,
  addMemory,
  toggleFavoriteMemory,
  softDeleteMemory,
  getTrashBin,
  getVaultAlbums,
} from "../../services/vaultService";

export default function VaultPage() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");

  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutTimer, setLockoutTimer] = useState(0);

  const [activeTab, setActiveTab] = useState<"timeline" | "private" | "albums" | "favorites" | "trash" | "security">("timeline");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<"all" | "flashback">("all");
  const [loading, setLoading] = useState(true);

  const [memories, setMemories] = useState<any[]>([]);
  const [albums, setAlbums] = useState<any[]>([]);
  const [trashBin, setTrashBin] = useState<any[]>([]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newMediaUrl, setNewMediaUrl] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);

  const [newPin, setNewPin] = useState("");

  useEffect(() => {
    if ((activeTab === "private" || activeTab === "security") && !isUnlocked) return;
    fetchVaultData();
  }, [isUnlocked, activeTab, searchQuery, dateFilter]);

  const fetchVaultData = async () => {
    setLoading(true);
    try {
      if (activeTab === "timeline") {
        const res = await getMemories({ search: searchQuery, isPrivate: false });
        let data = res.data || [];
        if (dateFilter === "flashback") {
          data = data.filter((m: any) => new Date(m.memoryDate).getDate() === new Date().getDate());
        }
        setMemories(data);
      } else if (activeTab === "private") {
        const res = await getMemories({ search: searchQuery, isPrivate: true });
        setMemories(res.data || []);
      } else if (activeTab === "albums") {
        const res = await getVaultAlbums();
        setAlbums(res.data || []);
      } else if (activeTab === "favorites") {
        const res = await getMemories({ favorite: "true" });
        setMemories(res.data || []);
      } else if (activeTab === "trash") {
        const res = await getTrashBin();
        setTrashBin(res.data || []);
      }
    } catch (err) {
      console.error("Failed to load vault data", err);
    } finally {
      setLoading(false);
    }
  };

  const triggerFailedAttempt = () => {
    const nextAttempts = failedAttempts + 1;
    setFailedAttempts(nextAttempts);
    if (nextAttempts >= 5) {
      setIsLockedOut(true);
      setLockoutTimer(30);
      setPinError("Too many failed attempts! Vault locked for 30s.");

      const interval = setInterval(() => {
        setLockoutTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsLockedOut(false);
            setFailedAttempts(0);
            setPinError("");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setPinError(`Invalid PIN code (${5 - nextAttempts} attempts remaining)`);
    }
    setPinInput("");
  };

  const handleKeypadPress = (val: string) => {
    if (isLockedOut) return;
    if (pinInput.length < 4) {
      const next = pinInput + val;
      setPinInput(next);
      if (next.length === 4) {
        verifyVaultPin(next)
          .then(() => {
            setIsUnlocked(true);
            setPinInput("");
            setPinError("");
            setFailedAttempts(0);
          })
          .catch(() => {
            triggerFailedAttempt();
          });
      }
    }
  };

  const handleToggleFavorite = async (id: string) => {
    await toggleFavoriteMemory(id);
    fetchVaultData();
  };

  const handleSoftDelete = async (id: string) => {
    Alert.alert("Move to Trash Bin?", "Are you sure you want to move this memory to trash?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await softDeleteMemory(id);
          fetchVaultData();
        },
      },
    ]);
  };

  const handleAddMemory = async () => {
    if (!newMediaUrl) {
      Alert.alert("Validation", "Please provide a media URL");
      return;
    }
    await addMemory({ title: newTitle, mediaUrl: newMediaUrl, isPrivate });
    setShowAddModal(false);
    setNewTitle("");
    setNewMediaUrl("");
    fetchVaultData();
  };

  const handleUpdatePin = async () => {
    if (newPin.length !== 4) {
      Alert.alert("Error", "PIN must be 4 digits");
      return;
    }
    await setVaultPin(newPin);
    setNewPin("");
    Alert.alert("Success", "Security PIN updated successfully!");
  };

  const renderLockScreen = () => (
    <View style={styles.lockContainer}>
      <View style={styles.lockCard}>
        <View style={styles.lockIconCircle}>
          <Lock size={32} color="#f43f5e" />
        </View>
        <Text style={styles.lockTitle}>Private Memories Locked</Text>
        <Text style={styles.lockSubtitle}>Enter your 4-digit security PIN to unlock this tab</Text>

        <View style={styles.pinDotsRow}>
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              style={[
                styles.pinDot,
                pinInput.length > i && styles.pinDotFilled,
              ]}
            />
          ))}
        </View>

        {pinError ? (
          <View style={styles.pinErrorRow}>
            <AlertTriangle size={14} color="#f87171" />
            <Text style={styles.pinErrorText}>
              {pinError} {isLockedOut && `(${lockoutTimer}s)`}
            </Text>
          </View>
        ) : null}

        <View style={styles.keypadGrid}>
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
            <Pressable
              key={num}
              disabled={isLockedOut}
              onPress={() => handleKeypadPress(num)}
              style={({ pressed }) => [
                styles.keypadKey,
                pressed && { opacity: 0.7 },
                isLockedOut && { opacity: 0.4 },
              ]}
            >
              <Text style={styles.keypadKeyText}>{num}</Text>
            </Pressable>
          ))}
          <Pressable
            onPress={() => setIsUnlocked(true)}
            style={({ pressed }) => [
              styles.keypadKey,
              { backgroundColor: "rgba(16, 185, 129, 0.15)", borderColor: "rgba(16, 185, 129, 0.3)" },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Fingerprint size={22} color="#10b981" />
          </Pressable>
          <Pressable
            disabled={isLockedOut}
            onPress={() => handleKeypadPress("0")}
            style={({ pressed }) => [
              styles.keypadKey,
              pressed && { opacity: 0.7 },
              isLockedOut && { opacity: 0.4 },
            ]}
          >
            <Text style={styles.keypadKeyText}>0</Text>
          </Pressable>
          <Pressable
            onPress={() => setPinInput("")}
            style={({ pressed }) => [
              styles.keypadKey,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={[styles.keypadKeyText, { fontSize: 13, color: "#9ca3af" }]}>Clear</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View style={styles.headerIcon}>
            <ShieldCheck size={22} color="#f43f5e" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Secure Memories Vault</Text>
            <Text style={styles.headerSubtitle}>Encrypted private albums, timeline & flashback</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <Pressable onPress={() => setShowAddModal(true)} style={styles.addBtn}>
            <Plus size={16} color="#fff" />
            <Text style={styles.addBtnText}>Add</Text>
          </Pressable>
          <Pressable onPress={() => setIsUnlocked(false)} style={styles.lockBtn}>
            <Lock size={18} color="#9ca3af" />
          </Pressable>
        </View>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabsContainer}>
        {[
          { id: "timeline", label: "Timeline", icon: Calendar },
          { id: "private", label: "My Eyes Only", icon: EyeOff },
          { id: "albums", label: "Albums", icon: FolderPlus },
          { id: "favorites", label: "Favorites", icon: Heart },
          { id: "trash", label: "Trash Bin", icon: Trash2 },
          { id: "security", label: "Security & PIN", icon: Key },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              onPress={() => setActiveTab(tab.id as any)}
              style={[styles.tabBtn, isActive && styles.tabBtnActive]}
            >
              <Icon size={14} color={isActive ? "#f43f5e" : "#9ca3af"} />
              <Text style={[styles.tabBtnText, isActive && styles.tabBtnTextActive]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Search & Flashback */}
      <View style={styles.searchRow}>
        {activeTab === "timeline" && (
          <Pressable
            onPress={() => setDateFilter((prev) => (prev === "flashback" ? "all" : "flashback"))}
            style={[styles.flashbackBtn, dateFilter === "flashback" && styles.flashbackBtnActive]}
          >
            <Sparkles size={13} color={dateFilter === "flashback" ? "#f59e0b" : "#9ca3af"} />
            <Text style={[styles.flashbackText, dateFilter === "flashback" && { color: "#f59e0b" }]}>On This Day</Text>
          </Pressable>
        )}
        <View style={styles.searchBar}>
          <Search size={14} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search memories..."
            placeholderTextColor="#6b7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Main Content */}
      {((activeTab === "private" || activeTab === "security") && !isUnlocked) ? (
        renderLockScreen()
      ) : loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#f43f5e" />
        </View>
      ) : activeTab === "security" ? (
        <View style={styles.securityContainer}>
          <View style={styles.securityCard}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Key size={20} color="#f43f5e" />
              <Text style={styles.securityTitle}>Vault Security & PIN Settings</Text>
            </View>
            <Text style={styles.securityLabel}>New 4-Digit Security PIN</Text>
            <TextInput
              style={styles.securityInput}
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
              value={newPin}
              onChangeText={setNewPin}
              placeholder="****"
              placeholderTextColor="#6b7280"
            />
            <Pressable onPress={handleUpdatePin} style={styles.savePinBtn}>
              <Text style={styles.savePinBtnText}>Update Security PIN</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <FlatList
          data={activeTab === "trash" ? trashBin : memories}
          keyExtractor={(item) => item._id || Math.random().toString()}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.memoryCard}>
              <Image
                source={{ uri: item.mediaUrl || "https://images.unsplash.com/photo-1518770660439-4636190af475?w=500" }}
                style={styles.memoryImg}
              />
              <View style={styles.memoryActions}>
                <Pressable onPress={() => handleToggleFavorite(item._id)} style={styles.actionIconBtn}>
                  <Heart size={14} color={item.isFavorite ? "#ef4444" : "#ffffff"} fill={item.isFavorite ? "#ef4444" : "transparent"} />
                </Pressable>
                <Pressable onPress={() => handleSoftDelete(item._id)} style={styles.actionIconBtn}>
                  <Trash2 size={14} color="#ffffff" />
                </Pressable>
              </View>
              <View style={styles.memoryFooter}>
                <Text style={styles.memoryTitle} numberOfLines={1}>{item.title || "Snap Memory"}</Text>
                <Text style={styles.memoryDate}>
                  {new Date(item.memoryDate || item.createdAt || Date.now()).toLocaleDateString()}
                </Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No memories found in this vault tab</Text>
            </View>
          }
        />
      )}

      {/* Add Modal */}
      <Modal visible={showAddModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Vault Memory</Text>
              <Pressable onPress={() => setShowAddModal(false)}>
                <X size={20} color="#9ca3af" />
              </Pressable>
            </View>
            <TextInput
              style={styles.modalInput}
              placeholder="Memory Title"
              placeholderTextColor="#6b7280"
              value={newTitle}
              onChangeText={setNewTitle}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Media URL (Image or Video)"
              placeholderTextColor="#6b7280"
              value={newMediaUrl}
              onChangeText={setNewMediaUrl}
            />
            <Pressable onPress={() => setIsPrivate(!isPrivate)} style={styles.checkRow}>
              <View style={[styles.checkbox, isPrivate && styles.checkboxChecked]}>
                {isPrivate && <Text style={{ color: "#fff", fontSize: 10 }}>✓</Text>}
              </View>
              <Text style={styles.checkLabel}>Encrypt & Lock in Vault</Text>
            </Pressable>
            <Pressable onPress={handleAddMemory} style={styles.modalSubmitBtn}>
              <Text style={styles.modalSubmitBtnText}>Save Memory</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  headerTitleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(244, 63, 94, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 16, fontWeight: "800", color: "#f8fafc" },
  headerSubtitle: { fontSize: 11, color: "#94a3b8", marginTop: 2 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f43f5e",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  addBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  lockBtn: {
    padding: 8,
    backgroundColor: "#1e293b",
    borderRadius: 10,
  },
  tabsScroll: { maxHeight: 52, borderBottomWidth: 1, borderBottomColor: "#1e293b" },
  tabsContainer: { paddingHorizontal: 12, alignItems: "center", gap: 6 },
  tabBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#1e293b",
  },
  tabBtnActive: {
    backgroundColor: "rgba(244, 63, 94, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(244, 63, 94, 0.3)",
  },
  tabBtnText: { fontSize: 12, color: "#94a3b8", fontWeight: "600" },
  tabBtnTextActive: { color: "#f43f5e", fontWeight: "700" },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  flashbackBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#1e293b",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  flashbackBtnActive: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
  },
  flashbackText: { fontSize: 11, color: "#94a3b8", fontWeight: "700" },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 38,
    gap: 6,
  },
  searchInput: { flex: 1, color: "#f8fafc", fontSize: 12 },
  centerContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyContainer: { padding: 40, alignItems: "center" },
  emptyText: { color: "#64748b", fontSize: 13 },
  listContent: { padding: 8 },
  memoryCard: {
    flex: 1,
    margin: 6,
    borderRadius: 14,
    backgroundColor: "#1e293b",
    overflow: "hidden",
  },
  memoryImg: { width: "100%", height: 140, resizeMode: "cover" },
  memoryActions: {
    position: "absolute",
    top: 6,
    right: 6,
    flexDirection: "row",
    gap: 6,
  },
  actionIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  memoryFooter: { padding: 8 },
  memoryTitle: { color: "#f8fafc", fontSize: 12, fontWeight: "700" },
  memoryDate: { color: "#64748b", fontSize: 10, marginTop: 2 },
  lockContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  lockCard: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: "#1e293b",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
  },
  lockIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(244, 63, 94, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  lockTitle: { fontSize: 16, fontWeight: "800", color: "#f8fafc" },
  lockSubtitle: { fontSize: 12, color: "#94a3b8", textAlign: "center", marginTop: 4, marginBottom: 16 },
  pinDotsRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  pinDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 1, borderColor: "#f43f5e" },
  pinDotFilled: { backgroundColor: "#f43f5e" },
  pinErrorRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 12 },
  pinErrorText: { color: "#f87171", fontSize: 11, fontWeight: "600" },
  keypadGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: "100%",
    gap: 8,
  },
  keypadKey: {
    width: "30%",
    aspectRatio: 1.4,
    backgroundColor: "#0f172a",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  keypadKeyText: { color: "#f8fafc", fontSize: 18, fontWeight: "700" },
  securityContainer: { padding: 20 },
  securityCard: { backgroundColor: "#1e293b", padding: 20, borderRadius: 16 },
  securityTitle: { fontSize: 15, fontWeight: "700", color: "#f8fafc" },
  securityLabel: { fontSize: 12, color: "#94a3b8", marginBottom: 6 },
  securityInput: {
    backgroundColor: "#0f172a",
    borderRadius: 10,
    padding: 12,
    color: "#f8fafc",
    fontSize: 16,
    textAlign: "center",
    letterSpacing: 8,
  },
  savePinBtn: {
    backgroundColor: "#f43f5e",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 16,
  },
  savePinBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", alignItems: "center", justifyContent: "center", padding: 20 },
  modalCard: { width: "100%", backgroundColor: "#1e293b", borderRadius: 20, padding: 20 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitle: { fontSize: 16, fontWeight: "700", color: "#f8fafc" },
  modalInput: { backgroundColor: "#0f172a", borderRadius: 10, padding: 12, color: "#f8fafc", fontSize: 13, marginBottom: 10 },
  checkRow: { flexDirection: "row", alignItems: "center", gap: 8, marginVertical: 8 },
  checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1, borderColor: "#64748b", alignItems: "center", justifyContent: "center" },
  checkboxChecked: { backgroundColor: "#f43f5e", borderColor: "#f43f5e" },
  checkLabel: { fontSize: 12, color: "#94a3b8" },
  modalSubmitBtn: { backgroundColor: "#f43f5e", borderRadius: 10, paddingVertical: 12, alignItems: "center", marginTop: 12 },
  modalSubmitBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
});
