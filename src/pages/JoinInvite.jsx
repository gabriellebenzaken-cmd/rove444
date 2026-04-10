import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function JoinInvite() {
  const { type, code } = useParams();
  const navigate = useNavigate();
  const [entity, setEntity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [user, setUser] = useState(null);
  const [alreadyMember, setAlreadyMember] = useState(false);

  useEffect(() => {
    loadData();
  }, [type, code]);

  async function loadData() {
    const me = await base44.auth.me();
    setUser(me);

    if (type === "group") {
      const groups = await base44.entities.Group.list("-created_date", 200);
      const found = groups.find((g) => g.invite_code === code && g.invite_active);
      setEntity(found);
      if (found && found.member_emails?.includes(me.email)) {
        setAlreadyMember(true);
      }
    } else if (type === "trip") {
      const trips = await base44.entities.Trip.list("-created_date", 200);
      const found = trips.find((t) => t.invite_code === code && t.invite_active);
      setEntity(found);
      if (found && found.member_emails?.includes(me.email)) {
        setAlreadyMember(true);
      }
    }
    setLoading(false);
  }

  async function handleJoin() {
    setJoining(true);
    if (type === "group") {
      const updated = [...(entity.member_emails || []), user.email];
      await base44.entities.Group.update(entity.id, { member_emails: updated });
      toast.success(`Joined ${entity.name}!`);
      navigate(`/group/${entity.id}`);
    } else if (type === "trip") {
      const updated = [...(entity.member_emails || []), user.email];
      await base44.entities.Trip.update(entity.id, { member_emails: updated });
      toast.success(`Joined ${entity.name}!`);
      navigate(`/trip/${entity.id}`);
    }
    setJoining(false);
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!entity) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-5">
        <div className="w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center mb-4">
          <X className="h-7 w-7 text-destructive" />
        </div>
        <h2 className="text-xl font-bold mb-2">Invalid Invite</h2>
        <p className="text-sm text-muted-foreground mb-6 text-center">
          This invite link is invalid or has expired.
        </p>
        <Button className="rounded-full" onClick={() => navigate("/")}>Go Home</Button>
      </div>
    );
  }

  if (alreadyMember) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-5">
        <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mb-4">
          <Check className="h-7 w-7 text-primary" />
        </div>
        <h2 className="text-xl font-bold mb-2">Already a Member</h2>
        <p className="text-sm text-muted-foreground mb-6 text-center">
          You're already part of {entity.name}
        </p>
        <Button
          className="rounded-full"
          onClick={() => navigate(type === "group" ? `/group/${entity.id}` : `/trip/${entity.id}`)}
        >
          Open {type === "group" ? "Group" : "Trip"}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-5">
      <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mb-4">
        <Check className="h-7 w-7 text-primary" />
      </div>
      <h2 className="text-xl font-bold mb-1">Join {entity.name}</h2>
      <p className="text-sm text-muted-foreground mb-6 text-center">
        You've been invited to join this {type}
      </p>
      <div className="flex gap-3">
        <Button className="rounded-full px-8" onClick={handleJoin} disabled={joining}>
          {joining ? "Joining..." : "Join"}
        </Button>
        <Button variant="outline" className="rounded-full" onClick={() => navigate("/")}>
          Cancel
        </Button>
      </div>
    </div>
  );
}