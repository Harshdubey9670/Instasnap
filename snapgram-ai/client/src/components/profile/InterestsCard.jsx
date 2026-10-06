import { Sparkles } from "lucide-react";

export const InterestsCard = ({ interests }) => {
  if (!interests || interests.length === 0) return null;

  return (
    <div className="warm-card p-4">
      <h3 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary-500" /> Interests
      </h3>
      <div className="flex flex-wrap gap-2">
        {interests.map((interest, i) => (
          <span key={i} className="px-3 py-1.5 rounded-full bg-bg-surface-hover border border-border-soft text-xs font-semibold text-text-primary">
            {interest}
          </span>
        ))}
      </div>
    </div>
  );
};
