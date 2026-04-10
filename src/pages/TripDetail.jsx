import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Link2, MapPin, Calendar, Users, ImageIcon } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import TripPlan from "../components/trip/TripPlan";
import TripStay from "../components/trip/TripStay";
import TripItinerary from "../components/trip/TripItinerary";
import TripCosts from "../components/trip/TripCosts";
import TripAira from "../components/trip/TripAira";
import TripLinks from "../components/trip/TripLinks";
import TripChat from "../components/trip/TripChat";
import TripCoverEditor from "../components/trip/TripCoverEditor";

const tripTabs = [
  { key: "plan", label: "Plan" },
  { key: "stay", label: "Stay" },
  { key: "itinerary", label: "Itinerary" },
  { key: "costs", label: "Costs" },
  { key: "links", label: "Links" },
  { key: "chat", label: "Chat" },
  { key: "aira", label: "Aira" },
];

export default function TripDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("plan");
  const [showCoverEditor, setShowCoverEditor] = useState(false);
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
    <div>
      <div
        className="h-48 bg-cover bg-center relative"
        style={{ backgroundImage: `url(${trip.cover_image || coverImages[0]})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute top-4 left-4">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-black/30 text-white hover:bg-black/50 h-9 w-9"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>
        <div className="absolute top-4 right-4 flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-black/30 text-white hover:bg-black/50 h-9 w-9"
            onClick={() => setShowCoverEditor(true)}
          >
            <ImageIcon className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-black/30 text-white hover:bg-black/50 h-9 w-9"
            onClick={copyInviteLink}
          >
            <Link2 className="h-5 w-5" />
          </Button>
        </div>
        <div className="absolute bottom-4 left-5 right-5">
          <h1 className="text-white text-2xl font-bold mb-1">{trip.name}</h1>
          <div className="flex items-center gap-4 text-white/80 text-xs">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {trip.destination}
            </span>
            {trip.start_date && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {format(new Date(trip.start_date), "MMM d")}
                {trip.end_date && ` – ${format(new Date(trip.end_date), "MMM d")}`}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" /> {trip.member_emails?.length || 1}
            </span>
          </div>
        </div>
      </div>

      <div className="px-5">
        <div className="flex gap-1 mt-4 mb-4 bg-muted rounded-full p-1 overflow-x-auto">
          {tripTabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2 text-xs font-medium rounded-full transition-all whitespace-nowrap px-3 ${
                tab === t.key ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "plan" && <TripPlan trip={trip} user={user} onUpdate={loadData} />}
        {tab === "stay" && <TripStay trip={trip} user={user} />}
        {tab === "itinerary" && <TripItinerary trip={trip} user={user} />}
        {tab === "costs" && <TripCosts trip={trip} user={user} />}
        {tab === "links" && <TripLinks trip={trip} user={user} />}
        {tab === "chat" && <TripChat trip={trip} user={user} />}
        {tab === "aira" && <TripAira trip={trip} />}

        <TripCoverEditor
          open={showCoverEditor}
          onOpenChange={setShowCoverEditor}
          trip={trip}
          onUpdated={loadData}
        />
      </div>
    </div>
  );
}