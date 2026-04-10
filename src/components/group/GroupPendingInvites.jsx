import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { toast } from "sonner";

export default function GroupPendingInvites({ group, isAdmin, onUpdate }) {
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAdmin) loadInvites();
  }, [group.id, isAdmin]);

  async function loadInvites() {
    try {
      setLoading(true);
      const all = await base44.entities.GroupInvite.filter(
        { group_id: group.id, status: "pending" },
        "-created_date",
        50
      );
      setInvites(all || []);
    } catch (err) {
      console.error("Failed to load group invites:", err);
    } finally {
      setLoading(false);
    }
  }

  async function approveInvite(inv) {
    try {
      // Update invite status
      await base44.entities.GroupInvite.update(inv.id, { status: "accepted" });

      // Add user to group members
      const updated = [...(group.member_emails || []), inv.invitee_email];
      await base44.entities.Group.update(group.id, { member_emails: updated });

      console.log("[Group] Invite approved:", inv.id);

      // Notify user
      await base44.entities.Notification.create({
        user_email: inv.invitee_email,
        type: "group_accepted",
        message: `You were added to ${group.name}`,
        related_group_id: group.id,
        is_read: false,
      });

      toast.success("Invite approved");
      loadInvites();
      onUpdate?.();
    } catch (err) {
      console.error("Failed to approve invite:", err);
      toast.error("Failed to approve invite");
    }
  }

  async function denyInvite(inv) {
    try {
      await base44.entities.GroupInvite.update(inv.id, { status: "declined" });

      console.log("[Group] Invite declined:", inv.id);

      // Notify user
      await base44.entities.Notification.create({
        user_email: inv.invitee_email,
        type: "group_declined",
        message: `Your request to join ${group.name} was declined`,
        related_group_id: group.id,
        is_read: false,
      });

      toast.success("Invite declined");
      loadInvites();
    } catch (err) {
      console.error("Failed to deny invite:", err);
      toast.error("Failed to deny invite");
    }
  }

  if (!isAdmin || invites.length === 0) return null;

  return (
    <div className="bg-card rounded-2xl p-5 border border-border mb-6">
      <h3 className="font-semibold text-sm mb-4">Pending Join Requests ({invites.length})</h3>
      <div className="space-y-2">
        {invites.map((inv) => (
          <div key={inv.id} className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-sm font-semibold text-primary shrink-0">
                {inv.inviter_name?.[0] || "?"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{inv.inviter_name}</p>
                <p className="text-xs text-muted-foreground truncate">{inv.invitee_email}</p>
              </div>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8 rounded-full"
                onClick={() => approveInvite(inv)}
              >
                <Check className="h-4 w-4 text-primary" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8 rounded-full"
                onClick={() => denyInvite(inv)}
              >
                <X className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}