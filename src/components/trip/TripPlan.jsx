import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { guessAirline } from "@/utils/airlines";
import TripMembersManager from "./TripMembersManager";
import TripPendingRequests from "./TripPendingRequests";
import FlightDetailModal from "./FlightDetailModal";
import TravelCard from "./TravelCard";
import BottomSheet from "../BottomSheet";

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

      <BottomSheet open={showAdd} onClose={closeDialog} title={`${editingId ? "Edit" : "Add"} Travel Info`}>
        <form onSubmit={addArrival} className="space-y-3">

          {/* Travel type */}
          <div>
            <Label className="text-xs font-medium mb-1 block" style={{ color: "#9A8A7A" }}>Travel Type</Label>
            <Select value={form.travel_type} onValueChange={(val) => setForm({ ...form, travel_type: val })}>
              <SelectTrigger className="h-9 text-sm" style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(200,162,124,0.2)" }}><SelectValue /></SelectTrigger>
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

          {/* Route — stacked vertically */}
          <div>
            <Label className="text-xs font-medium mb-1 block" style={{ color: "#9A8A7A" }}>From</Label>
            <Input value={form.arrival_location} onChange={(e) => setForm({ ...form, arrival_location: e.target.value })} placeholder="City or airport" className="h-9 text-sm w-full" style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(200,162,124,0.2)" }} />
          </div>
          <div>
            <Label className="text-xs font-medium mb-1 block" style={{ color: "#9A8A7A" }}>To</Label>
            <Input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} placeholder="Destination" className="h-9 text-sm w-full" style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(200,162,124,0.2)" }} />
          </div>

          {/* Flight details */}
          {form.travel_type === "Flight" && (
            <div className="bg-muted/40 p-3 rounded-xl space-y-3">
              <div>
                <Label className="text-xs font-medium mb-1 block" style={{ color: "#9A8A7A" }}>
                  Outbound Flight # <span className="font-normal" style={{ color: "#C0B0A0" }}>(e.g. DL1823)</span>
                </Label>
                <Input
                  value={form.outbound_flight_number}
                  onChange={(e) => handleFlightNumberChange("outbound_flight_number", e.target.value)}
                  placeholder="e.g. UA123"
                  className="h-9 text-sm font-mono w-full"
                  style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(200,162,124,0.2)" }}
                />
                <p className="text-[11px] mt-1 text-muted-foreground">Used for live tracking only</p>
              </div>

              {form.is_round_trip && (
                <div>
                  <Label className="text-xs font-medium mb-1 block" style={{ color: "#9A8A7A" }}>
                    Return Flight # <span className="font-normal" style={{ color: "#C0B0A0" }}>(e.g. UA456)</span>
                  </Label>
                  <Input
                    value={form.return_flight_number}
                    onChange={(e) => handleFlightNumberChange("return_flight_number", e.target.value)}
                    placeholder="e.g. UA456"
                    className="h-9 text-sm font-mono w-full"
                    style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(200,162,124,0.2)" }}
                  />
                </div>
              )}

              <div>
                <Label className="text-xs font-medium mb-1 block" style={{ color: "#9A8A7A" }}>Airline</Label>
                <Input
                  value={form.airline}
                  onChange={(e) => setForm({ ...form, airline: e.target.value })}
                  placeholder="Auto-filled or enter manually"
                  className="h-9 text-sm w-full"
                  style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(200,162,124,0.2)" }}
                />
              </div>
            </div>
          )}

          {/* Outbound arrival — stacked vertically */}
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: "#9A8A7A" }}>
              {form.is_round_trip ? "Outbound Arrival" : "Arrival"}
            </p>
            <div className="space-y-2">
              <div>
                <Label className="text-xs font-medium mb-1 block" style={{ color: "#9A8A7A" }}>Date</Label>
                <div style={{ width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.8)", border: "1px solid rgba(200,162,124,0.2)", borderRadius: "0.375rem", height: "36px", display: "flex", alignItems: "center", paddingLeft: "12px", paddingRight: "12px", overflow: "hidden" }}>
                  <input type="date" value={form.arrival_date} onChange={(e) => setForm({ ...form, arrival_date: e.target.value })} style={{ width: "100%", minWidth: 0, boxSizing: "border-box", background: "transparent", border: "none", outline: "none", fontSize: "14px", color: "hsl(var(--foreground))" }} />
                </div>
              </div>
              <div>
                <Label className="text-xs font-medium mb-1 block" style={{ color: "#9A8A7A" }}>Time</Label>
                <div style={{ width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.8)", border: "1px solid rgba(200,162,124,0.2)", borderRadius: "0.375rem", height: "36px", display: "flex", alignItems: "center", paddingLeft: "12px", paddingRight: "12px", overflow: "hidden" }}>
                  <input type="time" value={form.arrival_time} onChange={(e) => setForm({ ...form, arrival_time: e.target.value })} style={{ width: "100%", minWidth: 0, boxSizing: "border-box", background: "transparent", border: "none", outline: "none", fontSize: "14px", color: "hsl(var(--foreground))" }} />
                </div>
              </div>
            </div>
          </div>

          {/* Return dates — stacked vertically */}
          {form.is_round_trip && (
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: "#9A8A7A" }}>Return Departure</p>
              <div className="space-y-2">
                <div>
                  <Label className="text-xs font-medium mb-1 block" style={{ color: "#9A8A7A" }}>Date</Label>
                  <div style={{ width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.8)", border: "1px solid rgba(200,162,124,0.2)", borderRadius: "0.375rem", height: "36px", display: "flex", alignItems: "center", paddingLeft: "12px", paddingRight: "12px", overflow: "hidden" }}>
                    <input type="date" value={form.departure_date} onChange={(e) => setForm({ ...form, departure_date: e.target.value })} style={{ width: "100%", minWidth: 0, boxSizing: "border-box", background: "transparent", border: "none", outline: "none", fontSize: "14px", color: "hsl(var(--foreground))" }} />
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-medium mb-1 block" style={{ color: "#9A8A7A" }}>Time</Label>
                  <div style={{ width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.8)", border: "1px solid rgba(200,162,124,0.2)", borderRadius: "0.375rem", height: "36px", display: "flex", alignItems: "center", paddingLeft: "12px", paddingRight: "12px", overflow: "hidden" }}>
                    <input type="time" value={form.departure_time} onChange={(e) => setForm({ ...form, departure_time: e.target.value })} style={{ width: "100%", minWidth: 0, boxSizing: "border-box", background: "transparent", border: "none", outline: "none", fontSize: "14px", color: "hsl(var(--foreground))" }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          <button type="submit" className="w-full h-10 rounded-full text-sm font-semibold mt-1" style={{ background: "#C8A27C", color: "white" }}>
            {editingId ? "Update Travel" : "Save Travel"}
          </button>
        </form>
      </BottomSheet>
    </div>
  );
}