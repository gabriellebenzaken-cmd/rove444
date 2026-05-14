import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import TripDetailModal from "./TripDetailModal";

export default function EditTripDialog({ open, onOpenChange, trip, onUpdated }) {
  const [form, setForm] = useState({ name: "", destination: "", start_date: "", end_date: "", theme_color: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (trip) {
      setForm({
        name: trip.name || "",
        destination: trip.destination || "",
        start_date: trip.start_date || "",
        end_date: trip.end_date || "",
        theme_color: trip.theme_color || "",
      });
    }
  }, [trip, open]);

  async function handleSave(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.destination.trim()) {
      toast.error("Trip name and destination are required");
      return;
    }
    if (form.start_date && form.end_date && form.end_date < form.start_date) {
      toast.error("End date must be after start date");
      return;
    }
    setSaving(true);
    await base44.entities.Trip.update(trip.id, {
      name: form.name.trim(),
      destination: form.destination.trim(),
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      theme_color: form.theme_color || null,
    });
    toast.success("Trip updated!");
    setSaving(false);
    onOpenChange(false);
    onUpdated();
  }

  return (
    <TripDetailModal open={open} onOpenChange={onOpenChange} title="Edit Trip">
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <Label>Trip Name <span className="text-destructive">*</span></Label>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Summer in Italy"
            className="mt-1"
            required
          />
        </div>
        <div>
          <Label>Destination <span className="text-destructive">*</span></Label>
          <Input
            value={form.destination}
            onChange={(e) => setForm({ ...form, destination: e.target.value })}
            placeholder="Rome, Italy"
            className="mt-1"
            required
          />
        </div>
        <div className="flex flex-col gap-3">
          <div>
            <Label>Start Date</Label>
            <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="mt-1" />
          </div>
          <div>
            <Label>End Date</Label>
            <Input type="date" value={form.end_date} min={form.start_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="mt-1" />
          </div>
        </div>
        <div>
          <Label>Theme Color</Label>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <div className="relative">
              <input
                type="color"
                value={form.theme_color || "#4A8C6F"}
                onChange={(e) => setForm({ ...form, theme_color: e.target.value })}
                className="w-10 h-10 rounded-xl border border-border cursor-pointer p-0.5 bg-transparent"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {["#4A8C6F", "#5B8DD9", "#D97B5B", "#9B6DD9", "#D9B45B", "#5BB8D9", "#D95B8D"].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm({ ...form, theme_color: c })}
                  className="w-7 h-7 rounded-full border-2 transition-all"
                  style={{ backgroundColor: c, borderColor: form.theme_color === c ? c : 'transparent', outline: form.theme_color === c ? `2px solid ${c}` : 'none', outlineOffset: '2px' }}
                />
              ))}
              <button
                type="button"
                onClick={() => setForm({ ...form, theme_color: "" })}
                className="w-7 h-7 rounded-full border-2 border-border bg-muted text-[9px] text-muted-foreground font-medium flex items-center justify-center"
                title="Reset to default"
              >✕</button>
            </div>
          </div>
          {form.theme_color && (
            <p className="text-[11px] text-muted-foreground mt-1.5">Preview: <span className="font-medium" style={{ color: form.theme_color }}>{form.theme_color}</span></p>
          )}
        </div>
        <div className="flex gap-2 pt-2 -mx-6 px-6 border-t border-border/30">
          <Button type="button" variant="outline" className="flex-1 rounded-full mt-4" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1 rounded-full mt-4" disabled={saving} style={form.theme_color ? { backgroundColor: form.theme_color, borderColor: form.theme_color } : {}}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </TripDetailModal>
  );
}