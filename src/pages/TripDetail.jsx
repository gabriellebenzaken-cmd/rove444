import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Link2, MapPin, Calendar, Users, ImageIcon, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import TripPlan from "../components/trip/TripPlan";
import TripStay from "../components/trip/TripStay";
import TripItinerary from "../components/trip/TripItinerary";
import TripCosts from "../components/trip/TripCosts";
import TripChat from "../components/trip/TripChat";
import TripCoverEditor from "../components/trip/TripCoverEditor";
import EditTripDialog from "../components/trip/EditTripDialog";
import TripMap from "../components/trip/TripMap";

const tripTabs = [
  { key: "plan", label: "Plan" },
  { key: "stay", label: "Stay" },
  { key: "itinerary", label: "Itinerary" },
  { key: "map", label: "Map" },
  { key: "costs", label: "Costs" },
  { key: "chat", label: "Chat" },
];

export default function TripDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("plan");
  const [showCoverEditor, setShowCoverEditor] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    const me = await base44.auth.me();
    setUser(me);
    const allTrips = await base44.entities.Trip.list("-created_date", 200);
    const t = allTrips.find((tr) => tr.id === id);
    setTrip(t);
    setLoading(false);
  }

  async function deleteTrip() {
    await base44.entities.Trip.delete(trip.id);
    toast.success("Trip deleted");
    navigate("/");
  }

  const isAdmin = user && (trip?.admin_email === user.email);
  const isMember = user && (trip?.member_emails?.includes(user.email) || isAdmin);
  const themeColor = trip?.theme_color || null;
  const themeStyle = themeColor ? { '--trip-primary': themeColor } : {};

  async function copyInviteLink() {
    const link = `${window.location.origin}/join/trip/${trip.invite_code}`;
    await navigator.clipboard.writeText(link);
    toast.success("Invite link copied!");
  }

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="px-5 pt-14 text-center">
        <p className="text-muted-foreground">Trip not found</p>
      </div>
    );
  }

  const coverImages = [
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80",
    "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=80",
  ];

  return (
    <div style={themeStyle}>
      <div
        className="h-56 bg-cover bg-center relative"
        style={{ backgroundImage: `url(${trip.cover_image || coverImages[0]})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute top-5 left-4">
          <button
            className="rounded-full h-9 w-9 flex items-center justify-center transition-all active:scale-90"
            style={{background:'rgba(0,0,0,0.28)', backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)'}}
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
        </div>
        <div className="absolute top-5 right-4 flex gap-2">
          <button className="rounded-full h-9 w-9 flex items-center justify-center" style={{background:'rgba(0,0,0,0.28)', backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)'}} onClick={() => setShowCoverEditor(true)}>
            <ImageIcon className="h-4.5 w-4.5 text-white" />
          </button>
          <button className="rounded-full h-9 w-9 flex items-center justify-center" style={{background:'rgba(0,0,0,0.28)', backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)'}} onClick={copyInviteLink}>
            <Link2 className="h-4.5 w-4.5 text-white" />
          </button>
          {isMember && (
            <button className="rounded-full h-9 w-9 flex items-center justify-center" style={{background:'rgba(0,0,0,0.28)', backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)'}} onClick={() => setShowMenu(true)}>
              <MoreHorizontal className="h-4.5 w-4.5 text-white" />
            </button>
          )}
        </div>
        <div className="absolute bottom-5 left-5 right-5">
          <h1 className="text-white text-[24px] font-semibold leading-tight mb-1.5" style={{letterSpacing:'-0.02em'}}>{trip.name}</h1>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1 text-white/80 text-xs">
              <MapPin className="h-3.5 w-3.5" /> {trip.destination}
            </span>
            {trip.start_date && (
              <span className="flex items-center gap-1 text-white/80 text-xs">
                <Calendar className="h-3.5 w-3.5" />
                {format(new Date(trip.start_date), "MMM d")}
                {trip.end_date && ` – ${format(new Date(trip.end_date), "MMM d")}`}
              </span>
            )}
            <span className="flex items-center gap-1 text-white/80 text-xs">
              <Users className="h-3.5 w-3.5" /> {trip.member_emails?.length || 1}
            </span>
          </div>
        </div>
      </div>

      <div className="px-5">
        <div className="flex gap-1 mt-4 mb-4 rounded-full p-1 overflow-x-auto" style={{background:'rgba(200,162,124,0.1)', scrollbarWidth:'none'}}>
          {tripTabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="shrink-0 py-2 text-xs font-medium rounded-full transition-all whitespace-nowrap px-4"
              style={tab === t.key
                ? { background: themeColor || 'white', color: themeColor ? 'white' : '#3A3028', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }
                : { color: '#9CA3AF' }
              }
            >
              {t.label}
            </button>
          ))}
          <div className="shrink-0 w-2" />
        </div>

        {tab === "plan" && <TripPlan trip={trip} user={user} onUpdate={loadData} />}
        {tab === "stay" && <TripStay trip={trip} user={user} />}
        {tab === "itinerary" && <TripItinerary trip={trip} user={user} />}
        {tab === "map" && <TripMap trip={trip} />}
        {tab === "costs" && <TripCosts trip={trip} user={user} />}
        {tab === "chat" && <TripChat trip={trip} user={user} />}

        <TripCoverEditor open={showCoverEditor} onOpenChange={setShowCoverEditor} trip={trip} onUpdated={loadData} />
        <EditTripDialog open={showEdit} onOpenChange={setShowEdit} trip={trip} onUpdated={loadData} />

        {/* Trip menu */}
        <Dialog open={showMenu} onOpenChange={setShowMenu}>
          <DialogContent className="mx-4 rounded-2xl max-w-sm p-3">
            <DialogHeader><DialogTitle className="px-2 pt-1 text-sm">Trip Options</DialogTitle></DialogHeader>
            <button className="flex items-center gap-3 w-full px-3 py-3 rounded-xl hover:bg-muted transition-colors text-left" onClick={() => { setShowMenu(false); setShowEdit(true); }}>
              <Pencil className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Edit Trip</span>
            </button>
            {isAdmin && (
              <button className="flex items-center gap-3 w-full px-3 py-3 rounded-xl hover:bg-destructive/10 transition-colors text-left" onClick={() => { setShowMenu(false); setShowDeleteConfirm(true); }}>
                <Trash2 className="h-4 w-4 text-destructive" />
                <span className="text-sm font-medium text-destructive">Delete Trip</span>
              </button>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete confirm */}
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent className="mx-4 rounded-2xl max-w-sm">
            <DialogHeader><DialogTitle>Delete Trip?</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">This will permanently delete "{trip.name}" and all associated data. This cannot be undone.</p>
            <div className="flex gap-2 mt-2">
              <Button variant="outline" className="flex-1 rounded-full" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
              <Button variant="destructive" className="flex-1 rounded-full" onClick={deleteTrip}>Delete</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}