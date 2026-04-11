import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { generateInviteCode } from "../../lib/utils/generateCode";
import BottomSheet from "../BottomSheet";
import { ChevronDown, ChevronUp, Users, UserPlus, Check } from "lucide-react";
import { toast } from "sonner";

export default function CreateTripDialog({ open, onOpenChange, user, onCreated, defaultGroupId }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "", destination: "", description: "", start_date: "", end_date: "", group_id: defaultGroupId || "",
  });
  const [saving, setSaving] = useState(false);
  const [createdTrip, setCreatedTrip] = useState(null);

  // Invite state
  const [friends, setFriends] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedEmails, setSelectedEmails] = useState(new Set());
  const [expandedGroup, setExpandedGroup] = useState(null);
  const [groupMembers, setGroupMembers] = useState({}); // groupId -> [email]
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (open && user) {
      setStep(1);
      setCreatedTrip(null);
      setSelectedEmails(new Set());
      setForm({ name: "", destination: "", description: "", start_date: "", end_date: "", group_id: defaultGroupId || "" });

      // Load friends
      base44.entities.FriendRequest.list("-created_date", 200).then((reqs) => {
        const accepted = reqs.filter((r) => r.status === "accepted");
        const map = new Map();
        accepted.forEach((r) => {
          if (r.sender_id === user.id || r.sender_email === user.email) {
            map.set(r.receiver_email, { email: r.receiver_email, name: r.receiver_name });
          } else if (r.receiver_id === user.id || r.receiver_email === user.email) {
            map.set(r.sender_email, { email: r.sender_email, name: r.sender_name });
          }
        });
        setFriends(Array.from(map.values()));
      });

      // Load groups
      base44.entities.Group.list("-created_date", 50).then((all) => {
        setGroups(all.filter((g) => g.member_emails?.includes(user.email) || g.admin_email === user.email));
      });
    }
  }, [open, user]);

  async function handleCreateTrip(e) {
    e.preventDefault();
    if (!form.name || !form.destination) return;
    setSaving(true);
    const trip = await base44.entities.Trip.create({
      ...form,
      admin_email: user.email,
      member_emails: [user.email],
      invite_code: generateInviteCode(),
      invite_active: true,
    });
    setSaving(false);
    setCreatedTrip(trip);
    setStep(2);

    // If a group is linked, pre-select its members
    if (form.group_id) {
      const g = groups.find((g) => g.id === form.group_id);
      if (g) {
        const preSelected = new Set(
          (g.member_emails || []).filter((e) => e !== user.email)
        );
        setSelectedEmails(preSelected);
      }
    }
  }

  async function handleSendInvites() {
    if (!createdTrip) return;
    setInviting(true);
    const emails = Array.from(selectedEmails);
    await Promise.all(
      emails.map(async (email) => {
        const name = friends.find((f) => f.email === email)?.name ||
          Object.values(groupMembers).flat().find((m) => m.email === email)?.name || email.split("@")[0];
        await base44.entities.TripMember.create({
          trip_id: createdTrip.id,
          user_email: email,
          user_name: name,
          role: "member",
          status: "invited",
          invited_by_email: user.email,
        });
        await base44.entities.Notification.create({
          user_email: email,
          type: "trip_added",
          message: `${user.full_name} invited you to join "${createdTrip.name}"`,
          related_user_email: user.email,
          related_user_name: user.full_name,
          related_trip_id: createdTrip.id,
          is_read: false,
        });
      })
    );
    setInviting(false);
    toast.success(`Trip created${emails.length > 0 ? ` · ${emails.length} invite${emails.length !== 1 ? "s" : ""} sent` : ""}`);
    onOpenChange(false);
    onCreated();
  }

  function skipInvites() {
    toast.success("Trip created");
    onOpenChange(false);
    onCreated();
  }

  async function toggleGroupExpand(g) {
    if (expandedGroup === g.id) {
      setExpandedGroup(null);
      return;
    }
    setExpandedGroup(g.id);
    if (!groupMembers[g.id]) {
      const allUsers = await base44.entities.User.list("-created_date", 200);
      const members = allUsers.filter((u) => g.member_emails?.includes(u.email) && u.email !== user.email);
      setGroupMembers((prev) => ({ ...prev, [g.id]: members }));
    }
  }

  function toggleEmail(email) {
    setSelectedEmails((prev) => {
      const next = new Set(prev);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });
  }

  function selectAllGroup(g) {
    const members = groupMembers[g.id] || [];
    const emails = members.map((m) => m.email);
    const allSelected = emails.every((e) => selectedEmails.has(e));
    setSelectedEmails((prev) => {
      const next = new Set(prev);
      if (allSelected) emails.forEach((e) => next.delete(e));
      else emails.forEach((e) => next.add(e));
      return next;
    });
  }

  return (
    <BottomSheet open={open} onClose={() => { onOpenChange(false); if (createdTrip) onCreated(); }} title={step === 1 ? "New Trip" : "Invite People"}>
      {step === 1 ? (
        <form onSubmit={handleCreateTrip} className="space-y-3">
          <div>
            <Label className="text-xs font-medium mb-1 block" style={{ color: "#9A8A7A" }}>Trip name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Trip name" className="h-9 text-sm" style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(200,162,124,0.2)" }} />
          </div>
          <div>
            <Label className="text-xs font-medium mb-1 block" style={{ color: "#9A8A7A" }}>Destination</Label>
            <Input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} placeholder="City, country" className="h-9 text-sm" style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(200,162,124,0.2)" }} />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <Label className="text-xs font-medium mb-1 block" style={{ color: "#9A8A7A" }}>Start date</Label>
              <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="h-9 text-sm" style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(200,162,124,0.2)" }} />
            </div>
            <div>
              <Label className="text-xs font-medium mb-1 block" style={{ color: "#9A8A7A" }}>End date</Label>
              <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="h-9 text-sm" style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(200,162,124,0.2)" }} />
            </div>
          </div>
          {groups.length > 0 && (
            <div>
              <Label className="text-xs font-medium mb-1.5 block" style={{ color: "#9A8A7A" }}>Link to group <span style={{ color: "#C0B0A0", fontWeight: 400 }}>(optional)</span></Label>
              <div className="flex flex-wrap gap-2">
                {groups.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setForm({ ...form, group_id: form.group_id === g.id ? "" : g.id })}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                    style={form.group_id === g.id
                      ? { background: "#C8A27C", color: "white" }
                      : { background: "rgba(200,162,124,0.1)", color: "#9A8A7A" }}
                  >
                    <Users className="h-3 w-3" /> {g.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <Label className="text-xs font-medium mb-1 block" style={{ color: "#9A8A7A" }}>Description <span style={{ color: "#C0B0A0", fontWeight: 400 }}>(optional)</span></Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What's the vibe?" className="text-sm" rows={2} style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(200,162,124,0.2)" }} />
          </div>
          <button
            type="submit"
            disabled={saving || !form.name || !form.destination}
            className="w-full h-10 rounded-full text-sm font-semibold transition-all active:scale-[0.98] mt-1"
            style={{ background: "#C8A27C", color: "white", opacity: (saving || !form.name || !form.destination) ? 0.5 : 1 }}
          >
            {saving ? "Creating…" : "Next: Invite People →"}
          </button>
        </form>
      ) : (
        <div className="space-y-3">
          <p className="text-xs" style={{ color: "#9A8A7A" }}>Select who to invite. Each person must accept individually.</p>

          {/* Friends */}
          {friends.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "#C8A27C" }}>Friends</p>
              <div className="space-y-1.5">
                {friends.map((f) => (
                  <label key={f.email} className="flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer hover:bg-black/[0.02]" style={{ background: "rgba(255,255,255,0.7)" }}>
                    <Checkbox checked={selectedEmails.has(f.email)} onCheckedChange={() => toggleEmail(f.email)} />
                    <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                      {f.name?.[0] || "?"}
                    </div>
                    <span className="text-sm flex-1" style={{ color: "#2A2018" }}>{f.name || f.email.split("@")[0]}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Groups */}
          {groups.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "#C8A27C" }}>Groups</p>
              <div className="space-y-2">
                {groups.map((g) => {
                  const members = groupMembers[g.id] || [];
                  const isExpanded = expandedGroup === g.id;
                  const groupEmails = members.map((m) => m.email);
                  const allSelected = groupEmails.length > 0 && groupEmails.every((e) => selectedEmails.has(e));
                  const someSelected = groupEmails.some((e) => selectedEmails.has(e));

                  return (
                    <div key={g.id} className="rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(200,162,124,0.12)" }}>
                      <div className="flex items-center p-2.5 gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center shrink-0">
                          <Users className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <span className="text-sm font-medium flex-1" style={{ color: "#2A2018" }}>{g.name}</span>
                        <span className="text-xs" style={{ color: "#B0A090" }}>{(g.member_emails?.length || 1) - 1} members</span>
                        <button
                          type="button"
                          onClick={() => toggleGroupExpand(g)}
                          className="ml-1 p-1 rounded-full"
                          style={{ color: "#C8A27C" }}
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="px-2.5 pb-2.5 space-y-1">
                          {members.length > 1 && (
                            <button
                              type="button"
                              onClick={() => selectAllGroup(g)}
                              className="text-xs font-medium mb-1"
                              style={{ color: allSelected ? "#B04040" : "#C8A27C" }}
                            >
                              {allSelected ? "Deselect all" : "Select all"}
                            </button>
                          )}
                          {members.length === 0 && (
                            <p className="text-xs py-2 text-center" style={{ color: "#B0A090" }}>No other members</p>
                          )}
                          {members.map((m) => (
                            <label key={m.email} className="flex items-center gap-2.5 p-2 rounded-lg cursor-pointer hover:bg-black/[0.02]">
                              <Checkbox checked={selectedEmails.has(m.email)} onCheckedChange={() => toggleEmail(m.email)} />
                              <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-[10px] font-semibold text-primary shrink-0">
                                {m.full_name?.[0] || "?"}
                              </div>
                              <span className="text-sm" style={{ color: "#2A2018" }}>{m.full_name || m.email.split("@")[0]}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {friends.length === 0 && groups.length === 0 && (
            <div className="text-center py-8">
              <UserPlus className="h-8 w-8 mx-auto mb-2" style={{ color: "#C8A27C" }} />
              <p className="text-sm" style={{ color: "#9A8A7A" }}>Add friends or groups first to invite them</p>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={skipInvites}
              className="flex-1 h-10 rounded-full text-sm font-medium border"
              style={{ borderColor: "rgba(200,162,124,0.3)", color: "#9A8A7A" }}
            >
              Skip
            </button>
            <button
              type="button"
              onClick={handleSendInvites}
              disabled={inviting}
              className="flex-1 h-10 rounded-full text-sm font-semibold"
              style={{ background: "#C8A27C", color: "white", opacity: inviting ? 0.7 : 1 }}
            >
              {inviting ? "Sending…" : selectedEmails.size > 0 ? `Invite ${selectedEmails.size}` : "Done"}
            </button>
          </div>
        </div>
      )}
    </BottomSheet>
  );
}