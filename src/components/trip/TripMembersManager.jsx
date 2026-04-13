import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { UserPlus, Copy, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import FriendProfileModal from "../FriendProfileModal";

export default function TripMembersManager({ trip, user, isAdmin, onMembersUpdate }) {
  const [members, setMembers] = useState([]);
  const [friends, setFriends] = useState([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [viewingMember, setViewingMember] = useState(null);

  useEffect(() => {
    if (showInviteModal) loadFriends();
  }, [showInviteModal]);

  useEffect(() => {
    loadMembers();
  }, [trip.id, (trip.member_emails || []).join(",")]);

  async function loadMembers() {
    try {
      const m = await base44.entities.User.list("-created_date", 200) || [];
      const activeMembers = m.filter((u) => trip.member_emails?.includes(u.email));
      setMembers(activeMembers);
    } catch (err) {
      console.error('Failed to load members:', err);
    }
  }

  const [searchQuery, setSearchQuery] = useState("");

  async function loadFriends() {
    try {
      setLoading(true);
      const allRequests = await base44.entities.FriendRequest.list("-created_date", 200);
      const accepted = allRequests.filter((r) => r.status === "accepted");

      const friendsMap = new Map();
      accepted.forEach((r) => {
        const isSender = r.sender_id === user.id || r.sender_email === user.email;
        const isReceiver = r.receiver_id === user.id || r.receiver_email === user.email;
        if (isSender) friendsMap.set(r.receiver_email, { id: r.receiver_id, email: r.receiver_email, name: r.receiver_name });
        else if (isReceiver) friendsMap.set(r.sender_email, { id: r.sender_id, email: r.sender_email, name: r.sender_name });
      });

      let friendList = Array.from(friendsMap.values());

      try {
        const profiles = await base44.entities.UserProfile.list("-created_date", 200);
        friendList = friendList.map((f) => {
          const profile = profiles.find((p) => p.user_id === f.id);
          return { ...f, username: profile?.username, profile_photo: profile?.profile_photo, full_name: profile?.full_name || f.name };
        });
      } catch {}

      // Exclude already-members and pending invitees
      let pendingEmails = new Set();
      try {
        const pending = await base44.entities.TripMember.filter({ trip_id: trip.id, status: "invited" }, "-created_date", 200);
        pendingEmails = new Set(pending.map((p) => p.user_email));
      } catch {}

      const memberEmails = new Set(trip.member_emails || []);
      setFriends(friendList.filter((f) => !memberEmails.has(f.email) && !pendingEmails.has(f.email)));
      setSelectedFriends([]);
    } catch (err) {
      console.error('Failed to load friends:', err);
      toast.error('Failed to load friends');
    } finally {
      setLoading(false);
    }
  }

  async function inviteSelectedFriends() {
    if (selectedFriends.length === 0) { toast.error('Select at least one friend'); return; }
    try {
      setInviting(true);
      for (const friend of selectedFriends) {
        await base44.entities.TripMember.create({
          trip_id: trip.id,
          user_email: friend.email,
          user_name: friend.full_name || friend.name || friend.email,
          role: "member",
          status: "invited",
          invited_by_email: user.email,
        });
        await base44.entities.Notification.create({
          user_email: friend.email,
          type: "trip_invite",
          message: `${user.full_name} invited you to join "${trip.name}"`,
          related_user_email: user.email,
          related_user_name: user.full_name,
          related_trip_id: trip.id,
          is_read: false,
        });
      }
      toast.success(`Invited ${selectedFriends.length} friend${selectedFriends.length !== 1 ? 's' : ''}`);
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
         <p className="text-xs text-muted-foreground py-4 text-center">Invite friends to plan together</p>
       ) : (
         members.map((m) => (
           <div key={m.id} className="flex items-center gap-2 p-3 bg-white rounded-lg border border-border cursor-pointer active:scale-95 transition-all" onClick={() => setViewingMember(m)}>
             <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-xs font-semibold shrink-0 overflow-hidden">
               {m.data?.profile_photo ? (
                 <img src={m.data.profile_photo} alt="" className="w-9 h-9 rounded-full object-cover" />
               ) : (
                 m.full_name?.[0] || "?"
               )}
             </div>
             <div className="flex-1 min-w-0">
               <p className="text-xs font-medium truncate">{m.full_name}</p>
               {m.data?.username && <p className="text-[10px] text-muted-foreground truncate">@{m.data.username}</p>}
             </div>
             {trip.admin_email === m.email && (
               <span className="text-[10px] px-2 py-1 bg-primary/10 text-primary rounded-full shrink-0 shrink-0">Admin</span>
             )}
           </div>
         ))
       )}
      </div>

      <FriendProfileModal friend={viewingMember} onClose={() => setViewingMember(null)} />

      <Dialog open={showInviteModal} onOpenChange={(v) => { if (!v) { setShowInviteModal(false); setSearchQuery(""); } }}>
        <DialogContent className="mx-4 rounded-2xl max-w-sm p-6 max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Invite Friends to {trip.name}</DialogTitle>
          </DialogHeader>

          <Input
            placeholder="Search friends"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg mb-3 mt-2"
          />

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto space-y-2 mb-4 -mx-2 px-2">
                {(() => {
                  const filtered = friends.filter((f) =>
                    f.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    f.username?.toLowerCase().includes(searchQuery.toLowerCase())
                  );
                  if (filtered.length === 0) return (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      {friends.length === 0 ? "No friends available to invite" : "No matching friends found"}
                    </p>
                  );
                  return filtered.map((f) => (
                    <div key={f.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer"
                      onClick={() => setSelectedFriends((prev) =>
                        prev.find((s) => s.id === f.id) ? prev.filter((s) => s.id !== f.id) : [...prev, f]
                      )}
                    >
                      <Checkbox checked={selectedFriends.some((s) => s.id === f.id)} onChange={() => {}} className="pointer-events-none" />
                      <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                        {f.profile_photo
                          ? <img src={f.profile_photo} className="w-9 h-9 rounded-full object-cover" alt="" />
                          : (f.full_name?.[0] || "?")}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{f.full_name || f.name}</p>
                        {f.username && <p className="text-xs text-muted-foreground truncate">@{f.username}</p>}
                      </div>
                    </div>
                  ));
                })()}
              </div>

              {selectedFriends.length > 0 && (
                <div className="text-xs text-muted-foreground mb-3 text-center">{selectedFriends.length} selected</div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 rounded-full" onClick={() => setShowInviteModal(false)} disabled={inviting}>Cancel</Button>
                <Button className="flex-1 rounded-full" onClick={inviteSelectedFriends} disabled={inviting || selectedFriends.length === 0}>
                  {inviting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Inviting...</> : `Invite (${selectedFriends.length})`}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}