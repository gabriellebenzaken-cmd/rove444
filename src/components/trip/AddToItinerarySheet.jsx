import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { format, eachDayOfInterval, parseISO } from "date-fns";
import BottomSheet from "../BottomSheet";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const TIME_SLOTS = [
  { label: "Morning", value: "09:00", hint: "8am – 12pm" },
  { label: "Afternoon", value: "13:00", hint: "12pm – 5pm" },
  { label: "Evening", value: "18:00", hint: "5pm – 9pm" },
  { label: "Night", value: "21:00", hint: "9pm+" },
];

// Suggest a time based on activity title keywords
function suggestTime(title) {
  const t = (title || "").toLowerCase();
  if (/coffee|brunch|breakfast|morning|cafe/.test(t)) return "09:00";
  if (/lunch|afternoon|museum|tour|hike/.test(t)) return "13:00";
  if (/dinner|restaurant|sunset|evening/.test(t)) return "18:00";
  if (/bar|club|nightlife|night|drinks|cocktail/.test(t)) return "21:00";
  return "13:00"; // default afternoon
}

// Given trip dates + existing items, suggest the first free day
function suggestDate(trip, existingDates) {
  if (!trip.start_date || !trip.end_date) return "";
  const days = eachDayOfInterval({ start: parseISO(trip.start_date), end: parseISO(trip.end_date) });
  const today = format(new Date(), "yyyy-MM-dd");
  // Prefer a free day (no items yet)
  const freeDay = days.find(d => {
    const key = format(d, "yyyy-MM-dd");
    return key >= today && !existingDates.has(key);
  });
  if (freeDay) return format(freeDay, "yyyy-MM-dd");
  // Otherwise first upcoming day
  const upcoming = days.find(d => format(d, "yyyy-MM-dd") >= today);
  return upcoming ? format(upcoming, "yyyy-MM-dd") : trip.start_date;
}

export default function AddToItinerarySheet({ open, onClose, suggestion, trip, existingDates, onAdded }) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [exactTime, setExactTime] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Populate smart defaults when sheet opens
  useEffect(() => {
    if (open && suggestion) {
      setTitle(suggestion.title || "");
      setNotes(suggestion.description || "");
      setDate(suggestDate(trip, existingDates || new Set()));
      const suggested = suggestTime(suggestion.title);
      setTimeSlot(suggested);
      setExactTime("");
    }
  }, [open, suggestion]);

  const tripDays = trip?.start_date && trip?.end_date
    ? eachDayOfInterval({ start: parseISO(trip.start_date), end: parseISO(trip.end_date) })
    : [];

  async function handleAdd() {
    if (!date) {
      toast.error("Please select a date");
      return;
    }
    setSaving(true);
    const finalTime = exactTime || timeSlot;
    await base44.entities.ItineraryItem.create({
      trip_id: trip.id,
      title: title.trim(),
      location: suggestion?.location || "",
      notes: notes.trim(),
      date,
      time: finalTime,
      is_required: false,
    });
    setSaving(false);
    toast.success(`"${title}" added to itinerary`);
    onAdded?.();
    onClose();
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Add to itinerary">
      <div className="space-y-4 pb-4">
        {/* Title */}
        <div>
          <label className="text-xs font-medium block mb-1" style={{ color: "#9A8A7A" }}>Activity</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-9 text-sm"
            style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(200,162,124,0.2)" }}
          />
        </div>

        {/* Date picker */}
        <div>
          <label className="text-xs font-medium block mb-2" style={{ color: "#9A8A7A" }}>Choose a day</label>
          {tripDays.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              {tripDays.map((d) => {
                const key = format(d, "yyyy-MM-dd");
                const isFree = existingDates && !existingDates.has(key);
                const isSelected = date === key;
                return (
                  <button
                    key={key}
                    onClick={() => setDate(key)}
                    className="flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm transition-all text-left"
                    style={
                      isSelected
                        ? { background: "#C8A27C", color: "white", borderColor: "#C8A27C" }
                        : { background: "rgba(255,255,255,0.7)", borderColor: "rgba(200,162,124,0.2)", color: "var(--foreground)" }
                    }
                  >
                    <span className="font-medium">{format(d, "EEE, MMM d")}</span>
                    {isFree && !isSelected && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: "rgba(200,162,124,0.12)", color: "#C8A27C" }}>
                        Free day
                      </span>
                    )}
                    {isSelected && (
                      <span className="text-[11px] opacity-80">✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-9 text-sm"
              style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(200,162,124,0.2)" }}
            />
          )}
        </div>

        {/* Time slot */}
        <div>
          <label className="text-xs font-medium block mb-2" style={{ color: "#9A8A7A" }}>
            Time <span style={{ color: "#C0B0A0", fontWeight: 400 }}>(optional)</span>
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {TIME_SLOTS.map((slot) => (
              <button
                key={slot.value}
                onClick={() => { setTimeSlot(slot.value); setExactTime(""); }}
                className="flex flex-col items-center py-2 px-1 rounded-xl border text-center transition-all"
                style={
                  timeSlot === slot.value && !exactTime
                    ? { background: "#C8A27C", color: "white", borderColor: "#C8A27C" }
                    : { background: "rgba(255,255,255,0.7)", borderColor: "rgba(200,162,124,0.2)", color: "var(--foreground)" }
                }
              >
                <span className="text-xs font-medium">{slot.label}</span>
                <span className="text-[9px] opacity-70 mt-0.5">{slot.hint}</span>
              </button>
            ))}
          </div>
          {/* Exact time */}
          <div className="mt-2 flex items-center gap-2">
            <Input
              type="time"
              value={exactTime}
              onChange={(e) => { setExactTime(e.target.value); setTimeSlot(""); }}
              className="h-8 text-sm flex-1"
              style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(200,162,124,0.2)" }}
            />
            <span className="text-xs text-muted-foreground shrink-0">exact time</span>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="text-xs font-medium block mb-1" style={{ color: "#9A8A7A" }}>
            Notes <span style={{ color: "#C0B0A0", fontWeight: 400 }}>(optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Any details..."
            className="w-full rounded-xl px-3 py-2 text-sm resize-none outline-none"
            style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(200,162,124,0.2)", color: "var(--foreground)" }}
          />
        </div>

        {/* CTA */}
        <button
          onClick={handleAdd}
          disabled={saving || !title.trim()}
          className="w-full h-11 rounded-full text-sm font-semibold transition-opacity disabled:opacity-50"
          style={{ background: "#C8A27C", color: "white" }}
        >
          {saving ? "Adding…" : "Add to itinerary"}
        </button>
      </div>
    </BottomSheet>
  );
}