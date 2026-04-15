import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { ChevronDown, ChevronUp, Plus, RefreshCw, Bookmark, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

const CATEGORIES = [
  { label: "🌅 Morning plans", value: "morning activities and things to do at the start of the day" },
  { label: "🍽 Food spots", value: "must-try restaurants, cafes, and local food experiences" },
  { label: "🎉 Nightlife", value: "nightlife, bars, live music, and evening entertainment" },
  { label: "👥 Group activities", value: "fun activities for a group to do together" },
  { label: "💸 Budget-friendly", value: "low-cost or free activities and experiences" },
  { label: "🌧 Rainy day ideas", value: "indoor activities and things to do when it rains" },
  { label: "💎 Hidden gems", value: "off-the-beaten-path spots and local secrets" },
];

function SuggestionCard({ suggestion, trip, onAdded, onMoreLike }) {
  const [expanded, setExpanded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [saved, setSaved] = useState(false);

  async function addToItinerary() {
    setAdding(true);
    // Pick the first trip day as a default date if available
    const defaultDate = trip.start_date || format(new Date(), "yyyy-MM-dd");
    await base44.entities.ItineraryItem.create({
      trip_id: trip.id,
      title: suggestion.title,
      location: suggestion.location || "",
      notes: suggestion.description || "",
      date: defaultDate,
      time: suggestion.suggested_time || "",
      is_required: false,
    });
    setAdding(false);
    toast.success(`"${suggestion.title}" added to itinerary`);
    onAdded?.();
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div
        className="p-3.5 cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className="text-sm font-semibold leading-snug">{suggestion.title}</p>
            {suggestion.location && (
              <p className="text-[11px] text-muted-foreground mt-0.5">{suggestion.location}</p>
            )}
          </div>
          <div className="shrink-0 mt-0.5 text-muted-foreground">
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </div>
        </div>

        {expanded && (
          <p className="text-xs text-muted-foreground leading-relaxed mt-2 pt-2 border-t border-border">
            {suggestion.description}
          </p>
        )}
      </div>

      <div className="px-3.5 pb-3 flex items-center gap-2 border-t border-border/50 pt-2.5">
        <Button
          size="sm"
          className="rounded-full h-7 text-xs flex-1"
          onClick={addToItinerary}
          disabled={adding}
          style={{ background: "#C8A27C", color: "white" }}
        >
          {adding ? (
            <span className="flex items-center gap-1"><RefreshCw className="h-3 w-3 animate-spin" /> Adding…</span>
          ) : (
            <span className="flex items-center gap-1"><Plus className="h-3 w-3" /> Add to itinerary</span>
          )}
        </Button>
        <button
          className="h-7 w-7 rounded-full border border-border flex items-center justify-center shrink-0 transition-colors"
          style={saved ? { background: "#C8A27C", borderColor: "#C8A27C" } : {}}
          onClick={() => { setSaved((v) => !v); if (!saved) toast.success("Saved for later"); }}
          title="Save for later"
        >
          <Bookmark className="h-3 w-3" style={saved ? { color: "white" } : {}} />
        </button>
        <button
          className="h-7 px-2.5 rounded-full border border-border text-[11px] text-muted-foreground shrink-0 transition-colors hover:border-primary hover:text-primary"
          onClick={() => onMoreLike?.(suggestion.title)}
          title="More like this"
        >
          more ↻
        </button>
      </div>
    </div>
  );
}

export default function ItineraryPlanner({ trip, isEmpty, onActivityAdded }) {
  const [open, setOpen] = useState(isEmpty); // auto-open if itinerary is empty
  const [activeCategory, setActiveCategory] = useState(null);
  const [phase, setPhase] = useState("home"); // home | loading | results
  const [suggestions, setSuggestions] = useState([]);

  const groupSize = trip?.member_emails?.length || 1;
  const dateRange = trip?.start_date && trip?.end_date
    ? `${format(parseISO(trip.start_date), "MMM d")} – ${format(parseISO(trip.end_date), "MMM d, yyyy")}`
    : null;

  async function fetchSuggestions(categoryValue, moreLikeTitle = null) {
    setPhase("loading");
    setSuggestions([]);

    const prompt = moreLikeTitle
      ? `You are a trip planning assistant. Give 5 more suggestions similar to "${moreLikeTitle}" for a trip to ${trip.destination}${dateRange ? ` (${dateRange})` : ""} with a group of ${groupSize}. Focus on: ${categoryValue || "general activities"}.`
      : `You are a trip planning assistant. Generate 5 specific activity suggestions for a trip to ${trip.destination}${dateRange ? ` (${dateRange})` : ""} with a group of ${groupSize}.
Focus on: ${categoryValue}.
Be specific to ${trip.destination}. Give real, named places or experiences where possible. Keep it practical and actionable.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          suggestions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                location: { type: "string" },
                suggested_time: { type: "string" },
              },
            },
          },
        },
      },
    });

    setSuggestions(result?.suggestions || []);
    setPhase("results");
  }

  function handleCategory(cat) {
    setActiveCategory(cat);
    fetchSuggestions(cat.value);
  }

  function handleMoreLike(title) {
    fetchSuggestions(activeCategory?.value || "", title);
  }

  if (!open) {
    return (
      <button
        className="w-full flex items-center justify-between px-4 py-3 rounded-2xl border border-dashed border-border text-sm text-muted-foreground hover:border-primary/50 transition-colors mb-4"
        onClick={() => setOpen(true)}
      >
        <span className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5" style={{ color: "#C8A27C" }} />
          Find activities for {trip.destination}
        </span>
        <ChevronDown className="h-3.5 w-3.5" />
      </button>
    );
  }

  return (
    <div className="mb-5 rounded-2xl border border-border bg-muted/30 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" style={{ color: "#C8A27C" }} />
          <div>
            <p className="text-sm font-semibold">Plan your trip</p>
            {dateRange && (
              <p className="text-[10px] text-muted-foreground">{trip.destination} · {dateRange} · {groupSize} {groupSize === 1 ? "person" : "people"}</p>
            )}
          </div>
        </div>
        <button
          className="text-muted-foreground"
          onClick={() => { setOpen(false); setPhase("home"); setActiveCategory(null); setSuggestions([]); }}
        >
          <ChevronUp className="h-4 w-4" />
        </button>
      </div>

      {/* Category pills */}
      <div>
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium mb-2">What are you looking for?</p>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => handleCategory(cat)}
              disabled={phase === "loading"}
              className="text-xs px-3 py-1.5 rounded-full border transition-all active:scale-95"
              style={
                activeCategory?.value === cat.value
                  ? { background: "#C8A27C", color: "white", borderColor: "#C8A27C" }
                  : { background: "white", color: "var(--foreground)", borderColor: "var(--border)" }
              }
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {phase === "loading" && (
        <div className="flex items-center gap-3 py-6 justify-center">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Finding ideas for {trip.destination}…</p>
        </div>
      )}

      {/* Results */}
      {phase === "results" && suggestions.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Suggestions</p>
            <button
              className="text-[11px] text-muted-foreground underline underline-offset-2"
              onClick={() => fetchSuggestions(activeCategory?.value)}
            >
              refresh
            </button>
          </div>
          {suggestions.map((s, i) => (
            <SuggestionCard
              key={i}
              suggestion={s}
              trip={trip}
              onAdded={onActivityAdded}
              onMoreLike={handleMoreLike}
            />
          ))}
        </div>
      )}

      {phase === "home" && (
        <p className="text-xs text-muted-foreground text-center py-2">
          Pick a category above to get personalized suggestions
        </p>
      )}
    </div>
  );
}