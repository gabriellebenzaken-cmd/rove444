import { useState } from "react";
import { ChevronDown, ChevronUp, MapPin, Bookmark, PlusCircle, Map } from "lucide-react";

export default function RecommendationCard({ suggestion, index, onAddToItinerary }) {
  const [expanded, setExpanded] = useState(false);

  const vibes = suggestion.vibes || [];

  function openMaps() {
    const q = encodeURIComponent(`${suggestion.title}${suggestion.neighborhood ? ` ${suggestion.neighborhood}` : ""}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, "_blank");
  }

  return (
    <div
      className="bg-card border border-border rounded-2xl overflow-hidden transition-all"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Main row */}
      <div
        className="flex items-start justify-between gap-3 p-4 cursor-pointer active:bg-muted/30"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-snug truncate">{suggestion.title}</p>
          {suggestion.neighborhood && (
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
              <span className="text-[11px] text-muted-foreground truncate">{suggestion.neighborhood}</span>
            </div>
          )}
          {suggestion.tagline && (
            <p className="text-xs text-foreground/70 mt-1.5 leading-snug">{suggestion.tagline}</p>
          )}
          {vibes.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {vibes.map((v) => (
                <span
                  key={v}
                  className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-accent text-accent-foreground"
                >
                  {v}
                </span>
              ))}
            </div>
          )}
        </div>
        <button className="text-muted-foreground mt-0.5 shrink-0 ml-1">
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-border/60 pt-3">
          {suggestion.description && (
            <p className="text-xs text-muted-foreground leading-relaxed">{suggestion.description}</p>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={openMaps}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border border-border bg-background hover:bg-muted/40 transition-colors"
            >
              <Map className="h-3 w-3" />
              Maps
            </button>
            {onAddToItinerary && (
              <button
                onClick={() => onAddToItinerary(suggestion)}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border border-border bg-background hover:bg-muted/40 transition-colors"
              >
                <PlusCircle className="h-3 w-3" />
                Add to itinerary
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}