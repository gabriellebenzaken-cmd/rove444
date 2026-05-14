import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Home, Plus, Trash2, DollarSign, Calendar, ExternalLink, Edit2, Upload, X } from "lucide-react";
import BottomSheet from "../BottomSheet";
import { format } from "date-fns";

const EMPTY_FORM = {
  name: "",
  address: "",
  price_per_night: "",
  check_in: "",
  check_out: "",
  notes: "",
  booking_url: "",
  image_url: "",
};

const extractMetadata = async (url) => {
  try {
    const res = await base44.functions.invoke('extractLodgingMetadata', { booking_url: url });
    return res.data?.metadata || {};
  } catch {
    return {};
  }
};

export default function TripStay({ trip, user }) {
  const [lodgings, setLodgings] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [extracting, setExtracting] = useState(false);

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
    
    if (editingId) {
      await base44.entities.Lodging.update(editingId, {
        ...form,
        price_per_night: form.price_per_night ? parseFloat(form.price_per_night) : undefined,
      });
      setEditingId(null);
    } else {
      await base44.entities.Lodging.create({
        ...form,
        price_per_night: form.price_per_night ? parseFloat(form.price_per_night) : undefined,
        trip_id: trip.id,
        guest_emails: [user.email],
      });
    }
    setForm(EMPTY_FORM);
    setShowAdd(false);
    loadData();
  }

  function openEdit(lodging) {
    setEditingId(lodging.id);
    setForm({
      name: lodging.name || "",
      address: lodging.address || "",
      price_per_night: lodging.price_per_night ? String(lodging.price_per_night) : "",
      check_in: lodging.check_in || "",
      check_out: lodging.check_out || "",
      notes: lodging.notes || "",
      booking_url: lodging.booking_url || "",
      image_url: lodging.image_url || "",
    });
    setShowAdd(true);
  }

  function closeModal() {
    setShowAdd(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleBookingUrlChange(url) {
    setForm({ ...form, booking_url: url });
    if (url && url.trim()) {
      setExtracting(true);
      const metadata = await extractMetadata(url);
      setExtracting(false);
      if (metadata.title) {
        setForm(f => ({ ...f, name: f.name || metadata.title }));
      }
      if (metadata.address) {
        setForm(f => ({ ...f, address: f.address || metadata.address }));
      }
      if (metadata.image_url) {
        setForm(f => ({ ...f, image_url: f.image_url || metadata.image_url }));
      }
    }
  }

  async function handlePhotoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      setForm({ ...form, image_url: res.file_url });
    } catch (err) {
      console.error('Photo upload failed:', err);
    }
  }

  async function deleteLodging(id) {
    await base44.entities.Lodging.delete(id);
    loadData();
  }

  return (
    <div className="pb-24">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <span style={{fontSize:'0.85em', opacity:0.75}}>✦</span> lodging
        </h3>
        <Button variant="outline" size="sm" className="rounded-full" onClick={() => setShowAdd(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add
        </Button>
      </div>

      {lodgings.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-xs text-muted-foreground"><span style={{fontSize:'0.85em'}}>✦</span> no lodging added yet</p>
          <p className="text-xs mt-1" style={{color:'#C8A27C', cursor:'pointer'}} onClick={() => setShowAdd(true)}>Add your stay →</p>
        </div>
      ) : (
        <div className="space-y-3">
          {lodgings.map((l) => (
            <div key={l.id} className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="flex gap-3 p-4">
                {/* Image */}
                {l.image_url && (
                  <div className="w-28 h-28 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                    <img src={l.image_url} alt={l.name} className="w-full h-full object-cover" />
                  </div>
                )}
                {/* Content */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <h4 className="font-semibold text-sm leading-snug">{l.name}</h4>
                    {l.address && <p className="text-xs text-muted-foreground mt-1">{l.address}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-2">
                    {l.price_per_night && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" /> ${l.price_per_night}/night
                      </span>
                    )}
                    {l.check_in && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {format(new Date(l.check_in), "MMM d")}
                        {l.check_out && `–${format(new Date(l.check_out), "MMM d")}`}
                      </span>
                    )}
                  </div>
                </div>
                {/* Actions */}
                <div className="flex flex-col gap-2 items-end justify-between">
                  {l.booking_url && (
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => window.open(l.booking_url, '_blank')}>
                      <ExternalLink className="h-3.5 w-3.5" style={{color:'#C8A27C'}} />
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(l)}>
                    <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteLodging(l.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </div>
              </div>
              {l.notes && <p className="text-xs px-4 pb-3 text-muted-foreground">{l.notes}</p>}
            </div>
          ))}
        </div>
      )}

      <BottomSheet open={showAdd} onClose={closeModal} title={editingId ? "Edit Lodging" : "Add Lodging"}>
        <form onSubmit={addLodging} className="space-y-3">
          <div>
            <Label className="text-xs font-medium mb-1 block" style={{ color: "#9A8A7A" }}>Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Hotel name or Airbnb" className="h-9 text-sm" style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(200,162,124,0.2)" }} />
          </div>
          <div>
            <Label className="text-xs font-medium mb-1 block" style={{ color: "#9A8A7A" }}>Address <span style={{color:'#C0B0A0',fontWeight:400}}>(optional)</span></Label>
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Address" className="h-9 text-sm" style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(200,162,124,0.2)" }} />
          </div>
          <div className="form-row">
            <div className="form-field">
              <Label className="text-xs font-medium mb-1 block" style={{ color: "#9A8A7A" }}>Check-in</Label>
              <input type="date" value={form.check_in} onChange={(e) => setForm({ ...form, check_in: e.target.value })} className="h-9 w-full rounded-md px-3 text-sm" style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(200,162,124,0.2)", color: "hsl(var(--foreground))" }} />
            </div>
            <div className="form-field">
              <Label className="text-xs font-medium mb-1 block" style={{ color: "#9A8A7A" }}>Check-out</Label>
              <input type="date" value={form.check_out} onChange={(e) => setForm({ ...form, check_out: e.target.value })} className="h-9 w-full rounded-md px-3 text-sm" style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(200,162,124,0.2)", color: "hsl(var(--foreground))" }} />
            </div>
          </div>
          <div>
            <Label className="text-xs font-medium mb-1 block" style={{ color: "#9A8A7A" }}>$/Night <span style={{color:'#C0B0A0',fontWeight:400}}>(optional)</span></Label>
            <Input type="number" value={form.price_per_night} onChange={(e) => setForm({ ...form, price_per_night: e.target.value })} placeholder="0" className="h-9 text-sm" style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(200,162,124,0.2)" }} />
          </div>
          <div>
            <Label className="text-xs font-medium mb-1 block" style={{ color: "#9A8A7A" }}>Booking Link <span style={{color:'#C0B0A0',fontWeight:400}}>(optional)</span></Label>
            <Input 
              value={form.booking_url} 
              onChange={(e) => handleBookingUrlChange(e.target.value)} 
              placeholder="https://airbnb.com/..." 
              className="h-9 text-sm" 
              style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(200,162,124,0.2)" }}
              disabled={extracting}
            />
            {extracting && <p className="text-xs text-muted-foreground mt-1">Fetching property details...</p>}
          </div>
          {!form.image_url && (
            <div>
              <Label className="text-xs font-medium mb-1 block" style={{ color: "#9A8A7A" }}>Add Photo <span style={{color:'#C0B0A0',fontWeight:400}}>(optional)</span></Label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-upload"
                />
                <label htmlFor="photo-upload">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-9 text-sm rounded-md cursor-pointer"
                    style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(200,162,124,0.2)" }}
                    onClick={() => document.getElementById('photo-upload')?.click()}
                  >
                    <Upload className="h-3.5 w-3.5 mr-2" /> Upload photo
                  </Button>
                </label>
              </div>
            </div>
          )}
          {form.image_url && (
            <div>
              <Label className="text-xs font-medium mb-1 block" style={{ color: "#9A8A7A" }}>Photo</Label>
              <div className="w-full h-24 rounded-lg overflow-hidden bg-muted">
                <img src={form.image_url} alt="Preview" className="w-full h-full object-cover" />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full mt-2 text-xs"
                onClick={() => setForm({ ...form, image_url: "" })}
              >
                Remove photo
              </Button>
            </div>
          )}
          <div>
            <Label className="text-xs font-medium mb-1 block" style={{ color: "#9A8A7A" }}>Notes <span style={{color:'#C0B0A0',fontWeight:400}}>(optional)</span></Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Check-in code, parking info..." className="text-sm" rows={2} style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(200,162,124,0.2)" }} />
          </div>
          <button type="submit" className="w-full h-10 rounded-full text-sm font-semibold mt-1" style={{ background: "#C8A27C", color: "white" }}>
            {editingId ? "Save Changes" : "Add Lodging"}
          </button>
        </form>
      </BottomSheet>
    </div>
  );
}