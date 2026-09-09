import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSelector, useDispatch } from "react-redux";
import { Search, ArrowLeft, Users, UserPlus, Star, Sparkles } from "lucide-react-native";

import api from "../../services/api";
import { updateFollowing } from "../../store/authSlice";
import { Avatar } from "../../components/ui/Avatar";
import { Button } from "../../components/ui/Button";
import { useToast } from "../../components/ui/Toast";
import { useTheme } from "../../contexts/ThemeContext";
import type { RootState } from "../../store/store";

const TABS = ["followers", "following", "quickadd", "mutuals"];

interface NetworkPageProps {
  initialTab?: "followers" | "following" | "quickadd" | "mutuals" | string;
}

const NetworkPage = ({ initialTab }: NetworkPageProps = {}) => {
  const { id, userId, tab } = useLocalSearchParams<{ id?: string; userId?: string; tab?: string }>();
  const { user: authUser } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const { toast } = useToast();
  const { effectiveTheme } = useTheme();
  const dark = effectiveTheme === "dark";

  const targetUserId = id || userId || authUser?._id;
  const isOwner = authUser?._id === targetUserId;

  const [activeTab, setActiveTab] = useState(initialTab || tab || "followers");
  const [users, setUsers] = useState<any[]>([]);
  const [quickAddList, setQuickAddList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const colors = {
    bg: dark ? "#0d0a14" : "#fafafa",
    text: dark ? "#f8fafc" : "#0f172a",
    textSecondary: dark ? "#94a3b8" : "#64748b",
    primary: "#a855f7",
    card: dark ? "#1a0d27" : "#fff",
    cardBorder: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
    inputBg: dark ? "#1e112c" : "#f1f5f9",
    inputBorder: dark ? "#2d1b3b" : "#e2e8f0",
    tabActive: "#a855f7",
    tabActiveBg: dark ? "rgba(168,85,247,0.12)" : "rgba(168,85,247,0.1)",
  };

  useEffect(() => {
    fetchNetworkData();
  }, [activeTab, targetUserId]);

  const fetchNetworkData = async () => {
    setLoading(true);
    try {
      if (activeTab === "followers") {
        const res = await api.get(`/api/users/${targetUserId}/followers`);
        if (res.data.success) setUsers(res.data.data || []);
      } else if (activeTab === "following") {
        const res = await api.get(`/api/users/${targetUserId}/following`);
        if (res.data.success) setUsers(res.data.data || []);
      } else if (activeTab === "quickadd") {
        const res = await api.get(`/api/users/recommendations/quick-add`);
        if (res.data.success) setQuickAddList(res.data.data || []);
      } else if (activeTab === "mutuals") {
        const res = await api.get(`/api/users/${targetUserId}/mutual-followers`);
        if (res.data.success) setUsers(res.data.data || []);
      }
    } catch (err) {
      console.error("Network fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdd = async (userId: string) => {
    try {
      const res = await api.post(`/api/users/${userId}/follow`);
      if (res.data?.success && res.data?.data) {
        dispatch(updateFollowing(res.data.data));
        setQuickAddList((prev) => prev.filter((u) => u._id !== userId));
        toast({ variant: "success", title: "Following", description: "You are now following this user." });
      }
    } catch {
      toast({ variant: "error", title: "Error", description: "Failed to follow user." });
    }
  };

  const handleChat = async (userId: string) => {
    try {
      const res = await api.post("/api/conversations", { userId });
      if (res.data.success) {
        router.push(`/app/chat/${res.data.data._id}` as any);
      }
    } catch {
      toast({ variant: "error", title: "Error", description: "Failed to start conversation." });
    }
  };

  const filteredUsers = users.filter((u) =>
    (u.username || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.fullName || "").toLowerCase().includes(search.toLowerCase())
  );

  const renderUserItem = ({ item }: { item: any }) => (
    <Pressable
      style={[styles.userItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
      onPress={() => router.push(`/app/profile/${item._id}` as any)}
    >
      <Avatar src={item.profilePicture || item.avatar} size="md" />
      <View style={styles.userInfo}>
        <Text style={[styles.username, { color: colors.text }]}>{item.username}</Text>
        {item.fullName && <Text style={[styles.fullName, { color: colors.textSecondary }]}>{item.fullName}</Text>}
        {item.bio && <Text style={[styles.bio, { color: colors.textSecondary }]} numberOfLines={1}>{item.bio}</Text>}
      </View>
      {isOwner && activeTab !== "quickadd" && (
        <Pressable
          style={[styles.chatBtn, { borderColor: colors.primary }]}
          onPress={() => handleChat(item._id)}
        >
          <Text style={[styles.chatBtnText, { color: colors.primary }]}>Message</Text>
        </Pressable>
      )}
    </Pressable>
  );

  const renderQuickAddItem = ({ item }: { item: any }) => (
    <View style={[styles.quickAddCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      <Avatar src={item.profilePicture || item.avatar} size="lg" />
      <Text style={[styles.qaUsername, { color: colors.text }]}>{item.username}</Text>
      {item.mutualCount > 0 && (
        <Text style={[styles.qaMutual, { color: colors.textSecondary }]}>{item.mutualCount} mutuals</Text>
      )}
      <Button
        variant="gradient"
        size="sm"
        onPress={() => handleQuickAdd(item._id)}
        leftIcon={<UserPlus size={13} color="#fff" />}
        style={{ marginTop: 8 }}
      >
        Follow
      </Button>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <ArrowLeft size={22} color={colors.text} />
        </Pressable>
        <Text style={[styles.pageTitle, { color: colors.text }]}>Network</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* Tabs */}
      <FlatList
        data={TABS}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item}
        style={styles.tabsRow}
        contentContainerStyle={styles.tabsContent}
        renderItem={({ item: tab }) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[
              styles.tab,
              activeTab === tab && { backgroundColor: colors.tabActiveBg },
            ]}
          >
            <Text style={[
              styles.tabText, { color: activeTab === tab ? colors.tabActive : colors.textSecondary },
              activeTab === tab && { fontWeight: "700" },
            ]}>
              {tab === "quickadd" ? "Quick Add" : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </Pressable>
        )}
      />

      {/* Search (not for quickadd tab) */}
      {activeTab !== "quickadd" && (
        <View style={[styles.searchBar, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
          <Search size={16} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            value={search}
            onChangeText={setSearch}
            placeholder="Search..."
            placeholderTextColor={colors.textSecondary}
          />
        </View>
      )}

      {/* Content */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : activeTab === "quickadd" ? (
        <FlatList
          data={quickAddList}
          keyExtractor={(item) => item._id}
          numColumns={2}
          renderItem={renderQuickAddItem}
          contentContainerStyle={styles.qaGrid}
          columnWrapperStyle={{ gap: 12 }}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Sparkles size={40} color={colors.textSecondary} />
              <Text style={{ color: colors.textSecondary, marginTop: 12 }}>No recommendations right now</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item._id}
          renderItem={renderUserItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Users size={40} color={colors.textSecondary} />
              <Text style={{ color: colors.textSecondary, marginTop: 12 }}>No users found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
  },
  pageTitle: { fontSize: 18, fontWeight: "700" },
  tabsRow: { flexGrow: 0 },
  tabsContent: { paddingHorizontal: 16, gap: 8, paddingBottom: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  tabText: { fontSize: 13 },
  searchBar: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginHorizontal: 16, marginBottom: 8,
    paddingHorizontal: 12, height: 40, borderRadius: 10, borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 40 },
  listContent: { paddingHorizontal: 16, paddingBottom: 80 },
  userItem: {
    flexDirection: "row", alignItems: "center", gap: 10,
    padding: 12, borderRadius: 14, borderWidth: 1, marginBottom: 8,
  },
  userInfo: { flex: 1 },
  username: { fontSize: 14, fontWeight: "700" },
  fullName: { fontSize: 12, marginTop: 2 },
  bio: { fontSize: 11, marginTop: 2 },
  chatBtn: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8, borderWidth: 1,
  },
  chatBtnText: { fontSize: 12, fontWeight: "600" },
  // Quick add
  qaGrid: { paddingHorizontal: 16, paddingBottom: 80 },
  quickAddCard: {
    flex: 1, alignItems: "center", padding: 16, borderRadius: 20, borderWidth: 1,
    marginBottom: 12,
  },
  qaUsername: { fontSize: 13, fontWeight: "700", marginTop: 8 },
  qaMutual: { fontSize: 11, marginTop: 2 },
});

export default NetworkPage;
