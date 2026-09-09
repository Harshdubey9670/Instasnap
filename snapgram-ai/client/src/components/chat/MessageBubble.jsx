import React from 'react';
import { Camera, Check, CheckCheck, AlertCircle, Play, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

const MessageBubble = ({ 
  msg, 
  isMine, 
  reactions, 
  reactionMenuMsgId, 
  setReactionMenuMsgId, 
  handleAddReaction, 
  setActiveSnap,
  onImageClick,
  onOpenStory,
  isFirstInGroup
}) => {
  const storyObj = typeof msg.story === 'object' ? msg.story : null;
  const isStoryExpired = storyObj ? (storyObj.expiresAt && new Date(storyObj.expiresAt) < new Date()) : false;
  const isStoryUnavailable = msg.messageType === 'story_share' && (!storyObj || isStoryExpired);

  return (
    <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} group relative`}>
      {/* Snap Disappearing Message Bubble */}
      {msg.isSnap ? (
        <div 
          onClick={() => setActiveSnap(msg)}
          className={`cursor-pointer p-4 rounded-2xl flex items-center gap-3 shadow-lg border transition-all ${isMine ? 'bg-primary-500/20 border-primary-500/40 text-white' : 'glass-card border-white/10 text-white'}`}
        >
          <div className="w-10 h-10 rounded-full hero-gradient flex items-center justify-center shadow-glow">
            <Camera className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-text-primary">
              {msg.isOpened ? 'Snap Opened' : 'Tap to View Snap'}
            </h4>
            <p className="text-xs text-text-secondary">
              {msg.snapTimer || 10}s • {msg.viewMode === 'view_once' ? 'View Once' : 'Replay Once'}
            </p>
          </div>
        </div>
      ) : (
        /* Standard / Story Share Message Bubble */
        <div 
          onDoubleClick={() => setReactionMenuMsgId(msg._id)}
          className={`max-w-[80%] sm:max-w-[75%] p-3.5 text-sm relative leading-relaxed ${
            isMine 
              ? `bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow-glow ${isFirstInGroup ? 'rounded-2xl rounded-tr-sm' : 'rounded-2xl rounded-tr-sm rounded-br-sm'}` 
              : `bg-bg-base text-text-primary border border-border-soft shadow-sm ${isFirstInGroup ? 'rounded-2xl rounded-tl-sm' : 'rounded-2xl rounded-tl-sm rounded-bl-sm'}`
          } ${msg.status === 'sending' ? 'opacity-70 grayscale' : ''}`}
        >
          {/* Shared Story Bubble */}
          {msg.messageType === 'story_share' && (
            isStoryUnavailable ? (
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-black/40 border border-white/10 text-white/70 mb-2">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white">Story unavailable</span>
                  <span className="text-[10px] text-white/50">This story has expired or been removed</span>
                </div>
              </div>
            ) : (
              <div className="rounded-xl overflow-hidden bg-black/40 border border-white/15 mb-2.5 shadow-md">
                {/* Story Header */}
                <div className="flex items-center gap-2 p-2.5 bg-black/30 border-b border-white/10">
                  <div className="w-6 h-6 rounded-full overflow-hidden ring-1 ring-white/30 shrink-0">
                    <img src={storyObj?.user?.profilePicture || storyObj?.user?.avatar || "https://i.pravatar.cc/150"} alt="author" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-xs font-semibold text-white truncate">
                    @{storyObj?.user?.username || 'user'}'s story
                  </span>
                </div>

                {/* Story Media Preview */}
                <div 
                  className="relative max-w-[240px] aspect-[9/16] bg-neutral-900 cursor-pointer group/media overflow-hidden"
                  onClick={() => onOpenStory && storyObj && onOpenStory(storyObj)}
                >
                  {storyObj?.media?.[0]?.type === 'video' ? (
                    <video src={storyObj.media[0].url} className="w-full h-full object-cover" />
                  ) : (
                    <img src={storyObj?.media?.[0]?.url || msg.mediaUrl} alt="story preview" className="w-full h-full object-cover group-hover/media:scale-105 transition-transform duration-300" />
                  )}
                  <div className="absolute inset-0 bg-black/20 group-hover/media:bg-black/10 transition-colors flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center border border-white/20 text-white group-hover/media:scale-110 transition-transform">
                      <Play className="w-5 h-5 fill-white ml-0.5" />
                    </div>
                  </div>
                </div>
              </div>
            )
          )}

          {/* Standard Media Attachments */}
          {msg.messageType === 'image' && msg.mediaUrl && (
            <img 
              src={msg.mediaUrl} 
              alt="attachment" 
              onClick={() => onImageClick && onImageClick(msg.mediaUrl)}
              className="max-w-[200px] sm:max-w-[250px] rounded-xl mb-2 cursor-pointer border border-white/10 hover:opacity-90 transition-opacity" 
            />
          )}
          
          {msg.messageType === 'video' && msg.mediaUrl && (
            <video 
              src={msg.mediaUrl} 
              controls 
              className="max-w-[200px] sm:max-w-[250px] rounded-xl mb-2 bg-black/20" 
            />
          )}

          {msg.messageType === 'file' && msg.mediaUrl && (
            <a 
              href={msg.mediaUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-2 rounded-lg bg-black/10 hover:bg-black/20 transition-colors mb-2 text-sm underline font-medium"
            >
              📄 Download File
            </a>
          )}

          {/* Voice Note Player */}
          {msg.messageType === 'voice' ? (
            <div className="flex items-center gap-3 pr-2">
              <audio src={msg.mediaUrl} controls className="h-8 max-w-[200px]" />
              <span className="text-xs font-mono">{msg.duration || 0}s</span>
            </div>
          ) : (
            msg.text && <p>{msg.text}</p>
          )}

          {/* Reaction Badges Overlay */}
          {reactions && reactions.length > 0 && (
            <div className="absolute -bottom-3 right-2 bg-bg-base border border-border-soft px-2 py-0.5 rounded-full text-xs flex items-center gap-1 shadow-md z-10">
              {reactions.map((r, idx) => <span key={idx}>{r}</span>)}
            </div>
          )}
        </div>
      )}

      {/* Emoji Quick Reaction Popover Menu */}
      {reactionMenuMsgId === msg._id && (
        <div className="flex items-center gap-1.5 p-2 bg-bg-base rounded-full border border-border-soft shadow-2xl my-1 animate-scaleIn z-30 relative">
          {['❤️', '😂', '😮', '😢', '🔥', '👍'].map(emoji => (
            <button key={emoji} onClick={() => handleAddReaction(msg._id, emoji)} className="hover:scale-125 transition-transform text-lg p-1">
              {emoji}
            </button>
          ))}
          <button onClick={() => setReactionMenuMsgId(null)} className="text-xs text-text-secondary px-1">✕</button>
        </div>
      )}

      {/* Timestamp & Read Receipts */}
      <div className="flex items-center gap-1 text-[10px] text-text-secondary mt-1 px-1">
        <span>{format(new Date(msg.createdAt || Date.now()), 'h:mm a')}</span>
        {isMine && (
          <span>
            {msg.status === 'sending' ? (
              <span className="animate-pulse">...</span>
            ) : msg.status === 'seen' ? (
              <CheckCheck className="w-3.5 h-3.5 text-blue-500 inline" />
            ) : msg.status === 'delivered' ? (
              <CheckCheck className="w-3.5 h-3.5 text-text-secondary inline" />
            ) : (
              <Check className="w-3.5 h-3.5 text-text-secondary inline" />
            )}
          </span>
        )}
      </div>
    </div>
  );
};

export default React.memo(MessageBubble);
