import { useState } from "react";
import { base44 } from "@/api/base44Client";
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

export default function TripAira({ trip }) {
  const [phase, setPhase] = useState("home"); // home | loading | results | chat
  const [activeMood, setActiveMood] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const greeting = getLocationGreeting(trip);

  async function handleMood(mood) {
    setActiveMood(mood);
    setPhase("loading");
    setSuggestions([]);

    const timeCtx = getTimeContext(trip);
    const groupSize = trip?.member_emails?.length || 1;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are Aira, a spontaneous trip discovery assistant. 
The user is in ${trip?.destination || "their destination"} right now (${timeCtx}, local destination time) with a group of ${groupSize}.
They want: ${mood.value}.

Give 5 specific, real, actionable recommendations. Each should feel like a local friend's tip — immediate and discoverable.
Be specific to ${trip?.destination || "the destination"}. No generic advice. No raw URLs in descriptions.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          suggestions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string", description: "Place or activity name" },
                tagline: { type: "string", description: "One punchy sentence — why go now" },
                description: { type: "string", description: "2-3 sentence detail, no URLs" },
                neighborhood: { type: "string", description: "Neighborhood or area" },
                vibes: { type: "array", items: { type: "string" }, description: "2-4 short vibe tags e.g. cozy, rooftop, group-friendly" },
              },
            },
          },
        },
      },
    });

    setSuggestions(result?.suggestions || []);
    setPhase("results");
  }

  async function sendChat(e, overrideMsg) {
    e.preventDefault();
    const msg = overrideMsg || chatInput.trim();
    if (!msg) return;
    setChatInput("");
    if (!overrideMsg) setChatMessages((prev) => [...prev, { role: "user", content: msg }]);
    setChatLoading(true);

    const { time: timeCtx } = getLocationTime(trip);
    const history = chatMessages.slice(-6).map((m) => `${m.role === "user" ? "User" : "Aira"}: ${m.content}`).join("\n");

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are Aira, a spontaneous trip assistant for ${trip?.destination || "this destination"}. It's ${timeCtx} local time in ${trip?.destination || "this destination"}.
${activeMood ? `Context: user is looking for ${activeMood.value}.` : ""}
${history ? `Conversation so far:\n${history}\n` : ""}
User: ${msg}

Be helpful, concise, and local-knowledge-first. 2-3 sentences max. No raw URLs.`,
      add_context_from_internet: true,
    });

    setChatMessages((prev) => [...prev, { role: "aira", content: result }]);
    setChatLoading(false);
  }

  return (
    <div className="pb-28 space-y-5">
      {/* Header greeting */}
      <div className="pt-1">
        <p className="text-base font-semibold leading-snug" style={{ letterSpacing: "-0.02em" }}>
          {greeting}
        </p>
        {trip?.destination && (
          <p className="text-xs text-muted-foreground mt-0.5">in {trip.destination}</p>
        )}
      </div>

      {/* Mood quick actions */}
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

      {/* Loading state */}
      {phase === "loading" && (
        <div className="flex flex-col items-center py-10 gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Finding the best spots...</p>
        </div>
      )}

      {/* Suggestion cards */}
      {phase === "results" && suggestions.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Right now near you</p>
          {suggestions.map((s, i) => (
            <RecommendationCard key={i} suggestion={s} index={i} />
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
                    sendChat({ preventDefault: () => {}, target: {} }, chip);
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
          placeholder={`Ask about ${trip?.destination || "your destination"}…`}
        />
      )}

      {/* Show chat option at home phase */}
      {phase === "home" && (
        <button
          className="text-xs text-muted-foreground underline underline-offset-2"
          onClick={() => setPhase("chat")}
        >
          or just ask me anything →
        </button>
      )}

      {/* Disclaimer */}
      <p className="text-[10px] text-muted-foreground leading-relaxed pt-2">
        ☆ AI-powered suggestions. Always verify locally.
      </p>
    </div>
  );
}