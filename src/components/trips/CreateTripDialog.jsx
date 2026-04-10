import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateInviteCode } from "../../lib/utils/generateCode";
import BottomSheet from "../BottomSheet";

export default function CreateTripDialog({ open, onOpenChange, user, onCreated }) {
  const [form, setForm] = useState({
    name: "", destination: "", description: "", start_date: "", end_date: "", group_id: "",
  });
  const [groups, setGroups] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && user) {
      base44.entities.Group.list("-created_date", 50).then((all) => {
        setGroups(all.filter((g) => g.member_emails?.includes(user.email) || g.admin_email === user.email));
      });
    }
  }, [open, user]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.destination) return;
    setSaving(true);
    await base44.entities.Trip.create({
      ...form,
      admin_email: user.email,
      member_emails: [user.email],
      invite_code: generateInviteCode(),
      invite_active: true,
    });
    setSaving(false);
    setForm({ name: "", destination: "", description: "", start_date: "", end_date: "", group_id: "" });
    onOpenChange(false);
    onCreated();
  }

  return (
    <BottomSheet open={open} onClose={() => onOpenChange(false)} title="New Trip">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <Label className="text-xs font-medium mb-1 block" style={{ color: "#9A8A7A" }}>Trip name</Label>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Trip name"
            className="h-9 text-sm"
            style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(200,162,124,0.2)" }}
          />
        </div>
        <div>
          <Label className="text-xs font-medium mb-1 block" style={{ color: "#9A8A7A" }}>Destination</Label>
          <Input
            value={form.destination}
            onChange={(e) => setForm({ ...form, destination: e.target.value })}
            placeholder="City, country"
            className="h-9 text-sm"
            style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(200,162,124,0.2)" }}
          />
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <Label className="text-xs font-medium mb-1 block" style={{ color: "#9A8A7A" }}>Start date</Label>
            <Input
              type="date"
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              className="h-9 text-sm"
              style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(200,162,124,0.2)" }}
            />
          </div>
          <div>
            <Label className="text-xs font-medium mb-1 block" style={{ color: "#9A8A7A" }}>End date</Label>
            <Input
              type="date"
              value={form.end_date}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              className="h-9 text-sm"
              style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(200,162,124,0.2)" }}
            />
          </div>
        </div>
        {groups.length > 0 && (
          <div>
            <Label className="text-xs font-medium mb-1 block" style={{ color: "#9A8A7A" }}>Link to group <span style={{ color: "#C0B0A0", fontWeight: 400 }}>(optional)</span></Label>
            <Select value={form.group_id} onValueChange={(v) => setForm({ ...form, group_id: v })}>
              <SelectTrigger className="h-9 text-sm" style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(200,162,124,0.2)" }}>
                <SelectValue placeholder="Select a group" />
              </SelectTrigger>
              <SelectContent>
                {groups.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
        <div>
          <Label className="text-xs font-medium mb-1 block" style={{ color: "#9A8A7A" }}>Description <span style={{ color: "#C0B0A0", fontWeight: 400 }}>(optional)</span></Label>
          <Textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="What's the vibe?"
            className="text-sm"
            rows={2}
            style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(200,162,124,0.2)" }}
          />
        </div>
        <button
          type="submit"
          disabled={saving || !form.name || !form.destination}
          className="w-full h-10 rounded-full text-sm font-semibold transition-all active:scale-[0.98] mt-1"
          style={{ background: "#C8A27C", color: "white", opacity: (saving || !form.name || !form.destination) ? 0.5 : 1 }}
        >
          {saving ? "Creating…" : "Create Trip"}
        </button>
      </form>
    </BottomSheet>
  );
}