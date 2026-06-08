import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, MapPin, Users, Calendar } from "lucide-react";
import { format } from "date-fns";
import CreateTripDialog from "../components/trips/CreateTripDialog";
import PullToRefresh from "../components/PullToRefresh";

function TripCard({ trip, index, coverImages, past }) {
  return (
    <Link to={`/trip/${trip.id}`} className="block active:scale-[0.985] transition-transform duration-150">
      <div className="rounded-[22px] overflow-hidden" style={{background:'rgba(255,255,255,0.75)', backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)', border:'1px solid rgba(255,255,255,0.7)', boxShadow:'0 4px 24px rgba(0,0,0,0.07)', opacity: past ? 0.72 : 1}}>
        <div
          className="bg-cover bg-center relative"
          style={{ backgroundImage: `url(${trip.cover_image || coverImages[index % coverImages.length]})`, height: past ? 100 : 180 }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          {past && (
            <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[9px] font-semibold" style={{background:'rgba(0,0,0,0.4)', color:'rgba(255,255,255,0.85)'}}>Completed</div>
          )}
          <div className="absolute bottom-0 left-0 right-0 p-3.5">
            <h3 className="text-white font-semibold leading-tight" style={{fontSize: past ? 14 : 18, letterSpacing:'-0.015em'}}>{trip.name}</h3>
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin className="h-3 w-3 text-white/70" />
              <span className="text-white/75 text-xs font-medium">{trip.destination}</span>
            </div>
          </div>
        </div>
        <div className="px-4 py-2.5 flex items-center justify-between">
          <p className="text-[11px] font-normal" style={{color:'#B0A090'}}>
            {trip.start_date && trip.end_date
              ? `${format(new Date(trip.start_date + 'T00:00:00'), "MMM d")} – ${format(new Date(trip.end_date + 'T00:00:00'), "MMM d, yyyy")}`
              : 'Dates TBD'}
          </p>
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" style={{color:'#C8A27C'}} />
            <span className="text-[11px] font-medium" style={{color:'#9A8A7A'}}>{trip.member_emails?.length || 1}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function Trips() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [debugInfo, setDebugInfo] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    loadData();
    // Re-fetch if a new token arrives via deep-link OAuth callback
    window.addEventListener('base44:token-received', loadData);
    return () => window.removeEventListener('base44:token-received', loadData);
  }, []);

  async function loadData() {
    setLoading(true);
    setDebugInfo(null);
    try {
      const me = await base44.auth.me();
      setUser(me);

      // Query 1: trips where user is admin
      const adminTrips = await base44.entities.Trip.filter({ admin_email: me.email }, "-created_date", 500);

      // Query 2: trips where user is in member_emails array
      const memberTrips = await base44.entities.Trip.filter({ member_emails: me.email }, "-created_date", 500);

      // Query 3: fallback — fetch a large recent batch and client-filter for member_emails
      // This catches any trips the array-contains filter may miss
      const recentBatch = await base44.entities.Trip.list("-created_date", 500);
      const clientMemberTrips = recentBatch.filter(
        t => t.member_emails?.includes(me.email) && t.admin_email !== me.email
      );

      const combined = [...adminTrips, ...memberTrips, ...clientMemberTrips];
      const seen = new Set();
      const uniqueTrips = [];
      for (const t of combined) {
        if (!seen.has(t.id)) {
          seen.add(t.id);
          uniqueTrips.push(t);
        }
      }
      uniqueTrips.sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0));

      const today = new Date().toISOString().split("T")[0];
      const active = uniqueTrips.filter(t => !t.end_date || t.end_date >= today);
      const past = uniqueTrips.filter(t => t.end_date && t.end_date < today);

      setDebugInfo({
        email: me.email,
        adminCount: adminTrips.length,
        memberCount: memberTrips.length,
        clientMemberCount: clientMemberTrips.length,
        totalUnique: uniqueTrips.length,
        activeCount: active.length,
        pastCount: past.length,
        tripNames: uniqueTrips.map(t => `${t.name} (${t.start_date || '?'} → ${t.end_date || '?'})`),
      });

      setTrips(uniqueTrips);
    } catch (err) {
      console.error("[Trips] loadData failed:", err);
      setDebugInfo({ error: err.message });
    } finally {
      setLoading(false);
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    }
  }

  const today = new Date().toISOString().split("T")[0];
  const activeTrips = trips.filter((t) => !t.end_date || t.end_date >= today)
    .sort((a, b) => (a.start_date || "9999-12-31").localeCompare(b.start_date || "9999-12-31"));
  const pastTrips = trips.filter((t) => t.end_date && t.end_date < today)
    .sort((a, b) => (b.end_date || "0000-01-01").localeCompare(a.end_date || "0000-01-01"));

  const coverImages = [
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80",
    "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=80",
    "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&q=80",
    "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=80",
  ];

  return (
    <PullToRefresh onRefresh={loadData}>
    <div className="px-5 pt-14">
      <div className="flex items-center justify-between mb-7">
        <div>
          <p className="text-xs font-medium tracking-widest uppercase" style={{color:'#C8A27C', letterSpacing:'0.12em'}}>Your Adventures</p>
          <h1 className="text-[28px] font-semibold tracking-tight leading-tight mt-0.5 text-[#1A1A1A] dark:text-[#F0EAE0]" style={{letterSpacing:'-0.025em'}}>Trips</h1>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all active:scale-95"
          style={{background:'#C8A27C', color:'white', boxShadow:'0 2px 12px rgba(200,162,124,0.35)'}}
        >
          <Plus className="h-3.5 w-3.5" /> New Trip
        </button>
      </div>

      {/* DEBUG PANEL — temporary, remove after diagnosis */}
      {debugInfo && (
        <div className="mb-4 p-3 rounded-xl text-[11px] font-mono" style={{ background: '#1a1a2e', color: '#00ff99', border: '1px solid #00ff99' }}>
          <p style={{ color: '#ffcc00', fontWeight: 700, marginBottom: 4 }}>🔍 LIVE DEBUG (tap to dismiss)</p>
          {debugInfo.error ? (
            <p style={{ color: '#ff4444' }}>ERROR: {debugInfo.error}</p>
          ) : (
            <>
              <p>📧 email: {debugInfo.email}</p>
              <p>🔑 adminTrips: {debugInfo.adminCount}</p>
              <p>👥 memberTrips (db filter): {debugInfo.memberCount}</p>
              <p>🔍 memberTrips (client fallback): {debugInfo.clientMemberCount}</p>
              <p>✅ totalUnique: {debugInfo.totalUnique}</p>
              <p>📅 active: {debugInfo.activeCount} | past: {debugInfo.pastCount}</p>
              <p style={{ marginTop: 6, color: '#aaffcc' }}>Trip names:</p>
              {debugInfo.tripNames.map((n, i) => <p key={i} style={{ color: '#ccffee' }}>  {i+1}. {n}</p>)}
            </>
          )}
        </div>
      )}

      {/* Tabs */}
      {!loading && trips.length > 0 && (
        <div className="flex gap-1 mb-5 p-1 rounded-full" style={{background:'rgba(0,0,0,0.06)'}}>
          <button
            onClick={() => setActiveTab('upcoming')}
            className="flex-1 py-2 text-xs font-semibold rounded-full transition-all"
            style={activeTab === 'upcoming' ? {background:'#C8A27C', color:'white', boxShadow:'0 1px 8px rgba(200,162,124,0.3)'} : {color:'#9A8A7A'}}
          >
            Upcoming
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className="flex-1 py-2 text-xs font-semibold rounded-full transition-all"
            style={activeTab === 'past' ? {background:'#C8A27C', color:'white', boxShadow:'0 1px 8px rgba(200,162,124,0.3)'} : {color:'#9A8A7A'}}
          >
            Past
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{borderColor:'#C8A27C', borderTopColor:'transparent'}} />
        </div>
      ) : activeTrips.length === 0 && pastTrips.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-28 text-center">
          <div className="w-16 h-16 rounded-[22px] flex items-center justify-center mb-5" style={{background:'rgba(200,162,124,0.15)'}}>
            <MapPin className="h-7 w-7" style={{color:'#C8A27C'}} />
          </div>
          <h3 className="font-semibold text-lg mb-1.5" style={{color:'#1A1A1A'}}>✦ start planning your first trip</h3>
          <p className="text-sm mb-7" style={{color:'#9A8A7A'}}>Tap "New Trip" to get started</p>
          <button onClick={() => setShowCreate(true)} className="px-7 py-2.5 rounded-full text-sm font-semibold" style={{background:'#C8A27C', color:'white', boxShadow:'0 2px 14px rgba(200,162,124,0.35)'}}>
            Create Trip
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {activeTab === 'upcoming' && (
            activeTrips.length === 0 ? (
              <p className="text-center text-sm py-16" style={{color:'#9A8A7A'}}>✦ no upcoming trips yet</p>
            ) : (
              activeTrips.map((trip, i) => (
                <TripCard key={trip.id} trip={trip} index={i} coverImages={coverImages} />
              ))
            )
          )}
          {activeTab === 'past' && (
            pastTrips.length === 0 ? (
              <p className="text-center text-sm py-16" style={{color:'#9A8A7A'}}>✦ no past trips yet</p>
            ) : (
              pastTrips.map((trip, i) => (
                <TripCard key={trip.id} trip={trip} index={i} coverImages={coverImages} past />
              ))
            )
          )}
        </div>
      )}

      <CreateTripDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        user={user}
        onCreated={loadData}
      />
    </div>
    </PullToRefresh>
  );
}