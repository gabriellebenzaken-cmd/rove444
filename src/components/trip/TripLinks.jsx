import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Link2, Trash2, ExternalLink, TrendingUp } from "lucide-react";

const categories = [
  { value: "food", label: "🍕 Food" },
  { value: "cafe", label: "☕ Café" },
  { value: "activity", label: "🎯 Activity" },
  { value: "hotel", label: "🏨 Hotel" },
  { value: "shopping", label: "🛍 Shopping" },
  { value: "nightlife", label: "🎉 Nightlife" },
  { value: "other", label: "🔗 Other" },
];

function detectPlatform(url) {
  if (!url) return null;
  if (url.includes("tiktok.com")) return { label: "TikTok", color: "bg-black text-white", icon: "▶" };
  if (url.includes("instagram.com")) return { label: "Instagram", color: "bg-gradient-to-r from-purple-500 to-pink-500 text-white", icon: "📸" };
  if (url.includes("youtube.com") || url.includes("youtu.be")) return { label: "YouTube", color: "bg-red-500 text-white", icon: "▶" };
  if (url.includes("yelp.com")) return { label: "Yelp", color: "bg-red-600 text-white", icon: "⭐" };
  if (url.includes("maps.google")) return { label: "Maps", color: "bg-blue-500 text-white", icon: "📍" };
  if (url.includes("tripadvisor")) return { label: "TripAdvisor", color: "bg-emerald-600 text-white", icon: "🌿" };
  return null;
}

function getHostname(url) {
  try { return new URL(url).hostname.replace("www.", ""); } catch { return url; }
}

export default function TripLinks({ trip, user }) {
  const [links, setLinks] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({ url: "", title: "", note: "", category: "other" });

  useEffect(() => { loadData(); }, [trip.id]);

  async function loadData() {
    const all = await base44.entities.TripLink.filter({ trip_id: trip.id }, "-created_date", 100);
    setLinks(all);
  }

  async function addLink(e) {
    e.preventDefault();
    if (!form.url) return;
    await base44.entities.TripLink.create({
      ...form,
      trip_id: trip.id,
      shared_by_email: user.email,
      shared_by_name: user.full_name,
    });
    setForm({ url: "", title: "", note: "", category: "other" });
    setShowAdd(false);
    loadData();
  }

  async function deleteLink(id) {
    await base44.entities.TripLink.delete(id);
    loadData();
  }

  const filtered = filter === "all" ? links : links.filter((l) => l.category === filter);
  const counts = {};
  links.forEach((l) => { counts[l.category] = (counts[l.category] || 0) + 1; });

  return (
    <div className="pb-24">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Shared Links</h3>
          <span className="text-xs text-muted-foreground">({links.length})</span>
        </div>
        <Button variant="outline" size="sm" className="rounded-full" onClick={() => setShowAdd(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Share
        </Button>
      </div>

      {/* Category filter pills */}
      {links.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-none">
          <button
            onClick={() => setFilter("all")}
            className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition-all ${
              filter === "all" ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground"
            }`}
          >
            All ({links.length})
          </button>
          {categories.filter((c) => counts[c.value]).map((c) => (
            <button
              key={c.value}
              onClick={() => setFilter(c.value)}
              className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition-all ${
                filter === c.value ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground"
              }`}
            >
              {c.label} ({counts[c.value]})
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-14">
          <div className="w-14 h-14 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Link2 className="h-6 w-6 text-primary" />
          </div>
          <h4 className="font-semibold mb-1">No links yet</h4>
          <p className="text-xs text-muted-foreground">Share TikToks, Reels, Yelp pages, Google Maps — anything!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((link) => {
            const platform = detectPlatform(link.url);
            const cat = categories.find((c) => c.value === link.category);
            return (
              <div key={link.id} className="bg-card rounded-2xl border border-border p-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-lg shrink-0">
                    {cat?.label?.split(" ")[0] || "🔗"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        {link.title && (
                          <p className="text-sm font-medium truncate">{link.title}</p>
                        )}
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary flex items-center gap-1 hover:underline truncate"
                        >
                          {platform ? (
                            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${platform.color}`}>
                              {platform.label}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">{getHostname(link.url)}</span>
                          )}
                          <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                        </a>
                        {link.note && <p className="text-xs text-muted-foreground mt-0.5">{link.note}</p>}
                      </div>
                      {link.shared_by_email === user.email && (
                        <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => deleteLink(link.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Shared by {link.shared_by_name || link.shared_by_email?.split("@")[0]}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="mx-4 rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>Share a Link</DialogTitle>
          </DialogHeader>
          <form onSubmit={addLink} className="space-y-4">
            <div>
              <Label>URL</Label>
              <Input
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="https://tiktok.com/..."
                className="mt-1"
              />
            </div>
            <div>
              <Label>Title (optional)</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="This café looks amazing!"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Note (optional)</Label>
              <Textarea
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="We should check this out on day 2!"
                className="mt-1"
                rows={2}
              />
            </div>
            <Button type="submit" className="w-full rounded-full">Share Link</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}