import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Plus, MapPin, Calendar, ChevronRight } from "lucide-react";
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Trips</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Plan your next adventure</p>
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          size="icon"
          className="h-10 w-10 rounded-full shadow-lg"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : trips.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MapPin className="h-7 w-7 text-primary" />
          </div>
          <h3 className="font-semibold text-lg mb-1">No trips yet</h3>
          <p className="text-muted-foreground text-sm mb-6">Create your first trip to get started</p>
          <Button onClick={() => setShowCreate(true)} className="rounded-full px-6">
            Create Trip
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {trips.map((trip, i) => (
            <Link
              key={trip.id}
              to={`/trip/${trip.id}`}
              className="block group"
            >
              <div className="bg-card rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-md transition-all duration-300">
                <div
                  className="h-36 bg-cover bg-center relative"
                  style={{
                    backgroundImage: `url(${trip.cover_image || coverImages[i % coverImages.length]})`,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4">
                    <h3 className="text-white font-semibold text-lg leading-tight">{trip.name}</h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <MapPin className="h-3.5 w-3.5 text-white/80" />
                      <span className="text-white/80 text-xs">{trip.destination}</span>
                    </div>
                  </div>
                </div>
                <div className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    {trip.start_date && trip.end_date ? (
                      <span>
                        {format(new Date(trip.start_date), "MMM d")} –{" "}
                        {format(new Date(trip.end_date), "MMM d, yyyy")}
                      </span>
                    ) : (
                      <span>Dates TBD</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span>{trip.member_emails?.length || 1} members</span>
                    <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
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