import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Home, Plus, Trash2, DollarSign, Calendar } from "lucide-react";
import BottomSheet from "../BottomSheet";
import { format } from "date-fns";

export default function TripStay({ trip, user }) {
  const [lodgings, setLodgings] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    name: "",
    address: "",
    price_per_night: "",
    check_in: "",
    check_out: "",
    notes: "",
  });

  useEffect(() => {
    loadData();
  }, [trip.id]);

  async function loadData() {
    const all = await base44.entities.Lodging.filter({ trip_id: trip.id }, "-created_date", 50);
    setLodgings(all);
  }

  async function addLodging(e) {
    e.preventDefault();
    if (!form.name) return;
    await base44.entities.Lodging.create({
      ...form,
      price_per_night: form.price_per_night ? parseFloat(form.price_per_night) : undefined,
      trip_id: trip.id,
      guest_emails: [user.email],
    });
    setForm({ name: "", address: "", price_per_night: "", check_in: "", check_out: "", notes: "" });
    setShowAdd(false);
    loadData();
  }

  async function deleteLodging(id) {
    await base44.entities.Lodging.delete(id);
    loadData();
  }

  return (
    <div className="pb-24">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Home className="h-4 w-4" /> Lodging
        </h3>
        <Button variant="outline" size="sm" className="rounded-full" onClick={() => setShowAdd(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add
        </Button>
      </div>

      {lodgings.length === 0 ? (
        <p className="text-xs text-muted-foreground py-8 text-center">No lodging added yet</p>
      ) : (
        <div className="space-y-3">
          {lodgings.map((l) => (
            <div key={l.id} className="bg-card rounded-2xl border border-border p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-semibold text-sm">{l.name}</h4>
                  {l.address && <p className="text-xs text-muted-foreground">{l.address}</p>}
                </div>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteLodging(l.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                {l.price_per_night && (
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" /> ${l.price_per_night}/night
                  </span>
                )}
                {l.check_in && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {format(new Date(l.check_in), "MMM d")}
                    {l.check_out && ` – ${format(new Date(l.check_out), "MMM d")}`}
                  </span>
                )}
              </div>
              {l.notes && <p className="text-xs mt-2 text-muted-foreground">{l.notes}</p>}
            </div>
          ))}
        </div>
      )}

      <BottomSheet open={showAdd} onClose={() => setShowAdd(false)} title="Add Lodging">
        <form onSubmit={addLodging} className="space-y-3">
            <div>
              <Label className="text-xs font-medium mb-1 block" style={{ color: "#9A8A7A" }}>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Hotel name or Airbnb" className="h-9 text-sm" style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(200,162,124,0.2)" }} />
            </div>
            <div>
              <Label className="text-xs font-medium mb-1 block" style={{ color: "#9A8A7A" }}>Address <span style={{color:'#C0B0A0',fontWeight:400}}>(optional)</span></Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Address" className="h-9 text-sm" style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(200,162,124,0.2)" }} />
            </div>
            <div style={{ display: 'flex', gap: 12, width: '100%' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Label className="text-xs font-medium mb-1 block" style={{ color: "#9A8A7A" }}>Check-in</Label>
                <Input type="date" value={form.check_in} onChange={(e) => setForm({ ...form, check_in: e.target.value })} className="h-9 text-sm w-full" style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(200,162,124,0.2)" }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Label className="text-xs font-medium mb-1 block" style={{ color: "#9A8A7A" }}>Check-out</Label>
                <Input type="date" value={form.check_out} onChange={(e) => setForm({ ...form, check_out: e.target.value })} className="h-9 text-sm w-full" style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(200,162,124,0.2)" }} />
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium mb-1 block" style={{ color: "#9A8A7A" }}>$/Night <span style={{color:'#C0B0A0',fontWeight:400}}>(optional)</span></Label>
              <Input type="number" value={form.price_per_night} onChange={(e) => setForm({ ...form, price_per_night: e.target.value })} placeholder="0" className="h-9 text-sm" style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(200,162,124,0.2)" }} />
            </div>
            <div>
              <Label className="text-xs font-medium mb-1 block" style={{ color: "#9A8A7A" }}>Notes <span style={{color:'#C0B0A0',fontWeight:400}}>(optional)</span></Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Check-in code, parking info..." className="text-sm" rows={2} style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(200,162,124,0.2)" }} />
            </div>
            <button type="submit" className="w-full h-10 rounded-full text-sm font-semibold mt-1" style={{ background: "#C8A27C", color: "white" }}>Add Lodging</button>
          </form>
      </BottomSheet>
    </div>
  );
}