import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { DollarSign, ArrowRight, Receipt } from "lucide-react";
import { format } from "date-fns";
import PullToRefresh from "../components/PullToRefresh";

export default function Costs() {
  const [user, setUser] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [trips, setTrips] = useState([]);
  const [profiles, setProfiles] = useState({}); // email -> UserProfile
  const [loading, setLoading] = useState(true);
  const [detailModal, setDetailModal] = useState(null); // 'all' | 'owe' | 'received'

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const me = await base44.auth.me();
    setUser(me);
    const [allTrips, allExpenses, allPayments, allProfiles] = await Promise.all([
      base44.entities.Trip.list("-created_date", 50),
      base44.entities.Expense.list("-created_date", 300),
      base44.entities.Payment.list("-created_date", 300),
      base44.entities.UserProfile.list("-created_date", 200),
    ]);
    const myTrips = allTrips.filter(
      (t) => t.member_emails?.includes(me.email) || t.admin_email === me.email
    );
    setTrips(myTrips);
    const tripIds = new Set(myTrips.map((t) => t.id));
    setExpenses(allExpenses.filter((e) => tripIds.has(e.trip_id)));
    setPayments(allPayments.filter((p) => tripIds.has(p.trip_id)));
    const profileMap = {};
    allProfiles.forEach((p) => { profileMap[p.user_email] = p; });
    setProfiles(profileMap);
    setLoading(false);
  }

  function resolveName(email) {
    const p = profiles[email];
    if (p?.full_name) return p.full_name;
    if (p?.username) return `@${p.username}`;
    return email?.split("@")[0] || email;
  }

  function getPayment(expenseId, senderEmail) {
    return payments.find((p) => p.expense_id === expenseId && p.sender_email === senderEmail);
  }

  function getShareAmount(expense, email) {
    if (expense.custom_split_amounts && expense.custom_split_amounts[email] !== undefined) {
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

  // Totals
  const totalSpent = expenses.reduce((s, e) => s + (e.amount || 0), 0);

  const iOwe = expenses
    .filter((e) => e.split_among?.includes(user?.email) && e.paid_by !== user?.email)
    .reduce((s, e) => {
      const pay = getPayment(e.id, user.email);
      if (!pay || pay.status === "rejected" || pay.status === "unpaid") return s + getShareAmount(e, user.email);
      return s;
    }, 0);

  const iAmOwed = expenses
    .filter((e) => e.paid_by === user?.email)
    .reduce((s, e) => {
      const owersExcludingMe = (e.split_among || []).filter(em => em !== user.email);
      return s + owersExcludingMe.reduce((ss, email) => {
        const pay = getPayment(e.id, email);
        if (!pay || pay.status === "rejected" || pay.status === "unpaid") return ss + getShareAmount(e, email);
        return ss;
      }, 0);
    }, 0);

  // Net global balances
  const netBalances = {};
  expenses.forEach((exp) => {
    const trip = trips.find(t => t.id === exp.trip_id);
    const owersExPayer = (exp.split_among || []).filter(e => e !== exp.paid_by);
    owersExPayer.forEach((owerEmail) => {
      const pay = getPayment(exp.id, owerEmail);
      if (pay?.status === "confirmed") return;
      const share = getShareAmount(exp, owerEmail);
      const key = `${owerEmail}|${exp.paid_by}`;
      const reverseKey = `${exp.paid_by}|${owerEmail}`;
      if (netBalances[reverseKey]) {
        netBalances[reverseKey].amount -= share;
        if (netBalances[reverseKey].amount <= 0) {
          netBalances[key] = {
            from: owerEmail, to: exp.paid_by,
            amount: Math.abs(netBalances[reverseKey].amount),
            tripName: trip?.name,
          };
          delete netBalances[reverseKey];
        }
      } else {
        if (!netBalances[key]) netBalances[key] = { from: owerEmail, to: exp.paid_by, amount: 0, tripName: trip?.name };
        netBalances[key].amount += share;
      }
    });
  });
  const balanceRows = Object.values(netBalances).filter(b => b.amount > 0.01);

  const oweExpenses = expenses.filter(e => e.split_among?.includes(user?.email) && e.paid_by !== user?.email);
  const receivedExpenses = expenses.filter(e => e.paid_by === user?.email && (e.split_among || []).some(em => em !== user?.email));

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#C8A27C", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={loadData}>
    <div className="px-5 pt-14 pb-24">
      <div className="mb-7">
        <p className="text-xs font-medium tracking-widest uppercase" style={{ color: "#C8A27C", letterSpacing: "0.12em" }}>Overview</p>
        <h1 className="text-[28px] font-semibold tracking-tight leading-tight mt-0.5" style={{ color: "#1A1A1A", letterSpacing: "-0.025em" }}>Costs</h1>
      </div>

      {expenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-14 h-14 rounded-[22px] flex items-center justify-center mb-4" style={{ background: "rgba(200,162,124,0.12)" }}>
            <DollarSign className="h-6 w-6" style={{ color: "#C8A27C" }} />
          </div>
          <h3 className="font-semibold text-base mb-1" style={{ color: "#1A1A1A" }}>No expenses yet</h3>
          <p className="text-sm" style={{ color: "#9A8A7A" }}>Expenses from your trips will appear here</p>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            {[
              { key: "all",      label: "total spent",  value: `$${totalSpent.toFixed(2)}`, color: "#2A2018" },
              { key: "owe",      label: "you owe",      value: `$${iOwe.toFixed(2)}`,       color: iOwe > 0 ? "#B04040" : "#2A2018" },
              { key: "received", label: "you're owed",  value: `$${iAmOwed.toFixed(2)}`,    color: iAmOwed > 0 ? "#3A7A5A" : "#2A2018" },
            ].map(({ key, label, value, color }) => (
              <div
                key={key}
                className="rounded-2xl p-3 text-center cursor-pointer active:scale-95 transition-transform"
                style={{ background: "rgba(255,255,255,0.85)", border: "1px solid rgba(200,162,124,0.15)" }}
                onClick={() => setDetailModal(key)}
              >
                <p className="text-[10px] mb-1" style={{ color: "#B0A090" }}>{label}</p>
                <p className="text-sm font-semibold" style={{ color }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Who Owes Who */}
          {balanceRows.length > 0 && (
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#C8A27C" }}>Who Owes Who</p>
              <div className="space-y-2">
                {balanceRows.map((b, i) => {
                  const settleLinks = getSettleLinks(b.to);
                  const isMe = b.from === user.email;
                  return (
                    <div key={i} className="rounded-2xl p-3" style={{ background: "rgba(255,255,255,0.85)", border: "1px solid rgba(200,162,124,0.15)" }}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs" style={{ color: "#3A3028" }}>
                          <span className="font-semibold">{isMe ? "You" : resolveName(b.from)}</span>
                          <span style={{ color: "#B0A090" }}> → </span>
                          <span className="font-semibold">{b.to === user.email ? "You" : resolveName(b.to)}</span>
                        </p>
                        <span className="text-sm font-semibold" style={{ color: isMe ? "#B04040" : "#3A7A5A" }}>${b.amount.toFixed(2)}</span>
                      </div>
                      {b.tripName && (
                        <p className="text-[10px] mb-1.5" style={{ color: "#B0A090" }}>via {b.tripName}</p>
                      )}
                      {settleLinks.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px]" style={{ color: "#B0A090" }}>settle via</span>
                          {settleLinks.map(l => l.href ? (
                            <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer"
                              className="px-2 py-0.5 rounded-full text-[10px] font-semibold active:opacity-70"
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
            </div>
          )}

          {/* Recent expenses */}
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#C8A27C" }}>Recent Expenses</p>
          <div className="space-y-2">
            {expenses.slice(0, 30).map((exp) => {
              const trip = trips.find((t) => t.id === exp.trip_id);
              const settled = exp.is_settled;
              return (
                <div key={exp.id} className="rounded-2xl p-3" style={{ background: settled ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.85)", border: "1px solid rgba(200,162,124,0.12)", opacity: settled ? 0.7 : 1 }}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0 pr-3">
                      <p className={`text-sm font-medium truncate ${settled ? "line-through" : ""}`} style={{ color: settled ? "#B0A090" : "#2A2018" }}>{exp.description}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: "#B0A090" }}>
                        {trip?.name} · {resolveName(exp.paid_by)} paid
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-semibold ${settled ? "line-through" : ""}`} style={{ color: settled ? "#B0A090" : "#2A2018" }}>${exp.amount?.toFixed(2)}</p>
                      {settled && <span className="text-[9px]" style={{ color: "#5A9E7A" }}>Settled</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Detail modal */}
      {detailModal && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setDetailModal(null)}>
          <div className="w-full rounded-t-3xl p-5 pb-10 max-h-[80vh] overflow-y-auto" style={{ background: "#FAF7F4" }} onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "rgba(200,162,124,0.3)" }} />
            <h3 className="text-base font-semibold mb-4" style={{ color: "#2A2018" }}>
              {detailModal === "all" ? "All Expenses" : detailModal === "owe" ? "What You Owe" : "Owed to You"}
            </h3>
            <div className="space-y-2">
              {(() => {
                const list = detailModal === "all" ? expenses
                  : detailModal === "owe" ? oweExpenses
                  : receivedExpenses;
                if (list.length === 0) return <p className="text-sm text-center py-6" style={{ color: "#B0A090" }}>nothing here</p>;
                return list.map(exp => {
                  const trip = trips.find(t => t.id === exp.trip_id);
                  const myShare = detailModal === "owe" ? getShareAmount(exp, user.email)
                    : detailModal === "received" ? (exp.split_among || []).filter(em => em !== user.email).reduce((s, em) => s + getShareAmount(exp, em), 0)
                    : exp.amount;
                  const myPay = getPayment(exp.id, user.email);
                  const settled = exp.is_settled || myPay?.status === "confirmed";
                  return (
                    <div key={exp.id} className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.9)", border: "1px solid rgba(200,162,124,0.12)" }}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0 pr-2">
                          <p className="text-sm font-medium" style={{ color: "#2A2018" }}>{exp.description}</p>
                          <p className="text-[11px] mt-0.5" style={{ color: "#B0A090" }}>
                            {trip?.name} · Paid by {resolveName(exp.paid_by)}
                            {exp.created_date ? ` · ${format(new Date(exp.created_date), "MMM d")}` : ""}
                          </p>
                          <p className="text-[11px]" style={{ color: "#B0A090" }}>Split {exp.split_among?.length || 0} ways</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold" style={{ color: detailModal === "owe" ? "#B04040" : detailModal === "received" ? "#3A7A5A" : "#2A2018" }}>${myShare.toFixed(2)}</p>
                          {settled ? (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(107,174,138,0.15)", color: "#5A9E7A" }}>Settled</span>
                          ) : myPay?.status === "pending" ? (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(255,193,50,0.15)", color: "#9A7840" }}>Pending</span>
                          ) : (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(220,80,80,0.08)", color: "#B04040" }}>Unpaid</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
    </PullToRefresh>
  );
}