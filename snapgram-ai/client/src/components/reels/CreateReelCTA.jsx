import { Link } from "react-router-dom";
import { Flame } from "lucide-react";

export const CreateReelCTA = () => (
  <div className="relative overflow-hidden rounded-[1.5rem] p-5 hero-gradient text-white shadow-[0_12px_32px_rgba(255,107,53,0.30)]">
    <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10" />
    <Flame className="w-6 h-6 mb-2" />
    <h3 className="font-bold text-base leading-tight">Create Your Reel</h3>
    <p className="text-white/85 text-sm mt-1 mb-4">Share your world in 15 seconds or less.</p>
    <Link
      to="/app/reels/create"
      className="inline-flex items-center justify-center w-full h-10 rounded-full bg-white text-[#E55A27] font-semibold text-sm hover:bg-white/90 transition-colors"
    >
      Create Now
    </Link>
  </div>
);
