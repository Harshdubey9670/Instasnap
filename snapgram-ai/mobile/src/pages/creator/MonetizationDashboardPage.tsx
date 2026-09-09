import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import {
  DollarSign,
  CreditCard,
  TrendingUp,
  Sparkles,
  Gift,
  Link as LinkIcon,
  Building,
  PieChart,
  Plus,
  ArrowLeft,
  X,
} from "lucide-react-native";
import {
  getEarningsOverview,
  getAffiliateLinks,
  addAffiliateLink,
  getPayoutHistory,
  requestPayout,
  getTaxInfo,
  updateTaxInfo,
} from "../../services/monetizationService";

export default function MonetizationDashboardPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "subscriptions" | "tips" | "affiliate" | "payouts">("overview");
  const [loading, setLoading] = useState(true);

  // States
  const [earnings, setEarnings] = useState<any>(null);
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [taxInfo, setTaxInfo] = useState<any>(null);

  // Modals
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutMethod, setPayoutMethod] = useState("bank_transfer");

  const [newLinkTitle, setNewLinkTitle] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "overview") {
        const res = await getEarningsOverview();
        setEarnings(res.data);
      } else if (activeTab === "affiliate") {
        const res = await getAffiliateLinks();
        setAffiliates(res.data || []);
      } else if (activeTab === "payouts") {
        const [pRes, tRes] = await Promise.all([getPayoutHistory(), getTaxInfo()]);
        setPayouts(pRes.data || []);
        setTaxInfo(tRes.data || null);
      }
    } catch (err) {
      console.error("Failed to load monetization data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPayout = async () => {
    const amt = parseFloat(payoutAmount);
    if (!amt || amt < 10) {
      Alert.alert("Validation", "Minimum payout amount is $10.00");
      return;
    }
    try {
      await requestPayout(amt, payoutMethod);
      setShowPayoutModal(false);
      setPayoutAmount("");
      fetchData();
      Alert.alert("Success", "Payout request submitted!");
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.message || "Payout request failed");
    }
  };

  const handleAddLink = async () => {
    if (!newLinkTitle || !newLinkUrl) return;
    try {
      await addAffiliateLink(newLinkTitle, newLinkUrl);
      setNewLinkTitle("");
      setNewLinkUrl("");
      fetchData();
      Alert.alert("Success", "Affiliate link added!");
    } catch {
      Alert.alert("Error", "Failed to add affiliate link");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Pressable onPress={() => router.back()} style={{ padding: 4 }}>
            <ArrowLeft size={20} color="#f8fafc" />
          </Pressable>
          <View style={styles.iconCircle}>
            <DollarSign size={20} color="#10b981" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Monetization & Earnings</Text>
            <Text style={styles.headerSubtitle}>Subscriptions, tips & payouts</Text>
          </View>
        </View>

        <Pressable onPress={() => setShowPayoutModal(true)} style={styles.payoutBtn}>
          <CreditCard size={14} color="#fff" />
          <Text style={styles.payoutBtnText}>Payout</Text>
        </Pressable>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabsContainer}>
        {[
          { id: "overview", label: "Overview", icon: TrendingUp },
          { id: "subscriptions", label: "Subscriptions", icon: Sparkles },
          { id: "tips", label: "Tips & Badges", icon: Gift },
          { id: "affiliate", label: "Affiliate Links", icon: LinkIcon },
          { id: "payouts", label: "Payouts & Tax", icon: Building },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <Pressable
              key={t.id}
              onPress={() => setActiveTab(t.id as any)}
              style={[styles.tabChip, isActive && styles.tabChipActive]}
            >
              <Icon size={14} color={isActive ? "#10b981" : "#94a3b8"} />
              <Text style={[styles.tabChipText, isActive && styles.tabChipTextActive]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Main Body */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : activeTab === "overview" && earnings ? (
        <ScrollView style={styles.contentScroll} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Summary Cards */}
          <View style={styles.statCardsGrid}>
            <View style={[styles.statCard, { borderColor: "rgba(16, 185, 129, 0.4)" }]}>
              <Text style={styles.statLabel}>AVAILABLE BALANCE</Text>
              <Text style={[styles.statValue, { color: "#10b981" }]}>
                ${earnings.summary?.pendingBalance?.toFixed(2) || "0.00"}
              </Text>
              <Text style={styles.statFoot}>Ready for withdrawal</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>TOTAL EARNINGS</Text>
              <Text style={styles.statValue}>
                ${earnings.summary?.totalGrossEarnings?.toFixed(2) || "0.00"}
              </Text>
              <Text style={[styles.statFoot, { color: "#10b981" }]}>+24.5% vs last month</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>PAID OUT TO DATE</Text>
              <Text style={styles.statValue}>
                ${earnings.summary?.paidOut?.toFixed(2) || "0.00"}
              </Text>
              <Text style={styles.statFoot}>Transferred to bank</Text>
            </View>
          </View>

          {/* Revenue Breakdown */}
          <View style={styles.sectionBox}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <PieChart size={18} color="#10b981" />
              <Text style={styles.sectionTitle}>Revenue Sources</Text>
            </View>

            {[
              { label: "Subscriptions", amt: earnings.summary?.revenueBreakdown?.subscriptions || 0, color: "#10b981" },
              { label: "Tips & Contributions", amt: earnings.summary?.revenueBreakdown?.tips || 0, color: "#14b8a6" },
              { label: "Supporter Badges", amt: earnings.summary?.revenueBreakdown?.badges || 0, color: "#f43f5e" },
              { label: "Affiliate Commissions", amt: earnings.summary?.revenueBreakdown?.affiliates || 0, color: "#f59e0b" },
            ].map((item) => (
              <View key={item.label} style={styles.breakdownRow}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View style={[styles.dot, { backgroundColor: item.color }]} />
                  <Text style={styles.breakdownLabel}>{item.label}</Text>
                </View>
                <Text style={styles.breakdownAmt}>${item.amt.toFixed(2)}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      ) : activeTab === "affiliate" ? (
        <ScrollView style={styles.contentScroll} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.sectionBox}>
            <Text style={styles.sectionTitle}>Add Affiliate Link</Text>
            <TextInput
              style={styles.input}
              placeholder="Link Title (e.g. My Gear Store)"
              placeholderTextColor="#64748b"
              value={newLinkTitle}
              onChangeText={setNewLinkTitle}
            />
            <TextInput
              style={styles.input}
              placeholder="https://..."
              placeholderTextColor="#64748b"
              value={newLinkUrl}
              onChangeText={setNewLinkUrl}
            />
            <Pressable onPress={handleAddLink} style={styles.addBtn}>
              <Text style={styles.addBtnText}>Add Affiliate Link</Text>
            </Pressable>
          </View>

          <View style={[styles.sectionBox, { marginTop: 16 }]}>
            <Text style={styles.sectionTitle}>Active Links ({affiliates.length})</Text>
            {affiliates.map((aff) => (
              <View key={aff._id || Math.random().toString()} style={styles.affiliateItem}>
                <Text style={styles.affTitle}>{aff.title}</Text>
                <Text style={styles.affUrl}>{aff.url}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      ) : (
        <View style={styles.centerBox}>
          <Text style={{ color: "#94a3b8", fontSize: 13 }}>No items in this section yet</Text>
        </View>
      )}

      {/* Payout Modal */}
      <Modal visible={showPayoutModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request Payout</Text>
              <Pressable onPress={() => setShowPayoutModal(false)}>
                <X size={20} color="#94a3b8" />
              </Pressable>
            </View>
            <Text style={styles.inputLabel}>Payout Amount ($USD)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="Minimum $10.00"
              placeholderTextColor="#64748b"
              value={payoutAmount}
              onChangeText={setPayoutAmount}
            />
            <Pressable onPress={handleRequestPayout} style={styles.submitPayoutBtn}>
              <Text style={styles.submitPayoutText}>Submit Payout Request</Text>
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
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { color: "#f8fafc", fontSize: 16, fontWeight: "800" },
  headerSubtitle: { color: "#64748b", fontSize: 11 },
  payoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#10b981",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  payoutBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  tabsScroll: { maxHeight: 52, borderBottomWidth: 1, borderBottomColor: "#1e293b" },
  tabsContainer: { paddingHorizontal: 12, alignItems: "center", gap: 6 },
  tabChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#1e293b",
  },
  tabChipActive: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  tabChipText: { fontSize: 12, color: "#94a3b8", fontWeight: "600" },
  tabChipTextActive: { color: "#10b981", fontWeight: "700" },
  centerBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  contentScroll: { flex: 1, padding: 14 },
  statCardsGrid: { gap: 12, marginBottom: 16 },
  statCard: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  statLabel: { color: "#94a3b8", fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  statValue: { color: "#f8fafc", fontSize: 24, fontWeight: "800", marginVertical: 4 },
  statFoot: { color: "#64748b", fontSize: 11 },
  sectionBox: { backgroundColor: "#1e293b", borderRadius: 16, padding: 16 },
  sectionTitle: { color: "#f8fafc", fontSize: 14, fontWeight: "700" },
  breakdownRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  breakdownLabel: { color: "#94a3b8", fontSize: 13 },
  breakdownAmt: { color: "#f8fafc", fontSize: 13, fontWeight: "700" },
  input: {
    backgroundColor: "#0f172a",
    borderRadius: 10,
    padding: 12,
    color: "#f8fafc",
    fontSize: 13,
    marginBottom: 10,
  },
  addBtn: { backgroundColor: "#10b981", borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  addBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  affiliateItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#334155" },
  affTitle: { color: "#f8fafc", fontSize: 13, fontWeight: "700" },
  affUrl: { color: "#10b981", fontSize: 11, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "center", padding: 20 },
  modalCard: { backgroundColor: "#1e293b", borderRadius: 20, padding: 20 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  modalTitle: { color: "#f8fafc", fontSize: 16, fontWeight: "700" },
  inputLabel: { color: "#94a3b8", fontSize: 11, fontWeight: "600", marginBottom: 6 },
  submitPayoutBtn: { backgroundColor: "#10b981", borderRadius: 10, paddingVertical: 12, alignItems: "center", marginTop: 8 },
  submitPayoutText: { color: "#fff", fontSize: 13, fontWeight: "700" },
});
