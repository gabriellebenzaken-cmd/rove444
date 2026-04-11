import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function InviteMembersModal({ group, user, isOpen, onClose, onSuccess }) {
  const [friends, setFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) loadFriends();
  }, [isOpen]);

  async function loadFriends() {
    try {
      setLoading(true);

      // Load all accepted friend requests (same as Friends.jsx)
      const allRequests = await base44.entities.FriendRequest.list("-created_date", 200);
      const accepted = allRequests.filter((r) => r.status === "accepted");
      console.log("[InviteModal] Loaded accepted friend requests:", accepted.length);

      // Build friends map using same logic as Friends.jsx
      const friendsMap = new Map();
      accepted.forEach((r) => {
        if (r.sender_id === user.id) {
          friendsMap.set(r.receiver_email, {
            id: r.receiver_id,
            email: r.receiver_email,
            name: r.receiver_name,
            user_id: r.receiver_id,
          });
        } else if (r.receiver_id === user.id) {
          friendsMap.set(r.sender_email, {
            id: r.sender_id,
            email: r.sender_email,
            name: r.sender_name,
            user_id: r.sender_id,
          });
        }
      });

      let friendList = Array.from(friendsMap.values());
      console.log("[InviteModal] Mapped friends:", friendList.length);

      // Enrich with UserProfile data (non-critical)
      try {
        const profiles = await base44.entities.UserProfile.list("-created_date", 200);
        friendList = friendList.map((f) => {
          const profile = profiles.find((p) => p.user_id === f.id);
          return {
            ...f,
            username: profile?.username,
            profile_photo: profile?.profile_photo,
            full_name: profile?.full_name || f.name,
          };
        });
      } catch (err) {
        console.warn("[InviteModal] UserProfile enrichment failed:", err);
        // Continue with FriendRequest data only
      }

      console.log("[InviteModal] Friends before filtering:", friendList);

      // Fetch pending invites separately — non-fatal if it fails
      let existingEmails = new Set();
      try {
        const existingInvites = await base44.entities.GroupInvite.filter(
          { group_id: group.id, status: "pending" },
          "-created_date",
          200
        );
        existingEmails = new Set(existingInvites.map((inv) => inv.invitee_email));
        console.log("[InviteModal] Pending invite emails:", Array.from(existingEmails));
      } catch (err) {
        console.warn("[InviteModal] Could not load existing invites, skipping filter:", err);
      }

      const memberEmails = new Set(group.member_emails || []);
      console.log("[InviteModal] Member emails:", Array.from(memberEmails));

      const filtered = friendList.filter((f) => {
        const isAlreadyMember = memberEmails.has(f.email);
        const isAlreadyInvited = existingEmails.has(f.email);
        if (isAlreadyMember || isAlreadyInvited) {
          console.log(`[InviteModal] Excluding ${f.email}: member=${isAlreadyMember}, invited=${isAlreadyInvited}`);
        }
        return !isAlreadyMember && !isAlreadyInvited;
      });

      console.log("[InviteModal] Final invite-eligible friends:", filtered);

      setFriends(filtered);
      setSelectedFriends([]);
    } catch (err) {
      console.error("[InviteModal] Failed to load friends:", err);
      toast.error("Failed to load friends");
    } finally {
      setLoading(false);
    }
  }

  async function handleInvite() {
    if (selectedFriends.length === 0) {
      toast.error("Select at least one friend");
      return;
    }

    try {
      setSubmitting(true);

      for (const friend of selectedFriends) {
        // Create invite
        await base44.entities.GroupInvite.create({
          group_id: group.id,
          invitee_email: friend.email,
          inviter_email: user.email,
          inviter_name: user.full_name,
          status: "pending",
        });

        // Send notification
        await base44.entities.Notification.create({
          user_email: friend.email,
          type: "group_invite",
          message: `${user.full_name} invited you to join ${group.name}`,
          related_user_email: user.email,
          related_user_name: user.full_name,
          related_group_id: group.id,
          is_read: false,
        });
      }

      toast.success(`Invited ${selectedFriends.length} friend${selectedFriends.length !== 1 ? "s" : ""}`);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Failed to invite friends:", err);
      toast.error("Failed to invite friends");
    } finally {
      setSubmitting(false);
    }
  }

  const filteredFriends = friends.filter(
    (f) =>
      f.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="mx-4 rounded-2xl max-w-sm p-6 max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Members</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <Input
              placeholder="Search friends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-lg mb-4"
            />

            <div className="flex-1 overflow-y-auto space-y-2 mb-4 -mx-2 px-2">
              {filteredFriends.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  {friends.length === 0 ? "No friends to invite" : "No results"}
                </p>
              ) : (
                filteredFriends.map((friend) => (
                  <div
                    key={friend.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() =>
                      setSelectedFriends((prev) =>
                        prev.find((f) => f.id === friend.id)
                          ? prev.filter((f) => f.id !== friend.id)
                          : [...prev, friend]
                      )
                    }
                  >
                    <Checkbox
                      checked={selectedFriends.some((f) => f.id === friend.id)}
                      onChange={() => {}}
                      className="pointer-events-none"
                    />
                    <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                      {friend.profile_photo ? (
                        <img
                          src={friend.profile_photo}
                          className="w-9 h-9 rounded-full object-cover"
                          alt=""
                        />
                      ) : (
                        friend.full_name?.[0] || "?"
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{friend.full_name || friend.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {friend.username ? `@${friend.username}` : friend.email}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {selectedFriends.length > 0 && (
              <div className="text-xs text-muted-foreground mb-4 text-center">
                {selectedFriends.length} selected
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-full"
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 rounded-full"
                onClick={handleInvite}
                disabled={submitting || selectedFriends.length === 0}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Inviting...
                  </>
                ) : (
                  `Invite (${selectedFriends.length})`
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}