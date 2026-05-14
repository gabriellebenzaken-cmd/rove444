import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Trash2, Sprout, CheckCircle2, Loader2, ShieldAlert } from "lucide-react";

// ─── Demo tag (for cleanup) ───────────────────────────────────────────────────
const DEMO_TAG = "__demo__";

// ─── JAPAN trip crew (6 people) ───────────────────────────────────────────────
const JAPAN_USERS = [
  {
    user_id: `${DEMO_TAG}kaito`,
    user_email: "kaito.nishimura@rove-demo.app",
    username: "kaitonishi",
    username_lower: "kaitonishi",
    full_name: "Kaito Nishimura",
    display_name: "Kaito",
    bio: "half japanese half chaos. cs major who can name every jrpg protagonist",
    profile_photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
    venmo: "@kaito-n",
    instagram: "kaitonishi",
  },
  {
    user_id: `${DEMO_TAG}zoe`,
    user_email: "zoe.park@rove-demo.app",
    username: "zoepark__",
    username_lower: "zoepark__",
    full_name: "Zoe Park",
    display_name: "Zoe",
    bio: "art history dropout turned content creator. obsessed with matcha",
    profile_photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
    venmo: "@zoe-park",
    instagram: "zoepark__",
    tiktok: "@zoepark__",
  },
  {
    user_id: `${DEMO_TAG}marcus`,
    user_email: "marcus.chen@rove-demo.app",
    username: "marcuschen",
    username_lower: "marcuschen",
    full_name: "Marcus Chen",
    display_name: "Marcus",
    bio: "finance bro with a soft spot for ramen and anime merch",
    profile_photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80",
    venmo: "@marcus-c",
    cashapp: "$marcusc",
  },
  {
    user_id: `${DEMO_TAG}priya`,
    user_email: "priya.sharma@rove-demo.app",
    username: "priyasharma",
    username_lower: "priyasharma",
    full_name: "Priya Sharma",
    display_name: "Priya",
    bio: "med student. i travel to cope. currently rotating through trauma",
    profile_photo: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&q=80",
    venmo: "@priya-s",
    instagram: "priyasharma",
  },
  {
    user_id: `${DEMO_TAG}alex`,
    user_email: "alex.rivers@rove-demo.app",
    username: "alexrivers",
    username_lower: "alexrivers",
    full_name: "Alex Rivers",
    display_name: "Alex",
    bio: "photographer + freelance videographer. always losing my lens cap",
    profile_photo: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=400&q=80",
    venmo: "@alex-riv",
    instagram: "alexrivers.photo",
  },
  {
    user_id: `${DEMO_TAG}mia`,
    user_email: "mia.tanaka@rove-demo.app",
    username: "miaxtan",
    username_lower: "miaxtan",
    full_name: "Mia Tanaka",
    display_name: "Mia",
    bio: "graphic design senior. my entire personality is studio ghibli",
    profile_photo: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&q=80",
    venmo: "@mia-tan",
    instagram: "miaxtan",
    tiktok: "@miaxtan",
  },
];

// ─── MIAMI trip crew (5 girls) ────────────────────────────────────────────────
const MIAMI_USERS = [
  {
    user_id: `${DEMO_TAG}jasmine`,
    user_email: "jasmine.wade@rove-demo.app",
    username: "jasminewade",
    username_lower: "jasminewade",
    full_name: "Jasmine Wade",
    display_name: "Jas",
    bio: "PR girlie in NYC. will be at every rooftop at golden hour",
    profile_photo: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&q=80",
    venmo: "@jasmine-w",
    instagram: "jasminewade",
    tiktok: "@jasminewade",
  },
  {
    user_id: `${DEMO_TAG}nina`,
    user_email: "nina.rodriguez@rove-demo.app",
    username: "ninarodz",
    username_lower: "ninarodz",
    full_name: "Nina Rodriguez",
    display_name: "Nina",
    bio: "fashion marketing. i dressed up to go to target and i regret nothing",
    profile_photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80",
    venmo: "@nina-rodz",
    instagram: "ninarodz",
  },
  {
    user_id: `${DEMO_TAG}chloe`,
    user_email: "chloe.kim@rove-demo.app",
    username: "chloekim",
    username_lower: "chloekim",
    full_name: "Chloe Kim",
    display_name: "Chloe",
    bio: "skincare obsessed. serial brunch attendee. iced matcha or i'm not here",
    profile_photo: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&q=80",
    venmo: "@chloe-k",
    cashapp: "$chloek",
    instagram: "chloekim",
  },
  {
    user_id: `${DEMO_TAG}amara`,
    user_email: "amara.osei@rove-demo.app",
    username: "amaraosei",
    username_lower: "amaraosei",
    full_name: "Amara Osei",
    display_name: "Amara",
    bio: "law student. hyper-organized. yes i already made a spreadsheet",
    profile_photo: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=400&q=80",
    venmo: "@amara-o",
    instagram: "amaraosei",
  },
  {
    user_id: `${DEMO_TAG}bri`,
    user_email: "bri.santos@rove-demo.app",
    username: "briellesantos",
    username_lower: "briellesantos",
    full_name: "Brielle Santos",
    display_name: "Bri",
    bio: "yoga teacher / certified hot mess. will recommend crystals unprompted",
    profile_photo: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80",
    venmo: "@bri-santos",
    instagram: "briellesantos",
    tiktok: "@briellesantos",
  },
];

// ─── FESTIVAL trip crew (10 people, large group chaos) ────────────────────────
const FEST_USERS = [
  {
    user_id: `${DEMO_TAG}jake`,
    user_email: "jake.morales@rove-demo.app",
    username: "jakemor",
    username_lower: "jakemor",
    full_name: "Jake Morales",
    display_name: "Jake",
    bio: "outdoor enthusiast. been to coachella 4x and still can't find the stage",
    profile_photo: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&q=80",
    venmo: "@jake-mor",
    cashapp: "$jakemor",
  },
  {
    user_id: `${DEMO_TAG}talia`,
    user_email: "talia.burns@rove-demo.app",
    username: "taliaburns",
    username_lower: "taliaburns",
    full_name: "Talia Burns",
    display_name: "Talia",
    bio: "event planner irl. takes charge even when nobody asked her to",
    profile_photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80",
    venmo: "@talia-b",
    instagram: "taliaburns",
  },
  {
    user_id: `${DEMO_TAG}dom`,
    user_email: "dom.walker@rove-demo.app",
    username: "domwalker",
    username_lower: "domwalker",
    full_name: "Dom Walker",
    display_name: "Dom",
    bio: "music nerd. knows every dj set time by heart. terrible at replying",
    profile_photo: "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=400&q=80",
    venmo: "@dom-walk",
    cashapp: "$domwalk",
  },
  {
    user_id: `${DEMO_TAG}lexi`,
    user_email: "lexi.hayes@rove-demo.app",
    username: "lexihayes",
    username_lower: "lexihayes",
    full_name: "Lexi Hayes",
    display_name: "Lexi",
    bio: "thrift queen. showed up to last festival in full cowboy fit no regrets",
    profile_photo: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&q=80",
    venmo: "@lexi-h",
    instagram: "lexihayes",
  },
  {
    user_id: `${DEMO_TAG}omar`,
    user_email: "omar.ali@rove-demo.app",
    username: "omarali",
    username_lower: "omarali",
    full_name: "Omar Ali",
    display_name: "Omar",
    bio: "software eng. will fix the aux cord and then disappear for 3 hours",
    profile_photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80",
    venmo: "@omar-ali",
    cashapp: "$omarali",
  },
  {
    user_id: `${DEMO_TAG}simone`,
    user_email: "simone.duval@rove-demo.app",
    username: "simoneduval",
    username_lower: "simoneduval",
    full_name: "Simone Duval",
    display_name: "Simone",
    bio: "french-american. here for the vibes and the merch table",
    profile_photo: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&q=80",
    venmo: "@simone-d",
    instagram: "simoneduval",
  },
  {
    user_id: `${DEMO_TAG}ryan`,
    user_email: "ryan.chang@rove-demo.app",
    username: "ryanchang",
    username_lower: "ryanchang",
    full_name: "Ryan Chang",
    display_name: "Ryan",
    bio: "always has snacks. never has cash. loves everyone",
    profile_photo: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=400&q=80",
    venmo: "@ryan-ch",
    cashapp: "$ryanchang",
  },
  {
    user_id: `${DEMO_TAG}kelsey`,
    user_email: "kelsey.moon@rove-demo.app",
    username: "kelseymoon",
    username_lower: "kelseymoon",
    full_name: "Kelsey Moon",
    display_name: "Kels",
    bio: "nursing student. will be the one carrying advil, sunscreen, and a portable charger",
    profile_photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80",
    venmo: "@kelsey-m",
    instagram: "kelseymoon",
  },
  {
    user_id: `${DEMO_TAG}theo`,
    user_email: "theo.vasquez@rove-demo.app",
    username: "theovas",
    username_lower: "theovas",
    full_name: "Theo Vasquez",
    display_name: "Theo",
    bio: "aspiring dj. sent the spotify playlist 4 months ago. still waiting",
    profile_photo: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&q=80",
    venmo: "@theo-v",
    cashapp: "$theov",
  },
  {
    user_id: `${DEMO_TAG}dana`,
    user_email: "dana.okafor@rove-demo.app",
    username: "danaokafor",
    username_lower: "danaokafor",
    full_name: "Dana Okafor",
    display_name: "Dana",
    bio: "film student. documents everything. the designated trip photographer",
    profile_photo: "https://images.unsplash.com/photo-1546961342-ea5f62d5a27b?w=400&q=80",
    venmo: "@dana-ok",
    instagram: "danaokafor",
    tiktok: "@danaokafor",
  },
];

const ALL_USERS = [...JAPAN_USERS, ...MIAMI_USERS, ...FEST_USERS];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const uByKey = (key) => ALL_USERS.find((x) => x.username_lower === key);
const em = (key) => uByKey(key)?.user_email;
const nm = (key) => uByKey(key)?.full_name;

function makeLogger(setLog) {
  return (msg) => setLog((prev) => [...prev, msg]);
}

// ─── Main seeder ─────────────────────────────────────────────────────────────
async function runSeed(log, me) {
  const myEmail = me.email;
  const myName = me.full_name || me.email.split("@")[0];

  // Check for existing demo data
  const existingProfiles = await base44.entities.UserProfile.filter({}, "-created_date", 200).catch(() => []);
  if (existingProfiles.some((p) => p.user_id?.startsWith(DEMO_TAG))) {
    throw new Error("Demo data already exists. Clear it first.");
  }

  // ── 1. UserProfiles ──────────────────────────────────────────────────────
  log("Creating UserProfiles…");
  await Promise.all(ALL_USERS.map((u) => base44.entities.UserProfile.create(u)));
  log(`✓ ${ALL_USERS.length} profiles created`);
  log(`✓ Seeding as ${myEmail}`);

  // ── 2. Trips ─────────────────────────────────────────────────────────────
  log("Creating Trips…");

  const japanMembers = [myEmail, em("kaitonishi"), em("zoepark__"), em("marcuschen"), em("priyasharma"), em("alexrivers"), em("miaxtan")];
  const miamiMembers = [myEmail, em("jasminewade"), em("ninarodz"), em("chloekim"), em("amaraosei"), em("briellesantos")];
  const festMembers  = [myEmail, em("jakemor"), em("taliaburns"), em("domwalker"), em("lexihayes"), em("omarali"), em("simoneduval"), em("ryanchang"), em("kelseymoon"), em("theovas"), em("danaokafor")];

  const tripJapan = await base44.entities.Trip.create({
    name: "japan summer 2026 🍜",
    destination: "Tokyo, Japan",
    description: "2 weeks, 3 cities, infinite convenience store snacks",
    start_date: "2026-07-10",
    end_date: "2026-07-24",
    admin_email: myEmail,
    member_emails: japanMembers,
    invite_code: `${DEMO_TAG}JAPAN26`,
    invite_active: true,
    cover_image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80",
    theme_color: "#E8426A",
  });

  const tripMiami = await base44.entities.Trip.create({
    name: "miami girls weekend 🌴",
    destination: "Miami, FL",
    description: "we deserve this honestly",
    start_date: "2026-06-13",
    end_date: "2026-06-16",
    admin_email: myEmail,
    member_emails: miamiMembers,
    invite_code: `${DEMO_TAG}MIAMI26`,
    invite_active: true,
    cover_image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
    theme_color: "#FF7A45",
  });

  const tripFest = await base44.entities.Trip.create({
    name: "desert fest 🎪",
    destination: "Indio, CA",
    description: "10 people, 1 airbnb, zero curfew",
    start_date: "2026-04-17",
    end_date: "2026-04-21",
    admin_email: myEmail,
    member_emails: festMembers,
    invite_code: `${DEMO_TAG}FEST26`,
    invite_active: false,
    cover_image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80",
    theme_color: "#7C3AED",
  });

  log(`✓ 3 trips created`);

  // ── 3. TripMembers ───────────────────────────────────────────────────────
  log("Creating TripMembers…");

  const japanTMs = [
    { trip_id: tripJapan.id, user_email: myEmail,            user_name: myName,             role: "admin",  status: "active" },
    { trip_id: tripJapan.id, user_email: em("kaitonishi"),   user_name: nm("kaitonishi"),   role: "member", status: "active",  invited_by_email: myEmail },
    { trip_id: tripJapan.id, user_email: em("zoepark__"),    user_name: nm("zoepark__"),    role: "member", status: "active",  invited_by_email: myEmail },
    { trip_id: tripJapan.id, user_email: em("marcuschen"),   user_name: nm("marcuschen"),   role: "member", status: "active",  invited_by_email: myEmail },
    { trip_id: tripJapan.id, user_email: em("priyasharma"),  user_name: nm("priyasharma"),  role: "member", status: "active",  invited_by_email: myEmail },
    { trip_id: tripJapan.id, user_email: em("alexrivers"),   user_name: nm("alexrivers"),   role: "member", status: "active",  invited_by_email: myEmail },
    { trip_id: tripJapan.id, user_email: em("miaxtan"),      user_name: nm("miaxtan"),      role: "member", status: "active",  invited_by_email: myEmail },
  ];

  const miamiTMs = [
    { trip_id: tripMiami.id, user_email: myEmail,            user_name: myName,             role: "admin",  status: "active" },
    { trip_id: tripMiami.id, user_email: em("jasminewade"),  user_name: nm("jasminewade"),  role: "member", status: "active",  invited_by_email: myEmail },
    { trip_id: tripMiami.id, user_email: em("ninarodz"),     user_name: nm("ninarodz"),     role: "member", status: "active",  invited_by_email: myEmail },
    { trip_id: tripMiami.id, user_email: em("chloekim"),     user_name: nm("chloekim"),     role: "member", status: "active",  invited_by_email: myEmail },
    { trip_id: tripMiami.id, user_email: em("amaraosei"),    user_name: nm("amaraosei"),    role: "member", status: "active",  invited_by_email: myEmail },
    { trip_id: tripMiami.id, user_email: em("briellesantos"),user_name: nm("briellesantos"),role: "member", status: "invited", invited_by_email: myEmail },
  ];

  const festTMs = [
    { trip_id: tripFest.id, user_email: myEmail,             user_name: myName,             role: "admin",  status: "active" },
    { trip_id: tripFest.id, user_email: em("jakemor"),       user_name: nm("jakemor"),      role: "member", status: "active",  invited_by_email: myEmail },
    { trip_id: tripFest.id, user_email: em("taliaburns"),    user_name: nm("taliaburns"),   role: "member", status: "active",  invited_by_email: myEmail },
    { trip_id: tripFest.id, user_email: em("domwalker"),     user_name: nm("domwalker"),    role: "member", status: "active",  invited_by_email: myEmail },
    { trip_id: tripFest.id, user_email: em("lexihayes"),     user_name: nm("lexihayes"),    role: "member", status: "active",  invited_by_email: myEmail },
    { trip_id: tripFest.id, user_email: em("omarali"),       user_name: nm("omarali"),      role: "member", status: "active",  invited_by_email: myEmail },
    { trip_id: tripFest.id, user_email: em("simoneduval"),   user_name: nm("simoneduval"),  role: "member", status: "active",  invited_by_email: myEmail },
    { trip_id: tripFest.id, user_email: em("ryanchang"),     user_name: nm("ryanchang"),    role: "member", status: "active",  invited_by_email: myEmail },
    { trip_id: tripFest.id, user_email: em("kelseymoon"),    user_name: nm("kelseymoon"),   role: "member", status: "active",  invited_by_email: myEmail },
    { trip_id: tripFest.id, user_email: em("theovas"),       user_name: nm("theovas"),      role: "member", status: "active",  invited_by_email: myEmail },
    { trip_id: tripFest.id, user_email: em("danaokafor"),    user_name: nm("danaokafor"),   role: "member", status: "active",  invited_by_email: myEmail },
  ];

  const allTMs = [...japanTMs, ...miamiTMs, ...festTMs];
  await Promise.all(allTMs.map((r) => base44.entities.TripMember.create(r)));
  log(`✓ ${allTMs.length} TripMembers created`);

  // ── 4. Arrivals ──────────────────────────────────────────────────────────
  log("Creating Arrivals…");
  const arrivalRecords = [
    { trip_id: tripJapan.id, user_email: em("kaitonishi"),  user_name: nm("kaitonishi"),  travel_type: "Flight", is_round_trip: true,  arrival_location: "LAX", destination: "NRT", arrival_date: "2026-07-10", arrival_time: "15:30", departure_date: "2026-07-24", departure_time: "18:00", airline: "ANA",     outbound_flight_number: "NH175",  return_flight_number: "NH176" },
    { trip_id: tripJapan.id, user_email: em("zoepark__"),   user_name: nm("zoepark__"),   travel_type: "Flight", is_round_trip: true,  arrival_location: "JFK", destination: "NRT", arrival_date: "2026-07-10", arrival_time: "16:15", departure_date: "2026-07-24", departure_time: "20:00", airline: "JAL",     outbound_flight_number: "JL5",    return_flight_number: "JL6" },
    { trip_id: tripJapan.id, user_email: em("marcuschen"),  user_name: nm("marcuschen"),  travel_type: "Flight", is_round_trip: true,  arrival_location: "ORD", destination: "NRT", arrival_date: "2026-07-10", arrival_time: "17:00", departure_date: "2026-07-24", departure_time: "17:00", airline: "United",  outbound_flight_number: "UA837",  return_flight_number: "UA838" },
    { trip_id: tripJapan.id, user_email: em("priyasharma"), user_name: nm("priyasharma"), travel_type: "Flight", is_round_trip: true,  arrival_location: "BOS", destination: "NRT", arrival_date: "2026-07-11", arrival_time: "08:00", departure_date: "2026-07-24", departure_time: "21:00", airline: "JAL",     outbound_flight_number: "JL7",    return_flight_number: "JL8" },
    { trip_id: tripJapan.id, user_email: em("alexrivers"),  user_name: nm("alexrivers"),  travel_type: "Flight", is_round_trip: true,  arrival_location: "SFO", destination: "NRT", arrival_date: "2026-07-10", arrival_time: "13:45", departure_date: "2026-07-25", departure_time: "11:00", airline: "ANA",     outbound_flight_number: "NH1",    return_flight_number: "NH2" },
    { trip_id: tripMiami.id, user_email: em("jasminewade"), user_name: nm("jasminewade"), travel_type: "Flight", is_round_trip: true,  arrival_location: "JFK", destination: "MIA", arrival_date: "2026-06-13", arrival_time: "10:30", departure_date: "2026-06-16", departure_time: "19:00", airline: "JetBlue", outbound_flight_number: "B6421",  return_flight_number: "B6422" },
    { trip_id: tripMiami.id, user_email: em("amaraosei"),   user_name: nm("amaraosei"),   travel_type: "Flight", is_round_trip: true,  arrival_location: "ATL", destination: "MIA", arrival_date: "2026-06-13", arrival_time: "11:15", departure_date: "2026-06-16", departure_time: "20:30", airline: "Delta",   outbound_flight_number: "DL403",  return_flight_number: "DL404" },
    { trip_id: tripFest.id,  user_email: em("jakemor"),     user_name: nm("jakemor"),     travel_type: "Driving", is_round_trip: true, arrival_location: "Los Angeles, CA", destination: "Indio, CA", arrival_date: "2026-04-17", arrival_time: "14:00" },
    { trip_id: tripFest.id,  user_email: em("taliaburns"),  user_name: nm("taliaburns"),  travel_type: "Flight", is_round_trip: true,  arrival_location: "SFO", destination: "PSP", arrival_date: "2026-04-17", arrival_time: "12:30", departure_date: "2026-04-21", departure_time: "16:00", airline: "Southwest", outbound_flight_number: "WN2210", return_flight_number: "WN2211" },
  ];
  await Promise.all(arrivalRecords.map((r) => base44.entities.Arrival.create(r)));
  log(`✓ ${arrivalRecords.length} Arrivals created`);

  // ── 5. Lodging ───────────────────────────────────────────────────────────
  log("Creating Lodging…");
  const lodgingRecords = [
    { trip_id: tripJapan.id, name: "Wise Owl Hostels Tokyo", address: "2-23-8 Kabukicho, Shinjuku, Tokyo", price_per_night: 42, check_in: "2026-07-10", check_out: "2026-07-15", notes: "Capsule dorms. Lockers for valuables. 24hr convenience store literally attached", guest_emails: japanMembers },
    { trip_id: tripJapan.id, name: "Kyoto Machiya Townhouse", address: "Higashiyama, Kyoto", price_per_night: 110, check_in: "2026-07-15", check_out: "2026-07-19", notes: "Traditional machiya. Shoes off at the door!! Tatami rooms. Tiny but perfect", guest_emails: japanMembers },
    { trip_id: tripJapan.id, name: "Dormy Inn Namba Osaka", address: "1-4-6 Motomachi, Naniwa, Osaka", price_per_night: 58, check_in: "2026-07-19", check_out: "2026-07-24", notes: "Free ramen at midnight. Yes really. Game changer.", guest_emails: japanMembers },
    { trip_id: tripMiami.id, name: "Airbnb – South Beach Apt", address: "1130 Collins Ave, Miami Beach, FL", price_per_night: 285, check_in: "2026-06-13", check_out: "2026-06-16", notes: "2BR 2BA. Amara has the code. DO NOT lose the parking pass", guest_emails: miamiMembers },
    { trip_id: tripFest.id,  name: "Airbnb – Desert Compound", address: "47600 Eisenhower Dr, La Quinta, CA", price_per_night: 650, check_in: "2026-04-17", check_out: "2026-04-21", notes: "4 beds, pool, outdoor firepit. Jake's on the pullout. sorryyyyy", guest_emails: festMembers },
  ];
  await Promise.all(lodgingRecords.map((r) => base44.entities.Lodging.create(r)));
  log(`✓ ${lodgingRecords.length} Lodging records created`);

  // ── 6. Itinerary ─────────────────────────────────────────────────────────
  log("Creating ItineraryItems…");
  const itinRecordsClean = [
    { trip_id: tripJapan.id, date: "2026-07-10", time: "18:00", title: "arrive + 7-eleven run 🏪", location: "Shinjuku, Tokyo", notes: "everyone needs their onigiri moment. this is the ritual", is_required: true },
    { trip_id: tripJapan.id, date: "2026-07-11", time: "09:00", title: "Shibuya crossing + brunch", location: "Shibuya, Tokyo", notes: "get there early before it gets too chaotic. Eggs 'n Things for brunch", is_required: false },
    { trip_id: tripJapan.id, date: "2026-07-11", time: "14:00", title: "Harajuku – Takeshita St shopping", location: "Harajuku, Tokyo", notes: "Mia's been waiting for this literally all year. budget accordingly", is_required: false },
    { trip_id: tripJapan.id, date: "2026-07-11", time: "19:00", title: "Ichiran ramen (solo booth edition)", location: "Shibuya, Tokyo", notes: "single-person ramen booths. iconic. no talking required", is_required: true },
    { trip_id: tripJapan.id, date: "2026-07-12", time: "10:00", title: "teamLab Planets 🎨", location: "Toyosu, Tokyo", notes: "BOOK TICKETS AHEAD. sold out constantly. goes barefoot btw", is_required: true },
    { trip_id: tripJapan.id, date: "2026-07-12", time: "20:00", title: "Golden Gai bar hop 🍻", location: "Shinjuku, Tokyo", notes: "tiny bars, max 8 people each. Kaito knows the good ones", is_required: false },
    { trip_id: tripJapan.id, date: "2026-07-13", time: "11:00", title: "Akihabara anime merch hunt", location: "Akihabara, Tokyo", notes: "Marcus and Mia have been training for this. send help", is_required: false },
    { trip_id: tripJapan.id, date: "2026-07-13", time: "16:00", title: "maid cafe experience ☕", location: "Akihabara, Tokyo", notes: "pick one with good reviews. Kaito is required to participate", is_required: false },
    { trip_id: tripJapan.id, date: "2026-07-14", time: "09:00", title: "Tsukiji outer market sushi 🐟", location: "Tsukiji, Tokyo", notes: "go early before it sells out. omakase counter if budget allows", is_required: true },
    { trip_id: tripJapan.id, date: "2026-07-14", time: "21:00", title: "karaoke night 🎤", location: "Shinjuku, Tokyo", notes: "Big Echo has private rooms. 2 hour min. Marcus will do his thing", is_required: true },
    { trip_id: tripJapan.id, date: "2026-07-15", time: "07:00", title: "Fushimi Inari (early morning!)", location: "Fushimi, Kyoto", notes: "go at sunrise. by 9am it's packed. worth the early alarm", is_required: true },
    { trip_id: tripJapan.id, date: "2026-07-15", time: "14:00", title: "Arashiyama bamboo grove 🎋", location: "Arashiyama, Kyoto", notes: "rent bikes to get there. Tenryu-ji garden right next door", is_required: false },
    { trip_id: tripJapan.id, date: "2026-07-16", time: "10:00", title: "Nishiki Market food crawl", location: "Nishiki, Kyoto", notes: "octopus skewers, matcha mochi, pickles. Zoe will document all of it", is_required: false },
    { trip_id: tripJapan.id, date: "2026-07-16", time: "15:00", title: "Gion evening walk 🏮", location: "Gion, Kyoto", notes: "geisha district. cobblestones. golden hour is unreal here", is_required: false },
    { trip_id: tripJapan.id, date: "2026-07-17", time: "11:00", title: "matcha making class 🍵", location: "Uji, Kyoto", notes: "booked for 6 people. dress casual, they give you the apron", is_required: true },
    { trip_id: tripJapan.id, date: "2026-07-18", time: "19:00", title: "yakiniku dinner 🥩", location: "Gion, Kyoto", notes: "everyone grills their own. Priya's turn to pick the cuts", is_required: true },
    { trip_id: tripJapan.id, date: "2026-07-19", time: "12:00", title: "arrive Osaka + Dotonbori 🦀", location: "Dotonbori, Osaka", notes: "takoyaki, okonomiyaki, crepes. eat everything. no exceptions", is_required: true },
    { trip_id: tripJapan.id, date: "2026-07-20", time: "10:00", title: "Osaka Castle", location: "Chuo, Osaka", notes: "museum is cool but the park is better. bring a picnic", is_required: false },
    { trip_id: tripJapan.id, date: "2026-07-20", time: "20:00", title: "Osaka nightlife – Amerika-Mura", location: "Shinsaibashi, Osaka", notes: "club district. Kaito has the lineup", is_required: false },
    { trip_id: tripJapan.id, date: "2026-07-21", time: "09:00", title: "Nara day trip – deer park 🦌", location: "Nara, Japan", notes: "40 min from Osaka by train. buy the deer crackers. you WILL get surrounded", is_required: false },
    { trip_id: tripJapan.id, date: "2026-07-22", time: "14:00", title: "Kuromon Market + last grocery haul", location: "Nipponbashi, Osaka", notes: "fresh wagyu, fruit, snacks for the flight. go big", is_required: false },
    { trip_id: tripJapan.id, date: "2026-07-23", time: "19:00", title: "last night dinner – kaiseki 🍱", location: "Osaka", notes: "splurge dinner. Alex is making the trip reel, we need a nice end shot", is_required: true },
    // MIAMI
    { trip_id: tripMiami.id, date: "2026-06-13", time: "14:00", title: "check in + pool time 🏊", location: "South Beach Airbnb", notes: "Amara will have the door code. let's not lose the parking pass this time", is_required: true },
    { trip_id: tripMiami.id, date: "2026-06-13", time: "19:30", title: "dinner – Carbone Miami", location: "1 Hotel South Beach", notes: "reservation under Jasmine. dress cute, they judge you at the door", is_required: true },
    { trip_id: tripMiami.id, date: "2026-06-14", time: "10:00", title: "Zuma brunch 🍾", location: "Epic Hotel, Miami", notes: "bottomless brunch. Nina already confirmed. Bri is bringing the selfie stick", is_required: true },
    { trip_id: tripMiami.id, date: "2026-06-14", time: "14:00", title: "beach day – South Beach 🌊", location: "South Beach, Miami", notes: "someone pls bring a bluetooth speaker. Chloe has the beach towels", is_required: false },
    { trip_id: tripMiami.id, date: "2026-06-14", time: "21:00", title: "LIV nightclub 🎉", location: "Fontainebleau Hotel", notes: "table booked. split between 5. wear something cute", is_required: true },
    { trip_id: tripMiami.id, date: "2026-06-15", time: "11:00", title: "Wynwood Walls + coffee 🎨", location: "Wynwood, Miami", notes: "murals everywhere. Jas and Nina will be here all day for content", is_required: false },
    { trip_id: tripMiami.id, date: "2026-06-15", time: "17:00", title: "sunset beach picnic 🌅", location: "South Pointe Park, Miami", notes: "bring wine + snacks. golden hour for the camera roll", is_required: false },
    { trip_id: tripMiami.id, date: "2026-06-16", time: "10:00", title: "last brunch + check out", location: "Café La Trova", notes: "iconic cuban spot. get the croquetas. then cab to airport", is_required: true },
    // FESTIVAL
    { trip_id: tripFest.id, date: "2026-04-17", time: "16:00", title: "arrive + airbnb setup 🏠", location: "La Quinta, CA", notes: "Talia has a chore chart don't laugh at her. she's right to have one", is_required: true },
    { trip_id: tripFest.id, date: "2026-04-17", time: "19:00", title: "Target run + grocery haul", location: "Palm Desert, CA", notes: "pool noodles, sunscreen, electrolytes, snacks. Jake is NOT in charge of the list", is_required: true },
    { trip_id: tripFest.id, date: "2026-04-18", time: "14:00", title: "day 1 – festival gates open 🎶", location: "Empire Polo Club, Indio", notes: "Dom has the lineup printed out. meeting at art installations at 3pm no matter what", is_required: true },
    { trip_id: tripFest.id, date: "2026-04-18", time: "20:00", title: "headliner night 1 🎵", location: "Main Stage, Empire Polo Club", notes: "everyone together for this one. pre-game at the airbnb at 6", is_required: true },
    { trip_id: tripFest.id, date: "2026-04-19", time: "10:00", title: "recovery brunch + pool day ☀️", location: "Airbnb – La Quinta", notes: "Kelsey is making eggs. someone bring Advil. pool floaties in the garage", is_required: false },
    { trip_id: tripFest.id, date: "2026-04-19", time: "16:00", title: "day 2 – festival afternoon sets", location: "Empire Polo Club, Indio", notes: "split into groups if you want. text the group chat location updates", is_required: false },
    { trip_id: tripFest.id, date: "2026-04-19", time: "23:30", title: "late night In-N-Out run 🍔", location: "In-N-Out Palm Desert", notes: "animal style everything. Ryan is paying, everyone venmo him after", is_required: false },
    { trip_id: tripFest.id, date: "2026-04-20", time: "15:00", title: "day 3 – final day 🙌", location: "Empire Polo Club, Indio", notes: "merch table run first. get your stuff before it sells out", is_required: true },
    { trip_id: tripFest.id, date: "2026-04-21", time: "10:00", title: "pack up + clean airbnb", location: "La Quinta, CA", notes: "talia made a cleaning checklist. just do it. security deposit is $500", is_required: true },
  ];
  await Promise.all(itinRecordsClean.map((r) => base44.entities.ItineraryItem.create(r)));
  log(`✓ ${itinRecordsClean.length} ItineraryItems created`);

  // ── 7. Expenses ──────────────────────────────────────────────────────────
  log("Creating Expenses…");

  const jAll = japanMembers;

  const expenseRecords = [
    // JAPAN
    { trip_id: tripJapan.id, description: "Tokyo hostel – 5 nights (Wise Owl)", amount: 1470, paid_by: em("marcuschen"), paid_by_name: nm("marcuschen"), split_among: jAll, category: "lodging", trip_wide: true, is_settled: false },
    { trip_id: tripJapan.id, description: "Kyoto machiya – 4 nights", amount: 3080, paid_by: em("kaitonishi"), paid_by_name: nm("kaitonishi"), split_among: jAll, category: "lodging", trip_wide: true, is_settled: false },
    { trip_id: tripJapan.id, description: "Osaka Dormy Inn – 5 nights", amount: 2030, paid_by: em("zoepark__"), paid_by_name: nm("zoepark__"), split_among: jAll, category: "lodging", trip_wide: true, is_settled: false },
    { trip_id: tripJapan.id, description: "JR Pass – 14-day (all 7)", amount: 2338, paid_by: em("marcuschen"), paid_by_name: nm("marcuschen"), split_among: jAll, category: "transport", trip_wide: true, is_settled: false },
    { trip_id: tripJapan.id, description: "teamLab Planets tickets", amount: 196, paid_by: em("zoepark__"), paid_by_name: nm("zoepark__"), split_among: jAll, category: "activity", trip_wide: false, day_number: 3, is_settled: false },
    { trip_id: tripJapan.id, description: "Tsukiji omakase counter", amount: 343, paid_by: em("alexrivers"), paid_by_name: nm("alexrivers"), split_among: jAll, category: "food", trip_wide: false, day_number: 5, is_settled: false },
    { trip_id: tripJapan.id, description: "karaoke – Big Echo 2hrs", amount: 112, paid_by: em("kaitonishi"), paid_by_name: nm("kaitonishi"), split_among: jAll, category: "activity", trip_wide: false, day_number: 5, is_settled: false },
    { trip_id: tripJapan.id, description: "matcha ceremony class – Uji", amount: 168, paid_by: em("priyasharma"), paid_by_name: nm("priyasharma"), split_among: jAll, category: "activity", trip_wide: false, day_number: 8, is_settled: false },
    { trip_id: tripJapan.id, description: "yakiniku group dinner Kyoto", amount: 252, paid_by: em("miaxtan"), paid_by_name: nm("miaxtan"), split_among: jAll, category: "food", trip_wide: false, day_number: 9, is_settled: false },
    { trip_id: tripJapan.id, description: "Nara deer park + train", amount: 98, paid_by: em("kaitonishi"), paid_by_name: nm("kaitonishi"), split_among: jAll, category: "activity", trip_wide: false, day_number: 12, is_settled: false },
    { trip_id: tripJapan.id, description: "kaiseki last night dinner", amount: 490, paid_by: em("alexrivers"), paid_by_name: nm("alexrivers"), split_among: jAll, category: "food", trip_wide: false, day_number: 14, is_settled: false },
    { trip_id: tripJapan.id, description: "convenience store runs (tracked separately)", amount: 84, paid_by: em("zoepark__"), paid_by_name: nm("zoepark__"), split_among: [em("zoepark__"), em("miaxtan"), em("priyasharma")], category: "food", trip_wide: false, day_number: 2, is_settled: true, settlement_notes: "settled in cash day 3" },

    // MIAMI
    { trip_id: tripMiami.id, description: "South Beach Airbnb – 3 nights", amount: 855, paid_by: em("amaraosei"), paid_by_name: nm("amaraosei"), split_among: miamiMembers, category: "lodging", trip_wide: true, is_settled: false },
    { trip_id: tripMiami.id, description: "Carbone dinner", amount: 380, paid_by: em("jasminewade"), paid_by_name: nm("jasminewade"), split_among: miamiMembers, category: "food", trip_wide: false, day_number: 1, is_settled: false },
    { trip_id: tripMiami.id, description: "Zuma bottomless brunch", amount: 425, paid_by: em("ninarodz"), paid_by_name: nm("ninarodz"), split_among: miamiMembers, category: "food", trip_wide: false, day_number: 2, is_settled: false },
    { trip_id: tripMiami.id, description: "LIV table split", amount: 600, paid_by: em("jasminewade"), paid_by_name: nm("jasminewade"), split_among: miamiMembers, category: "activity", trip_wide: false, day_number: 2, is_settled: false },
    { trip_id: tripMiami.id, description: "Uber pool – airport to airbnb", amount: 42, paid_by: em("chloekim"), paid_by_name: nm("chloekim"), split_among: miamiMembers, category: "transport", trip_wide: false, day_number: 1, is_settled: true, settlement_notes: "everyone paid Chloe back via Venmo" },
    { trip_id: tripMiami.id, description: "Wynwood iced coffees", amount: 37, paid_by: em("briellesantos"), paid_by_name: nm("briellesantos"), split_among: [em("briellesantos"), em("jasminewade"), em("ninarodz")], category: "food", trip_wide: false, day_number: 3, is_settled: false },
    { trip_id: tripMiami.id, description: "Sunscreen + beach supplies – CVS", amount: 64, paid_by: em("chloekim"), paid_by_name: nm("chloekim"), split_among: miamiMembers, category: "other", trip_wide: false, day_number: 2, is_settled: false },
    { trip_id: tripMiami.id, description: "Cuban brunch – La Trova", amount: 148, paid_by: em("amaraosei"), paid_by_name: nm("amaraosei"), split_among: miamiMembers, category: "food", trip_wide: false, day_number: 4, is_settled: false },

    // FESTIVAL – deliberately messy with overlapping debts
    { trip_id: tripFest.id, description: "Airbnb La Quinta – 4 nights", amount: 2600, paid_by: em("taliaburns"), paid_by_name: nm("taliaburns"), split_among: festMembers, category: "lodging", trip_wide: true, is_settled: false },
    { trip_id: tripFest.id, description: "Festival passes – all 10 (3-day)", amount: 4750, paid_by: em("jakemor"), paid_by_name: nm("jakemor"), split_among: festMembers, category: "activity", trip_wide: true, is_settled: false },
    { trip_id: tripFest.id, description: "Parking pass (car 1)", amount: 125, paid_by: em("jakemor"), paid_by_name: nm("jakemor"), split_among: [em("jakemor"), em("omarali"), em("ryanchang"), em("danaokafor")], category: "transport", trip_wide: false, day_number: 1, is_settled: false },
    { trip_id: tripFest.id, description: "Parking pass (car 2)", amount: 125, paid_by: em("taliaburns"), paid_by_name: nm("taliaburns"), split_among: [em("taliaburns"), em("simoneduval"), em("kelseymoon"), em("theovas"), em("lexihayes")], category: "transport", trip_wide: false, day_number: 1, is_settled: false },
    { trip_id: tripFest.id, description: "Target run – supplies, booze, snacks", amount: 387, paid_by: em("domwalker"), paid_by_name: nm("domwalker"), split_among: festMembers, category: "other", trip_wide: false, day_number: 1, is_settled: false },
    { trip_id: tripFest.id, description: "Uber XL day 1 (airport to airbnb)", amount: 94, paid_by: em("taliaburns"), paid_by_name: nm("taliaburns"), split_among: [em("taliaburns"), em("simoneduval"), em("kelseymoon"), em("theovas"), em("lexihayes")], category: "transport", trip_wide: false, day_number: 1, is_settled: false },
    { trip_id: tripFest.id, description: "In-N-Out run – night 2", amount: 112, paid_by: em("ryanchang"), paid_by_name: nm("ryanchang"), split_among: festMembers, category: "food", trip_wide: false, day_number: 3, is_settled: false },
    { trip_id: tripFest.id, description: "Merch – group buy (hoodies + hats)", amount: 520, paid_by: em("danaokafor"), paid_by_name: nm("danaokafor"), split_among: [em("danaokafor"), em("lexihayes"), em("simoneduval"), em("kelseymoon"), em("theovas")], category: "shopping", trip_wide: false, day_number: 4, is_settled: false },
    { trip_id: tripFest.id, description: "Chipotle lunch run", amount: 89, paid_by: em("omarali"), paid_by_name: nm("omarali"), split_among: [em("omarali"), em("jakemor"), em("domwalker"), em("ryanchang")], category: "food", trip_wide: false, day_number: 2, is_settled: true, settlement_notes: "Jake paid Omar back $22" },
    { trip_id: tripFest.id, description: "Gas – both cars", amount: 148, paid_by: em("jakemor"), paid_by_name: nm("jakemor"), split_among: festMembers, category: "transport", trip_wide: false, day_number: 1, is_settled: false },
    { trip_id: tripFest.id, description: "Sunscreen, Advil, charger cables – CVS", amount: 76, paid_by: em("kelseymoon"), paid_by_name: nm("kelseymoon"), split_among: festMembers, category: "other", trip_wide: false, day_number: 1, is_settled: false },
  ];
  await Promise.all(expenseRecords.map((r) => base44.entities.Expense.create(r)));
  log(`✓ ${expenseRecords.length} Expenses created`);

  // ── 8. Payments (festival – messy settle-up) ──────────────────────────────
  log("Creating Payments…");
  // Fetch the festival pass and airbnb expenses to reference
  const allExpenses = await base44.entities.Expense.filter({ trip_id: tripFest.id }, "-created_date", 50);
  const airbnbExp = allExpenses.find(e => e.description.includes("Airbnb La Quinta"));
  const passExp   = allExpenses.find(e => e.description.includes("Festival passes"));
  const targetExp = allExpenses.find(e => e.description.includes("Target run"));

  const paymentRecords = [];
  if (airbnbExp) {
    const share = Math.round(2600 / festMembers.length);
    paymentRecords.push(
      { expense_id: airbnbExp.id, trip_id: tripFest.id, sender_email: em("domwalker"),   sender_name: nm("domwalker"),   receiver_email: em("taliaburns"), receiver_name: nm("taliaburns"), amount: share, payment_method: "venmo",   status: "confirmed" },
      { expense_id: airbnbExp.id, trip_id: tripFest.id, sender_email: em("ryanchang"),   sender_name: nm("ryanchang"),   receiver_email: em("taliaburns"), receiver_name: nm("taliaburns"), amount: share, payment_method: "cashapp", status: "pending" },
      { expense_id: airbnbExp.id, trip_id: tripFest.id, sender_email: em("omarali"),     sender_name: nm("omarali"),     receiver_email: em("taliaburns"), receiver_name: nm("taliaburns"), amount: share, payment_method: "venmo",   status: "unpaid" },
      { expense_id: airbnbExp.id, trip_id: tripFest.id, sender_email: em("theovas"),     sender_name: nm("theovas"),     receiver_email: em("taliaburns"), receiver_name: nm("taliaburns"), amount: share, payment_method: "cashapp", status: "unpaid" },
      { expense_id: airbnbExp.id, trip_id: tripFest.id, sender_email: em("lexihayes"),   sender_name: nm("lexihayes"),   receiver_email: em("taliaburns"), receiver_name: nm("taliaburns"), amount: share, payment_method: "venmo",   status: "confirmed" },
    );
  }
  if (passExp) {
    const share = Math.round(4750 / festMembers.length);
    paymentRecords.push(
      { expense_id: passExp.id, trip_id: tripFest.id, sender_email: em("simoneduval"),  sender_name: nm("simoneduval"),  receiver_email: em("jakemor"), receiver_name: nm("jakemor"), amount: share, payment_method: "venmo",   status: "confirmed" },
      { expense_id: passExp.id, trip_id: tripFest.id, sender_email: em("kelseymoon"),   sender_name: nm("kelseymoon"),   receiver_email: em("jakemor"), receiver_name: nm("jakemor"), amount: share, payment_method: "venmo",   status: "confirmed" },
      { expense_id: passExp.id, trip_id: tripFest.id, sender_email: em("danaokafor"),   sender_name: nm("danaokafor"),   receiver_email: em("jakemor"), receiver_name: nm("jakemor"), amount: share, payment_method: "cashapp", status: "pending" },
      { expense_id: passExp.id, trip_id: tripFest.id, sender_email: em("ryanchang"),    sender_name: nm("ryanchang"),    receiver_email: em("jakemor"), receiver_name: nm("jakemor"), amount: share, payment_method: "cashapp", status: "unpaid" },
      { expense_id: passExp.id, trip_id: tripFest.id, sender_email: em("theovas"),      sender_name: nm("theovas"),      receiver_email: em("jakemor"), receiver_name: nm("jakemor"), amount: share, payment_method: "venmo",   status: "unpaid" },
    );
  }
  if (targetExp) {
    const share = Math.round(387 / festMembers.length);
    paymentRecords.push(
      { expense_id: targetExp.id, trip_id: tripFest.id, sender_email: em("lexihayes"),  sender_name: nm("lexihayes"),  receiver_email: em("domwalker"), receiver_name: nm("domwalker"), amount: share, payment_method: "venmo", status: "confirmed" },
      { expense_id: targetExp.id, trip_id: tripFest.id, sender_email: em("omarali"),    sender_name: nm("omarali"),    receiver_email: em("domwalker"), receiver_name: nm("domwalker"), amount: share, payment_method: "venmo", status: "pending" },
    );
  }
  if (paymentRecords.length > 0) {
    await Promise.all(paymentRecords.map((r) => base44.entities.Payment.create(r)));
  }
  log(`✓ ${paymentRecords.length} Payments created`);

  // ── 9. Polls ─────────────────────────────────────────────────────────────
  log("Creating Polls…");

  const pollJ1 = await base44.entities.TripPoll.create({ trip_id: tripJapan.id, question: "how many days in each city??", options: ["7 Tokyo / 4 Kyoto / 3 Osaka", "5 Tokyo / 5 Kyoto / 4 Osaka", "6 Tokyo / 3 Kyoto / 5 Osaka"], created_by_email: em("kaitonishi"), created_by_name: nm("kaitonishi"), is_closed: true });
  const pollJ2 = await base44.entities.TripPoll.create({ trip_id: tripJapan.id, question: "team capsule hostel or separate hotel rooms??", options: ["capsule all the way (save money)", "hotel rooms pls i need sleep", "split it – hostel tokyo, hotel kyoto+osaka"], created_by_email: em("marcuschen"), created_by_name: nm("marcuschen"), is_closed: true });
  const pollJ3 = await base44.entities.TripPoll.create({ trip_id: tripJapan.id, question: "last night in osaka – big splurge dinner or street food crawl?", options: ["splurge dinner (kaiseki omakase)", "street food crawl in dotonbori", "both lol (dinner early, street food late)"], created_by_email: em("priyasharma"), created_by_name: nm("priyasharma"), is_closed: false });

  const pollM1 = await base44.entities.TripPoll.create({ trip_id: tripMiami.id, question: "brunch day 2 – where??", options: ["Zuma (bougie but worth it)", "Yardbird (comfort food)", "La Mar (peruvian vibes)"], created_by_email: em("jasminewade"), created_by_name: nm("jasminewade"), is_closed: true });
  const pollM2 = await base44.entities.TripPoll.create({ trip_id: tripMiami.id, question: "beach club or house party for Saturday night?", options: ["LIV at Fontainebleau", "club space downtown", "airbnb pregame then decide"], created_by_email: em("ninarodz"), created_by_name: nm("ninarodz"), is_closed: false });

  const pollF1 = await base44.entities.TripPoll.create({ trip_id: tripFest.id, question: "who's driving car 2??", options: ["Jake volunteers", "Talia (she already said yes sort of)", "rent a 3rd car"], created_by_email: em("taliaburns"), created_by_name: nm("taliaburns"), is_closed: true });
  const pollF2 = await base44.entities.TripPoll.create({ trip_id: tripFest.id, question: "recovery day 2 morning plan?", options: ["pool + do nothing", "drive to Joshua Tree", "brunch spot + afternoon set"], created_by_email: em("domwalker"), created_by_name: nm("domwalker"), is_closed: false });

  const voteRecords = [
    { poll_id: pollJ1.id, trip_id: tripJapan.id, voter_email: em("kaitonishi"),  voter_name: nm("kaitonishi"),  option_index: 0 },
    { poll_id: pollJ1.id, trip_id: tripJapan.id, voter_email: em("zoepark__"),   voter_name: nm("zoepark__"),   option_index: 0 },
    { poll_id: pollJ1.id, trip_id: tripJapan.id, voter_email: em("marcuschen"),  voter_name: nm("marcuschen"),  option_index: 2 },
    { poll_id: pollJ1.id, trip_id: tripJapan.id, voter_email: em("priyasharma"), voter_name: nm("priyasharma"), option_index: 0 },
    { poll_id: pollJ1.id, trip_id: tripJapan.id, voter_email: em("alexrivers"),  voter_name: nm("alexrivers"),  option_index: 1 },
    { poll_id: pollJ1.id, trip_id: tripJapan.id, voter_email: em("miaxtan"),     voter_name: nm("miaxtan"),     option_index: 0 },

    { poll_id: pollJ2.id, trip_id: tripJapan.id, voter_email: em("kaitonishi"),  voter_name: nm("kaitonishi"),  option_index: 2 },
    { poll_id: pollJ2.id, trip_id: tripJapan.id, voter_email: em("zoepark__"),   voter_name: nm("zoepark__"),   option_index: 0 },
    { poll_id: pollJ2.id, trip_id: tripJapan.id, voter_email: em("marcuschen"),  voter_name: nm("marcuschen"),  option_index: 1 },
    { poll_id: pollJ2.id, trip_id: tripJapan.id, voter_email: em("priyasharma"), voter_name: nm("priyasharma"), option_index: 2 },

    { poll_id: pollJ3.id, trip_id: tripJapan.id, voter_email: em("zoepark__"),   voter_name: nm("zoepark__"),   option_index: 2 },
    { poll_id: pollJ3.id, trip_id: tripJapan.id, voter_email: em("miaxtan"),     voter_name: nm("miaxtan"),     option_index: 0 },

    { poll_id: pollM1.id, trip_id: tripMiami.id, voter_email: em("jasminewade"), voter_name: nm("jasminewade"), option_index: 0 },
    { poll_id: pollM1.id, trip_id: tripMiami.id, voter_email: em("ninarodz"),    voter_name: nm("ninarodz"),    option_index: 0 },
    { poll_id: pollM1.id, trip_id: tripMiami.id, voter_email: em("chloekim"),    voter_name: nm("chloekim"),    option_index: 0 },
    { poll_id: pollM1.id, trip_id: tripMiami.id, voter_email: em("amaraosei"),   voter_name: nm("amaraosei"),   option_index: 1 },

    { poll_id: pollM2.id, trip_id: tripMiami.id, voter_email: em("jasminewade"), voter_name: nm("jasminewade"), option_index: 0 },
    { poll_id: pollM2.id, trip_id: tripMiami.id, voter_email: em("ninarodz"),    voter_name: nm("ninarodz"),    option_index: 0 },

    { poll_id: pollF1.id, trip_id: tripFest.id, voter_email: em("jakemor"),      voter_name: nm("jakemor"),     option_index: 1 },
    { poll_id: pollF1.id, trip_id: tripFest.id, voter_email: em("omarali"),      voter_name: nm("omarali"),     option_index: 1 },
    { poll_id: pollF1.id, trip_id: tripFest.id, voter_email: em("ryanchang"),    voter_name: nm("ryanchang"),   option_index: 0 },
    { poll_id: pollF1.id, trip_id: tripFest.id, voter_email: em("domwalker"),    voter_name: nm("domwalker"),   option_index: 1 },

    { poll_id: pollF2.id, trip_id: tripFest.id, voter_email: em("kelseymoon"),   voter_name: nm("kelseymoon"),  option_index: 0 },
    { poll_id: pollF2.id, trip_id: tripFest.id, voter_email: em("simoneduval"),  voter_name: nm("simoneduval"), option_index: 2 },
    { poll_id: pollF2.id, trip_id: tripFest.id, voter_email: em("lexihayes"),    voter_name: nm("lexihayes"),   option_index: 0 },
  ];
  await Promise.all(voteRecords.map((r) => base44.entities.TripPollVote.create(r)));
  log(`✓ 7 Polls + ${voteRecords.length} votes created`);

  // ── 10. Messages ─────────────────────────────────────────────────────────
  log("Creating Messages…");
  const msgs = [
    // JAPAN chat
    { trip_id: tripJapan.id, sender_email: em("kaitonishi"), sender_name: nm("kaitonishi"), content: "ok i've been researching this trip for 6 months and i refuse to waste a single meal" },
    { trip_id: tripJapan.id, sender_email: em("zoepark__"),  sender_name: nm("zoepark__"),  content: "kaito we know. you sent the spreadsheet at 2am on a wednesday" },
    { trip_id: tripJapan.id, sender_email: em("marcuschen"), sender_name: nm("marcuschen"), content: "the spreadsheet is actually really good though let's be honest" },
    { trip_id: tripJapan.id, sender_email: em("miaxtan"),    sender_name: nm("miaxtan"),    content: "i've already planned my harajuku budget separately. please don't judge me" },
    { trip_id: tripJapan.id, sender_email: em("priyasharma"),sender_name: nm("priyasharma"),content: "mia how much is 'separately'" },
    { trip_id: tripJapan.id, sender_email: em("miaxtan"),    sender_name: nm("miaxtan"),    content: "we don't need to talk about it" },
    { trip_id: tripJapan.id, sender_email: em("alexrivers"), sender_name: nm("alexrivers"), content: "i'm bringing 3 camera bodies btw. just a warning. the content will be incredible" },
    { trip_id: tripJapan.id, sender_email: em("kaitonishi"), sender_name: nm("kaitonishi"), content: "golden gai is the plan for night 1. kaito's rule: we try at least 3 different bars. no bail outs" },
    { trip_id: tripJapan.id, sender_email: em("zoepark__"),  sender_name: nm("zoepark__"),  content: "what if one of the bars is doing something illegal" },
    { trip_id: tripJapan.id, sender_email: em("kaitonishi"), sender_name: nm("kaitonishi"), content: "then we try 2 bars" },
    { trip_id: tripJapan.id, sender_email: em("marcuschen"), sender_name: nm("marcuschen"), content: "JR pass just got shipped to my address. $334/person. venmo me pls or i will become your worst enemy" },
    { trip_id: tripJapan.id, sender_email: em("priyasharma"),sender_name: nm("priyasharma"),content: "sent!! also can we talk about the deer in nara. i've seen videos. i'm terrified." },
    { trip_id: tripJapan.id, sender_email: em("miaxtan"),    sender_name: nm("miaxtan"),    content: "they will bow at you and it's the most wholesome thing on earth and then immediately steal your food" },
    { trip_id: tripJapan.id, sender_email: em("alexrivers"), sender_name: nm("alexrivers"), content: "i'm getting the shot of priya getting mugged by a deer. it's going on my portfolio." },

    // MIAMI chat
    { trip_id: tripMiami.id, sender_email: em("jasminewade"),  sender_name: nm("jasminewade"),  content: "girls!! the airbnb confirmed 🥹 2 bed 2 bath steps from the beach" },
    { trip_id: tripMiami.id, sender_email: em("ninarodz"),     sender_name: nm("ninarodz"),     content: "SCREAMING. ok outfits planning starts now. we need a color coordination situation" },
    { trip_id: tripMiami.id, sender_email: em("chloekim"),     sender_name: nm("chloekim"),     content: "im thinking white/nude for carbone night. beach is more colorful" },
    { trip_id: tripMiami.id, sender_email: em("amaraosei"),    sender_name: nm("amaraosei"),    content: "i made a shared google doc with the full itinerary, budget breakdown, and uber schedule" },
    { trip_id: tripMiami.id, sender_email: em("briellesantos"),sender_name: nm("briellesantos"),content: "amara i love you but you need to also just let things happen organically sometimes" },
    { trip_id: tripMiami.id, sender_email: em("amaraosei"),    sender_name: nm("amaraosei"),    content: "the document is 4 pages long. i'm not taking notes." },
    { trip_id: tripMiami.id, sender_email: em("jasminewade"),  sender_name: nm("jasminewade"),  content: "carbone reservation is LOCKED. reservation under jasmine. don't be late or they'll give our table away" },
    { trip_id: tripMiami.id, sender_email: em("ninarodz"),     sender_name: nm("ninarodz"),     content: "Bri this is your warning" },
    { trip_id: tripMiami.id, sender_email: em("briellesantos"),sender_name: nm("briellesantos"),content: "i am punctual when it's important!!! also what are we wearing to LIV" },
    { trip_id: tripMiami.id, sender_email: em("chloekim"),     sender_name: nm("chloekim"),     content: "the corset dress is going to LIV with or without the group" },

    // FESTIVAL chat
    { trip_id: tripFest.id, sender_email: em("taliaburns"),  sender_name: nm("taliaburns"),  content: "LOGISTICS THREAD. please read. airbnb is confirmed. $260/person for 4 nights. venmo me @talia-b" },
    { trip_id: tripFest.id, sender_email: em("jakemor"),     sender_name: nm("jakemor"),     content: "talia being talia. love you. sent." },
    { trip_id: tripFest.id, sender_email: em("domwalker"),   sender_name: nm("domwalker"),   content: "lineup just dropped btw. i have the PDF. sending in files. clear your schedule friday 9pm" },
    { trip_id: tripFest.id, sender_email: em("ryanchang"),   sender_name: nm("ryanchang"),   content: "ok so who's getting snacks for the drive. i can do it but i need a grocery list because i will buy only chips and nothing else" },
    { trip_id: tripFest.id, sender_email: em("kelseymoon"),  sender_name: nm("kelseymoon"),  content: "i'll make a list ryan. don't buy the 'family size' pringles again" },
    { trip_id: tripFest.id, sender_email: em("ryanchang"),   sender_name: nm("ryanchang"),   content: "the family size pringles were a hit and i stand by that decision" },
    { trip_id: tripFest.id, sender_email: em("omarali"),     sender_name: nm("omarali"),     content: "i have a portable speaker btw. don't buy another one. theo i'm looking at you" },
    { trip_id: tripFest.id, sender_email: em("theovas"),     sender_name: nm("theovas"),     content: "i already ordered one and it arrives tomorrow. you're welcome" },
    { trip_id: tripFest.id, sender_email: em("simoneduval"), sender_name: nm("simoneduval"), content: "at what point do we just admit we're going to spend the first day fighting about which stage to go to and make peace with it now" },
    { trip_id: tripFest.id, sender_email: em("lexihayes"),   sender_name: nm("lexihayes"),   content: "simone is right. proposed solution: split up, regroup at the art installation at 7, headliner together" },
    { trip_id: tripFest.id, sender_email: em("taliaburns"),  sender_name: nm("taliaburns"),  content: "this is literally what i said two weeks ago but sure, now it's a good idea" },
    { trip_id: tripFest.id, sender_email: em("danaokafor"),  sender_name: nm("danaokafor"),  content: "reminder: PLEASE look at the camera when i'm filming. not at your phones. i'm making a video and you will all thank me later" },
    { trip_id: tripFest.id, sender_email: em("jakemor"),     sender_name: nm("jakemor"),     content: "ok but fr who still hasn't paid talia for the airbnb. she's too nice to chase you but i'm not." },
    { trip_id: tripFest.id, sender_email: em("theovas"),     sender_name: nm("theovas"),     content: "paying right now don't @ me" },
  ];

  for (const m of msgs) {
    await base44.entities.TripMessage.create({ ...m, message_type: "text" });
  }
  log(`✓ ${msgs.length} messages created`);

  // ── 11. TripLinks ────────────────────────────────────────────────────────
  log("Creating TripLinks…");
  const linkRecords = [
    { trip_id: tripJapan.id, url: "https://www.teamlab.art/e/planets/", title: "teamLab Planets – Tokyo", note: "book asap it sells out. barefoot exhibit. go after 4pm for smaller crowds", category: "activity", shared_by_email: em("zoepark__"), shared_by_name: nm("zoepark__") },
    { trip_id: tripJapan.id, url: "https://www.jrailpass.com/", title: "JR Pass – 14 Day", note: "marcus already ordered for everyone. $334 each. reimburse him", category: "other", shared_by_email: em("marcuschen"), shared_by_name: nm("marcuschen") },
    { trip_id: tripJapan.id, url: "https://www.ichiranusa.com/", title: "Ichiran Ramen – solo booths", note: "the private booth experience is life-changing. shibuya location has shortest line", category: "food", shared_by_email: em("kaitonishi"), shared_by_name: nm("kaitonishi") },
    { trip_id: tripMiami.id, url: "https://carbonemiami.com/", title: "Carbone Miami", note: "reservation under jasmine. DO NOT be late they will give the table away", category: "food", shared_by_email: em("jasminewade"), shared_by_name: nm("jasminewade") },
    { trip_id: tripMiami.id, url: "https://fontainebleau.com/nightlife/liv", title: "LIV Nightclub", note: "table split 5 ways. confirm you're coming or you lose your spot", category: "nightlife", shared_by_email: em("ninarodz"), shared_by_name: nm("ninarodz") },
    { trip_id: tripFest.id, url: "https://www.coachella.com/", title: "Coachella 2026 Lineup", note: "dom's lineup breakdown doc is pinned in the chat. friday headliner is a must", category: "activity", shared_by_email: em("domwalker"), shared_by_name: nm("domwalker") },
    { trip_id: tripFest.id, url: "https://www.in-n-out.com/", title: "In-N-Out Palm Desert", note: "2 min from festival exit. animal style double double. this is happening every night", category: "food", shared_by_email: em("ryanchang"), shared_by_name: nm("ryanchang") },
  ];
  await Promise.all(linkRecords.map((r) => base44.entities.TripLink.create(r)));
  log(`✓ ${linkRecords.length} TripLinks created`);

  // ── 12. Notifications ────────────────────────────────────────────────────
  log("Creating Notifications…");
  const notifRecords = [
    { user_email: em("zoepark__"),   type: "trip_added",    message: "Kaito added you to japan summer 2026 🍜",   related_user_email: em("kaitonishi"), related_user_name: nm("kaitonishi"), related_trip_id: tripJapan.id, is_read: true },
    { user_email: em("marcuschen"),  type: "trip_added",    message: "Kaito added you to japan summer 2026 🍜",   related_user_email: em("kaitonishi"), related_user_name: nm("kaitonishi"), related_trip_id: tripJapan.id, is_read: true },
    { user_email: em("priyasharma"), type: "trip_added",    message: "Kaito added you to japan summer 2026 🍜",   related_user_email: em("kaitonishi"), related_user_name: nm("kaitonishi"), related_trip_id: tripJapan.id, is_read: false },
    { user_email: em("ninarodz"),    type: "trip_added",    message: "Jasmine added you to miami girls weekend 🌴", related_user_email: em("jasminewade"),related_user_name: nm("jasminewade"),related_trip_id: tripMiami.id, is_read: true },
    { user_email: em("chloekim"),    type: "trip_added",    message: "Jasmine added you to miami girls weekend 🌴", related_user_email: em("jasminewade"),related_user_name: nm("jasminewade"),related_trip_id: tripMiami.id, is_read: true },
    { user_email: em("domwalker"),   type: "trip_added",    message: "Jake added you to desert fest 🎪",           related_user_email: em("jakemor"),    related_user_name: nm("jakemor"),    related_trip_id: tripFest.id,  is_read: true },
    { user_email: em("ryanchang"),   type: "trip_added",    message: "Jake added you to desert fest 🎪",           related_user_email: em("jakemor"),    related_user_name: nm("jakemor"),    related_trip_id: tripFest.id,  is_read: false },
    { user_email: em("theovas"),     type: "trip_added",    message: "Talia added you to desert fest 🎪",          related_user_email: em("taliaburns"), related_user_name: nm("taliaburns"), related_trip_id: tripFest.id,  is_read: false },
    { user_email: em("kaitonishi"),  type: "friend_request",message: "Zoe Park sent you a friend request",         related_user_email: em("zoepark__"),  related_user_name: nm("zoepark__"),  is_read: false },
    { user_email: em("jasminewade"), type: "friend_accepted",message: "Amara Osei accepted your friend request",   related_user_email: em("amaraosei"),  related_user_name: nm("amaraosei"),  is_read: true },
  ];
  await Promise.all(notifRecords.map((r) => base44.entities.Notification.create(r)));
  log(`✓ ${notifRecords.length} Notifications created`);

  // ── 13. Friendships ──────────────────────────────────────────────────────
  log("Creating Friendships…");
  const friendshipRecords = [
    { user1_email: em("kaitonishi"),  user2_email: em("zoepark__") },
    { user1_email: em("kaitonishi"),  user2_email: em("marcuschen") },
    { user1_email: em("kaitonishi"),  user2_email: em("miaxtan") },
    { user1_email: em("priyasharma"), user2_email: em("alexrivers") },
    { user1_email: em("zoepark__"),   user2_email: em("miaxtan") },
    { user1_email: em("jasminewade"), user2_email: em("ninarodz") },
    { user1_email: em("jasminewade"), user2_email: em("amaraosei") },
    { user1_email: em("chloekim"),    user2_email: em("ninarodz") },
    { user1_email: em("chloekim"),    user2_email: em("briellesantos") },
    { user1_email: em("jakemor"),     user2_email: em("domwalker") },
    { user1_email: em("jakemor"),     user2_email: em("omarali") },
    { user1_email: em("taliaburns"),  user2_email: em("lexihayes") },
    { user1_email: em("ryanchang"),   user2_email: em("theovas") },
    { user1_email: em("kelseymoon"),  user2_email: em("danaokafor") },
    { user1_email: em("simoneduval"), user2_email: em("lexihayes") },
  ];
  await Promise.all(friendshipRecords.map((r) => base44.entities.Friendship.create(r)));
  log(`✓ ${friendshipRecords.length} Friendships created`);

  log("🎉 all done! 3 trips, 21 profiles, expenses, polls, chats seeded.");
}

// ─── Cleaner ─────────────────────────────────────────────────────────────────
async function runClear(log) {
  log("Clearing demo data…");

  const profiles = await base44.entities.UserProfile.filter({}, "-created_date", 300);
  const demoProfiles = profiles.filter((p) => p.user_id?.startsWith(DEMO_TAG));
  const demoEmails = demoProfiles.map((p) => p.user_email);

  if (demoProfiles.length === 0) {
    log("No demo data found.");
    return;
  }

  await Promise.all(demoProfiles.map((p) => base44.entities.UserProfile.delete(p.id)));
  log(`✓ Deleted ${demoProfiles.length} UserProfiles`);

  const groups = await base44.entities.Group.filter({}, "-created_date", 200);
  const demoGroups = groups.filter((g) => g.name?.includes(DEMO_TAG));
  await Promise.all(demoGroups.map((g) => base44.entities.Group.delete(g.id)));
  log(`✓ Deleted ${demoGroups.length} Groups`);

  const trips = await base44.entities.Trip.filter({}, "-created_date", 200);
  const demoTrips = trips.filter((t) => t.invite_code?.startsWith(DEMO_TAG) || t.name?.startsWith(DEMO_TAG));
  const demoTripIds = demoTrips.map((t) => t.id);
  await Promise.all(demoTrips.map((t) => base44.entities.Trip.delete(t.id)));
  log(`✓ Deleted ${demoTrips.length} Trips`);

  if (demoTripIds.length > 0 || demoEmails.length > 0) {
    const entityNames = [
      "TripMember", "Arrival", "Lodging", "ItineraryItem",
      "Expense", "Payment", "TripPoll", "TripPollVote",
      "TripMessage", "TripLink", "Notification", "Friendship",
    ];
    for (const entityName of entityNames) {
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
        if (toDelete.length > 0) log(`✓ Deleted ${toDelete.length} ${entityName}`);
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
  const [status, setStatus] = useState("idle");
  const [currentUser, setCurrentUser] = useState(null);
  const [checked, setChecked] = useState(false);

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
          Seeds 3 trips (Japan, Miami, Desert Fest) with 21 realistic Gen Z profiles, full itineraries, expenses, polls, and group chats.
        </p>
      </div>

      <div className="flex gap-3 mb-6">
        <Button className="flex-1 rounded-full" onClick={handleSeed} disabled={busy}>
          {status === "seeding" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sprout className="h-4 w-4 mr-2" />}
          Seed Demo Data
        </Button>
        <Button variant="outline" className="flex-1 rounded-full" onClick={handleClear} disabled={busy}>
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