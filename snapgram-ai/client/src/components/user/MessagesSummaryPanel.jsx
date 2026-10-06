import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { SquarePen, Search } from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";
import api from "../../services/api";
import { useSocketContext } from "../../contexts/SocketContext";
import { SpatialPanel } from "../ui/spatial/SpatialPanel";
import { SpatialAvatar } from "../ui/spatial/SpatialAvatar";
import { SpatialTabs } from "../ui/spatial/SpatialTabs";
import { SpatialButton } from "../ui/spatial/SpatialButton";

const formatTimeShort = (dateStr) => {
  try {
    return formatDistanceToNowStrict(new Date(dateStr))
      .replace(/ seconds?/, "s").replace(/ minutes?/, "m").replace(/ hours?/, "h")
      .replace(/ days?/, "d").replace(/ months?/, "mo").replace(/ years?/, "y");
  } catch {
    return "";
  }
};

// Right-column "Messages" glass panel shown on the Home page (desktop, xl+).
// Uses the same conversations/notes endpoints as the full Chat page.
export const MessagesSummaryPanel = () => {
  const { user: authUser } = useSelector((state) => state.auth);
  const { onlineUsers } = useSocketContext();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("primary");
  const [query, setQuery] = useState("");

  useEffect(() => {
    Promise.all([
      api.get("/api/conversations"),
      api.get("/api/notes"),
    ])
      .then(([convRes, notesRes]) => {
        if (convRes.data.success) setConversations(convRes.data.data);
        if (notesRes.data.success) setNotes(notesRes.data.data);
      })
      .catch((err) => console.error("Failed to load messages summary", err))
      .finally(() => setLoading(false));
  }, []);

  // NOTE: the backend has no concept of message "requests" yet — the Requests
  // tab mirrors the same (visual-only) affordance already present on the full
  // Chat page. Both tabs list the same conversations, filtered by search.
  const filtered = useMemo(() => {
    let list = conversations;
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((conv) => {
        const other = conv.participants.find((p) => p._id !== authUser?._id);
        return other && (other.username?.toLowerCase().includes(q) || other.fullName?.toLowerCase().includes(q));
      });
    }
    return list.slice(0, 8);
  }, [conversations, query, authUser]);

  return (
    <SpatialPanel
      className="h-full"
      header={
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-text-primary tracking-tight">Messages</h2>
            <Link
              to="/app/chat"
              aria-label="Compose new message"
              className="w-9 h-9 rounded-full flex items-center justify-center bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 border border-black/8 dark:border-white/15 text-text-primary transition-colors"
            >
              <SquarePen className="w-4 h-4" />
            </Link>
          </div>

          {/* Notes row */}
          <div className="flex items-center gap-3 overflow-x-auto hide-scrollbar -mx-1 px-1">
            <div className="flex flex-col items-center gap-1 shrink-0 w-14">
              <SpatialAvatar
                src={authUser?.profilePicture || authUser?.avatar}
                fallback={authUser?.username?.charAt(0)?.toUpperCase() || "U"}
                size="sm"
              />
              <span className="text-[10px] text-text-secondary truncate w-full text-center">Your note</span>
            </div>
            {notes.filter((n) => n.author._id !== authUser?._id).slice(0, 5).map((note) => (
              <div key={note._id} className="flex flex-col items-center gap-1 shrink-0 w-14">
                <SpatialAvatar
                  src={note.author.profilePicture || note.author.avatar}
                  fallback={note.author.username?.charAt(0)?.toUpperCase()}
                  size="sm"
                />
                <span className="text-[10px] text-text-secondary truncate w-full text-center">{note.author.username}</span>
              </div>
            ))}
          </div>
        </div>
      }
      footer={
        <SpatialButton variant="glass" size="sm" className="w-full" onClick={() => navigate("/app/chat")} icon={SquarePen}>
          New message
        </SpatialButton>
      }
    >
      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search in messages"
          className="w-full h-9 pl-10 pr-3 rounded-full bg-black/5 dark:bg-white/10 border border-black/8 dark:border-white/12 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-[#FF6B35]/40 transition-colors"
        />
      </div>

      <SpatialTabs
        className="mb-3 w-full justify-between"
        tabs={[
          { id: "primary", label: "Primary" },
          { id: "requests", label: "Requests" },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      <div className="space-y-1">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-2">
              <div className="w-11 h-11 rounded-full bg-white/8 animate-pulse shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-24 rounded bg-white/8 animate-pulse" />
                <div className="h-2.5 w-32 rounded bg-white/8 animate-pulse" />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <p className="text-text-secondary text-xs text-center py-6">No conversations found.</p>
        ) : (
          filtered.map((conv) => {
            const other = conv.participants.find((p) => p._id !== authUser?._id);
            if (!other) return null;
            const isOnline = onlineUsers?.includes(other._id);
            const lastMsg = conv.latestMessage;
            const isUnread = lastMsg && lastMsg.sender._id !== authUser?._id && lastMsg.status !== "seen";

            return (
              <Link
                key={conv._id}
                to={`/app/chat/${conv._id}`}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors group"
              >
                <SpatialAvatar
                  src={other.profilePicture || other.avatar}
                  fallback={other.username?.charAt(0)?.toUpperCase()}
                  size="sm"
                  isOnline={isOnline}
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm truncate ${isUnread ? "font-bold text-text-primary" : "font-semibold text-text-secondary"}`}>
                    {other.fullName || other.username}
                  </p>
                  <p className={`text-xs truncate ${isUnread ? "text-text-primary font-semibold" : "text-text-secondary"}`}>
                    {lastMsg ? (lastMsg.isDeleted ? "Message deleted" : lastMsg.messageType === "text" ? lastMsg.text : "Sent an attachment") : "Say hello"}
                  </p>
                </div>
                {lastMsg && (
                  <span className="text-[10px] text-text-secondary shrink-0">{formatTimeShort(lastMsg.createdAt)}</span>
                )}
              </Link>
            );
          })
        )}
      </div>
    </SpatialPanel>
  );
};
