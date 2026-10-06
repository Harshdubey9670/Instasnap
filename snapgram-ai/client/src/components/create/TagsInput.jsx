import { Hash, X } from "lucide-react";

/**
 * Generic chip-input for a list of short strings — hashtags on Create Post,
 * interests on Edit Profile. `showHashPrefix` toggles the "#" chip styling
 * used for hashtags; plain-word contexts (like interests) pass it as false.
 */
export const TagsInput = ({
  tagInput,
  setTagInput,
  tags,
  addTagsFromInput,
  removeTag,
  label = "Tags",
  icon: Icon = Hash,
  placeholder = "Add people or topics",
  showHashPrefix = true,
}) => {
  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTagsFromInput();
    } else if (e.key === "Backspace" && !tagInput && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-text-secondary" />
        <span className="text-sm font-semibold text-text-primary">{label}</span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 bg-bg-surface-hover border border-border-soft rounded-xl px-3 py-2 focus-within:border-primary-500 transition-colors">
        {tags.map((tag, i) => (
          <span
            key={tag + i}
            className="inline-flex items-center gap-1 bg-primary-500/10 text-primary-600 dark:text-primary-300 text-xs font-semibold px-2 py-1 rounded-full"
          >
            {showHashPrefix ? `#${tag}` : tag}
            <button type="button" onClick={() => removeTag(i)} aria-label={`Remove ${tag}`}>
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addTagsFromInput}
          placeholder={tags.length ? "Add another..." : placeholder}
          className="flex-1 min-w-[100px] bg-transparent outline-none text-sm text-text-primary placeholder:text-text-secondary py-0.5"
        />
      </div>
    </div>
  );
};
