import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { toast } from "sonner";

export default function TripPendingRequests({ trip, isAdmin, onUpdate }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAdmin) loadRequests();
  }, [trip.id, isAdmin]);

  async function loadRequests() {
    try {
      setLoading(true);
      const all = await base44.entities.TripJoinRequest.filter(
        { trip_id: trip.id, status: "pending" },
        "-created_date",
        50
      );
      setRequests(all || []);
    } catch (err) {
      console.error("Failed to load join requests:", err);
    } finally {
      setLoading(false);
    }
  }

  async function approveRequest(req) {
    try {
      // Update request status
      await base44.entities.TripJoinRequest.update(req.id, { status: "approved" });

      // Add user to trip members
      const updated = [...(trip.member_emails || []), req.user_email];
      await base44.entities.Trip.update(trip.id, { member_emails: updated });

      console.log("[Trip] Join request approved:", req.id);

      // Notify user
      await base44.entities.Notification.create({
        user_email: req.user_email,
        type: "trip_approved",
        message: `You were added to ${trip.name}`,
        related_trip_id: trip.id,
        is_read: false,
      });

      toast.success("Request approved");
      loadRequests();
      onUpdate?.();
    } catch (err) {
      console.error("Failed to approve request:", err);
      toast.error("Failed to approve request");
    }
  }

  async function denyRequest(req) {
    try {
      await base44.entities.TripJoinRequest.update(req.id, { status: "denied" });

      console.log("[Trip] Join request denied:", req.id);

      // Notify user
      await base44.entities.Notification.create({
        user_email: req.user_email,
        type: "trip_denied",
        message: `Your request to join ${trip.name} was declined`,
        related_trip_id: trip.id,
        is_read: false,
      });

      toast.success("Request denied");
      loadRequests();
    } catch (err) {
      console.error("Failed to deny request:", err);
      toast.error("Failed to deny request");
    }
  }

  if (!isAdmin || requests.length === 0) return null;

  return (
    <div className="bg-card rounded-2xl p-5 border border-border mb-6">
      <h3 className="font-semibold text-sm mb-4">Pending Join Requests ({requests.length})</h3>
      <div className="space-y-2">
        {requests.map((req) => (
          <div key={req.id} className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-sm font-semibold text-primary shrink-0">
                {req.user_name?.[0] || "?"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{req.user_name}</p>
                <p className="text-xs text-muted-foreground truncate">{req.user_email}</p>
              </div>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8 rounded-full"
                onClick={() => approveRequest(req)}
              >
                <Check className="h-4 w-4 text-primary" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8 rounded-full"
                onClick={() => denyRequest(req)}
              >
                <X className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}