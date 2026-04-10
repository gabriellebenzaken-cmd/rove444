import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { RefreshCw } from "lucide-react";

function parseTemp(t) {
  if (!t) return 0;
  return parseInt(String(t).replace(/[^\d-]/g, "")) || 0;
}

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
      Return a 5-day forecast with daily highs/lows and conditions.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
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
      <div className="flex items-center gap-2 py-4 px-1 mb-4">
        <div className="w-4 h-4 border-[1.5px] border-t-transparent rounded-full animate-spin" style={{ borderColor: 'rgba(200,162,124,0.6)', borderTopColor: 'transparent' }} />
        <p className="text-xs" style={{ color: 'rgba(154,138,122,0.8)' }}>Loading forecast…</p>
      </div>
    );
  }

  if (!weather?.days?.length) return null;

  const temps = weather.days.map(d => ({ hi: parseTemp(d.high), lo: parseTemp(d.low) }));
  const globalMin = Math.min(...temps.map(t => t.lo));
  const globalMax = Math.max(...temps.map(t => t.hi));
  const range = globalMax - globalMin || 1;

  return (
    <div className="mb-5 rounded-[18px] overflow-hidden" style={{ background: 'rgba(255,255,255,0.45)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', border: '1px solid rgba(255,255,255,0.55)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
        <p className="text-[11px] font-semibold tracking-widest uppercase" style={{ color: 'rgba(154,138,122,0.85)', letterSpacing: '0.1em' }}>
          {trip.destination} · Forecast
        </p>
        <button onClick={fetchWeather} className="opacity-50 hover:opacity-80 transition-opacity active:scale-90">
          <RefreshCw className="h-3.5 w-3.5" style={{ color: '#9A8A7A' }} />
        </button>
      </div>

      {/* Rows */}
      <div className="px-4 pb-3">
        {weather.days.map((d, i) => {
          const hi = temps[i].hi;
          const lo = temps[i].lo;
          const barLeft = ((lo - globalMin) / range) * 100;
          const barWidth = ((hi - lo) / range) * 100;

          return (
            <div key={i}>
              {i > 0 && (
                <div style={{ height: 1, background: 'rgba(200,180,160,0.18)' }} />
              )}
              <div className="flex items-center gap-3 py-2.5">
                {/* Day */}
                <span className="text-[13px] font-medium w-14 shrink-0" style={{ color: i === 0 ? '#1A1A1A' : '#7A7060' }}>
                  {i === 0 ? 'Today' : d.day}
                </span>

                {/* Emoji */}
                <span className="text-base w-6 text-center shrink-0">{d.emoji || '🌤'}</span>

                {/* Low */}
                <span className="text-[12px] font-normal w-8 text-right shrink-0" style={{ color: '#B0A090' }}>{d.low}</span>

                {/* Bar */}
                <div className="flex-1 relative h-[4px] rounded-full" style={{ background: 'rgba(200,180,160,0.2)' }}>
                  <div
                    className="absolute top-0 h-full rounded-full"
                    style={{
                      left: `${barLeft}%`,
                      width: `${Math.max(barWidth, 8)}%`,
                      background: 'linear-gradient(90deg, rgba(200,162,124,0.5), rgba(200,162,124,0.85))',
                    }}
                  />
                </div>

                {/* High */}
                <span className="text-[12px] font-medium w-8 shrink-0" style={{ color: '#3A3028' }}>{d.high}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}