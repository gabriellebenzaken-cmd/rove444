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
  const [username, setUsername] = useState(
    user?.data?.username ||
    user?.full_name?.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "") ||
    user?.email?.split("@")[0]?.toLowerCase().replace(/[^a-z0-9_]/g, "") ||
    ""
  );
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stuckTimer, setStuckTimer] = useState(null);
  const [showSkipHint, setShowSkipHint] = useState(false);

  // If loading takes > 8 s, show a skip hint (helps on flaky iOS connections)
  function startStuckTimer() {
    const t = setTimeout(() => setShowSkipHint(true), 8000);
    setStuckTimer(t);
  }
  function clearStuckTimer() {
    if (stuckTimer) clearTimeout(stuckTimer);
    setShowSkipHint(false);
  }

  async function handleProfileSetup(e) {
    e.preventDefault();
    if (loading) return;

    try {
      setLoading(true);
      setError("");
      startStuckTimer();

      const normalizedUsername = username?.trim()?.toLowerCase();

      if (!normalizedUsername) {
        setError("Username is required");
        setLoading(false);
        return;
      }

      try {
        await base44.auth.updateMe({ username: normalizedUsername, bio: bio.trim() || "", onboarded: true });
      } catch (profileErr) {
        console.error("Profile save failed, allowing user through anyway:", profileErr);
      }

      // Create or update UserProfile for search
      try {
        const existing = await base44.entities.UserProfile.filter({ user_id: user.id }, "-created_date", 1);
        if (existing.length > 0) {
          await base44.entities.UserProfile.update(existing[0].id, {
            username: normalizedUsername,
            user_email: user.email,
            full_name: user.full_name,
          });
        } else {
          await base44.entities.UserProfile.create({
            user_id: user.id,
            user_email: user.email,
            username: normalizedUsername,
            full_name: user.full_name,
          });
        }
      } catch (profileEntityErr) {
        console.error("Failed to create/update UserProfile:", profileEntityErr);
      }

      onComplete();
    } catch (err) {
      console.error("Onboarding error:", err);
      onComplete();
    } finally {
      setLoading(false);
      clearStuckTimer();
    }
  }

  function handleSkip() {
    clearStuckTimer();
    onComplete();
  }

  return (
    <Dialog open>
      <DialogContent className="mx-4 rounded-2xl max-w-sm" hideCloseButton>
        <DialogHeader>
          <div className="flex flex-col items-center mb-2">
            <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center mb-3">
              <Sparkles className="h-7 w-7 text-primary" />
            </div>
            <DialogTitle className="text-xl">Welcome to ROVR!</DialogTitle>
            <p className="text-sm text-muted-foreground text-center mt-1">
              Hey {user?.full_name?.split(" ")[0]} 👋 Set up your profile to get started.
            </p>
          </div>
        </DialogHeader>
        <form onSubmit={handleProfileSetup} className="space-y-4">
          <div>
            <Label>Username <span className="text-destructive">*</span></Label>
            <div className="flex items-center mt-1">
              <span className="px-3 py-2 bg-muted text-muted-foreground text-sm rounded-l-md border border-r-0 border-input">@</span>
              <Input
                value={username}
                onChange={(e) => { setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "")); setError(""); }}
                placeholder="your_username"
                className={`rounded-l-none ${error ? "border-destructive" : ""}`}
                required
              />
            </div>
            {error && <p className="text-xs text-destructive mt-1">{error}</p>}
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
          <Button type="submit" className="w-full rounded-full" disabled={loading || !username.trim()}>
           {loading ? (
             <div className="flex items-center gap-2">
               <div className="w-4 h-4 border-2 border-t-transparent border-current rounded-full animate-spin" />
               Setting up...
             </div>
           ) : (
             "Let's go 🚀"
           )}
          </Button>
          <button type="button" onClick={handleSkip} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors">
             Skip for now
           </button>
           {showSkipHint && (
             <p className="text-xs text-center text-amber-500 -mt-1">
               Taking longer than usual — tap "Skip for now" to continue.
             </p>
           )}
        </form>
      </DialogContent>
    </Dialog>
  );
}