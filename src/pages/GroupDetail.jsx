import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Link2, Users, UserMinus, LogOut, MapPin, Crown, UserPlus, Plus, MessageSquare } from "lucide-react";
import FriendProfileModal from "../components/FriendProfileModal";
import GroupChat from "../components/GroupChat";
import GroupPendingInvites from "@/components/group/GroupPendingInvites";
import InviteMembersModal from "@/components/group/InviteMembersModal";
import CreateTripDialog from "../components/trips/CreateTripDialog";
import { toast } from "sonner";

export default function GroupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [user, setUser] = useState(null);
  const [members, setMembers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showCreateTrip, setShowCreateTrip] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState("members");
  const [viewingMember, setViewingMember] = useState(null);

  useEffect(() => {
    loadData();

    // Subscribe to UserProfile changes to refresh member list
    const unsubscribe = base44.entities.UserProfile.subscribe(() => {
      loadData();
    });
    return () => unsubscribe?.();
  }, [id]);

  async function loadData() {
    try {
      const me = await base44.auth.me();
      setUser(me);
      const allGroups = await base44.entities.Group.list("-created_date", 200);
      const g = allGroups.find((gr) => gr.id === id);
      setGroup(g || null);

      if (g) {
        // Use fresh UserProfile data to ensure no stale member info
        const [profiles, allTrips] = await Promise.all([
          base44.entities.UserProfile.list("-created_date", 500),
          base44.entities.Trip.list("-created_date", 50),
        ]);
        // Build member list from group.member_emails + fresh UserProfile data
        const enriched = (g.member_emails || []).map((email) => {
          const profile = profiles.find((p) => p.user_email === email);
          return {
            id: profile?.user_id || email,
            email,
            full_name: profile?.full_name || "User",
            username: profile?.username || null,
            profile_photo: profile?.profile_photo || null,
          };
        });
        setMembers(enriched);
        setTrips(allTrips.filter((t) => t.group_id === id));
      }
    } catch (err) {
      console.error("[GroupDetail] loadData failed:", err);
    } finally {
      setLoading(false);
    }
  }

  async function copyInviteLink() {
    const link = `${window.location.origin}/join/group/${group.invite_code}`;
    await navigator.clipboard.writeText(link);
    toast.success("Invite link copied!");
  }

  async function removeMember(email) {
    const updated = group.member_emails.filter((e) => e !== email);
    await base44.entities.Group.update(id, { member_emails: updated });
    toast.success("Member removed");
    setMemberToRemove(null);
    loadData();
  }

  async function leaveGroup() {
    const updated = group.member_emails.filter((e) => e !== user.email);
    await base44.entities.Group.update(id, { member_emails: updated });
    toast.success("Left group");
    navigate("/groups");
  }

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="px-5 pt-14 text-center">
        <p className="text-muted-foreground">Group not found</p>
        <Link to="/groups" className="text-primary text-sm mt-2 inline-block">Back to groups</Link>
      </div>
    );
  }

  const isAdmin = group.admin_email === user?.email;
  const hasActivity = trips.length > 0 || members.length > 1;

  return (
    <div className="px-5 pt-10">
      {isAdmin && <GroupPendingInvites group={group} isAdmin={isAdmin} onUpdate={loadData} />}

      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate("/groups")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{group.name}</h1>
          {group.description && <p className="text-xs text-muted-foreground">{group.description}</p>}
        </div>
        {!isAdmin && (
          <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground text-xs" onClick={() => setShowLeaveConfirm(true)}>
            <LogOut className="h-3.5 w-3.5 mr-1" /> Leave
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-muted/70 rounded-full p-1">
        {[{ key: "members", label: `Members (${members.length})` }, { key: "chat", label: "Chat" }].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`flex-1 py-2 text-xs font-medium rounded-full transition-all ${activeTab === t.key ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "chat" && <GroupChat group={group} user={user} />}

      {activeTab === "members" && (<>

      {/* Action buttons */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex flex-col items-center gap-1.5 p-3 rounded-2xl text-center transition-all active:scale-95"
          style={{ background: "rgba(200,162,124,0.1)", border: "1px solid rgba(200,162,124,0.15)" }}
        >
          <UserPlus className="h-5 w-5" style={{ color: "#C8A27C" }} />
          <span className="text-[10px] font-medium" style={{ color: "#9A8A7A" }}>Invite Members</span>
        </button>
        <button
          onClick={() => setShowCreateTrip(true)}
          className="flex flex-col items-center gap-1.5 p-3 rounded-2xl text-center transition-all active:scale-95"
          style={{ background: "rgba(200,162,124,0.1)", border: "1px solid rgba(200,162,124,0.15)" }}
        >
          <Plus className="h-5 w-5" style={{ color: "#C8A27C" }} />
          <span className="text-[10px] font-medium" style={{ color: "#9A8A7A" }}>Create Trip</span>
        </button>
        <button
          onClick={copyInviteLink}
          className="flex flex-col items-center gap-1.5 p-3 rounded-2xl text-center transition-all active:scale-95"
          style={{ background: "rgba(200,162,124,0.1)", border: "1px solid rgba(200,162,124,0.15)" }}
        >
          <Link2 className="h-5 w-5" style={{ color: "#C8A27C" }} />
          <span className="text-[10px] font-medium" style={{ color: "#9A8A7A" }}>Copy Invite</span>
        </button>
      </div>

      {/* Empty state */}
      {!hasActivity && (
        <div className="rounded-2xl p-5 mb-6 text-center" style={{ background: "rgba(200,162,124,0.06)", border: "1px dashed rgba(200,162,124,0.3)" }}>
          <p className="text-sm font-semibold mb-1" style={{ color: "#3A3028" }}>start planning with this group</p>
          <p className="text-xs mb-4" style={{ color: "#B0A090" }}>invite your crew and kick off a trip together</p>
          <div className="flex gap-2 justify-center">
            <button onClick={() => setShowCreateTrip(true)} className="px-4 py-1.5 rounded-full text-xs font-semibold" style={{ background: "#C8A27C", color: "white" }}>Create a trip</button>
            <button onClick={() => setShowInviteModal(true)} className="px-4 py-1.5 rounded-full text-xs font-medium border" style={{ borderColor: "rgba(200,162,124,0.3)", color: "#9A8A7A" }}>Invite members</button>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Users className="h-4 w-4" /> Members ({members.length})
        </h3>
        <div className="space-y-2">
          {members.map((m) => {
            const isGroupAdmin = m.email === group.admin_email;
            return (
              <div key={m.id} className="bg-card rounded-xl border border-border p-3 flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => setViewingMember({ id: m.id, email: m.email, full_name: m.full_name, display_name: m.full_name })}>
                  <div className="relative">
                    <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-xs font-semibold text-primary">
                      {m.profile_photo
                        ? <img src={m.profile_photo} className="w-9 h-9 rounded-full object-cover" alt="" />
                        : (m.full_name?.[0] || "?")}
                    </div>
                    {isGroupAdmin && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center" style={{background:'#C8A27C'}}>
                        <Crown className="h-2.5 w-2.5 text-white" />
                      </span>
                    )}
                  </div>
                  <div>
                     <p className="text-sm font-medium">{m.full_name}</p>
                     <p className="text-xs text-muted-foreground">
                       {m.username ? `@${m.username} · ` : ""}{isGroupAdmin ? "Admin" : "Member"}
                     </p>
                  </div>
                </div>
                {isAdmin && m.email !== user.email && (
                  <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full" onClick={(e) => { e.stopPropagation(); setMemberToRemove(m); }}>
                    <UserMinus className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      </>)}

      {trips.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4" /> Trips ({trips.length})
          </h3>
          <div className="space-y-2">
            {trips.map((t) => (
              <Link key={t.id} to={`/trip/${t.id}`} className="block">
                <div className="bg-card rounded-xl border border-border p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.destination}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <FriendProfileModal
        friend={viewingMember}
        onClose={() => setViewingMember(null)}
        currentUserEmail={user?.email}
      />

      <InviteMembersModal
        group={group}
        user={user}
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSuccess={loadData}
      />

      <CreateTripDialog
        open={showCreateTrip}
        onOpenChange={setShowCreateTrip}
        user={user}
        onCreated={loadData}
        defaultGroupId={group.id}
      />

      {/* Remove member confirmation */}
      <Dialog open={!!memberToRemove} onOpenChange={(v) => !v && setMemberToRemove(null)}>
        <DialogContent className="mx-4 rounded-2xl max-w-sm p-6">
          <DialogHeader>
            <DialogTitle>Remove {memberToRemove?.full_name}?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-6">They will be removed from the group and will need to be re-invited to rejoin.</p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 rounded-full" onClick={() => setMemberToRemove(null)}>Cancel</Button>
            <Button variant="destructive" className="flex-1 rounded-full" onClick={() => removeMember(memberToRemove.email)}>Remove</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Leave group confirmation */}
      <Dialog open={showLeaveConfirm} onOpenChange={setShowLeaveConfirm}>
        <DialogContent className="mx-4 rounded-2xl max-w-sm p-6">
          <DialogHeader>
            <DialogTitle>Leave {group?.name}?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-6">You will need to be re-invited to rejoin this group.</p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 rounded-full" onClick={() => setShowLeaveConfirm(false)}>Cancel</Button>
            <Button variant="destructive" className="flex-1 rounded-full" onClick={leaveGroup}>Leave Group</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}