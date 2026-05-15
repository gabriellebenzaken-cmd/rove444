import { Plane, Car, Train, HelpCircle, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useLiveFlightStatus } from "@/hooks/useLiveFlightStatus";
import { guessAirline } from "@/utils/airlines";
import { formatTime12Hour } from "@/lib/formatTime";

// ── Status pill ────────────────────────────────────────────────────────────────
function StatusPill({ status, loading, inWindow }) {
  if (loading) {
    return (
      <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
        …
      </span>
    );
  }
  if (!inWindow) return null;

  const map = {
    on_time: { label: "On Time",  bg: "rgba(34,197,94,0.12)",  color: "#16a34a" },
    delayed:  { label: "Delayed",  bg: "rgba(245,158,11,0.12)", color: "#d97706" },
    landed:   { label: "Landed",   bg: "rgba(99,102,241,0.12)", color: "#6366f1" },
    unknown:  { label: "—",        bg: "rgba(156,163,175,0.12)",color: "#9ca3af" },
  };
  const cfg = map[status] || map.unknown;
  return (
    <span
      className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {cfg.label}
    </span>
  );
}

// ── Airport code extractor — grabs IATA-like uppercase 3-letter code if present ──
function extractCode(str = "") {
  const match = str.match(/\b([A-Z]{3})\b/);
  return match ? match[1] : str.split(",")[0].trim().slice(0, 4).toUpperCase();
}

// ── Non-flight travel icon ─────────────────────────────────────────────────────
function TravelIcon({ type }) {
  const cls = "h-4 w-4 text-muted-foreground";
  if (type === "Driving") return <Car className={cls} />;
  if (type === "Train")   return <Train className={cls} />;
  return <HelpCircle className={cls} />;
}

// ── Route bar (JFK ——✈—— MIA) ─────────────────────────────────────────────────
function RouteBar({ from, to, travelType }) {
  const fromCode = extractCode(from);
  const toCode   = to ? extractCode(to) : null;

  return (
    <div className="flex items-center gap-2 mt-1">
      {/* From */}
      <div className="flex flex-col items-start min-w-0">
        <span className="text-2xl font-bold tracking-tight leading-none text-foreground">{fromCode}</span>
        <span className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-[72px]">{from}</span>
      </div>

      {/* Line + icon */}
      <div className="flex-1 flex items-center gap-1 mx-1">
        <div className="flex-1 h-px bg-border" />
        {travelType === "Flight"  && <Plane className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
        {travelType === "Driving" && <Car   className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
        {travelType === "Train"   && <Train className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* To */}
      {toCode && (
        <div className="flex flex-col items-end min-w-0">
          <span className="text-2xl font-bold tracking-tight leading-none text-foreground">{toCode}</span>
          <span className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-[72px] text-right">{to}</span>
        </div>
      )}
    </div>
  );
}

// ── Main card ──────────────────────────────────────────────────────────────────
export default function TravelCard({ arrival, user, onEdit, onDelete, onClick }) {
  const isFlight     = arrival.travel_type === "Flight";
  const outboundFlight = arrival.outbound_flight_number || arrival.flight_number;
  const returnFlight   = arrival.return_flight_number;
  const isOwn          = arrival.user_email === user?.email;

  const { status: liveStatus, loading: liveLoading, inWindow } = useLiveFlightStatus(
    isFlight ? outboundFlight : null,
    arrival.arrival_date,
    arrival.arrival_time
  );

  const airlineName = arrival.airline || (outboundFlight ? guessAirline(outboundFlight) : null);

  // Arrival/departure display strings
  const arrivalDate = arrival.arrival_date
    ? format(new Date(arrival.arrival_date + "T00:00:00"), "EEE, MMM d")
    : null;
  const arrivalTime = arrival.arrival_time ? formatTime12Hour(arrival.arrival_time) : null;

  const departDate = arrival.is_round_trip && arrival.departure_date
    ? format(new Date(arrival.departure_date + "T00:00:00"), "EEE, MMM d")
    : null;
  const departTime = arrival.is_round_trip && arrival.departure_time
    ? formatTime12Hour(arrival.departure_time)
    : null;

  return (
    <div
      className="rounded-2xl border border-border bg-card cursor-pointer active:scale-[0.985] transition-transform overflow-hidden"
      style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.04), 0 0 0 0.5px rgba(0,0,0,0.04)" }}
      onClick={onClick}
    >
      {/* ── Header: member name + actions ── */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
            style={{ background: "linear-gradient(135deg, #C8A27C, #9A7A58)" }}
          >
            {(arrival.user_name || "?")[0].toUpperCase()}
          </div>
          <span className="text-sm font-semibold text-foreground leading-none">{arrival.user_name}</span>
          {!isFlight && (
            <span className="text-[10px] text-muted-foreground capitalize px-1.5 py-0.5 bg-muted rounded-full">
              {arrival.travel_type}
            </span>
          )}
        </div>
        {isOwn && (
          <div className="flex gap-0.5" onClick={(e) => e.stopPropagation()}>
            <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full" onClick={() => onEdit(arrival)}>
              <Pencil className="h-3 w-3 text-muted-foreground" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full" onClick={() => onDelete(arrival.id)}>
              <Trash2 className="h-3 w-3 text-muted-foreground" />
            </Button>
          </div>
        )}
      </div>

      {/* ── Outbound section ── */}
      <div className="px-4 pb-3">
        {/* Route bar */}
        {(arrival.arrival_location || arrival.destination) && (
          <RouteBar
            from={arrival.arrival_location || arrival.destination}
            to={arrival.destination && arrival.arrival_location ? arrival.destination : null}
            travelType={arrival.travel_type}
          />
        )}

        {/* Airline · flight# · time row */}
        <div className="flex items-center justify-between mt-2.5 gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            {isFlight && (
              <>
                {airlineName && (
                  <span className="text-[12px] text-foreground font-medium">{airlineName}</span>
                )}
                {outboundFlight && (
                  <>
                    {airlineName && <span className="text-muted-foreground text-[11px]">·</span>}
                    <span className="text-[12px] font-mono text-muted-foreground">{outboundFlight}</span>
                  </>
                )}
                {(airlineName || outboundFlight) && arrivalDate && (
                  <span className="text-muted-foreground text-[11px]">·</span>
                )}
              </>
            )}
            {arrivalDate && (
              <span className="text-[12px] text-muted-foreground">
                {arrivalDate}{arrivalTime ? ` · ${arrivalTime}` : ""}
              </span>
            )}
          </div>

          {/* Status pill (flight only) */}
          {isFlight && outboundFlight && (
            <StatusPill status={liveStatus} loading={liveLoading} inWindow={inWindow} />
          )}
        </div>

        {/* Tracking not yet available */}
        {isFlight && outboundFlight && !inWindow && !liveLoading && (
          <p className="text-[10px] text-muted-foreground mt-1">Tracking available 24h before departure</p>
        )}
      </div>

      {/* ── Return section (round trip) ── */}
      {arrival.is_round_trip && (departDate || returnFlight) && (
        <>
          <div className="mx-4 border-t border-border border-dashed" />
          <div className="px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Return</p>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                {returnFlight && (
                  <>
                    <span className="text-[12px] font-mono text-muted-foreground">{returnFlight}</span>
                    {departDate && <span className="text-muted-foreground text-[11px]">·</span>}
                  </>
                )}
                {departDate && (
                  <span className="text-[12px] text-muted-foreground">
                    {departDate}{departTime ? ` · ${departTime}` : ""}
                  </span>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}