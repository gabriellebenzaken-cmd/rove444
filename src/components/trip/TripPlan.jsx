import { useState, useEffect } from "react";
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plane, Clock, MapPin, Plus, Trash2 } from "lucide-react";
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
  const [form, setForm] = useState({
    arrival_date: "",
    arrival_time: "",
    arrival_location: "",
    departure_date: "",
    departure_time: "",
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
    await base44.entities.Arrival.create({
      ...form,
      trip_id: trip.id,
      user_email: user.email,
      user_name: user.full_name,
    });
    setForm({ arrival_date: "", arrival_time: "", arrival_location: "", departure_date: "", departure_time: "" });
    setShowAdd(false);
    loadData();
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
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => deleteArrival(a.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {a.arrival_date && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Plane className="h-3 w-3" />
                      <span>Arrives {format(new Date(a.arrival_date), "MMM d")} {a.arrival_time}</span>
                    </div>
                  )}
                  {a.arrival_location && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{a.arrival_location}</span>
                    </div>
                  )}
                  {a.departure_date && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>Departs {format(new Date(a.departure_date), "MMM d")} {a.departure_time}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <TripMembersManager trip={trip} user={user} isAdmin={isAdmin} onMembersUpdate={loadData} />

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="mx-4 rounded-2xl max-w-md p-5">
          <DialogHeader>
            <DialogTitle className="text-base">My Travel Info</DialogTitle>
          </DialogHeader>
          <form onSubmit={addArrival} className="space-y-3 mt-1">
            <div>
              <Label className="text-xs font-medium mb-1 block">Arriving from</Label>
              <Input value={form.arrival_location} onChange={(e) => setForm({ ...form, arrival_location: e.target.value })} placeholder="Airport or city" className="h-9 text-sm" />
            </div>
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
            <Button type="submit" className="w-full rounded-full h-9 text-sm" style={{ background: "#C8A27C", color: "white" }}>Save</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}