import { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, RefreshCw, Lightbulb, DollarSign, Bus, MapPin, Link2, Send, Bot } from "lucide-react";

const icons = {
  tip: Lightbulb,
  budget: DollarSign,
  transport: Bus,
  attraction: MapPin,
  food: Sparkles,
};

const colors = {
  tip: "bg-amber-50 text-amber-600 border-amber-200",
  budget: "bg-emerald-50 text-emerald-600 border-emerald-200",
  transport: "bg-blue-50 text-blue-600 border-blue-200",
  attraction: "bg-purple-50 text-purple-600 border-purple-200",
  food: "bg-rose-50 text-rose-600 border-rose-200",
};

export default function TripAira({ trip }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [linkSummary, setLinkSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  async function generateSuggestions() {
    setLoading(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are Aira, a helpful travel guide. Generate 5 practical travel suggestions for a trip to ${trip.destination}${trip.start_date ? ` from ${trip.start_date} to ${trip.end_date}` : ''}. 
      Include a mix of: travel tips, budget suggestions, transport, must-visit spots, food recommendations. Make them specific to ${trip.destination} and practical.`,
      response_json_schema: {
        type: "object",
        properties: {
          suggestions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: { type: "string", enum: ["tip", "budget", "transport", "attraction", "food"] },
                title: { type: "string" },
                description: { type: "string" },
              },
            },
          },
        },
      },
      add_context_from_internet: true,
    });
    setSuggestions(result.suggestions || []);
    setLoading(false);
  }

  async function summarizeLinks() {
    setSummaryLoading(true);
    const links = await base44.entities.TripLink.filter({ trip_id: trip.id }, "-created_date", 100);
    if (links.length === 0) {
      setLinkSummary("No links have been shared for this trip yet.");
      setSummaryLoading(false);
      return;
    }
    const linkList = links.map((l) =>
      `- [${l.category?.toUpperCase()}] ${l.title || "(no title)"}: ${l.url}${l.note ? ` (note: ${l.note})` : ""}`
    ).join("\n");

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `The group has shared the following links for their trip to ${trip.destination}:

${linkList}

Please summarize these links in a helpful way. Group them by category if applicable, highlight the most interesting ones, and suggest which activities or restaurants seem most worth visiting. Keep it concise and fun.`,
      add_context_from_internet: true,
    });
    setLinkSummary(result);
    setSummaryLoading(false);
  }

  async function sendChat(e) {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setChatLoading(true);

    const history = chatMessages.slice(-6).map((m) => `${m.role === "user" ? "User" : "Aira"}: ${m.content}`).join("\n");
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are Aira, an expert AI travel guide for a trip to ${trip.destination}${trip.start_date ? ` from ${trip.start_date} to ${trip.end_date}` : ""}.
      
Previous conversation:
${history}

User: ${userMsg}

Answer helpfully with specific, local knowledge. Be concise and friendly.`,
      add_context_from_internet: true,
    });
    setChatMessages((prev) => [...prev, { role: "aira", content: result }]);
    setChatLoading(false);
  }

  return (
    <div className="pb-24 space-y-6">
      {/* Disclaimer */}
      <div className="bg-muted/60 border border-border rounded-xl px-3 py-2.5 flex items-start gap-2">
        <span className="text-muted-foreground text-sm mt-0.5">ⓘ</span>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Aira's suggestions are AI-generated for inspiration only. Always verify travel information independently.
        </p>
      </div>

      {/* Travel Tips */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Travel Tips</h3>
              <p className="text-[10px] text-muted-foreground">AI-curated for {trip.destination}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="rounded-full" onClick={generateSuggestions} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? "animate-spin" : ""}`} />
            {suggestions.length === 0 ? "Get Tips" : "Refresh"}
          </Button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center py-10 gap-3">
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Aira is thinking...</p>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-14 h-14 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <p className="text-muted-foreground text-sm">Tap "Get Tips" for personalized suggestions</p>
          </div>
        ) : (
          <div className="space-y-3">
            {suggestions.map((s, i) => {
              const Icon = icons[s.type] || Lightbulb;
              const colorClass = colors[s.type] || colors.tip;
              return (
                <div key={i} className={`rounded-2xl border p-4 ${colorClass}`}>
                  <div className="flex items-start gap-3">
                    <Icon className="h-5 w-5 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="font-semibold text-sm mb-1">{s.title}</h4>
                      <p className="text-xs opacity-80 leading-relaxed">{s.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Link Summary */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-100 to-rose-50 flex items-center justify-center">
              <Link2 className="h-4 w-4 text-rose-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Shared Links Summary</h3>
              <p className="text-[10px] text-muted-foreground">AI digest of links your group saved</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="rounded-full" onClick={summarizeLinks} disabled={summaryLoading}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${summaryLoading ? "animate-spin" : ""}`} />
            {linkSummary ? "Refresh" : "Summarize"}
          </Button>
        </div>

        {summaryLoading ? (
          <div className="flex items-center gap-3 py-6 justify-center">
            <div className="w-5 h-5 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Analyzing your links...</p>
          </div>
        ) : linkSummary ? (
          <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 text-sm text-rose-900 leading-relaxed whitespace-pre-wrap">
            {linkSummary}
          </div>
        ) : (
          <div className="text-center py-6 bg-muted/40 rounded-2xl">
            <p className="text-xs text-muted-foreground">Tap "Summarize" to get an AI digest of all shared links</p>
          </div>
        )}
      </div>

      {/* Chat with Aira */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-100 to-violet-50 flex items-center justify-center">
            <Bot className="h-4 w-4 text-violet-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Ask Aira</h3>
            <p className="text-[10px] text-muted-foreground">Top cafes, things to do, packing tips...</p>
          </div>
        </div>

        {chatMessages.length > 0 && (
          <div className="space-y-2 mb-3 max-h-72 overflow-y-auto pr-1">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
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
                <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-3 py-2">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
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
            placeholder={`Top rated cafes in ${trip.destination}...`}
            className="rounded-full flex-1"
            disabled={chatLoading}
          />
          <Button type="submit" size="icon" className="rounded-full shrink-0" disabled={chatLoading || !chatInput.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}