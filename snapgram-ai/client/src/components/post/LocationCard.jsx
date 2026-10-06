import { MapPin, ExternalLink } from "lucide-react";

export const LocationCard = ({ location }) => {
  if (!location) return null;

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;

  return (
    <div className="warm-card p-4">
      <h3 className="text-sm font-bold text-text-primary flex items-center gap-2 mb-2">
        <MapPin className="w-4 h-4 text-primary-500" /> Location
      </h3>
      <p className="text-sm text-text-primary font-medium">{location}</p>
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-primary-500 hover:text-primary-600 transition-colors"
      >
        View on Map <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  );
};
