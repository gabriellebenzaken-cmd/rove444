import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Link2, Users, UserMinus, LogOut, MapPin, Crown } from "lucide-react";
import GroupPendingInvites from "@/components/group/GroupPendingInvites";
import { toast } from "sonner";

export default function GroupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [user, setUser] = useState(null);
  const [members, setMembers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    const me = await base44.auth.me();
    setUser(me);
    const allGroups = await base44.entities.Group.list("-created_date", 200);
    const g = allGroups.find((gr) => gr.id === id);
    setGroup(g);

    if (g) {
      const allUsers = await base44.entities.User.list("-created_date", 200);
      setMembers(allUsers.filter((u) => g.member_emails?.includes(u.email)));

      const allTrips = await base44.entities.Trip.list("-created_date", 50);
      setTrips(allTrips.filter((t) => t.group_id === id));
    }
    setLoading(false);
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

  return (
    <div className="px-5 pt-10">
      {isAdmin && <GroupPendingInvites group={group} isAdmin={isAdmin} onUpdate={loadData} />}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate("/groups")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{group.name}</h1>
          {group.description && <p className="text-xs text-muted-foreground">{group.description}</p>}
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <Button variant="outline" className="flex-1 rounded-full" onClick={copyInviteLink}>
          <Link2 className="h-4 w-4 mr-1.5" /> Copy Invite
        </Button>
        {!isAdmin && (
          <Button variant="outline" className="rounded-full text-destructive" onClick={leaveGroup}>
            <LogOut className="h-4 w-4 mr-1.5" /> Leave
          </Button>
        )}
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Users className="h-4 w-4" /> Members ({members.length})
        </h3>
        <div className="space-y-2">
          {members.map((m) => {
            const isGroupAdmin = m.email === group.admin_email;
            return (
              <div key={m.id} className="bg-card rounded-xl border border-border p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
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
                      {m.username ? `@${m.username}` : m.email} · {isGroupAdmin ? "Admin" : "Member"}
                    </p>
                  </div>
                </div>
                {isAdmin && m.email !== user.email && (
                  <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full" onClick={() => removeMember(m.email)}>
                    <UserMinus className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>

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
    </div>
  );
}