import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plane, Clock, MapPin, Plus, Trash2, Car, Train, HelpCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import TripMembersManager from "./TripMembersManager";
import TripPendingRequests from "./TripPendingRequests";

export default function TripPlan({ trip, user, onUpdate }) {
  const isAdmin = trip?.admin_email === user?.email;
  const isMember = user && (trip?.member_emails?.includes(user.email) || isAdmin);
  const [arrivals, setArrivals] = useState([]);
  const [members, setMembers] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    travel_type: "Flight",
    arrival_location: "",
    destination: "",
    arrival_date: "",
    arrival_time: "",
    departure_date: "",
    departure_time: "",
    airline: "",
    flight_number: "",
  });

  useEffect(() => {
    loadData();
  }, [trip.id]);

  async function loadData() {
    const allArrivals = await base44.entities.Arrival.filter({ trip_id: trip.id }, "-created_date", 50);
    setArrivals(allArrivals);
    const allUsers = await base44.entities.User.list("-created_date", 200);
    setMembers(allUsers.filter((u) => trip.member_emails?.includes(u.email)));
  }

  async function addArrival(e) {
    e.preventDefault();
    if (editingId) {
      await base44.entities.Arrival.update(editingId, form);
      setEditingId(null);
    } else {
      await base44.entities.Arrival.create({
        ...form,
        trip_id: trip.id,
        user_email: user.email,
        user_name: user.full_name,
      });
    }
    setForm({ travel_type: "Flight", arrival_date: "", arrival_time: "", arrival_location: "", destination: "", airline: "", flight_number: "", departure_date: "", departure_time: "" });
    setShowAdd(false);
    loadData();
  }

  function editArrival(arrival) {
    setForm({
      travel_type: arrival.travel_type || "Flight",
      arrival_location: arrival.arrival_location || "",
      destination: arrival.destination || "",
      arrival_date: arrival.arrival_date || "",
      arrival_time: arrival.arrival_time || "",
      departure_date: arrival.departure_date || "",
      departure_time: arrival.departure_time || "",
      airline: arrival.airline || "",
      flight_number: arrival.flight_number || "",
    });
    setEditingId(arrival.id);
    setShowAdd(true);
  }

  function isAirportCode(str) {
    return /^[A-Z]{3}$/.test(str);
  }

  function formatRoute(arrival) {
    if (!arrival.arrival_location && !arrival.destination) return null;
    const from = arrival.arrival_location ? (isAirportCode(arrival.arrival_location) ? arrival.arrival_location : arrival.arrival_location) : "?";
    const to = arrival.destination ? (isAirportCode(arrival.destination) ? arrival.destination : arrival.destination) : null;
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

  async function deleteArrival(id) {
    await base44.entities.Arrival.delete(id);
    loadData();
  }

  return (
    <div className="pb-24">
      {isAdmin && <TripPendingRequests trip={trip} isAdmin={isAdmin} onUpdate={onUpdate} />}
      <div className="mb-6">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Plane className="h-4 w-4" /> Arrivals & Departures
        </h3>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full mb-3"
          onClick={() => setShowAdd(true)}
        >
          <Plus className="h-3.5 w-3.5 mr-1" /> Add Your Travel
        </Button>

        {arrivals.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">No travel info added yet</p>
        ) : (
          <div className="space-y-3">
            {arrivals.map((a) => (
              <div key={a.id} className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center justify-between mb-2">
                   <p className="font-medium text-sm">{a.user_name || a.user_email?.split("@")[0]}</p>
                   {a.user_email === user?.email && (
                     <div className="flex gap-1">
                       <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => editArrival(a)}>
                         <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                       </Button>
                       <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => deleteArrival(a.id)}>
                         <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                       </Button>
                     </div>
                   )}
                 </div>
                <div className="space-y-2 text-xs text-muted-foreground">
                   {a.travel_type === "Flight" && (a.airline || a.flight_number) && (
                     <div className="flex items-center gap-2">
                       <Plane className="h-3 w-3" />
                       <span>{a.airline}{a.airline && a.flight_number ? " " : ""}{a.flight_number}</span>
                     </div>
                   )}
                   {a.travel_type !== "Flight" && (
                     <div className="flex items-center gap-2">
                       {getTravelIcon(a.travel_type)}
                       <span className="capitalize">{a.travel_type}</span>
                     </div>
                   )}
                   {formatRoute(a) && (
                     <div className="flex items-center gap-2">
                       <MapPin className="h-3 w-3" />
                       <span>{formatRoute(a)}</span>
                     </div>
                   )}
                   {a.arrival_date && (
                     <div className="flex items-center gap-2">
                       <Clock className="h-3 w-3" />
                       <span>Arrives {format(new Date(a.arrival_date), "MMM d, h:mm a")}</span>
                     </div>
                   )}
                   {a.departure_date && (
                     <div className="flex items-center gap-2">
                       <Clock className="h-3 w-3" />
                       <span>Departs {format(new Date(a.departure_date), "MMM d, h:mm a")}</span>
                     </div>
                   )}
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <TripMembersManager trip={trip} user={user} isAdmin={isAdmin} onMembersUpdate={loadData} />

      <Dialog open={showAdd} onOpenChange={(open) => {
        if (!open) {
          setEditingId(null);
          setForm({ travel_type: "Flight", arrival_date: "", arrival_time: "", arrival_location: "", destination: "", airline: "", flight_number: "", departure_date: "", departure_time: "" });
        }
        setShowAdd(open);
      }}>
        <DialogContent className="mx-4 rounded-2xl max-w-md p-5">
          <DialogHeader>
            <DialogTitle className="text-base">{editingId ? "Edit" : "Add"} Travel Info</DialogTitle>
          </DialogHeader>
          <form onSubmit={addArrival} className="space-y-3 mt-1">
            <div>
              <Label className="text-xs font-medium mb-1 block">Travel Type</Label>
              <Select value={form.travel_type} onValueChange={(val) => setForm({ ...form, travel_type: val })}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Flight">✈️ Flight</SelectItem>
                  <SelectItem value="Driving">🚗 Driving</SelectItem>
                  <SelectItem value="Train">🚂 Train</SelectItem>
                  <SelectItem value="Other">📋 Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
            {form.travel_type === "Flight" && (
              <div className="grid grid-cols-2 gap-2.5 bg-muted/40 p-3 rounded-lg">
                <div>
                  <Label className="text-xs font-medium mb-1 block">Airline</Label>
                  <Input value={form.airline} onChange={(e) => setForm({ ...form, airline: e.target.value })} placeholder="e.g. United" className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs font-medium mb-1 block">Flight # (optional)</Label>
                  <Input value={form.flight_number} onChange={(e) => setForm({ ...form, flight_number: e.target.value })} placeholder="e.g. UA123" className="h-9 text-sm" />
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <Label className="text-xs font-medium mb-1 block">Arrival date</Label>
                <Input type="date" value={form.arrival_date} onChange={(e) => setForm({ ...form, arrival_date: e.target.value })} className="h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs font-medium mb-1 block">Arrival time</Label>
                <Input type="time" value={form.arrival_time} onChange={(e) => setForm({ ...form, arrival_time: e.target.value })} className="h-9 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <Label className="text-xs font-medium mb-1 block">Departure date</Label>
                <Input type="date" value={form.departure_date} onChange={(e) => setForm({ ...form, departure_date: e.target.value })} className="h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs font-medium mb-1 block">Departure time</Label>
                <Input type="time" value={form.departure_time} onChange={(e) => setForm({ ...form, departure_time: e.target.value })} className="h-9 text-sm" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1 rounded-full h-9 text-sm" style={{ background: "#C8A27C", color: "white" }}>{editingId ? "Update" : "Save"}</Button>
              <Button type="button" variant="outline" className="flex-1 rounded-full h-9 text-sm" onClick={() => { setEditingId(null); setShowAdd(false); setForm({ arrival_date: "", arrival_time: "", arrival_location: "", destination: "", airline: "", flight_number: "", departure_date: "", departure_time: "" }); }}>Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}