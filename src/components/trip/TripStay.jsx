import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, MapPin, ExternalLink, Edit2, Upload, Moon } from "lucide-react";
import BottomSheet from "../BottomSheet";
import LodgingDetailSheet from "./LodgingDetailSheet";
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
  const [profiles, setProfiles] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [detailLodging, setDetailLodging] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [extracting, setExtracting] = useState(false);

  useEffect(() => {
    loadData();
    loadProfiles();
  }, [trip.id]);

  async function loadData() {
    const all = await base44.entities.Lodging.filter({ trip_id: trip.id }, "-created_date", 50);
    setLodgings(all);
  }

  async function loadProfiles() {
    if (!trip.member_emails?.length) return;
    const all = await base44.entities.UserProfile.filter({});
    setProfiles(all.filter(p => trip.member_emails.includes(p.user_email)));
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
          {lodgings.map((l) => {
            const nights = l.check_in && l.check_out
              ? Math.round((new Date(l.check_out) - new Date(l.check_in)) / 86400000)
              : null;
            const checkIn  = l.check_in  ? format(new Date(l.check_in  + "T00:00:00"), "MMM d") : null;
            const checkOut = l.check_out ? format(new Date(l.check_out + "T00:00:00"), "MMM d") : null;

            return (
              <div
                key={l.id}
                className="rounded-2xl border border-border bg-card overflow-hidden cursor-pointer active:scale-[0.985] transition-transform"
                style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.04), 0 0 0 0.5px rgba(0,0,0,0.04)" }}
                onClick={() => setDetailLodging(l)}
              >
                {/* Hero image */}
                {l.image_url && (
                  <div className="w-full h-36 overflow-hidden bg-muted relative">
                    <img src={l.image_url} alt={l.name} className="w-full h-full object-cover" style={{ filter: "brightness(0.92)" }} />
                    {/* action buttons overlaid top-right */}
                    <div className="absolute top-2 right-2 flex gap-1" onClick={(e) => e.stopPropagation()}>
                      {l.booking_url && (
                        <button
                          className="w-7 h-7 rounded-full flex items-center justify-center"
                          style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(8px)" }}
                          onClick={() => window.open(l.booking_url, '_blank')}
                        >
                          <ExternalLink className="h-3.5 w-3.5 text-white" />
                        </button>
                      )}
                      <button
                        className="w-7 h-7 rounded-full flex items-center justify-center"
                        style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(8px)" }}
                        onClick={() => openEdit(l)}
                      >
                        <Edit2 className="h-3.5 w-3.5 text-white" />
                      </button>
                      <button
                        className="w-7 h-7 rounded-full flex items-center justify-center"
                        style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(8px)" }}
                        onClick={() => deleteLodging(l.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-white" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Content */}
                <div className="px-4 pt-3.5 pb-3">
                  {/* Header row: name + actions (no image case) */}
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold text-[15px] leading-snug tracking-tight text-foreground flex-1">{l.name}</h4>
                    {!l.image_url && (
                      <div className="flex gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                        {l.booking_url && (
                          <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full" onClick={() => window.open(l.booking_url, '_blank')}>
                            <ExternalLink className="h-3.5 w-3.5" style={{color:'#C8A27C'}} />
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full" onClick={() => openEdit(l)}>
                          <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full" onClick={() => deleteLodging(l.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Address */}
                  {l.address && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                      <p className="text-[12px] text-muted-foreground truncate">{l.address}</p>
                    </div>
                  )}

                  {/* Date strip */}
                  {(checkIn || checkOut) && (
                    <div className="flex items-center gap-2 mt-3">
                      <div className="flex-1 rounded-xl px-3 py-2" style={{ background: "rgba(200,162,124,0.08)", border: "1px solid rgba(200,162,124,0.18)" }}>
                        <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Check-in</p>
                        <p className="text-[13px] font-semibold text-foreground">{checkIn || "—"}</p>
                      </div>
                      {nights > 0 && (
                        <div className="flex flex-col items-center gap-0.5 px-1">
                          <Moon className="h-3 w-3 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground font-medium">{nights}n</span>
                        </div>
                      )}
                      <div className="flex-1 rounded-xl px-3 py-2" style={{ background: "rgba(200,162,124,0.08)", border: "1px solid rgba(200,162,124,0.18)" }}>
                        <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Check-out</p>
                        <p className="text-[13px] font-semibold text-foreground">{checkOut || "—"}</p>
                      </div>
                      {l.price_per_night && (
                        <div className="flex flex-col items-end shrink-0 pl-1">
                          <p className="text-[13px] font-semibold text-foreground">${l.price_per_night}</p>
                          <p className="text-[9px] text-muted-foreground">/night</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Notes preview */}
                  {l.notes && (
                    <p className="text-[11px] text-muted-foreground mt-2.5 leading-relaxed border-t border-border pt-2.5 line-clamp-2">{l.notes}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <LodgingDetailSheet
        lodging={detailLodging}
        open={!!detailLodging}
        onClose={() => setDetailLodging(null)}
        onEdit={openEdit}
        onDelete={deleteLodging}
        currentUserEmail={user.email}
        profiles={profiles}
      />

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