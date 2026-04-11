import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Check, X, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function JoinInvite() {
  const { type, code } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [entity, setEntity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [showRequests, setShowRequests] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    loadData();
  }, [type, code]);

  async function loadData() {
    try {
      setLoading(true);

      // Check authentication
      const isAuth = await base44.auth.isAuthenticated();
      setIsAuthed(isAuth);

      if (!isAuth) {
        setLoading(false);
        return;
      }

      const me = await base44.auth.me();
      setUser(me);

      // Load entity by invite code
      const entityType = type === "group" ? "Group" : "Trip";
      const allEntities = await base44.entities[entityType].list("-created_date", 200);
      const found = allEntities.find((e) => e.invite_code === code);

      if (!found) {
        toast.error("Invalid invite link");
        setLoading(false);
        return;
      }

      setEntity(found);

      // Check if already a member
      const memberEmails = found.member_emails || [];
      const alreadyMember = memberEmails.includes(me.email);
      setIsMember(alreadyMember);

      // Load pending join requests (only for trip admins)
      if (type === "trip" && found.admin_email === me.email) {
        const joinReqs = await base44.entities.TripJoinRequest.filter(
          { trip_id: found.id, status: "pending" },
          "-created_date",
          50
        );
        setPendingRequests(joinReqs);
      }

      setLoading(false);
    } catch (err) {
      console.error("Failed to load invite:", err);
      toast.error("Failed to load invite");
      setLoading(false);
    }
  }

  async function acceptInvite() {
    try {
      setRequesting(true);

      if (type === "group") {
        // Check for existing pending request first
        let existing = [];
        try {
          existing = await base44.entities.GroupInvite.filter(
            { group_id: entity.id, invitee_email: user.email, status: "pending" },
            "-created_date", 1
          );
        } catch {}
        if (existing.length > 0) {
          toast.error("Request already sent");
          setRequesting(false);
          setShowConfirm(false);
          setRequestSent(true);
          return;
        }

        // Create pending invite request (user sends request to admin)
        await base44.entities.GroupInvite.create({
          group_id: entity.id,
          invitee_email: user.email,
          invitee_name: user.full_name,
          inviter_email: entity.admin_email,
          inviter_name: entity.admin_name || entity.admin_email.split("@")[0],
          status: "pending",
        });

        await base44.entities.Notification.create({
          user_email: entity.admin_email,
          type: "group_invite",
          message: `${user.full_name} requested to join ${entity.name}`,
          related_user_email: user.email,
          related_user_name: user.full_name,
          related_group_id: entity.id,
          is_read: false,
        });

        toast.success("Join request sent!");
        setRequestSent(true);
        setShowConfirm(false);
      } else {
        // Trip join request (unchanged)
        const existing = await base44.entities.TripJoinRequest.filter(
          { trip_id: entity.id, user_id: user.id },
          "-created_date",
          1
        );

        if (existing.length > 0) {
          const req = existing[0];
          if (req.status === "pending") {
            toast.error("Request already sent");
            setRequesting(false);
            return;
          }
        }

        const joinReq = await base44.entities.TripJoinRequest.create({
          trip_id: entity.id,
          user_id: user.id,
          user_email: user.email,
          user_name: user.full_name,
          user_profile_photo: user.profile_photo,
          status: "pending",
        });

        console.log("[Trip] Join request created:", joinReq.id, "user:", user.id, "trip:", entity.id);

        await base44.entities.Notification.create({
          user_email: entity.admin_email,
          type: "trip_request",
          message: `${user.full_name} requested to join ${entity.name}`,
          related_user_email: user.email,
          related_user_name: user.full_name,
          related_trip_id: entity.id,
          is_read: false,
        });

        toast.success("Join request sent! Waiting for approval.");
      }

      setRequesting(false);
    } catch (err) {
      console.error("Failed to send request:", err);
      toast.error("Failed to send request");
      setRequesting(false);
    }
  }

  async function handleJoinRequest() {
    if (type === "group") {
      setShowConfirm(true);
    } else {
      acceptInvite();
    }
  }

  async function approveJoinRequest(req) {
    try {
      // Update request status
      await base44.entities.TripJoinRequest.update(req.id, { status: "approved" });

      // Add user to trip members
      const updated = [...(entity.member_emails || []), req.user_email];
      await base44.entities.Trip.update(entity.id, { member_emails: updated });

      console.log("[Trip] Join request approved:", req.id, "user:", req.user_email);

      // Notify user
      await base44.entities.Notification.create({
        user_email: req.user_email,
        type: "trip_approved",
        message: `You were added to ${entity.name}`,
        related_trip_id: entity.id,
        is_read: false,
      });

      toast.success("Request approved");
      loadData();
    } catch (err) {
      console.error("Failed to approve request:", err);
      toast.error("Failed to approve request");
    }
  }

  async function denyJoinRequest(req) {
    try {
      await base44.entities.TripJoinRequest.update(req.id, { status: "denied" });

      console.log("[Trip] Join request denied:", req.id);

      // Notify user
      await base44.entities.Notification.create({
        user_email: req.user_email,
        type: "trip_denied",
        message: `Your request to join ${entity.name} was declined`,
        related_trip_id: entity.id,
        is_read: false,
      });

      toast.success("Request denied");
      loadData();
    } catch (err) {
      console.error("Failed to deny request:", err);
      toast.error("Failed to deny request");
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-5">
        <div className="text-center max-w-sm">
          <h2 className="text-2xl font-bold mb-2">Sign in to continue</h2>
          <p className="text-muted-foreground mb-6">You need to be logged in to join this trip.</p>
          <Button
            className="w-full rounded-full mb-3"
            onClick={() => base44.auth.redirectToLogin()}
          >
            Sign In
          </Button>
          <Button variant="outline" className="w-full rounded-full" onClick={() => navigate("/")}>
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  if (!entity) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-5">
        <div className="text-center max-w-sm">
          <h2 className="text-2xl font-bold mb-2">Link not found</h2>
          <p className="text-muted-foreground mb-6">This invite link is invalid or expired.</p>
          <Button className="w-full rounded-full" onClick={() => navigate("/")}>
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const isAdmin = entity.admin_email === user?.email;

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="relative h-48 bg-cover bg-center" style={{ backgroundImage: `url(${entity.cover_image})` }}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <button
          onClick={() => navigate("/")}
          className="absolute top-5 left-4 rounded-full h-9 w-9 flex items-center justify-center bg-black/30 hover:bg-black/50 text-white transition"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      </div>

      <div className="px-5 -mt-20 relative z-10">
        <div className="bg-card rounded-3xl shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold mb-2">{entity.name}</h1>
          <p className="text-muted-foreground mb-4">
            {entity.destination}
            {entity.start_date && (
              <>
                {" • "}
                {format(new Date(entity.start_date + "T00:00:00"), "MMM d")}
                {entity.end_date && ` – ${format(new Date(entity.end_date + "T00:00:00"), "MMM d")}`}
              </>
            )}
          </p>
          {entity.description && <p className="text-sm text-foreground mb-4">{entity.description}</p>}

          <div className="bg-muted/50 rounded-xl p-3 mb-4 text-sm">
            <p className="text-muted-foreground">Organized by</p>
            <p className="font-semibold">{entity.admin_name || "Admin"}</p>
          </div>

          {isMember ? (
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 text-center">
              <p className="text-sm font-medium text-primary mb-3">You're already a member</p>
              <Button className="w-full rounded-full" onClick={() => navigate(type === "group" ? `/group/${entity.id}` : `/trip/${entity.id}`)}>View {type === "group" ? "Group" : "Trip"}</Button>
            </div>
          ) : requestSent ? (
            <div className="bg-muted/60 border border-border rounded-xl p-4 text-center">
              <p className="text-sm font-medium text-muted-foreground">✓ Request sent — waiting for admin approval</p>
            </div>
          ) : (
            <Button
              className="w-full rounded-full h-10 text-base"
              onClick={handleJoinRequest}
              disabled={requesting}
            >
              {requesting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending Request...
                </>
              ) : (
                "Request to Join"
              )}
            </Button>
          )}
        </div>

        {/* Admin panel - pending requests */}
        {isAdmin && pendingRequests.length > 0 && (
          <div className="bg-card rounded-2xl p-5 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Pending Requests ({pendingRequests.length})</h3>
              <button onClick={() => setShowRequests(!showRequests)} className="text-xs text-primary font-medium">
                {showRequests ? "Hide" : "Show"}
              </button>
            </div>

            {showRequests && (
              <div className="space-y-2">
                {pendingRequests.map((req) => (
                  <div key={req.id} className="flex items-center justify-between bg-muted/50 rounded-xl p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-sm font-semibold text-primary">
                        {req.user_name?.[0] || "?"}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{req.user_name || "Member"}</p>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 rounded-full"
                        onClick={() => approveJoinRequest(req)}
                      >
                        <Check className="h-4 w-4 text-primary" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 rounded-full"
                        onClick={() => denyJoinRequest(req)}
                      >
                        <X className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Group invite confirmation modal */}
        {type === "group" && (
          <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
            <DialogContent className="mx-4 rounded-2xl max-w-md p-6">
              <DialogHeader>
                <DialogTitle>Join {entity?.name}?</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <p className="text-sm font-semibold mb-1">Group</p>
                  <p className="text-sm text-foreground">{entity?.name}</p>
                </div>
                {entity?.description && (
                  <div>
                    <p className="text-sm font-semibold mb-1">About</p>
                    <p className="text-sm text-muted-foreground">{entity.description}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold mb-1">Invited by</p>
                  <p className="text-sm text-foreground">{entity?.admin_name || entity?.admin_email}</p>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  className="flex-1 rounded-full"
                  onClick={() => setShowConfirm(false)}
                >
                  Decline
                </Button>
                <Button
                  className="flex-1 rounded-full"
                  onClick={acceptInvite}
                  disabled={requesting}
                >
                  {requesting ? "Accepting..." : "Accept"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}