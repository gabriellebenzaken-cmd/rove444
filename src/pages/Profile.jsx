import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LogOut, Edit3, Save, X, Settings, Trash2, Shield, ChevronRight, Camera, Upload } from "lucide-react";
import { toast } from "sonner";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ username: "", bio: "", profile_photo: "" });
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState([]);
  const [groups, setGroups] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const me = await base44.auth.me();
    setUser(me);
    setForm({ username: me.username || "", bio: me.bio || "", profile_photo: me.profile_photo || "" });

    const allTrips = await base44.entities.Trip.list("-created_date", 50);
    setTrips(allTrips.filter((t) => t.member_emails?.includes(me.email) || t.admin_email === me.email));

    const allGroups = await base44.entities.Group.list("-created_date", 50);
    setGroups(allGroups.filter((g) => g.member_emails?.includes(me.email) || g.admin_email === me.email));

    setLoading(false);
  }

  async function handleSave() {
    await base44.auth.updateMe({ username: form.username, bio: form.bio, profile_photo: form.profile_photo });
    setUser({ ...user, ...form });
    setEditing(false);
    toast.success("Profile updated!");
  }

  async function handlePhotoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm((f) => ({ ...f, profile_photo: file_url }));
    setUploadingPhoto(false);
  }

  const avatarUrl = editing ? form.profile_photo : user?.profile_photo;
  const initials = user?.full_name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?";

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-5 pt-12 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[28px] font-bold tracking-tight leading-none">Profile</h1>
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setShowSettings(true)}>
          <Settings className="h-5 w-5 text-muted-foreground" />
        </Button>
      </div>

      {/* Avatar + identity */}
      <div className="flex flex-col items-center mb-6">
        <div className="relative mb-3">
          {avatarUrl ? (
            <img src={avatarUrl} alt="avatar" className="w-24 h-24 rounded-full object-cover border-2 border-border" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-accent flex items-center justify-center text-3xl font-bold text-primary">
              {initials}
            </div>
          )}
          {editing && (
            <label className="absolute bottom-0 right-0 w-8 h-8 bg-card border border-border rounded-full flex items-center justify-center cursor-pointer shadow hover:bg-muted transition-colors">
              {uploadingPhoto
                ? <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                : <Camera className="h-3.5 w-3.5 text-muted-foreground" />}
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
            </label>
          )}
        </div>
        <h2 className="text-xl font-semibold">{user?.full_name}</h2>
        {user?.username && <p className="text-sm text-muted-foreground">@{user.username}</p>}
        <p className="text-xs text-muted-foreground mt-0.5">{user?.email}</p>
        {!editing && user?.bio && <p className="text-sm text-center mt-2 max-w-[260px] text-muted-foreground">{user.bio}</p>}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white rounded-[18px] shadow-[0_2px_10px_rgba(0,0,0,0.06)] p-4 text-center">
          <p className="text-2xl font-bold tracking-tight">{trips.length}</p>
          <p className="text-[11px] text-slate-400 font-medium">Trips</p>
        </div>
        <div className="bg-white rounded-[18px] shadow-[0_2px_10px_rgba(0,0,0,0.06)] p-4 text-center">
          <p className="text-2xl font-bold tracking-tight">{groups.length}</p>
          <p className="text-[11px] text-slate-400 font-medium">Groups</p>
        </div>
      </div>

      {/* Edit Form */}
      {editing ? (
        <div className="bg-white rounded-[18px] shadow-[0_2px_10px_rgba(0,0,0,0.06)] p-5 mb-4 space-y-4">
          <div>
            <Label>Username</Label>
            <div className="flex items-center mt-1">
              <span className="px-3 py-2 bg-muted text-muted-foreground text-sm rounded-l-md border border-r-0 border-input">@</span>
              <Input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") })}
                placeholder="your_username"
                className="rounded-l-none"
              />
            </div>
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
        <Button variant="outline" className="w-full rounded-full" onClick={() => setEditing(true)}>
          <Edit3 className="h-4 w-4 mr-1.5" /> Edit Profile
        </Button>
      )}

      {/* Settings Sheet */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="mx-4 rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-1 mt-1">
            <a
              href="https://www.privacypolicies.com/generic/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Privacy Policy</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </a>

            <button
              className="flex items-center justify-between w-full px-4 py-3 rounded-xl hover:bg-muted transition-colors"
              onClick={() => {
                setShowSettings(false);
                base44.auth.logout();
              }}
            >
              <div className="flex items-center gap-3">
                <LogOut className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Sign Out</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>

            <div className="border-t border-border my-2" />

            <button
              className="flex items-center justify-between w-full px-4 py-3 rounded-xl hover:bg-destructive/10 transition-colors"
              onClick={() => { setShowSettings(false); setShowDeleteConfirm(true); }}
            >
              <div className="flex items-center gap-3">
                <Trash2 className="h-4 w-4 text-destructive" />
                <span className="text-sm text-destructive">Delete Account</span>
              </div>
              <ChevronRight className="h-4 w-4 text-destructive" />
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="mx-4 rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Account?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This will permanently delete your Rove account and remove you from all trips and groups. This action cannot be undone.
          </p>
          <p className="text-xs text-muted-foreground bg-muted rounded-xl px-3 py-2">
            To complete account deletion, please contact support at <strong>support@rove.app</strong> with your email address.
          </p>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" className="flex-1 rounded-full" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
            <Button
              variant="destructive"
              className="flex-1 rounded-full"
              onClick={() => { setShowDeleteConfirm(false); toast.info("Deletion request noted. We'll reach out shortly."); }}
            >
              Request Deletion
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}