import { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { getLocationGreeting, getTimeContext, getLocationTime } from "@/lib/locationTime";

const MOODS = [
  { label: "🍽 Food", value: "food spots and restaurants" },
  { label: "🍹 Drinks", value: "bars, cocktails, drinks" },
  { label: "🏖 Chill", value: "relaxing, low-key activities" },
  { label: "🎉 Nightlife", value: "nightlife, clubs, events" },
  { label: "📸 Explore", value: "photo spots, sightseeing, local gems" },
];

function SuggestionCard({ suggestion, index }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      className="bg-card border border-border rounded-2xl p-4 cursor-pointer active:scale-[0.98] transition-all"
      onClick={() => setExpanded((v) => !v)}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="text-sm font-semibold leading-snug">{suggestion.title}</p>
          {suggestion.category && (
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5 block">
              {suggestion.category}
            </span>
          )}
        </div>
        <button className="text-muted-foreground mt-0.5 shrink-0">
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>
      {expanded && (
        <p className="text-xs text-muted-foreground leading-relaxed mt-2 pt-2 border-t border-border">
          {suggestion.description}
        </p>
      )}
    </div>
  );
}

export default function TripAira({ trip }) {
  const [phase, setPhase] = useState("home"); // home | loading | results | chat
  const [activeMood, setActiveMood] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef(null);
  const greeting = getLocationGreeting(trip);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

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

Give 5 specific, real, actionable suggestions for RIGHT NOW. Each should feel immediate and discoverable — like a local friend's tip.
Be specific to ${trip?.destination || "the destination"}. No generic advice.`,
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
                category: { type: "string" },
              },
            },
          },
        },
      },
    });

    setSuggestions(result?.suggestions || []);
    setPhase("results");
  }

  async function sendChat(e) {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const msg = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", content: msg }]);
    setChatLoading(true);

    const { time: timeCtx } = getLocationTime(trip);
    const history = chatMessages.slice(-6).map((m) => `${m.role === "user" ? "User" : "Aira"}: ${m.content}`).join("\n");

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are Aira, a spontaneous trip assistant for ${trip?.destination || "this destination"}. It's ${timeCtx} local time in ${trip?.destination || "this destination"}.
${activeMood ? `Context: user is looking for ${activeMood.value}.` : ""}
${history ? `Conversation so far:\n${history}\n` : ""}
User: ${msg}

Be helpful, concise, and local-knowledge-first. 2-3 sentences max.`,
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
            <SuggestionCard key={i} suggestion={s} index={i} />
          ))}
          <button
            className="text-xs text-muted-foreground underline underline-offset-2 mt-1 pl-1"
            onClick={() => handleMood(activeMood)}
          >
            refresh suggestions
          </button>
        </div>
      )}

      {/* Chat — secondary, always available after a mood pick or on demand */}
      {(phase === "results" || phase === "chat") && (
        <div className="space-y-2.5">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Ask anything</p>
          {chatMessages.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-card border border-border rounded-bl-sm"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-3 py-2.5">
                    <div className="flex gap-1">
                      {[0, 150, 300].map((d) => (
                        <span key={d} className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>
          )}
          <form onSubmit={sendChat} className="flex gap-2">
            <Input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={`Ask about ${trip?.destination || "your destination"}…`}
              className="rounded-full flex-1 text-sm"
              disabled={chatLoading}
            />
            <Button type="submit" size="icon" className="rounded-full shrink-0" disabled={chatLoading || !chatInput.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}

      {/* Show chat option even at home phase */}
      {phase === "home" && (
        <div>
          <button
            className="text-xs text-muted-foreground underline underline-offset-2"
            onClick={() => setPhase("chat")}
          >
            or just ask me anything →
          </button>
          {phase === "chat" && (
            <form onSubmit={sendChat} className="flex gap-2 mt-2">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={`Ask about ${trip?.destination || "your destination"}…`}
                className="rounded-full flex-1 text-sm"
                disabled={chatLoading}
              />
              <Button type="submit" size="icon" className="rounded-full shrink-0" disabled={chatLoading || !chatInput.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-[10px] text-muted-foreground leading-relaxed pt-2">
        ☆ AI-powered suggestions. Always verify locally.
      </p>
    </div>
  );
}