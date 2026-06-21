import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Trash2, Sprout, CheckCircle2, Loader2, ShieldAlert } from "lucide-react";

// ─── Demo tag (for cleanup) ───────────────────────────────────────────────────
const DEMO_TAG = "__demo__";
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// ─── JAPAN trip crew ──────────────────────────────────────────────────────────
const JAPAN_USERS = [
  { user_id: `${DEMO_TAG}kaito`,  user_email: "kaito.nishimura@rove-demo.app", username: "kaitonishi",   username_lower: "kaitonishi",   full_name: "Kaito Nishimura", display_name: "Kaito",  bio: "half japanese half chaos. cs major who can name every jrpg protagonist",               profile_photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80", venmo: "@kaito-n",     instagram: "kaitonishi" },
  { user_id: `${DEMO_TAG}zoe`,    user_email: "zoe.park@rove-demo.app",        username: "zoepark__",    username_lower: "zoepark__",    full_name: "Zoe Park",        display_name: "Zoe",    bio: "art history dropout turned content creator. obsessed with matcha",                     profile_photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80", venmo: "@zoe-park",    instagram: "zoepark__",    tiktok: "@zoepark__" },
  { user_id: `${DEMO_TAG}marcus`, user_email: "marcus.chen@rove-demo.app",     username: "marcuschen",   username_lower: "marcuschen",   full_name: "Marcus Chen",     display_name: "Marcus", bio: "finance bro with a soft spot for ramen and anime merch",                               profile_photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80", venmo: "@marcus-c",    cashapp: "$marcusc" },
  { user_id: `${DEMO_TAG}priya`,  user_email: "priya.sharma@rove-demo.app",    username: "priyasharma",  username_lower: "priyasharma",  full_name: "Priya Sharma",    display_name: "Priya",  bio: "med student. i travel to cope. currently rotating through trauma",                    profile_photo: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&q=80", venmo: "@priya-s",     instagram: "priyasharma" },
  { user_id: `${DEMO_TAG}alex`,   user_email: "alex.rivers@rove-demo.app",     username: "alexrivers",   username_lower: "alexrivers",   full_name: "Alex Rivers",     display_name: "Alex",   bio: "photographer + freelance videographer. always losing my lens cap",                     profile_photo: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=400&q=80", venmo: "@alex-riv",    instagram: "alexrivers.photo" },
  { user_id: `${DEMO_TAG}mia`,    user_email: "mia.tanaka@rove-demo.app",      username: "miaxtan",      username_lower: "miaxtan",      full_name: "Mia Tanaka",      display_name: "Mia",    bio: "graphic design senior. my entire personality is studio ghibli",                        profile_photo: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&q=80", venmo: "@mia-tan",     instagram: "miaxtan",      tiktok: "@miaxtan" },
];

// ─── MIAMI trip crew ──────────────────────────────────────────────────────────
const MIAMI_USERS = [
  { user_id: `${DEMO_TAG}jasmine`, user_email: "jasmine.wade@rove-demo.app",   username: "jasminewade",   username_lower: "jasminewade",   full_name: "Jasmine Wade",   display_name: "Jas",   bio: "PR girlie in NYC. will be at every rooftop at golden hour",                           profile_photo: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&q=80", venmo: "@jasmine-w",   instagram: "jasminewade",  tiktok: "@jasminewade" },
  { user_id: `${DEMO_TAG}nina`,    user_email: "nina.rodriguez@rove-demo.app", username: "ninarodz",      username_lower: "ninarodz",      full_name: "Nina Rodriguez", display_name: "Nina",  bio: "fashion marketing. i dressed up to go to target and i regret nothing",                profile_photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80", venmo: "@nina-rodz",   instagram: "ninarodz" },
  { user_id: `${DEMO_TAG}chloe`,   user_email: "chloe.kim@rove-demo.app",      username: "chloekim",      username_lower: "chloekim",      full_name: "Chloe Kim",      display_name: "Chloe", bio: "skincare obsessed. serial brunch attendee. iced matcha or i'm not here",              profile_photo: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&q=80", venmo: "@chloe-k",     cashapp: "$chloek",        instagram: "chloekim" },
  { user_id: `${DEMO_TAG}amara`,   user_email: "amara.osei@rove-demo.app",     username: "amaraosei",     username_lower: "amaraosei",     full_name: "Amara Osei",     display_name: "Amara", bio: "law student. hyper-organized. yes i already made a spreadsheet",                      profile_photo: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=400&q=80", venmo: "@amara-o",     instagram: "amaraosei" },
  { user_id: `${DEMO_TAG}bri`,     user_email: "bri.santos@rove-demo.app",     username: "briellesantos", username_lower: "briellesantos", full_name: "Brielle Santos", display_name: "Bri",   bio: "yoga teacher / certified hot mess. will recommend crystals unprompted",               profile_photo: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80", venmo: "@bri-santos",  instagram: "briellesantos", tiktok: "@briellesantos" },
];

// ─── DESERT FEST 🌵 crew ──────────────────────────────────────────────────────
const DESERT_USERS = [
  { user_id: `${DEMO_TAG}mia_df`,    user_email: "mia.johnson@rove-demo.app",    username: "miajohnson",   username_lower: "miajohnson",   full_name: "Mia Johnson",   display_name: "Mia",    bio: "festival planner era. type a in the streets, pool girl on the weekends",              profile_photo: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&q=80", venmo: "@mia-j",      instagram: "miajohnson",  tiktok: "@miajohnson" },
  { user_id: `${DEMO_TAG}ashley_df`, user_email: "ashley.chen@rove-demo.app",    username: "ashleychen",   username_lower: "ashleychen",   full_name: "Ashley Chen",   display_name: "Ashley", bio: "road trip queen. toyota highlander and a playlist ready. let's go",                  profile_photo: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&q=80", venmo: "@ashley-c",   instagram: "ashleychen", cashapp: "$ashleyc" },
  { user_id: `${DEMO_TAG}ryan_df`,   user_email: "ryan.miller@rove-demo.app",    username: "ryanmiller",   username_lower: "ryanmiller",   full_name: "Ryan Miller",   display_name: "Ryan",   bio: "always has snacks. loves everyone. will find the nearest in-n-out",                  profile_photo: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=400&q=80", venmo: "@ryan-mil",   cashapp: "$ryanm" },
  { user_id: `${DEMO_TAG}jake_df`,   user_email: "jake.harris@rove-demo.app",    username: "jakeharris",   username_lower: "jakeharris",   full_name: "Jake Harris",   display_name: "Jake",   bio: "outdoor enthusiast. has been to the coachella valley 5x. crv packed and ready",      profile_photo: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&q=80", venmo: "@jake-h",     cashapp: "$jakeh" },
  { user_id: `${DEMO_TAG}sophie_df`, user_email: "sophie.lee@rove-demo.app",     username: "sophielee",    username_lower: "sophielee",    full_name: "Sophie Lee",    display_name: "Sophie", bio: "grocery run coordinator. will buy 3 types of sunscreen and not apologize",            profile_photo: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&q=80", venmo: "@sophie-l",   instagram: "sophielee" },
];

// ─── FESTIVAL trip crew ───────────────────────────────────────────────────────
const FEST_USERS = [
  { user_id: `${DEMO_TAG}jake`,    user_email: "jake.morales@rove-demo.app",   username: "jakemor",      username_lower: "jakemor",      full_name: "Jake Morales",   display_name: "Jake",  bio: "outdoor enthusiast. been to coachella 4x and still can't find the stage",             profile_photo: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&q=80", venmo: "@jake-mor",    cashapp: "$jakemor" },
  { user_id: `${DEMO_TAG}talia`,   user_email: "talia.burns@rove-demo.app",    username: "taliaburns",   username_lower: "taliaburns",   full_name: "Talia Burns",    display_name: "Talia", bio: "event planner irl. takes charge even when nobody asked her to",                       profile_photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80", venmo: "@talia-b",     instagram: "taliaburns" },
  { user_id: `${DEMO_TAG}dom`,     user_email: "dom.walker@rove-demo.app",     username: "domwalker",    username_lower: "domwalker",    full_name: "Dom Walker",     display_name: "Dom",   bio: "music nerd. knows every dj set time by heart. terrible at replying",                  profile_photo: "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=400&q=80", venmo: "@dom-walk",    cashapp: "$domwalk" },
  { user_id: `${DEMO_TAG}lexi`,    user_email: "lexi.hayes@rove-demo.app",     username: "lexihayes",    username_lower: "lexihayes",    full_name: "Lexi Hayes",     display_name: "Lexi",  bio: "thrift queen. showed up to last festival in full cowboy fit no regrets",               profile_photo: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&q=80", venmo: "@lexi-h",      instagram: "lexihayes" },
  { user_id: `${DEMO_TAG}omar`,    user_email: "omar.ali@rove-demo.app",       username: "omarali",      username_lower: "omarali",      full_name: "Omar Ali",       display_name: "Omar",  bio: "software eng. will fix the aux cord and then disappear for 3 hours",                  profile_photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80", venmo: "@omar-ali",    cashapp: "$omarali" },
  { user_id: `${DEMO_TAG}simone`,  user_email: "simone.duval@rove-demo.app",   username: "simoneduval",  username_lower: "simoneduval",  full_name: "Simone Duval",   display_name: "Simone",bio: "french-american. here for the vibes and the merch table",                             profile_photo: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&q=80", venmo: "@simone-d",    instagram: "simoneduval" },
  { user_id: `${DEMO_TAG}ryan`,    user_email: "ryan.chang@rove-demo.app",     username: "ryanchang",    username_lower: "ryanchang",    full_name: "Ryan Chang",     display_name: "Ryan",  bio: "always has snacks. never has cash. loves everyone",                                    profile_photo: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=400&q=80", venmo: "@ryan-ch",     cashapp: "$ryanchang" },
  { user_id: `${DEMO_TAG}kelsey`,  user_email: "kelsey.moon@rove-demo.app",    username: "kelseymoon",   username_lower: "kelseymoon",   full_name: "Kelsey Moon",    display_name: "Kels",  bio: "nursing student. will be the one carrying advil, sunscreen, and a portable charger",  profile_photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80", venmo: "@kelsey-m",    instagram: "kelseymoon" },
  { user_id: `${DEMO_TAG}theo`,    user_email: "theo.vasquez@rove-demo.app",   username: "theovas",      username_lower: "theovas",      full_name: "Theo Vasquez",   display_name: "Theo",  bio: "aspiring dj. sent the spotify playlist 4 months ago. still waiting",                  profile_photo: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&q=80", venmo: "@theo-v",      cashapp: "$theov" },
  { user_id: `${DEMO_TAG}dana`,    user_email: "dana.okafor@rove-demo.app",    username: "danaokafor",   username_lower: "danaokafor",   full_name: "Dana Okafor",    display_name: "Dana",  bio: "film student. documents everything. the designated trip photographer",                 profile_photo: "https://images.unsplash.com/photo-1546961342-ea5f62d5a27b?w=400&q=80", venmo: "@dana-ok",     instagram: "danaokafor",   tiktok: "@danaokafor" },
];

const ALL_USERS = [...JAPAN_USERS, ...MIAMI_USERS, ...DESERT_USERS, ...FEST_USERS];

// ─── Demo display name for the real logged-in user (read-only, never written to DB) ───
// The real user's UserProfile is NEVER modified by the seeder.
// Their real account is used only for permissions/trip membership.

// ─── Helpers ──────────────────────────────────────────────────────────────────
const uByKey = (key) => ALL_USERS.find((x) => x.username_lower === key);
const em = (key) => uByKey(key)?.user_email;
const nm = (key) => uByKey(key)?.full_name;
const makeLogger = (setLog) => (msg) => setLog((prev) => [...prev, msg]);

// ─── Shared: ensure profiles exist for a user list (idempotent) ──────────────
async function ensureProfiles(users, log) {
  const existing = await base44.entities.UserProfile.filter({}, "-created_date", 300);
  const existingIds = new Set(existing.map((p) => p.user_id));
  const toCreate = users.filter((u) => !existingIds.has(u.user_id));
  if (toCreate.length === 0) { log("  profiles already exist, skipping"); return; }
  await Promise.all(toCreate.map((u) => base44.entities.UserProfile.create(u)));
  log(`  ✓ ${toCreate.length} profiles created`);
}

// ─── Shared: clear all demo data for a single trip invite code ───────────────
async function clearTripByCode(inviteCode, demoUserIds, log) {
  // Find the trip
  const allTrips = await base44.entities.Trip.filter({}, "-created_date", 200);
  const trip = allTrips.find((t) => t.invite_code === inviteCode);
  if (!trip) { log("  trip not found, skipping"); return; }

  const tripId = trip.id;
  const demoEmails = ALL_USERS.filter((u) => demoUserIds.includes(u.user_id)).map((u) => u.user_email);

  await base44.entities.Trip.delete(tripId);
  log(`  ✓ Trip deleted`);

  const entityNames = ["TripMember", "Arrival", "Lodging", "ItineraryItem",
    "Expense", "Payment", "TripPoll", "TripPollVote", "TripMessage", "TripLink", "Notification"];
  for (const entityName of entityNames) {
    try {
      const all = await base44.entities[entityName].filter({}, "-created_date", 500);
      const toDelete = all.filter((r) =>
        r.trip_id === tripId ||
        demoEmails.includes(r.user_email) ||
        demoEmails.includes(r.sender_email) ||
        demoEmails.includes(r.voter_email) ||
        demoEmails.includes(r.shared_by_email)
      );
      if (toDelete.length > 0) {
        await Promise.all(toDelete.map((r) => base44.entities[entityName].delete(r.id)));
        log(`  ✓ Deleted ${toDelete.length} ${entityName}`);
      }
    } catch (e) { log(`  ⚠ Could not clear ${entityName}: ${e.message}`); }
  }

  // Delete profiles for this trip's crew
  const allProfiles = await base44.entities.UserProfile.filter({}, "-created_date", 300);
  const profilesToDelete = allProfiles.filter((p) => demoUserIds.includes(p.user_id));
  if (profilesToDelete.length > 0) {
    await Promise.all(profilesToDelete.map((p) => base44.entities.UserProfile.delete(p.id)));
    log(`  ✓ Deleted ${profilesToDelete.length} UserProfiles`);
  }
}

// ─── JAPAN seeder ─────────────────────────────────────────────────────────────
async function seedJapan(log, me) {
  const myEmail = me.email;
  const myName = me.full_name || me.email.split("@")[0];
  const INVITE_CODE = `${DEMO_TAG}JAPAN26`;

  // Duplicate check
  const existingTrips = await base44.entities.Trip.filter({}, "-created_date", 200);
  if (existingTrips.some((t) => t.invite_code === INVITE_CODE)) {
    throw new Error("Japan trip already exists. Clear it first.");
  }

  log("Creating Japan profiles…");
  await ensureProfiles(JAPAN_USERS, log);

  log("Creating Japan trip…");
  const members = [myEmail, em("kaitonishi"), em("zoepark__"), em("marcuschen"), em("priyasharma"), em("alexrivers"), em("miaxtan")];
  const trip = await base44.entities.Trip.create({
    name: "japan summer 2026 🍜", destination: "Tokyo, Japan",
    description: "2 weeks, 3 cities, infinite convenience store snacks",
    start_date: "2026-07-10", end_date: "2026-07-24",
    admin_email: myEmail, member_emails: members,
    invite_code: INVITE_CODE, invite_active: true,
    cover_image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80",
    theme_color: "#E8426A",
  });
  log("  ✓ Trip created");

  log("Creating TripMembers…");
  const tms = [
    { trip_id: trip.id, user_email: myEmail,           user_name: myName,            role: "admin",  status: "active" },
    { trip_id: trip.id, user_email: em("kaitonishi"),  user_name: nm("kaitonishi"),  role: "member", status: "active",  invited_by_email: myEmail },
    { trip_id: trip.id, user_email: em("zoepark__"),   user_name: nm("zoepark__"),   role: "member", status: "active",  invited_by_email: myEmail },
    { trip_id: trip.id, user_email: em("marcuschen"),  user_name: nm("marcuschen"),  role: "member", status: "active",  invited_by_email: myEmail },
    { trip_id: trip.id, user_email: em("priyasharma"), user_name: nm("priyasharma"), role: "member", status: "active",  invited_by_email: myEmail },
    { trip_id: trip.id, user_email: em("alexrivers"),  user_name: nm("alexrivers"),  role: "member", status: "active",  invited_by_email: myEmail },
    { trip_id: trip.id, user_email: em("miaxtan"),     user_name: nm("miaxtan"),     role: "member", status: "active",  invited_by_email: myEmail },
  ];
  await Promise.all(tms.map((r) => base44.entities.TripMember.create(r)));
  log("  ✓ TripMembers created");

  log("Creating Arrivals…");
  const arrivals = [
    { trip_id: trip.id, user_email: em("kaitonishi"),  user_name: nm("kaitonishi"),  travel_type: "Flight", is_round_trip: true, arrival_location: "LAX", destination: "NRT", arrival_date: "2026-07-10", arrival_time: "15:30", departure_date: "2026-07-24", departure_time: "18:00", airline: "ANA",    outbound_flight_number: "NH175", return_flight_number: "NH176" },
    { trip_id: trip.id, user_email: em("zoepark__"),   user_name: nm("zoepark__"),   travel_type: "Flight", is_round_trip: true, arrival_location: "JFK", destination: "NRT", arrival_date: "2026-07-10", arrival_time: "16:15", departure_date: "2026-07-24", departure_time: "20:00", airline: "JAL",    outbound_flight_number: "JL5",   return_flight_number: "JL6" },
    { trip_id: trip.id, user_email: em("marcuschen"),  user_name: nm("marcuschen"),  travel_type: "Flight", is_round_trip: true, arrival_location: "ORD", destination: "NRT", arrival_date: "2026-07-10", arrival_time: "17:00", departure_date: "2026-07-24", departure_time: "17:00", airline: "United", outbound_flight_number: "UA837", return_flight_number: "UA838" },
    { trip_id: trip.id, user_email: em("priyasharma"), user_name: nm("priyasharma"), travel_type: "Flight", is_round_trip: true, arrival_location: "BOS", destination: "NRT", arrival_date: "2026-07-11", arrival_time: "08:00", departure_date: "2026-07-24", departure_time: "21:00", airline: "JAL",    outbound_flight_number: "JL7",   return_flight_number: "JL8" },
    { trip_id: trip.id, user_email: em("alexrivers"),  user_name: nm("alexrivers"),  travel_type: "Flight", is_round_trip: true, arrival_location: "SFO", destination: "NRT", arrival_date: "2026-07-10", arrival_time: "13:45", departure_date: "2026-07-25", departure_time: "11:00", airline: "ANA",    outbound_flight_number: "NH1",   return_flight_number: "NH2" },
  ];
  // Note: times display as 12-hour AM/PM in UI (13:45 → 1:45 PM, etc.)
  await Promise.all(arrivals.map((r) => base44.entities.Arrival.create(r)));
  log("  ✓ Arrivals created");

  log("Creating Lodging…");
  await Promise.all([
    base44.entities.Lodging.create({ trip_id: trip.id, name: "Wise Owl Hostels Tokyo",    address: "2-23-8 Kabukicho, Shinjuku, Tokyo",       price_per_night: 42,  check_in: "2026-07-10", check_out: "2026-07-15", notes: "Capsule dorms. Lockers for valuables. 24hr convenience store literally attached", guest_emails: members }),
    base44.entities.Lodging.create({ trip_id: trip.id, name: "Kyoto Machiya Townhouse",   address: "Higashiyama, Kyoto",                      price_per_night: 110, check_in: "2026-07-15", check_out: "2026-07-19", notes: "Traditional machiya. Shoes off at the door!! Tatami rooms. Tiny but perfect",    guest_emails: members }),
    base44.entities.Lodging.create({ trip_id: trip.id, name: "Dormy Inn Namba Osaka",     address: "1-4-6 Motomachi, Naniwa, Osaka",          price_per_night: 58,  check_in: "2026-07-19", check_out: "2026-07-24", notes: "Free ramen at midnight. Yes really. Game changer.",                               guest_emails: members }),
  ]);
  log("  ✓ Lodging created");

  log("Creating Itinerary…");
  const itinItems = [
    { date: "2026-07-10", time: "18:00", title: "arrive + 7-eleven run 🏪",           location: "Shinjuku, Tokyo",    notes: "everyone needs their onigiri moment. this is the ritual",                              is_required: true },
    { date: "2026-07-11", time: "09:00", title: "Shibuya crossing + brunch",           location: "Shibuya, Tokyo",     notes: "get there early before it gets too chaotic. Eggs 'n Things for brunch",               is_required: false },
    { date: "2026-07-11", time: "14:00", title: "Harajuku – Takeshita St shopping",    location: "Harajuku, Tokyo",    notes: "Mia's been waiting for this literally all year. budget accordingly",                   is_required: false },
    { date: "2026-07-11", time: "19:00", title: "Ichiran ramen (solo booth edition)",  location: "Shibuya, Tokyo",     notes: "single-person ramen booths. iconic. no talking required",                              is_required: true },
    { date: "2026-07-12", time: "10:00", title: "teamLab Planets 🎨",                  location: "Toyosu, Tokyo",      notes: "BOOK TICKETS AHEAD. sold out constantly. goes barefoot btw",                          is_required: true },
    { date: "2026-07-12", time: "20:00", title: "Golden Gai bar hop 🍻",               location: "Shinjuku, Tokyo",    notes: "tiny bars, max 8 people each. Kaito knows the good ones",                             is_required: false },
    { date: "2026-07-13", time: "11:00", title: "Akihabara anime merch hunt",          location: "Akihabara, Tokyo",   notes: "Marcus and Mia have been training for this. send help",                                is_required: false },
    { date: "2026-07-13", time: "16:00", title: "maid cafe experience ☕",              location: "Akihabara, Tokyo",   notes: "pick one with good reviews. Kaito is required to participate",                        is_required: false },
    { date: "2026-07-14", time: "09:00", title: "Tsukiji outer market sushi 🐟",       location: "Tsukiji, Tokyo",     notes: "go early before it sells out. omakase counter if budget allows",                      is_required: true },
    { date: "2026-07-14", time: "21:00", title: "karaoke night 🎤",                    location: "Shinjuku, Tokyo",    notes: "Big Echo has private rooms. 2 hour min. Marcus will do his thing",                    is_required: true },
    { date: "2026-07-15", time: "07:00", title: "Fushimi Inari (early morning!)",      location: "Fushimi, Kyoto",     notes: "go at sunrise. by 9am it's packed. worth the early alarm",                            is_required: true },
    { date: "2026-07-15", time: "14:00", title: "Arashiyama bamboo grove 🎋",          location: "Arashiyama, Kyoto",  notes: "rent bikes to get there. Tenryu-ji garden right next door",                           is_required: false },
    { date: "2026-07-16", time: "10:00", title: "Nishiki Market food crawl",           location: "Nishiki, Kyoto",     notes: "octopus skewers, matcha mochi, pickles. Zoe will document all of it",                 is_required: false },
    { date: "2026-07-16", time: "15:00", title: "Gion evening walk 🏮",                location: "Gion, Kyoto",        notes: "geisha district. cobblestones. golden hour is unreal here",                           is_required: false },
    { date: "2026-07-17", time: "11:00", title: "matcha making class 🍵",              location: "Uji, Kyoto",         notes: "booked for 6 people. dress casual, they give you the apron",                         is_required: true },
    { date: "2026-07-18", time: "19:00", title: "yakiniku dinner 🥩",                  location: "Gion, Kyoto",        notes: "everyone grills their own. Priya's turn to pick the cuts",                           is_required: true },
    { date: "2026-07-19", time: "12:00", title: "arrive Osaka + Dotonbori 🦀",         location: "Dotonbori, Osaka",   notes: "takoyaki, okonomiyaki, crepes. eat everything. no exceptions",                        is_required: true },
    { date: "2026-07-20", time: "10:00", title: "Osaka Castle",                        location: "Chuo, Osaka",        notes: "museum is cool but the park is better. bring a picnic",                               is_required: false },
    { date: "2026-07-20", time: "20:00", title: "Osaka nightlife – Amerika-Mura",      location: "Shinsaibashi, Osaka",notes: "club district. Kaito has the lineup",                                                 is_required: false },
    { date: "2026-07-21", time: "09:00", title: "Nara day trip – deer park 🦌",        location: "Nara, Japan",        notes: "40 min from Osaka by train. buy the deer crackers. you WILL get surrounded",          is_required: false },
    { date: "2026-07-22", time: "14:00", title: "Kuromon Market + last grocery haul",  location: "Nipponbashi, Osaka", notes: "fresh wagyu, fruit, snacks for the flight. go big",                                   is_required: false },
    { date: "2026-07-23", time: "19:00", title: "last night dinner – kaiseki 🍱",      location: "Osaka",              notes: "splurge dinner. Alex is making the trip reel, we need a nice end shot",               is_required: true },
  ];
  // Note: times stored in 24hr format, displayed as 12-hour AM/PM in UI
  for (const r of itinItems) {
    await base44.entities.ItineraryItem.create({ trip_id: trip.id, ...r });
    await delay(80);
  }
  log(`  ✓ ${itinItems.length} itinerary items created`);

  log("Creating Expenses…");
  const expenses = [
    { description: "Tokyo hostel – 5 nights (Wise Owl)",          amount: 1470, paid_by: em("marcuschen"),  paid_by_name: nm("marcuschen"),  split_among: members, category: "lodging",   trip_wide: true,  is_settled: false },
    { description: "Kyoto machiya – 4 nights",                    amount: 3080, paid_by: em("kaitonishi"),  paid_by_name: nm("kaitonishi"),  split_among: members, category: "lodging",   trip_wide: true,  is_settled: false },
    { description: "Osaka Dormy Inn – 5 nights",                  amount: 2030, paid_by: em("zoepark__"),   paid_by_name: nm("zoepark__"),   split_among: members, category: "lodging",   trip_wide: true,  is_settled: false },
    { description: "JR Pass – 14-day (all 7)",                    amount: 2338, paid_by: em("marcuschen"),  paid_by_name: nm("marcuschen"),  split_among: members, category: "transport", trip_wide: true,  is_settled: false },
    { description: "teamLab Planets tickets",                      amount: 196,  paid_by: em("zoepark__"),   paid_by_name: nm("zoepark__"),   split_among: members, category: "activity",  trip_wide: false, day_number: 3,  is_settled: false },
    { description: "Tsukiji omakase counter",                      amount: 343,  paid_by: em("alexrivers"),  paid_by_name: nm("alexrivers"),  split_among: members, category: "food",      trip_wide: false, day_number: 5,  is_settled: false },
    { description: "karaoke – Big Echo 2hrs",                      amount: 112,  paid_by: em("kaitonishi"),  paid_by_name: nm("kaitonishi"),  split_among: members, category: "activity",  trip_wide: false, day_number: 5,  is_settled: false },
    { description: "matcha ceremony class – Uji",                  amount: 168,  paid_by: em("priyasharma"),paid_by_name: nm("priyasharma"), split_among: members, category: "activity",  trip_wide: false, day_number: 8,  is_settled: false },
    { description: "yakiniku group dinner Kyoto",                  amount: 252,  paid_by: em("miaxtan"),     paid_by_name: nm("miaxtan"),     split_among: members, category: "food",      trip_wide: false, day_number: 9,  is_settled: false },
    { description: "Nara deer park + train",                       amount: 98,   paid_by: em("kaitonishi"),  paid_by_name: nm("kaitonishi"),  split_among: members, category: "activity",  trip_wide: false, day_number: 12, is_settled: false },
    { description: "kaiseki last night dinner",                    amount: 490,  paid_by: em("alexrivers"),  paid_by_name: nm("alexrivers"),  split_among: members, category: "food",      trip_wide: false, day_number: 14, is_settled: false },
    { description: "convenience store runs (tracked separately)",  amount: 84,   paid_by: em("zoepark__"),   paid_by_name: nm("zoepark__"),   split_among: [em("zoepark__"), em("miaxtan"), em("priyasharma")], category: "food", trip_wide: false, day_number: 2, is_settled: true, settlement_notes: "settled in cash day 3" },
  ];
  for (const r of expenses) {
    await base44.entities.Expense.create({ trip_id: trip.id, ...r });
    await delay(80);
  }
  log(`  ✓ ${expenses.length} expenses created`);

  log("Creating Payments (varied statuses)…");
  await delay(500);
  const allExpenses = await base44.entities.Expense.filter({ trip_id: trip.id }, "-created_date", 50);
  const tokyoHostelExp = allExpenses.find(e => e.description.includes("Tokyo hostel"));
  const kyotoExp = allExpenses.find(e => e.description.includes("Kyoto machiya"));
  const osakaExp = allExpenses.find(e => e.description.includes("Osaka Dormy"));
  const jrPassExp = allExpenses.find(e => e.description.includes("JR Pass"));
  const teamLabExp = allExpenses.find(e => e.description.includes("teamLab"));
  const tsukijiExp = allExpenses.find(e => e.description.includes("Tsukiji"));
  const karaokeExp = allExpenses.find(e => e.description.includes("karaoke"));

  const paymentRecords = [];

  // Tokyo hostel: you paid, some owe you (all unpaid for clean owed balance)
  if (tokyoHostelExp) {
    const share = Math.round(1470 / members.length);
    paymentRecords.push(
      { expense_id: tokyoHostelExp.id, sender_email: em("kaitonishi"),  sender_name: nm("kaitonishi"),  receiver_email: myEmail, receiver_name: myName, amount: share, payment_method: "venmo", status: "unpaid" },
      { expense_id: tokyoHostelExp.id, sender_email: em("zoepark__"),   sender_name: nm("zoepark__"),   receiver_email: myEmail, receiver_name: myName, amount: share, payment_method: "venmo", status: "unpaid" },
      { expense_id: tokyoHostelExp.id, sender_email: em("marcuschen"),  sender_name: nm("marcuschen"),  receiver_email: myEmail, receiver_name: myName, amount: share, payment_method: "venmo", status: "unpaid" },
    );
  }

  // Kyoto machiya: Kaito paid, you and others owe back (you owe unpaid, others confirmed/pending)
  if (kyotoExp) {
    const share = Math.round(3080 / members.length);
    paymentRecords.push(
      { expense_id: kyotoExp.id, sender_email: myEmail,         sender_name: myName,         receiver_email: em("kaitonishi"), receiver_name: nm("kaitonishi"), amount: share, payment_method: "venmo", status: "unpaid" },
      { expense_id: kyotoExp.id, sender_email: em("priyasharma"), sender_name: nm("priyasharma"), receiver_email: em("kaitonishi"), receiver_name: nm("kaitonishi"), amount: share, payment_method: "venmo", status: "confirmed" },
      { expense_id: kyotoExp.id, sender_email: em("alexrivers"),  sender_name: nm("alexrivers"),  receiver_email: em("kaitonishi"), receiver_name: nm("kaitonishi"), amount: share, payment_method: "cashapp", status: "pending" },
    );
  }

  // JR Pass: Marcus paid, split payments back (all unpaid to you for clean owed summary)
  if (jrPassExp) {
    const share = Math.round(2338 / members.length);
    paymentRecords.push(
      { expense_id: jrPassExp.id, sender_email: em("zoepark__"),   sender_name: nm("zoepark__"),   receiver_email: em("marcuschen"), receiver_name: nm("marcuschen"), amount: share, payment_method: "venmo", status: "unpaid" },
      { expense_id: jrPassExp.id, sender_email: em("kaitonishi"),  sender_name: nm("kaitonishi"),  receiver_email: em("marcuschen"), receiver_name: nm("marcuschen"), amount: share, payment_method: "venmo", status: "unpaid" },
      { expense_id: jrPassExp.id, sender_email: em("priyasharma"), sender_name: nm("priyasharma"), receiver_email: em("marcuschen"), receiver_name: nm("marcuschen"), amount: share, payment_method: "cashapp", status: "unpaid" },
    );
  }

  // teamLab: Zoe paid, you owe her (unpaid to show owed state)
  if (teamLabExp) {
    const share = Math.round(196 / members.length);
    paymentRecords.push(
      { expense_id: teamLabExp.id, sender_email: myEmail,         sender_name: myName,         receiver_email: em("zoepark__"), receiver_name: nm("zoepark__"), amount: share, payment_method: "venmo", status: "unpaid" },
      { expense_id: teamLabExp.id, sender_email: em("miaxtan"),    sender_name: nm("miaxtan"),    receiver_email: em("zoepark__"), receiver_name: nm("zoepark__"), amount: share, payment_method: "venmo", status: "unpaid" },
    );
  }

  // Tsukiji: Alex paid, split back (you owe unpaid)
  if (tsukijiExp) {
    const share = Math.round(343 / members.length);
    paymentRecords.push(
      { expense_id: tsukijiExp.id, sender_email: myEmail,         sender_name: myName,         receiver_email: em("alexrivers"), receiver_name: nm("alexrivers"), amount: share, payment_method: "venmo", status: "unpaid" },
      { expense_id: tsukijiExp.id, sender_email: em("marcuschen"),  sender_name: nm("marcuschen"),  receiver_email: em("alexrivers"), receiver_name: nm("alexrivers"), amount: share, payment_method: "venmo", status: "unpaid" },
    );
  }

  // Karaoke: Kaito paid, some owe (all unpaid for clean owed state)
  if (karaokeExp) {
    const share = Math.round(112 / members.length);
    paymentRecords.push(
      { expense_id: karaokeExp.id, sender_email: em("zoepark__"),   sender_name: nm("zoepark__"),   receiver_email: em("kaitonishi"), receiver_name: nm("kaitonishi"), amount: share, payment_method: "venmo", status: "unpaid" },
      { expense_id: karaokeExp.id, sender_email: em("miaxtan"),     sender_name: nm("miaxtan"),     receiver_email: em("kaitonishi"), receiver_name: nm("kaitonishi"), amount: share, payment_method: "cashapp", status: "unpaid" },
    );
  }

  let payCount = 0;
  for (const r of paymentRecords) {
    await base44.entities.Payment.create({ trip_id: trip.id, ...r });
    payCount++;
    if (payCount % 5 === 0) log(`  payment ${payCount}/${paymentRecords.length}…`);
    await delay(100);
  }
  log(`  ✓ ${payCount} payments created`);

  log("Creating Polls + votes…");
  const p1 = await base44.entities.TripPoll.create({ trip_id: trip.id, question: "how many days in each city??", options: ["7 Tokyo / 4 Kyoto / 3 Osaka","5 Tokyo / 5 Kyoto / 4 Osaka","6 Tokyo / 3 Kyoto / 5 Osaka"], created_by_email: em("kaitonishi"), created_by_name: nm("kaitonishi"), is_closed: true });
  const p2 = await base44.entities.TripPoll.create({ trip_id: trip.id, question: "team capsule hostel or separate hotel rooms??", options: ["capsule all the way (save money)","hotel rooms pls i need sleep","split it – hostel tokyo, hotel kyoto+osaka"], created_by_email: em("marcuschen"), created_by_name: nm("marcuschen"), is_closed: true });
  const p3 = await base44.entities.TripPoll.create({ trip_id: trip.id, question: "last night in osaka – big splurge dinner or street food crawl?", options: ["splurge dinner (kaiseki omakase)","street food crawl in dotonbori","both lol (dinner early, street food late)"], created_by_email: em("priyasharma"), created_by_name: nm("priyasharma"), is_closed: false });
  await Promise.all([
    base44.entities.TripPollVote.create({ poll_id: p1.id, trip_id: trip.id, voter_email: em("kaitonishi"),  voter_name: nm("kaitonishi"),  option_index: 0 }),
    base44.entities.TripPollVote.create({ poll_id: p1.id, trip_id: trip.id, voter_email: em("zoepark__"),   voter_name: nm("zoepark__"),   option_index: 0 }),
    base44.entities.TripPollVote.create({ poll_id: p1.id, trip_id: trip.id, voter_email: em("marcuschen"),  voter_name: nm("marcuschen"),  option_index: 2 }),
    base44.entities.TripPollVote.create({ poll_id: p1.id, trip_id: trip.id, voter_email: em("priyasharma"), voter_name: nm("priyasharma"), option_index: 0 }),
    base44.entities.TripPollVote.create({ poll_id: p1.id, trip_id: trip.id, voter_email: em("alexrivers"),  voter_name: nm("alexrivers"),  option_index: 1 }),
    base44.entities.TripPollVote.create({ poll_id: p1.id, trip_id: trip.id, voter_email: em("miaxtan"),     voter_name: nm("miaxtan"),     option_index: 0 }),
    base44.entities.TripPollVote.create({ poll_id: p2.id, trip_id: trip.id, voter_email: em("kaitonishi"),  voter_name: nm("kaitonishi"),  option_index: 2 }),
    base44.entities.TripPollVote.create({ poll_id: p2.id, trip_id: trip.id, voter_email: em("zoepark__"),   voter_name: nm("zoepark__"),   option_index: 0 }),
    base44.entities.TripPollVote.create({ poll_id: p2.id, trip_id: trip.id, voter_email: em("marcuschen"),  voter_name: nm("marcuschen"),  option_index: 1 }),
    base44.entities.TripPollVote.create({ poll_id: p2.id, trip_id: trip.id, voter_email: em("priyasharma"), voter_name: nm("priyasharma"), option_index: 2 }),
    base44.entities.TripPollVote.create({ poll_id: p3.id, trip_id: trip.id, voter_email: em("zoepark__"),   voter_name: nm("zoepark__"),   option_index: 2 }),
    base44.entities.TripPollVote.create({ poll_id: p3.id, trip_id: trip.id, voter_email: em("miaxtan"),     voter_name: nm("miaxtan"),     option_index: 0 }),
  ]);
  log("  ✓ Polls + votes created");

  log("Creating Messages…");
  const msgs = [
    { sender_email: em("kaitonishi"), sender_name: nm("kaitonishi"), content: "ok i've been researching this trip for 6 months and i refuse to waste a single meal" },
    { sender_email: em("zoepark__"),  sender_name: nm("zoepark__"),  content: "kaito we know. you sent the spreadsheet at 2am on a wednesday" },
    { sender_email: em("marcuschen"), sender_name: nm("marcuschen"), content: "the spreadsheet is actually really good though let's be honest" },
    { sender_email: em("miaxtan"),    sender_name: nm("miaxtan"),    content: "i've already planned my harajuku budget separately. please don't judge me" },
    { sender_email: em("priyasharma"),sender_name: nm("priyasharma"),content: "mia how much is 'separately'" },
    { sender_email: em("miaxtan"),    sender_name: nm("miaxtan"),    content: "we don't need to talk about it" },
    { sender_email: em("alexrivers"), sender_name: nm("alexrivers"), content: "i'm bringing 3 camera bodies btw. just a warning. the content will be incredible" },
    { sender_email: em("kaitonishi"), sender_name: nm("kaitonishi"), content: "golden gai is the plan for night 1. kaito's rule: we try at least 3 different bars. no bail outs" },
    { sender_email: em("zoepark__"),  sender_name: nm("zoepark__"),  content: "what if one of the bars is doing something illegal" },
    { sender_email: em("kaitonishi"), sender_name: nm("kaitonishi"), content: "then we try 2 bars" },
    { sender_email: em("marcuschen"), sender_name: nm("marcuschen"), content: "JR pass just got shipped to my address. $334/person. venmo me pls or i will become your worst enemy" },
    { sender_email: em("priyasharma"),sender_name: nm("priyasharma"),content: "sent!! also can we talk about the deer in nara. i've seen videos. i'm terrified." },
    { sender_email: em("miaxtan"),    sender_name: nm("miaxtan"),    content: "they will bow at you and it's the most wholesome thing on earth and then immediately steal your food" },
    { sender_email: em("alexrivers"), sender_name: nm("alexrivers"), content: "i'm getting the shot of priya getting mugged by a deer. it's going on my portfolio." },
  ];
  for (const m of msgs) { await base44.entities.TripMessage.create({ trip_id: trip.id, ...m, message_type: "text" }); }
  log(`  ✓ ${msgs.length} messages created`);

  log("Creating Links + Notifications…");
  await Promise.all([
    base44.entities.TripLink.create({ trip_id: trip.id, url: "https://www.teamlab.art/e/planets/", title: "teamLab Planets – Tokyo",   note: "book asap it sells out. barefoot exhibit. go after 4pm for smaller crowds", category: "activity", shared_by_email: em("zoepark__"),  shared_by_name: nm("zoepark__") }),
    base44.entities.TripLink.create({ trip_id: trip.id, url: "https://www.jrailpass.com/",         title: "JR Pass – 14 Day",          note: "marcus already ordered for everyone. $334 each. reimburse him",            category: "other",    shared_by_email: em("marcuschen"), shared_by_name: nm("marcuschen") }),
    base44.entities.TripLink.create({ trip_id: trip.id, url: "https://www.ichiranusa.com/",        title: "Ichiran Ramen – solo booths",note: "the private booth experience is life-changing. shibuya location has shortest line", category: "food", shared_by_email: em("kaitonishi"), shared_by_name: nm("kaitonishi") }),
    base44.entities.Notification.create({ user_email: em("zoepark__"),   type: "trip_added",     message: "Kaito added you to japan summer 2026 🍜", related_user_email: em("kaitonishi"), related_user_name: nm("kaitonishi"), related_trip_id: trip.id, is_read: true }),
    base44.entities.Notification.create({ user_email: em("marcuschen"),  type: "trip_added",     message: "Kaito added you to japan summer 2026 🍜", related_user_email: em("kaitonishi"), related_user_name: nm("kaitonishi"), related_trip_id: trip.id, is_read: true }),
    base44.entities.Notification.create({ user_email: em("priyasharma"), type: "trip_added",     message: "Kaito added you to japan summer 2026 🍜", related_user_email: em("kaitonishi"), related_user_name: nm("kaitonishi"), related_trip_id: trip.id, is_read: false }),
    base44.entities.Notification.create({ user_email: em("kaitonishi"),  type: "friend_request", message: "Zoe Park sent you a friend request",      related_user_email: em("zoepark__"),  related_user_name: nm("zoepark__"),  is_read: false }),
  ]);
  log("  ✓ Links + notifications created");

  log("Creating Friendships…");
  await Promise.all([
    base44.entities.Friendship.create({ user1_email: em("kaitonishi"),  user2_email: em("zoepark__") }),
    base44.entities.Friendship.create({ user1_email: em("kaitonishi"),  user2_email: em("marcuschen") }),
    base44.entities.Friendship.create({ user1_email: em("kaitonishi"),  user2_email: em("miaxtan") }),
    base44.entities.Friendship.create({ user1_email: em("priyasharma"), user2_email: em("alexrivers") }),
    base44.entities.Friendship.create({ user1_email: em("zoepark__"),   user2_email: em("miaxtan") }),
  ]);
  log("  ✓ Friendships created");

  log("🎌 Japan trip seeded!");
}

// ─── MIAMI seeder ─────────────────────────────────────────────────────────────
async function seedMiami(log, me) {
  const myEmail = me.email;
  const myName = me.full_name || me.email.split("@")[0];
  const INVITE_CODE = `${DEMO_TAG}MIAMI26`;

  const existingTrips = await base44.entities.Trip.filter({}, "-created_date", 200);
  if (existingTrips.some((t) => t.invite_code === INVITE_CODE)) {
    throw new Error("Miami trip already exists. Clear it first.");
  }

  log("Creating Miami profiles…");
  await ensureProfiles(MIAMI_USERS, log);

  log("Creating Miami trip…");
  const members = [myEmail, em("jasminewade"), em("ninarodz"), em("chloekim")];
  const trip = await base44.entities.Trip.create({
    name: "miami girls weekend 💋", destination: "Miami, FL",
    description: "we deserve this honestly",
    start_date: "2026-06-13", end_date: "2026-06-16",
    admin_email: myEmail, member_emails: members,
    invite_code: INVITE_CODE, invite_active: true,
    cover_image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
    theme_color: "#FF7A45",
  });
  log("  ✓ Trip created");

  log("Creating TripMembers…");
  await Promise.all([
    base44.entities.TripMember.create({ trip_id: trip.id, user_email: myEmail,              user_name: myName,               role: "admin",  status: "active" }),
    base44.entities.TripMember.create({ trip_id: trip.id, user_email: em("jasminewade"),    user_name: nm("jasminewade"),    role: "member", status: "active",  invited_by_email: myEmail }),
    base44.entities.TripMember.create({ trip_id: trip.id, user_email: em("ninarodz"),       user_name: nm("ninarodz"),       role: "member", status: "active",  invited_by_email: myEmail }),
    base44.entities.TripMember.create({ trip_id: trip.id, user_email: em("chloekim"),       user_name: nm("chloekim"),       role: "member", status: "active",  invited_by_email: myEmail }),
  ]);
  log("  ✓ TripMembers created");

  log("Creating Arrivals…");
  await Promise.all([
    base44.entities.Arrival.create({ trip_id: trip.id, user_email: em("jasminewade"), user_name: nm("jasminewade"), travel_type: "Flight", is_round_trip: true, arrival_location: "JFK", destination: "MIA", arrival_date: "2026-06-13", arrival_time: "10:30", departure_date: "2026-06-16", departure_time: "19:00", airline: "JetBlue", outbound_flight_number: "B6421", return_flight_number: "B6422" }),
    base44.entities.Arrival.create({ trip_id: trip.id, user_email: em("amaraosei"),   user_name: nm("amaraosei"),   travel_type: "Flight", is_round_trip: true, arrival_location: "ATL", destination: "MIA", arrival_date: "2026-06-13", arrival_time: "11:15", departure_date: "2026-06-16", departure_time: "20:30", airline: "Delta",   outbound_flight_number: "DL403", return_flight_number: "DL404" }),
  ]);
  log("  ✓ Arrivals created");

  log("Creating Lodging…");
  await base44.entities.Lodging.create({ trip_id: trip.id, name: "Airbnb – South Beach Apt", address: "1130 Collins Ave, Miami Beach, FL", price_per_night: 285, check_in: "2026-06-13", check_out: "2026-06-16", notes: "2BR 2BA. Amara has the code. DO NOT lose the parking pass", guest_emails: members });
  log("  ✓ Lodging created");

  log("Creating Itinerary…");
  const itinItems = [
    { date: "2026-06-13", time: "14:00", title: "check in + pool time 🏊",       location: "South Beach Airbnb",      notes: "settle in, cool off",                                                   is_required: true },
    { date: "2026-06-13", time: "19:30", title: "dinner at Carbone 🍝",            location: "South Beach",             notes: "reservation under Jasmine",                                               is_required: true },
    { date: "2026-06-14", time: "10:00", title: "bottomless brunch 🍾",            location: "Epic Hotel",              notes: "Zuma — yes it's fancy, yes it's worth it",                               is_required: true },
    { date: "2026-06-14", time: "15:00", title: "beach day 🌊",                    location: "South Beach",             notes: "bronze, relax, content",                                                 is_required: false },
    { date: "2026-06-15", time: "19:00", title: "nightclub 🎉",                    location: "Fontainebleau",           notes: "LIV table — dress your best",                                            is_required: true },
    { date: "2026-06-16", time: "10:00", title: "last coffee + goodbye",           location: "Café La Trova",           notes: "final cuban moment then off",                                            is_required: true },
  ];
  // Note: times stored in 24hr format, displayed as 12-hour AM/PM in UI
  for (const r of itinItems) {
    await base44.entities.ItineraryItem.create({ trip_id: trip.id, ...r });
    await delay(80);
  }
  log(`  ✓ ${itinItems.length} itinerary items created`);

  log("Creating Expenses…");
  const expenses = [
    { description: "South Beach Airbnb – 3 nights",    amount: 720, paid_by: myEmail,           paid_by_name: myName,            split_among: members, category: "lodging",   trip_wide: true,  is_settled: false },
    { description: "Carbone dinner",                    amount: 380, paid_by: em("jasminewade"), paid_by_name: nm("jasminewade"), split_among: members, category: "food",      trip_wide: false, day_number: 1, is_settled: true, settlement_notes: "paid back Venmo day 1" },
    { description: "Zuma brunch",                       amount: 320, paid_by: em("ninarodz"),    paid_by_name: nm("ninarodz"),    split_among: members, category: "food",      trip_wide: false, day_number: 2, is_settled: false },
    { description: "Uber to South Beach",              amount: 48,  paid_by: em("chloekim"),    paid_by_name: nm("chloekim"),    split_among: members, category: "transport", trip_wide: false, day_number: 1, is_settled: false },
    { description: "Beach cabana rental",               amount: 200, paid_by: myEmail,           paid_by_name: myName,            split_among: members, category: "activity",  trip_wide: false, day_number: 2, is_settled: false },
    { description: "Nightclub – LIV table",             amount: 500, paid_by: myEmail,           paid_by_name: myName,            split_among: members, category: "activity",  trip_wide: false, day_number: 3, is_settled: false },
  ];
  for (const r of expenses) {
    await base44.entities.Expense.create({ trip_id: trip.id, ...r });
    await delay(80);
  }
  log(`  ✓ ${expenses.length} expenses created`);

  log("Creating Payments (varied statuses)…");
  await delay(500);
  const allExpenses = await base44.entities.Expense.filter({ trip_id: trip.id }, "-created_date", 50);
  const airbnbExp = allExpenses.find(e => e.description.includes("South Beach Airbnb"));
  const uberExp = allExpenses.find(e => e.description.includes("Uber to South Beach"));
  const zumaExp = allExpenses.find(e => e.description.includes("Zuma brunch"));
  const cabanaExp = allExpenses.find(e => e.description.includes("cabana"));
  const livExp = allExpenses.find(e => e.description.includes("LIV table"));

  const paymentRecords = [];
  
  // Airbnb: split 4 ways, some unpaid, some confirmed
  if (airbnbExp) {
    const share = Math.round(720 / 4);
    paymentRecords.push(
      { expense_id: airbnbExp.id, sender_email: em("jasminewade"),  sender_name: nm("jasminewade"),  receiver_email: myEmail, receiver_name: myName, amount: share, payment_method: "venmo",   status: "confirmed" },
      { expense_id: airbnbExp.id, sender_email: em("ninarodz"),     sender_name: nm("ninarodz"),     receiver_email: myEmail, receiver_name: myName, amount: share, payment_method: "venmo",   status: "unpaid" },
      { expense_id: airbnbExp.id, sender_email: em("chloekim"),     sender_name: nm("chloekim"),     receiver_email: myEmail, receiver_name: myName, amount: share, payment_method: "cashapp", status: "unpaid" },
    );
  }

  // Uber: Chloe owes (unpaid)
  if (uberExp) {
    const share = Math.round(48 / 4);
    paymentRecords.push(
      { expense_id: uberExp.id, sender_email: myEmail,         sender_name: myName,         receiver_email: em("chloekim"), receiver_name: nm("chloekim"), amount: share, payment_method: "venmo", status: "unpaid" },
      { expense_id: uberExp.id, sender_email: em("jasminewade"), sender_name: nm("jasminewade"), receiver_email: em("chloekim"), receiver_name: nm("chloekim"), amount: share, payment_method: "venmo", status: "unpaid" },
    );
  }

  // Zuma: Nina owes you (unpaid to show owed balance)
  if (zumaExp) {
    const share = Math.round(320 / 4);
    paymentRecords.push(
      { expense_id: zumaExp.id, sender_email: myEmail,         sender_name: myName,         receiver_email: em("ninarodz"), receiver_name: nm("ninarodz"), amount: share, payment_method: "venmo", status: "unpaid" },
      { expense_id: zumaExp.id, sender_email: em("chloekim"),     sender_name: nm("chloekim"),     receiver_email: em("ninarodz"), receiver_name: nm("ninarodz"), amount: share, payment_method: "venmo", status: "unpaid" },
      { expense_id: zumaExp.id, sender_email: em("jasminewade"),  sender_name: nm("jasminewade"),  receiver_email: em("ninarodz"), receiver_name: nm("ninarodz"), amount: share, payment_method: "cashapp", status: "confirmed" },
    );
  }

  // Cabana: you paid, some owe you back (balanced — some unpaid, some owe you)
  if (cabanaExp) {
    const share = Math.round(200 / 4);
    paymentRecords.push(
      { expense_id: cabanaExp.id, sender_email: em("ninarodz"),     sender_name: nm("ninarodz"),     receiver_email: myEmail, receiver_name: myName, amount: share, payment_method: "venmo",   status: "unpaid" },
      { expense_id: cabanaExp.id, sender_email: em("jasminewade"),  sender_name: nm("jasminewade"),  receiver_email: myEmail, receiver_name: myName, amount: share, payment_method: "venmo",   status: "unpaid" },
      { expense_id: cabanaExp.id, sender_email: em("chloekim"),     sender_name: nm("chloekim"),     receiver_email: myEmail, receiver_name: myName, amount: share, payment_method: "cashapp", status: "unpaid" },
    );
  }

  // LIV: you paid, some owe you (unpaid for clean balance view)
  if (livExp) {
    const share = Math.round(500 / 4);
    paymentRecords.push(
      { expense_id: livExp.id, sender_email: em("ninarodz"),     sender_name: nm("ninarodz"),     receiver_email: myEmail, receiver_name: myName, amount: share, payment_method: "venmo",   status: "unpaid" },
      { expense_id: livExp.id, sender_email: em("chloekim"),     sender_name: nm("chloekim"),     receiver_email: myEmail, receiver_name: myName, amount: share, payment_method: "cashapp", status: "unpaid" },
    );
  }

  let payCount = 0;
  for (const r of paymentRecords) {
    await base44.entities.Payment.create({ trip_id: trip.id, ...r });
    payCount++;
    if (payCount % 5 === 0) log(`  payment ${payCount}/${paymentRecords.length}…`);
    await delay(100);
  }
  log(`  ✓ ${payCount} payments created`);

  log("Creating Polls + votes…");
  const pm1 = await base44.entities.TripPoll.create({ trip_id: trip.id, question: "nightclub or lounge Saturday?", options: ["LIV at Fontainebleau","lounge vibe","beach bar"], created_by_email: em("ninarodz"), created_by_name: nm("ninarodz"), is_closed: false });
  await Promise.all([
    base44.entities.TripPollVote.create({ poll_id: pm1.id, trip_id: trip.id, voter_email: em("jasminewade"), voter_name: nm("jasminewade"), option_index: 0 }),
    base44.entities.TripPollVote.create({ poll_id: pm1.id, trip_id: trip.id, voter_email: em("chloekim"),    voter_name: nm("chloekim"),    option_index: 0 }),
  ]);
  log("  ✓ Polls + votes created");

  log("Creating Messages…");
  const msgs = [
    { sender_email: em("jasminewade"),  sender_name: nm("jasminewade"),  content: "airbnb is confirmed!! 2 bed steps from the beach 🏖️" },
    { sender_email: em("ninarodz"),     sender_name: nm("ninarodz"),     content: "ok what's the vibe for outfits? all white? pastels?" },
    { sender_email: em("chloekim"),     sender_name: nm("chloekim"),     content: "carbone night i'm going full glam. beach days are white" },
    { sender_email: em("jasminewade"),  sender_name: nm("jasminewade"),  content: "carbone reservation is LOCKED. jas name. pls don't be late 😭" },
    { sender_email: em("ninarodz"),     sender_name: nm("ninarodz"),     content: "who's hyped for LIV?? i need that nightclub energy" },
    { sender_email: em("chloekim"),     sender_name: nm("chloekim"),     content: "corset dress szn. let's go" },
  ];
  for (const m of msgs) { await base44.entities.TripMessage.create({ trip_id: trip.id, ...m, message_type: "text" }); }
  log(`  ✓ ${msgs.length} messages created`);

  log("Creating Links + Notifications…");
  await Promise.all([
    base44.entities.TripLink.create({ trip_id: trip.id, url: "https://carbonemiami.com/", title: "Carbone Miami", note: "reservation under jasmine", category: "food", shared_by_email: em("jasminewade"), shared_by_name: nm("jasminewade") }),
    base44.entities.TripLink.create({ trip_id: trip.id, url: "https://fontainebleau.com/nightlife/liv", title: "LIV Nightclub", note: "saturday night table", category: "nightlife", shared_by_email: em("ninarodz"), shared_by_name: nm("ninarodz") }),
    base44.entities.Notification.create({ user_email: em("ninarodz"),  type: "trip_added", message: "Jasmine added you to miami girls weekend 💋", related_user_email: em("jasminewade"), related_user_name: nm("jasminewade"), related_trip_id: trip.id, is_read: true }),
    base44.entities.Notification.create({ user_email: em("chloekim"), type: "trip_added", message: "Jasmine added you to miami girls weekend 💋", related_user_email: em("jasminewade"), related_user_name: nm("jasminewade"), related_trip_id: trip.id, is_read: true }),
  ]);
  log("  ✓ Links + notifications created");

  log("Creating Friendships…");
  await Promise.all([
    base44.entities.Friendship.create({ user1_email: em("jasminewade"), user2_email: em("ninarodz") }),
    base44.entities.Friendship.create({ user1_email: em("chloekim"),    user2_email: em("ninarodz") }),
  ]);
  log("  ✓ Friendships created");

  log("🌴 Miami trip seeded!");
}

// ─── FESTIVAL seeder ──────────────────────────────────────────────────────────
async function seedFest(log, me) {
  const myEmail = me.email;
  const myName = me.full_name || me.email.split("@")[0];
  const INVITE_CODE = `${DEMO_TAG}FEST26`;

  const existingTrips = await base44.entities.Trip.filter({}, "-created_date", 200);
  if (existingTrips.some((t) => t.invite_code === INVITE_CODE)) {
    throw new Error("Desert Festival trip already exists. Clear it first.");
  }

  log("Creating Festival profiles…");
  await ensureProfiles(FEST_USERS, log);

  log("Creating Festival trip…");
  const members = [myEmail, em("jakemor"), em("taliaburns"), em("domwalker"), em("lexihayes"), em("omarali"), em("simoneduval"), em("ryanchang"), em("kelseymoon"), em("theovas"), em("danaokafor")];
  const trip = await base44.entities.Trip.create({
    name: "desert fest 🎪", destination: "Indio, CA",
    description: "10 people, 1 airbnb, zero curfew",
    start_date: "2026-04-17", end_date: "2026-04-21",
    admin_email: myEmail, member_emails: members,
    invite_code: INVITE_CODE, invite_active: false,
    cover_image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80",
    theme_color: "#7C3AED",
  });
  log("  ✓ Trip created");

  log("Creating TripMembers…");
  const tms = [
    { user_email: myEmail,             user_name: myName,              role: "admin",  status: "active" },
    { user_email: em("jakemor"),       user_name: nm("jakemor"),       role: "member", status: "active",  invited_by_email: myEmail },
    { user_email: em("taliaburns"),    user_name: nm("taliaburns"),    role: "member", status: "active",  invited_by_email: myEmail },
    { user_email: em("domwalker"),     user_name: nm("domwalker"),     role: "member", status: "active",  invited_by_email: myEmail },
    { user_email: em("lexihayes"),     user_name: nm("lexihayes"),     role: "member", status: "active",  invited_by_email: myEmail },
    { user_email: em("omarali"),       user_name: nm("omarali"),       role: "member", status: "active",  invited_by_email: myEmail },
    { user_email: em("simoneduval"),   user_name: nm("simoneduval"),   role: "member", status: "active",  invited_by_email: myEmail },
    { user_email: em("ryanchang"),     user_name: nm("ryanchang"),     role: "member", status: "active",  invited_by_email: myEmail },
    { user_email: em("kelseymoon"),    user_name: nm("kelseymoon"),    role: "member", status: "active",  invited_by_email: myEmail },
    { user_email: em("theovas"),       user_name: nm("theovas"),       role: "member", status: "active",  invited_by_email: myEmail },
    { user_email: em("danaokafor"),    user_name: nm("danaokafor"),    role: "member", status: "active",  invited_by_email: myEmail },
  ];
  await Promise.all(tms.map((r) => base44.entities.TripMember.create({ trip_id: trip.id, ...r })));
  log("  ✓ TripMembers created");

  log("Creating Arrivals + Lodging…");
  await Promise.all([
    base44.entities.Arrival.create({ trip_id: trip.id, user_email: em("jakemor"),    user_name: nm("jakemor"),    travel_type: "Driving", is_round_trip: true, arrival_location: "Los Angeles, CA", destination: "Indio, CA", arrival_date: "2026-04-17", arrival_time: "14:00" }),
    base44.entities.Arrival.create({ trip_id: trip.id, user_email: em("taliaburns"), user_name: nm("taliaburns"), travel_type: "Flight",  is_round_trip: true, arrival_location: "SFO", destination: "PSP", arrival_date: "2026-04-17", arrival_time: "12:30", departure_date: "2026-04-21", departure_time: "16:00", airline: "Southwest", outbound_flight_number: "WN2210", return_flight_number: "WN2211" }),
    base44.entities.Lodging.create({ trip_id: trip.id, name: "Airbnb – Desert Compound", address: "47600 Eisenhower Dr, La Quinta, CA", price_per_night: 650, check_in: "2026-04-17", check_out: "2026-04-21", notes: "4 beds, pool, outdoor firepit. Jake's on the pullout. sorryyyyy", guest_emails: members }),
  ]);
  log("  ✓ Arrivals + Lodging created");

  log("Creating Itinerary…");
  const itinItems = [
    { date: "2026-04-17", time: "16:00", title: "arrive + airbnb setup 🏠",        location: "La Quinta, CA",             notes: "Talia has a chore chart don't laugh at her. she's right to have one",                   is_required: true },
    { date: "2026-04-17", time: "19:00", title: "Target run + grocery haul",        location: "Palm Desert, CA",           notes: "pool noodles, sunscreen, electrolytes, snacks. Jake is NOT in charge of the list",       is_required: true },
    { date: "2026-04-18", time: "14:00", title: "day 1 – festival gates open 🎶",   location: "Empire Polo Club, Indio",   notes: "Dom has the lineup printed out. meeting at art installations at 3pm no matter what",    is_required: true },
    { date: "2026-04-18", time: "20:00", title: "headliner night 1 🎵",             location: "Main Stage, Empire Polo Club", notes: "everyone together for this one. pre-game at the airbnb at 6",                        is_required: true },
    { date: "2026-04-19", time: "10:00", title: "recovery brunch + pool day ☀️",   location: "Airbnb – La Quinta",        notes: "Kelsey is making eggs. someone bring Advil. pool floaties in the garage",              is_required: false },
    { date: "2026-04-19", time: "16:00", title: "day 2 – festival afternoon sets",  location: "Empire Polo Club, Indio",   notes: "split into groups if you want. text the group chat location updates",                  is_required: false },
    { date: "2026-04-19", time: "23:30", title: "late night In-N-Out run 🍔",       location: "In-N-Out Palm Desert",      notes: "animal style everything. Ryan is paying, everyone venmo him after",                    is_required: false },
    { date: "2026-04-20", time: "15:00", title: "day 3 – final day 🙌",             location: "Empire Polo Club, Indio",   notes: "merch table run first. get your stuff before it sells out",                           is_required: true },
    { date: "2026-04-21", time: "10:00", title: "pack up + clean airbnb",           location: "La Quinta, CA",             notes: "talia made a cleaning checklist. just do it. security deposit is $500",                is_required: true },
  ];
  // Note: times stored in 24hr format, displayed as 12-hour AM/PM in UI
  for (const r of itinItems) {
    await base44.entities.ItineraryItem.create({ trip_id: trip.id, ...r });
    await delay(80);
  }
  log(`  ✓ ${itinItems.length} itinerary items created`);

  log("Creating Expenses…");
  const expenses = [
    { description: "Airbnb La Quinta – 4 nights",              amount: 2600, paid_by: em("taliaburns"), paid_by_name: nm("taliaburns"), split_among: members, category: "lodging",   trip_wide: true,  is_settled: false },
    { description: "Festival passes – all 10 (3-day)",          amount: 4750, paid_by: em("jakemor"),    paid_by_name: nm("jakemor"),    split_among: members, category: "activity",  trip_wide: true,  is_settled: false },
    { description: "Parking pass (car 1)",                      amount: 125,  paid_by: em("jakemor"),    paid_by_name: nm("jakemor"),    split_among: [em("jakemor"), em("omarali"), em("ryanchang"), em("danaokafor")], category: "transport", trip_wide: false, day_number: 1, is_settled: false },
    { description: "Parking pass (car 2)",                      amount: 125,  paid_by: em("taliaburns"), paid_by_name: nm("taliaburns"), split_among: [em("taliaburns"), em("simoneduval"), em("kelseymoon"), em("theovas"), em("lexihayes")], category: "transport", trip_wide: false, day_number: 1, is_settled: false },
    { description: "Target run – supplies, booze, snacks",      amount: 387,  paid_by: em("domwalker"),  paid_by_name: nm("domwalker"),  split_among: members, category: "other",     trip_wide: false, day_number: 1, is_settled: false },
    { description: "Uber XL day 1 (airport to airbnb)",         amount: 94,   paid_by: em("taliaburns"), paid_by_name: nm("taliaburns"), split_among: [em("taliaburns"), em("simoneduval"), em("kelseymoon"), em("theovas"), em("lexihayes")], category: "transport", trip_wide: false, day_number: 1, is_settled: false },
    { description: "In-N-Out run – night 2",                    amount: 112,  paid_by: em("ryanchang"),  paid_by_name: nm("ryanchang"),  split_among: members, category: "food",      trip_wide: false, day_number: 3, is_settled: false },
    { description: "Merch – group buy (hoodies + hats)",        amount: 520,  paid_by: em("danaokafor"), paid_by_name: nm("danaokafor"), split_among: [em("danaokafor"), em("lexihayes"), em("simoneduval"), em("kelseymoon"), em("theovas")], category: "shopping", trip_wide: false, day_number: 4, is_settled: false },
    { description: "Chipotle lunch run",                        amount: 89,   paid_by: em("omarali"),    paid_by_name: nm("omarali"),    split_among: [em("omarali"), em("jakemor"), em("domwalker"), em("ryanchang")], category: "food", trip_wide: false, day_number: 2, is_settled: true, settlement_notes: "Jake paid Omar back $22" },
    { description: "Gas – both cars",                           amount: 148,  paid_by: em("jakemor"),    paid_by_name: nm("jakemor"),    split_among: members, category: "transport", trip_wide: false, day_number: 1, is_settled: false },
    { description: "Sunscreen, Advil, charger cables – CVS",   amount: 76,   paid_by: em("kelseymoon"), paid_by_name: nm("kelseymoon"), split_among: members, category: "other",     trip_wide: false, day_number: 1, is_settled: false },
  ];
  for (const r of expenses) {
    await base44.entities.Expense.create({ trip_id: trip.id, ...r });
    await delay(100);
  }
  log(`  ✓ ${expenses.length} expenses created`);

  // ── Payments: fetch expense IDs then create one-by-one with generous delays ──
  log("Creating Payments (throttled)…");
  await delay(500); // let expense writes settle
  const allExpenses = await base44.entities.Expense.filter({ trip_id: trip.id }, "-created_date", 50);
  const airbnbExp = allExpenses.find(e => e.description.includes("Airbnb La Quinta"));
  const passExp   = allExpenses.find(e => e.description.includes("Festival passes"));
  const targetExp = allExpenses.find(e => e.description.includes("Target run"));

  const paymentRecords = [];

  // Airbnb: Talia paid, some owe you back (all unpaid for clean owed balance)
  if (airbnbExp) {
    const share = Math.round(2600 / members.length);
    paymentRecords.push(
      { expense_id: airbnbExp.id, sender_email: em("domwalker"),  sender_name: nm("domwalker"),  receiver_email: myEmail, receiver_name: myName, amount: share, payment_method: "venmo",   status: "unpaid" },
      { expense_id: airbnbExp.id, sender_email: em("ryanchang"),  sender_name: nm("ryanchang"),  receiver_email: myEmail, receiver_name: myName, amount: share, payment_method: "cashapp", status: "unpaid" },
      { expense_id: airbnbExp.id, sender_email: em("omarali"),    sender_name: nm("omarali"),    receiver_email: myEmail, receiver_name: myName, amount: share, payment_method: "venmo",   status: "unpaid" },
      { expense_id: airbnbExp.id, sender_email: em("theovas"),    sender_name: nm("theovas"),    receiver_email: myEmail, receiver_name: myName, amount: share, payment_method: "cashapp", status: "unpaid" },
      { expense_id: airbnbExp.id, sender_email: em("lexihayes"),  sender_name: nm("lexihayes"),  receiver_email: myEmail, receiver_name: myName, amount: share, payment_method: "venmo",   status: "unpaid" },
      // You owe Talia back (unpaid)
      { expense_id: airbnbExp.id, sender_email: myEmail,         sender_name: myName,         receiver_email: em("taliaburns"), receiver_name: nm("taliaburns"), amount: share, payment_method: "venmo", status: "unpaid" },
    );
  }

  // Festival passes: Jake paid, all owe (all unpaid for clean owed state)
  if (passExp) {
    const share = Math.round(4750 / members.length);
    paymentRecords.push(
      { expense_id: passExp.id, sender_email: myEmail,         sender_name: myName,         receiver_email: em("jakemor"), receiver_name: nm("jakemor"), amount: share, payment_method: "venmo",   status: "unpaid" },
      { expense_id: passExp.id, sender_email: em("simoneduval"), sender_name: nm("simoneduval"), receiver_email: em("jakemor"), receiver_name: nm("jakemor"), amount: share, payment_method: "venmo",   status: "unpaid" },
      { expense_id: passExp.id, sender_email: em("kelseymoon"),  sender_name: nm("kelseymoon"),  receiver_email: em("jakemor"), receiver_name: nm("jakemor"), amount: share, payment_method: "venmo",   status: "unpaid" },
      { expense_id: passExp.id, sender_email: em("danaokafor"),  sender_name: nm("danaokafor"),  receiver_email: em("jakemor"), receiver_name: nm("jakemor"), amount: share, payment_method: "cashapp", status: "unpaid" },
      { expense_id: passExp.id, sender_email: em("ryanchang"),   sender_name: nm("ryanchang"),   receiver_email: em("jakemor"), receiver_name: nm("jakemor"), amount: share, payment_method: "cashapp", status: "unpaid" },
    );
  }

  // Target run: Dom paid, some owe back (all unpaid)
  if (targetExp) {
    const share = Math.round(387 / members.length);
    paymentRecords.push(
      { expense_id: targetExp.id, sender_email: myEmail,     sender_name: myName,     receiver_email: em("domwalker"), receiver_name: nm("domwalker"), amount: share, payment_method: "venmo", status: "unpaid" },
      { expense_id: targetExp.id, sender_email: em("lexihayes"), sender_name: nm("lexihayes"), receiver_email: em("domwalker"), receiver_name: nm("domwalker"), amount: share, payment_method: "venmo", status: "unpaid" },
      { expense_id: targetExp.id, sender_email: em("omarali"),   sender_name: nm("omarali"),   receiver_email: em("domwalker"), receiver_name: nm("domwalker"), amount: share, payment_method: "venmo", status: "unpaid" },
    );
  }

  let payCount = 0;
  for (const r of paymentRecords) {
    await base44.entities.Payment.create({ trip_id: trip.id, ...r });
    payCount++;
    log(`  payment ${payCount}/${paymentRecords.length}…`);
    await delay(200); // generous delay for the large festival batch
  }
  log(`  ✓ ${payCount} payments created`);

  log("Creating Polls + votes…");
  const pf1 = await base44.entities.TripPoll.create({ trip_id: trip.id, question: "who's driving car 2??", options: ["Jake volunteers","Talia (she already said yes sort of)","rent a 3rd car"], created_by_email: em("taliaburns"), created_by_name: nm("taliaburns"), is_closed: true });
  const pf2 = await base44.entities.TripPoll.create({ trip_id: trip.id, question: "recovery day 2 morning plan?", options: ["pool + do nothing","drive to Joshua Tree","brunch spot + afternoon set"], created_by_email: em("domwalker"), created_by_name: nm("domwalker"), is_closed: false });
  await Promise.all([
    base44.entities.TripPollVote.create({ poll_id: pf1.id, trip_id: trip.id, voter_email: em("jakemor"),    voter_name: nm("jakemor"),    option_index: 1 }),
    base44.entities.TripPollVote.create({ poll_id: pf1.id, trip_id: trip.id, voter_email: em("omarali"),    voter_name: nm("omarali"),    option_index: 1 }),
    base44.entities.TripPollVote.create({ poll_id: pf1.id, trip_id: trip.id, voter_email: em("ryanchang"),  voter_name: nm("ryanchang"),  option_index: 0 }),
    base44.entities.TripPollVote.create({ poll_id: pf1.id, trip_id: trip.id, voter_email: em("domwalker"),  voter_name: nm("domwalker"),  option_index: 1 }),
    base44.entities.TripPollVote.create({ poll_id: pf2.id, trip_id: trip.id, voter_email: em("kelseymoon"), voter_name: nm("kelseymoon"), option_index: 0 }),
    base44.entities.TripPollVote.create({ poll_id: pf2.id, trip_id: trip.id, voter_email: em("simoneduval"),voter_name: nm("simoneduval"),option_index: 2 }),
    base44.entities.TripPollVote.create({ poll_id: pf2.id, trip_id: trip.id, voter_email: em("lexihayes"),  voter_name: nm("lexihayes"),  option_index: 0 }),
  ]);
  log("  ✓ Polls + votes created");

  log("Creating Messages…");
  const msgs = [
    { sender_email: em("taliaburns"),  sender_name: nm("taliaburns"),  content: "LOGISTICS THREAD. please read. airbnb is confirmed. $260/person for 4 nights. venmo me @talia-b" },
    { sender_email: em("jakemor"),     sender_name: nm("jakemor"),     content: "talia being talia. love you. sent." },
    { sender_email: em("domwalker"),   sender_name: nm("domwalker"),   content: "lineup just dropped btw. i have the PDF. sending in files. clear your schedule friday 9pm" },
    { sender_email: em("ryanchang"),   sender_name: nm("ryanchang"),   content: "ok so who's getting snacks for the drive. i can do it but i need a grocery list because i will buy only chips and nothing else" },
    { sender_email: em("kelseymoon"),  sender_name: nm("kelseymoon"),  content: "i'll make a list ryan. don't buy the 'family size' pringles again" },
    { sender_email: em("ryanchang"),   sender_name: nm("ryanchang"),   content: "the family size pringles were a hit and i stand by that decision" },
    { sender_email: em("omarali"),     sender_name: nm("omarali"),     content: "i have a portable speaker btw. don't buy another one. theo i'm looking at you" },
    { sender_email: em("theovas"),     sender_name: nm("theovas"),     content: "i already ordered one and it arrives tomorrow. you're welcome" },
    { sender_email: em("simoneduval"), sender_name: nm("simoneduval"), content: "at what point do we just admit we're going to spend the first day fighting about which stage to go to and make peace with it now" },
    { sender_email: em("lexihayes"),   sender_name: nm("lexihayes"),   content: "simone is right. proposed solution: split up, regroup at the art installation at 7, headliner together" },
    { sender_email: em("taliaburns"),  sender_name: nm("taliaburns"),  content: "this is literally what i said two weeks ago but sure, now it's a good idea" },
    { sender_email: em("danaokafor"),  sender_name: nm("danaokafor"),  content: "reminder: PLEASE look at the camera when i'm filming. not at your phones. i'm making a video and you will all thank me later" },
    { sender_email: em("jakemor"),     sender_name: nm("jakemor"),     content: "ok but fr who still hasn't paid talia for the airbnb. she's too nice to chase you but i'm not." },
    { sender_email: em("theovas"),     sender_name: nm("theovas"),     content: "paying right now don't @ me" },
  ];
  for (const m of msgs) { await base44.entities.TripMessage.create({ trip_id: trip.id, ...m, message_type: "text" }); }
  log(`  ✓ ${msgs.length} messages created`);

  log("Creating Links + Notifications…");
  await Promise.all([
    base44.entities.TripLink.create({ trip_id: trip.id, url: "https://www.coachella.com/", title: "Coachella 2026 Lineup", note: "dom's lineup breakdown doc is pinned in the chat. friday headliner is a must", category: "activity", shared_by_email: em("domwalker"), shared_by_name: nm("domwalker") }),
    base44.entities.TripLink.create({ trip_id: trip.id, url: "https://www.in-n-out.com/", title: "In-N-Out Palm Desert", note: "2 min from festival exit. animal style double double. this is happening every night", category: "food", shared_by_email: em("ryanchang"), shared_by_name: nm("ryanchang") }),
    base44.entities.Notification.create({ user_email: em("domwalker"), type: "trip_added", message: "Jake added you to desert fest 🎪", related_user_email: em("jakemor"), related_user_name: nm("jakemor"), related_trip_id: trip.id, is_read: true }),
    base44.entities.Notification.create({ user_email: em("ryanchang"), type: "trip_added", message: "Jake added you to desert fest 🎪", related_user_email: em("jakemor"), related_user_name: nm("jakemor"), related_trip_id: trip.id, is_read: false }),
    base44.entities.Notification.create({ user_email: em("theovas"),   type: "trip_added", message: "Talia added you to desert fest 🎪", related_user_email: em("taliaburns"), related_user_name: nm("taliaburns"), related_trip_id: trip.id, is_read: false }),
  ]);
  log("  ✓ Links + notifications created");

  log("Creating Friendships…");
  await Promise.all([
    base44.entities.Friendship.create({ user1_email: em("jakemor"),    user2_email: em("domwalker") }),
    base44.entities.Friendship.create({ user1_email: em("jakemor"),    user2_email: em("omarali") }),
    base44.entities.Friendship.create({ user1_email: em("taliaburns"), user2_email: em("lexihayes") }),
    base44.entities.Friendship.create({ user1_email: em("ryanchang"),  user2_email: em("theovas") }),
    base44.entities.Friendship.create({ user1_email: em("kelseymoon"), user2_email: em("danaokafor") }),
    base44.entities.Friendship.create({ user1_email: em("simoneduval"),user2_email: em("lexihayes") }),
  ]);
  log("  ✓ Friendships created");

  log("🎪 Desert Festival trip seeded!");
}

// ─── DESERT FEST 🌵 seeder ────────────────────────────────────────────────────
async function seedDesertFest(log, me) {
  const myEmail = me.email;
  const myName = me.full_name || me.email.split("@")[0];
  const INVITE_CODE = `${DEMO_TAG}DESERT27`;

  const existingTrips = await base44.entities.Trip.filter({}, "-created_date", 200);
  if (existingTrips.some((t) => t.invite_code === INVITE_CODE)) {
    throw new Error("DESERT FEST trip already exists. Clear it first.");
  }

  log("Creating DESERT FEST profiles…");
  await ensureProfiles(DESERT_USERS, log);

  const dMia    = DESERT_USERS.find(u => u.username_lower === "miajohnson");
  const dAshley = DESERT_USERS.find(u => u.username_lower === "ashleychen");
  const dRyan   = DESERT_USERS.find(u => u.username_lower === "ryanmiller");
  const dJake   = DESERT_USERS.find(u => u.username_lower === "jakeharris");
  const dSophie = DESERT_USERS.find(u => u.username_lower === "sophielee");

  const emD = (u) => u.user_email;
  const nmD = (u) => u.full_name;

  log("Creating DESERT FEST trip…");
  const members = [emD(dMia), emD(dAshley), emD(dRyan), emD(dJake), emD(dSophie)];
  const trip = await base44.entities.Trip.create({
    name: "DESERT FEST 🌵",
    destination: "Indio, California",
    description: "Festival weekend with friends. Lodging, transportation, expenses, itinerary, polls, and trip details all locked in.",
    start_date: "2027-04-17",
    end_date: "2027-04-20",
    admin_email: emD(dMia),
    member_emails: members,
    invite_code: INVITE_CODE,
    invite_active: true,
    cover_image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80",
    theme_color: "#E8793A",
  });
  log("  ✓ Trip created");

  log("Creating TripMembers…");
  await Promise.all([
    base44.entities.TripMember.create({ trip_id: trip.id, user_email: emD(dMia),    user_name: nmD(dMia),    role: "admin",  status: "active" }),
    base44.entities.TripMember.create({ trip_id: trip.id, user_email: emD(dAshley), user_name: nmD(dAshley), role: "member", status: "active", invited_by_email: emD(dMia) }),
    base44.entities.TripMember.create({ trip_id: trip.id, user_email: emD(dRyan),   user_name: nmD(dRyan),   role: "member", status: "active", invited_by_email: emD(dMia) }),
    base44.entities.TripMember.create({ trip_id: trip.id, user_email: emD(dJake),   user_name: nmD(dJake),   role: "member", status: "active", invited_by_email: emD(dMia) }),
    base44.entities.TripMember.create({ trip_id: trip.id, user_email: emD(dSophie), user_name: nmD(dSophie), role: "member", status: "active", invited_by_email: emD(dMia) }),
  ]);
  log("  ✓ TripMembers created");

  log("Creating Arrivals…");
  await Promise.all([
    base44.entities.Arrival.create({ trip_id: trip.id, user_email: emD(dAshley), user_name: nmD(dAshley), travel_type: "Driving", is_round_trip: true, arrival_location: "Phoenix, AZ",     destination: "Indio, CA", arrival_date: "2027-04-17", arrival_time: "13:00", departure_date: "2027-04-20", departure_time: "11:00" }),
    base44.entities.Arrival.create({ trip_id: trip.id, user_email: emD(dRyan),   user_name: nmD(dRyan),   travel_type: "Driving", is_round_trip: true, arrival_location: "Phoenix, AZ",     destination: "Indio, CA", arrival_date: "2027-04-17", arrival_time: "13:00", departure_date: "2027-04-20", departure_time: "11:00" }),
    base44.entities.Arrival.create({ trip_id: trip.id, user_email: emD(dMia),    user_name: nmD(dMia),    travel_type: "Driving", is_round_trip: true, arrival_location: "Phoenix, AZ",     destination: "Indio, CA", arrival_date: "2027-04-17", arrival_time: "13:00", departure_date: "2027-04-20", departure_time: "11:00" }),
    base44.entities.Arrival.create({ trip_id: trip.id, user_email: emD(dJake),   user_name: nmD(dJake),   travel_type: "Driving", is_round_trip: true, arrival_location: "Los Angeles, CA", destination: "Indio, CA", arrival_date: "2027-04-17", arrival_time: "13:00", departure_date: "2027-04-20", departure_time: "11:00" }),
    base44.entities.Arrival.create({ trip_id: trip.id, user_email: emD(dSophie), user_name: nmD(dSophie), travel_type: "Driving", is_round_trip: true, arrival_location: "Los Angeles, CA", destination: "Indio, CA", arrival_date: "2027-04-17", arrival_time: "13:00", departure_date: "2027-04-20", departure_time: "11:00" }),
  ]);
  log("  ✓ Arrivals created");

  log("Creating Lodging…");
  await base44.entities.Lodging.create({
    trip_id: trip.id,
    name: "Desert Oasis House",
    address: "81234 Desert Sage Drive, Indio, CA 92201",
    price_per_night: 600,
    check_in: "2027-04-17",
    check_out: "2027-04-20",
    notes: "Gate code: 4827. Quiet hours after midnight. Pool towels provided. Shuttle stop 8 minutes away. 4BR/3BA. Pool + Hot Tub + Outdoor Grill. Parking for 3 vehicles. Fast WiFi.",
    guest_emails: members,
    booking_url: "https://www.airbnb.com/",
    image_url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80",
  });
  log("  ✓ Lodging created");

  log("Creating Itinerary…");
  const itinItems = [
    // Day 1 – April 17
    { date: "2027-04-17", time: "07:00", title: "Leave Phoenix 🚗",             location: "Phoenix, AZ",             notes: "Meet at Starbucks before departure. Bring portable chargers.", is_required: true },
    { date: "2027-04-17", time: "11:30", title: "Lunch Stop 🌮",                location: "Blythe, CA",              notes: "Halfway point. Stretch, eat, fuel up.",                         is_required: false },
    { date: "2027-04-17", time: "13:00", title: "Arrive at House 🏠",           location: "81234 Desert Sage Dr, Indio", notes: "Gate code: 4827. Park in driveway.",                        is_required: true },
    { date: "2027-04-17", time: "14:00", title: "Check In 🔑",                  location: "Desert Oasis House",      notes: "Claim your rooms. Pool towels in the closet.",                  is_required: true },
    { date: "2027-04-17", time: "16:00", title: "Pool Hangout ☀️",              location: "Desert Oasis House",      notes: "Floats inflated. Drinks ready. Decompress.",                   is_required: false },
    { date: "2027-04-17", time: "18:00", title: "Festival Grounds 🎶",          location: "Empire Polo Club, Indio", notes: "Get there early to scope out the layout.",                      is_required: true },
    { date: "2027-04-17", time: "20:00", title: "Main Stage 🎵",                location: "Main Stage, Empire Polo Club", notes: "Everyone together for this. No splitting up.",             is_required: true },
    { date: "2027-04-17", time: "23:30", title: "Return to House 🏠",           location: "Desert Oasis House",      notes: "Hot tub time. No FOMO.",                                        is_required: false },
    // Day 2 – April 18
    { date: "2027-04-18", time: "10:00", title: "Brunch 🍳",                    location: "Desert Oasis House",      notes: "Ashley's making eggs. Ryan on coffee duty.",                   is_required: false },
    { date: "2027-04-18", time: "12:00", title: "Pool Time 🏊",                 location: "Desert Oasis House",      notes: "Floaties, sunscreen, good vibes.",                              is_required: false },
    { date: "2027-04-18", time: "15:00", title: "Get Ready 💅",                 location: "Desert Oasis House",      notes: "Outfits. Glow. Let's look amazing.",                           is_required: false },
    { date: "2027-04-18", time: "17:00", title: "Shuttle Pickup 🚌",            location: "Shuttle Stop, Indio",     notes: "Shuttle stop is 8 min away. Don't be late.",                   is_required: true },
    { date: "2027-04-18", time: "18:00", title: "Festival Grounds 🎶",          location: "Empire Polo Club, Indio", notes: "Full day sets. Dom has the lineup.",                            is_required: true },
    // Day 3 – April 19
    { date: "2027-04-19", time: "11:00", title: "Coffee Run ☕",                location: "Starbucks, Indio",        notes: "Iced everything. Gas station snacks.",                          is_required: false },
    { date: "2027-04-19", time: "13:00", title: "Pool Day 🌊",                  location: "Desert Oasis House",      notes: "Last full pool day. Make it count.",                            is_required: false },
    { date: "2027-04-19", time: "16:00", title: "Festival Prep 🎨",             location: "Desert Oasis House",      notes: "Glitter. Sunscreen. Charged phones.",                           is_required: false },
    { date: "2027-04-19", time: "18:00", title: "Festival Grounds 🎶",          location: "Empire Polo Club, Indio", notes: "Final night. Make it legendary.",                               is_required: true },
    // Day 4 – April 20
    { date: "2027-04-20", time: "10:00", title: "Check Out 🧹",                 location: "Desert Oasis House",      notes: "Tidy up. Security deposit is $600. Let's not lose it.",        is_required: true },
    { date: "2027-04-20", time: "11:00", title: "Drive Home 🚗",               location: "Indio, CA",               notes: "Gas costs split evenly. Safe travels everyone.",                is_required: true },
  ];
  for (const r of itinItems) {
    await base44.entities.ItineraryItem.create({ trip_id: trip.id, ...r });
    await delay(80);
  }
  log(`  ✓ ${itinItems.length} itinerary items created`);

  log("Creating Expenses…");
  const expenses = [
    { description: "Airbnb Deposit",          amount: 1800,   paid_by: emD(dAshley), paid_by_name: nmD(dAshley), split_among: members, category: "lodging",   trip_wide: true,  is_settled: false },
    { description: "Festival Parking Pass",   amount: 150,    paid_by: emD(dJake),   paid_by_name: nmD(dJake),   split_among: members, category: "transport", trip_wide: false, day_number: 1, is_settled: false },
    { description: "Grocery Run",             amount: 214.87, paid_by: emD(dSophie), paid_by_name: nmD(dSophie), split_among: members, category: "food",      trip_wide: true,  is_settled: false },
    { description: "Pool Floats & Supplies",  amount: 82.13,  paid_by: emD(dRyan),   paid_by_name: nmD(dRyan),   split_among: members, category: "other",     trip_wide: false, day_number: 1, is_settled: false },
  ];
  for (const r of expenses) {
    await base44.entities.Expense.create({ trip_id: trip.id, ...r });
    await delay(100);
  }
  log(`  ✓ ${expenses.length} expenses created`);

  log("Creating Payments…");
  await delay(500);
  const allExpenses = await base44.entities.Expense.filter({ trip_id: trip.id }, "-created_date", 20);
  const airbnbExp  = allExpenses.find(e => e.description.includes("Airbnb Deposit"));
  const parkingExp = allExpenses.find(e => e.description.includes("Parking Pass"));
  const groceryExp = allExpenses.find(e => e.description.includes("Grocery Run"));
  const poolExp    = allExpenses.find(e => e.description.includes("Pool Floats"));

  const paymentRecords = [];
  if (airbnbExp) {
    const share = 360;
    paymentRecords.push(
      { expense_id: airbnbExp.id, sender_email: emD(dRyan),   sender_name: nmD(dRyan),   receiver_email: emD(dAshley), receiver_name: nmD(dAshley), amount: share, payment_method: "venmo",   status: "unpaid" },
      { expense_id: airbnbExp.id, sender_email: emD(dJake),   sender_name: nmD(dJake),   receiver_email: emD(dAshley), receiver_name: nmD(dAshley), amount: share, payment_method: "venmo",   status: "unpaid" },
      { expense_id: airbnbExp.id, sender_email: emD(dSophie), sender_name: nmD(dSophie), receiver_email: emD(dAshley), receiver_name: nmD(dAshley), amount: share, payment_method: "cashapp", status: "unpaid" },
      { expense_id: airbnbExp.id, sender_email: emD(dMia),    sender_name: nmD(dMia),    receiver_email: emD(dAshley), receiver_name: nmD(dAshley), amount: share, payment_method: "venmo",   status: "unpaid" },
    );
  }
  if (parkingExp) {
    const share = Math.round(150 / 5);
    paymentRecords.push(
      { expense_id: parkingExp.id, sender_email: emD(dAshley), sender_name: nmD(dAshley), receiver_email: emD(dJake), receiver_name: nmD(dJake), amount: share, payment_method: "venmo",   status: "pending" },
      { expense_id: parkingExp.id, sender_email: emD(dMia),    sender_name: nmD(dMia),    receiver_email: emD(dJake), receiver_name: nmD(dJake), amount: share, payment_method: "venmo",   status: "unpaid" },
      { expense_id: parkingExp.id, sender_email: emD(dRyan),   sender_name: nmD(dRyan),   receiver_email: emD(dJake), receiver_name: nmD(dJake), amount: share, payment_method: "cashapp", status: "unpaid" },
      { expense_id: parkingExp.id, sender_email: emD(dSophie), sender_name: nmD(dSophie), receiver_email: emD(dJake), receiver_name: nmD(dJake), amount: share, payment_method: "venmo",   status: "confirmed" },
    );
  }
  if (groceryExp) {
    const share = Math.round(214.87 / 5);
    paymentRecords.push(
      { expense_id: groceryExp.id, sender_email: emD(dAshley), sender_name: nmD(dAshley), receiver_email: emD(dSophie), receiver_name: nmD(dSophie), amount: share, payment_method: "venmo", status: "unpaid" },
      { expense_id: groceryExp.id, sender_email: emD(dMia),    sender_name: nmD(dMia),    receiver_email: emD(dSophie), receiver_name: nmD(dSophie), amount: share, payment_method: "venmo", status: "unpaid" },
      { expense_id: groceryExp.id, sender_email: emD(dRyan),   sender_name: nmD(dRyan),   receiver_email: emD(dSophie), receiver_name: nmD(dSophie), amount: share, payment_method: "venmo", status: "confirmed" },
      { expense_id: groceryExp.id, sender_email: emD(dJake),   sender_name: nmD(dJake),   receiver_email: emD(dSophie), receiver_name: nmD(dSophie), amount: share, payment_method: "cashapp", status: "unpaid" },
    );
  }
  if (poolExp) {
    const share = Math.round(82.13 / 5);
    paymentRecords.push(
      { expense_id: poolExp.id, sender_email: emD(dAshley), sender_name: nmD(dAshley), receiver_email: emD(dRyan), receiver_name: nmD(dRyan), amount: share, payment_method: "venmo", status: "unpaid" },
      { expense_id: poolExp.id, sender_email: emD(dMia),    sender_name: nmD(dMia),    receiver_email: emD(dRyan), receiver_name: nmD(dRyan), amount: share, payment_method: "venmo", status: "unpaid" },
      { expense_id: poolExp.id, sender_email: emD(dJake),   sender_name: nmD(dJake),   receiver_email: emD(dRyan), receiver_name: nmD(dRyan), amount: share, payment_method: "cashapp", status: "unpaid" },
    );
  }
  let payCount = 0;
  for (const r of paymentRecords) {
    await base44.entities.Payment.create({ trip_id: trip.id, ...r });
    payCount++;
    await delay(150);
  }
  log(`  ✓ ${payCount} payments created`);

  log("Creating Polls + votes…");
  const pd1 = await base44.entities.TripPoll.create({ trip_id: trip.id, question: "Dinner Friday?", options: ["Tacos 🌮", "Pizza 🍕", "In-N-Out 🍔"], created_by_email: emD(dMia), created_by_name: nmD(dMia), is_closed: false });
  const pd2 = await base44.entities.TripPoll.create({ trip_id: trip.id, question: "Pool Time?", options: ["11 AM", "1 PM", "3 PM"], created_by_email: emD(dAshley), created_by_name: nmD(dAshley), is_closed: false });
  const pd3 = await base44.entities.TripPoll.create({ trip_id: trip.id, question: "Who Is Bringing A Speaker?", options: ["Ashley", "Ryan", "Jake", "Sophie"], created_by_email: emD(dRyan), created_by_name: nmD(dRyan), is_closed: false });
  await Promise.all([
    base44.entities.TripPollVote.create({ poll_id: pd1.id, trip_id: trip.id, voter_email: emD(dAshley), voter_name: nmD(dAshley), option_index: 0 }),
    base44.entities.TripPollVote.create({ poll_id: pd1.id, trip_id: trip.id, voter_email: emD(dRyan),   voter_name: nmD(dRyan),   option_index: 2 }),
    base44.entities.TripPollVote.create({ poll_id: pd1.id, trip_id: trip.id, voter_email: emD(dJake),   voter_name: nmD(dJake),   option_index: 2 }),
    base44.entities.TripPollVote.create({ poll_id: pd2.id, trip_id: trip.id, voter_email: emD(dMia),    voter_name: nmD(dMia),    option_index: 1 }),
    base44.entities.TripPollVote.create({ poll_id: pd2.id, trip_id: trip.id, voter_email: emD(dSophie), voter_name: nmD(dSophie), option_index: 1 }),
    base44.entities.TripPollVote.create({ poll_id: pd2.id, trip_id: trip.id, voter_email: emD(dRyan),   voter_name: nmD(dRyan),   option_index: 0 }),
    base44.entities.TripPollVote.create({ poll_id: pd3.id, trip_id: trip.id, voter_email: emD(dAshley), voter_name: nmD(dAshley), option_index: 0 }),
    base44.entities.TripPollVote.create({ poll_id: pd3.id, trip_id: trip.id, voter_email: emD(dJake),   voter_name: nmD(dJake),   option_index: 2 }),
    base44.entities.TripPollVote.create({ poll_id: pd3.id, trip_id: trip.id, voter_email: emD(dSophie), voter_name: nmD(dSophie), option_index: 0 }),
  ]);
  log("  ✓ Polls + votes created");

  log("Creating Messages…");
  const msgs = [
    { sender_email: emD(dMia),    sender_name: nmD(dMia),    content: "DESERT FEST crew 🌵 everything is booked. airbnb confirmed. let's gooo" },
    { sender_email: emD(dAshley), sender_name: nmD(dAshley), content: "highlander is gassed up and ready. leaving phoenix at 7am sharp. be at starbucks by 6:45" },
    { sender_email: emD(dRyan),   sender_name: nmD(dRyan),   content: "i'll bring snacks for the drive. and i will NOT get the family size pringles this time" },
    { sender_email: emD(dJake),   sender_name: nmD(dJake),   content: "sophie and i are taking the CRV from LA. we'll meet you at the house around 1" },
    { sender_email: emD(dSophie), sender_name: nmD(dSophie), content: "i already made a grocery list. sending it in the notes. don't buy duplicates" },
    { sender_email: emD(dMia),    sender_name: nmD(dMia),    content: "gate code is 4827. pool towels are in the hall closet. quiet hours after midnight just fyi" },
    { sender_email: emD(dAshley), sender_name: nmD(dAshley), content: "ashley added the airbnb details to the lodging section 🏠" },
    { sender_email: emD(dRyan),   sender_name: nmD(dRyan),   content: "i just checked the itinerary. looks perfect mia. day 1 pool hangout is non-negotiable" },
    { sender_email: emD(dJake),   sender_name: nmD(dJake),   content: "updated our travel plan in the app. jake's CRV departing LA at 7am too. we'll convoy" },
    { sender_email: emD(dSophie), sender_name: nmD(dSophie), content: "added the grocery run expense. $214.87 split 5 ways = $42.97 each. venmo me @sophie-l" },
    { sender_email: emD(dMia),    sender_name: nmD(dMia),    content: "just updated the lodging info with all the house notes. everyone read it before we get there" },
    { sender_email: emD(dAshley), sender_name: nmD(dAshley), content: "who still hasn't paid for the airbnb deposit. you know who you are 👀" },
    { sender_email: emD(dRyan),   sender_name: nmD(dRyan),   content: "pool floats and supplies are handled. $82 ryan's got it. just venmo me back no rush" },
    { sender_email: emD(dJake),   sender_name: nmD(dJake),   content: "parking pass is sorted. $150. i'll figure out reimbursement at the house" },
    { sender_email: emD(dSophie), sender_name: nmD(dSophie), content: "bring portable chargers PLEASE. the polo fields drain your battery so fast" },
  ];
  for (const m of msgs) { await base44.entities.TripMessage.create({ trip_id: trip.id, ...m, message_type: "text" }); await delay(60); }
  log(`  ✓ ${msgs.length} messages created`);

  log("Creating Links + Notifications…");
  await Promise.all([
    base44.entities.TripLink.create({ trip_id: trip.id, url: "https://www.coachella.com/",           title: "Festival Website",           note: "Official lineup and set times",                                         category: "activity",  shared_by_email: emD(dMia),    shared_by_name: nmD(dMia) }),
    base44.entities.TripLink.create({ trip_id: trip.id, url: "https://www.airbnb.com/",              title: "House Listing",              note: "Desert Oasis House – 4BR/3BA pool + hot tub",                          category: "hotel",     shared_by_email: emD(dAshley), shared_by_name: nmD(dAshley) }),
    base44.entities.TripLink.create({ trip_id: trip.id, url: "https://maps.google.com/?q=Indio+CA",  title: "Google Maps – House Address", note: "81234 Desert Sage Dr, Indio CA 92201",                                 category: "other",     shared_by_email: emD(dMia),    shared_by_name: nmD(dMia) }),
    base44.entities.TripLink.create({ trip_id: trip.id, url: "https://www.coachella.com/parking",    title: "Parking Information",        note: "Jake already got the pass. just for reference",                        category: "other",     shared_by_email: emD(dJake),   shared_by_name: nmD(dJake) }),
    base44.entities.TripLink.create({ trip_id: trip.id, url: "https://www.coachella.com/map",        title: "Festival Map",               note: "stage locations, shuttle stops, exits. save it offline",               category: "activity",  shared_by_email: emD(dRyan),   shared_by_name: nmD(dRyan) }),
    base44.entities.Notification.create({ user_email: emD(dAshley), type: "trip_added",  message: "Mia added you to DESERT FEST 🌵",       related_user_email: emD(dMia),    related_user_name: nmD(dMia),    related_trip_id: trip.id, is_read: true }),
    base44.entities.Notification.create({ user_email: emD(dRyan),   type: "trip_added",  message: "Mia added you to DESERT FEST 🌵",       related_user_email: emD(dMia),    related_user_name: nmD(dMia),    related_trip_id: trip.id, is_read: true }),
    base44.entities.Notification.create({ user_email: emD(dJake),   type: "trip_added",  message: "Mia added you to DESERT FEST 🌵",       related_user_email: emD(dMia),    related_user_name: nmD(dMia),    related_trip_id: trip.id, is_read: false }),
    base44.entities.Notification.create({ user_email: emD(dSophie), type: "trip_added",  message: "Mia added you to DESERT FEST 🌵",       related_user_email: emD(dMia),    related_user_name: nmD(dMia),    related_trip_id: trip.id, is_read: false }),
    base44.entities.Notification.create({ user_email: emD(dMia),    type: "trip_added",  message: "Ashley added the Airbnb details 🏠",     related_user_email: emD(dAshley), related_user_name: nmD(dAshley), related_trip_id: trip.id, is_read: false }),
  ]);
  log("  ✓ Links + notifications created");

  log("Creating Friendships…");
  await Promise.all([
    base44.entities.Friendship.create({ user1_email: emD(dMia),    user2_email: emD(dAshley) }),
    base44.entities.Friendship.create({ user1_email: emD(dMia),    user2_email: emD(dRyan) }),
    base44.entities.Friendship.create({ user1_email: emD(dMia),    user2_email: emD(dJake) }),
    base44.entities.Friendship.create({ user1_email: emD(dMia),    user2_email: emD(dSophie) }),
    base44.entities.Friendship.create({ user1_email: emD(dAshley), user2_email: emD(dRyan) }),
    base44.entities.Friendship.create({ user1_email: emD(dJake),   user2_email: emD(dSophie) }),
  ]);
  log("  ✓ Friendships created");

  log("🌵 DESERT FEST trip seeded!");
}

// ─── Per-trip clear helpers ───────────────────────────────────────────────────
async function clearDesertFest(log, me) {
  log("Clearing DESERT FEST trip…");
  await clearTripByCode(`${DEMO_TAG}DESERT27`, DESERT_USERS.map(u => u.user_id), log);
  log("✓ DESERT FEST cleared.");
}

async function clearJapan(log, me) {
  log("Clearing Japan trip…");
  await clearTripByCode(`${DEMO_TAG}JAPAN26`, JAPAN_USERS.map(u => u.user_id), log);
  log("✓ Japan cleared.");
}
async function clearMiami(log, me) {
  log("Clearing Miami trip…");
  await clearTripByCode(`${DEMO_TAG}MIAMI26`, MIAMI_USERS.map(u => u.user_id), log);
  log("✓ Miami cleared.");
}
async function clearFest(log, me) {
  log("Clearing Desert Festival trip…");
  await clearTripByCode(`${DEMO_TAG}FEST26`, FEST_USERS.map(u => u.user_id), log);
  log("✓ Desert Fest cleared.");
}

// ─── UI ───────────────────────────────────────────────────────────────────────
const TRIPS = [
  { key: "japan",      label: "🍜 Japan",          seed: seedJapan,      clear: clearJapan,      color: "#E8426A" },
  { key: "miami",      label: "🌴 Miami",           seed: seedMiami,      clear: clearMiami,      color: "#FF7A45" },
  { key: "desertfest", label: "🌵 DESERT FEST",     seed: seedDesertFest, clear: clearDesertFest, color: "#E8793A" },
  { key: "fest",       label: "🎪 Desert Festival", seed: seedFest,       clear: clearFest,       color: "#7C3AED" },
];

export default function DemoSeed() {
  const [logs, setLogs] = useState({});       // key -> string[]
  const [busy, setBusy] = useState({});       // key -> "seeding"|"clearing"|null
  const [currentUser, setCurrentUser] = useState(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    base44.auth.me().then((me) => { setCurrentUser(me); setChecked(true); }).catch(() => setChecked(true));
  }, []);

  if (!checked) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin h-6 w-6 text-muted-foreground" /></div>;
  if (!currentUser || currentUser.role !== "admin") return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-3 px-6 text-center">
      <ShieldAlert className="h-10 w-10 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Admin access required.</p>
    </div>
  );

  function appendLog(key, msg) {
    setLogs((prev) => ({ ...prev, [key]: [...(prev[key] || []), msg] }));
  }

  async function handleSeed(trip) {
    setLogs((prev) => ({ ...prev, [trip.key]: [] }));
    setBusy((prev) => ({ ...prev, [trip.key]: "seeding" }));
    try {
      await trip.seed((msg) => appendLog(trip.key, msg), currentUser);
    } catch (e) {
      appendLog(trip.key, `❌ ${e.message}`);
    }
    setBusy((prev) => ({ ...prev, [trip.key]: null }));
  }

  async function handleClear(trip) {
    setLogs((prev) => ({ ...prev, [trip.key]: [] }));
    setBusy((prev) => ({ ...prev, [trip.key]: "clearing" }));
    try {
      await trip.clear((msg) => appendLog(trip.key, msg), currentUser);
    } catch (e) {
      appendLog(trip.key, `❌ ${e.message}`);
    }
    setBusy((prev) => ({ ...prev, [trip.key]: null }));
  }

  const anyBusy = Object.values(busy).some(Boolean);

  return (
    <div className="min-h-screen bg-background px-5 py-12 max-w-lg mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Sprout className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">Demo Data Seeder</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Seed each trip independently. Each button is safe to re-run after a failure — just clear first to avoid duplicates.
        </p>
      </div>

      <div className="space-y-6">
        {TRIPS.map((trip) => {
          const tripBusy = busy[trip.key];
          const tripLogs = logs[trip.key] || [];
          const isSeeding  = tripBusy === "seeding";
          const isClearing = tripBusy === "clearing";
          const done = !tripBusy && tripLogs.length > 0 && !tripLogs.some(l => l.startsWith("❌"));
          const errored = tripLogs.some(l => l.startsWith("❌"));

          return (
            <div key={trip.key} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-sm">{trip.label}</span>
                {done    && <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle2 className="h-3.5 w-3.5" /> Done</span>}
                {errored && <span className="text-xs text-destructive">Error</span>}
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1 rounded-full text-xs h-8"
                  style={{ background: trip.color, color: "white" }}
                  onClick={() => handleSeed(trip)}
                  disabled={anyBusy}
                >
                  {isSeeding ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Sprout className="h-3 w-3 mr-1" />}
                  Seed
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 rounded-full text-xs h-8"
                  onClick={() => handleClear(trip)}
                  disabled={anyBusy}
                >
                  {isClearing ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Trash2 className="h-3 w-3 mr-1" />}
                  Clear
                </Button>
              </div>

              {tripLogs.length > 0 && (
                <div className="mt-3 bg-muted/40 rounded-xl p-3 space-y-1 text-[11px] font-mono max-h-48 overflow-y-auto">
                  {tripLogs.map((line, i) => (
                    <div key={i} className={line.startsWith("❌") ? "text-destructive" : line.includes("🎌") || line.includes("🌴") || line.includes("🎪") ? "text-green-600 font-semibold" : "text-foreground/75"}>
                      {line}
                    </div>
                  ))}
                  {tripBusy && <div className="flex items-center gap-1.5 text-muted-foreground"><Loader2 className="h-2.5 w-2.5 animate-spin" /> running…</div>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}