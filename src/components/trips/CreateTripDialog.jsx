import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateInviteCode } from "../../lib/utils/generateCode";

export default function CreateTripDialog({ open, onOpenChange, user, onCreated }) {
  const [form, setForm] = useState({
    name: "",
    destination: "",
    description: "",
    start_date: "",
    end_date: "",
    group_id: "",
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="mx-4 rounded-2xl max-w-md">
        <DialogHeader>
          <DialogTitle>Create a Trip</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Trip Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Barcelona Summer 2026"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Destination</Label>
            <Input
              value={form.destination}
              onChange={(e) => setForm({ ...form, destination: e.target.value })}
              placeholder="Barcelona, Spain"
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>End Date</Label>
              <Input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>
          {groups.length > 0 && (
            <div>
              <Label>Link to Group (optional)</Label>
              <Select value={form.group_id} onValueChange={(v) => setForm({ ...form, group_id: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a group" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What's this trip about?"
              className="mt-1"
              rows={2}
            />
          </div>
          <Button type="submit" className="w-full rounded-full" disabled={saving}>
            {saving ? "Creating..." : "Create Trip"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}