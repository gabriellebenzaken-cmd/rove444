import { MapPin, Bookmark, PlusCircle, Map } from "lucide-react";

export default function RecommendationCard({ item, index, onAddToItinerary, onSave }) {
  // Support both old schema (suggestion.title/tagline/vibes/neighborhood) and new (item.name/description/location/tags)
  const name = item.name || item.title;
  const description = item.description;
  const location = item.location || item.neighborhood;
  const tags = item.tags || item.vibes || [];

  function openMaps() {
    const q = encodeURIComponent(`${name}${location ? ` ${location}` : ""}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, "_blank");
  }

  return (
    <div
      className="bg-card border border-border rounded-2xl overflow-hidden"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="p-4 space-y-2.5">
        {/* Name + location */}
        <div>
          <p className="text-sm font-semibold leading-snug">{name}</p>
          {location && (
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
              <span className="text-[11px] text-muted-foreground">{location}</span>
            </div>
          )}
        </div>

        {/* Description */}
        {description && (
          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.map((t) => (
              <span
                key={t}
                className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-accent text-accent-foreground"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 flex-wrap pt-0.5">
          <button
            onClick={openMaps}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border border-border bg-background hover:bg-muted/40 transition-colors"
          >
            <Map className="h-3 w-3" />
            Maps
          </button>
          {onSave && (
            <button
              onClick={() => onSave(item)}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border border-border bg-background hover:bg-muted/40 transition-colors"
            >
              <Bookmark className="h-3 w-3" />
              Save
            </button>
          )}
          {onAddToItinerary && (
            <button
              onClick={() => onAddToItinerary(item)}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border border-border bg-background hover:bg-muted/40 transition-colors"
            >
              <PlusCircle className="h-3 w-3" />
              Add to itinerary
            </button>
          )}
        </div>
      </div>
    </div>
  );
}