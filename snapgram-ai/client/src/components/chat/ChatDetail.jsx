import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  ArrowLeft, 
  MoreVertical, 
  Image as ImageIcon, 
  Smile, 
  Mic, 
  Send, 
  Loader2, 
  Check, 
  CheckCheck, 
  Camera, 
  Flame, 
  Clock, 
  ShieldAlert, 
  Grid, 
  Paperclip, 
  Phone, 
  Video, 
  X,
  Play,
  Pause
} from 'lucide-react';
import api from '../../services/api';
import { useSocketContext } from '../../contexts/SocketContext';
import EmojiPicker from 'emoji-picker-react';
import { format, isSameDay, isToday, isYesterday, formatDistanceToNow } from 'date-fns';
import { useToast } from '../ui/Toast';
import { SnapViewerModal } from './SnapViewerModal';
import { ConversationPresenceAvatar } from './ConversationPresenceAvatar';
import MessageBubble from './MessageBubble';
import { ImageViewerModal } from './ImageViewerModal';

export default function ChatDetail() {
  const { id: conversationId } = useParams();
  const navigate = useNavigate();
  const { user: authUser } = useSelector(state => state.auth);
  const { socket, onlineUsers } = useSocketContext();
  const { showToast } = useToast();
  
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [otherUser, setOtherUser] = useState(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showNewMessageIndicator, setShowNewMessageIndicator] = useState(false);
  
  const scrollContainerRef = useRef(null);
  
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [remoteTyping, setRemoteTyping] = useState(false);
  const [isOtherUserPresent, setIsOtherUserPresent] = useState(false);
  
  // Audio Voice Recording State
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const voiceTimerRef = useRef(null);

  // Snap & Media State
  const [activeSnap, setActiveSnap] = useState(null);
  const [showMediaGallery, setShowMediaGallery] = useState(false);
  const [showDisappearingSettings, setShowDisappearingSettings] = useState(false);
  const [disappearingMode, setDisappearingMode] = useState('24h'); // 'off', '24h', '7d'
  
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [activeImage, setActiveImage] = useState(null);

  // Emoji Reactions
  const [reactionMenuMsgId, setReactionMenuMsgId] = useState(null);
  const [messageReactions, setMessageReactions] = useState({}); // { msgId: ['❤️', '🔥'] }

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    const fetchChat = async () => {
      try {
        setLoading(true);
        const convRes = await api.get('/api/conversations');
        if (convRes.data.success) {
          const currentConv = convRes.data.data.find(c => c._id === conversationId);
          if (currentConv) {
            const partner = currentConv.participants.find(p => p._id !== authUser?._id);
            setOtherUser(partner);
          }
        }

        const msgRes = await api.get(`/api/messages/${conversationId}?limit=30`);
        if (msgRes.data.success) {
          setMessages(msgRes.data.data);
          if (msgRes.data.data.length < 30) setHasMoreMessages(false);
        }
      } catch (error) {
        console.error("Error loading chat:", error);
        if (error.response?.status === 404) {
          showToast('error', 'Not Found', 'This conversation could not be found.');
          navigate('/app/messages');
        }
      } finally {
        setLoading(false);
        // Initial scroll to bottom
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView();
        }, 100);
      }
    };
    if (conversationId) fetchChat();
  }, [conversationId, authUser]);

  const loadMoreMessages = async () => {
    if (isLoadingMore || !hasMoreMessages || messages.length === 0) return;
    
    try {
      setIsLoadingMore(true);
      const oldestMessageId = messages[0]._id;
      const res = await api.get(`/api/messages/${conversationId}?before=${oldestMessageId}&limit=30`);
      
      if (res.data.success) {
        const newOlderMessages = res.data.data;
        if (newOlderMessages.length < 30) setHasMoreMessages(false);
        
        if (newOlderMessages.length > 0) {
          const container = scrollContainerRef.current;
          const prevScrollHeight = container ? container.scrollHeight : 0;
          
          setMessages(prev => [...newOlderMessages, ...prev]);
          
          // Maintain scroll position
          setTimeout(() => {
            if (container) {
              container.scrollTop = container.scrollHeight - prevScrollHeight;
            }
          }, 0);
        }
      }
    } catch (err) {
      console.error("Error loading more messages:", err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    
    // Load older messages if at the top
    if (scrollTop === 0) {
      loadMoreMessages();
    }
    
    // Hide new message indicator if user scrolled to bottom
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    if (isAtBottom && showNewMessageIndicator) {
      setShowNewMessageIndicator(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowNewMessageIndicator(false);
  };

  // Smart auto-scroll when new message arrives
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
    const isLatestMessageMine = messages.length > 0 && 
                               (messages[messages.length - 1].sender?._id || messages[messages.length - 1].sender) === authUser?._id;

    if (isAtBottom || isLatestMessageMine || remoteTyping) {
      scrollToBottom();
    } else {
      setShowNewMessageIndicator(true);
    }
  }, [messages.length, remoteTyping]);

  // Socket Event Listeners
  useEffect(() => {
    if (!socket || !conversationId) return;

    // Join conversation room for presence
    socket.emit('joinConversation', conversationId);

    const handleNewMessage = (msg) => {
      const msgConvId = typeof msg.conversation === 'object' ? (msg.conversation._id || msg.conversation.toString()) : msg.conversation;
      if (msgConvId === conversationId) {
        setMessages(prev => {
          // Socket Deduping: if it matches an optimistic message, replace it
          const existingIndex = prev.findIndex(m => m._id === msg._id || (msg.clientMessageId && m.clientMessageId === msg.clientMessageId));
          if (existingIndex !== -1) {
            const newMessages = [...prev];
            newMessages[existingIndex] = msg;
            return newMessages;
          }
          return [...prev, msg];
        });
      }
    };

    const handleTyping = ({ userId, conversationId: typingConvId }) => {
      if (typingConvId === conversationId && otherUser && userId === otherUser._id) {
        setRemoteTyping(true);
      }
    };

    const handleStopTyping = ({ userId, conversationId: typingConvId }) => {
      if (typingConvId === conversationId && otherUser && userId === otherUser._id) {
        setRemoteTyping(false);
      }
    };

    const handleMessagesSeen = ({ conversationId: id }) => {
      if (id === conversationId) {
        setMessages(prev => prev.map(msg => 
          msg.sender._id === authUser?._id && msg.status !== 'seen' ? { ...msg, status: 'seen' } : msg
        ));
      }
    };

    const handleScreenshotNotification = ({ takenBy, takenAt }) => {
      showToast(`📷 @${takenBy} took a screenshot of your snap!`, 'error');
    };

    const handleChatScreenshotNotification = ({ takenBy }) => {
      showToast(`📷 @${takenBy} took a screenshot of this chat!`, 'error');
    };

    const handlePresenceUpdate = (userIds) => {
      if (otherUser && userIds.includes(otherUser._id)) {
        setIsOtherUserPresent(true);
      } else {
        setIsOtherUserPresent(false);
      }
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('typing', handleTyping);
    socket.on('stopTyping', handleStopTyping);
    socket.on('messagesSeen', handleMessagesSeen);
    socket.on('screenshotNotification', handleScreenshotNotification);
    socket.on('chatScreenshotNotification', handleChatScreenshotNotification);
    socket.on('conversationPresenceUpdate', handlePresenceUpdate);

    return () => {
      socket.emit('leaveConversation', conversationId);
      socket.off('newMessage', handleNewMessage);
      socket.off('typing', handleTyping);
      socket.off('stopTyping', handleStopTyping);
      socket.off('messagesSeen', handleMessagesSeen);
      socket.off('screenshotNotification', handleScreenshotNotification);
      socket.off('chatScreenshotNotification', handleChatScreenshotNotification);
      socket.off('conversationPresenceUpdate', handlePresenceUpdate);
    };
  }, [socket, conversationId, otherUser]);

  // Global Chat Screenshot Detection
  useEffect(() => {
    if (!socket || !otherUser) return;

    const handleKeyDown = (e) => {
      const isMacScreenshot = e.metaKey && e.shiftKey && ['3', '4', '5', 's'].includes(e.key.toLowerCase());
      if (e.key === 'PrintScreen' || isMacScreenshot) {
        // Assuming user has screenshot detection enabled if they are chatting,
        // (Realistically we would check user settings here, but sending the event is safe)
        socket.emit('chatScreenshot', { conversationId, receiverId: otherUser._id });
        showToast("Screenshot captured! Sender may be notified.", "warning");
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        socket.emit('chatScreenshot', { conversationId, receiverId: otherUser._id });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [socket, otherUser, conversationId]);

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;

    if (!socket || !otherUser || !conversationId) return;
    
    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing', conversationId);
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('stopTyping', conversationId);
    }, 2000);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if ((!newMessage.trim() && selectedFiles.length === 0) || !otherUser) return;

    const text = newMessage;
    const currentFiles = [...selectedFiles];
    
    setNewMessage('');
    // reset textarea height
    const textarea = document.querySelector('textarea');
    if (textarea) textarea.style.height = 'auto';

    setSelectedFiles([]);
    setShowEmojiPicker(false);
    
    if (socket && isTyping) {
      clearTimeout(typingTimeoutRef.current);
      setIsTyping(false);
      socket.emit('stopTyping', conversationId);
    }

    // Handle File Uploads first if any
    let uploadedMediaUrl = null;
    let messageType = 'text';

    if (currentFiles.length > 0) {
      setIsUploading(true);
      const file = currentFiles[0]; // For simplicity, handle one file per message for now
      const formData = new FormData();
      formData.append('image', file); // the backend expects 'image' for upload route

      if (file.type.startsWith('image/')) messageType = 'image';
      else if (file.type.startsWith('video/')) messageType = 'video';
      else messageType = 'file';

      try {
        const uploadRes = await api.post('/api/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (uploadRes.data.success) {
          uploadedMediaUrl = uploadRes.data.url;
        }
      } catch (err) {
        console.error("Upload error", err);
        showToast("Failed to upload file", "error");
        setIsUploading(false);
        return; // Stop if upload fails
      }
      setIsUploading(false);
    }

    // Optimistic UI update
    const clientMessageId = `temp-${Date.now()}`;
    const optimisticMessage = {
      _id: clientMessageId,
      clientMessageId,
      conversation: conversationId,
      sender: authUser,
      text,
      mediaUrl: uploadedMediaUrl,
      messageType,
      status: 'sending',
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, optimisticMessage]);

    try {
      const res = await api.post(`/api/messages/${conversationId}`, { 
        text, 
        mediaUrl: uploadedMediaUrl, 
        messageType,
        clientMessageId
      });
      if (res.data.success) {
        // Replace optimistic message with real message
        setMessages(prev => prev.map(m => m.clientMessageId === clientMessageId ? res.data.data : m));
      }
    } catch (error) {
      showToast("Failed to send message", "error");
      setMessages(prev => prev.map(m => m.clientMessageId === clientMessageId ? { ...m, status: 'failed' } : m));
    }
  };

  // Voice Note Recorder
  const startVoiceRecording = async () => {
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(audioStream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('image', audioBlob, `voice_${Date.now()}.webm`);

        try {
          const uploadRes = await api.post('/api/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          if (uploadRes.data.success) {
            const res = await api.post(`/api/messages/${conversationId}`, {
              messageType: 'voice',
              mediaUrl: uploadRes.data.data.url,
              duration: recordingSeconds
            });
            if (res.data.success) setMessages(prev => [...prev, res.data.data]);
          }
        } catch (e) {
          showToast('Failed to upload voice note', 'error');
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecordingVoice(true);
      setRecordingSeconds(0);

      voiceTimerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } catch (e) {
      showToast('Microphone access denied', 'error');
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecordingVoice) {
      mediaRecorderRef.current.stop();
      setIsRecordingVoice(false);
      if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
    }
  };

  const handleAddReaction = useCallback((msgId, emoji) => {
    setMessageReactions(prev => ({
      ...prev,
      [msgId]: [...(prev[msgId] || []), emoji]
    }));
    setReactionMenuMsgId(null);
  }, []);

  const isOnline = otherUser ? onlineUsers?.includes(otherUser._id) : false;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-bg-surface h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-bg-surface w-full relative overflow-hidden">
      
      {/* Top Navigation Header */}
      <div className="h-16 border-b border-border-soft flex items-center justify-between px-4 bg-bg-base shrink-0 z-20">
        <div className="flex items-center gap-3">
          <Link to="/app/chat" className="md:hidden p-2 -ml-2 text-text-primary hover:bg-bg-surface rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Link to={`/app/profile/${otherUser?._id}`} className="relative group shrink-0">
            <img src={otherUser?.profilePicture || "https://i.pravatar.cc/150"} alt="avatar" className="w-10 h-10 rounded-full object-cover border border-primary-500/30 group-hover:opacity-80 transition-opacity" />
            {isOnline && <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-bg-base rounded-full" />}
          </Link>
          <div>
            <Link to={`/app/profile/${otherUser?._id}`} className="font-bold text-text-primary text-sm flex items-center gap-1 hover:underline">
              {otherUser?.fullName || otherUser?.username}
            </Link>
            <span className="text-[11px] text-text-secondary flex items-center h-4">
              {remoteTyping ? (
                <span className="text-primary-500 font-bold flex items-center gap-0.5">
                  <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                  <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                  <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
                </span>
              ) : isOnline ? (
                'Active Now'
              ) : (
                otherUser?.lastSeen ? `Active ${formatDistanceToNow(new Date(otherUser.lastSeen))} ago` : 'Offline'
              )}
            </span>
          </div>
        </div>

        {/* Action Header Icons */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowDisappearingSettings(!showDisappearingSettings)}
            className={`p-2.5 rounded-full glass text-xs font-bold transition-colors flex items-center gap-1 ${disappearingMode !== 'off' ? 'text-primary-400 border border-primary-500/40' : 'text-text-secondary'}`}
            title="Disappearing Messages"
          >
            <Clock className="w-4 h-4" /> {disappearingMode}
          </button>
          <button onClick={() => setShowMediaGallery(true)} className="p-2.5 rounded-full hover:bg-bg-surface text-text-secondary hover:text-text-primary">
            <Grid className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Disappearing Messages Settings Bar */}
      {showDisappearingSettings && (
        <div className="bg-bg-base/90 p-3 border-b border-border-soft flex items-center justify-between text-xs text-text-secondary px-6 animate-fadeIn">
          <span>Disappearing Messages Auto-Delete:</span>
          <div className="flex items-center gap-2">
            {['off', '24h', '7d'].map(mode => (
              <button 
                key={mode} 
                onClick={() => setDisappearingMode(mode)}
                className={`px-3 py-1 rounded-full uppercase font-bold transition-all ${disappearingMode === mode ? 'bg-primary-500 text-white shadow-glow' : 'glass text-text-secondary'}`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Messages List */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 relative"
      >
        {isLoadingMore && (
          <div className="flex justify-center p-2 mb-2">
            <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
          </div>
        )}
        {messages.map((msg, index) => {
          const prevMsg = messages[index - 1];
          const isMine = (msg.sender?._id?.toString() || msg.sender?.toString()) === authUser?._id?.toString();
          const prevIsMine = prevMsg ? ((prevMsg.sender?._id?.toString() || prevMsg.sender?.toString()) === authUser?._id?.toString()) : null;
          
          let showDateSeparator = false;
          let dateText = '';
          const msgDate = new Date(msg.createdAt || Date.now());
          
          if (!prevMsg) {
            showDateSeparator = true;
          } else {
            const prevDate = new Date(prevMsg.createdAt || Date.now());
            if (!isSameDay(msgDate, prevDate)) {
              showDateSeparator = true;
            }
          }

          if (showDateSeparator) {
            if (isToday(msgDate)) dateText = 'Today';
            else if (isYesterday(msgDate)) dateText = 'Yesterday';
            else dateText = format(msgDate, 'MMM d, yyyy');
          }

          const isFirstInGroup = !prevMsg || showDateSeparator || isMine !== prevIsMine;

          return (
            <div key={msg.clientMessageId || msg._id}>
              {showDateSeparator && (
                <div className="flex justify-center my-6">
                  <span className="text-[11px] font-bold text-text-secondary bg-bg-surface px-3 py-1 rounded-full border border-border-soft">
                    {dateText}
                  </span>
                </div>
              )}
              <div className={`${isFirstInGroup && !showDateSeparator && index !== 0 ? 'mt-4' : 'mt-1'}`}>
                <MessageBubble 
                  msg={msg}
                  isMine={isMine}
                  isFirstInGroup={isFirstInGroup}
                  reactions={messageReactions[msg._id] || []}
                  reactionMenuMsgId={reactionMenuMsgId}
                  setReactionMenuMsgId={setReactionMenuMsgId}
                  handleAddReaction={handleAddReaction}
                  setActiveSnap={setActiveSnap}
                  onImageClick={setActiveImage}
                />
              </div>
            </div>
          );
        })}
        
        {/* Real-time Typing Indicator in Chat */}
        {remoteTyping && (
          <div className="flex items-start mt-4 animate-fadeIn">
            <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 mr-2 opacity-70">
              <img src={otherUser?.profilePicture || "https://i.pravatar.cc/150"} alt="Typing" className="w-full h-full object-cover" />
            </div>
            <div className="bg-bg-base border border-border-soft px-4 py-3 rounded-2xl rounded-tl-none inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-text-secondary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1.5 h-1.5 bg-text-secondary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1.5 h-1.5 bg-text-secondary rounded-full animate-bounce"></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} className="h-4" />
      </div>

      {showNewMessageIndicator && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 animate-bounce">
          <button 
            onClick={scrollToBottom}
            className="flex items-center gap-1 px-4 py-1.5 bg-primary-500 text-white text-xs font-bold rounded-full shadow-lg border border-primary-400"
          >
            ↓ New Message
          </button>
        </div>
      )}

      {/* Voice Recording Active Bar */}
      {isRecordingVoice && (
        <div className="p-3 bg-red-500/10 border-t border-red-500/20 flex items-center justify-between text-xs text-red-500 px-6 animate-pulse">
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4" /> Recording Voice Note... ({recordingSeconds}s)
          </div>
          <button onClick={stopVoiceRecording} className="font-bold text-white bg-red-500 px-3 py-1 rounded-full">
            Send Voice Note
          </button>
        </div>
      )}


      {/* Media Staging Area */}
      {selectedFiles.length > 0 && (
        <div className="bg-bg-surface border-t border-border-soft p-3 flex gap-3 overflow-x-auto">
          {selectedFiles.map((file, idx) => (
            <div key={idx} className="relative shrink-0">
              <div className="w-16 h-16 bg-bg-base border border-border-soft rounded-lg flex items-center justify-center text-xs overflow-hidden">
                {file.type.startsWith('image/') ? (
                  <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt="preview" />
                ) : file.type.startsWith('video/') ? (
                  <Video className="w-6 h-6 text-primary-500" />
                ) : (
                  <span className="truncate max-w-[50px] p-1">{file.name}</span>
                )}
              </div>
              <button 
                type="button"
                onClick={() => removeSelectedFile(idx)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-md hover:scale-110 transition-transform"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Message & Controls Toolbar */}
      <form
        onSubmit={handleSendMessage}
        className="shrink-0 z-20 border-t border-border-soft bg-bg-base relative"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {/* Snapchat-Style Real-time Presence Avatar */}
        <div className="absolute bottom-full left-0 w-full pointer-events-none">
          <ConversationPresenceAvatar 
            otherUser={otherUser} 
            isPresent={isOtherUserPresent} 
            isTyping={remoteTyping} 
          />
        </div>
        {isUploading && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-bg-surface overflow-hidden">
            <div className="h-full bg-primary-500 animate-pulse w-full"></div>
          </div>
        )}
        <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2.5">
          <label className="min-w-[44px] min-h-[44px] flex items-center justify-center text-text-secondary hover:text-text-primary rounded-full hover:bg-bg-surface shrink-0 cursor-pointer">
            <Paperclip className="w-5 h-5" />
            <input 
              type="file" 
              multiple 
              className="hidden" 
              onChange={handleFileSelect}
              accept="image/*,video/*,.pdf,.doc,.docx,.txt"
            />
          </label>

          <button 
            type="button" 
            onClick={() => setShowEmojiPicker(!showEmojiPicker)} 
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-text-secondary hover:text-text-primary rounded-full hover:bg-bg-surface shrink-0"
            aria-label="Emoji picker"
          >
            <Smile className="w-5 h-5" />
          </button>

          <button 
            type="button" 
            onClick={isRecordingVoice ? stopVoiceRecording : startVoiceRecording}
            className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full transition-colors shrink-0 ${isRecordingVoice ? 'text-red-500 bg-red-500/10 animate-bounce' : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface'}`}
            aria-label={isRecordingVoice ? 'Stop recording' : 'Start voice note'}
          >
            <Mic className="w-5 h-5" />
          </button>

          <textarea 
            placeholder="Send a chat or snap..."
            value={newMessage}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            rows={1}
            className="flex-1 min-w-0 py-2.5 px-4 rounded-2xl bg-bg-surface border border-border-soft text-sm text-text-primary focus:outline-none focus:border-primary-500 min-h-[44px] resize-none overflow-y-auto"
            style={{ maxHeight: '120px' }}
          />

          <button 
            type="submit" 
            disabled={(!newMessage.trim() && selectedFiles.length === 0) || isUploading} 
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hero-gradient text-white disabled:opacity-40 shadow-glow shadow-primary-500/30 shrink-0"
            aria-label="Send message"
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </form>

      {/* Emoji Picker Popover */}
      {showEmojiPicker && (
        <div className="absolute bottom-20 left-2 right-2 sm:left-4 sm:right-auto z-50 shadow-2xl max-w-[350px]">
          <EmojiPicker onEmojiClick={(emoji) => setNewMessage(prev => prev + emoji.emoji)} width="100%" />
        </div>
      )}

      {/* Snap Viewer Modal */}
      {activeSnap && (
        <SnapViewerModal 
          snap={activeSnap} 
          onClose={() => setActiveSnap(null)} 
          onSnapExpired={(id) => setMessages(prev => prev.filter(m => m._id !== id))}
        />
      )}

      {/* Chat Media Gallery Drawer */}
      {showMediaGallery && (
        <div className="absolute inset-y-0 right-0 w-full sm:w-80 bg-bg-base border-l border-border-soft z-40 p-4 shadow-2xl flex flex-col">
          <div className="flex items-center justify-between border-b border-border-soft pb-3 mb-4">
            <h3 className="font-bold text-sm text-text-primary flex items-center gap-2">
              <Grid className="w-4 h-4 text-primary-500" /> Shared Media Gallery
            </h3>
            <button onClick={() => setShowMediaGallery(false)} className="text-text-secondary hover:text-text-primary min-w-[44px] min-h-[44px] flex items-center justify-center">✕</button>
          </div>

          <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-2 gap-2">
            {messages.filter(m => m.mediaUrl).map((m, idx) => (
              <div key={idx} className="aspect-square rounded-xl overflow-hidden bg-black border border-white/5">
                {m.messageType === 'video' ? (
                  <video src={m.mediaUrl} className="w-full h-full object-cover" />
                ) : (
                  <img src={m.mediaUrl} alt="Shared media" className="w-full h-full object-cover" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full Screen Image Viewer Modal */}
      <ImageViewerModal src={activeImage} onClose={() => setActiveImage(null)} />
    </div>
  );
}
