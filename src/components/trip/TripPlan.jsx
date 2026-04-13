import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plane, Clock, MapPin, Plus, Trash2, Car, Train, HelpCircle, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import TripMembersManager from "./TripMembersManager";
import TripPendingRequests from "./TripPendingRequests";
import FlightDetailModal from "./FlightDetailModal";

const EMPTY_FORM = {
  travel_type: "Flight",
  is_round_trip: false,
  arrival_location: "",
  destination: "",
  arrival_date: "",
  arrival_time: "",
  departure_date: "",
  departure_time: "",
  airline: "",
  outbound_flight_number: "",
  return_flight_number: "",
};

function parseAirlineCode(flightNum) {
  const match = flightNum?.trim().match(/^([A-Z]{2,3})\d/i);
  return match ? match[1].toUpperCase() : null;
}

const IATA_AIRLINES = {
  AA: "American Airlines", UA: "United Airlines", DL: "Delta Air Lines",
  WN: "Southwest Airlines", B6: "JetBlue", AS: "Alaska Airlines",
  F9: "Frontier Airlines", NK: "Spirit Airlines", G4: "Allegiant Air",
  BA: "British Airways", LH: "Lufthansa", AF: "Air France",
  KL: "KLM", EK: "Emirates", QR: "Qatar Airways", SQ: "Singapore Airlines",
  CX: "Cathay Pacific", JL: "Japan Airlines", NH: "ANA",
  AC: "Air Canada", WS: "WestJet", FR: "Ryanair", U2: "easyJet",
  VY: "Vueling", IB: "Iberia", AZ: "Alitalia", TK: "Turkish Airlines",
};

function guessAirline(flightNum) {
  const code = parseAirlineCode(flightNum);
  return code ? (IATA_AIRLINES[code] || null) : null;
}

export default function TripPlan({ trip, user, onUpdate }) {
  const isAdmin = trip?.admin_email === user?.email;
  const [arrivals, setArrivals] = useState([]);
  const [members, setMembers] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [detailArrival, setDetailArrival] = useState(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupStatus, setLookupStatus] = useState(null);
  const [returnLookingUp, setReturnLookingUp] = useState(false);
  const [returnLookupStatus, setReturnLookupStatus] = useState(null);
  const lookupTimer = useRef(null);
  const returnLookupTimer = useRef(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  useEffect(() => { loadData(); }, [trip.id]);

  // Re-run outbound lookup when arrival_date changes and flight number exists
  useEffect(() => {
    if (form.travel_type === "Flight" && form.outbound_flight_number?.length >= 4 && form.arrival_date) {
      doFlightLookup(form.outbound_flight_number, false, form.arrival_date);
    }
  }, [form.arrival_date]);

  // Re-run return lookup when departure_date changes and return flight number exists
  useEffect(() => {
    if (form.travel_type === "Flight" && form.is_round_trip && form.return_flight_number?.length >= 4 && form.departure_date) {
      doFlightLookup(form.return_flight_number, true, form.departure_date);
    }
  }, [form.departure_date]);

  async function loadData() {
    const allArrivals = await base44.entities.Arrival.filter({ trip_id: trip.id }, "-created_date", 50);
    setArrivals(allArrivals);
    const allUsers = await base44.entities.User.list("-created_date", 200);
    setMembers(allUsers.filter((u) => trip.member_emails?.includes(u.email)));
  }

  function normalizeFlightNum(v) {
    return v.replace(/\s+/g, "").toUpperCase();
  }

  function handleFlightNumberChange(field, value) {
    const upper = normalizeFlightNum(value);
    setForm((prev) => ({ ...prev, [field]: upper }));

    const isReturn = field === "return_flight_number";

    if (isReturn) {
      setReturnLookupStatus(null);
      if (returnLookupTimer.current) clearTimeout(returnLookupTimer.current);
      if (upper.length >= 4) {
        returnLookupTimer.current = setTimeout(() => doFlightLookup(upper, true, form.departure_date || null), 800);
      } else if (upper.length > 0) {
        const guessed = guessAirline(upper);
        if (guessed) setForm((prev) => ({ ...prev, airline: prev.airline || guessed }));
      }
    } else {
      setLookupStatus(null);
      if (lookupTimer.current) clearTimeout(lookupTimer.current);
      if (upper.length >= 4) {
        lookupTimer.current = setTimeout(() => doFlightLookup(upper, false, form.arrival_date || null), 800);
      } else if (upper.length > 0) {
        const guessed = guessAirline(upper);
        if (guessed) setForm((prev) => ({ ...prev, airline: prev.airline || guessed }));
      }
    }
  }

  async function doFlightLookup(flightNum, isReturn = false, date = null) {
    if (isReturn) setReturnLookingUp(true);
    else setLookingUp(true);

    try {
      const res = await base44.functions.invoke('lookupFlight', { flight_number: flightNum, date: date || null });
      const data = res.data;

      if (data?.found) {
        if (isReturn) {
          setForm((prev) => ({
            ...prev,
            airline: prev.airline || data.airline || prev.airline,
            departure_time: data.scheduled_departure_time || prev.departure_time,
          }));
          setReturnLookupStatus(data.ambiguous ? 'ambiguous' : 'found');
        } else {
          const routeConfident = data.confidence === 'high' && !data.ambiguous;
          setForm((prev) => ({
            ...prev,
            airline: data.airline || prev.airline,
            arrival_location: routeConfident ? (data.departure_airport || prev.arrival_location) : prev.arrival_location,
            destination: routeConfident ? (data.arrival_airport || prev.destination) : prev.destination,
            arrival_time: routeConfident ? (data.scheduled_arrival_time || prev.arrival_time) : prev.arrival_time,
          }));
          setLookupStatus(routeConfident ? 'found' : 'ambiguous');
        }
      } else if (data?.ambiguous) {
        if (isReturn) setReturnLookupStatus('ambiguous');
        else setLookupStatus('ambiguous');
      } else {
        if (isReturn) setReturnLookupStatus('not_found');
        else setLookupStatus('not_found');
      }
    } catch {
      if (isReturn) setReturnLookupStatus('not_found');
      else setLookupStatus('not_found');
    }

    if (isReturn) setReturnLookingUp(false);
    else setLookingUp(false);
  }

  async function addArrival(e) {
    e.preventDefault();
    const payload = { ...form };
    if (editingId) {
      await base44.entities.Arrival.update(editingId, payload);
      setEditingId(null);
    } else {
      await base44.entities.Arrival.create({
        ...payload,
        trip_id: trip.id,
        user_email: user.email,
        user_name: user.full_name,
      });
    }
    setForm({ ...EMPTY_FORM });
    setShowAdd(false);
    loadData();
  }

  function editArrival(arrival) {
    setForm({
      travel_type: arrival.travel_type || "Flight",
      is_round_trip: arrival.is_round_trip || false,
      arrival_location: arrival.arrival_location || "",
      destination: arrival.destination || "",
      arrival_date: arrival.arrival_date || "",
      arrival_time: arrival.arrival_time || "",
      departure_date: arrival.departure_date || "",
      departure_time: arrival.departure_time || "",
      airline: arrival.airline || "",
      outbound_flight_number: arrival.outbound_flight_number || arrival.flight_number || "",
      return_flight_number: arrival.return_flight_number || "",
    });
    setEditingId(arrival.id);
    setShowAdd(true);
  }

  async function deleteArrival(id) {
    await base44.entities.Arrival.delete(id);
    loadData();
  }

  function getTravelIcon(type) {
    switch (type) {
      case "Flight": return <Plane className="h-3 w-3" />;
      case "Driving": return <Car className="h-3 w-3" />;
      case "Train": return <Train className="h-3 w-3" />;
      default: return <HelpCircle className="h-3 w-3" />;
    }
  }

  function formatRoute(a) {
    if (!a.arrival_location && !a.destination) return null;
    const from = a.arrival_location || "?";
    const to = a.destination;
    return to ? `${from} → ${to}` : from;
  }

  function formatTime(timeStr) {
    if (!timeStr) return null;
    const [hStr, mStr] = timeStr.split(":");
    const h = parseInt(hStr, 10);
    const m = mStr || "00";
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  }

  function closeDialog() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setShowAdd(false);
    setLookupStatus(null);
    setLookingUp(false);
    setReturnLookupStatus(null);
    setReturnLookingUp(false);
    if (lookupTimer.current) clearTimeout(lookupTimer.current);
    if (returnLookupTimer.current) clearTimeout(returnLookupTimer.current);
  }

  return (
    <div className="pb-24">
      {isAdmin && <TripPendingRequests trip={trip} isAdmin={isAdmin} onUpdate={onUpdate} />}
      <div className="mb-6">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <span style={{fontSize:'0.85em', opacity:0.75}}>✦</span> arrivals & departures
        </h3>
        <Button variant="outline" size="sm" className="rounded-full mb-3" onClick={() => setShowAdd(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add Your Travel
        </Button>

        {arrivals.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">Add your flight or travel details</p>
        ) : (
          <div className="space-y-3">
            {arrivals.map((a) => {
              const outboundFlight = a.outbound_flight_number || a.flight_number;
              const returnFlight = a.return_flight_number;
              return (
                <div
                  key={a.id}
                  className="bg-card rounded-xl border border-border p-4 cursor-pointer active:scale-[0.98] transition-transform"
                  onClick={() => setDetailArrival(a)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-sm">{a.user_name}</p>
                    {a.user_email === user?.email && (
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => editArrival(a)}>
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => deleteArrival(a.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    {a.travel_type === "Flight" ? (
                      <>
                        {(a.airline || outboundFlight) && (
                          <div className="flex items-center gap-2">
                            <Plane className="h-3 w-3 shrink-0" />
                            <span>
                              {a.airline}
                              {a.airline && outboundFlight ? " · " : ""}
                              {outboundFlight && <span className="font-mono">{outboundFlight}</span>}
                              {a.is_round_trip && returnFlight && (
                                <span className="text-muted-foreground"> / return: <span className="font-mono">{returnFlight}</span></span>
                              )}
                            </span>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        {getTravelIcon(a.travel_type)}
                        <span className="capitalize">{a.travel_type}</span>
                      </div>
                    )}
                    {formatRoute(a) && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span>{formatRoute(a)}</span>
                      </div>
                    )}
                    {a.arrival_date && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 shrink-0" />
                        <span>Arrives {format(new Date(a.arrival_date + "T00:00:00"), "MMM d")}{a.arrival_time ? ` at ${formatTime(a.arrival_time)}` : ""}</span>
                      </div>
                    )}
                    {a.is_round_trip && a.departure_date && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 shrink-0" />
                        <span>Returns {format(new Date(a.departure_date + "T00:00:00"), "MMM d")}{a.departure_time ? ` at ${formatTime(a.departure_time)}` : ""}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <TripMembersManager trip={trip} user={user} isAdmin={isAdmin} onMembersUpdate={loadData} />

      <FlightDetailModal
        arrival={detailArrival}
        open={!!detailArrival}
        onClose={() => setDetailArrival(null)}
      />

      <Dialog open={showAdd} onOpenChange={(open) => { if (!open) closeDialog(); else setShowAdd(true); }}>
        <DialogContent className="mx-4 rounded-2xl max-w-md p-5 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">{editingId ? "Edit" : "Add"} Travel Info</DialogTitle>
          </DialogHeader>
          <form onSubmit={addArrival} className="space-y-3 mt-1">

            {/* Travel type */}
            <div>
              <Label className="text-xs font-medium mb-1 block">Travel Type</Label>
              <Select value={form.travel_type} onValueChange={(val) => setForm({ ...form, travel_type: val })}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Flight">✈️ Flight</SelectItem>
                  <SelectItem value="Driving">🚗 Driving</SelectItem>
                  <SelectItem value="Train">🚂 Train</SelectItem>
                  <SelectItem value="Other">📋 Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Round trip toggle (flights only) */}
            {form.travel_type === "Flight" && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, is_round_trip: !prev.is_round_trip }))}
                  className={`relative w-10 h-5 rounded-full transition-colors ${form.is_round_trip ? "bg-primary" : "bg-muted"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.is_round_trip ? "translate-x-5" : ""}`} />
                </button>
                <Label className="text-xs font-medium cursor-pointer" onClick={() => setForm((prev) => ({ ...prev, is_round_trip: !prev.is_round_trip }))}>
                  Round Trip
                </Label>
              </div>
            )}

            {/* Route */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <Label className="text-xs font-medium mb-1 block">From</Label>
                <Input value={form.arrival_location} onChange={(e) => setForm({ ...form, arrival_location: e.target.value })} placeholder="City or airport" className="h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs font-medium mb-1 block">To</Label>
                <Input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} placeholder="Destination" className="h-9 text-sm" />
              </div>
            </div>

            {/* Flight details */}
            {form.travel_type === "Flight" && (
              <div className="bg-muted/40 p-3 rounded-lg space-y-2.5">
                <div>
                  <Label className="text-xs font-medium mb-1 block">
                    Outbound Flight # <span className="text-muted-foreground font-normal">(e.g. DL1823 or DL 1823)</span>
                  </Label>
                  <div className="relative">
                    <Input
                      value={form.outbound_flight_number}
                      onChange={(e) => handleFlightNumberChange("outbound_flight_number", e.target.value)}
                      placeholder="e.g. UA123"
                      className="h-9 text-sm font-mono pr-8"
                    />
                    {lookingUp && (
                      <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  {lookupStatus === 'found' && (
                    <p className="text-[11px] mt-1 font-medium" style={{ color: "#3A7A5A" }}>
                      ✓ Route auto-filled{form.arrival_location && form.destination ? `: ${form.arrival_location} → ${form.destination}` : ""}
                    </p>
                  )}
                  {lookupStatus === 'ambiguous' && (
                    <p className="text-[11px] mt-1 font-medium" style={{ color: "#C87C2A" }}>Multiple flights found — add date for accuracy</p>
                  )}
                  {lookupStatus === 'not_found' && (
                    <p className="text-[11px] text-destructive mt-1">Flight not found — enter details manually</p>
                  )}
                </div>

                {form.is_round_trip && (
                  <div>
                    <Label className="text-xs font-medium mb-1 block">
                      Return Flight # <span className="text-muted-foreground font-normal">(e.g. UA456)</span>
                    </Label>
                    <div className="relative">
                      <Input
                        value={form.return_flight_number}
                        onChange={(e) => handleFlightNumberChange("return_flight_number", e.target.value)}
                        placeholder="e.g. UA456"
                        className="h-9 text-sm font-mono pr-8"
                      />
                      {returnLookingUp && (
                        <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                    </div>
                    {returnLookupStatus === 'found' && (
                      <p className="text-[11px] mt-1 font-medium" style={{ color: "#3A7A5A" }}>✓ Return flight details auto-filled</p>
                    )}
                    {returnLookupStatus === 'ambiguous' && (
                      <p className="text-[11px] mt-1 font-medium" style={{ color: "#C87C2A" }}>Multiple flights found — add date for accuracy</p>
                    )}
                    {returnLookupStatus === 'not_found' && (
                      <p className="text-[11px] text-destructive mt-1">Flight not found — enter details manually</p>
                    )}
                  </div>
                )}

                <div>
                  <Label className="text-xs font-medium mb-1 block">Airline</Label>
                  <Input
                    value={form.airline}
                    onChange={(e) => setForm({ ...form, airline: e.target.value })}
                    placeholder="Auto-filled or enter manually"
                    className="h-9 text-sm"
                  />
                </div>
              </div>
            )}

            {/* Outbound dates */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1.5">
                {form.is_round_trip ? "Outbound Arrival" : "Arrival"}
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <Label className="text-xs font-medium mb-1 block">Date</Label>
                  <Input type="date" value={form.arrival_date} onChange={(e) => setForm({ ...form, arrival_date: e.target.value })} className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs font-medium mb-1 block">Time</Label>
                  <Input type="time" value={form.arrival_time} onChange={(e) => setForm({ ...form, arrival_time: e.target.value })} className="h-9 text-sm" />
                </div>
              </div>
            </div>

            {/* Return dates (round trip only) */}
            {form.is_round_trip && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1.5">Return Departure</p>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <Label className="text-xs font-medium mb-1 block">Date</Label>
                    <Input type="date" value={form.departure_date} onChange={(e) => setForm({ ...form, departure_date: e.target.value })} className="h-9 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs font-medium mb-1 block">Time</Label>
                    <Input type="time" value={form.departure_time} onChange={(e) => setForm({ ...form, departure_time: e.target.value })} className="h-9 text-sm" />
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button type="submit" className="flex-1 rounded-full h-9 text-sm" style={{ background: "#C8A27C", color: "white" }}>
                {editingId ? "Update" : "Save"}
              </Button>
              <Button type="button" variant="outline" className="flex-1 rounded-full h-9 text-sm" onClick={closeDialog}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}