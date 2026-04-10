import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { base44 } from "@/api/base44Client";
import { MapPin, List, Map } from "lucide-react";
import { format, parseISO } from "date-fns";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const DAY_COLORS = ["#C8A27C", "#7090B0", "#8BA86B", "#B07090", "#70A89E", "#A8946B"];

function getItemEmoji(item) {
  if (item.pin_icon) return item.pin_icon;
  const t = (item.title || "").toLowerCase();
  if (/museum|gallery|art/.test(t)) return "🏛️";
  if (/beach|sea|ocean|surf/.test(t)) return "🏖️";
  if (/hike|trail|mountain|park/.test(t)) return "🥾";
  if (/food|eat|dinner|lunch|breakfast|restaurant|cafe|coffee/.test(t)) return "🍽️";
  if (/bar|drink|cocktail|wine/.test(t)) return "🍹";
  if (/hotel|hostel|airbnb|stay/.test(t)) return "🏨";
  if (/shop|market|store/.test(t)) return "🛍️";
  if (/flight|airport|plane/.test(t)) return "✈️";
  if (/concert|show|theatre|movie/.test(t)) return "🎭";
  return "📍";
}

function createEmojiIcon(emoji) {
  return L.divIcon({
    className: "",
    html: `<div class="custom-pin"><span class="pin-emoji">${emoji}</span></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -38],
  });
}

function FitBounds({ markers }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    const timer = setTimeout(() => {
      try {
        map.invalidateSize();
        if (markers.length > 0) {
          const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]));
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
        }
      } catch (e) {}
    }, 300);
    return () => clearTimeout(timer);
  }, [markers]);
  return null;
}

function MapInvalidator() {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    const timer = setTimeout(() => {
      try { map.invalidateSize(); } catch (e) {}
    }, 300);
    return () => clearTimeout(timer);
  }, []);
  return null;
}

async function geocode(query) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
      { headers: { "Accept-Language": "en" } }
    );
    const data = await res.json();
    if (data[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {}
  return null;
}

export default function TripMap({ trip }) {
  const [items, setItems] = useState([]);
  const [markers, setMarkers] = useState([]);
  const [view, setView] = useState("map");
  const [center, setCenter] = useState([48.8566, 2.3522]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);

  const uniqueDays = [...new Set(items.map(i => i.date).filter(Boolean))].sort();

  useEffect(() => {
    loadData();
  }, [trip.id]);

  async function loadData() {
    setLoading(true);
    const all = await base44.entities.ItineraryItem.filter({ trip_id: trip.id }, "date", 200);
    setItems(all || []);

    const destCoords = await geocode(trip.destination);
    if (destCoords) setCenter([destCoords.lat, destCoords.lng]);

    const resolved = [];
    for (const item of all || []) {
      if (!item.location) continue;
      const query = `${item.location}, ${trip.destination}`;
      const coords = await geocode(query);
      if (coords) resolved.push({ ...item, lat: coords.lat, lng: coords.lng });
    }
    setMarkers(resolved);
    setLoading(false);
  }

  return (
    <div className="pb-32">
      <div className="px-5 space-y-4">
        {/* View toggle */}
        <div className="flex gap-1 p-1 rounded-full bg-muted/70">
          {[
            { key: "map", Icon: Map, label: "Map" },
            { key: "list", Icon: List, label: "List" }
          ].map(({ key, Icon, label }) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium rounded-full transition-all ${
                view === key ? "bg-card shadow-sm text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : view === "map" ? (
          <>
            {/* Day filter */}
            {uniqueDays.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                <button
                  onClick={() => setSelectedDay(null)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    !selectedDay ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  All
                </button>
                {uniqueDays.map((day, i) => (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                    className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                    style={{
                      background: selectedDay === day ? DAY_COLORS[i % DAY_COLORS.length] : "rgba(200,162,124,0.1)",
                      color: selectedDay === day ? "white" : "#9A8A7A"
                    }}
                  >
                    Day {i + 1}
                  </button>
                ))}
              </div>
            )}

            {/* Map container */}
            <div className="map-card rounded-2xl overflow-hidden border border-border shadow-sm" style={{ height: "400px" }}>
              <MapContainer
                center={center}
                zoom={12}
                style={{ height: "100%", width: "100%" }}
                zoomControl={false}
              >
                {/* Light, minimal map tiles */}
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                  maxZoom={19}
                />
                <MapInvalidator />
                {markers.length > 0 && <FitBounds markers={markers} />}
                {markers
                  .filter(m => !selectedDay || m.date === selectedDay)
                  .map((m) => {
                    const emoji = getItemEmoji(m);
                    return (
                      <Marker key={m.id} position={[m.lat, m.lng]} icon={createEmojiIcon(emoji)}>
                        <Popup>
                          <div style={{ fontFamily: "system-ui", minWidth: 120, fontSize: "14px" }}>
                            <p style={{ fontWeight: 600, marginBottom: 4 }}>{m.title}</p>
                            {m.location && (
                              <p style={{ fontSize: 12, color: "#9A8A7A", margin: 0 }}>{m.location}</p>
                            )}
                            {m.time && (
                              <p style={{ fontSize: 12, color: "#C8A27C", margin: "4px 0 0" }}>{m.time}</p>
                            )}
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
              </MapContainer>
            </div>

            {/* Legend */}
            {uniqueDays.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {uniqueDays.map((day, i) => (
                  <div
                    key={day}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border border-border bg-card"
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ background: DAY_COLORS[i % DAY_COLORS.length] }}
                    />
                    <span>Day {i + 1} • {format(parseISO(day), "MMM d")}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          /* List view */
          <div className="space-y-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 bg-muted">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <p className="font-medium text-sm">No itinerary items yet</p>
                <p className="text-xs text-muted-foreground mt-1">Add activities in the Plan tab</p>
              </div>
            ) : (
              uniqueDays.map((day, dayIdx) => {
                const dayItems = items.filter(i => i.date === day);
                const color = DAY_COLORS[dayIdx % DAY_COLORS.length];
                return (
                  <div key={day}>
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                        style={{ background: color }}
                      >
                        {dayIdx + 1}
                      </div>
                      <p className="text-sm font-semibold">{format(parseISO(day), "EEE, MMM d")}</p>
                    </div>
                    <div className="space-y-2 pl-8">
                      {dayItems.map(item => (
                        <div
                          key={item.id}
                          className="p-3 rounded-xl border border-border bg-card"
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                              style={{ background: color }}
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium">{item.title}</p>
                              {item.location && (
                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {item.location}
                                </p>
                              )}
                              {item.time && (
                                <p className="text-xs text-primary mt-1">{item.time}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}