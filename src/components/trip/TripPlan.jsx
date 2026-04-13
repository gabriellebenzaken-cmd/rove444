import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { guessAirline } from "@/utils/airlines";
import TripMembersManager from "./TripMembersManager";
import TripPendingRequests from "./TripPendingRequests";
import FlightDetailModal from "./FlightDetailModal";
import TravelCard from "./TravelCard";

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



export default function TripPlan({ trip, user, onUpdate }) {
  const isAdmin = trip?.admin_email === user?.email;
  const [arrivals, setArrivals] = useState([]);
  const [members, setMembers] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [detailArrival, setDetailArrival] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  useEffect(() => { loadData(); }, [trip.id]);

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



  function closeDialog() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setShowAdd(false);
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
            {arrivals.map((a) => (
              <TravelCard
                key={a.id}
                arrival={a}
                user={user}
                onEdit={editArrival}
                onDelete={deleteArrival}
                onClick={() => setDetailArrival(a)}
              />
            ))}
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
                  <Input
                    value={form.outbound_flight_number}
                    onChange={(e) => handleFlightNumberChange("outbound_flight_number", e.target.value)}
                    placeholder="e.g. UA123"
                    className="h-9 text-sm font-mono"
                  />
                  <p className="text-[11px] mt-1 text-muted-foreground">Used for live tracking only — does not auto-fill route</p>
                </div>

                {form.is_round_trip && (
                  <div>
                    <Label className="text-xs font-medium mb-1 block">
                      Return Flight # <span className="text-muted-foreground font-normal">(e.g. UA456)</span>
                    </Label>
                    <Input
                      value={form.return_flight_number}
                      onChange={(e) => handleFlightNumberChange("return_flight_number", e.target.value)}
                      placeholder="e.g. UA456"
                      className="h-9 text-sm font-mono"
                    />
                    <p className="text-[11px] mt-1 text-muted-foreground">Used for live tracking only</p>
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