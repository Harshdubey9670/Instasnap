import React, { useState, useEffect, useMemo } from "react";
import {
  ActivityIndicator,
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
import { router, useLocalSearchParams } from "expo-router";
import { useSelector } from "react-redux";
import {
  Search,
  SquarePen,
  Circle,
  Send,
  Music2,
  Plus,
  X,
  ChevronDown,
  ArrowLeft,
} from "lucide-react-native";
import api from "../../services/api";

export default function ChatPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const authUser = useSelector((state: any) => state.auth?.user);

  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"messages" | "requests">("messages");
  const [notes, setNotes] = useState<any[]>([]);
  const [showAddNote, setShowAddNote] = useState(false);
  const [noteText, setNoteText] = useState("");

  // Direct active message state if id is open
  const [activeMessages, setActiveMessages] = useState<any[]>([]);
  const [newMsgText, setNewMsgText] = useState("");
  const [activeParticipant, setActiveParticipant] = useState<any>(null);

  useEffect(() => {
    fetchConversations();
    fetchNotes();
  }, []);

  useEffect(() => {
    if (id) {
      fetchConversationDetail(id);
    }
  }, [id]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/conversations");
      if (res.data.success) {
        setConversations(res.data.data || []);
      }
    } catch (error) {
      console.error("Failed to load conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotes = async () => {
    try {
      const res = await api.get("/api/notes");
      if (res.data.success) {
        setNotes(res.data.data || []);
      }
    } catch (e) {}
  };

  const fetchConversationDetail = async (convId: string) => {
    try {
      const res = await api.get(`/api/conversations/${convId}/messages`);
      if (res.data.success) {
        setActiveMessages(res.data.data || []);
      }
      const conv = conversations.find((c) => c._id === convId);
      if (conv) {
        const other = conv.participants.find((p: any) => p._id !== authUser?._id);
        setActiveParticipant(other);
      }
    } catch (e) {
      console.error("Failed to load messages", e);
    }
  };

  const handleSendMessage = async () => {
    if (!newMsgText.trim() || !id) return;
    const text = newMsgText;
    setNewMsgText("");
    try {
      const res = await api.post(`/api/conversations/${id}/messages`, { text });
      if (res.data.success) {
        setActiveMessages((prev) => [...prev, res.data.data]);
      }
    } catch (e) {
      console.error("Failed to send message", e);
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    try {
      const res = await api.post("/api/notes", { text: noteText });
      if (res.data.success) {
        setNotes((prev) => [res.data.data, ...prev.filter((n) => n.author?._id !== authUser?._id)]);
        setShowAddNote(false);
        setNoteText("");
      }
    } catch (e) {}
  };

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter((conv) => {
      const others = conv.participants.filter((p: any) => p._id !== authUser?._id);
      return others.some(
        (p: any) =>
          p.username?.toLowerCase().includes(q) || p.fullName?.toLowerCase().includes(q)
      );
    });
  }, [conversations, searchQuery, authUser]);

  // If a specific conversation is selected, show detail view
  if (id) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.chatHeader}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={22} color="#f8fafc" />
          </Pressable>
          <View style={styles.headerPartner}>
            <Image
              source={{ uri: activeParticipant?.profilePicture || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100" }}
              style={styles.headerAvatar}
            />
            <View>
              <Text style={styles.headerName}>{activeParticipant?.fullName || activeParticipant?.username || "Chat"}</Text>
              <Text style={styles.headerUsername}>@{activeParticipant?.username || "user"}</Text>
            </View>
          </View>
        </View>

        <FlatList
          data={activeMessages}
          keyExtractor={(item) => item._id || Math.random().toString()}
          contentContainerStyle={styles.messagesList}
          renderItem={({ item }) => {
            const isMe = item.sender?._id === authUser?._id || item.sender === authUser?._id;
            return (
              <View style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowThem]}>
                <View style={[styles.msgBubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
                  <Text style={[styles.msgText, isMe ? styles.msgTextMe : styles.msgTextThem]}>
                    {item.text}
                  </Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyMessages}>
              <Text style={styles.emptyText}>No messages yet. Say hello!</Text>
            </View>
          }
        />

        <View style={styles.inputBar}>
          <TextInput
            style={styles.chatInput}
            placeholder="Message..."
            placeholderTextColor="#64748b"
            value={newMsgText}
            onChangeText={setNewMsgText}
          />
          <Pressable onPress={handleSendMessage} disabled={!newMsgText.trim()} style={styles.sendBtn}>
            <Send size={18} color={newMsgText.trim() ? "#0095f6" : "#475569"} />
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Otherwise, render Inbox list view
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.inboxHeader}>
        <View style={styles.titleRow}>
          <Text style={styles.inboxTitle}>{authUser?.username || "Messages"}</Text>
          <ChevronDown size={16} color="#f8fafc" />
        </View>
        <Pressable style={styles.iconBtn}>
          <SquarePen size={20} color="#f8fafc" />
        </Pressable>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Search size={16} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor="#64748b"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView style={{ flex: 1 }}>
        {/* Notes Carousel */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.notesContainer}>
          {/* Add Note Button */}
          <Pressable onPress={() => setShowAddNote(true)} style={styles.noteItem}>
            <View style={styles.avatarWrap}>
              <Image
                source={{ uri: authUser?.profilePicture || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100" }}
                style={[styles.noteAvatar, { opacity: 0.6 }]}
              />
              <View style={styles.addNoteBadge}>
                <Plus size={16} color="#fff" />
              </View>
            </View>
            <Text style={styles.noteAuthorText}>Your note</Text>
          </Pressable>

          {notes.map((note) => (
            <View key={note._id || Math.random().toString()} style={styles.noteItem}>
              {note.text ? (
                <View style={styles.noteBubble}>
                  <Text style={styles.noteBubbleText} numberOfLines={1}>
                    {note.text}
                  </Text>
                </View>
              ) : null}
              <Image
                source={{ uri: note.author?.profilePicture || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100" }}
                style={styles.noteAvatar}
              />
              <Text style={styles.noteAuthorText} numberOfLines={1}>
                {note.author?._id === authUser?._id ? "You" : note.author?.username || "user"}
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* Tabs: Messages / Requests */}
        <View style={styles.tabsRow}>
          <Pressable onPress={() => setActiveTab("messages")}>
            <Text style={[styles.tabLabel, activeTab === "messages" && styles.tabLabelActive]}>Messages</Text>
          </Pressable>
          <Pressable onPress={() => setActiveTab("requests")}>
            <Text style={[styles.tabLabel, activeTab === "requests" && styles.tabLabelActive]}>Requests</Text>
          </Pressable>
        </View>

        {/* Conversations List */}
        {loading ? (
          <View style={{ padding: 40, alignItems: "center" }}>
            <ActivityIndicator size="small" color="#f43f5e" />
          </View>
        ) : filteredConversations.length === 0 ? (
          <View style={styles.emptyInbox}>
            <View style={styles.sendIconCircle}>
              <Send size={32} color="#fff" />
            </View>
            <Text style={styles.emptyInboxTitle}>Your messages</Text>
            <Text style={styles.emptyInboxSubtitle}>Send a message to start a chat with friends.</Text>
          </View>
        ) : (
          filteredConversations.map((conv) => {
            const other = conv.participants?.find((p: any) => p._id !== authUser?._id);
            if (!other) return null;
            const lastMsg = conv.latestMessage;

            return (
              <Pressable
                key={conv._id}
                onPress={() => router.push(`/app/chat/${conv._id}` as any)}
                style={styles.convRow}
              >
                <Image
                  source={{ uri: other.profilePicture || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100" }}
                  style={styles.convAvatar}
                />
                <View style={styles.convInfo}>
                  <Text style={styles.convName}>{other.fullName || other.username}</Text>
                  <Text style={styles.convPreview} numberOfLines={1}>
                    {lastMsg?.text || "Sent an attachment"}
                  </Text>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      {/* Add Note Modal */}
      <Modal visible={showAddNote} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Note</Text>
              <Pressable onPress={() => setShowAddNote(false)}>
                <X size={20} color="#9ca3af" />
              </Pressable>
            </View>
            <TextInput
              style={styles.noteInput}
              placeholder="Share a thought (up to 60 chars)..."
              placeholderTextColor="#64748b"
              maxLength={60}
              value={noteText}
              onChangeText={setNoteText}
            />
            <Pressable
              onPress={handleAddNote}
              disabled={!noteText.trim()}
              style={[styles.shareNoteBtn, !noteText.trim() && { opacity: 0.5 }]}
            >
              <Text style={styles.shareNoteBtnText}>Share</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000000" },
  inboxHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  inboxTitle: { color: "#ffffff", fontSize: 20, fontWeight: "800" },
  iconBtn: { padding: 4 },
  searchContainer: { paddingHorizontal: 16, marginBottom: 8 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#262626",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 38,
    gap: 8,
  },
  searchInput: { flex: 1, color: "#ffffff", fontSize: 13 },
  notesContainer: { paddingHorizontal: 16, paddingVertical: 12, gap: 14 },
  noteItem: { alignItems: "center", width: 66 },
  avatarWrap: { position: "relative" },
  noteAvatar: { width: 56, height: 56, borderRadius: 28, borderWidth: 1, borderColor: "#262626" },
  addNoteBadge: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  noteBubble: {
    position: "absolute",
    top: -10,
    backgroundColor: "#262626",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    zIndex: 10,
    maxWidth: 60,
  },
  noteBubbleText: { color: "#ffffff", fontSize: 9, fontWeight: "600" },
  noteAuthorText: { color: "#a8a8a8", fontSize: 11, marginTop: 4, textAlign: "center" },
  tabsRow: {
    flexDirection: "row",
    gap: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#171717",
  },
  tabLabel: { color: "#737373", fontSize: 14, fontWeight: "700" },
  tabLabelActive: { color: "#ffffff" },
  convRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  convAvatar: { width: 52, height: 52, borderRadius: 26 },
  convInfo: { flex: 1 },
  convName: { color: "#ffffff", fontSize: 13, fontWeight: "700" },
  convPreview: { color: "#a8a8a8", fontSize: 12, marginTop: 2 },
  emptyInbox: { alignItems: "center", padding: 40, marginTop: 20 },
  sendIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyInboxTitle: { color: "#ffffff", fontSize: 18, fontWeight: "800", marginBottom: 6 },
  emptyInboxSubtitle: { color: "#737373", fontSize: 13, textAlign: "center" },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#171717",
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerPartner: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerAvatar: { width: 36, height: 36, borderRadius: 18 },
  headerName: { color: "#ffffff", fontSize: 13, fontWeight: "700" },
  headerUsername: { color: "#737373", fontSize: 11 },
  messagesList: { padding: 16, gap: 10 },
  msgRow: { flexDirection: "row", width: "100%" },
  msgRowMe: { justifyContent: "flex-end" },
  msgRowThem: { justifyContent: "flex-start" },
  msgBubble: { maxWidth: "75%", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20 },
  bubbleMe: { backgroundColor: "#3797f0" },
  bubbleThem: { backgroundColor: "#262626" },
  msgText: { fontSize: 13, lineHeight: 18 },
  msgTextMe: { color: "#ffffff" },
  msgTextThem: { color: "#ffffff" },
  emptyMessages: { padding: 40, alignItems: "center" },
  emptyText: { color: "#737373", fontSize: 13 },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#171717",
    gap: 8,
  },
  chatInput: {
    flex: 1,
    backgroundColor: "#262626",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    color: "#ffffff",
    fontSize: 13,
  },
  sendBtn: { padding: 8 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "center", padding: 20 },
  modalCard: { backgroundColor: "#171717", borderRadius: 20, padding: 20, borderWidth: 1, borderColor: "#262626" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  modalTitle: { color: "#ffffff", fontSize: 16, fontWeight: "700" },
  noteInput: {
    backgroundColor: "#262626",
    borderRadius: 12,
    padding: 12,
    color: "#ffffff",
    fontSize: 13,
    marginBottom: 16,
  },
  shareNoteBtn: { backgroundColor: "#0095f6", paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  shareNoteBtnText: { color: "#ffffff", fontSize: 13, fontWeight: "700" },
});
