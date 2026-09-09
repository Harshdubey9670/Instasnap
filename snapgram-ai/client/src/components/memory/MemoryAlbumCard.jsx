import React from 'react';
import { FolderPlus, Lock, Unlock, Settings, Trash2 } from 'lucide-react';

export const MemoryAlbumCard = ({
  album,
  onClick,
  onEdit,
  onDelete
}) => {
  return (
    <div 
      className="group relative rounded-2xl bg-bg-surface border border-border-soft hover:border-primary-500/40 shadow-sm overflow-hidden transition-all duration-300 cursor-pointer"
      onClick={() => onClick && onClick(album)}
    >
      <div className="relative aspect-square w-full bg-black/40 p-5 flex flex-col items-center justify-center text-center">
        {album.coverUrl ? (
          <>
            <img src={album.coverUrl} alt={album.name} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          </>
        ) : (
          <FolderPlus className="w-12 h-12 text-primary-400 mb-2 opacity-80 group-hover:scale-110 transition-transform" />
        )}
        
        <div className="relative z-10 w-full flex flex-col items-center mt-auto">
          <h3 className="text-white font-bold text-sm truncate w-full px-2">{album.name}</h3>
          <p className="text-white/70 text-[11px] mt-0.5">{album.itemCount || 0} items</p>
        </div>

        <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
           {album.isPrivate ? (
             <span className="p-1.5 rounded-full bg-black/60 backdrop-blur-md text-amber-400 border border-amber-500/30">
               <Lock className="w-3.5 h-3.5" />
             </span>
           ) : (
             <span className="p-1.5 rounded-full bg-black/60 backdrop-blur-md text-emerald-400 border border-emerald-500/30">
               <Unlock className="w-3.5 h-3.5" />
             </span>
           )}
        </div>
      </div>

      <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
         {onEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(album); }}
              className="p-1.5 rounded-lg bg-black/60 backdrop-blur-md text-white/80 hover:text-white transition-colors"
              title="Edit Album"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(album._id); }}
              className="p-1.5 rounded-lg bg-black/60 backdrop-blur-md text-white/80 hover:text-red-400 transition-colors"
              title="Delete Album"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
      </div>
    </div>
  );
};
