import { useState, useRef } from 'react';
import { Search, Play, Pause, Music, X } from 'lucide-react';

const MusicPicker = ({ onSelect, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [playingPreview, setPlayingPreview] = useState(null);
  const audioRef = useRef(null);

  const searchMusic = async (e) => {
    const q = e.target.value;
    setQuery(q);
    
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      // Using iTunes Search API for global music search (no auth required)
      const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&limit=15`);
      const data = await res.json();
      setResults(data.results || []);
    } catch (error) {
      console.error('Failed to fetch music:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePlay = (previewUrl) => {
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

  const handleSelect = (track) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    onSelect({
      title: track.trackName,
      artist: track.artistName,
      coverUrl: track.artworkUrl100,
      previewUrl: track.previewUrl
    });
  };

  return (
    <div className="flex flex-col h-full bg-neutral-900 rounded-xl overflow-hidden shadow-2xl border border-neutral-800 relative max-h-[400px]">
      <audio ref={audioRef} onEnded={() => setPlayingPreview(null)} />
      
      <div className="flex items-center justify-between p-4 border-b border-neutral-800">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Music className="w-4 h-4 text-sky-400" /> Choose Music
        </h3>
        <button onClick={onClose} className="text-neutral-400 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 border-b border-neutral-800 relative">
        <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input 
          type="text"
          placeholder="Search global music..."
          value={query}
          onChange={searchMusic}
          className="w-full bg-neutral-800 text-white text-sm rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-neutral-700"
          autoFocus
        />
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-800 p-2">
        {loading && <div className="text-neutral-400 text-sm text-center mt-4">Searching global library...</div>}
        
        {!loading && results.length === 0 && query.trim().length > 1 && (
          <div className="text-neutral-500 text-sm text-center mt-4">No songs found.</div>
        )}

        {results.map((track) => (
          <div key={track.trackId} className="flex items-center gap-3 p-2 hover:bg-neutral-800 rounded-lg group transition-colors">
            <div className="relative w-12 h-12 shrink-0 cursor-pointer" onClick={() => togglePlay(track.previewUrl)}>
              <img src={track.artworkUrl100} alt="cover" className="w-full h-full rounded-md object-cover opacity-80 group-hover:opacity-50 transition-opacity" />
              <div className="absolute inset-0 flex items-center justify-center">
                {playingPreview === track.previewUrl ? (
                  <Pause className="w-5 h-5 text-white" />
                ) : (
                  <Play className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{track.trackName}</p>
              <p className="text-neutral-400 text-xs truncate">{track.artistName}</p>
            </div>
            
            <button 
              onClick={() => handleSelect(track)}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold rounded-full border border-neutral-700 transition-colors"
            >
              Add
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MusicPicker;
