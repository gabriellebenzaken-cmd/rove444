import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Bell, UserPlus, Check, MapPin, Users, ArrowLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";

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
  group_added: { icon: Users, color: "#9070B0", bg: "rgba(144,112,176,0.12)" },
  group_invite: { icon: Users, color: "#9070B0", bg: "rgba(144,112,176,0.12)", actionable: false },
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
  }

  async function clearAll() {
    await Promise.all(notifications.map(n => base44.entities.Notification.delete(n.id)));
    setNotifications([]);
  }

  async function acceptFriendRequest(n) {
    try {
      const req = await base44.entities.FriendRequest.filter(
        { sender_email: n.related_user_email, receiver_email: user.email, status: "pending" },
        "-created_date",
        1
      );
      if (req.length === 0) {
        toast.error("Request not found");
        return;
      }
      await base44.entities.FriendRequest.update(req[0].id, { status: "accepted" });
      await base44.entities.Notification.delete(n.id);
      toast.success("Friend added!");
      loadData();
    } catch (err) {
      toast.error("Failed to accept");
    }
  }

  async function declineFriendRequest(n) {
    try {
      const req = await base44.entities.FriendRequest.filter(
        { sender_email: n.related_user_email, receiver_email: user.email, status: "pending" },
        "-created_date",
        1
      );
      if (req.length === 0) {
        toast.error("Request not found");
        return;
      }
      await base44.entities.FriendRequest.update(req[0].id, { status: "declined" });
      await base44.entities.Notification.delete(n.id);
      toast.success("Request declined");
      loadData();
    } catch (err) {
      toast.error("Failed to decline");
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
  );
}