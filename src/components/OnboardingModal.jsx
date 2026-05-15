import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Rendered as a plain fixed overlay (NOT a Radix Dialog) so iOS touch events
// are never swallowed by the Radix portal/overlay trap.
export default function OnboardingModal({ user, onComplete }) {
  const defaultUsername =
    user?.data?.username ||
    user?.full_name?.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "") ||
    user?.email?.split("@")[0]?.toLowerCase().replace(/[^a-z0-9_]/g, "") ||
    "";

  const [username, setUsername] = useState(defaultUsername);
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Skip always works — even if all API calls fail the user gets into the app.
  async function handleSkip() {
    // Best-effort: mark onboarded so the modal doesn't reappear
    try { await base44.auth.updateMe({ onboarded: true }); } catch (_) {}
    onComplete();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;

    const normalizedUsername = username.trim().toLowerCase();
    if (!normalizedUsername) {
      setError("Username is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 1. Update auth user record
      await base44.auth.updateMe({
        username: normalizedUsername,
        bio: bio.trim() || "",
        onboarded: true,
      });
    } catch (err) {
      console.error("[Onboarding] updateMe failed:", err);
      // Non-fatal — continue
    }

    try {
      // 2. Create/update UserProfile search entity
      const existing = await base44.entities.UserProfile.filter(
        { user_id: user.id },
        "-created_date",
        1
      );
      if (existing.length > 0) {
        await base44.entities.UserProfile.update(existing[0].id, {
          username: normalizedUsername,
          username_lower: normalizedUsername,
          user_email: user.email,
          full_name: user.full_name || "",
          bio: bio.trim() || "",
        });
      } else {
        await base44.entities.UserProfile.create({
          user_id: user.id,
          user_email: user.email,
          username: normalizedUsername,
          username_lower: normalizedUsername,
          full_name: user.full_name || "",
          bio: bio.trim() || "",
        });
      }
    } catch (err) {
      console.error("[Onboarding] UserProfile upsert failed:", err);
      // Non-fatal — continue
    }

    setLoading(false);
    onComplete();
  }

  return (
    // Plain fixed overlay — no Radix portal, no focus trap, works on iOS
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      <div className="bg-card rounded-2xl w-full max-w-sm p-6 shadow-xl relative">
        {/* X button — always works */}
        <button
          type="button"
          onClick={handleSkip}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-muted text-muted-foreground"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center mb-5">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-3">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">Welcome to ROVR!</h2>
          <p className="text-sm text-muted-foreground text-center mt-1">
            Hey {user?.full_name?.split(" ")[0] || "there"} 👋 Set up your profile.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>
              Username <span className="text-destructive">*</span>
            </Label>
            <div className="flex items-center mt-1">
              <span className="px-3 py-2 bg-muted text-muted-foreground text-sm rounded-l-md border border-r-0 border-input h-9 flex items-center">
                @
              </span>
              <Input
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""));
                  setError("");
                }}
                placeholder="your_username"
                className={`rounded-l-none ${error ? "border-destructive" : ""}`}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
              />
            </div>
            {error && <p className="text-xs text-destructive mt-1">{error}</p>}
          </div>

          <div>
            <Label>
              Bio{" "}
              <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Avid traveler, coffee enthusiast ✈️"
              className="mt-1"
              rows={2}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !username.trim()}
            className="w-full h-10 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
                Setting up...
              </>
            ) : (
              "Let's go 🚀"
            )}
          </button>

          <button
            type="button"
            onClick={handleSkip}
            className="w-full text-sm text-muted-foreground py-1"
          >
            Skip for now
          </button>
        </form>
      </div>
    </div>
  );
}