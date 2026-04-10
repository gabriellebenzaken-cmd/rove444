import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw, Lightbulb, DollarSign, Bus, MapPin } from "lucide-react";

export default function TripAira({ trip }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  async function generateSuggestions() {
    setLoading(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are Aira, a helpful travel guide. Generate 5 practical travel suggestions for a trip to ${trip.destination}${trip.start_date ? ` from ${trip.start_date} to ${trip.end_date}` : ''}. 
      
      Include a mix of:
      - Travel tips (local customs, weather advice)
      - Budget suggestions (money saving tips)
      - Transport suggestions (getting around)
      - Must-visit spots
      - Food recommendations
      
      Make them specific to ${trip.destination} and practical.`,
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

  return (
    <div className="pb-24">
      <div className="bg-muted/60 border border-border rounded-xl px-3 py-2.5 mb-4 flex items-start gap-2">
        <span className="text-muted-foreground text-sm mt-0.5">ⓘ</span>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Aira's suggestions are AI-generated for inspiration only. Always verify travel information independently. Use recommendations at your own risk.
        </p>
      </div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Aira</h3>
            <p className="text-[10px] text-muted-foreground">Your travel guide</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={generateSuggestions}
          disabled={loading}
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? "animate-spin" : ""}`} />
          {suggestions.length === 0 ? "Get Tips" : "Refresh"}
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center py-16 gap-3">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Aira is thinking...</p>
        </div>
      ) : suggestions.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
          <h3 className="font-semibold text-lg mb-1">Meet Aira</h3>
          <p className="text-muted-foreground text-sm mb-1">Your AI travel guide for {trip.destination}</p>
          <p className="text-xs text-muted-foreground">Tap "Get Tips" for personalized suggestions</p>
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
  );
}