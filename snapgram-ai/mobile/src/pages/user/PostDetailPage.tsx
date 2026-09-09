import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
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
  ChevronLeft,
  ChevronRight,
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  MoreHorizontal,
  MapPin,
  Sparkles,
  Trash2,
  Archive,
  ArchiveRestore,
  Edit3,
  X,
  Send,
} from "lucide-react-native";
import api from "../../services/api";

const { width } = Dimensions.get("window");

export default function PostDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const authUser = useSelector((state: any) => state.auth?.user);

  const [targetPost, setTargetPost] = useState<any>(null);
  const [targetLoading, setTargetLoading] = useState(true);

  // Stream state
  const [feedPosts, setFeedPosts] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [feedLoading, setFeedLoading] = useState(false);

  // Modals
  const [editingPost, setEditingPost] = useState<any>(null);
  const [editCaption, setEditCaption] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchTargetPost();
    fetchMorePosts(1, true);
  }, [id]);

  const fetchTargetPost = async () => {
    try {
      setTargetLoading(true);
      const res = await api.get(`/api/posts/${id}`);
      if (res.data.success) {
        setTargetPost(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load post details", err);
    } finally {
      setTargetLoading(false);
    }
  };

  const fetchMorePosts = async (pageNum: number, reset = false) => {
    try {
      setFeedLoading(true);
      const res = await api.get(`/api/posts/explore?page=${pageNum}&limit=6`);
      if (res.data.success) {
        const fetched = res.data.data?.posts || res.data.data || [];
        const filtered = fetched.filter((p: any) => p._id !== id);
        setFeedPosts((prev) => (reset ? filtered : [...prev, ...filtered]));
        if (fetched.length < 6) setHasMore(false);
      }
    } catch (e) {
      console.error("Failed to load more posts", e);
    } finally {
      setFeedLoading(false);
    }
  };

  const handleToggleArchive = async (postItem: any) => {
    try {
      const res = await api.put(`/api/posts/${postItem._id}/archive`);
      if (res.data.success) {
        const nextStatus = res.data.data.status;
        Alert.alert("Success", nextStatus === "archived" ? "Post moved to archive" : "Post restored to profile");
        if (targetPost && targetPost._id === postItem._id) {
          setTargetPost((prev: any) => ({ ...prev, status: nextStatus }));
        }
        setFeedPosts((prev) =>
          prev.map((p) => (p._id === postItem._id ? { ...p, status: nextStatus } : p))
        );
      }
    } catch (e) {
      Alert.alert("Error", "Failed to archive post");
    }
  };

  const handleDeletePost = async (postId: string) => {
    Alert.alert("Delete Post", "Are you sure you want to permanently delete this post?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const res = await api.delete(`/api/posts/${postId}`);
            if (res.data.success) {
              if (targetPost && targetPost._id === postId) {
                router.back();
              } else {
                setFeedPosts((prev) => prev.filter((p) => p._id !== postId));
              }
            }
          } catch (e) {
            Alert.alert("Error", "Failed to delete post");
          }
        },
      },
    ]);
  };

  const handleSaveEdit = async () => {
    if (!editingPost) return;
    setIsUpdating(true);
    try {
      const res = await api.put(`/api/posts/${editingPost._id}`, {
        caption: editCaption,
        location: editLocation,
      });
      if (res.data.success) {
        const updated = res.data.data;
        if (targetPost && targetPost._id === editingPost._id) {
          setTargetPost((prev: any) => ({ ...prev, caption: updated.caption, location: updated.location }));
        }
        setFeedPosts((prev) =>
          prev.map((p) => (p._id === editingPost._id ? { ...p, caption: updated.caption, location: updated.location } : p))
        );
        setEditingPost(null);
      }
    } catch (e) {
      Alert.alert("Error", "Failed to update post");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#f8fafc" />
        </Pressable>
        <Text style={styles.headerTitle}>Post Stream</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Main Target Post */}
        {targetLoading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#f43f5e" />
          </View>
        ) : targetPost ? (
          <PostCardView
            post={targetPost}
            isMain
            authUser={authUser}
            onArchive={handleToggleArchive}
            onDelete={handleDeletePost}
            onEdit={(p: any) => {
              setEditingPost(p);
              setEditCaption(p.caption || "");
              setEditLocation(p.location || "");
            }}
          />
        ) : (
          <View style={styles.centerBox}>
            <Text style={styles.emptyText}>Post not found</Text>
          </View>
        )}

        {/* Separator */}
        <View style={styles.separator}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Sparkles size={16} color="#f43f5e" />
            <Text style={styles.sepTitle}>More to Explore</Text>
          </View>
          <Text style={styles.sepSubtitle}>Keep scrolling for more posts</Text>
        </View>

        {/* Continuous Stream */}
        {feedPosts.map((postItem) => (
          <PostCardView
            key={postItem._id}
            post={postItem}
            isMain={false}
            authUser={authUser}
            onArchive={handleToggleArchive}
            onDelete={handleDeletePost}
            onEdit={(p: any) => {
              setEditingPost(p);
              setEditCaption(p.caption || "");
              setEditLocation(p.location || "");
            }}
          />
        ))}

        {feedLoading && (
          <View style={{ padding: 20, alignItems: "center" }}>
            <ActivityIndicator size="small" color="#f43f5e" />
          </View>
        )}
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={!!editingPost} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Post Details</Text>
              <Pressable onPress={() => setEditingPost(null)}>
                <X size={20} color="#9ca3af" />
              </Pressable>
            </View>
            <Text style={styles.label}>Caption</Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: "top" }]}
              multiline
              value={editCaption}
              onChangeText={setEditCaption}
              placeholder="Write a caption..."
              placeholderTextColor="#64748b"
            />
            <Text style={styles.label}>Location Tag</Text>
            <TextInput
              style={styles.input}
              value={editLocation}
              onChangeText={setEditLocation}
              placeholder="e.g. San Francisco, CA"
              placeholderTextColor="#64748b"
            />
            <View style={styles.modalBtns}>
              <Pressable onPress={() => setEditingPost(null)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleSaveEdit} disabled={isUpdating} style={styles.saveBtn}>
                <Text style={styles.saveBtnText}>{isUpdating ? "Saving..." : "Save Changes"}</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function PostCardView({ post, isMain, authUser, onArchive, onDelete, onEdit }: any) {
  const [liked, setLiked] = useState(post.isLiked || false);
  const [likesCount, setLikesCount] = useState(post.likesCount || post.likes?.length || 0);
  const [saved, setSaved] = useState(post.isSaved || false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [activeMediaIdx, setActiveMediaIdx] = useState(0);

  const isOwner = authUser?._id === post.user?._id || authUser?._id === post.user;
  const isArchived = post.status === "archived";

  useEffect(() => {
    if (post._id) {
      api
        .get(`/api/posts/${post._id}/comments`)
        .then((res) => {
          if (res.data.success) setComments(res.data.data || []);
        })
        .catch(() => {});
    }
  }, [post._id]);

  const handleLike = async () => {
    const next = !liked;
    setLiked(next);
    setLikesCount((prev: number) => (next ? prev + 1 : Math.max(0, prev - 1)));
    try {
      await api.post(`/api/posts/${post._id}/like`);
    } catch {
      setLiked(!next);
    }
  };

  const handleSave = async () => {
    const next = !saved;
    setSaved(next);
    try {
      await api.post(`/api/posts/${post._id}/save`);
    } catch {
      setSaved(!next);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    const text = newComment;
    setNewComment("");
    try {
      const res = await api.post(`/api/posts/${post._id}/comments`, { text });
      if (res.data.success) {
        setComments((prev) => [res.data.data, ...prev]);
      }
    } catch {}
  };

  const mediaList = post.media || [{ url: post.mediaUrl, type: post.mediaType || "image" }];

  return (
    <View style={[styles.card, isMain && styles.mainCard]}>
      {/* Author Header */}
      <View style={styles.authorRow}>
        <Pressable
          onPress={() => router.push(`/app/profile/${post.user?._id}` as any)}
          style={styles.authorInfo}
        >
          <Image
            source={{ uri: post.user?.profilePicture || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100" }}
            style={styles.authorAvatar}
          />
          <View>
            <Text style={styles.authorUsername}>@{post.user?.username || "user"}</Text>
            {post.location ? (
              <View style={styles.locRow}>
                <MapPin size={10} color="#f43f5e" />
                <Text style={styles.locText}>{post.location}</Text>
              </View>
            ) : null}
          </View>
        </Pressable>

        <Pressable onPress={() => setShowMenu(!showMenu)} style={styles.menuBtn}>
          <MoreHorizontal size={20} color="#9ca3af" />
        </Pressable>
      </View>

      {/* Menu Overlay */}
      {showMenu && (
        <View style={styles.menuDropdown}>
          {isOwner && (
            <>
              <Pressable
                onPress={() => {
                  setShowMenu(false);
                  onEdit(post);
                }}
                style={styles.menuItem}
              >
                <Edit3 size={14} color="#f8fafc" />
                <Text style={styles.menuItemText}>Edit Post</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setShowMenu(false);
                  onArchive(post);
                }}
                style={styles.menuItem}
              >
                <Archive size={14} color="#f59e0b" />
                <Text style={[styles.menuItemText, { color: "#f59e0b" }]}>
                  {isArchived ? "Unarchive" : "Archive"}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setShowMenu(false);
                  onDelete(post._id);
                }}
                style={styles.menuItem}
              >
                <Trash2 size={14} color="#ef4444" />
                <Text style={[styles.menuItemText, { color: "#ef4444" }]}>Delete Post</Text>
              </Pressable>
            </>
          )}
          <Pressable
            onPress={() => {
              setShowMenu(false);
              Alert.alert("Share", "Link copied to clipboard!");
            }}
            style={styles.menuItem}
          >
            <Share2 size={14} color="#f8fafc" />
            <Text style={styles.menuItemText}>Share Post</Text>
          </Pressable>
        </View>
      )}

      {/* Media View */}
      <View style={styles.mediaContainer}>
        <Image
          source={{ uri: mediaList[activeMediaIdx]?.url || "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600" }}
          style={styles.mediaImage}
        />
        {mediaList.length > 1 && (
          <View style={styles.carouselNav}>
            {activeMediaIdx > 0 && (
              <Pressable onPress={() => setActiveMediaIdx((p) => p - 1)} style={styles.navArrowLeft}>
                <ChevronLeft size={18} color="#fff" />
              </Pressable>
            )}
            {activeMediaIdx < mediaList.length - 1 && (
              <Pressable onPress={() => setActiveMediaIdx((p) => p + 1)} style={styles.navArrowRight}>
                <ChevronRight size={18} color="#fff" />
              </Pressable>
            )}
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={styles.cardActions}>
        <View style={styles.actionsLeft}>
          <Pressable onPress={handleLike} style={styles.actionBtn}>
            <Heart size={22} color={liked ? "#ef4444" : "#f8fafc"} fill={liked ? "#ef4444" : "transparent"} />
          </Pressable>
          <Pressable style={styles.actionBtn}>
            <MessageCircle size={22} color="#f8fafc" />
          </Pressable>
          <Pressable style={styles.actionBtn}>
            <Share2 size={22} color="#f8fafc" />
          </Pressable>
        </View>
        <Pressable onPress={handleSave} style={styles.actionBtn}>
          <Bookmark size={22} color={saved ? "#f43f5e" : "#f8fafc"} fill={saved ? "#f43f5e" : "transparent"} />
        </Pressable>
      </View>

      {/* Likes */}
      <Text style={styles.likesCountText}>{likesCount} Likes</Text>

      {/* Caption */}
      {post.caption ? (
        <View style={styles.captionRow}>
          <Text style={styles.captionUsername}>@{post.user?.username || "user"} </Text>
          <Text style={styles.captionText}>{post.caption}</Text>
        </View>
      ) : null}

      {/* Comments Preview */}
      {comments.length > 0 && (
        <View style={styles.commentsList}>
          {comments.slice(0, 3).map((c) => (
            <View key={c._id || Math.random().toString()} style={styles.commentItem}>
              <Text style={styles.commentUser}>@{c.user?.username || "user"} </Text>
              <Text style={styles.commentBody}>{c.text}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Add Comment Bar */}
      <View style={styles.commentInputRow}>
        <TextInput
          style={styles.commentInput}
          placeholder="Add a comment..."
          placeholderTextColor="#64748b"
          value={newComment}
          onChangeText={setNewComment}
        />
        <Pressable onPress={handleAddComment} disabled={!newComment.trim()} style={styles.sendCommentBtn}>
          <Send size={16} color={newComment.trim() ? "#f43f5e" : "#475569"} />
        </Pressable>
      </View>
    </View>
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
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 16, fontWeight: "800", color: "#f8fafc" },
  body: { flex: 1, paddingHorizontal: 12, paddingTop: 10 },
  centerBox: { padding: 40, alignItems: "center" },
  emptyText: { color: "#64748b", fontSize: 13 },
  separator: { marginVertical: 16, borderTopWidth: 1, borderTopColor: "#1e293b", paddingTop: 12 },
  sepTitle: { color: "#f8fafc", fontSize: 14, fontWeight: "700" },
  sepSubtitle: { color: "#64748b", fontSize: 11, marginTop: 2 },
  card: { backgroundColor: "#1e293b", borderRadius: 20, marginBottom: 18, overflow: "hidden" },
  mainCard: { borderWidth: 1, borderColor: "rgba(244, 63, 94, 0.4)" },
  authorRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 12 },
  authorInfo: { flexDirection: "row", alignItems: "center", gap: 10 },
  authorAvatar: { width: 38, height: 38, borderRadius: 19 },
  authorUsername: { color: "#f8fafc", fontSize: 13, fontWeight: "700" },
  locRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 },
  locText: { color: "#94a3b8", fontSize: 10 },
  menuBtn: { padding: 6 },
  menuDropdown: {
    backgroundColor: "#0f172a",
    borderRadius: 12,
    padding: 6,
    marginHorizontal: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#334155",
  },
  menuItem: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8, paddingHorizontal: 10 },
  menuItemText: { color: "#f8fafc", fontSize: 12, fontWeight: "600" },
  mediaContainer: { width: "100%", aspectRatio: 1, backgroundColor: "#000", position: "relative" },
  mediaImage: { width: "100%", height: "100%", resizeMode: "cover" },
  carouselNav: { ...StyleSheet.absoluteFillObject, justifyContent: "center" },
  navArrowLeft: { position: "absolute", left: 10, backgroundColor: "rgba(0,0,0,0.5)", padding: 6, borderRadius: 20 },
  navArrowRight: { position: "absolute", right: 10, backgroundColor: "rgba(0,0,0,0.5)", padding: 6, borderRadius: 20 },
  cardActions: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingTop: 10 },
  actionsLeft: { flexDirection: "row", alignItems: "center", gap: 14 },
  actionBtn: { padding: 4 },
  likesCountText: { color: "#f8fafc", fontSize: 12, fontWeight: "700", paddingHorizontal: 16, marginTop: 6 },
  captionRow: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, marginTop: 6 },
  captionUsername: { color: "#f8fafc", fontSize: 12, fontWeight: "700" },
  captionText: { color: "#cbd5e1", fontSize: 12 },
  commentsList: { paddingHorizontal: 16, marginTop: 8, gap: 4 },
  commentItem: { flexDirection: "row", flexWrap: "wrap" },
  commentUser: { color: "#f8fafc", fontSize: 11, fontWeight: "700" },
  commentBody: { color: "#94a3b8", fontSize: 11 },
  commentInputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
    marginTop: 8,
  },
  commentInput: { flex: 1, color: "#f8fafc", fontSize: 12, paddingVertical: 4 },
  sendCommentBtn: { padding: 6 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "center", padding: 20 },
  modalCard: { backgroundColor: "#1e293b", borderRadius: 20, padding: 20 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  modalTitle: { color: "#f8fafc", fontSize: 15, fontWeight: "700" },
  label: { color: "#94a3b8", fontSize: 11, fontWeight: "600", marginBottom: 4, marginTop: 8 },
  input: { backgroundColor: "#0f172a", borderRadius: 10, padding: 10, color: "#f8fafc", fontSize: 12 },
  modalBtns: { flexDirection: "row", gap: 10, marginTop: 16 },
  cancelBtn: { flex: 1, paddingVertical: 10, backgroundColor: "#334155", borderRadius: 10, alignItems: "center" },
  cancelBtnText: { color: "#94a3b8", fontSize: 12, fontWeight: "700" },
  saveBtn: { flex: 1, paddingVertical: 10, backgroundColor: "#f43f5e", borderRadius: 10, alignItems: "center" },
  saveBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },
});
