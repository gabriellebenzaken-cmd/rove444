import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LogOut, Edit3, Save, X } from "lucide-react";
import { toast } from "sonner";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ username: "", bio: "" });
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState([]);
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const me = await base44.auth.me();
    setUser(me);
    setForm({ username: me.username || "", bio: me.bio || "" });

    const allTrips = await base44.entities.Trip.list("-created_date", 50);
    setTrips(allTrips.filter((t) => t.member_emails?.includes(me.email) || t.admin_email === me.email));

    const allGroups = await base44.entities.Group.list("-created_date", 50);
    setGroups(allGroups.filter((g) => g.member_emails?.includes(me.email) || g.admin_email === me.email));

    setLoading(false);
  }

  async function handleSave() {
    await base44.auth.updateMe({ username: form.username, bio: form.bio });
    setUser({ ...user, ...form });
    setEditing(false);
    toast.success("Profile updated!");
  }

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-5 pt-14">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <Button
          variant="ghost"
          size="sm"
          className="rounded-full text-muted-foreground"
          onClick={() => base44.auth.logout()}
        >
          <LogOut className="h-4 w-4 mr-1.5" /> Sign Out
        </Button>
      </div>

      <div className="flex flex-col items-center mb-8">
        <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center text-2xl font-bold text-primary mb-3">
          {user?.full_name?.[0] || "?"}
        </div>
        <h2 className="text-xl font-semibold">{user?.full_name}</h2>
        {user?.username && <p className="text-sm text-muted-foreground">@{user.username}</p>}
        <p className="text-xs text-muted-foreground mt-0.5">{user?.email}</p>
        {user?.bio && <p className="text-sm text-center mt-2 max-w-[250px]">{user.bio}</p>}
      </div>

      {editing ? (
        <div className="bg-card rounded-2xl border border-border p-5 mb-6 space-y-4">
          <div>
            <Label>Username</Label>
            <Input
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="your_username"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Bio</Label>
            <Textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="Tell us about yourself..."
              className="mt-1"
              rows={2}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} className="flex-1 rounded-full">
              <Save className="h-4 w-4 mr-1.5" /> Save
            </Button>
            <Button variant="outline" onClick={() => setEditing(false)} className="rounded-full">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          className="w-full rounded-full mb-6"
          onClick={() => setEditing(true)}
        >
          <Edit3 className="h-4 w-4 mr-1.5" /> Edit Profile
        </Button>
      )}

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-card rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold">{trips.length}</p>
          <p className="text-xs text-muted-foreground">Trips</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold">{groups.length}</p>
          <p className="text-xs text-muted-foreground">Groups</p>
        </div>
      </div>
    </div>
  );
}