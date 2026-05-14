import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trash2, Sprout, CheckCircle2, Loader2, ShieldAlert } from "lucide-react";

// ─── Demo identifiers ────────────────────────────────────────────────────────
const DEMO_TAG = "__demo__";

const USERS = [
  {
    user_id: `${DEMO_TAG}maya`,
    user_email: "maya.chen@rove-demo.app",
    username: "MayaC",
    username_lower: "mayac",
    full_name: "Maya Chen",
    display_name: "Maya",
    bio: "Chasing light and good coffee across time zones.",
    profile_photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
    venmo: "@maya-chen",
    instagram: "mayac.travel",
  },
  {
    user_id: `${DEMO_TAG}sofia`,
    user_email: "sofia.alvarez@rove-demo.app",
    username: "SofieAlv",
    username_lower: "sofiealv",
    full_name: "Sofia Alvarez",
    display_name: "Sofia",
    bio: "Architecture student. Cities are my mood board.",
    profile_photo: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&q=80",
    venmo: "@sofia-alv",
    instagram: "sofia.alv",
  },
  {
    user_id: `${DEMO_TAG}jordan`,
    user_email: "jordan.kim@rove-demo.app",
    username: "JordyK",
    username_lower: "jordyk",
    full_name: "Jordan Kim",
    display_name: "Jordan",
    bio: "Dev by day, noodle tour guide by night.",
    profile_photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
    venmo: "@jordy-k",
    instagram: "jordyk",
  },
  {
    user_id: `${DEMO_TAG}aaliyah`,
    user_email: "aaliyah.brooks@rove-demo.app",
    username: "AaliyahB",
    username_lower: "aaliyahb",
    full_name: "Aaliyah Brooks",
    display_name: "Aaliyah",
    bio: "Trails, peaks, and the occasional rooftop bar.",
    profile_photo: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&q=80",
    venmo: "@aaliyah-b",
    cashapp: "$aaliyahb",
  },
  {
    user_id: `${DEMO_TAG}luca`,
    user_email: "luca.rossi@rove-demo.app",
    username: "LucaR",
    username_lower: "lucar",
    full_name: "Luca Rossi",
    display_name: "Luca",
    bio: "Graphic designer. Here for the gelato and the galleries.",
    profile_photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80",
    venmo: "@luca-rossi",
    instagram: "lucar.design",
  },
  {
    user_id: `${DEMO_TAG}layla`,
    user_email: "layla.haddad@rove-demo.app",
    username: "LaylaH",
    username_lower: "laylah",
    full_name: "Layla Haddad",
    display_name: "Layla",
    bio: "Sustainability consultant. Making travel a little greener.",
    profile_photo: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&q=80",
    venmo: "@layla-h",
    instagram: "layla.haddad",
  },
];

const u = (key) => USERS.find((x) => x.username_lower === key);
const email = (key) => u(key)?.user_email;
const name = (key) => u(key)?.full_name;

// ─── Log helper ──────────────────────────────────────────────────────────────
function makeLogger(setLog) {
  return (msg) => setLog((prev) => [...prev, msg]);
}

// ─── Main seeder ─────────────────────────────────────────────────────────────
async function runSeed(log, me) {
  // ── 1. UserProfiles ──────────────────────────────────────────────────────
  log("Creating UserProfiles…");
  const existingProfiles = await base44.entities.UserProfile.filter({}, "-created_date", 200).catch(() => []);
  if (existingProfiles.some((p) => p.user_id?.startsWith(DEMO_TAG))) throw new Error("Demo data already exists. Clear it first.");

  const profileRecords = await Promise.all(USERS.map((u) => base44.entities.UserProfile.create(u)));
  log(`✓ ${profileRecords.length} UserProfiles created`);

  // Real user's email — injected into all trips so the UI shows them
  const myEmail = me.email;
  const myName = me.full_name || me.email;
  log(`✓ Seeding as ${myEmail}`);

  // ── 2. Group ─────────────────────────────────────────────────────────────
  log("Creating Group…");
  const group = await base44.entities.Group.create({
    name: `${DEMO_TAG}The Rove Crew`,
    description: "Our go-to travel squad for spontaneous adventures.",
    admin_email: myEmail,
    member_emails: [myEmail, ...USERS.map((u) => u.user_email)],
    invite_code: `${DEMO_TAG}ROVECREW`,
    invite_active: true,
  });
  log(`✓ Group "${group.name}" created`);

  // ── 3. Trips ─────────────────────────────────────────────────────────────
  log("Creating Trips…");

  const tripEurope = await base44.entities.Trip.create({
    name: `${DEMO_TAG}Eurotrip: Paris & Rome`,
    destination: "Paris, France",
    description: "Two weeks of museums, pasta, and way too many croissants.",
    start_date: "2026-09-01",
    end_date: "2026-09-14",
    group_id: group.id,
    admin_email: myEmail,
    member_emails: [myEmail, email("mayac"), email("sofiealv"), email("lucar"), email("laylah")],
    invite_code: `${DEMO_TAG}EUPARIS26`,
    invite_active: true,
    cover_image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80",
    theme_color: "#8B6F47",
  });

  const tripPNW = await base44.entities.Trip.create({
    name: `${DEMO_TAG}PNW Escape`,
    destination: "Seattle, WA",
    description: "Seattle coffee, Rainier hikes, and Vancouver vibes.",
    start_date: "2026-08-05",
    end_date: "2026-08-12",
    admin_email: myEmail,
    member_emails: [myEmail, email("jordyk"), email("aaliyahb"), email("mayac")],
    invite_code: `${DEMO_TAG}PNWESC26`,
    invite_active: true,
    cover_image: "https://images.unsplash.com/photo-1501466044931-62695aada8e9?w=800&q=80",
    theme_color: "#3D6B4F",
  });

  const tripDubai = await base44.entities.Trip.create({
    name: `${DEMO_TAG}Dubai Long Weekend`,
    destination: "Dubai, UAE",
    description: "Desert safari, rooftop pools, and skyline views.",
    start_date: "2026-11-20",
    end_date: "2026-11-25",
    admin_email: myEmail,
    member_emails: [myEmail, email("laylah"), email("mayac"), email("sofiealv"), email("jordyk")],
    invite_code: `${DEMO_TAG}DUBAI26`,
    invite_active: false,
    cover_image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80",
    theme_color: "#C9941A",
  });

  log(`✓ 3 Trips created (you are admin + member of all)`);

  // ── 4. TripMembers ───────────────────────────────────────────────────────
  log("Creating TripMembers…");
  const tmRecords = [
    // Real user is admin on every trip
    { trip_id: tripEurope.id, user_email: myEmail,           user_name: myName,           role: "admin",  status: "active",  invited_by_email: null },
    { trip_id: tripEurope.id, user_email: email("mayac"),    user_name: name("mayac"),    role: "member", status: "active",  invited_by_email: myEmail },
    { trip_id: tripEurope.id, user_email: email("sofiealv"), user_name: name("sofiealv"), role: "member", status: "active",  invited_by_email: myEmail },
    { trip_id: tripEurope.id, user_email: email("lucar"),    user_name: name("lucar"),    role: "member", status: "active",  invited_by_email: myEmail },
    { trip_id: tripEurope.id, user_email: email("laylah"),   user_name: name("laylah"),   role: "member", status: "invited", invited_by_email: myEmail },
    // PNW trip
    { trip_id: tripPNW.id, user_email: myEmail,           user_name: myName,           role: "admin",  status: "active",  invited_by_email: null },
    { trip_id: tripPNW.id, user_email: email("jordyk"),   user_name: name("jordyk"),   role: "member", status: "active",  invited_by_email: myEmail },
    { trip_id: tripPNW.id, user_email: email("aaliyahb"), user_name: name("aaliyahb"), role: "member", status: "active",  invited_by_email: myEmail },
    { trip_id: tripPNW.id, user_email: email("mayac"),    user_name: name("mayac"),    role: "member", status: "active",  invited_by_email: myEmail },
    // Dubai trip
    { trip_id: tripDubai.id, user_email: myEmail,           user_name: myName,           role: "admin",  status: "active",  invited_by_email: null },
    { trip_id: tripDubai.id, user_email: email("laylah"),   user_name: name("laylah"),   role: "member", status: "active",  invited_by_email: myEmail },
    { trip_id: tripDubai.id, user_email: email("mayac"),    user_name: name("mayac"),    role: "member", status: "active",  invited_by_email: myEmail },
    { trip_id: tripDubai.id, user_email: email("sofiealv"), user_name: name("sofiealv"), role: "member", status: "active",  invited_by_email: myEmail },
    { trip_id: tripDubai.id, user_email: email("jordyk"),   user_name: name("jordyk"),   role: "member", status: "declined",invited_by_email: myEmail },
  ];
  await Promise.all(tmRecords.map((r) => base44.entities.TripMember.create(r)));
  log(`✓ ${tmRecords.length} TripMembers created`);

  // ── 5. Arrivals ──────────────────────────────────────────────────────────
  log("Creating Arrivals…");
  const arrivalRecords = [
    { trip_id: tripEurope.id, user_email: email("mayac"),    user_name: name("mayac"),    travel_type: "Flight", is_round_trip: true,  arrival_location: "JFK", destination: "CDG", arrival_date: "2025-06-01", arrival_time: "07:30", departure_date: "2025-06-14", departure_time: "10:00", airline: "Air France",    outbound_flight_number: "AF007",  return_flight_number: "AF008" },
    { trip_id: tripEurope.id, user_email: email("sofiealv"), user_name: name("sofiealv"), travel_type: "Flight", is_round_trip: true,  arrival_location: "MIA", destination: "CDG", arrival_date: "2025-06-01", arrival_time: "08:10", departure_date: "2025-06-14", departure_time: "11:30", airline: "American",      outbound_flight_number: "AA100",  return_flight_number: "AA101" },
    { trip_id: tripEurope.id, user_email: email("lucar"),    user_name: name("lucar"),    travel_type: "Flight", is_round_trip: false, arrival_location: "FCO", destination: "CDG", arrival_date: "2025-06-03", arrival_time: "09:45", airline: "Alitalia",      outbound_flight_number: "AZ200" },
    { trip_id: tripPNW.id,    user_email: email("jordyk"),   user_name: name("jordyk"),   travel_type: "Flight", is_round_trip: true,  arrival_location: "SFO", destination: "SEA", arrival_date: "2025-08-05", arrival_time: "12:00", departure_date: "2025-08-12", departure_time: "15:00", airline: "Alaska",        outbound_flight_number: "AS123",  return_flight_number: "AS124" },
    { trip_id: tripPNW.id,    user_email: email("aaliyahb"), user_name: name("aaliyahb"), travel_type: "Driving", is_round_trip: true, arrival_location: "Portland, OR", destination: "Seattle, WA", arrival_date: "2025-08-05", arrival_time: "14:00" },
    { trip_id: tripDubai.id,  user_email: email("laylah"),   user_name: name("laylah"),   travel_type: "Flight", is_round_trip: true,  arrival_location: "LHR", destination: "DXB", arrival_date: "2025-11-20", arrival_time: "06:00", departure_date: "2025-11-25", departure_time: "22:00", airline: "Emirates",      outbound_flight_number: "EK001",  return_flight_number: "EK002" },
    { trip_id: tripDubai.id,  user_email: email("mayac"),    user_name: name("mayac"),    travel_type: "Flight", is_round_trip: true,  arrival_location: "JFK", destination: "DXB", arrival_date: "2025-11-20", arrival_time: "08:30", departure_date: "2025-11-25", departure_time: "23:55", airline: "Emirates",      outbound_flight_number: "EK201",  return_flight_number: "EK202" },
  ];
  await Promise.all(arrivalRecords.map((r) => base44.entities.Arrival.create(r)));
  log(`✓ ${arrivalRecords.length} Arrivals created`);

  // ── 6. Lodging ───────────────────────────────────────────────────────────
  log("Creating Lodging…");
  const lodgingRecords = [
    { trip_id: tripEurope.id, name: "Hôtel des Grands Boulevards", address: "17 Bd Poissonnière, 75002 Paris", price_per_night: 185, check_in: "2025-06-01", check_out: "2025-06-07", notes: "Check-in after 3pm. Breakfast included.", guest_emails: [email("mayac"), email("sofiealv")] },
    { trip_id: tripEurope.id, name: "Hotel Raphael Rome",          address: "Largo Febo, 2, 00186 Roma",        price_per_night: 210, check_in: "2025-06-07", check_out: "2025-06-14", notes: "Rooftop terrace has incredible views.",  guest_emails: [email("mayac"), email("sofiealv"), email("lucar")] },
    { trip_id: tripPNW.id,    name: "Ace Hotel Seattle",           address: "2423 1st Ave, Seattle, WA",        price_per_night: 160, check_in: "2025-08-05", check_out: "2025-08-09", notes: "Loft rooms, great café downstairs.",    guest_emails: [email("jordyk"), email("aaliyahb"), email("mayac")] },
    { trip_id: tripPNW.id,    name: "Rosewood Hotel Georgia",      address: "801 W Georgia St, Vancouver",      price_per_night: 195, check_in: "2025-08-09", check_out: "2025-08-12", notes: "Classic hotel, ask for a city view room.", guest_emails: [email("jordyk"), email("aaliyahb"), email("mayac")] },
    { trip_id: tripDubai.id,  name: "Bulgari Resort Dubai",        address: "Jumeira Bay Island, Dubai",        price_per_night: 580, check_in: "2025-11-20", check_out: "2025-11-25", notes: "Private beach, complimentary yacht tours.", guest_emails: [email("laylah"), email("mayac"), email("sofiealv")] },
  ];
  await Promise.all(lodgingRecords.map((r) => base44.entities.Lodging.create(r)));
  log(`✓ ${lodgingRecords.length} Lodging records created`);

  // ── 7. ItineraryItems ────────────────────────────────────────────────────
  log("Creating ItineraryItems…");
  const itinRecords = [
    // Europe – Paris
    { trip_id: tripEurope.id, date: "2025-06-02", time: "09:30", title: "Marché des Enfants Rouges",       location: "Le Marais, Paris",           notes: "Oldest covered market in Paris. Get the falafel from L'As du Fallafel.",  is_required: false, participant_emails: [email("mayac"), email("sofiealv")] },
    { trip_id: tripEurope.id, date: "2025-06-02", time: "14:00", title: "Centre Pompidou",                 location: "Place Georges-Pompidou, Paris", notes: "Book timed tickets online day before.",                                   is_required: false, participant_emails: [email("mayac"), email("sofiealv"), email("lucar")] },
    { trip_id: tripEurope.id, date: "2025-06-03", time: "10:00", title: "Louvre Museum",                   location: "Rue de Rivoli, Paris",        notes: "Pre-book! Skip the pyramid queue via Porte des Lions entrance.",          is_required: true,  participant_emails: [email("mayac"), email("sofiealv"), email("lucar")] },
    { trip_id: tripEurope.id, date: "2025-06-03", time: "20:00", title: "Dinner: Frenchie Bistro",         location: "5 Rue du Nil, Paris",         notes: "Reservation confirmed under Sofia.",                                      is_required: true,  participant_emails: [email("mayac"), email("sofiealv"), email("lucar")] },
    { trip_id: tripEurope.id, date: "2025-06-04", time: "08:30", title: "Versailles Day Trip",             location: "Palace of Versailles",        notes: "Take RER C from Musée d'Orsay. Get there early to beat crowds.",         is_required: false, participant_emails: [email("mayac"), email("lucar")] },
    { trip_id: tripEurope.id, date: "2025-06-05", time: "11:00", title: "Montmartre & Sacré-Cœur",         location: "18th Arrondissement, Paris",  notes: "Walk up the hill for views. Avoid tourist restaurants near the square.", is_required: false, participant_emails: [email("mayac"), email("sofiealv")] },
    // Europe – Rome
    { trip_id: tripEurope.id, date: "2025-06-08", time: "09:00", title: "Colosseum & Roman Forum",         location: "Piazza del Colosseo, Rome",   notes: "Guided tour booked. Meet at south entrance at 8:50.",                   is_required: true,  participant_emails: [email("mayac"), email("sofiealv"), email("lucar")] },
    { trip_id: tripEurope.id, date: "2025-06-08", time: "19:30", title: "Trastevere Dinner Crawl",         location: "Trastevere, Rome",            notes: "No reservations needed, just wander and pick a spot.",                   is_required: false, participant_emails: [email("mayac"), email("sofiealv"), email("lucar")] },
    { trip_id: tripEurope.id, date: "2025-06-09", time: "10:30", title: "Vatican Museums & Sistine Chapel", location: "Vatican City",               notes: "Book skip-the-line tickets. No sleeveless tops inside.",                 is_required: true,  participant_emails: [email("mayac"), email("sofiealv"), email("lucar")] },
    { trip_id: tripEurope.id, date: "2025-06-10", time: "15:00", title: "Trevi Fountain & Pantheon",       location: "Centro Storico, Rome",        notes: "Throw a coin! Go to Trevi early evening for best photos.",              is_required: false, participant_emails: [email("sofiealv"), email("lucar")] },
    // PNW – Seattle
    { trip_id: tripPNW.id, date: "2025-08-05", time: "16:00", title: "Pike Place Market",              location: "Pike Place, Seattle",         notes: "Flying fish demo at 3pm daily. Grab clam chowder in a bread bowl.",     is_required: false, participant_emails: [email("jordyk"), email("aaliyahb"), email("mayac")] },
    { trip_id: tripPNW.id, date: "2025-08-06", time: "09:00", title: "Mount Rainier Day Hike",         location: "Paradise, Mount Rainier NP",  notes: "Skyline Trail loop is 5 miles. Bring layers — weather changes fast.",   is_required: false, participant_emails: [email("jordyk"), email("aaliyahb")] },
    { trip_id: tripPNW.id, date: "2025-08-07", time: "11:00", title: "Space Needle & Chihuly Garden",  location: "Seattle Center",              notes: "Combo ticket is worth it. Chihuly glass exhibit is stunning.",           is_required: false, participant_emails: [email("jordyk"), email("aaliyahb"), email("mayac")] },
    { trip_id: tripPNW.id, date: "2025-08-07", time: "19:00", title: "Dinner: Canlis Restaurant",      location: "2576 Aurora Ave N, Seattle",  notes: "Dress code: smart casual. Reservation under Jordan.",                   is_required: true,  participant_emails: [email("jordyk"), email("aaliyahb"), email("mayac")] },
    // PNW – Vancouver
    { trip_id: tripPNW.id, date: "2025-08-09", time: "10:00", title: "Stanley Park Seawall Bike",      location: "Stanley Park, Vancouver",     notes: "Rent bikes near the park entrance. Full loop is ~9km.",                 is_required: false, participant_emails: [email("jordyk"), email("aaliyahb"), email("mayac")] },
    { trip_id: tripPNW.id, date: "2025-08-10", time: "14:00", title: "Granville Island Public Market", location: "Granville Island, Vancouver", notes: "Best food market in Canada. Grab artisan cheese and local ciders.",     is_required: false, participant_emails: [email("jordyk"), email("aaliyahb"), email("mayac")] },
    // Dubai
    { trip_id: tripDubai.id, date: "2025-11-20", time: "17:00", title: "Dubai Frame at Sunset",          location: "Zabeel Park, Dubai",          notes: "Glass floor walkway — not for the faint-hearted. Arrive 30 min early.", is_required: false, participant_emails: [email("laylah"), email("mayac"), email("sofiealv")] },
    { trip_id: tripDubai.id, date: "2025-11-21", time: "15:00", title: "Desert Safari & BBQ Dinner",     location: "Dubai Desert, Al Lahbab",     notes: "Pickup from hotel at 3pm. Dune bashing, camel rides, falconry.",       is_required: true,  participant_emails: [email("laylah"), email("mayac"), email("sofiealv")] },
    { trip_id: tripDubai.id, date: "2025-11-22", time: "10:00", title: "Burj Khalifa – At the Top",      location: "Downtown Dubai",              notes: "Level 148 tickets pre-booked. Go before 11am to avoid haze.",          is_required: true,  participant_emails: [email("laylah"), email("mayac"), email("sofiealv")] },
    { trip_id: tripDubai.id, date: "2025-11-22", time: "19:00", title: "Dubai Fountain Show & Dinner",   location: "Dubai Mall / Burj Lake",      notes: "Show every 30 min after sunset. Book Thiptara for lakeside views.",    is_required: false, participant_emails: [email("laylah"), email("mayac"), email("sofiealv")] },
    { trip_id: tripDubai.id, date: "2025-11-23", time: "11:00", title: "Gold & Spice Souk Walk",         location: "Deira, Dubai",                notes: "Take the Abra (water taxi) across the Creek. Bargain respectfully.",   is_required: false, participant_emails: [email("laylah"), email("sofiealv")] },
    { trip_id: tripDubai.id, date: "2025-11-24", time: "09:00", title: "Kayaking at Hatta Dam",           location: "Hatta, Dubai",                notes: "2-hour drive. Rent kayaks on-site. Bring sunscreen.",                  is_required: false, participant_emails: [email("laylah"), email("mayac")] },
  ];
  await Promise.all(itinRecords.map((r) => base44.entities.ItineraryItem.create(r)));
  log(`✓ ${itinRecords.length} ItineraryItems created`);

  // ── 8. Expenses ──────────────────────────────────────────────────────────
  log("Creating Expenses…");
  const expenseRecords = [
    // Europe
    { trip_id: tripEurope.id, description: "Group Eurostar tickets (Paris → London day trip)", amount: 312.00, paid_by: email("mayac"),    paid_by_name: name("mayac"),    split_among: [email("mayac"), email("sofiealv"), email("lucar")], category: "transport", trip_wide: false, day_number: 2, is_settled: false },
    { trip_id: tripEurope.id, description: "Louvre Museum tickets",                            amount: 54.00,  paid_by: email("lucar"),    paid_by_name: name("lucar"),    split_among: [email("mayac"), email("sofiealv"), email("lucar")], category: "activity",  trip_wide: false, day_number: 3, is_settled: false },
    { trip_id: tripEurope.id, description: "Frenchie Bistro dinner",                           amount: 187.50, paid_by: email("sofiealv"), paid_by_name: name("sofiealv"), split_among: [email("mayac"), email("sofiealv"), email("lucar")], category: "food",      trip_wide: false, day_number: 3, is_settled: false },
    { trip_id: tripEurope.id, description: "Versailles day trip tickets + train",              amount: 96.00,  paid_by: email("mayac"),    paid_by_name: name("mayac"),    split_among: [email("mayac"), email("lucar")],                    category: "activity",  trip_wide: false, day_number: 4, is_settled: false },
    { trip_id: tripEurope.id, description: "Colosseum guided tour (all 3 days)",               amount: 135.00, paid_by: email("lucar"),    paid_by_name: name("lucar"),    split_among: [email("mayac"), email("sofiealv"), email("lucar")], category: "activity",  trip_wide: false, day_number: 8, is_settled: false },
    { trip_id: tripEurope.id, description: "Vatican Museums tickets",                          amount: 66.00,  paid_by: email("sofiealv"), paid_by_name: name("sofiealv"), split_among: [email("mayac"), email("sofiealv"), email("lucar")], category: "activity",  trip_wide: false, day_number: 9, is_settled: false },
    { trip_id: tripEurope.id, description: "Hotel Grands Boulevards (6 nights)",              amount: 1110.00, paid_by: email("mayac"),   paid_by_name: name("mayac"),    split_among: [email("mayac"), email("sofiealv")],                 category: "lodging",   trip_wide: true,  is_settled: false },
    // PNW
    { trip_id: tripPNW.id, description: "Rainier National Park entrance",   amount: 35.00,  paid_by: email("jordyk"),   paid_by_name: name("jordyk"),   split_among: [email("jordyk"), email("aaliyahb")],                    category: "activity",  trip_wide: false, day_number: 2, is_settled: true,  settlement_notes: "Aaliyah paid back via Venmo" },
    { trip_id: tripPNW.id, description: "Canlis dinner",                    amount: 285.00, paid_by: email("jordyk"),   paid_by_name: name("jordyk"),   split_among: [email("jordyk"), email("aaliyahb"), email("mayac")],    category: "food",      trip_wide: false, day_number: 3, is_settled: false },
    { trip_id: tripPNW.id, description: "Rental car for Rainier day trip",  amount: 120.00, paid_by: email("aaliyahb"), paid_by_name: name("aaliyahb"), split_among: [email("jordyk"), email("aaliyahb")],                    category: "transport", trip_wide: false, day_number: 2, is_settled: false },
    { trip_id: tripPNW.id, description: "Stanley Park bike rentals",        amount: 78.00,  paid_by: email("mayac"),    paid_by_name: name("mayac"),    split_among: [email("jordyk"), email("aaliyahb"), email("mayac")],    category: "activity",  trip_wide: false, day_number: 5, is_settled: false },
    { trip_id: tripPNW.id, description: "Ace Hotel Seattle (4 nights)",     amount: 640.00, paid_by: email("jordyk"),   paid_by_name: name("jordyk"),   split_among: [email("jordyk"), email("aaliyahb"), email("mayac")],    category: "lodging",   trip_wide: true,  is_settled: false },
    // Dubai
    { trip_id: tripDubai.id, description: "Desert Safari (group booking)",    amount: 450.00, paid_by: email("laylah"),  paid_by_name: name("laylah"),  split_among: [email("laylah"), email("mayac"), email("sofiealv")], category: "activity",  trip_wide: false, day_number: 2, is_settled: false },
    { trip_id: tripDubai.id, description: "Burj Khalifa – At the Top",        amount: 147.00, paid_by: email("mayac"),   paid_by_name: name("mayac"),   split_among: [email("laylah"), email("mayac"), email("sofiealv")], category: "activity",  trip_wide: false, day_number: 3, is_settled: false },
    { trip_id: tripDubai.id, description: "Thiptara restaurant dinner",        amount: 310.00, paid_by: email("sofiealv"),paid_by_name: name("sofiealv"),split_among: [email("laylah"), email("mayac"), email("sofiealv")], category: "food",      trip_wide: false, day_number: 3, is_settled: false },
    { trip_id: tripDubai.id, description: "Bulgari Resort (5 nights, shared)", amount: 2900.00,paid_by: email("laylah"), paid_by_name: name("laylah"),  split_among: [email("laylah"), email("mayac"), email("sofiealv")], category: "lodging",   trip_wide: true,  is_settled: false },
  ];
  await Promise.all(expenseRecords.map((r) => base44.entities.Expense.create(r)));
  log(`✓ ${expenseRecords.length} Expenses created`);

  // ── 9. TripPolls & Votes ─────────────────────────────────────────────────
  log("Creating TripPolls and Votes…");
  const poll1 = await base44.entities.TripPoll.create({
    trip_id: tripEurope.id,
    question: "Where should we eat on our last night in Rome?",
    options: ["Trattoria da Cesare al Casaletto", "Da Enzo al 29", "Roscioli"],
    created_by_email: email("sofiealv"),
    created_by_name: name("sofiealv"),
    is_closed: false,
  });
  const poll2 = await base44.entities.TripPoll.create({
    trip_id: tripPNW.id,
    question: "Day trip from Vancouver — what should we do?",
    options: ["Whistler ski resort", "Squamish rock climbing", "Capilano Suspension Bridge"],
    created_by_email: email("jordyk"),
    created_by_name: name("jordyk"),
    is_closed: false,
  });
  const poll3 = await base44.entities.TripPoll.create({
    trip_id: tripDubai.id,
    question: "How should we spend our last afternoon in Dubai?",
    options: ["Beach club at the Palm", "Dubai Museum & Al Fahidi", "Last-minute shopping at Dubai Mall"],
    created_by_email: email("laylah"),
    created_by_name: name("laylah"),
    is_closed: true,
  });

  const pollVoteRecords = [
    // Poll 1 – Rome dinner
    { poll_id: poll1.id, trip_id: tripEurope.id, voter_email: email("mayac"),    voter_name: name("mayac"),    option_index: 0 },
    { poll_id: poll1.id, trip_id: tripEurope.id, voter_email: email("lucar"),    voter_name: name("lucar"),    option_index: 2 },
    { poll_id: poll1.id, trip_id: tripEurope.id, voter_email: email("sofiealv"), voter_name: name("sofiealv"), option_index: 0 },
    // Poll 2 – Vancouver day trip
    { poll_id: poll2.id, trip_id: tripPNW.id, voter_email: email("jordyk"),   voter_name: name("jordyk"),   option_index: 0 },
    { poll_id: poll2.id, trip_id: tripPNW.id, voter_email: email("aaliyahb"), voter_name: name("aaliyahb"), option_index: 1 },
    { poll_id: poll2.id, trip_id: tripPNW.id, voter_email: email("mayac"),    voter_name: name("mayac"),    option_index: 0 },
    // Poll 3 – Dubai last afternoon (closed)
    { poll_id: poll3.id, trip_id: tripDubai.id, voter_email: email("laylah"),   voter_name: name("laylah"),   option_index: 2 },
    { poll_id: poll3.id, trip_id: tripDubai.id, voter_email: email("mayac"),    voter_name: name("mayac"),    option_index: 0 },
    { poll_id: poll3.id, trip_id: tripDubai.id, voter_email: email("sofiealv"), voter_name: name("sofiealv"), option_index: 2 },
  ];
  await Promise.all(pollVoteRecords.map((r) => base44.entities.TripPollVote.create(r)));
  log(`✓ 3 Polls + ${pollVoteRecords.length} Votes created`);

  // ── 10. TripMessages ─────────────────────────────────────────────────────
  log("Creating TripMessages…");
  const messageRecords = [
    // Europe chat
    { trip_id: tripEurope.id, sender_email: email("mayac"),    sender_name: name("mayac"),    content: "Itinerary is looking so good. Can't believe we leave in two weeks 😭", message_type: "text" },
    { trip_id: tripEurope.id, sender_email: email("sofiealv"), sender_name: name("sofiealv"), content: "Someone please tell me we have a plan for where to eat in Paris because I refuse to go to a tourist trap", message_type: "text" },
    { trip_id: tripEurope.id, sender_email: email("lucar"),    sender_name: name("lucar"),    content: "Already added Frenchie to the itinerary. You're welcome.", message_type: "text" },
    { trip_id: tripEurope.id, sender_email: email("mayac"),    sender_name: name("mayac"),    content: "Luca being the unsung hero of this trip as always", message_type: "text" },
    { trip_id: tripEurope.id, sender_email: email("sofiealv"), sender_name: name("sofiealv"), content: "Quick reminder: Vatican is no bare shoulders. Luca.", message_type: "text" },
    { trip_id: tripEurope.id, sender_email: email("lucar"),    sender_name: name("lucar"),    content: "I KNOW. I've been to Rome before, Sofia.", message_type: "text" },
    { trip_id: tripEurope.id, sender_email: email("sofiealv"), sender_name: name("sofiealv"), content: "https://guide.michelin.com/en/lazio/roma/restaurant/roscioli", message_type: "link", link_url: "https://guide.michelin.com/en/lazio/roma/restaurant/roscioli", link_title: "Roscioli – Michelin Guide", link_summary: "A legendary Roman salumeria and wine bar in the heart of the old city.", link_category: "food" },
    // PNW chat
    { trip_id: tripPNW.id, sender_email: email("jordyk"),   sender_name: name("jordyk"),   content: "Just landed in Seattle. Airport smells like coffee and rain. Home.", message_type: "text" },
    { trip_id: tripPNW.id, sender_email: email("aaliyahb"), sender_name: name("aaliyahb"), content: "I drove up from Portland. Pulled into the hotel 20 min ago. The lobby has plants everywhere?? I love it", message_type: "text" },
    { trip_id: tripPNW.id, sender_email: email("mayac"),    sender_name: name("mayac"),    content: "My flight got delayed 45 min but I'm on the ground. Order food without me, I'll catch up", message_type: "text" },
    { trip_id: tripPNW.id, sender_email: email("jordyk"),   sender_name: name("jordyk"),   content: "Already at Pike Place. They literally threw a fish at Aaliyah.", message_type: "text" },
    { trip_id: tripPNW.id, sender_email: email("aaliyahb"), sender_name: name("aaliyahb"), content: "I caught it though. Zero hesitation.", message_type: "text" },
    // Dubai chat
    { trip_id: tripDubai.id, sender_email: email("laylah"),   sender_name: name("laylah"),   content: "Hotels are confirmed, flights are sorted. Who needs airport pickup info?", message_type: "text" },
    { trip_id: tripDubai.id, sender_email: email("mayac"),    sender_name: name("mayac"),    content: "Me please! Also is it weird that I'm most excited for the souk?", message_type: "text" },
    { trip_id: tripDubai.id, sender_email: email("sofiealv"), sender_name: name("sofiealv"), content: "Not weird at all. The architecture in Deira is insane. I've been watching videos.", message_type: "text" },
    { trip_id: tripDubai.id, sender_email: email("laylah"),   sender_name: name("laylah"),   content: "FYI the desert safari pickup is at 3pm sharp. Don't be late or the dunes won't wait lol", message_type: "text" },
    { trip_id: tripDubai.id, sender_email: email("mayac"),    sender_name: name("mayac"),    content: "Sofia will be late. I'm calling it now.", message_type: "text" },
    { trip_id: tripDubai.id, sender_email: email("sofiealv"), sender_name: name("sofiealv"), content: "Genuinely offended. I am punctual when it matters.", message_type: "text" },
  ];
  // Create sequentially to preserve message order
  for (const m of messageRecords) {
    await base44.entities.TripMessage.create(m);
  }
  log(`✓ ${messageRecords.length} TripMessages created`);

  // ── 11. TripLinks ────────────────────────────────────────────────────────
  log("Creating TripLinks…");
  const linkRecords = [
    { trip_id: tripEurope.id, url: "https://www.frenchie.fr/restaurant/frenchie-bistro/", title: "Frenchie Bistro – Paris", note: "Reservation confirmed for night 3. Don't be late.", category: "food",     shared_by_email: email("lucar"),    shared_by_name: name("lucar") },
    { trip_id: tripEurope.id, url: "https://www.ticketmaster.fr/fr/colisee-rome",          title: "Colosseum Tickets",         note: "Already purchased. Check your email for the QR codes.", category: "activity", shared_by_email: email("sofiealv"), shared_by_name: name("sofiealv") },
    { trip_id: tripPNW.id,    url: "https://www.nps.gov/mora/planyourvisit/paradise.htm",  title: "Rainier Paradise Trails",   note: "Skyline Loop is the one. 5 miles, doable for all.",    category: "activity", shared_by_email: email("aaliyahb"), shared_by_name: name("aaliyahb") },
    { trip_id: tripPNW.id,    url: "https://www.canlis.com",                               title: "Canlis Restaurant",         note: "Reservation under Jordan. Smart casual dress code.",   category: "food",     shared_by_email: email("jordyk"),   shared_by_name: name("jordyk") },
    { trip_id: tripDubai.id,  url: "https://www.burjkhalifa.ae/en/at-the-top/",            title: "Burj Khalifa – At the Top", note: "Level 148. Pre-booked. 10am tickets.",                category: "activity", shared_by_email: email("laylah"),   shared_by_name: name("laylah") },
    { trip_id: tripDubai.id,  url: "https://www.bulgarihotels.com/dubai",                  title: "Bulgari Resort Dubai",      note: "Our hotel! Check-in at 3pm, early drop-off possible.", category: "hotel",    shared_by_email: email("laylah"),   shared_by_name: name("laylah") },
  ];
  await Promise.all(linkRecords.map((r) => base44.entities.TripLink.create(r)));
  log(`✓ ${linkRecords.length} TripLinks created`);

  // ── 12. Notifications ────────────────────────────────────────────────────
  log("Creating Notifications…");
  const notifRecords = [
    { user_email: email("sofiealv"), type: "trip_added",    message: "Maya added you to Eurotrip: Paris & Rome",         related_user_email: email("mayac"),    related_user_name: name("mayac"),    related_trip_id: tripEurope.id, is_read: true },
    { user_email: email("lucar"),    type: "trip_added",    message: "Maya added you to Eurotrip: Paris & Rome",         related_user_email: email("mayac"),    related_user_name: name("mayac"),    related_trip_id: tripEurope.id, is_read: true },
    { user_email: email("laylah"),   type: "trip_added",    message: "Maya invited you to Eurotrip: Paris & Rome",       related_user_email: email("mayac"),    related_user_name: name("mayac"),    related_trip_id: tripEurope.id, is_read: false },
    { user_email: email("aaliyahb"), type: "trip_added",    message: "Jordan added you to PNW Escape",                  related_user_email: email("jordyk"),   related_user_name: name("jordyk"),   related_trip_id: tripPNW.id,    is_read: true },
    { user_email: email("mayac"),    type: "trip_added",    message: "Jordan added you to PNW Escape",                  related_user_email: email("jordyk"),   related_user_name: name("jordyk"),   related_trip_id: tripPNW.id,    is_read: false },
    { user_email: email("mayac"),    type: "trip_added",    message: "Layla added you to Dubai Long Weekend",            related_user_email: email("laylah"),   related_user_name: name("laylah"),   related_trip_id: tripDubai.id,  is_read: false },
    { user_email: email("sofiealv"), type: "trip_added",    message: "Layla added you to Dubai Long Weekend",            related_user_email: email("laylah"),   related_user_name: name("laylah"),   related_trip_id: tripDubai.id,  is_read: true },
    { user_email: email("mayac"),    type: "friend_request",message: "Aaliyah Brooks sent you a friend request",         related_user_email: email("aaliyahb"), related_user_name: name("aaliyahb"),                                 is_read: false },
    { user_email: email("jordyk"),   type: "friend_accepted",message: "Layla Haddad accepted your friend request",      related_user_email: email("laylah"),   related_user_name: name("laylah"),                                   is_read: false },
    { user_email: email("laylah"),   type: "group_invite",  message: "Maya invited you to join The Rove Crew",          related_user_email: email("mayac"),    related_user_name: name("mayac"),    related_group_id: group.id,     is_read: true },
  ];
  await Promise.all(notifRecords.map((r) => base44.entities.Notification.create(r)));
  log(`✓ ${notifRecords.length} Notifications created`);

  // ── 13. Friendships ──────────────────────────────────────────────────────
  log("Creating Friendships…");
  const friendshipRecords = [
    { user1_email: email("mayac"),    user2_email: email("sofiealv") },
    { user1_email: email("mayac"),    user2_email: email("lucar") },
    { user1_email: email("mayac"),    user2_email: email("laylah") },
    { user1_email: email("jordyk"),   user2_email: email("aaliyahb") },
    { user1_email: email("jordyk"),   user2_email: email("laylah") },
    { user1_email: email("sofiealv"), user2_email: email("laylah") },
    { user1_email: email("sofiealv"), user2_email: email("lucar") },
  ];
  await Promise.all(friendshipRecords.map((r) => base44.entities.Friendship.create(r)));
  log(`✓ ${friendshipRecords.length} Friendships created`);

  log("🎉 All demo data seeded successfully!");
}

// ─── Cleaner ─────────────────────────────────────────────────────────────────
async function runClear(log) {
  log("Clearing demo data…");

  const profiles = await base44.entities.UserProfile.filter({}, "-created_date", 200);
  const demoProfiles = profiles.filter((p) => p.user_id?.startsWith(DEMO_TAG));
  const demoEmails = demoProfiles.map((p) => p.user_email);

  if (demoProfiles.length === 0) {
    log("No demo data found.");
    return;
  }

  // Delete UserProfiles
  await Promise.all(demoProfiles.map((p) => base44.entities.UserProfile.delete(p.id)));
  log(`✓ Deleted ${demoProfiles.length} UserProfiles`);

  // Delete Groups with DEMO_TAG
  const groups = await base44.entities.Group.filter({}, "-created_date", 200);
  const demoGroups = groups.filter((g) => g.name?.includes(DEMO_TAG));
  await Promise.all(demoGroups.map((g) => base44.entities.Group.delete(g.id)));
  log(`✓ Deleted ${demoGroups.length} Groups`);

  // Delete Trips with DEMO_TAG invite codes or names
  const trips = await base44.entities.Trip.filter({}, "-created_date", 200);
  const demoTrips = trips.filter((t) => t.invite_code?.startsWith(DEMO_TAG) || t.name?.startsWith(DEMO_TAG));
  const demoTripIds = demoTrips.map((t) => t.id);
  await Promise.all(demoTrips.map((t) => base44.entities.Trip.delete(t.id)));
  log(`✓ Deleted ${demoTrips.length} Trips`);

  if (demoTripIds.length > 0) {
    // Delete all records tied to demo trips or demo emails
    const allEntities = [
      "TripMember", "Arrival", "Lodging", "ItineraryItem",
      "Expense", "Payment", "TripPoll", "TripPollVote",
      "TripMessage", "TripLink", "Notification", "Friendship",
    ];

    for (const entityName of allEntities) {
      try {
        const all = await base44.entities[entityName].filter({}, "-created_date", 500);
        const toDelete = all.filter((r) =>
          demoTripIds.includes(r.trip_id) ||
          demoEmails.includes(r.user_email) ||
          demoEmails.includes(r.sender_email) ||
          demoEmails.includes(r.user1_email) ||
          demoEmails.includes(r.voter_email) ||
          demoEmails.includes(r.shared_by_email)
        );
        await Promise.all(toDelete.map((r) => base44.entities[entityName].delete(r.id)));
        if (toDelete.length > 0) log(`✓ Deleted ${toDelete.length} ${entityName} records`);
      } catch (e) {
        log(`⚠ Could not clear ${entityName}: ${e.message}`);
      }
    }
  }

  log("✓ All demo data cleared.");
}

// ─── UI ───────────────────────────────────────────────────────────────────────
export default function DemoSeed() {
  const [log, setLog] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | seeding | clearing | done | error
  const [currentUser, setCurrentUser] = useState(null);
  const [checked, setChecked] = useState(false);

  // Check auth + admin on mount
  useEffect(() => {
    base44.auth.me().then((me) => {
      setCurrentUser(me);
      setChecked(true);
    }).catch(() => setChecked(true));
  }, []);

  if (!checked) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin h-6 w-6 text-muted-foreground" />
      </div>
    );
  }

  if (!currentUser || currentUser.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3 px-6 text-center">
        <ShieldAlert className="h-10 w-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Admin access required.</p>
      </div>
    );
  }

  async function handleSeed() {
    setLog([]);
    setStatus("seeding");
    const logger = makeLogger(setLog);
    try {
      await runSeed(logger, currentUser);
      setStatus("done");
    } catch (e) {
      setLog((prev) => [...prev, `❌ Error: ${e.message}`]);
      setStatus("error");
    }
  }

  async function handleClear() {
    setLog([]);
    setStatus("clearing");
    const logger = makeLogger(setLog);
    try {
      await runClear(logger);
      setStatus("done");
    } catch (e) {
      setLog((prev) => [...prev, `❌ Error: ${e.message}`]);
      setStatus("error");
    }
  }

  const busy = status === "seeding" || status === "clearing";

  return (
    <div className="min-h-screen bg-background px-5 py-12 max-w-lg mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Sprout className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">Demo Data Seeder</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Seeds realistic mock users, trips, itineraries, expenses, polls, messages, and notifications for App Store screenshots.
          All demo records are tagged and can be wiped cleanly.
        </p>
      </div>

      <div className="flex gap-3 mb-6">
        <Button
          className="flex-1 rounded-full"
          onClick={handleSeed}
          disabled={busy}
        >
          {status === "seeding" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sprout className="h-4 w-4 mr-2" />}
          Seed Demo Data
        </Button>
        <Button
          variant="outline"
          className="flex-1 rounded-full"
          onClick={handleClear}
          disabled={busy}
        >
          {status === "clearing" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
          Clear Demo Data
        </Button>
      </div>

      {log.length > 0 && (
        <div className="bg-muted/40 rounded-2xl p-4 space-y-1.5 text-xs font-mono max-h-96 overflow-y-auto">
          {log.map((line, i) => (
            <div key={i} className={line.startsWith("❌") ? "text-destructive" : line.startsWith("🎉") ? "text-green-600 font-semibold" : "text-foreground/80"}>
              {line}
            </div>
          ))}
          {busy && <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> running…</div>}
          {status === "done" && !busy && (
            <div className="flex items-center gap-2 text-green-600 font-semibold pt-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Complete
            </div>
          )}
        </div>
      )}
    </div>
  );
}