import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import WeatherWidget from "./WeatherWidget";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CalendarDays, Plus, Trash2, Clock, MapPin, Star } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { format, eachDayOfInterval, parseISO } from "date-fns";
import BottomSheet from "../BottomSheet";

export default function TripItinerary({ trip, user }) {
  const [items, setItems] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    date: "",
    time: "",
    title: "",
    location: "",
    notes: "",
    is_required: false,
  });

  useEffect(() => {
    loadData();
  }, [trip.id]);

  async function loadData() {
    const all = await base44.entities.ItineraryItem.filter({ trip_id: trip.id }, "date", 200);
    setItems(all);
  }

  async function addItem(e) {
    e.preventDefault();
    if (!form.title || !form.date) return;
    await base44.entities.ItineraryItem.create({
      ...form,
      trip_id: trip.id,
      participant_emails: [user.email],
    });
    setForm({ date: "", time: "", title: "", location: "", notes: "", is_required: false });
    setShowAdd(false);
    loadData();
  }

  async function deleteItem(id) {
    await base44.entities.ItineraryItem.delete(id);
    loadData();
  }

  const days = trip.start_date && trip.end_date
    ? eachDayOfInterval({ start: parseISO(trip.start_date), end: parseISO(trip.end_date) })
    : [];

  const groupedItems = {};
  items.forEach((item) => {
    const day = item.date;
    if (!groupedItems[day]) groupedItems[day] = [];
    groupedItems[day].push(item);
  });

  const displayDays = days.length > 0
    ? days.map((d) => format(d, "yyyy-MM-dd"))
    : [...new Set(items.map((i) => i.date))].sort();

  return (
    <div className="pb-24">
      <WeatherWidget trip={trip} />
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <CalendarDays className="h-4 w-4" /> Itinerary
        </h3>
        <Button variant="outline" size="sm" className="rounded-full" onClick={() => setShowAdd(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add
        </Button>
      </div>

      {displayDays.length === 0 && items.length === 0 ? (
        <p className="text-xs text-muted-foreground py-8 text-center">No activities planned yet</p>
      ) : (
        <div className="space-y-5">
          {displayDays.map((day, idx) => (
            <div key={day}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                  {idx + 1}
                </div>
                <p className="text-sm font-semibold">{format(parseISO(day), "EEE, MMM d")}</p>
              </div>
              {(groupedItems[day] || []).length === 0 ? (
                <p className="text-xs text-muted-foreground pl-9">Free day</p>
              ) : (
                <div className="space-y-2 pl-9">
                  {(groupedItems[day] || []).map((item) => (
                    <div key={item.id} className="bg-card rounded-xl border border-border p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">{item.title}</p>
                            {item.is_required && <Star className="h-3 w-3 text-amber-500 fill-amber-500" />}
                          </div>
                          <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                            {item.time && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {item.time}
                              </span>
                            )}
                            {item.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" /> {item.location}
                              </span>
                            )}
                          </div>
                          {item.notes && <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>}
                        </div>
                        <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={() => deleteItem(item.id)}>
                          <Trash2 className="h-3 w-3 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <BottomSheet open={showAdd} onClose={() => setShowAdd(false)} title="Add Activity">
        <form onSubmit={addItem} className="space-y-3">
          <div>
            <Label className="text-xs font-medium mb-1 block" style={{ color: "#9A8A7A" }}>Activity name</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Activity name" className="h-9 text-sm" style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(200,162,124,0.2)" }} />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <Label className="text-xs font-medium mb-1 block" style={{ color: "#9A8A7A" }}>Date</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="h-9 text-sm" style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(200,162,124,0.2)" }} />
            </div>
            <div>
              <Label className="text-xs font-medium mb-1 block" style={{ color: "#9A8A7A" }}>Time</Label>
              <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="h-9 text-sm" style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(200,162,124,0.2)" }} />
            </div>
          </div>
          <div>
            <Label className="text-xs font-medium mb-1 block" style={{ color: "#9A8A7A" }}>Location <span style={{ color: "#C0B0A0", fontWeight: 400 }}>(optional)</span></Label>
            <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Location" className="h-9 text-sm" style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(200,162,124,0.2)" }} />
          </div>
          <div>
            <Label className="text-xs font-medium mb-1 block" style={{ color: "#9A8A7A" }}>Notes <span style={{ color: "#C0B0A0", fontWeight: 400 }}>(optional)</span></Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any details" className="text-sm" rows={2} style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(200,162,124,0.2)" }} />
          </div>
          <div className="flex items-center gap-3 py-1">
            <Switch checked={form.is_required} onCheckedChange={(v) => setForm({ ...form, is_required: v })} />
            <Label className="text-xs" style={{ color: "#9A8A7A" }}>Mark as required</Label>
          </div>
          <button type="submit" className="w-full h-10 rounded-full text-sm font-semibold" style={{ background: "#C8A27C", color: "white" }}>Add Activity</button>
        </form>
      </BottomSheet>
    </div>
  );
}