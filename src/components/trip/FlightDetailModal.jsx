import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plane, Car, Train, HelpCircle, Clock, ArrowRight, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useLiveFlightStatus } from "@/hooks/useLiveFlightStatus";

function formatDate(date, time) {
  if (!date) return null;
  try {
    const d = format(new Date(date + "T00:00:00"), "EEE, MMM d");
    return time ? `${d} at ${time}` : d;
  } catch {
    return date;
  }
}

function hoursUntilDeparture(dateStr, timeStr) {
  if (!dateStr) return null;
  const time = timeStr || "00:00";
  const dep = new Date(`${dateStr}T${time}:00`);
  return (dep - new Date()) / (1000 * 60 * 60);
}

function FlightStatusBadge({ status }) {
  const map = {
    on_time: { label: "On Time",        color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
    delayed: { label: "Delayed",        color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
    landed:  { label: "Landed",         color: "#6366f1", bg: "rgba(99,102,241,0.1)" },
    unknown: { label: "Status Unknown", color: "#9ca3af", bg: "rgba(156,163,175,0.1)" },
  };
  const cfg = map[status] || map.unknown;
  return (
    <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ color: cfg.color, background: cfg.bg }}>
      {cfg.label}
    </span>
  );
}

function LegBlock({ label, flightNum, from, to, depDate, depTime, arrDate, arrTime }) {
  return (
    <div className="bg-muted/40 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        {flightNum && (
          <span className="text-xs font-mono font-semibold bg-background border border-border px-2 py-0.5 rounded-md">
            {flightNum}
          </span>
        )}
      </div>

      {(from || to) ? (
        <div className="flex items-center gap-2">
          <div className="text-center">
            <p className="text-lg font-bold tracking-tight">{from || "—"}</p>
            {depDate && <p className="text-[11px] text-muted-foreground">{depDate}</p>}
            {depTime && <p className="text-xs font-medium">{depTime}</p>}
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground mx-1 shrink-0" />
          <div className="text-center">
            <p className="text-lg font-bold tracking-tight">{to || "—"}</p>
            {arrDate && <p className="text-[11px] text-muted-foreground">{arrDate}</p>}
            {arrTime && <p className="text-xs font-medium">{arrTime}</p>}
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Route not specified</p>
      )}
    </div>
  );
}

function NonFlightDetail({ arrival }) {
  const icons = { Driving: Car, Train: Train };
  const Icon = icons[arrival.travel_type] || HelpCircle;

  return (
    <div className="space-y-3 mt-2">
      <div className="flex items-center gap-3 bg-muted/40 rounded-xl p-4">
        <Icon className="h-5 w-5 text-primary" />
        <div>
          <p className="text-sm font-semibold">{arrival.travel_type}</p>
          {(arrival.arrival_location || arrival.destination) && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {arrival.arrival_location}
              {arrival.arrival_location && arrival.destination ? " → " : ""}
              {arrival.destination}
            </p>
          )}
        </div>
      </div>
      {arrival.arrival_date && (
        <div className="flex items-center gap-3 px-1">
          <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Arriving</p>
            <p className="text-sm font-medium">{formatDate(arrival.arrival_date, arrival.arrival_time)}</p>
          </div>
        </div>
      )}
      {arrival.departure_date && (
        <div className="flex items-center gap-3 px-1">
          <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Departing</p>
            <p className="text-sm font-medium">{formatDate(arrival.departure_date, arrival.departure_time)}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FlightDetailModal({ arrival, open, onClose }) {
  const isFlight = arrival?.travel_type === "Flight";
  const outboundFlight = arrival?.outbound_flight_number || arrival?.flight_number;
  const outboundHours = hoursUntilDeparture(arrival?.arrival_date, arrival?.arrival_time);
  const inTrackingWindow = outboundHours !== null && outboundHours <= 24 && outboundHours > -6;

  const { status: liveStatus, loading: liveLoading } = useLiveFlightStatus(
    (arrival && inTrackingWindow) ? outboundFlight : null,
    arrival?.arrival_date,
    arrival?.arrival_time
  );

  if (!arrival) return null;

  const returnFlight = arrival.return_flight_number;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="mx-4 rounded-2xl max-w-sm p-5">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            {isFlight ? <Plane className="h-4 w-4" /> : null}
            {arrival.user_name || arrival.user_email?.split("@")[0]}
          </DialogTitle>
        </DialogHeader>

        {isFlight ? (
          <div className="space-y-3 mt-1">
            {/* Airline + live status */}
            <div className="flex items-center justify-between">
              <div>
                {arrival.airline
                  ? <p className="font-semibold text-sm">{arrival.airline}</p>
                  : <p className="text-sm text-muted-foreground">Airline not specified</p>
                }
              </div>
              {outboundFlight && (
                inTrackingWindow ? (
                  liveLoading
                    ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    : <FlightStatusBadge status={liveStatus || "unknown"} />
                ) : (
                  <span className="text-[11px] text-muted-foreground">Tracking 24h before departure</span>
                )
              )}
            </div>

            {/* Outbound leg */}
            <LegBlock
              label="Outbound"
              flightNum={outboundFlight}
              from={arrival.arrival_location}
              to={arrival.destination}
              depDate={null}
              depTime={null}
              arrDate={arrival.arrival_date ? format(new Date(arrival.arrival_date + "T00:00:00"), "EEE, MMM d") : null}
              arrTime={arrival.arrival_time}
            />

            {/* Return leg */}
            {arrival.is_round_trip && (
              <LegBlock
                label="Return"
                flightNum={returnFlight || null}
                from={arrival.destination}
                to={arrival.arrival_location}
                depDate={arrival.departure_date ? format(new Date(arrival.departure_date + "T00:00:00"), "EEE, MMM d") : null}
                depTime={arrival.departure_time}
                arrDate={null}
                arrTime={null}
              />
            )}

            {!outboundFlight && !arrival.airline && (
              <p className="text-[11px] text-muted-foreground text-center pt-1">No flight details recorded</p>
            )}
            {outboundFlight && !inTrackingWindow && (
              <p className="text-[11px] text-muted-foreground text-center pt-1">Scheduled — live tracking begins 24h before departure</p>
            )}
          </div>
        ) : (
          <NonFlightDetail arrival={arrival} />
        )}
      </DialogContent>
    </Dialog>
  );
}