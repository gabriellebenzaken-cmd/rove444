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
    <div className="px-5 pt-14">
      <div className="flex items-center justify-between mb-7">
        <div>
          <p className="text-xs font-medium tracking-widest uppercase" style={{color:'#C8A27C', letterSpacing:'0.12em'}}>Your Adventures</p>
          <h1 className="text-[28px] font-semibold tracking-tight leading-tight mt-0.5" style={{color:'#1A1A1A', letterSpacing:'-0.025em'}}>Trips</h1>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all active:scale-95"
          style={{background:'#C8A27C', color:'white', boxShadow:'0 2px 12px rgba(200,162,124,0.35)'}}
        >
          <Plus className="h-3.5 w-3.5" /> New Trip
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{borderColor:'#C8A27C', borderTopColor:'transparent'}} />
        </div>
      ) : trips.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-28 text-center">
          <div className="w-16 h-16 rounded-[22px] flex items-center justify-center mb-5" style={{background:'rgba(200,162,124,0.15)'}}>
            <MapPin className="h-7 w-7" style={{color:'#C8A27C'}} />
          </div>
          <h3 className="font-semibold text-lg mb-1.5" style={{color:'#1A1A1A'}}>No trips yet</h3>
          <p className="text-sm mb-7" style={{color:'#9A8A7A'}}>Tap "New Trip" to start planning your next adventure</p>
          <button onClick={() => setShowCreate(true)} className="px-7 py-2.5 rounded-full text-sm font-semibold" style={{background:'#C8A27C', color:'white', boxShadow:'0 2px 14px rgba(200,162,124,0.35)'}}>
            Create Trip
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {trips.map((trip, i) => (
            <Link key={trip.id} to={`/trip/${trip.id}`} className="block active:scale-[0.985] transition-transform duration-150">
              <div className="rounded-[22px] overflow-hidden" style={{background:'rgba(255,255,255,0.75)', backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)', border:'1px solid rgba(255,255,255,0.7)', boxShadow:'0 4px 24px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)'}}>
                <div
                  className="h-48 bg-cover bg-center relative"
                  style={{ backgroundImage: `url(${trip.cover_image || coverImages[i % coverImages.length]})` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                  {trip.theme_color && (
                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full border-2 border-white/60" style={{background: trip.theme_color}} />
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-white font-semibold text-[18px] leading-tight" style={{letterSpacing:'-0.015em'}}>{trip.name}</h3>
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3 text-white/70" />
                      <span className="text-white/75 text-xs font-medium">{trip.destination}</span>
                    </div>
                  </div>
                </div>
                <div className="px-4 py-3 flex items-center justify-between">
                  <p className="text-[12px] font-normal" style={{color:'#B0A090'}}>
                    {trip.start_date && trip.end_date
                      ? `${format(new Date(trip.start_date), "MMM d")} – ${format(new Date(trip.end_date), "MMM d")}`
                      : 'Dates TBD'}
                  </p>
                  <div className="flex items-center gap-1">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{background:'rgba(200,162,124,0.15)'}}>
                      <Users className="h-3 w-3" style={{color:'#C8A27C'}} />
                    </div>
                    <span className="text-[12px] font-medium" style={{color:'#9A8A7A'}}>{trip.member_emails?.length || 1}</span>
                  </div>
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