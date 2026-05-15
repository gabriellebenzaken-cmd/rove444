import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { format, eachDayOfInterval, parseISO } from "date-fns";
import BottomSheet from "../BottomSheet";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const TIME_SLOTS = [
  { label: "All day", value: "allday", hint: "all day" },
  { label: "Morning", value: "09:00", hint: "8am – 12pm" },
  { label: "Afternoon", value: "13:00", hint: "12pm – 5pm" },
  { label: "Evening", value: "18:00", hint: "5pm – 9pm" },
  { label: "Night", value: "21:00", hint: "9pm+" },
];

export default function EditItinerarySheet({ open, onClose, item, trip, onSaved }) {
  const [title, setTitle] = useState("");
  const [selectedDates, setSelectedDates] = useState([]);
  const [timeSlot, setTimeSlot] = useState("");
  const [exactTime, setExactTime] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [isRequired, setIsRequired] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && item) {
      setTitle(item.title || "");
      // Support both legacy single date and new multi-dates
      const initialDates = item.dates?.length ? item.dates : (item.date ? [item.date] : []);
      setSelectedDates(initialDates);
      setLocation(item.location || "");
      setNotes(item.notes || "");
      setIsRequired(item.is_required || false);
      const matchedSlot = TIME_SLOTS.find(s => s.value === item.time);
      if (matchedSlot) {
        setTimeSlot(item.time);
        setExactTime("");
      } else {
        setTimeSlot("");
        setExactTime(item.time || "");
      }
    }
  }, [open, item]);

  function toggleDate(key) {
    setSelectedDates(prev =>
      prev.includes(key) ? prev.filter(d => d !== key) : [...prev, key]
    );
  }

  const tripDays = trip?.start_date && trip?.end_date
    ? eachDayOfInterval({ start: parseISO(trip.start_date), end: parseISO(trip.end_date) })
    : [];

  async function handleSave() {
    if (!title.trim() || selectedDates.length === 0) {
      toast.error("Title and at least one date are required");
      return;
    }
    setSaving(true);
    const finalTime = timeSlot === "allday" ? "allday" : (exactTime || timeSlot || "");
    const sorted = [...selectedDates].sort();
    await base44.entities.ItineraryItem.update(item.id, {
      title: title.trim(),
      date: sorted[0],
      dates: sorted,
      time: finalTime,
      location: location.trim(),
      notes: notes.trim(),
      is_required: isRequired,
    });
    setSaving(false);
    toast.success("Activity updated");
    onSaved?.();
    onClose();
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Edit activity">
      <div className="space-y-4 pb-4">

        {/* Title */}
        <div>
          <label className="text-xs font-medium block mb-1" style={{ color: "#9A8A7A" }}>Activity name</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-9 text-sm"
            style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(200,162,124,0.2)" }}
          />
        </div>

        {/* Date picker — multi-select */}
        <div>
          <label className="text-xs font-medium block mb-1" style={{ color: "#9A8A7A" }}>
            Choose day(s) <span style={{ color: "#C0B0A0", fontWeight: 400 }}>— tap to select multiple</span>
          </label>
          {selectedDates.length > 1 && (
            <p className="text-[11px] mb-2" style={{ color: "#C8A27C" }}>
              {selectedDates.length} days selected
            </p>
          )}
          {tripDays.length > 0 ? (
            <div className="flex flex-col gap-1.5 max-h-44 overflow-y-auto">
              {tripDays.map((d) => {
                const key = format(d, "yyyy-MM-dd");
                const isSelected = selectedDates.includes(key);
                return (
                  <button
                    key={key}
                    onClick={() => toggleDate(key)}
                    className="flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm transition-all text-left"
                    style={
                      isSelected
                        ? { background: "#C8A27C", color: "white", borderColor: "#C8A27C" }
                        : { background: "rgba(255,255,255,0.7)", borderColor: "rgba(200,162,124,0.2)", color: "var(--foreground)" }
                    }
                  >
                    <span className="font-medium">{format(d, "EEE, MMM d")}</span>
                    {isSelected && <span className="text-[11px] opacity-80">✓</span>}
                  </button>
                );
              })}
            </div>
          ) : (
            <Input
              type="date"
              value={selectedDates[0] || ""}
              onChange={(e) => setSelectedDates(e.target.value ? [e.target.value] : [])}
              className="h-9 text-sm"
              style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(200,162,124,0.2)" }}
            />
          )}
        </div>

        {/* Time */}
        <div>
          <label className="text-xs font-medium block mb-2" style={{ color: "#9A8A7A" }}>
            Time <span style={{ color: "#C0B0A0", fontWeight: 400 }}>(optional)</span>
          </label>
          <div className="grid grid-cols-5 gap-1.5">
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
          {/* Exact time — hidden when All day is selected */}
          {timeSlot !== "allday" && (
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
          )}
        </div>

        {/* Location */}
        <div>
          <label className="text-xs font-medium block mb-1" style={{ color: "#9A8A7A" }}>
            Location <span style={{ color: "#C0B0A0", fontWeight: 400 }}>(optional)</span>
          </label>
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location"
            className="h-9 text-sm"
            style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(200,162,124,0.2)" }}
          />
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

        {/* Required toggle */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsRequired(v => !v)}
            className="w-9 h-5 rounded-full transition-colors relative shrink-0"
            style={{ background: isRequired ? "#C8A27C" : "rgba(200,162,124,0.25)" }}
          >
            <span
              className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
              style={{ left: isRequired ? "calc(100% - 18px)" : "2px" }}
            />
          </button>
          <label className="text-xs" style={{ color: "#9A8A7A" }}>Mark as required</label>
        </div>

        {/* CTA */}
        <button
          onClick={handleSave}
          disabled={saving || !title.trim()}
          className="w-full h-11 rounded-full text-sm font-semibold transition-opacity disabled:opacity-50"
          style={{ background: "#C8A27C", color: "white" }}
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </BottomSheet>
  );
}