import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { generateInviteCode } from "../../lib/utils/generateCode";

export default function CreateGroupDialog({ open, onOpenChange, user, onCreated }) {
  const [form, setForm] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name) return;
    setSaving(true);
    await base44.entities.Group.create({
      name: form.name,
      description: form.description,
      admin_email: user.email,
      member_emails: [user.email],
      invite_code: generateInviteCode(),
      invite_active: true,
    });
    setSaving(false);
    setForm({ name: "", description: "" });
    onOpenChange(false);
    onCreated();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-48px)] max-w-[420px] rounded-2xl p-5 z-50">
        <DialogHeader className="mb-1">
          <DialogTitle className="text-base">Create a Group</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 mt-1">
          <div>
            <Label className="text-xs font-medium" style={{ color: "#9A8A7A" }}>Group Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="The Travel Crew"
              className="mt-1 h-9 text-sm"
              style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(200,162,124,0.2)" }}
            />
          </div>
          <div>
            <Label className="text-xs font-medium" style={{ color: "#9A8A7A" }}>Description <span style={{ color: "#C0B0A0", fontWeight: 400 }}>(optional)</span></Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What's this group for?"
              className="mt-1 text-sm"
              rows={2}
              style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(200,162,124,0.2)" }}
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full h-10 rounded-full text-sm font-semibold mt-1 disabled:opacity-50"
            style={{ background: "#C8A27C", color: "white" }}
          >
            {saving ? "Creating..." : "Create Group"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}