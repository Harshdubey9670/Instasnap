import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { 
  UploadCloud, 
  X, 
  Smile, 
  HelpCircle, 
  Vote, 
  Clock, 
  Link as LinkIcon, 
  AtSign, 
  MapPin, 
  Wand2, 
  Type,
  Pencil,
  RotateCw,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  Eraser,
  Sparkles,
  Music2,
  ChevronRight,
  Loader2,
  Play,
  Pause,
  Check
} from "lucide-react";
import api from "../../services/api";
import { useToast } from "../../components/ui/Toast";
import { Avatar } from "../../components/ui/Avatar";
import MusicPicker from "../../components/ui/MusicPicker";

const FILTERS = [
  { id: 'none', label: 'Normal', filter: 'none' },
  { id: 'vintage', label: 'Vintage', filter: 'sepia(0.6) contrast(1.15) saturate(0.9)' },
  { id: 'grayscale', label: 'B & W', filter: 'grayscale(1) contrast(1.2)' },
  { id: 'warm', label: 'Summer', filter: 'saturate(1.5) contrast(1.05) hue-rotate(-10deg)' },
  { id: 'cyberpunk', label: 'Cyber', filter: 'hue-rotate(180deg) saturate(1.8) contrast(1.2)' },
  { id: 'drama', label: 'Drama', filter: 'contrast(1.6) brightness(0.9)' },
  { id: 'glow', label: 'Glow', filter: 'brightness(1.15) saturate(1.2) sepia(0.15)' },
];

const PRESET_COLORS = [
  "#FFFFFF", "#000000", "#FF0055", "#FFCC00", "#00FF66", "#00CCFF", "#AA00FF", "#FF5500"
];

const EMOJI_PRESETS = [
  "🔥", "❤️", "😂", "✨", "🎉", "💯", "👑", "🚀", "🌟", "🌈", "🍕", "🎯", "⚡", "💎", "🍿", "😎"
];

const PRESET_MUSIC = [
  { id: 'm1', title: 'Aesthetic Vibe', artist: 'Lofi Beats', duration: '0:30' },
  { id: 'm2', title: 'Summer House', artist: 'DJ Sunshine', duration: '0:30' },
  { id: 'm3', title: 'Cyberpunk Synth', artist: 'Neo Tokyo', duration: '0:30' },
  { id: 'm4', title: 'Acoustic Chill', artist: 'Indie Dreams', duration: '0:30' },
];

export default function CreateStoryPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useSelector((state) => state.auth);

  const fileInputRef = useRef(null);
  const canvasBoxRef = useRef(null);
  const drawingCanvasRef = useRef(null);

  // Media state
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [mediaType, setMediaType] = useState("image");
  const [isUploading, setIsUploading] = useState(false);

  // Image Transformations & Filters
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1.0);
  const [selectedFilter, setSelectedFilter] = useState("none");
  const [showFilterBar, setShowFilterBar] = useState(false);

  // Text Elements State
  const [textElements, setTextElements] = useState([]);
  const [activeTextId, setActiveTextId] = useState(null);
  const [showTextModal, setShowTextModal] = useState(false);
  const [inputText, setInputText] = useState("");
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [textBgStyle, setTextBgStyle] = useState("glass");
  const [textAlignment, setTextAlignment] = useState("center");
  const [textSize, setTextSize] = useState(24);
  const [textRotation, setTextRotation] = useState(0);

  // Freehand Drawing State
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [brushColor, setBrushColor] = useState("#FF0055");
  const [brushSize, setBrushSize] = useState(6);
  const [isDrawing, setIsDrawing] = useState(false);

  // Sticker & Emojis Popover State
  const [activeStickers, setActiveStickers] = useState([]);
  const [showStickerDrawer, setShowStickerDrawer] = useState(false);

  // Music State
  const [selectedMusic, setSelectedMusic] = useState(null);
  const [showMusicModal, setShowMusicModal] = useState(false);
  const [playingMusicId, setPlayingMusicId] = useState(null);

  // AI Story Generator Modal
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [generatingAi, setGeneratingAi] = useState(false);

  // Publishing & Privacy State
  const [isArchived, setIsArchived] = useState(true);
  const [privacy, setPrivacy] = useState("public"); // 'public' | 'followers' | 'close_friends' | 'custom'
  const [allowedUsers, setAllowedUsers] = useState([]); // User IDs for custom audience
  const [hiddenFrom, setHiddenFrom] = useState([]); // User IDs to hide story from
  
  // Privacy Modals
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [userPickerMode, setUserPickerMode] = useState(null); // 'custom' | 'hiddenFrom' | null
  const [pickerSearchQuery, setPickerSearchQuery] = useState("");
  const [pickerUsers, setPickerUsers] = useState([]);
  const [loadingPickerUsers, setLoadingPickerUsers] = useState(false);

  // Search users for custom allowed or hiddenFrom lists
  useEffect(() => {
    if (!userPickerMode) return;
    const fetchUsers = async () => {
      setLoadingPickerUsers(true);
      try {
        const res = await api.get(`/api/search/users?q=${encodeURIComponent(pickerSearchQuery)}`);
        if (res.data.success) {
          setPickerUsers(res.data.data || []);
        }
      } catch (err) {
        console.error("Failed to search users for privacy list:", err);
      } finally {
        setLoadingPickerUsers(false);
      }
    };
    const timer = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timer);
  }, [pickerSearchQuery, userPickerMode]);

  // Preload Reposted Story if redirected from Story Viewer
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const repostUrl = params.get('repostUrl');
    const author = params.get('author');
    if (repostUrl) {
      setPreview(repostUrl);
      setMediaType(repostUrl.endsWith('.mp4') || repostUrl.includes('video') ? 'video' : 'image');
      if (author) {
        setTextElements([{
          id: Date.now().toString(),
          text: `Reposted from @${author}`,
          color: '#FFFFFF',
          bgStyle: 'glass',
          align: 'center',
          size: 20,
          rotation: 0,
          x: 50,
          y: 80
        }]);
      }
    }
  }, []);

  // Initialize Drawing Canvas size
  useEffect(() => {
    const canvas = drawingCanvasRef.current;
    if (canvas && canvasBoxRef.current) {
      canvas.width = canvasBoxRef.current.clientWidth;
      canvas.height = canvasBoxRef.current.clientHeight;
    }
  }, [preview]);

  // Handle File Selection
  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("image/") && !selectedFile.type.startsWith("video/")) {
      toast.error("Please select an image or video.");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error("File size exceeds 10MB limit. Please select a smaller photo or video.");
      return;
    }

    setFile(selectedFile);
    setMediaType(selectedFile.type.startsWith("video/") ? "video" : "image");

    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(selectedFile);
  };

  // Drawing Handlers
  const startDrawing = (e) => {
    if (!isDrawingMode) return;
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    
    const clientX = e.clientX ?? (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const clientY = e.clientY ?? (e.touches && e.touches[0] ? e.touches[0].clientY : 0);

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawingMode || !isDrawing) return;
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");

    const clientX = e.clientX ?? (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const clientY = e.clientY ?? (e.touches && e.touches[0] ? e.touches[0].clientY : 0);

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearDrawingCanvas = () => {
    const canvas = drawingCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      toast.success("Drawing cleared!");
    }
  };

  // Add / Edit Text Element
  const handleSaveTextElement = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    if (activeTextId) {
      setTextElements(prev => prev.map(t => t.id === activeTextId ? {
        ...t,
        text: inputText,
        color: textColor,
        bgStyle: textBgStyle,
        alignment: textAlignment,
        size: textSize,
        rotation: textRotation
      } : t));
    } else {
      setTextElements([...textElements, {
        id: Date.now(),
        text: inputText,
        color: textColor,
        bgStyle: textBgStyle,
        alignment: textAlignment,
        size: textSize,
        rotation: textRotation,
        position: { x: 50, y: 40 + (textElements.length * 10) }
      }]);
    }

    setInputText("");
    setActiveTextId(null);
    setShowTextModal(false);
  };

  // Add Sticker or Emoji to Canvas
  const handleAddSticker = (type, dataOverride = null) => {
    let stickerData = dataOverride || {};
    if (type === 'poll') stickerData = { question: 'Vote below!', optionA: 'Yes 🔥', optionB: 'No ❄️' };
    if (type === 'question') stickerData = { prompt: 'Ask me a question...' };
    if (type === 'countdown') stickerData = { title: 'Big Announcement!', targetDate: '2026-12-31' };
    if (type === 'link') stickerData = { url: 'https://snapgram.ai', label: 'Visit Website' };
    if (type === 'mention') stickerData = { handle: '@snapgram_official' };
    if (type === 'location') stickerData = { location: 'San Francisco, CA' };
    if (type === 'emoji') stickerData = { emoji: dataOverride };

    setActiveStickers([...activeStickers, { id: Date.now(), type, data: stickerData, position: { x: 50, y: 50 } }]);
    setShowStickerDrawer(false);
  };

  // Generate AI Story
  const handleGenerateAiStory = async (e) => {
    e.preventDefault();
    if (!aiPrompt) return;
    setGeneratingAi(true);

    try {
      const res = await api.post("/api/stories/ai-generate", { prompt: aiPrompt });
      setPreview(res.data.data.mediaUrl);
      setMediaType("image");
      setShowAiModal(false);
      setAiPrompt("");
      toast.success("AI Story Background Generated!");
    } catch (err) {
      toast.error("Failed to generate AI story.");
    } finally {
      setGeneratingAi(false);
    }
  };

  // Submit Story
  const handleShareStory = async () => {
    if (!preview && !file) {
      toast.error("Please add media or an AI background to share.");
      return;
    }

    setIsUploading(true);
    try {
      let finalMediaUrl = preview;

      if (file) {
        const formData = new FormData();
        formData.append("image", file);
        const uploadRes = await api.post("/api/upload", formData);
        finalMediaUrl = uploadRes.data.data?.url || uploadRes.data.url;
      }

      const payload = {
        media: [{ url: finalMediaUrl, type: mediaType }],
        stickers: [
          ...activeStickers,
          ...textElements.map(t => ({ type: 'text', data: t }))
        ],
        music: selectedMusic ? {
          title: selectedMusic.title,
          artist: selectedMusic.artist,
          coverUrl: selectedMusic.coverUrl,
          audioUrl: selectedMusic.previewUrl
        } : {},
        status: 'published',
        isArchived,
        privacy,
        allowedUsers,
        hiddenFrom
      };

      await api.post("/api/stories", payload);
      toast.success("Added to your Story! ✨");
      navigate("/app");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to post story.");
    } finally {
      setIsUploading(false);
    }
  };

  const currentFilterCSS = FILTERS.find(f => f.id === selectedFilter)?.filter || 'none';

  return (
    <div className="relative w-full max-w-md mx-auto h-[calc(100vh-1rem)] md:h-[90vh] my-2 bg-black rounded-[36px] overflow-hidden shadow-2xl border border-white/10 flex flex-col justify-between select-none">
      
      {/* 9:16 Story Canvas Container */}
      <div 
        ref={canvasBoxRef}
        className="relative w-full flex-1 overflow-hidden flex items-center justify-center bg-neutral-950"
      >
        {preview ? (
          <div 
            className="w-full h-full flex items-center justify-center overflow-hidden relative transition-all"
            style={{
              filter: currentFilterCSS,
              transform: `rotate(${rotation}deg) scale(${zoom})`
            }}
          >
            {mediaType === "video" ? (
              <video src={preview} autoPlay loop playsInline className="w-full h-full object-cover" />
            ) : (
              <img src={preview} alt="Story Preview" className="w-full h-full object-cover" />
            )}
          </div>
        ) : (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-4 cursor-pointer text-text-secondary p-8 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-primary-500/10 flex items-center justify-center text-primary-500 border border-primary-500/20">
              <UploadCloud className="w-8 h-8 animate-bounce" />
            </div>
            <div>
              <p className="font-bold text-white text-base">Select Photo or Video</p>
              <p className="text-xs text-white/60 mt-1">Or create with AI prompt</p>
            </div>
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*,video/*"
          className="hidden"
        />

        {/* Freehand Drawing Canvas Overlay */}
        <canvas
          ref={drawingCanvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className={`absolute inset-0 z-20 ${isDrawingMode ? 'cursor-crosshair pointer-events-auto' : 'pointer-events-none'}`}
        />

        {/* Interactive Text Elements Overlay */}
        {textElements.map((txt) => {
          let bgClass = "bg-transparent text-shadow-md";
          if (txt.bgStyle === "solid") bgClass = "bg-white text-black px-3 py-1.5 rounded-xl shadow-lg";
          if (txt.bgStyle === "glass") bgClass = "bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-xl border border-white/20 shadow-lg";

          return (
            <div
              key={txt.id}
              onClick={() => {
                setActiveTextId(txt.id);
                setInputText(txt.text);
                setTextColor(txt.color);
                setTextBgStyle(txt.bgStyle);
                setTextAlignment(txt.alignment);
                setTextSize(txt.size);
                setTextRotation(txt.rotation);
                setShowTextModal(true);
              }}
              className={`absolute z-30 cursor-pointer pointer-events-auto max-w-[85%] transition-transform group ${bgClass}`}
              style={{
                left: `${txt.position.x}%`,
                top: `${txt.position.y}%`,
                transform: `translate(-50%, -50%) rotate(${txt.rotation}deg)`,
                color: txt.bgStyle === "solid" ? "#000000" : txt.color,
                fontSize: `${txt.size}px`,
                textAlign: txt.alignment
              }}
            >
              <span>{txt.text}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setTextElements(prev => prev.filter(t => t.id !== txt.id));
                }}
                className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}

        {/* Interactive Stickers Overlay */}
        {activeStickers.map((st) => (
          <div
            key={st.id}
            className="absolute p-3 bg-black/75 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl z-30 pointer-events-auto cursor-move text-white max-w-[220px] group"
            style={{ left: `${st.position.x}%`, top: `${st.position.y}%`, transform: 'translate(-50%, -50%)' }}
          >
            {st.type === 'emoji' && (
              <span className="text-4xl drop-shadow-lg">{st.data.emoji}</span>
            )}

            {st.type === 'poll' && (
              <div className="text-center space-y-2 text-xs">
                <p className="font-bold text-yellow-300">{st.data.question}</p>
                <div className="grid grid-cols-2 gap-1.5 font-bold">
                  <span className="p-1.5 bg-white/20 rounded-lg">{st.data.optionA}</span>
                  <span className="p-1.5 bg-white/20 rounded-lg">{st.data.optionB}</span>
                </div>
              </div>
            )}

            {st.type === 'question' && (
              <div className="text-center space-y-1.5 text-xs">
                <p className="font-bold text-blue-300">{st.data.prompt}</p>
                <div className="p-2 bg-white/10 rounded-xl text-white/60 text-[10px]">Type something...</div>
              </div>
            )}

            {st.type === 'countdown' && (
              <div className="text-center space-y-1 text-xs">
                <p className="font-extrabold uppercase tracking-wider text-rose-400">{st.data.title}</p>
                <div className="text-lg font-black font-mono">00 : 42 : 19</div>
              </div>
            )}

            {st.type === 'link' && (
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <LinkIcon className="w-3.5 h-3.5" />
                <span>{st.data.label}</span>
              </div>
            )}

            {st.type === 'mention' && (
              <div className="font-extrabold text-xs text-primary-400 flex items-center gap-1">
                <AtSign className="w-3.5 h-3.5" />
                {st.data.handle}
              </div>
            )}

            {st.type === 'location' && (
              <div className="font-bold text-xs text-amber-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {st.data.location}
              </div>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveStickers(prev => prev.filter(s => s.id !== st.id));
              }}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Top Overlay Action Bar (Instagram Style) */}
      <div className="absolute top-4 left-4 right-4 z-40 flex items-center justify-between pointer-events-auto">
        <button
          onClick={() => navigate(-1)}
          className="p-2.5 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white hover:bg-black/70 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {preview && (
          <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-xl">
            {/* Text Aa */}
            <button
              onClick={() => {
                setActiveTextId(null);
                setInputText("");
                setShowTextModal(true);
              }}
              className="p-1.5 text-white hover:text-yellow-400 transition-colors font-black text-sm leading-none"
              title="Add Text"
            >
              Aa
            </button>

            {/* Sticker / Emoji */}
            <button
              onClick={() => setShowStickerDrawer(!showStickerDrawer)}
              className={`p-1.5 transition-colors ${showStickerDrawer ? 'text-yellow-400' : 'text-white hover:text-yellow-400'}`}
              title="Stickers & Emojis"
            >
              <Smile className="w-4 h-4" />
            </button>

            {/* Freehand Draw */}
            <button
              onClick={() => setIsDrawingMode(!isDrawingMode)}
              className={`p-1.5 transition-colors ${isDrawingMode ? 'text-amber-400' : 'text-white hover:text-amber-400'}`}
              title="Draw"
            >
              <Pencil className="w-4 h-4" />
            </button>

            {/* Music */}
            <button
              onClick={() => setShowMusicModal(true)}
              className={`p-1.5 transition-colors ${selectedMusic ? 'text-emerald-400' : 'text-white hover:text-emerald-400'}`}
              title="Add Music"
            >
              <Music2 className="w-4 h-4" />
            </button>

            {/* Sparkles / Filter */}
            <button
              onClick={() => setShowFilterBar(!showFilterBar)}
              className={`p-1.5 transition-colors ${selectedFilter !== 'none' ? 'text-pink-400' : 'text-white hover:text-pink-400'}`}
              title="Photo Filters"
            >
              <Sparkles className="w-4 h-4" />
            </button>

            {/* Rotate */}
            <button
              onClick={() => setRotation((prev) => (prev + 90) % 360)}
              className="p-1.5 text-white hover:text-purple-400 transition-colors"
              title="Rotate Image"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* AI Generator */}
            <button
              onClick={() => setShowAiModal(true)}
              className="p-1.5 text-purple-400 hover:text-purple-300 transition-colors"
              title="AI Generator"
            >
              <Wand2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Freehand Drawing Tools Popover Bar */}
      {isDrawingMode && (
        <div className="absolute top-16 left-4 right-4 z-40 bg-black/80 backdrop-blur-xl border border-white/20 rounded-2xl p-3 space-y-2 pointer-events-auto shadow-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <Pencil className="w-3.5 h-3.5" /> Drawing Tool
            </span>
            <button
              onClick={clearDrawingCanvas}
              className="text-[10px] font-bold text-red-400 hover:underline flex items-center gap-1"
            >
              <Eraser className="w-3 h-3" /> Clear
            </button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setBrushColor(c)}
                className={`w-6 h-6 rounded-full border-2 transition-transform shrink-0 ${brushColor === c ? 'scale-125 border-white shadow-md' : 'border-transparent'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="text-white/60 text-[10px]">Size</span>
            <input
              type="range"
              min="2"
              max="24"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* Photo Filters Horizontal Scroll Bar */}
      {showFilterBar && (
        <div className="absolute bottom-20 left-4 right-4 z-40 bg-black/80 backdrop-blur-xl border border-white/20 rounded-2xl p-3 pointer-events-auto shadow-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-pink-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Photo Filters
            </span>
            <button onClick={() => setShowFilterBar(false)} className="text-white/60 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedFilter(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all border ${
                  selectedFilter === f.id 
                    ? 'bg-pink-500 text-white border-pink-500 shadow-md scale-105' 
                    : 'bg-white/10 text-white/80 border-white/10 hover:bg-white/20'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sticker & Emoji Popover Drawer */}
      {showStickerDrawer && (
        <div className="absolute bottom-20 left-4 right-4 z-40 bg-black/85 backdrop-blur-xl border border-white/20 rounded-3xl p-4 space-y-3 pointer-events-auto shadow-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-yellow-400 flex items-center gap-1.5">
              <Smile className="w-4 h-4" /> Emojis & Interactive Stickers
            </span>
            <button onClick={() => setShowStickerDrawer(false)} className="text-white/60 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Emojis Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {EMOJI_PRESETS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleAddSticker('emoji', emoji)}
                className="text-xl p-2 bg-white/10 hover:bg-white/20 rounded-xl border border-white/10 shrink-0 hover:scale-125 transition-transform"
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Stickers Grid */}
          <div className="grid grid-cols-3 gap-2 text-xs font-bold pt-1">
            {[
              { type: 'poll', label: 'Poll', icon: Vote, color: 'text-yellow-500' },
              { type: 'question', label: 'Question', icon: HelpCircle, color: 'text-blue-500' },
              { type: 'countdown', label: 'Timer', icon: Clock, color: 'text-rose-500' },
              { type: 'link', label: 'Link', icon: LinkIcon, color: 'text-emerald-500' },
              { type: 'mention', label: 'Mention', icon: AtSign, color: 'text-primary-500' },
              { type: 'location', label: 'Location', icon: MapPin, color: 'text-amber-500' },
            ].map((st) => {
              const Icon = st.icon;
              return (
                <button
                  key={st.type}
                  onClick={() => handleAddSticker(st.type)}
                  className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl border border-white/10 flex items-center justify-center gap-2 text-white transition-all"
                >
                  <Icon className={`w-4 h-4 ${st.color}`} />
                  <span>{st.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom Floating Instagram Footer Bar */}
      <div className="absolute bottom-4 left-4 right-4 z-40 flex items-center justify-between pointer-events-auto">
        {preview && (
          <>
            {/* Left: Your Story, Close Friends, Privacy Button */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPrivacy("public")}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-full border text-xs font-bold transition-all ${
                  privacy === 'public'
                    ? 'bg-white text-black border-white shadow-lg'
                    : 'bg-black/60 text-white border-white/20 backdrop-blur-md'
                }`}
              >
                <Avatar src={user?.profilePicture || user?.avatar} fallback={user?.username?.charAt(0) || 'U'} className="w-5 h-5 rounded-full" />
                <span>Your Story</span>
              </button>

              <button
                onClick={() => setPrivacy(prev => prev === 'close_friends' ? 'public' : 'close_friends')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full border text-xs font-bold transition-all ${
                  privacy === 'close_friends'
                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg'
                    : 'bg-black/60 text-white border-white/20 backdrop-blur-md'
                }`}
              >
                <span className="text-yellow-300">⭐</span>
                <span className="hidden sm:inline">Close Friends</span>
              </button>

              {/* Story Privacy Options Button */}
              <button
                onClick={() => setShowPrivacyModal(true)}
                className={`p-2 rounded-full border text-xs font-bold transition-all ${
                  ['followers', 'custom'].includes(privacy) || hiddenFrom.length > 0
                    ? 'bg-sky-500 text-white border-sky-500 shadow-lg'
                    : 'bg-black/60 text-white border-white/20 backdrop-blur-md hover:bg-black/80'
                }`}
                title="Story Privacy Settings"
              >
                ⚙️
              </button>
            </div>

            {/* Right: Share Next Circular Arrow Button */}
            <button
              onClick={handleShareStory}
              disabled={isUploading}
              className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
              title="Share Story"
            >
              {isUploading ? (
                <Loader2 className="w-5 h-5 animate-spin text-black" />
              ) : (
                <ChevronRight className="w-6 h-6 stroke-[3]" />
              )}
            </button>
          </>
        )}
      </div>

      {/* Story Privacy Settings Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl max-w-md w-full text-white space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="font-extrabold text-lg flex items-center gap-2 text-white">
                🔒 Story Privacy Options
              </h3>
              <button onClick={() => setShowPrivacyModal(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Option 1: Everyone / Public */}
              <button
                onClick={() => setPrivacy('public')}
                className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                  privacy === 'public'
                    ? 'bg-white/10 border-white text-white font-bold'
                    : 'bg-neutral-800/50 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                }`}
              >
                <div>
                  <div className="text-sm font-bold flex items-center gap-2">
                    🌐 Everyone / Public
                  </div>
                  <div className="text-xs text-neutral-400 mt-0.5">
                    Anyone can view (or approved followers if private account)
                  </div>
                </div>
                {privacy === 'public' && <Check className="w-5 h-5 text-emerald-400" />}
              </button>

              {/* Option 2: Followers Only */}
              <button
                onClick={() => setPrivacy('followers')}
                className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                  privacy === 'followers'
                    ? 'bg-white/10 border-white text-white font-bold'
                    : 'bg-neutral-800/50 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                }`}
              >
                <div>
                  <div className="text-sm font-bold flex items-center gap-2">
                    👥 Followers Only
                  </div>
                  <div className="text-xs text-neutral-400 mt-0.5">
                    Only users following you can view this story
                  </div>
                </div>
                {privacy === 'followers' && <Check className="w-5 h-5 text-emerald-400" />}
              </button>

              {/* Option 3: Close Friends */}
              <button
                onClick={() => setPrivacy('close_friends')}
                className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                  privacy === 'close_friends'
                    ? 'bg-emerald-500/20 border-emerald-500 text-white font-bold'
                    : 'bg-neutral-800/50 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                }`}
              >
                <div>
                  <div className="text-sm font-bold flex items-center gap-2">
                    ⭐ Close Friends
                  </div>
                  <div className="text-xs text-neutral-400 mt-0.5">
                    Only users in your Close Friends list
                  </div>
                </div>
                {privacy === 'close_friends' && <Check className="w-5 h-5 text-emerald-400" />}
              </button>

              {/* Option 4: Custom Audience */}
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setPrivacy('custom');
                    setUserPickerMode('custom');
                  }}
                  className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    privacy === 'custom'
                      ? 'bg-purple-500/20 border-purple-500 text-white font-bold'
                      : 'bg-neutral-800/50 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                  }`}
                >
                  <div>
                    <div className="text-sm font-bold flex items-center gap-2">
                      🎯 Custom Audience ({allowedUsers.length} selected)
                    </div>
                    <div className="text-xs text-neutral-400 mt-0.5">
                      Select specific users allowed to view story
                    </div>
                  </div>
                  {privacy === 'custom' && <Check className="w-5 h-5 text-purple-400" />}
                </button>
              </div>

              {/* Option 5: Hide Story From Selected Users */}
              <div className="pt-2 border-t border-neutral-800">
                <button
                  onClick={() => setUserPickerMode('hiddenFrom')}
                  className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    hiddenFrom.length > 0
                      ? 'bg-rose-500/20 border-rose-500 text-white font-bold'
                      : 'bg-neutral-800/50 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                  }`}
                >
                  <div>
                    <div className="text-sm font-bold flex items-center gap-2">
                      🚫 Hide Story From ({hiddenFrom.length} hidden)
                    </div>
                    <div className="text-xs text-neutral-400 mt-0.5">
                      Select specific users to block from viewing this story
                    </div>
                  </div>
                  {hiddenFrom.length > 0 && <Check className="w-5 h-5 text-rose-400" />}
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowPrivacyModal(false)}
              className="w-full py-3 bg-white text-black font-extrabold rounded-2xl text-sm hover:opacity-90 transition-opacity"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* User Selector Drawer (For Custom Audience & Hide Story From) */}
      {userPickerMode && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl max-w-md w-full text-white space-y-4 shadow-2xl flex flex-col h-[70vh]">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="font-extrabold text-base flex items-center gap-2">
                {userPickerMode === 'custom' ? '🎯 Custom Audience' : '🚫 Hide Story From'}
              </h3>
              <button onClick={() => setUserPickerMode(null)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <input
              type="text"
              placeholder="Search users..."
              value={pickerSearchQuery}
              onChange={(e) => setPickerSearchQuery(e.target.value)}
              className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-xl text-sm outline-none text-white font-medium"
            />

            {/* Users List */}
            <div className="flex-1 overflow-y-auto divide-y divide-neutral-800/60 hide-scrollbar">
              {loadingPickerUsers ? (
                <div className="flex justify-center p-6">
                  <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
                </div>
              ) : pickerUsers.length === 0 ? (
                <div className="text-center p-6 text-neutral-400 text-sm">
                  No users found.
                </div>
              ) : (
                pickerUsers.map((u) => {
                  const isSelected = userPickerMode === 'custom' 
                    ? allowedUsers.includes(u._id)
                    : hiddenFrom.includes(u._id);

                  const toggleSelection = () => {
                    if (userPickerMode === 'custom') {
                      setAllowedUsers(prev => isSelected ? prev.filter(id => id !== u._id) : [...prev, u._id]);
                    } else {
                      setHiddenFrom(prev => isSelected ? prev.filter(id => id !== u._id) : [...prev, u._id]);
                    }
                  };

                  return (
                    <div 
                      key={u._id} 
                      onClick={toggleSelection}
                      className="py-3 px-2 flex items-center justify-between cursor-pointer hover:bg-neutral-800/40 transition-colors rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar src={u.profilePicture || u.avatar} fallback={u.username?.charAt(0)} className="w-10 h-10 rounded-full" />
                        <div>
                          <div className="font-bold text-sm text-white">{u.fullName || u.username}</div>
                          <div className="text-xs text-neutral-400">@{u.username}</div>
                        </div>
                      </div>

                      <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
                        isSelected 
                          ? (userPickerMode === 'custom' ? 'bg-purple-500 border-purple-500' : 'bg-rose-500 border-rose-500') 
                          : 'border-neutral-600'
                      }`}>
                        {isSelected && <Check className="w-4 h-4 text-white stroke-[3]" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <button
              onClick={() => setUserPickerMode(null)}
              className="w-full py-3 bg-white text-black font-extrabold rounded-2xl text-sm hover:opacity-90 transition-opacity mt-auto"
            >
              Save Selection
            </button>
          </div>
        </div>
      )}

      {/* Add / Edit Text Modal */}
      {showTextModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-bg-surface p-6 rounded-3xl border border-border-soft max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-text-primary flex items-center gap-2">
                <Type className="w-5 h-5 text-primary-500" />
                {activeTextId ? 'Edit Text Element' : 'Add Story Text'}
              </h3>
              <button onClick={() => setShowTextModal(false)} className="text-text-secondary hover:text-text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTextElement} className="space-y-4">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type your story text..."
                className="w-full p-3 bg-bg-base border border-border-soft rounded-xl text-sm outline-none text-text-primary font-semibold"
                autoFocus
                required
              />

              <div className="space-y-3 pt-1">
                {/* Text Color Selection */}
                <div>
                  <label className="text-xs font-bold text-text-secondary block mb-1.5">Text Color</label>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setTextColor(c)}
                        className={`w-6 h-6 rounded-full border-2 shrink-0 ${textColor === c ? 'scale-125 border-white shadow-md' : 'border-transparent'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                {/* Background Style */}
                <div>
                  <label className="text-xs font-bold text-text-secondary block mb-1.5">Background Style</label>
                  <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                    {[
                      { id: 'none', label: 'None' },
                      { id: 'glass', label: 'Glass' },
                      { id: 'solid', label: 'Solid' },
                    ].map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setTextBgStyle(b.id)}
                        className={`py-2 rounded-xl border transition-all ${textBgStyle === b.id ? 'bg-primary-500 text-white border-primary-500' : 'bg-bg-base border-border-soft text-text-secondary'}`}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Alignment */}
                <div>
                  <label className="text-xs font-bold text-text-secondary block mb-1.5">Alignment</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'left', icon: AlignLeft },
                      { id: 'center', icon: AlignCenter },
                      { id: 'right', icon: AlignRight },
                    ].map((a) => {
                      const Icon = a.icon;
                      return (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => setTextAlignment(a.id)}
                          className={`py-2 flex items-center justify-center rounded-xl border transition-all ${textAlignment === a.id ? 'bg-primary-500 text-white border-primary-500' : 'bg-bg-base border-border-soft text-text-secondary'}`}
                        >
                          <Icon className="w-4 h-4" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Font Size & Rotation */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-text-secondary block mb-1">Font Size ({textSize}px)</label>
                    <input
                      type="range"
                      min="14"
                      max="48"
                      value={textSize}
                      onChange={(e) => setTextSize(parseInt(e.target.value))}
                      className="w-full accent-primary-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-text-secondary block mb-1">Rotation ({textRotation}°)</label>
                    <input
                      type="range"
                      min="-45"
                      max="45"
                      value={textRotation}
                      onChange={(e) => setTextRotation(parseInt(e.target.value))}
                      className="w-full accent-primary-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-primary-600 hover:bg-primary-500 text-white font-bold text-sm rounded-xl transition-all shadow-md"
              >
                {activeTextId ? 'Update Text' : 'Done'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Music Selector Modal */}
      {showMusicModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm h-[500px]">
            <MusicPicker 
              onSelect={(music) => {
                setSelectedMusic({
                  ...music,
                  audioUrl: music.previewUrl 
                });
                setShowMusicModal(false);
              }} 
              onClose={() => setShowMusicModal(false)} 
            />
          </div>
        </div>
      )}

      {/* AI Story Modal */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-bg-surface p-6 rounded-3xl border border-border-soft max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-text-primary flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-purple-500" />
                AI Story Background Generator
              </h3>
              <button onClick={() => setShowAiModal(false)} className="text-text-secondary hover:text-text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateAiStory} className="space-y-4">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Describe prompt: e.g. Cyberpunk Tokyo street neon"
                className="w-full p-3 bg-bg-base border border-border-soft rounded-xl text-sm outline-none text-text-primary font-semibold"
                required
              />

              <button
                type="submit"
                disabled={generatingAi}
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm rounded-xl transition-all disabled:opacity-50"
              >
                {generatingAi ? "Generating..." : "Generate AI Background"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
