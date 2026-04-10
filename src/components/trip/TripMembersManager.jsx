import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserPlus, Copy, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function TripMembersManager({ trip, user, isAdmin, onMembersUpdate }) {
  const [members, setMembers] = useState([]);
  const [friends, setFriends] = useState([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [inviteLink, setInviteLink] = useState("");

  useEffect(() => {
    if (showInviteModal) loadFriends();
  }, [showInviteModal]);

  useEffect(() => {
    loadMembers();
  }, [trip.id]);

  async function loadMembers() {
    try {
      const m = await base44.entities.User.list("-created_date", 200) || [];
      const activeMembers = m.filter((u) => trip.member_emails?.includes(u.email));
      setMembers(activeMembers);
    } catch (err) {
      console.error('Failed to load members:', err);
    }
  }

  async function loadFriends() {
    try {
      setLoading(true);
      const reqs = await base44.entities.FriendRequest.filter({}, "-created_date", 200) || [];
      const accepted = reqs.filter((r) => r.status === "accepted");
      const friendIds = new Set();
      accepted.forEach((r) => {
        if (r.sender_id === user.id) friendIds.add(r.receiver_id);
        if (r.receiver_id === user.id) friendIds.add(r.sender_id);
      });
      const allUsers = await base44.entities.User.list("-created_date", 200) || [];
      const friendList = allUsers.filter((u) => friendIds.has(u.id) && !trip.member_emails?.includes(u.email));
      setFriends(friendList);
      console.log('[Trip] Loaded friends for invite:', friendList.length);
    } catch (err) {
      console.error('Failed to load friends:', err);
      toast.error('Failed to load friends');
    } finally {
      setLoading(false);
    }
  }

  async function inviteSelectedFriends() {
    try {
      if (selectedFriends.length === 0) {
        toast.error('Select at least one friend');
        return;
      }
      setInviting(true);
      const updated = [...(trip.member_emails || []), ...selectedFriends];
      await base44.entities.Trip.update(trip.id, { member_emails: updated });
      console.log('[Trip] Invited friends:', selectedFriends);
      
      for (const friendEmail of selectedFriends) {
        const friend = friends.find((f) => f.email === friendEmail);
        await base44.entities.Notification.create({
          user_email: friendEmail,
          type: "trip_added",
          message: `${user.full_name} invited you to ${trip.name}`,
          related_user_email: user.email,
          related_user_name: user.full_name,
          related_trip_id: trip.id,
          is_read: false,
        });
      }
      
      toast.success(`Invited ${selectedFriends.length} friend(s)`);
      setSelectedFriends([]);
      setShowInviteModal(false);
      onMembersUpdate?.();
    } catch (err) {
      console.error('Failed to invite friends:', err);
      toast.error('Failed to invite friends');
    } finally {
      setInviting(false);
    }
  }

  async function copyInviteLink() {
    try {
      const link = `${window.location.origin}/trip/${trip.id}`;
      await navigator.clipboard.writeText(link);
      setInviteLink(link);
      toast.success('Invite link copied!');
      setTimeout(() => setInviteLink(""), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
      toast.error('Failed to copy link');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Members ({members.length})</h3>
        {isAdmin && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="h-8 text-xs rounded-full" onClick={copyInviteLink}>
              <Copy className="h-3 w-3 mr-1" /> Link
            </Button>
            <Button size="sm" className="h-8 text-xs rounded-full" onClick={() => setShowInviteModal(true)}>
              <UserPlus className="h-3 w-3 mr-1" /> Friends
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {members.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">No members yet</p>
        ) : (
          members.map((m) => (
            <div key={m.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-semibold shrink-0">
                {m.full_name?.[0] || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{m.full_name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{m.username || m.email}</p>
              </div>
              {trip.admin_email === m.email && (
                <span className="text-[10px] px-2 py-1 bg-primary/10 text-primary rounded-full shrink-0">Admin</span>
              )}
            </div>
          ))
        )}
      </div>

      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent className="mx-4 rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle>Invite Friends to {trip.name}</DialogTitle>
          </DialogHeader>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : friends.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No friends to invite</p>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {friends.map((f) => (
                <label key={f.id} className="flex items-center gap-3 p-2 hover:bg-muted rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedFriends.includes(f.email)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedFriends([...selectedFriends, f.email]);
                      } else {
                        setSelectedFriends(selectedFriends.filter((email) => email !== f.email));
                      }
                    }}
                    className="h-4 w-4 rounded"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{f.full_name}</p>
                    <p className="text-xs text-muted-foreground">{f.username || f.email}</p>
                  </div>
                </label>
              ))}
            </div>
          )}
          <div className="flex gap-2 mt-4">
            <Button variant="outline" className="flex-1 rounded-full" onClick={() => setShowInviteModal(false)}>
              Cancel
            </Button>
            <Button
              className="flex-1 rounded-full"
              onClick={inviteSelectedFriends}
              disabled={inviting || selectedFriends.length === 0}
            >
              {inviting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Inviting...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-1" /> Invite {selectedFriends.length > 0 && `(${selectedFriends.length})`}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}