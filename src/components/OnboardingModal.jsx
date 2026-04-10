import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles } from "lucide-react";

export default function OnboardingModal({ user, onComplete }) {
  const [username, setUsername] = useState(user?.full_name?.toLowerCase().replace(/\s+/g, "_") || "");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [usernameError, setUsernameError] = useState("");

  useEffect(() => {
    if (!saving) return;
    const timeoutId = setTimeout(() => {
      setSaving(false);
      toast.error("Setup is taking too long. Please try again.");
    }, 8000);
    return () => clearTimeout(timeoutId);
  }, [saving]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!username.trim()) return;
    
    setSaving(true);
    setUsernameError("");
    
    try {
      const allUsers = await base44.entities.User.list("-created_date", 500);
      const taken = allUsers.find(u => u.username?.toLowerCase() === username.trim().toLowerCase() && u.email !== user.email);
      
      if (taken) {
        setUsernameError("Username already taken");
        return;
      }
      
      await base44.auth.updateMe({ username: username.trim(), bio: bio.trim(), onboarded: true });
      onComplete();
    } catch (error) {
      console.error("Onboarding error:", error);
      toast.error("Setup failed. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open>
      <DialogContent className="mx-4 rounded-2xl max-w-sm" hideCloseButton>
        <DialogHeader>
          <div className="flex flex-col items-center mb-2">
            <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center mb-3">
              <Sparkles className="h-7 w-7 text-primary" />
            </div>
            <DialogTitle className="text-xl">Welcome to Rove!</DialogTitle>
            <p className="text-sm text-muted-foreground text-center mt-1">
              Hey {user?.full_name?.split(" ")[0]} 👋 Set up your profile to get started.
            </p>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Username <span className="text-destructive">*</span></Label>
            <div className="flex items-center mt-1">
              <span className="px-3 py-2 bg-muted text-muted-foreground text-sm rounded-l-md border border-r-0 border-input">@</span>
              <Input
                value={username}
                onChange={(e) => { setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "")); setUsernameError(""); }}
                placeholder="your_username"
                className={`rounded-l-none ${usernameError ? "border-destructive" : ""}`}
                required
              />
            </div>
            {usernameError && <p className="text-xs text-destructive mt-1">{usernameError}</p>}
          </div>
          <div>
            <Label>Bio <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Avid traveler, coffee enthusiast ✈️"
              className="mt-1"
              rows={2}
            />
          </div>
          <Button type="submit" className="w-full rounded-full" disabled={saving || !username.trim()}>
           {saving ? (
             <div className="flex items-center gap-2">
               <div className="w-4 h-4 border-2 border-t-transparent border-current rounded-full animate-spin" />
               Setting up...
             </div>
           ) : (
             "Let's go 🚀"
           )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}