import React, { useState, useEffect } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { router } from "expo-router";
// Localization helper
const t = (k: string) => k;
import {
  User, Shield, Lock, Bell, Clock,
  Eye, MessageSquare, Database,
  Moon, Search, HelpCircle, LogOut, ChevronRight, ChevronLeft, ShieldAlert, Info
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { logout } from "../../store/authSlice";
import { Input } from "../../components/ui/Input";
import { useTheme } from "../../contexts/ThemeContext";
import type { RootState } from "../../store/store";

// Import mobile settings sections
import AccountSettings from "../../components/settings/AccountSettings";
import PrivacySettings from "../../components/settings/PrivacySettings";
import SecuritySettings from "../../components/settings/SecuritySettings";
import NotificationSettings from "../../components/settings/NotificationSettings";
import AppearanceSettings from "../../components/settings/AppearanceSettings";
import AccessibilitySettings from "../../components/settings/AccessibilitySettings";
import LanguageSettings from "../../components/settings/LanguageSettings";
import HelpSettings from "../../components/settings/HelpSettings";
import AboutSettings from "../../components/settings/AboutSettings";
import TimeManagementSettings from "../../components/settings/TimeManagementSettings";
import ChatSettings from "../../components/settings/ChatSettings";
import MediaVaultSettings from "../../components/settings/MediaVaultSettings";
import AiSettings from "../../components/settings/AiSettings";

const SETTINGS_CATEGORIES = [
  { id: "account", label: "Account", icon: User, keywords: ["username", "email", "phone", "password", "personal", "profile"], component: AccountSettings },
  { id: "privacy", label: "Privacy", icon: Lock, keywords: ["private", "account", "activity", "status", "blocked"], component: PrivacySettings },
  { id: "security", label: "Security", icon: ShieldAlert, keywords: ["password", "2fa", "login", "sessions"], component: SecuritySettings },
  { id: "notifications", label: "Notifications", icon: Bell, keywords: ["push", "email", "pause", "quiet", "alert"], component: NotificationSettings },
  { id: "appearance", label: "Appearance", icon: Moon, keywords: ["dark", "light", "theme", "font", "size", "mode"], component: AppearanceSettings },
  { id: "accessibility", label: "Accessibility", icon: Eye, keywords: ["contrast", "screen reader"], component: AccessibilitySettings },
  { id: "language", label: "Language", icon: Search, keywords: ["translate", "english", "spanish"], component: LanguageSettings },
  { id: "help", label: "Help", icon: HelpCircle, keywords: ["support", "faq", "report", "problem"], component: HelpSettings },
  { id: "about", label: "About", icon: Info, keywords: ["version", "terms", "privacy policy", "legal"], component: AboutSettings },
  { id: "time", label: "Time Management", icon: Clock, keywords: ["daily", "limit", "reminder", "break"], component: TimeManagementSettings },
  { id: "chat", label: "Chat & Messages", icon: MessageSquare, keywords: ["dm", "message", "reply", "story"], component: ChatSettings },
  { id: "media", label: "Media & Vault", icon: Database, keywords: ["download", "save", "quality", "upload", "data"], component: MediaVaultSettings },
  { id: "ai", label: "AI Features", icon: Shield, keywords: ["suggestions", "captions", "filters", "smart"], component: AiSettings },
];

const SettingsPage = () => {
  const { effectiveTheme } = useTheme();
  const dark = effectiveTheme === "dark";
  const dispatch = useDispatch();

  const [activeTab, setActiveTab] = useState("account");
  const [searchQuery, setSearchQuery] = useState("");
  const [showDetail, setShowDetail] = useState(false); // false = list, true = detail panel

  const colors = {
    bg: dark ? "#0d0a14" : "#f8f5ff",
    text: dark ? "#f8fafc" : "#0f172a",
    textSecondary: dark ? "#94a3b8" : "#64748b",
    primary: "#a855f7",
    card: dark ? "#1a0d27" : "#ffffff",
    cardBorder: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
    itemHover: dark ? "rgba(168,85,247,0.08)" : "rgba(168,85,247,0.05)",
    activeItem: dark ? "rgba(168,85,247,0.15)" : "rgba(168,85,247,0.1)",
  };

  const filteredCategories = SETTINGS_CATEGORIES.filter((c) =>
    c.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.keywords.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const ActiveComponent = SETTINGS_CATEGORIES.find((c) => c.id === activeTab)?.component || AccountSettings;
  const activeCategory = SETTINGS_CATEGORIES.find((c) => c.id === activeTab);

  const handleLogout = async () => {
    await AsyncStorage.removeItem("token");
    dispatch(logout());
    router.replace("/auth/login" as any);
  };

  const handleCategoryPress = (id: string) => {
    setActiveTab(id);
    setShowDetail(true);
  };

  if (showDetail) {
    const Icon = activeCategory?.icon || User;
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
        {/* Detail Header */}
        <View style={[styles.detailHeader, { borderBottomColor: colors.cardBorder }]}>
          <Pressable onPress={() => setShowDetail(false)} style={styles.backBtn} hitSlop={12}>
            <ChevronLeft size={22} color={colors.primary} />
            <Text style={[styles.backText, { color: colors.primary }]}>Settings</Text>
          </Pressable>
          <Text style={[styles.detailTitle, { color: colors.text }]}>{activeCategory?.label}</Text>
          <View style={{ width: 80 }} />
        </View>
        <ScrollView style={styles.detailScroll} showsVerticalScrollIndicator={false}>
          <ActiveComponent />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.cardBorder }]}>
        <Text style={[styles.pageTitle, { color: colors.text }]}>Settings</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Input
          placeholder="Search settings..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Search size={16} color={colors.textSecondary} />}
        />
      </View>

      {/* Categories List */}
      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          {filteredCategories.map((cat, index) => {
            const CatIcon = cat.icon;
            const isActive = activeTab === cat.id;
            return (
              <Pressable
                key={cat.id}
                style={[
                  styles.categoryItem,
                  isActive && { backgroundColor: colors.activeItem },
                  index < filteredCategories.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
                ]}
                onPress={() => handleCategoryPress(cat.id)}
              >
                <View style={[styles.categoryIconBox, { backgroundColor: isActive ? "rgba(168,85,247,0.15)" : colors.itemHover }]}>
                  <CatIcon size={18} color={isActive ? colors.primary : colors.textSecondary} />
                </View>
                <Text style={[styles.categoryLabel, { color: isActive ? colors.primary : colors.text }]}>
                  {cat.label}
                </Text>
                <ChevronRight size={16} color={colors.textSecondary} />
              </Pressable>
            );
          })}
        </View>

        {/* Logout Button */}
        <Pressable
          style={[styles.logoutBtn, { backgroundColor: dark ? "rgba(239,68,68,0.1)" : "rgba(239,68,68,0.05)", borderColor: "rgba(239,68,68,0.2)" }]}
          onPress={handleLogout}
        >
          <LogOut size={18} color="#ef4444" />
          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1,
  },
  pageTitle: { fontSize: 24, fontWeight: "700", letterSpacing: -0.5 },
  searchContainer: { paddingHorizontal: 16, paddingVertical: 10 },
  list: { flex: 1, paddingHorizontal: 16 },
  section: {
    borderRadius: 16, borderWidth: 1,
    overflow: "hidden", marginBottom: 16, marginTop: 4,
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  categoryItem: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  categoryIconBox: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  categoryLabel: { flex: 1, fontSize: 15, fontWeight: "500" },
  logoutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 16,
  },
  logoutText: { fontSize: 15, fontWeight: "600", color: "#ef4444" },
  // Detail view
  detailHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
  },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 4, width: 80 },
  backText: { fontSize: 15, fontWeight: "500" },
  detailTitle: { fontSize: 17, fontWeight: "700" },
  detailScroll: { flex: 1 },
});

export default SettingsPage;
