import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Cloud, RefreshCw, Thermometer, Droplets, Wind, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WeatherWidget({ trip }) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (trip.destination) fetchWeather();
  }, [trip.id]);

  async function fetchWeather() {
    setLoading(true);
    const dateContext = trip.start_date
      ? `The trip runs from ${trip.start_date} to ${trip.end_date || trip.start_date}.`
      : "";
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Get the current weather forecast for ${trip.destination}. ${dateContext}
      Return a 5-day forecast with daily highs/lows, conditions, and a packing tip.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          summary: { type: "string", description: "1-sentence overall weather summary" },
          packing_tip: { type: "string", description: "What to pack based on weather" },
          days: {
            type: "array",
            items: {
              type: "object",
              properties: {
                day: { type: "string" },
                high: { type: "string" },
                low: { type: "string" },
                condition: { type: "string" },
                emoji: { type: "string" },
              },
            },
          },
        },
      },
    });
    setWeather(result);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-100 rounded-2xl p-4 mb-5 flex items-center gap-3">
        <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-blue-600">Fetching weather for {trip.destination}...</p>
      </div>
    );
  }

  if (!weather) return null;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-100 rounded-2xl p-4 mb-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
            <Cloud className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-blue-800">Weather Forecast</p>
            <p className="text-[10px] text-blue-500">{trip.destination}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-blue-400 hover:text-blue-600"
          onClick={fetchWeather}
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </div>

      {weather.summary && (
        <p className="text-xs text-blue-700 mb-3 leading-relaxed">{weather.summary}</p>
      )}

      {weather.days?.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {weather.days.map((d, i) => (
            <div key={i} className="shrink-0 bg-white/70 rounded-xl px-2.5 py-2 text-center min-w-[58px]">
              <p className="text-[10px] font-medium text-blue-600 mb-1">{d.day}</p>
              <p className="text-lg leading-none mb-1">{d.emoji || "🌤"}</p>
              <p className="text-[10px] font-semibold text-slate-700">{d.high}</p>
              <p className="text-[9px] text-slate-400">{d.low}</p>
              <p className="text-[9px] text-slate-500 mt-0.5 truncate max-w-[52px]">{d.condition}</p>
            </div>
          ))}
        </div>
      )}

      {weather.packing_tip && (
        <div className="mt-3 flex items-start gap-2 bg-white/60 rounded-xl p-2">
          <Sun className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-600 leading-relaxed">{weather.packing_tip}</p>
        </div>
      )}
    </div>
  );
}