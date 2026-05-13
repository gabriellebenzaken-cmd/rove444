import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { getLocationGreeting, getTimeContext, getLocationTime } from "@/lib/locationTime";
import RecommendationCard from "@/components/aira/RecommendationCard";
import AiraChat from "@/components/aira/AiraChat";

const MOODS = [
  { label: "🍽 Food", value: "food spots and restaurants" },
  { label: "🍹 Drinks", value: "bars, cocktails, drinks" },
  { label: "🏖 Chill", value: "relaxing, low-key activities" },
  { label: "🎉 Nightlife", value: "nightlife, clubs, events" },
  { label: "📸 Explore", value: "photo spots, sightseeing, local gems" },
];

const FOLLOW_UPS = [
  "Open now",
  "Best aesthetic spots",
  "Budget-friendly",
  "Group-friendly",
  "More like this",
];

export default function Discover() {
  const [phase, setPhase] = useState("home");
  const [activeMood, setActiveMood] = useState(null);
  const [location, setLocation] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [activeTrip, setActiveTrip] = useState(null);
  const [searchError, setSearchError] = useState(null);

  useEffect(() => {
    // Check for active trip today
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
        }
      }).catch(() => {});
    }).catch(() => {});
  }, []);



  async function handleSearch(mood) {
    const dest = location.trim();
    if (!dest) return;
    const moodToUse = mood || activeMood || MOODS.find(m => m.label === "📸 Explore");
    setActiveMood(moodToUse);
    setPhase("loading");
    setSuggestions([]);
    setSearchError(null);

    const timeCtx = getTimeContext(activeTrip);
    const groupSize = activeTrip?.member_emails?.length || 1;

    try {
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are Aira, a spontaneous trip discovery assistant.
The user is currently in ${dest} (${timeCtx}) with a group of ${groupSize}.
They want: ${moodToUse.value}.

Give 5 specific, real, local recommendations. Each should feel like a tip from a local friend — immediate, discoverable, no fluff.
Be specific to ${dest}. No generic advice. No raw URLs.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          title: { type: "string", description: "Short feed title e.g. 'Best matcha in Tampa'" },
          results: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string", description: "Place or activity name" },
                description: { type: "string", description: "2-3 sentences, no URLs" },
                location: { type: "string", description: "Neighborhood or city" },
                tags: { type: "array", items: { type: "string" }, description: "2-4 tags" },
              },
            },
          },
        },
      },
    });

    setSuggestions(result?.results || []);
    setPhase("results");
    } catch (err) {
      setSearchError("Couldn't load suggestions. Please try again.");
      setPhase("home");
    }
  }

  async function handleMood(mood) {
    await handleSearch(mood);
  }

  async function sendChat(e, overrideMsg) {
    e.preventDefault();
    const msg = overrideMsg || chatInput.trim();
    if (!msg) return;
    setChatInput("");
    if (!overrideMsg) setChatMessages((prev) => [...prev, { role: "user", content: msg }]);
    setChatLoading(true);

    const { time: timeCtx } = getLocationTime(activeTrip);
    const dest = location || "their destination";
    const history = chatMessages.slice(-6).map((m) => `${m.role === "user" ? "User" : "Aira"}: ${m.content}`).join("\n");

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are Aira, a spontaneous trip assistant. It's ${timeCtx} in ${dest}.
${activeMood ? `Context: user is looking for ${activeMood.value}.` : ""}
${history ? `Conversation:\n${history}\n` : ""}
User: ${msg}

If the user is asking for place recommendations, return a JSON object with "title" (string) and "results" (array of {name, description, location, tags[]}).
If it's a general question, return a JSON object with just "content" (a short plain text answer, 2-3 sentences, no URLs).`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          content: { type: "string" },
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

    setChatMessages((prev) => [...prev, { role: "aira", ...result }]);
    setChatLoading(false);
  }

  const greeting = getLocationGreeting(activeTrip);

  return (
    <div className="px-5 pb-28 max-w-lg mx-auto space-y-5" style={{ paddingTop: "calc(3.5rem + env(safe-area-inset-top))" }}>
      {/* Header */}
      <div>
        <p className="text-base font-semibold leading-snug" style={{ letterSpacing: "-0.02em" }}>
          {greeting}
        </p>
        {activeTrip ? (
          <p className="text-xs text-muted-foreground mt-0.5">currently in {activeTrip.destination}</p>
        ) : (
          <div className="flex items-center gap-2 mt-2">
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSearch(null); }}
              placeholder="Where are you? (e.g. Tulum)"
              className="rounded-full text-sm h-8 flex-1"
            />
          </div>
        )}
        {searchError && (
          <p className="text-xs text-destructive mt-1">{searchError}</p>
        )}
      </div>

      {/* Mood pills */}
      <div>
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium mb-2">I'm feeling...</p>
        <div className="flex flex-wrap gap-2">
          {MOODS.map((mood) => (
            <button
              key={mood.value}
              onClick={() => handleMood(mood)}
              disabled={phase === "loading"}
              className="text-sm px-3.5 py-2 rounded-full border border-border transition-all active:scale-95"
              style={
                activeMood?.value === mood.value
                  ? { background: "#C8A27C", color: "white", borderColor: "#C8A27C" }
                  : { background: "var(--card)", color: "var(--foreground)" }
              }
            >
              {mood.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {phase === "loading" && (
        <div className="flex flex-col items-center py-10 gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Finding the best spots...</p>
        </div>
      )}

      {/* Results */}
      {phase === "results" && suggestions.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Right now</p>
          {suggestions.map((s, i) => (
            <RecommendationCard key={i} item={s} index={i} />
          ))}

          {/* Follow-up chips */}
          <div className="pt-1 space-y-2">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Refine</p>
            <div className="flex flex-wrap gap-2">
              {FOLLOW_UPS.map((chip) => (
                <button
                  key={chip}
                  onClick={() => {
                    setChatMessages((prev) => [...prev, { role: "user", content: chip }]);
                    setPhase("chat");
                    sendChat({ preventDefault: () => {} }, chip);
                  }}
                  className="text-xs px-3 py-1.5 rounded-full border border-border bg-card hover:bg-muted/40 transition-colors"
                >
                  {chip}
                </button>
              ))}
              <button
                className="text-xs px-3 py-1.5 rounded-full border border-border bg-card hover:bg-muted/40 transition-colors"
                onClick={() => handleMood(activeMood)}
              >
                ↻ Refresh
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat — secondary */}
      {(phase === "results" || phase === "chat") && (
        <AiraChat
          messages={chatMessages}
          input={chatInput}
          onInputChange={setChatInput}
          onSubmit={sendChat}
          loading={chatLoading}
          placeholder="Ask about where you are…"
        />
      )}

      {phase === "home" && (
        <button
          className="text-xs text-muted-foreground underline underline-offset-2"
          onClick={() => setPhase("chat")}
        >
          or just ask me anything →
        </button>
      )}

      <p className="text-[10px] text-muted-foreground leading-relaxed pt-2">
        ☆ AI-powered suggestions. Always verify locally.
      </p>
    </div>
  );
}