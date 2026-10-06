import { useState, useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Search, SquarePen, Loader2, Send, Music2, X, Plus, Users } from 'lucide-react';
import api from '../../services/api';
import { useSocketContext } from '../../contexts/SocketContext';
import { formatDistanceToNowStrict } from 'date-fns';
import ChatDetail from '../../components/chat/ChatDetail';
import MusicPicker from '../../components/ui/MusicPicker';
import { Avatar } from '../../components/ui/Avatar';
import { cn } from '../../utils/cn';

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'groups', label: 'Groups' },
];

// A conversation counts as unread when its latest message wasn't sent by us
// and hasn't been marked 'seen' yet — same rule the list row badge uses.
const isConvUnread = (conv, authUserId) => {
  const lastMsg = conv.latestMessage;
  if (!lastMsg) return false;
  const senderId = lastMsg.sender?._id || lastMsg.sender;
  return senderId !== authUserId && lastMsg.status !== 'seen';
};

const ChatPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user: authUser } = useSelector(state => state.auth);
  const { onlineUsers } = useSocketContext();

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [notes, setNotes] = useState([]);
  const [showAddNote, setShowAddNote] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [selectedMusic, setSelectedMusic] = useState(null);
  const [playingPreview, setPlayingPreview] = useState(null);
  const audioRef = useRef(null);
  const { socket } = useSocketContext();
  const [typingConversations, setTypingConversations] = useState({});

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await api.get('/api/conversations');
        if (res.data.success) {
          setConversations(res.data.data);
        }
      } catch (error) {
        console.error("Failed to load conversations:", error);
      } finally {
        setLoading(false);
      }
    };
    const fetchNotes = async () => {
      try {
        const res = await api.get('/api/notes');
        if (res.data.success) {
          setNotes(res.data.data);
        }
      } catch (error) {
        console.error("Failed to load notes:", error);
      }
    };
    fetchConversations();
    fetchNotes();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleTyping = ({ conversationId }) => {
      setTypingConversations(prev => ({ ...prev, [conversationId]: true }));
    };

    const handleStopTyping = ({ conversationId }) => {
      setTypingConversations(prev => ({ ...prev, [conversationId]: false }));
    };

    socket.on('typing', handleTyping);
    socket.on('stopTyping', handleStopTyping);

    return () => {
      socket.off('typing', handleTyping);
      socket.off('stopTyping', handleStopTyping);
    };
  }, [socket]);

  const handleAddNote = async () => {
    if (!noteText && !selectedMusic) return;
    try {
      const res = await api.post('/api/notes', {
        text: noteText,
        songTitle: selectedMusic?.title,
        songArtist: selectedMusic?.artist,
        songCoverUrl: selectedMusic?.coverUrl,
        songPreviewUrl: selectedMusic?.previewUrl
      });
      if (res.data.success) {
        setNotes([res.data.data, ...notes.filter(n => n.author._id !== authUser._id)]);
        setShowAddNote(false);
        setNoteText('');
        setSelectedMusic(null);
      }
    } catch (error) {
      console.error('Failed to add note', error);
    }
  };

  const togglePlayNote = (previewUrl) => {
    if (!previewUrl) return;
    if (playingPreview === previewUrl) {
      audioRef.current.pause();
      setPlayingPreview(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = previewUrl;
        audioRef.current.play();
      }
      setPlayingPreview(previewUrl);
    }
  };

  const unreadCount = useMemo(
    () => conversations.filter(c => isConvUnread(c, authUser?._id)).length,
    [conversations, authUser?._id]
  );

  const filteredConversations = useMemo(() => {
    let list = conversations;
    if (activeTab === 'unread') list = list.filter(c => isConvUnread(c, authUser?._id));
    else if (activeTab === 'groups') list = list.filter(c => c.isGroupChat);

    if (!searchQuery.trim()) return list;
    const lowerQuery = searchQuery.toLowerCase();

    return list.filter(conv => {
      const others = conv.participants.filter(p => p._id !== authUser?._id);
      const groupName = conv.isGroupChat ? conv.chatName : null;
      return (
        groupName?.toLowerCase().includes(lowerQuery) ||
        others.some(p =>
          p.username.toLowerCase().includes(lowerQuery) ||
          (p.fullName && p.fullName.toLowerCase().includes(lowerQuery))
        )
      );
    });
  }, [conversations, searchQuery, authUser, activeTab]);

  return (
    <div className="flex h-full w-full overflow-hidden gap-4 xl:gap-6 p-0 sm:p-2 xl:p-4 relative">
      <audio ref={audioRef} onEnded={() => setPlayingPreview(null)} />

      {/* Conversation list — left panel, warm cream card */}
      <div
        className={cn(
          "w-full md:w-[340px] lg:w-[380px] flex-col shrink-0 overflow-hidden",
          "bg-bg-surface border border-border-soft",
          "shadow-[0_4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_24px_60px_rgba(var(--glass-shadow),0.4)]",
          "sm:rounded-[28px]",
          id ? 'hidden md:flex' : 'flex',
        )}
      >
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between shrink-0 border-b border-border-soft">
          <h1 className="text-xl font-extrabold text-text-primary tracking-tight">Messages</h1>
          <button
            onClick={() => navigate('/app/explore')}
            className="w-9 h-9 rounded-full flex items-center justify-center text-text-secondary hover:text-primary-500 hover:bg-bg-surface-hover transition-colors"
            title="New message"
            aria-label="New message"
          >
            <SquarePen className="w-[18px] h-[18px]" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-5 pt-3 pb-1 shrink-0">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              placeholder="Search messages, people..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-bg-surface-hover border border-border-soft rounded-full pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-primary-500 transition-colors"
            />
          </div>
        </div>

        {/* Notes Carousel */}
        <div className="px-4 py-3 flex items-center gap-4 overflow-x-auto hide-scrollbar border-b border-border-soft shrink-0">
          {/* Add Note Button */}
          <div className="flex flex-col items-center shrink-0 w-16 cursor-pointer group" onClick={() => setShowAddNote(true)}>
            <div className="relative mb-1">
              <div className="w-14 h-14 rounded-full overflow-hidden border border-border-soft p-0.5 bg-bg-surface-hover">
                <img src={authUser?.profilePicture || authUser?.avatar || "https://i.pravatar.cc/150"} alt="You" className="w-full h-full object-cover rounded-full opacity-60" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center shadow-soft">
                  <Plus className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
            <span className="text-[11px] text-text-secondary w-full text-center group-hover:text-text-primary font-medium">
              Your Note
            </span>
          </div>

          {notes.map((note) => (
            <div key={note._id} className="flex flex-col items-center shrink-0 w-16 cursor-pointer group" onClick={() => togglePlayNote(note.songPreviewUrl)}>
              <div className="relative mb-1">
                {(note.text || note.songTitle) && (
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-bg-surface border border-border-soft rounded-full text-[9px] font-semibold text-text-primary whitespace-nowrap shadow-md z-10 flex items-center gap-1 ${playingPreview === note.songPreviewUrl ? 'animate-pulse' : ''}`}>
                    {note.songTitle && <Music2 className="w-2.5 h-2.5 text-primary-500" />}
                    <span className="truncate max-w-[50px]">{note.text || note.songTitle}</span>
                  </div>
                )}

                <div className="w-14 h-14 rounded-full overflow-hidden border border-border-soft p-0.5 bg-bg-surface-hover group-hover:scale-105 transition-transform">
                  <img src={note.author.profilePicture || note.author.avatar || "https://i.pravatar.cc/150"} alt={note.author.username} className="w-full h-full object-cover rounded-full" />
                </div>
              </div>

              <span className="text-[11px] text-text-secondary truncate w-full text-center group-hover:text-text-primary font-medium">
                {note.author._id === authUser._id ? 'You' : note.author.username}
              </span>
            </div>
          ))}
        </div>

        {/* Tabs: All / Unread / Groups */}
        <div className="px-5 py-3 border-b border-border-soft shrink-0">
          <div className="inline-flex items-center gap-1 rounded-full bg-bg-surface-hover border border-border-soft p-1">
            {TABS.map((t) => {
              const active = activeTab === t.id;
              const count = t.id === 'unread' ? unreadCount : null;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 flex items-center gap-1.5",
                    active ? "bg-primary-500 text-white shadow-soft" : "text-text-secondary hover:text-text-primary"
                  )}
                >
                  {t.label}
                  {!!count && (
                    <span className={cn(
                      "text-[10px] font-bold rounded-full px-1.5 min-w-[16px] leading-[16px] text-center",
                      active ? "bg-white/25 text-white" : "bg-primary-500 text-white"
                    )}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto hide-scrollbar pb-safe-20 md:pb-2">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center p-8 text-text-secondary text-sm">
              <p>
                {activeTab === 'unread' ? 'No unread messages.' : activeTab === 'groups' ? 'No group chats yet.' : 'No messages found.'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col px-2">
              {filteredConversations.map((conv) => {
                const others = conv.participants.filter(p => p._id !== authUser?._id);
                const isGroup = conv.isGroupChat;
                const primary = others[0];
                if (!isGroup && !primary) return null;

                const displayName = isGroup
                  ? (conv.chatName || others.map(p => p.username).join(', ') || 'Group chat')
                  : (primary.fullName || primary.username);

                const isOnline = !isGroup && onlineUsers?.includes(primary?._id);
                const isActive = conv._id === id;
                const isUnread = isConvUnread(conv, authUser?._id);
                const lastMsg = conv.latestMessage;

                let timeStr = '';
                if (lastMsg) {
                  try {
                    timeStr = formatDistanceToNowStrict(new Date(lastMsg.createdAt), { addSuffix: false });
                    timeStr = timeStr.replace(/ seconds?/, 's').replace(/ minutes?/, 'm').replace(/ hours?/, 'h').replace(/ days?/, 'd').replace(/ months?/, 'mo').replace(/ years?/, 'y');
                  } catch (e) {
                    timeStr = '';
                  }
                }

                return (
                  <Link
                    key={conv._id}
                    to={`/app/chat/${conv._id}`}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-2xl transition-colors cursor-pointer group",
                      isActive ? "bg-primary-500/10 ring-1 ring-primary-500/30" : "hover:bg-bg-surface-hover"
                    )}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <Avatar
                        src={primary?.profilePicture || primary?.avatar}
                        alt={displayName}
                        fallback={displayName?.charAt(0)?.toUpperCase()}
                        size="lg"
                        isOnline={isOnline}
                      />
                      {isGroup && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-primary-500 text-white flex items-center justify-center border-2 border-bg-surface">
                          <Users className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className={`truncate text-sm ${isUnread ? 'font-bold text-text-primary' : 'font-semibold text-text-primary/90'}`}>
                        {displayName}
                      </h3>

                      <div className="flex items-center gap-1.5 mt-0.5 text-xs text-text-secondary truncate">
                        <p className={`truncate ${isUnread ? 'font-semibold text-text-primary' : ''}`}>
                          {typingConversations[conv._id] ? (
                            <span className="text-primary-500 font-bold italic">typing...</span>
                          ) : lastMsg ? (
                            lastMsg.isDeleted ? (
                              <span className="italic">Message deleted</span>
                            ) : lastMsg.messageType === 'text' ? (
                              lastMsg.text
                            ) : (
                              <span className="capitalize">Sent an attachment</span>
                            )
                          ) : (
                            <span>Say hello 👋</span>
                          )}
                        </p>
                        {timeStr && <span>· {timeStr}</span>}
                      </div>
                    </div>

                    {isUnread && (
                      <span className="w-2.5 h-2.5 rounded-full bg-primary-500 shrink-0 ml-1" />
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main chat panel — right, warm cream card */}
      <div
        className={cn(
          "flex-1 min-w-0 flex-col relative overflow-hidden",
          "bg-bg-surface border border-border-soft",
          "shadow-[0_4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_24px_60px_rgba(var(--glass-shadow),0.4)]",
          "sm:rounded-[28px]",
          id ? 'flex' : 'hidden md:flex',
        )}
      >
        {id ? (
          <ChatDetail />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-24 h-24 rounded-full border-2 border-border-soft flex items-center justify-center mb-5 text-primary-500 bg-bg-surface-hover">
              <Send className="w-10 h-10 stroke-[1.5] -mr-1" />
            </div>

            <h2 className="text-xl font-extrabold text-text-primary mb-1">Your messages</h2>
            <p className="text-text-secondary text-sm max-w-xs mb-6">Send a message to start a chat.</p>

            <button
              className="orange-btn"
              onClick={() => {
                const first = conversations[0];
                if (first?._id) navigate(`/app/chat/${first._id}`);
              }}
            >
              Send message
            </button>
          </div>
        )}
      </div>

      {/* Add Note Modal */}
      {showAddNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-[rgba(var(--glass-strong),0.9)] backdrop-blur-3xl w-full max-w-sm rounded-[24px] overflow-hidden shadow-2xl border border-black/10 dark:border-white/20 flex flex-col h-[500px]">
            <div className="p-4 border-b border-black/8 dark:border-white/12 flex items-center justify-between">
              <h3 className="text-text-primary dark:text-white font-bold">New Note</h3>
              <button onClick={() => setShowAddNote(false)} className="text-text-secondary hover:text-text-primary dark:text-white/60 dark:hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-4 flex flex-col gap-4">
              <input
                type="text"
                placeholder="Share a thought..."
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                maxLength={60}
                className="w-full bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/12 text-text-primary dark:text-white placeholder:text-text-secondary dark:placeholder:text-white/50 rounded-lg px-4 py-3 focus:outline-none focus:border-[#FF6B35]"
              />

              {selectedMusic ? (
                <div className="flex items-center gap-3 p-3 bg-black/5 dark:bg-white/10 rounded-lg relative">
                  <img src={selectedMusic.coverUrl} className="w-10 h-10 rounded-md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-text-primary dark:text-white text-sm font-medium truncate">{selectedMusic.title}</p>
                    <p className="text-text-secondary dark:text-white/60 text-xs truncate">{selectedMusic.artist}</p>
                  </div>
                  <button onClick={() => setSelectedMusic(null)} className="absolute -top-2 -right-2 bg-black/10 dark:bg-white/20 rounded-full p-1"><X className="w-3 h-3 text-text-primary dark:text-white"/></button>
                </div>
              ) : (
                <div className="flex-1 overflow-hidden">
                  <MusicPicker onSelect={setSelectedMusic} onClose={() => {}} />
                </div>
              )}
            </div>

            <div className="mt-auto p-4 border-t border-black/8 dark:border-white/12">
              <button
                className="orange-btn w-full disabled:opacity-40 disabled:pointer-events-none"
                disabled={!noteText && !selectedMusic}
                onClick={handleAddNote}
              >
                Share
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
