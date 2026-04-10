import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Search, UserPlus, Check, X, UserMinus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function Friends() {
  const [user, setUser] = useState(null);
  const [friends, setFriends] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("friends");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setError(null);
      const me = await base44.auth.me();
      if (!me) throw new Error("User not authenticated");
      setUser(me);
      console.log("[Friends] Current user:", me.id);

      // Load all friend requests
      let reqs = [];
      try {
        reqs = await base44.entities.FriendRequest.list("-created_date", 200) || [];
        console.log("[Friends] FriendRequest.list() loaded:", reqs.length, "records");
      } catch (err) {
        console.error("[Friends] Failed to load FriendRequest:", err);
        throw new Error("Failed to load friend requests");
      }
      setAllRequests(reqs);

      // Build friends list from accepted FriendRequest rows (no User.list() dependency)
      const accepted = reqs.filter((r) => r.status === "accepted");
      console.log("[Friends] Accepted requests:", accepted.length);
      
      const friendsMap = new Map();
      accepted.forEach((r) => {
        if (r.sender_id === me.id) {
          // I sent the request; friend is receiver
          friendsMap.set(r.receiver_id, {
            id: r.receiver_id,
            email: r.receiver_email,
            display_name: r.receiver_name,
            username: null,
            profile_photo: null,
          });
        } else if (r.receiver_id === me.id) {
          // I received the request; friend is sender
          friendsMap.set(r.sender_id, {
            id: r.sender_id,
            email: r.sender_email,
            display_name: r.sender_name,
            username: null,
            profile_photo: null,
          });
        }
      });
      console.log("[Friends] Normalized friends from FriendRequest:", friendsMap.size);
      let friendList = Array.from(friendsMap.values());

      // Optional: Enrich friends with User data (username, profile_photo)
      // If this fails, still show the friends list
      try {
        const allUsers = await base44.entities.User.list("-created_date", 200) || [];
        console.log("[Friends] User.list() loaded:", allUsers.length, "records");
        
        friendList = friendList.map((friend) => {
          const userData = allUsers.find((u) => u.id === friend.id);
          if (userData) {
            return {
              ...friend,
              username: userData.data?.username,
              profile_photo: userData.data?.profile_photo,
              full_name: userData.full_name, // add full_name from User
            };
          }
          return friend;
        });
        console.log("[Friends] Enriched friend data from User records");
      } catch (err) {
        console.warn("[Friends] User.list() failed; using FriendRequest data only:", err);
        // Continue with friends list built from FriendRequest
      }
      setFriends(friendList);
      console.log("[Friends] Final friends list:", friendList);

      // Sent requests (I initiated, still pending)
      setSentRequests(reqs.filter((r) => r.sender_id === me.id && r.status === "pending"));

      // Received requests (others sent to me, still pending)
      setReceivedRequests(reqs.filter((r) => r.receiver_id === me.id && r.status === "pending"));

      setLoading(false);
    } catch (err) {
      console.error("[Friends] loadData() failed:", err);
      setError(err.message || "Failed to load friends");
      setLoading(false);
    }
  }

  async function handleSearch() {
    console.log("handleSearch called");
    try {
      if (!searchQuery.trim()) return;
      console.log("query:", searchQuery);
      
      const allUsers = await base44.entities.User.list("-created_date", 200) || [];
      console.log("users fetched:", allUsers.length);
      
      const q = searchQuery.toLowerCase();
      const filtered = allUsers.filter(
        (u) =>
          u.id !== user.id &&
          (u.full_name?.toLowerCase().includes(q) || 
              u.data?.username?.toLowerCase().includes(q) ||
              u.email?.toLowerCase().includes(q))
      );
      console.log("filtered results:", filtered);
      
      setSearchResults(filtered);
      setTab("search");
      
      if (filtered.length === 0) {
        toast.info("No users found");
      }
    } catch (err) {
      console.error("Search failed:", err);
      toast.error("Search failed");
    }
  }

  async function sendRequest(toUser) {
    try {
      // Check if already friends
      const isFriend = friends.some((f) => f.id === toUser.id);
      if (isFriend) {
        toast.error("Already friends");
        return;
      }

      // Check for existing request (either direction, not declined)
      const existing = allRequests.find(
        (r) =>
          r.status !== "declined" &&
          ((r.sender_id === user.id && r.receiver_id === toUser.id) ||
            (r.sender_id === toUser.id && r.receiver_id === user.id))
      );
      if (existing) {
        toast.error("Request already exists");
        return;
      }

      const req = await base44.entities.FriendRequest.create({
        sender_id: user.id,
        receiver_id: toUser.id,
        sender_email: user.email,
        receiver_email: toUser.email,
        sender_name: user.full_name,
        receiver_name: toUser.full_name,
        status: "pending",
      });

      console.log("[Friend] Request sent:", req.id, "from:", user.id, "to:", toUser.id);

      await base44.entities.Notification.create({
        user_email: toUser.email,
        type: "friend_request",
        message: `${user.full_name} sent you a friend request`,
        related_user_email: user.email,
        related_user_name: user.full_name,
        is_read: false,
      });

      toast.success("Friend request sent");
      loadData();
    } catch (err) {
      console.error("Failed to send request:", err);
      toast.error("Failed to send request");
    }
  }

  async function acceptRequest(req) {
    try {
      // Update request status
      await base44.entities.FriendRequest.update(req.id, { status: "accepted" });
      console.log("[Friend] Request accepted:", req.id);

      // Create notification
      await base44.entities.Notification.create({
        user_email: req.sender_email,
        type: "friend_accepted",
        message: `${user.full_name} accepted your friend request`,
        related_user_email: user.email,
        related_user_name: user.full_name,
        is_read: false,
      });

      toast.success("Friend added!");
      loadData();
    } catch (err) {
      console.error("Failed to accept request:", err);
      toast.error("Failed to accept request");
    }
  }

  async function declineRequest(req) {
    try {
      await base44.entities.FriendRequest.update(req.id, { status: "declined" });
      console.log("[Friend] Request declined:", req.id);
      toast.success("Request declined");
      loadData();
    } catch (err) {
      console.error("Failed to decline request:", err);
      toast.error("Failed to decline request");
    }
  }

  async function removeFriend(friendUser) {
    try {
      const friendship = allRequests.find(
        (r) =>
          r.status === "accepted" &&
          ((r.sender_id === user.id && r.receiver_id === friendUser.id) ||
            (r.receiver_id === user.id && r.sender_id === friendUser.id))
      );
      if (friendship) {
        await base44.entities.FriendRequest.delete(friendship.id);
        toast.success("Friend removed");
        loadData();
      }
    } catch (err) {
      console.error("Failed to remove friend:", err);
      toast.error("Failed to remove friend");
    }
  }

  const tabs = [
    { key: "friends", label: `Friends (${friends.length})` },
    {
      key: "requests",
      label: `Requests${receivedRequests.length > 0 ? ` (${receivedRequests.length})` : ""}`,
    },
  ];

  return (
    <div className="px-5 pt-12 pb-24">
      <h1 className="text-[28px] font-bold tracking-tight mb-5 leading-none">Friends</h1>

      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Search name or username..."
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

      {error && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 mb-4 flex gap-2">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tab === "search" ? (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground mb-2">{searchResults.length} result{searchResults.length !== 1 ? "s" : ""}</p>
          {searchResults.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-10">No users found</p>
          ) : (
            searchResults.map((u) => {
            const isFriend = friends.some((f) => f.id === u.id);
            const isOutgoing = sentRequests.some((p) => p.receiver_id === u.id);
            const isIncoming = receivedRequests.some((p) => p.sender_id === u.id);
            const incomingReq = receivedRequests.find((p) => p.sender_id === u.id);

            return (
              <div
                key={u.id}
                className="bg-white rounded-[18px] p-4 shadow-[0_1px_8px_rgba(0,0,0,0.06)] flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-sm font-semibold text-primary shrink-0">
                    {u.data?.profile_photo ? (
                      <img src={u.data.profile_photo} className="w-10 h-10 rounded-full object-cover" alt="" />
                    ) : (
                      u.full_name?.[0] || "?"
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{u.full_name || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">{u.username ? `@${u.username}` : u.email || "No email"}</p>
                  </div>
                </div>
                {isFriend ? (
                  <span className="text-xs text-primary font-medium px-3 py-1 rounded-full" style={{ background: "rgba(200,162,124,0.1)" }}>
                    Friends
                  </span>
                ) : isIncoming ? (
                  <div className="flex gap-1.5">
                    <Button size="sm" className="rounded-full h-8 px-3 text-xs" onClick={() => acceptRequest(incomingReq)}>
                      Accept
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-full h-8 px-3 text-xs" onClick={() => declineRequest(incomingReq)}>
                      Decline
                    </Button>
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
            })
          )}
        </div>
      ) : tab === "requests" ? (
        <div className="space-y-3">
          {receivedRequests.length === 0 && sentRequests.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-10">No pending requests</p>
          ) : (
            <>
              {receivedRequests.length > 0 && (
                <div>
                  <p className="text-[10px] text-muted-foreground font-semibold mb-2 uppercase tracking-widest">Received</p>
                  {receivedRequests.map((req) => (
                    <div key={req.id} className="bg-white rounded-[18px] shadow-[0_1px_8px_rgba(0,0,0,0.06)] p-4 flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-sm font-semibold text-primary">
                          {req.sender_name?.[0] || "?"}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{req.sender_name || req.sender_email}</p>
                          <p className="text-xs text-muted-foreground">{req.sender_email}</p>
                        </div>
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
              {sentRequests.length > 0 && (
                <div>
                  <p className="text-[10px] text-muted-foreground font-semibold mb-2 uppercase tracking-widest mt-3">Sent</p>
                  {sentRequests.map((req) => (
                    <div key={req.id} className="bg-white rounded-[18px] shadow-[0_1px_8px_rgba(0,0,0,0.06)] p-4 flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-sm font-semibold text-primary">
                          {req.receiver_name?.[0] || "?"}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{req.receiver_name || req.receiver_email}</p>
                          <p className="text-xs text-muted-foreground">Pending</p>
                        </div>
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
                    {f.profile_photo ? (
                      <img src={f.profile_photo} className="w-10 h-10 rounded-full object-cover" alt="" />
                    ) : (
                      (f.full_name || f.display_name)?.[0] || "?"
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{f.full_name || f.display_name || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">{f.username ? `@${f.username}` : f.email || "No contact"}</p>
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