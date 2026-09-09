import React, {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  addAffiliateLink,
  getAffiliateLinks,
  getEarningsOverview,
  getPayoutHistory,
  getTaxInfo,
  requestPayout,
  updateTaxInfo,
} from "../../src/services/monetizationService";
import { useTheme } from "../../src/contexts/ThemeContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type Tab =
  | "overview"
  | "subscriptions"
  | "tips"
  | "affiliate"
  | "payouts";

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: "overview", label: "Earnings Overview", emoji: "📈" },
  { id: "subscriptions", label: "Subscriptions", emoji: "✨" },
  { id: "tips", label: "Tips & Badges", emoji: "🎁" },
  { id: "affiliate", label: "Affiliate Links", emoji: "🔗" },
  { id: "payouts", label: "Payouts & Tax", emoji: "🏦" },
];

// ─── Types ────────────────────────────────────────────────────
interface RevenueBreakdown {
  subscriptions: number;
  tips: number;
  badges: number;
  sponsorships: number;
  ads: number;
  affiliates: number;
}

interface MonthlyTrend {
  month: string;
  revenue: number;
}

interface EarningsSummary {
  pendingBalance: number;
  totalGrossEarnings: number;
  paidOut: number;
  revenueBreakdown: RevenueBreakdown;
}

interface EarningsData {
  summary: EarningsSummary;
  monthlyTrends: MonthlyTrend[];
}

interface AffiliateLink {
  _id: string;
  title: string;
  url: string;
  clicks?: number;
  earnings?: number;
}

interface Payout {
  _id: string;
  amount: number;
  paymentMethod: string;
  requestedAt: string;
  status: string;
}

interface TaxInfo {
  legalName?: string;
  taxIdType?: string;
  status?: string;
}

// ─── Helpers ──────────────────────────────────────────────────
function fmt(n: number) {
  return n?.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) ?? "0.00";
}

function getThemeColors(isDark: boolean) {
  return {
    bg: isDark ? "#0f172a" : "#f8fafc",
    surface: isDark ? "#1e293b" : "#ffffff",
    surfaceHover: isDark ? "#334155" : "#f1f5f9",
    border: isDark ? "#334155" : "#e2e8f0",
    textPrimary: isDark ? "#f1f5f9" : "#0f172a",
    textSecondary: isDark ? "#94a3b8" : "#64748b",
    primary: "#a855f7",
    emerald: "#10b981",
    teal: "#14b8a6",
    rose: "#f43f5e",
    amber: "#f59e0b",
    blue: "#3b82f6",
    purple: "#8b5cf6",
  };
}

// ─── Sub-components ───────────────────────────────────────────
function StatCard({
  label,
  value,
  sub,
  accent,
  colors,
}: {
  label: string;
  value: string;
  sub: string;
  accent: string;
  colors: ReturnType<typeof getThemeColors>;
}) {
  return (
    <View
      style={[
        styles.statCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
        {label}
      </Text>
      <Text style={[styles.statValue, { color: accent }]}>{value}</Text>
      <Text style={[styles.statSub, { color: colors.textSecondary }]}>{sub}</Text>
    </View>
  );
}

function SectionCard({
  title,
  children,
  colors,
}: {
  title: string;
  children: React.ReactNode;
  colors: ReturnType<typeof getThemeColors>;
}) {
  return (
    <View
      style={[
        styles.sectionCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
        {title}
      </Text>
      {children}
    </View>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────
function Skeleton({ colors }: { colors: ReturnType<typeof getThemeColors> }) {
  return (
    <View style={styles.skeletonWrap}>
      {[1, 2, 3].map((i) => (
        <View
          key={i}
          style={[
            styles.skeletonCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        />
      ))}
    </View>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────
function OverviewTab({
  earnings,
  colors,
  onRequestPayout,
}: {
  earnings: EarningsData;
  colors: ReturnType<typeof getThemeColors>;
  onRequestPayout: () => void;
}) {
  const maxRevenue = Math.max(
    ...earnings.monthlyTrends.map((t) => t.revenue),
    1,
  );

  const breakdown: { label: string; amount: number; dot: string }[] = [
    {
      label: "Subscriptions",
      amount: earnings.summary.revenueBreakdown.subscriptions,
      dot: colors.emerald,
    },
    {
      label: "Tips & Contributions",
      amount: earnings.summary.revenueBreakdown.tips,
      dot: colors.teal,
    },
    {
      label: "Supporter Badges",
      amount: earnings.summary.revenueBreakdown.badges,
      dot: colors.primary,
    },
    {
      label: "Sponsored Posts",
      amount: earnings.summary.revenueBreakdown.sponsorships,
      dot: colors.amber,
    },
    {
      label: "Ad Revenue Share",
      amount: earnings.summary.revenueBreakdown.ads,
      dot: colors.purple,
    },
    {
      label: "Affiliate Commissions",
      amount: earnings.summary.revenueBreakdown.affiliates,
      dot: colors.rose,
    },
  ];

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Header stat cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalCards}
      >
        <StatCard
          label="Available Balance"
          value={`$${fmt(earnings.summary.pendingBalance)}`}
          sub="Ready for withdrawal"
          accent={colors.emerald}
          colors={colors}
        />
        <StatCard
          label="Total Gross Earnings"
          value={`$${fmt(earnings.summary.totalGrossEarnings)}`}
          sub="+24.5% vs last month"
          accent={colors.textPrimary}
          colors={colors}
        />
        <StatCard
          label="Paid Out To Date"
          value={`$${fmt(earnings.summary.paidOut)}`}
          sub="Transferred to bank/PayPal"
          accent={colors.textPrimary}
          colors={colors}
        />
      </ScrollView>

      {/* Revenue breakdown */}
      <SectionCard title="💰 Revenue Sources" colors={colors}>
        {breakdown.map((item) => (
          <View key={item.label} style={styles.breakdownRow}>
            <View style={styles.breakdownLeft}>
              <View
                style={[styles.breakdownDot, { backgroundColor: item.dot }]}
              />
              <Text
                style={[styles.breakdownLabel, { color: colors.textSecondary }]}
              >
                {item.label}
              </Text>
            </View>
            <Text style={[styles.breakdownAmount, { color: colors.textPrimary }]}>
              ${fmt(item.amount)}
            </Text>
          </View>
        ))}
      </SectionCard>

      {/* Monthly revenue bar chart */}
      <SectionCard title="📊 Monthly Revenue Trajectory" colors={colors}>
        <View style={styles.barChartWrap}>
          {earnings.monthlyTrends.map((trend) => {
            const heightPct = Math.max(
              10,
              Math.floor((trend.revenue / maxRevenue) * 100),
            );
            return (
              <View key={trend.month} style={styles.barCol}>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        height: `${heightPct}%` as any,
                        backgroundColor: colors.emerald,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.barLabel, { color: colors.textSecondary }]}>
                  {trend.month.slice(0, 3)}
                </Text>
              </View>
            );
          })}
        </View>
        <View style={styles.barLegend}>
          <Text style={[styles.barLegendText, { color: colors.textSecondary }]}>
            +38% YoY growth
          </Text>
        </View>
      </SectionCard>

      {/* Payout CTA */}
      <TouchableOpacity
        style={[styles.payoutCta, { backgroundColor: colors.emerald }]}
        onPress={onRequestPayout}
        activeOpacity={0.85}
      >
        <Text style={styles.payoutCtaText}>💳  Request Payout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Subscriptions Tab ────────────────────────────────────────
const SUB_TIERS = [
  {
    name: "Tier 1: Fan",
    price: "$4.99/mo",
    perks: [
      "Exclusive Subscriber Badge",
      "Access to Subscriber Stories",
      "Priority Comment Highlighting",
    ],
    popular: false,
    accent: "#10b981",
  },
  {
    name: "Tier 2: Superfan",
    price: "$9.99/mo",
    perks: [
      "All Tier 1 Perks",
      "Subscriber Only Live Stream Access",
      "Direct DM Priority Queue",
    ],
    popular: true,
    accent: "#10b981",
  },
  {
    name: "Tier 3: VIP Patron",
    price: "$24.99/mo",
    perks: [
      "All Superfan Perks",
      "1-on-1 Monthly Video Q&A",
      "Merch Discount Codes",
    ],
    popular: false,
    accent: "#10b981",
  },
];

function SubscriptionsTab({
  colors,
}: {
  colors: ReturnType<typeof getThemeColors>;
}) {
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View
        style={[
          styles.sectionCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Creator Subscription Tiers
        </Text>
        <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>
          Offer exclusive badges, subscriber-only posts, and direct chat perks.
        </Text>

        {SUB_TIERS.map((tier) => (
          <View
            key={tier.name}
            style={[
              styles.tierCard,
              {
                backgroundColor: colors.surfaceHover,
                borderColor: tier.popular
                  ? tier.accent
                  : colors.border,
              },
            ]}
          >
            {tier.popular && (
              <View
                style={[
                  styles.popularBadge,
                  { backgroundColor: tier.accent },
                ]}
              >
                <Text style={styles.popularText}>Popular</Text>
              </View>
            )}
            <View style={styles.tierHeader}>
              <Text style={[styles.tierName, { color: colors.textPrimary }]}>
                {tier.name}
              </Text>
              <View
                style={[
                  styles.priceBadge,
                  { backgroundColor: tier.accent + "20" },
                ]}
              >
                <Text style={[styles.priceText, { color: tier.accent }]}>
                  {tier.price}
                </Text>
              </View>
            </View>
            {tier.perks.map((p) => (
              <View key={p} style={styles.perkRow}>
                <Text style={[styles.perkCheck, { color: tier.accent }]}>
                  ✓
                </Text>
                <Text style={[styles.perkText, { color: colors.textSecondary }]}>
                  {p}
                </Text>
              </View>
            ))}
            <TouchableOpacity
              style={[
                styles.editTierBtn,
                {
                  backgroundColor: tier.popular
                    ? tier.accent
                    : colors.surface,
                  borderColor: colors.border,
                },
              ]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.editTierText,
                  {
                    color: tier.popular ? "#fff" : colors.textPrimary,
                  },
                ]}
              >
                Edit Tier
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// ─── Tips & Badges Tab ────────────────────────────────────────
const STATIC_TIPS = [
  { user: "Alex Rivers", amount: 50.0, msg: "Awesome content! Keep it up 🔥", date: "2 hours ago" },
  { user: "Sarah Jenkins", amount: 25.0, msg: "Thanks for the live Q&A!", date: "Yesterday" },
  { user: "David Kim", amount: 100.0, msg: "Legendary post! 🚀", date: "3 days ago" },
];

const STATIC_BADGES = [
  { type: "Superfan Badge", buyer: "Emma Stone", price: 9.99 },
  { type: "Supporter Badge", buyer: "Michael Scott", price: 1.99 },
  { type: "VIP Patron Badge", buyer: "Pam Beesly", price: 24.99 },
];

function TipsTab({
  colors,
}: {
  colors: ReturnType<typeof getThemeColors>;
}) {
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <SectionCard title="🎁 Fan Tips & Contributions" colors={colors}>
        {STATIC_TIPS.map((tip, idx) => (
          <View
            key={idx}
            style={[
              styles.tipRow,
              { backgroundColor: colors.surfaceHover, borderColor: colors.border },
            ]}
          >
            <View style={styles.tipLeft}>
              <Text style={[styles.tipUser, { color: colors.textPrimary }]}>
                {tip.user}
              </Text>
              <Text style={[styles.tipMsg, { color: colors.textSecondary }]}>
                "{tip.msg}"
              </Text>
            </View>
            <View style={styles.tipRight}>
              <Text style={[styles.tipAmount, { color: colors.emerald }]}>
                +${fmt(tip.amount)}
              </Text>
              <Text style={[styles.tipDate, { color: colors.textSecondary }]}>
                {tip.date}
              </Text>
            </View>
          </View>
        ))}
      </SectionCard>

      <SectionCard title="🏅 Supporter Badges Sold" colors={colors}>
        {STATIC_BADGES.map((badge, idx) => (
          <View
            key={idx}
            style={[
              styles.tipRow,
              { backgroundColor: colors.surfaceHover, borderColor: colors.border },
            ]}
          >
            <View style={styles.tipLeft}>
              <Text style={[styles.tipUser, { color: colors.textPrimary }]}>
                {badge.type}
              </Text>
              <Text style={[styles.tipMsg, { color: colors.textSecondary }]}>
                Bought by {badge.buyer}
              </Text>
            </View>
            <Text style={[styles.tipAmount, { color: colors.emerald }]}>
              ${badge.price.toFixed(2)}
            </Text>
          </View>
        ))}
      </SectionCard>
    </ScrollView>
  );
}

// ─── Affiliate Tab ────────────────────────────────────────────
function AffiliateTab({
  affiliates,
  onAdd,
  colors,
}: {
  affiliates: AffiliateLink[];
  onAdd: (title: string, url: string) => void;
  colors: ReturnType<typeof getThemeColors>;
}) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!title.trim() || !url.trim()) return;
    setAdding(true);
    try {
      await onAdd(title.trim(), url.trim());
      setTitle("");
      setUrl("");
    } finally {
      setAdding(false);
    }
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <SectionCard title="➕ Add Affiliate Link" colors={colors}>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Product / Link Title (e.g. My Camera Gear)"
          placeholderTextColor={colors.textSecondary}
          style={[
            styles.input,
            {
              backgroundColor: colors.surfaceHover,
              borderColor: colors.border,
              color: colors.textPrimary,
            },
          ]}
        />
        <TextInput
          value={url}
          onChangeText={setUrl}
          placeholder="https://affiliate.link/product"
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="none"
          keyboardType="url"
          style={[
            styles.input,
            {
              backgroundColor: colors.surfaceHover,
              borderColor: colors.border,
              color: colors.textPrimary,
            },
          ]}
        />
        <TouchableOpacity
          style={[
            styles.submitBtn,
            { backgroundColor: colors.emerald, opacity: adding ? 0.6 : 1 },
          ]}
          onPress={handleAdd}
          disabled={adding}
          activeOpacity={0.85}
        >
          <Text style={styles.submitBtnText}>
            {adding ? "Adding…" : "Add Link"}
          </Text>
        </TouchableOpacity>
      </SectionCard>

      <SectionCard
        title={`🔗 Active Affiliate Links (${affiliates.length})`}
        colors={colors}
      >
        {affiliates.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No affiliate links created yet.
          </Text>
        ) : (
          affiliates.map((link) => (
            <TouchableOpacity
              key={link._id}
              style={[
                styles.affiliateRow,
                { backgroundColor: colors.surfaceHover, borderColor: colors.border },
              ]}
              onPress={() => Linking.openURL(link.url)}
              activeOpacity={0.7}
            >
              <View style={styles.affiliateLeft}>
                <Text style={[styles.affiliateTitle, { color: colors.textPrimary }]}>
                  {link.title}
                </Text>
                <Text
                  style={[styles.affiliateUrl, { color: colors.emerald }]}
                  numberOfLines={1}
                >
                  {link.url} ↗
                </Text>
              </View>
              <View style={styles.affiliateStats}>
                <View style={styles.affiliateStat}>
                  <Text style={[styles.affiliateStatLabel, { color: colors.textSecondary }]}>
                    Clicks
                  </Text>
                  <Text style={[styles.affiliateStatValue, { color: colors.textPrimary }]}>
                    {link.clicks ?? 0}
                  </Text>
                </View>
                <View style={styles.affiliateStat}>
                  <Text style={[styles.affiliateStatLabel, { color: colors.textSecondary }]}>
                    Earned
                  </Text>
                  <Text style={[styles.affiliateStatValue, { color: colors.emerald }]}>
                    ${fmt(link.earnings ?? 0)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </SectionCard>
    </ScrollView>
  );
}

// ─── Payouts Tab ──────────────────────────────────────────────
function PayoutsTab({
  payouts,
  taxInfo,
  onSaveTaxInfo,
  colors,
}: {
  payouts: Payout[];
  taxInfo: TaxInfo | null;
  onSaveTaxInfo: (data: { legalName: string; taxIdType: string; taxId: string }) => void;
  colors: ReturnType<typeof getThemeColors>;
}) {
  const [legalName, setLegalName] = useState(taxInfo?.legalName ?? "");
  const [taxIdType, setTaxIdType] = useState(taxInfo?.taxIdType ?? "SSN");
  const [taxId, setTaxId] = useState("");
  const [saving, setSaving] = useState(false);

  const taxIdTypes = ["SSN", "EIN", "VAT", "PAN"];

  const handleSave = async () => {
    if (!legalName.trim() || !taxId.trim()) return;
    setSaving(true);
    try {
      await onSaveTaxInfo({ legalName: legalName.trim(), taxIdType, taxId: taxId.trim() });
      setTaxId("");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Payout history */}
      <SectionCard title="📋 Payout History" colors={colors}>
        {payouts.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No payouts requested yet.
          </Text>
        ) : (
          payouts.map((p) => (
            <View
              key={p._id}
              style={[
                styles.payoutRow,
                { backgroundColor: colors.surfaceHover, borderColor: colors.border },
              ]}
            >
              <View>
                <Text style={[styles.payoutAmount, { color: colors.textPrimary }]}>
                  ${fmt(p.amount)} via {p.paymentMethod}
                </Text>
                <Text style={[styles.payoutDate, { color: colors.textSecondary }]}>
                  {new Date(p.requestedAt).toLocaleDateString()}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      p.status === "completed"
                        ? colors.emerald + "20"
                        : colors.amber + "20",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    {
                      color:
                        p.status === "completed"
                          ? colors.emerald
                          : colors.amber,
                    },
                  ]}
                >
                  {p.status.toUpperCase()}
                </Text>
              </View>
            </View>
          ))
        )}
      </SectionCard>

      {/* Tax info form */}
      <View
        style={[
          styles.sectionCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={styles.taxHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            🛡️ Tax Information (W-9 / W-8BEN)
          </Text>
          {taxInfo?.status === "verified" && (
            <View
              style={[
                styles.verifiedBadge,
                { backgroundColor: colors.emerald + "20" },
              ]}
            >
              <Text style={[styles.verifiedText, { color: colors.emerald }]}>
                VERIFIED
              </Text>
            </View>
          )}
        </View>

        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
          Legal Full Name
        </Text>
        <TextInput
          value={legalName}
          onChangeText={setLegalName}
          placeholder="Jane Doe"
          placeholderTextColor={colors.textSecondary}
          style={[
            styles.input,
            {
              backgroundColor: colors.surfaceHover,
              borderColor: colors.border,
              color: colors.textPrimary,
            },
          ]}
        />

        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
          Tax ID Type
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.taxTypeRow}
        >
          {taxIdTypes.map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setTaxIdType(t)}
              style={[
                styles.taxTypeBtn,
                {
                  backgroundColor:
                    taxIdType === t ? colors.emerald : colors.surfaceHover,
                  borderColor:
                    taxIdType === t ? colors.emerald : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.taxTypeBtnText,
                  { color: taxIdType === t ? "#fff" : colors.textSecondary },
                ]}
              >
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
          Tax Identification Number
        </Text>
        <TextInput
          value={taxId}
          onChangeText={setTaxId}
          placeholder="•••••••••"
          placeholderTextColor={colors.textSecondary}
          secureTextEntry
          style={[
            styles.input,
            {
              backgroundColor: colors.surfaceHover,
              borderColor: colors.border,
              color: colors.textPrimary,
            },
          ]}
        />

        <TouchableOpacity
          style={[
            styles.submitBtn,
            {
              backgroundColor: colors.emerald,
              opacity: saving ? 0.6 : 1,
            },
          ]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          <Text style={styles.submitBtnText}>
            {saving ? "Saving…" : "Save Tax Document Information"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ─── Payout Modal ─────────────────────────────────────────────
function PayoutModal({
  visible,
  onClose,
  onSubmit,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (amount: number, method: string) => Promise<void>;
  colors: ReturnType<typeof getThemeColors>;
}) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("bank_transfer");
  const [submitting, setSubmitting] = useState(false);

  const METHODS = [
    { id: "bank_transfer", label: "Direct Bank Transfer" },
    { id: "paypal", label: "PayPal Express" },
    { id: "stripe", label: "Stripe Connect" },
  ];

  const handleSubmit = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt < 10) {
      Alert.alert("Minimum Amount", "Minimum payout amount is $10.00");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(amt, method);
      setAmount("");
      setMethod("bank_transfer");
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.modalOverlay}
        onPress={onClose}
      >
        <Pressable
          style={[
            styles.modalCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
            💳 Request Payout Withdrawal
          </Text>

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            Withdrawal Amount ($ USD)
          </Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder="Min $10.00"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            style={[
              styles.input,
              {
                backgroundColor: colors.surfaceHover,
                borderColor: colors.border,
                color: colors.textPrimary,
                fontSize: 18,
                fontWeight: "700",
              },
            ]}
          />

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            Payment Method
          </Text>
          {METHODS.map((m) => (
            <TouchableOpacity
              key={m.id}
              onPress={() => setMethod(m.id)}
              style={[
                styles.methodRow,
                {
                  borderColor:
                    method === m.id ? colors.emerald : colors.border,
                  backgroundColor:
                    method === m.id
                      ? colors.emerald + "15"
                      : colors.surfaceHover,
                },
              ]}
            >
              <View
                style={[
                  styles.radio,
                  {
                    borderColor:
                      method === m.id ? colors.emerald : colors.border,
                  },
                ]}
              >
                {method === m.id && (
                  <View
                    style={[
                      styles.radioFill,
                      { backgroundColor: colors.emerald },
                    ]}
                  />
                )}
              </View>
              <Text
                style={[styles.methodLabel, { color: colors.textPrimary }]}
              >
                {m.label}
              </Text>
            </TouchableOpacity>
          ))}

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[
                styles.cancelBtn,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.surfaceHover,
                },
              ]}
              onPress={onClose}
            >
              <Text
                style={[styles.cancelBtnText, { color: colors.textPrimary }]}
              >
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalSubmitBtn,
                {
                  backgroundColor: colors.emerald,
                  opacity: submitting ? 0.6 : 1,
                },
              ]}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.85}
            >
              <Text style={styles.submitBtnText}>
                {submitting ? "Submitting…" : "Submit Request"}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────
export default function MonetizationDashboardScreen() {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === "dark";
  const colors = getThemeColors(isDark);

  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [showPayoutModal, setShowPayoutModal] = useState(false);

  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [affiliates, setAffiliates] = useState<AffiliateLink[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [taxInfo, setTaxInfo] = useState<TaxInfo | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === "overview") {
        const res = await getEarningsOverview();
        setEarnings(res.data);
      } else if (activeTab === "affiliate") {
        const res = await getAffiliateLinks();
        setAffiliates(res.data ?? []);
      } else if (activeTab === "payouts") {
        const [pRes, tRes] = await Promise.all([
          getPayoutHistory(),
          getTaxInfo(),
        ]);
        setPayouts(pRes.data ?? []);
        setTaxInfo(tRes.data ?? null);
      }
    } catch (err) {
      console.error("Failed to load monetization data:", err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleRequestPayout = useCallback(
    async (amount: number, paymentMethod: string) => {
      try {
        await requestPayout(amount, paymentMethod);
        Alert.alert("Success", "Payout request submitted!");
        void fetchData();
      } catch (err: any) {
        Alert.alert(
          "Error",
          err?.response?.data?.message ?? "Payout request failed",
        );
        throw err;
      }
    },
    [fetchData],
  );

  const handleAddLink = useCallback(
    async (title: string, url: string) => {
      try {
        await addAffiliateLink(title, url);
        void fetchData();
      } catch {
        Alert.alert("Error", "Failed to add affiliate link");
      }
    },
    [fetchData],
  );

  const handleSaveTaxInfo = useCallback(
    async (data: { legalName: string; taxIdType: string; taxId: string }) => {
      try {
        const res = await updateTaxInfo(data);
        setTaxInfo(res.data);
        Alert.alert("Saved", "Tax information saved!");
      } catch (err: any) {
        Alert.alert(
          "Error",
          err?.response?.data?.message ?? "Failed to save tax info",
        );
      }
    },
    [],
  );

  const renderContent = () => {
    if (loading) return <Skeleton colors={colors} />;

    switch (activeTab) {
      case "overview":
        return earnings ? (
          <OverviewTab
            earnings={earnings}
            colors={colors}
            onRequestPayout={() => setShowPayoutModal(true)}
          />
        ) : null;
      case "subscriptions":
        return <SubscriptionsTab colors={colors} />;
      case "tips":
        return <TipsTab colors={colors} />;
      case "affiliate":
        return (
          <AffiliateTab
            affiliates={affiliates}
            onAdd={handleAddLink}
            colors={colors}
          />
        );
      case "payouts":
        return (
          <PayoutsTab
            payouts={payouts}
            taxInfo={taxInfo}
            onSaveTaxInfo={handleSaveTaxInfo}
            colors={colors}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <View>
          <Text style={[styles.headerTitle, { color: colors.emerald }]}>
            💰 Monetization & Earnings
          </Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            Subscriptions, tips, affiliates, payouts & tax
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.headerPayoutBtn, { backgroundColor: colors.emerald }]}
          onPress={() => setShowPayoutModal(true)}
          activeOpacity={0.85}
        >
          <Text style={styles.headerPayoutBtnText}>💳 Request Payout</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View
        style={[
          styles.tabBar,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <FlatList
          data={TABS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.tabList}
          renderItem={({ item }) => {
            const active = activeTab === item.id;
            return (
              <TouchableOpacity
                onPress={() => setActiveTab(item.id)}
                style={[
                  styles.tabBtn,
                  active && {
                    backgroundColor: colors.emerald + "20",
                    borderColor: colors.emerald,
                    borderWidth: 1,
                  },
                ]}
              >
                <Text style={styles.tabEmoji}>{item.emoji}</Text>
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: active ? colors.emerald : colors.textSecondary,
                      fontWeight: active ? "700" : "500",
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Content */}
      <View style={styles.content}>{renderContent()}</View>

      {/* Payout Modal */}
      <PayoutModal
        visible={showPayoutModal}
        onClose={() => setShowPayoutModal(false)}
        onSubmit={handleRequestPayout}
        colors={colors}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },

  // Header
  header: {
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 12,
    marginTop: 3,
  },
  headerPayoutBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
  },
  headerPayoutBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },

  // Tab bar
  tabBar: {
    borderBottomWidth: 1,
  },
  tabList: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  tabBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
    marginRight: 4,
  },
  tabEmoji: { fontSize: 14 },
  tabLabel: { fontSize: 13 },

  // Content
  content: { flex: 1, padding: 16 },

  // Skeleton
  skeletonWrap: { gap: 16 },
  skeletonCard: {
    height: 120,
    borderRadius: 16,
    borderWidth: 1,
  },

  // Stat card (horizontal scroll)
  horizontalCards: {
    gap: 12,
    paddingBottom: 4,
    marginBottom: 16,
  },
  statCard: {
    width: SCREEN_WIDTH * 0.62,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
  },
  statLabel: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  statValue: { fontSize: 34, fontWeight: "900", marginTop: 6 },
  statSub: { fontSize: 11, marginTop: 4 },

  // Section card
  sectionCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 16, fontWeight: "800", marginBottom: 14 },
  sectionSub: { fontSize: 12, marginTop: -10, marginBottom: 14 },

  // Revenue breakdown
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 5,
  },
  breakdownLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  breakdownDot: { width: 10, height: 10, borderRadius: 5 },
  breakdownLabel: { fontSize: 13, fontWeight: "500" },
  breakdownAmount: { fontSize: 13, fontWeight: "700" },

  // Bar chart
  barChartWrap: {
    flexDirection: "row",
    height: 140,
    alignItems: "flex-end",
    gap: 4,
    marginBottom: 8,
  },
  barCol: { flex: 1, alignItems: "center", height: "100%" },
  barTrack: { flex: 1, width: "100%", justifyContent: "flex-end" },
  barFill: { width: "100%", borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  barLabel: { fontSize: 9, marginTop: 4, textAlign: "center" },
  barLegend: { alignItems: "flex-end" },
  barLegendText: { fontSize: 11, fontWeight: "600" },

  // Payout CTA
  payoutCta: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 20,
  },
  payoutCtaText: { color: "#fff", fontSize: 16, fontWeight: "800" },

  // Tier cards
  tierCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    overflow: "hidden",
  },
  popularBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderBottomLeftRadius: 12,
  },
  popularText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  tierHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  tierName: { fontSize: 15, fontWeight: "800" },
  priceBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  priceText: { fontSize: 12, fontWeight: "700" },
  perkRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  perkCheck: { fontSize: 14, fontWeight: "700" },
  perkText: { fontSize: 12 },
  editTierBtn: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  editTierText: { fontSize: 13, fontWeight: "700" },

  // Tips/Badges
  tipRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  tipLeft: { flex: 1, marginRight: 12 },
  tipUser: { fontSize: 13, fontWeight: "700" },
  tipMsg: { fontSize: 11, fontStyle: "italic", marginTop: 2 },
  tipRight: { alignItems: "flex-end" },
  tipAmount: { fontSize: 15, fontWeight: "900" },
  tipDate: { fontSize: 10, marginTop: 2 },

  // Affiliate
  affiliateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
  },
  affiliateLeft: { flex: 1, marginRight: 12 },
  affiliateTitle: { fontSize: 13, fontWeight: "700" },
  affiliateUrl: { fontSize: 11, marginTop: 2 },
  affiliateStats: { flexDirection: "row", gap: 18 },
  affiliateStat: { alignItems: "center" },
  affiliateStatLabel: { fontSize: 10 },
  affiliateStatValue: { fontSize: 13, fontWeight: "700" },

  // Payouts tab
  payoutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  payoutAmount: { fontSize: 13, fontWeight: "700" },
  payoutDate: { fontSize: 10, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: "700" },

  // Tax info
  taxHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  verifiedBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  verifiedText: { fontSize: 10, fontWeight: "700" },
  taxTypeRow: { marginBottom: 12 },
  taxTypeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 8,
  },
  taxTypeBtnText: { fontSize: 13, fontWeight: "700" },

  // Input
  inputLabel: { fontSize: 11, fontWeight: "700", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 14,
  },
  submitBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  submitBtnText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  emptyText: { fontSize: 13, textAlign: "center", paddingVertical: 16 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: { fontSize: 18, fontWeight: "800", marginBottom: 20 },
  methodRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioFill: { width: 10, height: 10, borderRadius: 5 },
  methodLabel: { fontSize: 14, fontWeight: "600" },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  cancelBtnText: { fontWeight: "700", fontSize: 14 },
  modalSubmitBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
});
