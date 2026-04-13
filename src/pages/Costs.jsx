import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { DollarSign } from "lucide-react";
import { format } from "date-fns";
import PullToRefresh from "../components/PullToRefresh";

export default function Costs() {
  const [user, setUser] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [trips, setTrips] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const me = await base44.auth.me();
    setUser(me);
    const [allTrips, allExpenses, allPayments, allProfiles] = await Promise.all([
      base44.entities.Trip.list("-created_date", 100),
      base44.entities.Expense.list("-created_date", 500),
      base44.entities.Payment.list("-created_date", 500),
      base44.entities.UserProfile.list("-created_date", 200),
    ]);

    // Active member trips
    const activeMemberTripIds = new Set(
      allTrips.filter(t => t.member_emails?.includes(me.email) || t.admin_email === me.email).map(t => t.id)
    );
    // Past trips where user still has financial history (e.g. after leaving)
    const involvedTripIds = new Set(
      allExpenses
        .filter(e => e.paid_by === me.email || e.split_among?.includes(me.email))
        .map(e => e.trip_id)
    );
    const relevantTripIds = new Set([...activeMemberTripIds, ...involvedTripIds]);
    const relevantTrips = allTrips.filter(t => relevantTripIds.has(t.id));

    setTrips(relevantTrips);
    setExpenses(allExpenses.filter(e => relevantTripIds.has(e.trip_id)));
    setPayments(allPayments.filter(p => relevantTripIds.has(p.trip_id)));

    const profileMap = {};
    allProfiles.forEach(p => { profileMap[p.user_email] = p; });
    setProfiles(profileMap);
    setLoading(false);
  }

  function resolveName(email) {
    const p = profiles[email];
    if (p?.display_name) return p.display_name;
    if (p?.username) return p.username;
    if (p?.full_name) return p.full_name;
    return email?.split("@")[0] || email;
  }

  function getPayment(expenseId, senderEmail) {
    return payments.find(p => p.expense_id === expenseId && p.sender_email === senderEmail);
  }

  function getShareAmount(expense, email) {
    if (expense.custom_split_amounts?.[email] !== undefined) {
      return parseFloat(expense.custom_split_amounts[email]);
    }
    return expense.amount / (expense.split_among?.length || 1);
  }

  function getSettleLinks(email) {
    const pp = profiles[email];
    if (!pp) return [];
    return [
      pp.venmo    && { label: "Venmo",    href: `https://venmo.com/${pp.venmo.replace(/^@/, "")}` },
      pp.cashapp  && { label: "Cash App", href: `https://cash.app/$${pp.cashapp.replace(/^\$/, "")}` },
      pp.paypal   && { label: "PayPal",   href: `https://paypal.me/${pp.paypal.replace(/^[@\/]/, "")}` },
      pp.zelle    && { label: "Zelle",    href: null, info: pp.zelle },
    ].filter(Boolean);
  }

  function computeTripSummary(tripId) {
    const tripExpenses = expenses.filter(e => e.trip_id === tripId);

    const iOwe = tripExpenses
      .filter(e => e.split_among?.includes(user.email) && e.paid_by !== user.email)
      .reduce((s, e) => {
        const pay = getPayment(e.id, user.email);
        if (pay?.status === "confirmed" || pay?.status === "pending") return s;
        return s + getShareAmount(e, user.email);
      }, 0);

    const iAmOwed = tripExpenses
      .filter(e => e.paid_by === user.email)
      .reduce((s, e) => {
        const owersExcludingMe = (e.split_among || []).filter(em => em !== user.email);
        return s + owersExcludingMe.reduce((ss, email) => {
          const pay = getPayment(e.id, email);
          if (pay?.status === "confirmed") return ss;
          return ss + getShareAmount(e, email);
        }, 0);
      }, 0);

    // Settle up per trip
    const netBalances = {};
    tripExpenses.forEach(exp => {
      const owersExPayer = (exp.split_among || []).filter(e => e !== exp.paid_by);
      owersExPayer.forEach(owerEmail => {
        const pay = getPayment(exp.id, owerEmail);
        if (pay?.status === "confirmed") return;
        const share = getShareAmount(exp, owerEmail);
        const key = `${owerEmail}|${exp.paid_by}`;
        const reverseKey = `${exp.paid_by}|${owerEmail}`;
        if (netBalances[reverseKey]) {
          netBalances[reverseKey].amount -= share;
          if (netBalances[reverseKey].amount <= 0) {
            netBalances[key] = { from: owerEmail, to: exp.paid_by, amount: Math.abs(netBalances[reverseKey].amount) };
            delete netBalances[reverseKey];
          }
        } else {
          if (!netBalances[key]) netBalances[key] = { from: owerEmail, to: exp.paid_by, amount: 0 };
          netBalances[key].amount += share;
        }
      });
    });
    const balanceRows = Object.values(netBalances)
      .filter(b => b.amount > 0.01 && (b.from === user.email || b.to === user.email));

    return { iOwe, iAmOwed, balanceRows, expenseCount: tripExpenses.length };
  }

  if (loading || !user) {
    return (
      <div className="flex justify-center py-32">
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#C8A27C", borderTopColor: "transparent" }} />
      </div>
    );
  }

  const today = new Date().toISOString().split("T")[0];
  const sortedTrips = [...trips].sort((a, b) => {
    const aActive = !a.end_date || a.end_date >= today;
    const bActive = !b.end_date || b.end_date >= today;
    if (aActive && !bActive) return -1;
    if (!aActive && bActive) return 1;
    return (b.start_date || "").localeCompare(a.start_date || "");
  });

  // Pre-compute summaries
  const summaries = {};
  sortedTrips.forEach(t => { summaries[t.id] = computeTripSummary(t.id); });

  const tripsWithData = sortedTrips.filter(t => summaries[t.id].expenseCount > 0);
  const totalOwe = tripsWithData.reduce((s, t) => s + summaries[t.id].iOwe, 0);
  const totalOwed = tripsWithData.reduce((s, t) => s + summaries[t.id].iAmOwed, 0);

  return (
    <PullToRefresh onRefresh={loadData}>
      <div className="px-5 pt-14 pb-24">
        <div className="mb-7">
          <p className="text-xs font-medium tracking-widest uppercase" style={{ color: "#C8A27C", letterSpacing: "0.12em" }}>Overview</p>
          <h1 className="text-[28px] font-semibold tracking-tight leading-tight mt-0.5 text-[#1A1A1A] dark:text-[#F0EAE0]" style={{ letterSpacing: "-0.025em" }}>Costs</h1>
        </div>

        {tripsWithData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-[22px] flex items-center justify-center mb-4" style={{ background: "rgba(200,162,124,0.12)" }}>
              <DollarSign className="h-6 w-6" style={{ color: "#C8A27C" }} />
            </div>
            <h3 className="font-semibold text-base mb-1" style={{ color: "#1A1A1A" }}>No expenses yet</h3>
            <p className="text-sm" style={{ color: "#9A8A7A" }}>Expenses from your trips will appear here</p>
          </div>
        ) : (
          <>
            {/* Overall summary */}
            <div className="grid grid-cols-2 gap-2 mb-6">
              <div className="rounded-2xl p-3 text-center" style={{ background: "rgba(255,255,255,0.85)", border: "1px solid rgba(200,162,124,0.15)" }}>
                <p className="text-[10px] mb-1" style={{ color: "#B0A090" }}>you owe</p>
                <p className="text-sm font-semibold" style={{ color: totalOwe > 0 ? "#B04040" : "#2A2018" }}>${totalOwe.toFixed(2)}</p>
              </div>
              <div className="rounded-2xl p-3 text-center" style={{ background: "rgba(255,255,255,0.85)", border: "1px solid rgba(200,162,124,0.15)" }}>
                <p className="text-[10px] mb-1" style={{ color: "#B0A090" }}>you're owed</p>
                <p className="text-sm font-semibold" style={{ color: totalOwed > 0 ? "#3A7A5A" : "#2A2018" }}>${totalOwed.toFixed(2)}</p>
              </div>
            </div>

            {/* Per-trip sections */}
            <div className="space-y-4">
              {tripsWithData.map(trip => {
                const { iOwe, iAmOwed, balanceRows } = summaries[trip.id];
                const isPast = trip.end_date && trip.end_date < today;
                const isSettled = iOwe < 0.01 && iAmOwed < 0.01;

                return (
                  <div key={trip.id} className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.85)", border: "1px solid rgba(200,162,124,0.15)", opacity: isSettled && isPast ? 0.65 : 1 }}>
                    {/* Trip header row — tappable to navigate */}
                    <Link to={`/trip/${trip.id}`} className="flex items-center justify-between px-4 py-3 active:bg-black/5 transition-colors">
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-sm font-semibold truncate" style={{ color: "#2A2018" }}>{trip.name}</p>
                          {isPast && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full shrink-0" style={{ background: "rgba(176,160,144,0.18)", color: "#9A8A7A" }}>Past</span>
                          )}
                        </div>
                        <p className="text-[10px] mt-0.5" style={{ color: "#B0A090" }}>
                          {trip.destination}
                          {trip.start_date ? ` · ${format(new Date(trip.start_date + "T00:00:00"), "MMM d")}` : ""}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        {iOwe > 0.01 && <p className="text-xs font-semibold" style={{ color: "#B04040" }}>−${iOwe.toFixed(2)}</p>}
                        {iAmOwed > 0.01 && <p className="text-xs font-semibold" style={{ color: "#3A7A5A" }}>+${iAmOwed.toFixed(2)}</p>}
                        {isSettled && <p className="text-[10px]" style={{ color: "#9A8A7A" }}>All settled ✓</p>}
                      </div>
                    </Link>

                    {/* Settle up rows for this trip */}
                    {balanceRows.length > 0 && (
                      <div className="px-4 pb-3 space-y-2" style={{ borderTop: "1px solid rgba(200,162,124,0.1)" }}>
                        <p className="text-[10px] font-semibold uppercase tracking-wider pt-2.5" style={{ color: "#C8A27C" }}>Settle Up</p>
                        {balanceRows.map((b, i) => {
                          const settleLinks = getSettleLinks(b.to);
                          const isMe = b.from === user.email;
                          return (
                            <div key={i} className="rounded-xl p-2.5" style={{ background: "rgba(200,162,124,0.06)" }}>
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-xs" style={{ color: "#3A3028" }}>
                                  <span className="font-semibold">{isMe ? "You" : resolveName(b.from)}</span>
                                  <span style={{ color: "#B0A090" }}> → </span>
                                  <span className="font-semibold">{b.to === user.email ? "You" : resolveName(b.to)}</span>
                                </p>
                                <span className="text-xs font-semibold" style={{ color: isMe ? "#B04040" : "#3A7A5A" }}>${b.amount.toFixed(2)}</span>
                              </div>
                              {settleLinks.length > 0 && isMe && (
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[10px]" style={{ color: "#B0A090" }}>settle via</span>
                                  {settleLinks.map(l => l.href ? (
                                    <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer"
                                      className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                                      style={{ background: "rgba(200,162,124,0.15)", color: "#7A5A3A" }}>
                                      {l.label} ↗
                                    </a>
                                  ) : (
                                    <span key={l.label} className="px-2 py-0.5 rounded-full text-[10px]" style={{ background: "rgba(200,162,124,0.08)", color: "#9A8A7A" }}>
                                      Zelle: {l.info}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </PullToRefresh>
  );
}