import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function EditTripDialog({ open, onOpenChange, trip, onUpdated }) {
  const [form, setForm] = useState({ name: "", destination: "", start_date: "", end_date: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (trip) {
      setForm({
        name: trip.name || "",
        destination: trip.destination || "",
        start_date: trip.start_date || "",
        end_date: trip.end_date || "",
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
    });
    toast.success("Trip updated!");
    setSaving(false);
    onOpenChange(false);
    onUpdated();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="mx-4 rounded-2xl max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Trip</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4 mt-1">
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Start Date</Label>
              <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>End Date</Label>
              <Input type="date" value={form.end_date} min={form.start_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="mt-1" />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1 rounded-full" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1 rounded-full" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}