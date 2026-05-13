import { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import RecommendationCard from "@/components/aira/RecommendationCard";

const CATEGORIES = [
  { label: "🍽 Food", value: "restaurants and food spots" },
  { label: "📍 Things to Do", value: "things to do, attractions, sightseeing, local experiences" },
  { label: "🎉 Nightlife", value: "bars, nightlife, clubs, live music, late night spots" },
];

export default function Discover() {
  const [location, setLocation] = useState("");
  const locationRef = useRef("");
  const [activeCategory, setActiveCategory] = useState(null);
  const [phase, setPhase] = useState("idle"); // idle | loading | results | error
  const [suggestions, setSuggestions] = useState([]);
  const [activeTrip, setActiveTrip] = useState(null);

  useEffect(() => {
    base44.auth.me().then(me => {
      if (!me) return;
      const today = format(new Date(), "yyyy-MM-dd");
      base44.entities.Trip.list("-start_date", 50).then(trips => {
        const active = trips.find(t =>
          t.member_emails?.includes(me.email) &&
          t.start_date <= today && t.end_date >= today
        );
        if (active) {
          setActiveTrip(active);
          setLocation(active.destination);
          locationRef.current = active.destination;
        }
      }).catch(() => {});
    }).catch(() => {});
  }, []);

  async function runSearch(category) {
    const dest = locationRef.current.trim();
    if (!dest) return;

    setActiveCategory(category);
    setPhase("loading");
    setSuggestions([]);

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a local travel guide. The user is in ${dest} and wants: ${category.value}.

Give exactly 5 specific, real, local recommendations. Be direct and useful — like a tip from a local friend. No filler, no generic advice, no raw URLs.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            results: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  location: { type: "string" },
                  tags: { type: "array", items: { type: "string" } },
                },
              },
            },
          },
        },
      });

      const items = result?.results || [];
      setSuggestions(items);
      setPhase(items.length > 0 ? "results" : "empty");
    } catch {
      setPhase("error");
    }
  }

  return (
    <div
      className="px-5 pb-28 max-w-lg mx-auto space-y-6"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 24px)" }}
    >
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold" style={{ letterSpacing: "-0.02em" }}>Discover</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Find the best spots wherever you are</p>
      </div>

      {/* Location input */}
      <div>
        {activeTrip ? (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-border bg-card text-sm">
            <span className="text-muted-foreground">📍</span>
            <span className="font-medium">{activeTrip.destination}</span>
            <span className="text-xs text-muted-foreground ml-auto">active trip</span>
          </div>
        ) : (
          <Input
            value={location}
            onChange={(e) => { setLocation(e.target.value); locationRef.current = e.target.value; }}
            onKeyDown={(e) => { if (e.key === "Enter") runSearch(CATEGORIES[1]); }}
            placeholder="Enter a city (e.g. Lisbon, Tulum, NYC)"
            className="rounded-full h-10"
          />
        )}
      </div>

      {/* Category buttons */}
      <div className="flex gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => runSearch(cat)}
            disabled={phase === "loading" || !locationRef.current.trim()}
            className="flex-1 py-2.5 rounded-2xl text-sm font-medium border transition-all active:scale-95 disabled:opacity-40"
            style={
              activeCategory?.value === cat.value && phase !== "idle"
                ? { background: "#C8A27C", color: "white", borderColor: "#C8A27C" }
                : { background: "var(--card)", color: "var(--foreground)", borderColor: "hsl(var(--border))" }
            }
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {phase === "loading" && (
        <div className="flex flex-col items-center py-12 gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Finding spots in {locationRef.current}...</p>
        </div>
      )}

      {/* Results */}
      {phase === "results" && (
        <div className="space-y-3">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
            {activeCategory?.label} in {locationRef.current}
          </p>
          {suggestions.map((s, i) => (
            <RecommendationCard key={i} item={s} index={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {phase === "empty" && (
        <div className="text-center py-12">
          <p className="text-sm font-medium">No results found</p>
          <p className="text-xs text-muted-foreground mt-1">Try a different city or category</p>
        </div>
      )}

      {/* Error state */}
      {phase === "error" && (
        <div className="text-center py-12">
          <p className="text-sm font-medium text-destructive">Something went wrong</p>
          <p className="text-xs text-muted-foreground mt-1">Check your connection and try again</p>
          <button
            onClick={() => activeCategory && runSearch(activeCategory)}
            className="mt-3 text-xs underline underline-offset-2 text-muted-foreground"
          >
            Retry
          </button>
        </div>
      )}

      <p className="text-[10px] text-muted-foreground pt-2">☆ AI-powered suggestions. Always verify locally.</p>
    </div>
  );
}