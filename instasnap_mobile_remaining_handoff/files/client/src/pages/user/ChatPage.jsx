import { useState, useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Search, SquarePen, Circle, Loader2, Send, ChevronDown, Music2, X } from 'lucide-react';
import api from '../../services/api';
import { useSocketContext } from '../../contexts/SocketContext';
import { formatDistanceToNowStrict } from 'date-fns';
import ChatDetail from '../../components/chat/ChatDetail';

import MusicPicker from '../../components/ui/MusicPicker';
import { Plus } from 'lucide-react';
const ChatPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user: authUser } = useSelector(state => state.auth);
  const { onlineUsers } = useSocketContext();
  
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('messages'); // 'messages' | 'requests'
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

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const lowerQuery = searchQuery.toLowerCase();
    
    return conversations.filter(conv => {
      const others = conv.participants.filter(p => p._id !== authUser?._id);
      return others.some(p => 
        p.username.toLowerCase().includes(lowerQuery) || 
        (p.fullName && p.fullName.toLowerCase().includes(lowerQuery))
      );
    });
  }, [conversations, searchQuery, authUser]);

  return (
    <div className="flex h-full w-full overflow-hidden bg-black text-white relative">
      <audio ref={audioRef} onEnded={() => setPlayingPreview(null)} />
      
      {/* Sidebar: Instagram Direct Inbox Panel (Screenshot 1) */}
      <div className={`w-full md:w-80 lg:w-[360px] border-r border-neutral-800 bg-black flex flex-col ${id ? 'hidden md:flex' : 'flex'}`}>
        
        {/* Header: Username Chevron + Compose Button */}
        <div className="px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5 cursor-pointer hover:opacity-80">
            <h1 className="text-xl font-extrabold text-white tracking-tight">
              {authUser?.username || 'Messages'}
            </h1>
            <ChevronDown className="w-4 h-4 text-white shrink-0 mt-0.5" />
          </div>

          <button className="p-2 rounded-full hover:bg-neutral-800 text-white transition-colors">
            <SquarePen className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-5 pb-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input 
              type="text" 
              placeholder="Search" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#262626] border-none rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-700 transition-colors"
            />
          </div>
        </div>

        {/* Music Notes Horizontal Carousel (Screenshot 1) */}
        <div className="px-4 py-3 flex items-center gap-4 overflow-x-auto scrollbar-none border-b border-neutral-900">
          {/* Add Note Button */}
          <div className="flex flex-col items-center shrink-0 w-16 cursor-pointer group" onClick={() => setShowAddNote(true)}>
            <div className="relative mb-1">
              <div className="w-14 h-14 rounded-full overflow-hidden border border-neutral-700 p-0.5 bg-black">
                <img src={authUser?.profilePicture || authUser?.avatar || "https://i.pravatar.cc/150"} alt="You" className="w-full h-full object-cover rounded-full opacity-60" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Plus className="w-6 h-6 text-white" />
              </div>
            </div>
            <span className="text-[11px] text-neutral-400 w-full text-center group-hover:text-white font-medium">
              Your Note
            </span>
          </div>

          {notes.map((note) => (
            <div key={note._id} className="flex flex-col items-center shrink-0 w-16 cursor-pointer group" onClick={() => togglePlayNote(note.songPreviewUrl)}>
              <div className="relative mb-1">
                {/* Floating Note/Music Badge */}
                {(note.text || note.songTitle) && (
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-neutral-800 border border-neutral-700 rounded-full text-[9px] font-semibold text-neutral-200 whitespace-nowrap shadow-md z-10 flex items-center gap-1 ${playingPreview === note.songPreviewUrl ? 'animate-pulse' : ''}`}>
                    {note.songTitle && <Music2 className="w-2.5 h-2.5 text-sky-400" />}
                    <span className="truncate max-w-[50px]">{note.text || note.songTitle}</span>
                  </div>
                )}

                <div className="w-14 h-14 rounded-full overflow-hidden border border-neutral-700 p-0.5 bg-black group-hover:scale-105 transition-transform">
                  <img src={note.author.profilePicture || note.author.avatar || "https://i.pravatar.cc/150"} alt={note.author.username} className="w-full h-full object-cover rounded-full" />
                </div>
              </div>

              <span className="text-[11px] text-neutral-400 truncate w-full text-center group-hover:text-white font-medium">
                {note.author._id === authUser._id ? 'You' : note.author.username}
              </span>
            </div>
          ))}
        </div>

        {/* Section Tabs: Messages / Requests */}
        <div className="px-5 py-3 flex items-center justify-between border-b border-neutral-900">
          <button 
            onClick={() => setActiveTab('messages')}
            className={`text-sm font-bold transition-colors ${activeTab === 'messages' ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
          >
            Messages
          </button>

          <button 
            onClick={() => setActiveTab('requests')}
            className={`text-xs font-semibold transition-colors ${activeTab === 'requests' ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
          >
            Requests
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto hide-scrollbar pb-safe-20 md:pb-0 divide-y divide-neutral-900/50">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center p-8 text-neutral-500 text-sm">
              <p>No messages found.</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {filteredConversations.map((conv) => {
                const otherParticipant = conv.participants.find(p => p._id !== authUser?._id);
                if (!otherParticipant) return null;

                const isOnline = onlineUsers?.includes(otherParticipant._id);
                const lastMsg = conv.latestMessage;
                
                let isUnread = false;
                if (lastMsg) {
                  isUnread = lastMsg.sender._id !== authUser?._id && lastMsg.status !== 'seen';
                }

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
                    className="flex items-center gap-3 px-5 py-3 hover:bg-neutral-900/80 transition-colors cursor-pointer group"
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div className="w-14 h-14 rounded-full overflow-hidden border border-neutral-800 group-hover:border-neutral-700">
                        <img 
                          src={otherParticipant.profilePicture || otherParticipant.avatar || "https://i.pravatar.cc/150"} 
                          alt={otherParticipant.username}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {isOnline && (
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-black" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className={`truncate text-sm ${isUnread ? 'font-bold text-white' : 'font-semibold text-neutral-200'}`}>
                        {otherParticipant.fullName || otherParticipant.username}
                      </h3>
                      
                      <div className="flex items-center gap-1.5 mt-0.5 text-xs text-neutral-400 truncate">
                        <p className={`truncate ${isUnread ? 'font-bold text-white' : ''}`}>
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
                            <span>Sent an attachment.</span>
                          )}
                        </p>
                        {timeStr && <span>· {timeStr}</span>}
                      </div>
                    </div>

                    {isUnread && (
                      <Circle className="w-2.5 h-2.5 fill-sky-500 text-sky-500 shrink-0 ml-1" />
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area (Empty State as seen in Screenshot 1) */}
      <div className={`flex-1 flex-col bg-black border-l border-neutral-800 relative ${id ? 'flex' : 'hidden md:flex'}`}>
        {id ? (
          <ChatDetail />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-24 h-24 rounded-full border-2 border-white flex items-center justify-center mb-5 text-white bg-black shadow-2xl">
              <Send className="w-10 h-10 stroke-[1.5] -mr-1" />
            </div>

            <h2 className="text-xl font-extrabold text-white mb-1">Your messages</h2>
            <p className="text-neutral-400 text-sm max-w-xs mb-6">Send a message to start a chat.</p>

            <button 
              onClick={() => {
                const first = conversations[0];
                if (first?._id) navigate(`/app/chat/${first._id}`);
              }}
              className="px-5 py-2 bg-[#0095F6] hover:bg-[#1877F2] text-white font-bold text-sm rounded-xl transition-colors shadow-lg"
            >
              Send message
            </button>
          </div>
        )}
      </div>
      {/* Add Note Modal */}
      {showAddNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 w-full max-w-sm rounded-xl overflow-hidden shadow-2xl border border-neutral-800 flex flex-col h-[500px]">
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
              <h3 className="text-white font-bold">New Note</h3>
              <button onClick={() => setShowAddNote(false)} className="text-neutral-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-4 flex flex-col gap-4">
              <input 
                type="text" 
                placeholder="Share a thought..." 
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                maxLength={60}
                className="w-full bg-neutral-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-1 focus:ring-neutral-600"
              />
              
              {selectedMusic ? (
                <div className="flex items-center gap-3 p-3 bg-neutral-800 rounded-lg relative">
                  <img src={selectedMusic.coverUrl} className="w-10 h-10 rounded-md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{selectedMusic.title}</p>
                    <p className="text-neutral-400 text-xs truncate">{selectedMusic.artist}</p>
                  </div>
                  <button onClick={() => setSelectedMusic(null)} className="absolute -top-2 -right-2 bg-neutral-700 rounded-full p-1"><X className="w-3 h-3 text-white"/></button>
                </div>
              ) : (
                <div className="flex-1 overflow-hidden">
                  <MusicPicker onSelect={setSelectedMusic} onClose={() => {}} />
                </div>
              )}
            </div>
            
            <div className="mt-auto p-4 border-t border-neutral-800">
              <button 
                onClick={handleAddNote}
                disabled={!noteText && !selectedMusic}
                className="w-full py-2.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-bold rounded-lg transition-colors"
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

