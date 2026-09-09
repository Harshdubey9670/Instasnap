import React, { useState } from "react";
import {
  Dimensions,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import {
  Sparkles,
  ShieldCheck,
  Image as ImageIcon,
  PenTool,
  ChevronDown,
  Star,
  Download,
  ArrowRight,
} from "lucide-react-native";

const { width } = Dimensions.get("window");

export const LandingPage = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroBadge}>
            <Sparkles size={40} color="#ffffff" />
          </View>
          <Text style={styles.heroTitle}>
            Connect.{"\n"}
            <Text style={styles.heroTitleHighlight}>Create.</Text>{"\n"}
            Inspire.
          </Text>
          <Text style={styles.heroSubtitle}>
            The next-generation social platform powered by AI. Share your moments, connect deeply, and unleash your creativity.
          </Text>

          <View style={styles.heroButtons}>
            <Pressable
              onPress={() => router.push("/auth/register" as any)}
              style={styles.primaryBtn}
            >
              <Text style={styles.primaryBtnText}>Start for Free</Text>
              <ArrowRight size={16} color="#ffffff" />
            </Pressable>

            <Pressable
              onPress={() => router.push("/auth/login" as any)}
              style={styles.secondaryBtn}
            >
              <Text style={styles.secondaryBtnText}>Log In</Text>
            </Pressable>
          </View>
        </View>

        {/* Features Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>
            Next-Gen <Text style={{ color: "#f43f5e" }}>Features</Text>
          </Text>
          <Text style={styles.sectionSubheading}>
            Everything you need to build your community and share your story.
          </Text>

          <View style={styles.featuresGrid}>
            <View style={styles.featureCard}>
              <View style={styles.featureIconWrap}>
                <Sparkles size={24} color="#f43f5e" />
              </View>
              <Text style={styles.featureTitle}>AI Enhancements</Text>
              <Text style={styles.featureDesc}>
                Automatically enhance photos, generate reels, and create captions with built-in AI tools.
              </Text>
            </View>

            <View style={styles.featureCard}>
              <View style={styles.featureIconWrap}>
                <ShieldCheck size={24} color="#10b981" />
              </View>
              <Text style={styles.featureTitle}>Secure Chat</Text>
              <Text style={styles.featureDesc}>
                Encrypted direct messaging with music notes, typing status, and privacy options.
              </Text>
            </View>

            <View style={styles.featureCard}>
              <View style={styles.featureIconWrap}>
                <ImageIcon size={24} color="#3b82f6" />
              </View>
              <Text style={styles.featureTitle}>Memories Vault</Text>
              <Text style={styles.featureDesc}>
                PIN-protected private memory vault with timeline, flashback, and encrypted albums.
              </Text>
            </View>

            <View style={styles.featureCard}>
              <View style={styles.featureIconWrap}>
                <PenTool size={24} color="#a855f7" />
              </View>
              <Text style={styles.featureTitle}>Creator Tools</Text>
              <Text style={styles.featureDesc}>
                Advanced analytics, monetization dashboard, subscriber tiers, and scheduled releases.
              </Text>
            </View>
          </View>
        </View>

        {/* Testimonials */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>
            Loved by <Text style={{ color: "#f43f5e" }}>Millions</Text>
          </Text>
          <Text style={styles.sectionSubheading}>
            See what our community has to say about SnapGram AI.
          </Text>

          {[
            {
              name: "Sarah Jenkins",
              role: "Content Creator",
              content: "The AI features alone have saved me hours of editing. This is the platform we've been waiting for!",
            },
            {
              name: "David Chen",
              role: "Photographer",
              content: "Finally, a platform that doesn't compress photos into oblivion. The quality retention is unmatched.",
            },
          ].map((item, idx) => (
            <View key={idx} style={styles.testimonialCard}>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={14} color="#f59e0b" fill="#f59e0b" />
                ))}
              </View>
              <Text style={styles.testimonialText}>"{item.content}"</Text>
              <Text style={styles.testimonialAuthor}>{item.name}</Text>
              <Text style={styles.testimonialRole}>{item.role}</Text>
            </View>
          ))}
        </View>

        {/* FAQ */}
        <View style={[styles.section, { marginBottom: 50 }]}>
          <Text style={styles.sectionHeading}>FAQ</Text>
          {[
            {
              q: "Is SnapGram AI free to use?",
              a: "Yes! Core features including posting, chatting, and basic AI enhancements are completely free.",
            },
            {
              q: "How secure is the messaging?",
              a: "We use end-to-end encryption for all direct messages so your private chats stay private.",
            },
            {
              q: "Are the AI tools available on mobile?",
              a: "Yes, all our AI features are fully optimized and available natively within iOS and Android.",
            },
          ].map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <Pressable
                key={idx}
                onPress={() => toggleFaq(idx)}
                style={styles.faqCard}
              >
                <View style={styles.faqHeader}>
                  <Text style={styles.faqQuestion}>{item.q}</Text>
                  <ChevronDown
                    size={18}
                    color="#94a3b8"
                    style={isOpen ? { transform: [{ rotate: "180deg" }] } : undefined}
                  />
                </View>
                {isOpen && <Text style={styles.faqAnswer}>{item.a}</Text>}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default LandingPage;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  scrollView: { flex: 1 },
  contentContainer: { paddingBottom: 60 },
  heroSection: { alignItems: "center", paddingHorizontal: 24, paddingTop: 40, paddingBottom: 50 },
  heroBadge: {
    width: 80,
    height: 80,
    borderRadius: 28,
    backgroundColor: "#f43f5e",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    shadowColor: "#f43f5e",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
  heroTitle: {
    fontSize: 40,
    fontWeight: "900",
    color: "#f8fafc",
    textAlign: "center",
    lineHeight: 48,
    marginBottom: 16,
  },
  heroTitleHighlight: { color: "#f43f5e" },
  heroSubtitle: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 30,
    maxWidth: 320,
  },
  heroButtons: { width: "100%", gap: 12, alignItems: "center" },
  primaryBtn: {
    width: "100%",
    backgroundColor: "#f43f5e",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: "#f43f5e",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  primaryBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  secondaryBtn: {
    width: "100%",
    backgroundColor: "#1e293b",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  secondaryBtnText: { color: "#f8fafc", fontSize: 15, fontWeight: "600" },
  section: { paddingHorizontal: 20, marginTop: 40 },
  sectionHeading: { fontSize: 26, fontWeight: "800", color: "#f8fafc", textAlign: "center", marginBottom: 6 },
  sectionSubheading: { fontSize: 13, color: "#94a3b8", textAlign: "center", marginBottom: 24 },
  featuresGrid: { gap: 14 },
  featureCard: {
    backgroundColor: "#1e293b",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#334155",
  },
  featureIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  featureTitle: { color: "#f8fafc", fontSize: 16, fontWeight: "700", marginBottom: 6 },
  featureDesc: { color: "#94a3b8", fontSize: 12, lineHeight: 18 },
  testimonialCard: {
    backgroundColor: "#1e293b",
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#334155",
  },
  starsRow: { flexDirection: "row", gap: 4, marginBottom: 10 },
  testimonialText: { color: "#f8fafc", fontSize: 13, fontStyle: "italic", lineHeight: 20, marginBottom: 12 },
  testimonialAuthor: { color: "#f8fafc", fontSize: 13, fontWeight: "700" },
  testimonialRole: { color: "#64748b", fontSize: 11 },
  faqCard: {
    backgroundColor: "#1e293b",
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#334155",
  },
  faqHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  faqQuestion: { color: "#f8fafc", fontSize: 14, fontWeight: "600", flex: 1, paddingRight: 10 },
  faqAnswer: { color: "#94a3b8", fontSize: 12, marginTop: 10, lineHeight: 18 },
});
