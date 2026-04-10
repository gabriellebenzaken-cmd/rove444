import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Search, UserPlus, Check, X, UserMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function Friends() {
  const [user, setUser] = useState(null);
  const [friends, setFriends] = useState([]);
  const [pending, setPending] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("friends");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const me = await base44.auth.me();
      setUser(me);
      const reqs = await base44.entities.FriendRequest.list("-created_date", 200) || [];
      setAllRequests(reqs);

    const accepted = reqs.filter((r) => r.status === "accepted");
    const friendEmails = new Set();
    accepted.forEach((r) => {
      if (r.from_user === me.email) friendEmails.add(r.to_user);
      if (r.to_user === me.email) friendEmails.add(r.from_user);
    });

    const allUsers = await base44.entities.User.list("-created_date", 200);
    const friendList = allUsers.filter((u) => friendEmails.has(u.email));
    setFriends(friendList);

    setPending(reqs.filter((r) => r.from_user === me.email && r.status === "pending"));
    setIncoming(reqs.filter((r) => r.to_user === me.email && r.status === "pending"));
      setLoading(false);
    } catch (err) {
      console.error('Failed to load friends data:', err);
      toast.error('Failed to load requests');
      setLoading(false);
    }
  }

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    const allUsers = await base44.entities.User.list("-created_date", 200);
    const q = searchQuery.toLowerCase();
    const results = allUsers.filter(
      (u) =>
        u.email !== user.email &&
        (u.full_name?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q))
    );
    setSearchResults(results);
    setTab("search");
  }

  async function sendRequest(toUser) {
    try {
      // Prevent duplicate or self
      const existing = allRequests.find(r =>
        r.status !== "declined" &&
        ((r.from_user === user.email && r.to_user === toUser.email) ||
         (r.from_user === toUser.email && r.to_user === user.email))
      );
      if (existing) {
        toast.error('Request already exists');
        return;
      }
      await base44.entities.FriendRequest.create({
        from_user: user.email,
        from_name: user.full_name,
        to_user: toUser.email,
        to_name: toUser.full_name,
        status: "pending",
      });
      // Notify recipient
      await base44.entities.Notification.create({
        user_email: toUser.email,
        type: "friend_request",
        message: `${user.full_name} sent you a friend request`,
        related_user_email: user.email,
        related_user_name: user.full_name,
        is_read: false,
      });
      toast.success(`Request sent to ${toUser.full_name}`);
      loadData();
    } catch (err) {
      console.error('Failed to send request:', err);
      toast.error('Failed to send request');
    }
  }

  async function acceptRequest(req) {
    try {
      await base44.entities.FriendRequest.update(req.id, { status: "accepted" });
      // Notify sender
      await base44.entities.Notification.create({
        user_email: req.from_user,
        type: "friend_accepted",
        message: `${user.full_name} accepted your friend request`,
        related_user_email: user.email,
        related_user_name: user.full_name,
        is_read: false,
      });
      toast.success("Friend added!");
      loadData();
    } catch (err) {
      console.error('Failed to accept request:', err);
      toast.error('Failed to accept request');
    }
  }

  async function declineRequest(req) {
    try {
      await base44.entities.FriendRequest.update(req.id, { status: "declined" });
      loadData();
    } catch (err) {
      console.error('Failed to decline request:', err);
      toast.error('Failed to decline request');
    }
  }

  async function removeFriend(friendUser) {
    const allRequests = await base44.entities.FriendRequest.list("-created_date", 200);
    const friendship = allRequests.find(
      (r) =>
        r.status === "accepted" &&
        ((r.from_user === user.email && r.to_user === friendUser.email) ||
          (r.to_user === user.email && r.from_user === friendUser.email))
    );
    if (friendship) {
      await base44.entities.FriendRequest.delete(friendship.id);
      toast.success("Friend removed");
      loadData();
    }
  }

  const tabs = [
    { key: "friends", label: `Friends (${friends.length})` },
    { key: "requests", label: `Requests${incoming.length > 0 ? ` (${incoming.length})` : ""}` },
  ];

  return (
    <div className="px-5 pt-12">
      <h1 className="text-[28px] font-bold tracking-tight mb-5 leading-none">Friends</h1>

      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Search name, email, or username..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="rounded-full bg-white border-border/60 shadow-sm"
        />
        <Button size="icon" variant="outline" className="rounded-full shrink-0 shadow-sm" onClick={handleSearch}>
          <Search className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex gap-1 mb-5 bg-muted/70 rounded-full p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 text-xs font-medium rounded-full transition-all ${
              tab === t.key ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tab === "search" ? (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground mb-2">{searchResults.length} results</p>
          {searchResults.map((u) => {
            const isFriend = friends.some((f) => f.email === u.email);
            const isOutgoing = pending.some((p) => p.to_user === u.email);
            const isIncoming = incoming.some((p) => p.from_user === u.email);
            const incomingReq = incoming.find((p) => p.from_user === u.email);
            return (
              <div key={u.id} className="bg-white rounded-[18px] p-4 shadow-[0_1px_8px_rgba(0,0,0,0.06)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-sm font-semibold text-primary shrink-0">
                    {u.profile_photo ? <img src={u.profile_photo} className="w-10 h-10 rounded-full object-cover" alt="" /> : (u.full_name?.[0] || "?")}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{u.full_name}</p>
                    <p className="text-xs text-muted-foreground">{u.username ? `@${u.username}` : u.email}</p>
                  </div>
                </div>
                {isFriend ? (
                  <span className="text-xs text-primary font-medium px-3 py-1 rounded-full" style={{background:"rgba(200,162,124,0.1)"}}>Friends</span>
                ) : isIncoming ? (
                  <div className="flex gap-1.5">
                    <Button size="sm" className="rounded-full h-8 px-3 text-xs" onClick={() => acceptRequest(incomingReq)}>Accept</Button>
                    <Button size="sm" variant="outline" className="rounded-full h-8 px-3 text-xs" onClick={() => declineRequest(incomingReq)}>Decline</Button>
                  </div>
                ) : isOutgoing ? (
                  <span className="text-xs text-muted-foreground">Sent</span>
                ) : (
                  <Button size="sm" variant="outline" className="rounded-full" onClick={() => sendRequest(u)}>
                    <UserPlus className="h-3.5 w-3.5 mr-1" /> Add
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      ) : tab === "requests" ? (
        <div className="space-y-3">
          {incoming.length === 0 && pending.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-10">No pending requests</p>
          ) : (
            <>
              {incoming.length > 0 && (
                <div>
                  <p className="text-[10px] text-muted-foreground font-semibold mb-2 uppercase tracking-widest">Incoming</p>
                  {incoming.map((req) => (
                    <div key={req.id} className="bg-white rounded-[18px] shadow-[0_1px_8px_rgba(0,0,0,0.06)] p-4 flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium text-sm">{req.from_name || req.from_user}</p>
                        <p className="text-xs text-muted-foreground">{req.from_user}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="icon" variant="outline" className="h-8 w-8 rounded-full" onClick={() => acceptRequest(req)}>
                          <Check className="h-4 w-4 text-primary" />
                        </Button>
                        <Button size="icon" variant="outline" className="h-8 w-8 rounded-full" onClick={() => declineRequest(req)}>
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {pending.length > 0 && (
                <div>
                  <p className="text-[10px] text-muted-foreground font-semibold mb-2 uppercase tracking-widest mt-3">Sent</p>
                  {pending.map((req) => (
                    <div key={req.id} className="bg-white rounded-[18px] shadow-[0_1px_8px_rgba(0,0,0,0.06)] p-4 flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium text-sm">{req.to_name || req.to_user}</p>
                        <p className="text-xs text-muted-foreground">Pending</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {friends.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-4">
                <UserPlus className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-1">No friends yet</h3>
              <p className="text-muted-foreground text-sm">Search for people to connect</p>
            </div>
          ) : (
            friends.map((f) => (
              <div key={f.id} className="bg-white rounded-[18px] shadow-[0_1px_8px_rgba(0,0,0,0.06)] p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-sm font-semibold text-primary shrink-0">
                    {f.full_name?.[0] || "?"}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{f.full_name}</p>
                    <p className="text-xs text-muted-foreground">{f.username || f.email}</p>
                  </div>
                </div>
                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" onClick={() => removeFriend(f)}>
                  <UserMinus className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}