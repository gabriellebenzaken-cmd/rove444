import { Plane, Car, Train, HelpCircle, MapPin, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useLiveFlightStatus } from "@/hooks/useLiveFlightStatus";
import { guessAirline } from "@/utils/airlines";
import { formatTime12Hour } from "@/lib/formatTime";

function FlightStatusIndicator({ status, loading, inWindow }) {
  if (loading) {
    return <span className="text-[10px] text-muted-foreground">Loading…</span>;
  }
  
  if (!inWindow) {
    return <span className="text-[10px] text-muted-foreground">Tracking available 24h before departure</span>;
  }
  
  const map = {
    on_time: { label: "On Time", color: "#22c55e" },
    delayed: { label: "Delayed", color: "#f59e0b" },
    landed: { label: "Landed", color: "#6366f1" },
    unknown: { label: "Unable to retrieve flight status", color: "#9ca3af" },
  };
  
  const cfg = map[status] || map.unknown;
  return (
    <span className="text-[10px] font-medium" style={{ color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

export default function TravelCard({ arrival, user, onEdit, onDelete, onClick }) {
  const isFlight = arrival.travel_type === "Flight";
  const outboundFlight = arrival.outbound_flight_number || arrival.flight_number;
  const returnFlight = arrival.return_flight_number;
  
  const { status: liveStatus, loading: liveLoading, inWindow } = useLiveFlightStatus(
    isFlight ? outboundFlight : null,
    arrival.arrival_date,
    arrival.arrival_time
  );

  function formatRoute(a) {
    if (!a.arrival_location && !a.destination) return null;
    const from = a.arrival_location || "?";
    const to = a.destination;
    return to ? `${from} → ${to}` : from;
  }



  function getTravelIcon(type) {
    switch (type) {
      case "Flight": return <Plane className="h-3 w-3" />;
      case "Driving": return <Car className="h-3 w-3" />;
      case "Train": return <Train className="h-3 w-3" />;
      default: return <HelpCircle className="h-3 w-3" />;
    }
  }

  return (
    <div
      className="bg-card rounded-xl border border-border p-4 cursor-pointer active:scale-[0.98] transition-transform"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="font-medium text-sm">{arrival.user_name}</p>
        {arrival.user_email === user?.email && (
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => onEdit(arrival)}>
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => onDelete(arrival.id)}>
              <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-1.5 text-xs text-muted-foreground">
        {isFlight ? (
          <>
            {(arrival.airline || outboundFlight) && (
              <div className="flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                  <Plane className="h-3 w-3 shrink-0" />
                  <span>
                    {arrival.airline || guessAirline(outboundFlight) || "Flight"}
                    {(arrival.airline || guessAirline(outboundFlight)) && outboundFlight ? " · " : ""}
                    {outboundFlight && <span className="font-mono">{outboundFlight}</span>}
                    {arrival.is_round_trip && returnFlight && (
                      <span className="text-muted-foreground"> / <span className="font-mono">{returnFlight}</span></span>
                    )}
                  </span>
                </div>
                {outboundFlight && (
                  <FlightStatusIndicator status={liveStatus} loading={liveLoading} inWindow={inWindow} />
                )}
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center gap-2">
            {getTravelIcon(arrival.travel_type)}
            <span className="capitalize">{arrival.travel_type}</span>
          </div>
        )}

        {formatRoute(arrival) && (
          <div className="flex items-center gap-2">
            <MapPin className="h-3 w-3 shrink-0" />
            <span>{formatRoute(arrival)}</span>
          </div>
        )}

        {arrival.arrival_date && (
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3 shrink-0" />
            <span>Arrives {format(new Date(arrival.arrival_date + "T00:00:00"), "MMM d")}{arrival.arrival_time ? ` at ${formatTime12Hour(arrival.arrival_time)}` : ""}</span>
          </div>
        )}

        {arrival.is_round_trip && arrival.departure_date && (
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3 shrink-0" />
            <span>Returns {format(new Date(arrival.departure_date + "T00:00:00"), "MMM d")}{arrival.departure_time ? ` at ${formatTime12Hour(arrival.departure_time)}` : ""}</span>
          </div>
        )}
      </div>
    </div>
  );
}