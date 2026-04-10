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

function createColoredIcon(color) {
  return L.divIcon({
    className: "",
    html: `<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${color};border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -30],
  });
}

function FitBounds({ markers }) {
  const map = useMap();
  useEffect(() => {
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [markers]);
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
    <div className="pb-24">
      <div className="flex gap-1 mb-4 p-1 rounded-full" style={{ background: "rgba(200,162,124,0.1)" }}>
        {[{ key: "map", Icon: Map, label: "Map" }, { key: "list", Icon: List, label: "List" }].map(({ key, Icon, label }) => (
          <button
            key={key}
            onClick={() => setView(key)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-full transition-all"
            style={view === key
              ? { background: "white", color: "#C8A27C", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }
              : { color: "#9CA3AF" }}
          >
            <Icon className="h-3.5 w-3.5" /> {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#C8A27C", borderTopColor: "transparent" }} />
        </div>
      ) : view === "map" ? (
        <>
          <div className="rounded-2xl overflow-hidden" style={{ height: 360, border: "1px solid rgba(200,162,124,0.2)" }}>
            <MapContainer center={center} zoom={12} style={{ height: "100%", width: "100%" }} zoomControl={false}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {markers.length > 0 && <FitBounds markers={markers} />}
              {markers.map((m) => {
                const dayIdx = uniqueDays.indexOf(m.date);
                const color = DAY_COLORS[dayIdx % DAY_COLORS.length] || "#C8A27C";
                return (
                  <Marker key={m.id} position={[m.lat, m.lng]} icon={createColoredIcon(color)}>
                    <Popup>
                      <div style={{ fontFamily: "system-ui", minWidth: 120 }}>
                        <p style={{ fontWeight: 600, fontSize: 12, marginBottom: 2 }}>{m.title}</p>
                        {m.location && <p style={{ fontSize: 11, color: "#9A8A7A", margin: 0 }}>{m.location}</p>}
                        {m.time && <p style={{ fontSize: 11, color: "#C8A27C", margin: "2px 0 0" }}>{m.time}</p>}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
          {uniqueDays.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {uniqueDays.map((day, i) => (
                <div key={day} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(200,162,124,0.15)" }}>
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: DAY_COLORS[i % DAY_COLORS.length] }} />
                  <span className="text-[10px] font-medium" style={{ color: "#3A3028" }}>Day {i + 1} · {format(parseISO(day), "MMM d")}</span>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-14 h-14 rounded-[18px] flex items-center justify-center mb-4" style={{ background: "rgba(200,162,124,0.1)" }}>
                <MapPin className="h-6 w-6" style={{ color: "#C8A27C" }} />
              </div>
              <p className="text-sm font-medium" style={{ color: "#3A3028" }}>No itinerary items yet</p>
              <p className="text-xs mt-1" style={{ color: "#B0A090" }}>Add activities in the Itinerary tab</p>
            </div>
          ) : (
            uniqueDays.map((day, dayIdx) => {
              const dayItems = items.filter(i => i.date === day);
              const color = DAY_COLORS[dayIdx % DAY_COLORS.length];
              return (
                <div key={day}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-[10px] font-bold" style={{ background: color }}>
                      {dayIdx + 1}
                    </div>
                    <p className="text-xs font-semibold" style={{ color: "#3A3028" }}>
                      {format(parseISO(day), "EEE, MMM d")}
                    </p>
                  </div>
                  <div className="space-y-2 pl-8">
                    {dayItems.map(item => (
                      <div key={item.id} className="p-3 rounded-xl flex items-start gap-3" style={{ background: "rgba(255,255,255,0.85)", border: "1px solid rgba(200,162,124,0.12)" }}>
                        <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: color }} />
                        <div>
                          <p className="text-sm font-medium" style={{ color: "#2A2018" }}>{item.title}</p>
                          {item.location && (
                            <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: "#9A8A7A" }}>
                              <MapPin className="h-3 w-3" />{item.location}
                            </p>
                          )}
                          {item.time && <p className="text-xs mt-0.5" style={{ color: "#C8A27C" }}>{item.time}</p>}
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
  );
}