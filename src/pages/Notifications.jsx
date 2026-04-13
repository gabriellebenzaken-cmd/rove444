import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Bell, UserPlus, Check, MapPin, Users, ArrowLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";
import PullToRefresh from "../components/PullToRefresh";

function timeAgo(dateStr) {
  if (!dateStr) return null;
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return format(new Date(dateStr), "MMM d");
}

const TYPE_CONFIG = {
  friend_request: { icon: UserPlus, color: "#C8A27C", bg: "rgba(200,162,124,0.12)", actionable: true },
  friend_accepted: { icon: Check, color: "#6BAE8A", bg: "rgba(107,174,138,0.12)" },
  trip_added: { icon: MapPin, color: "#7090B0", bg: "rgba(112,144,176,0.12)" },
  trip_invite: { icon: MapPin, color: "#7090B0", bg: "rgba(112,144,176,0.12)", actionable: true },
  trip_request: { icon: MapPin, color: "#7090B0", bg: "rgba(112,144,176,0.12)", actionable: true },
  group_added: { icon: Users, color: "#9070B0", bg: "rgba(144,112,176,0.12)" },
  group_invite: { icon: Users, color: "#9070B0", bg: "rgba(144,112,176,0.12)", actionable: true },
  group_join_request: { icon: Users, color: "#9070B0", bg: "rgba(144,112,176,0.12)", actionable: true },
  group_accepted: { icon: Check, color: "#6BAE8A", bg: "rgba(107,174,138,0.12)" },
  group_declined: { icon: X, color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
  trip_approved: { icon: Check, color: "#6BAE8A", bg: "rgba(107,174,138,0.12)" },
  trip_denied: { icon: X, color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const me = await base44.auth.me();
    setUser(me);
    const all = await base44.entities.Notification.filter({ user_email: me.email }, "-created_date", 100);
    setNotifications(all || []);
    setLoading(false);
    // Mark all unread as read
    const unread = (all || []).filter(n => !n.is_read);
    await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { is_read: true })));
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }

  async function clearAll() {
    await Promise.all(notifications.map(n => base44.entities.Notification.delete(n.id)));
    setNotifications([]);
  }

  function removeNotif(id) {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }

  async function acceptFriendRequest(n) {
    try {
      const allReqs = await base44.entities.FriendRequest.list("-created_date", 200);
      const req = allReqs.find(
        (r) => r.sender_email === n.related_user_email && r.receiver_email === user.email && r.status === "pending"
      );
      if (!req) { toast.error("Request not found"); return; }
      await base44.entities.FriendRequest.update(req.id, { status: "accepted" });
      await base44.entities.Notification.delete(n.id);
      removeNotif(n.id);
      toast.success("Friend added!");
    } catch (err) {
      toast.error("Failed to accept");
    }
  }

  async function declineFriendRequest(n) {
    try {
      const allReqs = await base44.entities.FriendRequest.list("-created_date", 200);
      const req = allReqs.find(
        (r) => r.sender_email === n.related_user_email && r.receiver_email === user.email && r.status === "pending"
      );
      if (!req) { toast.error("Request not found"); return; }
      await base44.entities.FriendRequest.update(req.id, { status: "declined" });
      await base44.entities.Notification.delete(n.id);
      removeNotif(n.id);
      toast.success("Request declined");
    } catch (err) {
      toast.error("Failed to decline");
    }
  }

  async function acceptTripInvite(n) {
    try {
      const trips = await base44.entities.Trip.list("-created_date", 200);
      const trip = trips.find(t => t.id === n.related_trip_id);
      if (!trip) { toast.error("Trip not found"); return; }
      const already = trip.member_emails?.includes(user.email);
      if (!already) {
        await base44.entities.Trip.update(trip.id, {
          member_emails: [...new Set([...(trip.member_emails || []), user.email])],
        });
      }
      await base44.entities.Notification.delete(n.id);
      removeNotif(n.id);
      toast.success(`Joined "${trip.name}"!`);
    } catch (err) {
      toast.error("Failed to join trip");
    }
  }

  async function declineTripInvite(n) {
    try {
      await base44.entities.Notification.delete(n.id);
      removeNotif(n.id);
      toast.success("Invite declined");
    } catch (err) {
      toast.error("Failed to decline");
    }
  }

  async function acceptGroupInvite(n) {
    try {
      const allInvites = await base44.entities.GroupInvite.list("-created_date", 200);
      const inv = allInvites.find(
        (i) => i.group_id === n.related_group_id && i.invitee_email === user.email && i.status === "pending"
      );
      if (!inv) { toast.error("Invite not found"); return; }
      await base44.entities.GroupInvite.update(inv.id, { status: "accepted" });
      const groups = await base44.entities.Group.list("-created_date", 200);
      const group = groups.find(g => g.id === n.related_group_id);
      if (group) {
        const updated = [...new Set([...(group.member_emails || []), user.email])];
        await base44.entities.Group.update(group.id, { member_emails: updated });
      }
      // Clean up all pending invites for this group+user
      const staleNotifs = notifications.filter(x => x.type === "group_invite" && x.related_group_id === n.related_group_id);
      await Promise.all(staleNotifs.map(x => base44.entities.Notification.delete(x.id)));
      setNotifications(prev => prev.filter(x => !(x.type === "group_invite" && x.related_group_id === n.related_group_id)));
      toast.success("Joined group!");
    } catch (err) {
      toast.error("Failed to accept invite");
    }
  }

  async function declineGroupInvite(n) {
    try {
      const allInvites = await base44.entities.GroupInvite.list("-created_date", 200);
      const inv = allInvites.find(
        (i) => i.group_id === n.related_group_id && i.invitee_email === user.email && i.status === "pending"
      );
      if (inv) await base44.entities.GroupInvite.update(inv.id, { status: "declined" });
      await base44.entities.Notification.delete(n.id);
      removeNotif(n.id);
      toast.success("Invite declined");
    } catch (err) {
      toast.error("Failed to decline invite");
    }
  }

  async function approveTripRequest(n) {
    try {
      const allReqs = await base44.entities.TripJoinRequest.list("-created_date", 200);
      const req = allReqs.find(
        (r) => r.trip_id === n.related_trip_id && r.user_email === n.related_user_email && r.status === "pending"
      );
      if (!req) { toast.error("Request not found"); return; }
      
      // Update request status
      await base44.entities.TripJoinRequest.update(req.id, { status: "approved" });
      
      // Add user to trip
      const trips = await base44.entities.Trip.list("-created_date", 200);
      const trip = trips.find(t => t.id === n.related_trip_id);
      if (trip) {
        const updated = [...new Set([...(trip.member_emails || []), n.related_user_email])];
        await base44.entities.Trip.update(trip.id, { member_emails: updated });
      }
      
      // Notify user
      await base44.entities.Notification.create({
        user_email: n.related_user_email,
        type: "trip_approved",
        message: `You were added to ${trip?.name || "the trip"}`,
        related_trip_id: n.related_trip_id,
        is_read: false,
      });
      
      // Remove the request notification
      await base44.entities.Notification.delete(n.id);
      removeNotif(n.id);
      toast.success("Request approved!");
    } catch (err) {
      console.error("Failed to approve trip request:", err);
      toast.error("Failed to approve request");
    }
  }

  async function declineTripRequest(n) {
    try {
      const allReqs = await base44.entities.TripJoinRequest.list("-created_date", 200);
      const req = allReqs.find(
        (r) => r.trip_id === n.related_trip_id && r.user_email === n.related_user_email && r.status === "pending"
      );
      if (!req) { toast.error("Request not found"); return; }
      
      // Update request status
      await base44.entities.TripJoinRequest.update(req.id, { status: "denied" });
      
      // Notify user
      const trips = await base44.entities.Trip.list("-created_date", 200);
      const trip = trips.find(t => t.id === n.related_trip_id);
      await base44.entities.Notification.create({
        user_email: n.related_user_email,
        type: "trip_denied",
        message: `Your request to join ${trip?.name || "the trip"} was declined`,
        related_trip_id: n.related_trip_id,
        is_read: false,
      });
      
      // Remove the request notification
      await base44.entities.Notification.delete(n.id);
      removeNotif(n.id);
      toast.success("Request declined");
    } catch (err) {
      console.error("Failed to decline trip request:", err);
      toast.error("Failed to decline request");
    }
  }

  async function approveGroupJoinRequest(n) {
    try {
      const allInvites = await base44.entities.GroupInvite.list("-created_date", 200);
      const inv = allInvites.find(
        (i) => i.group_id === n.related_group_id && i.invitee_email === n.related_user_email && i.status === "pending"
      );
      if (!inv) { toast.error("Request not found"); return; }
      
      // Update invite status
      await base44.entities.GroupInvite.update(inv.id, { status: "accepted" });
      
      // Add user to group
      const groups = await base44.entities.Group.list("-created_date", 200);
      const group = groups.find(g => g.id === n.related_group_id);
      if (group) {
        const updated = [...new Set([...(group.member_emails || []), n.related_user_email])];
        await base44.entities.Group.update(group.id, { member_emails: updated });
      }
      
      // Notify user
      await base44.entities.Notification.create({
        user_email: n.related_user_email,
        type: "group_accepted",
        message: `You were added to ${group?.name || "the group"}`,
        related_group_id: n.related_group_id,
        is_read: false,
      });
      
      // Remove the request notification
      await base44.entities.Notification.delete(n.id);
      removeNotif(n.id);
      toast.success("Request approved!");
    } catch (err) {
      console.error("Failed to approve group join request:", err);
      toast.error("Failed to approve request");
    }
  }

  async function declineGroupJoinRequest(n) {
    try {
      const allInvites = await base44.entities.GroupInvite.list("-created_date", 200);
      const inv = allInvites.find(
        (i) => i.group_id === n.related_group_id && i.invitee_email === n.related_user_email && i.status === "pending"
      );
      if (inv) await base44.entities.GroupInvite.update(inv.id, { status: "declined" });
      
      // Remove the request notification
      await base44.entities.Notification.delete(n.id);
      removeNotif(n.id);
      toast.success("Request declined");
    } catch (err) {
      console.error("Failed to decline group join request:", err);
      toast.error("Failed to decline request");
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#C8A27C", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={loadData}>
    <div className="px-5 pt-12 pb-32">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all active:scale-90"
          style={{ background: "rgba(200,162,124,0.12)" }}
        >
          <ArrowLeft className="h-5 w-5" style={{ color: "#C8A27C" }} />
        </button>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: "#C8A27C" }}>Activity</p>
          <h1 className="text-[28px] font-semibold tracking-tight leading-tight" style={{ color: "#1A1A1A", letterSpacing: "-0.025em" }}>Notifications</h1>
        </div>
        {notifications.length > 0 && (
          <button
            onClick={clearAll}
            className="text-xs font-medium px-3 py-1.5 rounded-full"
            style={{ background: "rgba(200,162,124,0.1)", color: "#9A8A7A" }}
          >
            Clear all
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-28 text-center">
          <div className="w-16 h-16 rounded-[22px] flex items-center justify-center mb-5" style={{ background: "rgba(200,162,124,0.1)" }}>
            <Bell className="h-7 w-7" style={{ color: "#C8A27C" }} />
          </div>
          <h3 className="font-semibold text-lg mb-1.5" style={{ color: "#1A1A1A" }}>All caught up</h3>
          <p className="text-sm" style={{ color: "#9A8A7A" }}>No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.friend_request;
            const Icon = cfg.icon;
            const isUnread = !n.is_read;
            return (
              <div
                key={n.id}
                className="flex items-start gap-3 p-4 rounded-[18px]"
                style={{
                  background: isUnread ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.7)",
                  border: isUnread ? "1px solid rgba(200,162,124,0.25)" : "1px solid rgba(200,162,124,0.1)",
                  boxShadow: isUnread ? "0 2px 12px rgba(0,0,0,0.07)" : "0 1px 4px rgba(0,0,0,0.04)",
                }}
              >
                <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: cfg.bg }}>
                  <Icon className="h-4 w-4" style={{ color: cfg.color }} />
                </div>
                <div className="flex-1 min-w-0">
                   <p className="text-sm leading-snug" style={{ color: "#2A2018", fontWeight: isUnread ? 500 : 400 }}>{n.message}</p>
                   {n.created_date && (
                     <p className="text-[11px] mt-1" style={{ color: "#B0A090" }}>
                       {timeAgo(n.created_date)}
                     </p>
                   )}
                </div>
                {cfg.actionable && (
                  <div className="flex gap-1.5 shrink-0">
                    {n.type === "friend_request" && (
                      <>
                        <Button size="sm" className="h-7 px-2.5 text-xs rounded-full" onClick={() => acceptFriendRequest(n)}>
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs rounded-full" onClick={() => declineFriendRequest(n)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                    {n.type === "trip_invite" && n.related_trip_id && (
                      <>
                        <Button size="sm" className="h-7 px-2.5 text-xs rounded-full" onClick={() => acceptTripInvite(n)}>
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs rounded-full" onClick={() => declineTripInvite(n)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                    {n.type === "group_invite" && n.related_group_id && (
                       <>
                         <Button size="sm" className="h-7 px-2.5 text-xs rounded-full" onClick={() => acceptGroupInvite(n)}>
                           <Check className="h-3 w-3" />
                         </Button>
                         <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs rounded-full" onClick={() => declineGroupInvite(n)}>
                           <X className="h-3 w-3" />
                         </Button>
                       </>
                     )}
                     {n.type === "trip_request" && n.related_trip_id && (
                       <>
                         <Button size="sm" className="h-7 px-2.5 text-xs rounded-full" onClick={() => approveTripRequest(n)}>
                           <Check className="h-3 w-3" />
                         </Button>
                         <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs rounded-full" onClick={() => declineTripRequest(n)}>
                           <X className="h-3 w-3" />
                         </Button>
                       </>
                     )}
                     {n.type === "group_join_request" && n.related_group_id && (
                       <>
                         <Button size="sm" className="h-7 px-2.5 text-xs rounded-full" onClick={() => approveGroupJoinRequest(n)}>
                           <Check className="h-3 w-3" />
                         </Button>
                         <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs rounded-full" onClick={() => declineGroupJoinRequest(n)}>
                           <X className="h-3 w-3" />
                         </Button>
                       </>
                     )}
                  </div>
                )}
                {isUnread && !cfg.actionable && (
                   <div className="w-2 h-2 rounded-full mt-2 shrink-0" style={{ background: "#C8A27C" }} />
                 )}
                </div>
                )
          })}
        </div>
      )}
    </div>
    </PullToRefresh>
  );
}