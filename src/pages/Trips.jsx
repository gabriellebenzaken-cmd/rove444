import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Plus, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import CreateTripDialog from "../components/trips/CreateTripDialog";

export default function Trips() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const me = await base44.auth.me();
    setUser(me);
    const allTrips = await base44.entities.Trip.list("-created_date", 50);
    const myTrips = allTrips.filter(
      (t) => t.member_emails?.includes(me.email) || t.admin_email === me.email
    );
    setTrips(myTrips);
    setLoading(false);
  }

  const coverImages = [
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80",
    "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=80",
    "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&q=80",
    "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=80",
  ];

  return (
    <div className="px-5 pt-12">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[26px] font-medium tracking-tight leading-none" style={{color:'#111111', letterSpacing:'-0.02em'}}>Trips</h1>
        <Button
          onClick={() => setShowCreate(true)}
          size="sm"
          className="rounded-full px-4 h-8 text-xs font-semibold shadow-sm"
        >
          <Plus className="h-3.5 w-3.5 mr-1" /> New Trip
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : trips.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-14 h-14 bg-accent rounded-2xl flex items-center justify-center mb-4">
            <MapPin className="h-6 w-6 text-primary" />
          </div>
          <h3 className="font-semibold text-lg mb-1">No trips yet</h3>
          <p className="text-muted-foreground text-sm mb-6">Tap "New Trip" to start planning</p>
          <Button onClick={() => setShowCreate(true)} className="rounded-full px-6 shadow-sm">
            Create Trip
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {trips.map((trip, i) => (
            <Link key={trip.id} to={`/trip/${trip.id}`} className="block active:scale-[0.98] transition-transform duration-150">
              <div className="rounded-[20px] overflow-hidden transition-shadow duration-300" style={{background:'rgba(255,255,255,0.82)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)', border:'1px solid rgba(255,255,255,0.6)', boxShadow:'0 2px 16px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)'}}>
                <div
                  className="h-44 bg-cover bg-center relative"
                  style={{ backgroundImage: `url(${trip.cover_image || coverImages[i % coverImages.length]})` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-white font-medium text-[17px] leading-tight" style={{letterSpacing:'-0.01em'}}>{trip.name}</h3>
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3 text-white/70" />
                      <span className="text-white/75 text-xs font-medium">{trip.destination}</span>
                    </div>
                  </div>
                </div>
                <div className="px-4 py-3">
                  <p className="text-[11.5px] font-normal" style={{color:'#9CA3AF', letterSpacing:'0.005em'}}>
                    {trip.start_date && trip.end_date
                      ? `${format(new Date(trip.start_date), "MMM d")}–${format(new Date(trip.end_date), "MMM d")} • ${trip.member_emails?.length || 1} ${trip.member_emails?.length === 1 ? "person" : "people"}`
                      : `${trip.member_emails?.length || 1} ${trip.member_emails?.length === 1 ? "person" : "people"}`}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <CreateTripDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        user={user}
        onCreated={loadData}
      />
    </div>
  );
}