import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus, Trash2, ArrowRight, Clock, CheckCircle2,
  XCircle, Send, ChevronDown, ChevronUp, Receipt, X
} from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import MobileSelect from "../MobileSelect";
import { toast } from "sonner";
import { format } from "date-fns";

const categories = [
  { value: "food",      label: "🍕 Food" },
  { value: "transport", label: "🚕 Travel" },
  { value: "lodging",   label: "🏨 Lodging" },
  { value: "activity",  label: "🎯 Activities" },
  { value: "shopping",  label: "🛍 Shopping" },
  { value: "other",     label: "📦 Other" },
];

const paymentMethods = [
  { value: "venmo", label: "Venmo" },
  { value: "zelle", label: "Zelle" },
  { value: "paypal", label: "PayPal" },
  { value: "cashapp", label: "Cash App" },
  { value: "cash", label: "Cash" },
  { value: "other", label: "Other" },
];

export default function TripCosts({ trip, user }) {
  const [expenses, setExpenses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [members, setMembers] = useState([]);
  const [payerProfiles, setPayerProfiles] = useState({}); // email -> UserProfile
  const [showAdd, setShowAdd] = useState(false);
  const [expandedExpense, setExpandedExpense] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState({});
  const [detailModal, setDetailModal] = useState(null); // 'owe' | 'received' | null
  const [form, setForm] = useState({ description: "", amount: "", category: "other", split_among: trip.member_emails || [], day_number: null, trip_wide: true });
  const [splitMode, setSplitMode] = useState("equal");
  const [customAmounts, setCustomAmounts] = useState({});

  useEffect(() => { loadData(); }, [trip.id]);

  async function loadData() {
    const [allExpenses, allPayments, allUsers, allProfiles] = await Promise.all([
      base44.entities.Expense.filter({ trip_id: trip.id }, "-created_date", 200),
      base44.entities.Payment.filter({ trip_id: trip.id }, "-created_date", 200),
      base44.entities.User.list("-created_date", 200),
      base44.entities.UserProfile.list("-created_date", 200),
    ]);
    setExpenses(allExpenses);
    setPayments(allPayments);
    setMembers(allUsers.filter((u) => trip.member_emails?.includes(u.email)));
    const profileMap = {};
    allProfiles.forEach((p) => { profileMap[p.user_email] = p; });
    setPayerProfiles(profileMap);
  }

  function getPayment(expenseId, senderEmail) {
    return payments.find((p) => p.expense_id === expenseId && p.sender_email === senderEmail);
  }

  function getShareAmount(expense, email) {
    if (expense.custom_split_amounts && expense.custom_split_amounts[email] !== undefined) {
      return parseFloat(expense.custom_split_amounts[email]);
    }
    const count = expense.split_among?.length || 1;
    return expense.amount / count;
  }

  const activeSplitList = form.split_among;

  function equalShare() {
    if (!form.amount || activeSplitList.length === 0) return 0;
    return parseFloat(form.amount) / activeSplitList.length;
  }

  async function addExpense(e) {
    e.preventDefault();
    if (!form.description || !form.amount) return;
    const splitList = form.split_among.length > 0 ? form.split_among : trip.member_emails || [];

    let custom_split_amounts = null;
    if (splitMode === "custom") {
      custom_split_amounts = {};
      for (const email of splitList) {
        custom_split_amounts[email] = parseFloat(customAmounts[email] || 0);
      }
    }

    await base44.entities.Expense.create({
      description: form.description,
      amount: parseFloat(form.amount),
      category: form.category,
      paid_by: user.email,
      paid_by_name: user.full_name,
      split_among: splitList,
      custom_split_amounts,
      trip_id: trip.id,
      is_settled: false,
      trip_wide: form.trip_wide,
      day_number: form.trip_wide ? null : form.day_number,
    });
    setForm({ description: "", amount: "", category: "other", split_among: trip.member_emails || [], day_number: null, trip_wide: true });
    setCustomAmounts({});
    setSplitMode("equal");
    setShowAdd(false);
    loadData();
  }

  async function deleteExpense(id) {
    await base44.entities.Expense.delete(id);
    const related = payments.filter((p) => p.expense_id === id);
    await Promise.all(related.map((p) => base44.entities.Payment.delete(p.id)));
    loadData();
  }

  async function markPaymentSent(expense, method) {
    const share = getShareAmount(expense, user.email);
    const existing = getPayment(expense.id, user.email);
    if (existing) {
      await base44.entities.Payment.update(existing.id, {
        status: "pending", payment_method: method || "other",
        timestamp_sent: new Date().toISOString(),
      });
    } else {
      await base44.entities.Payment.create({
        expense_id: expense.id, trip_id: trip.id,
        sender_email: user.email, sender_name: user.full_name,
        receiver_email: expense.paid_by, receiver_name: expense.paid_by_name,
        amount: share, payment_method: method || "other",
        status: "pending", timestamp_sent: new Date().toISOString(),
      });
    }
    toast.success("Payment marked as sent");
    loadData();
  }

  async function confirmPayment(payment) {
    await base44.entities.Payment.update(payment.id, {
      status: "confirmed", timestamp_confirmed: new Date().toISOString(),
    });
    const expense = expenses.find((e) => e.id === payment.expense_id);
    if (expense) {
      const otherOwers = (expense.split_among || []).filter((e) => e !== expense.paid_by);
      const confirmedPayments = payments.filter(
        (p) => p.expense_id === expense.id && (p.status === "confirmed" || p.id === payment.id)
      );
      if (confirmedPayments.length >= otherOwers.length) {
        await base44.entities.Expense.update(expense.id, { is_settled: true });
      }
    }
    toast.success("Payment confirmed!");
    loadData();
  }

  async function rejectPayment(payment) {
    await base44.entities.Payment.update(payment.id, {
      status: "rejected", timestamp_confirmed: new Date().toISOString(),
    });
    toast.error("Payment rejected");
    loadData();
  }

  function getExpenseStatus(expense) {
    const owersExcludingPayer = (expense.split_among || []).filter((e) => e !== expense.paid_by);
    if (owersExcludingPayer.length === 0) return "settled";
    const expPayments = payments.filter((p) => p.expense_id === expense.id);
    const confirmed = expPayments.filter((p) => p.status === "confirmed").length;
    const pending = expPayments.filter((p) => p.status === "pending").length;
    if (confirmed >= owersExcludingPayer.length) return "settled";
    if (pending > 0) return "partial_pending";
    return "unpaid";
  }

  const total = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const iOwe = expenses
    .filter((e) => e.split_among?.includes(user.email) && e.paid_by !== user.email)
    .reduce((s, e) => {
      const pay = getPayment(e.id, user.email);
      if (pay?.status === "confirmed") return s;
      if (pay?.status === "pending") return s;
      return s + getShareAmount(e, user.email);
    }, 0);

  const iAmOwed = expenses
    .filter((e) => e.paid_by === user.email)
    .reduce((s, e) => {
      const owersExcludingMe = (e.split_among || []).filter(em => em !== user.email);
      return s + owersExcludingMe.reduce((ss, email) => {
        const pay = getPayment(e.id, email);
        if (pay?.status === "confirmed") return ss;
        return ss + getShareAmount(e, email);
      }, 0);
    }, 0);

  const pendingConfirmation = payments.filter(
    (p) => p.receiver_email === user.email && p.status === "pending"
  ).length;

  const oweExpenses = expenses.filter(e => e.split_among?.includes(user.email) && e.paid_by !== user.email);
  const receivedExpenses = expenses.filter(e => e.paid_by === user.email && (e.split_among || []).some(em => em !== user.email));

  function resolveName(email) {
    const profile = payerProfiles[email];
    if (profile?.display_name) return profile.display_name;
    if (profile?.username) return profile.username;
    if (profile?.full_name) return profile.full_name;
    const member = members.find(m => m.email === email);
    if (member?.full_name) return member.full_name;
    return email.split("@")[0];
  }

  function getMemberDisplayName(email) {
    const profile = payerProfiles[email];
    if (profile?.display_name) return profile.display_name;
    if (profile?.username) return profile.username;
    if (profile?.full_name) return profile.full_name;
    const member = members.find(m => m.email === email);
    if (member?.full_name) return member.full_name;
    return email.split("@")[0];
  }

  // Net balances: who owes who
  const netBalances = {};
  expenses.forEach((exp) => {
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
          netBalances[key] = { from: owerEmail, fromName: resolveName(owerEmail), to: exp.paid_by, toName: resolveName(exp.paid_by), amount: Math.abs(netBalances[reverseKey].amount) };
          delete netBalances[reverseKey];
        }
      } else {
        if (!netBalances[key]) netBalances[key] = { from: owerEmail, fromName: resolveName(owerEmail), to: exp.paid_by, toName: resolveName(exp.paid_by), amount: 0 };
        netBalances[key].amount += share;
      }
    });
  });
  const balanceRows = Object.values(netBalances).filter(b => b.amount > 0.01);

  function getSettleLinks(email) {
    const pp = payerProfiles[email];
    if (!pp) return [];
    return [
      pp.venmo    && { label: "Venmo",    href: `https://venmo.com/${pp.venmo.replace(/^@/, "")}` },
      pp.cashapp  && { label: "Cash App", href: `https://cash.app/$${pp.cashapp.replace(/^\$/, "")}` },
      pp.paypal   && { label: "PayPal",   href: `https://paypal.me/${pp.paypal.replace(/^[@\/]/, "")}` },
      pp.zelle    && { label: "Zelle",    href: null, info: pp.zelle },
    ].filter(Boolean);
  }

  return (
    <div className="pb-24">
      {/* Summary boxes */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { key: "all",      label: "total spent",  value: `$${total.toFixed(2)}`,    color: "#2A2018" },
          { key: "owe",      label: "you owe",      value: `$${iOwe.toFixed(2)}`,     color: iOwe > 0 ? "#B04040" : "#2A2018" },
          { key: "received", label: "you're owed",  value: `$${iAmOwed.toFixed(2)}`,  color: iAmOwed > 0 ? "#3A7A5A" : "#2A2018" },
        ].map(({ key, label, value, color }) => (
          <div
            key={label}
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
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#C8A27C" }}>Settle Up</p>
          <div className="space-y-2">
            {balanceRows.map((b, i) => {
              const settleLinks = getSettleLinks(b.to);
              const isMe = b.from === user.email;
              return (
                <div key={i} className="rounded-2xl p-3" style={{ background: "rgba(255,255,255,0.85)", border: "1px solid rgba(200,162,124,0.15)" }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs" style={{ color: "#3A3028" }}>
                      <span className="font-semibold">{isMe ? "You" : b.fromName}</span>
                      <span style={{ color: "#B0A090" }}> → </span>
                      <span className="font-semibold">{b.toName}</span>
                    </p>
                    <span className="text-sm font-semibold" style={{ color: isMe ? "#B04040" : "#3A7A5A" }}>${b.amount.toFixed(2)}</span>
                  </div>
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

      {/* Payments awaiting confirmation */}
      {payments.filter((p) => p.receiver_email === user.email && p.status === "pending").map((pay) => {
        const exp = expenses.find((e) => e.id === pay.expense_id);
        return (
          <div key={pay.id} className="rounded-2xl p-3 mb-3" style={{ background: "rgba(255,213,100,0.1)", border: "1px solid rgba(255,193,50,0.25)" }}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-xs font-semibold" style={{ color: "#2A2018" }}>{exp?.description || "Expense"}</p>
                <p className="text-[11px] mt-0.5" style={{ color: "#9A7840" }}>
                  {pay.sender_name} sent ${pay.amount?.toFixed(2)} via {paymentMethods.find((m) => m.value === pay.payment_method)?.label || "Other"}
                </p>
              </div>
              <span className="text-sm font-semibold" style={{ color: "#9A7840" }}>${pay.amount?.toFixed(2)}</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1 rounded-full text-xs h-7" style={{ background: "#6BAE8A", color: "white" }} onClick={() => confirmPayment(pay)}>
                <CheckCircle2 className="h-3 w-3 mr-1" /> Confirm
              </Button>
              <Button size="sm" variant="outline" className="rounded-full text-xs h-7 text-rose-500 border-rose-200" onClick={() => rejectPayment(pay)}>
                Reject
              </Button>
            </div>
          </div>
        );
      })}

      {/* Expenses list */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#C8A27C" }}>Expenses</h3>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium"
          style={{ background: "#C8A27C", color: "white" }}
        >
          <Plus className="h-3.5 w-3.5" /> Add
        </button>
      </div>

      {expenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: "rgba(200,162,124,0.1)" }}>
            <Receipt className="h-5 w-5" style={{ color: "#C8A27C" }} />
          </div>
          <p className="text-sm font-medium" style={{ color: "#3A3028" }}>No expenses yet</p>
          <p className="text-xs mt-1" style={{ color: "#B0A090" }}>Tap Add to log a shared cost</p>
        </div>
      ) : (
        <div className="space-y-4">
          {(() => {
            // Build trip days
            const tripDays = [];
            if (trip.start_date && trip.end_date) {
              const start = new Date(trip.start_date);
              const end = new Date(trip.end_date);
              const days = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
              for (let i = 1; i <= days; i++) tripDays.push(i);
            }

            // Group expenses
            const groups = [];
            const wideExpenses = expenses.filter(e => e.trip_wide !== false || !e.day_number);
            const dayExpenses = expenses.filter(e => e.trip_wide === false && e.day_number);

            if (wideExpenses.length > 0) groups.push({ label: "Trip-wide", exps: wideExpenses });
            tripDays.forEach(d => {
              const de = dayExpenses.filter(e => e.day_number === d);
              if (de.length > 0) groups.push({ label: `Day ${d}`, exps: de });
            });
            // Any day expenses for days outside trip range
            const extraDays = [...new Set(dayExpenses.filter(e => !tripDays.includes(e.day_number)).map(e => e.day_number))];
            extraDays.sort((a,b) => a-b).forEach(d => {
              const de = dayExpenses.filter(e => e.day_number === d);
              groups.push({ label: `Day ${d}`, exps: de });
            });

            return groups.map(({ label, exps }) => (
              <div key={label}>
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#C8A27C" }}>{label}</p>
                <div className="space-y-2">
          {exps.map((exp) => {
            const status = getExpenseStatus(exp);
            const settled = status === "settled" || exp.is_settled;
            const isExpanded = expandedExpense === exp.id;
            const iOweThis = exp.split_among?.includes(user.email) && exp.paid_by !== user.email;
            const myPayment = getPayment(exp.id, user.email);
            const myShare = getShareAmount(exp, user.email);

            return (
              <div key={exp.id} className="rounded-2xl overflow-hidden transition-all" style={{ background: settled ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.9)", border: `1px solid ${settled ? "rgba(200,162,124,0.08)" : "rgba(200,162,124,0.18)"}`, opacity: settled ? 0.7 : 1 }}>
                <div className="p-3 cursor-pointer" onClick={() => setExpandedExpense(isExpanded ? null : exp.id)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <span className="text-base">{categories.find((c) => c.value === exp.category)?.label?.split(" ")[0] || "📦"}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${settled ? "line-through" : ""}`} style={{ color: settled ? "#B0A090" : "#2A2018" }}>{exp.description}</p>
                        <p className="text-[10px] mt-0.5" style={{ color: "#B0A090" }}>
                          {resolveName(exp.paid_by)} paid · {exp.split_among?.length || 0} people
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <p className={`text-sm font-semibold ${settled ? "line-through" : ""}`} style={{ color: settled ? "#B0A090" : "#2A2018" }}>${exp.amount?.toFixed(2)}</p>
                        {settled ? (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: "rgba(107,174,138,0.15)", color: "#5A9E7A" }}>Settled</span>
                        ) : status === "partial_pending" ? (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: "rgba(255,193,50,0.15)", color: "#9A7840" }}>Pending</span>
                        ) : iOweThis ? (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: "rgba(220,80,80,0.1)", color: "#B04040" }}>−${myShare.toFixed(2)}</span>
                        ) : null}
                      </div>
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5" style={{ color: "#C8A27C" }} /> : <ChevronDown className="h-3.5 w-3.5" style={{ color: "#C0B0A0" }} />}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-3 pb-3 space-y-3" style={{ borderTop: "1px solid rgba(200,162,124,0.1)" }}>
                    <div className="pt-3 space-y-1.5">
                      {(exp.split_among || []).filter((e) => e !== exp.paid_by).map((email) => {
                        const pay = getPayment(exp.id, email);
                        const share = getShareAmount(exp, email);
                        const memberName = members.find((m) => m.email === email)?.full_name || email.split("@")[0];
                        return (
                          <div key={email} className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ background: "#C8A27C" }}>
                                {memberName[0]}
                              </div>
                              <span className="text-xs" style={{ color: "#3A3028" }}>{memberName}</span>
                              <ArrowRight className="h-2.5 w-2.5" style={{ color: "#C0B0A0" }} />
                              <span className="text-xs" style={{ color: "#B0A090" }}>{resolveName(exp.paid_by)}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-medium" style={{ color: "#2A2018" }}>${share.toFixed(2)}</span>
                              {pay?.status === "confirmed" ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                              ) : pay?.status === "pending" ? (
                                <Clock className="h-3.5 w-3.5 text-amber-500" />
                              ) : pay?.status === "rejected" ? (
                                <XCircle className="h-3.5 w-3.5 text-rose-400" />
                              ) : (
                                <div className="h-3 w-3 rounded-full border border-dashed" style={{ borderColor: "#C0B0A0" }} />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {iOweThis && !settled && (
                      <div className="rounded-xl p-3" style={{ background: "rgba(200,162,124,0.06)" }}>
                        {!myPayment || myPayment.status === "rejected" ? (
                          <div>
                            {myPayment?.status === "rejected" && (
                              <p className="text-xs mb-2" style={{ color: "#B04040" }}>⚠ Payment rejected — try again</p>
                            )}
                            <p className="text-xs font-medium mb-2" style={{ color: "#3A3028" }}>
                              You owe ${myShare.toFixed(2)} to {exp.paid_by_name || exp.paid_by?.split("@")[0]}
                            </p>
                            {/* External settle buttons */}
                            {(() => {
                              const pp = payerProfiles[exp.paid_by];
                              if (!pp) return null;
                              const payLinks = [
                                pp.venmo && { label: "Venmo", href: `https://venmo.com/${pp.venmo.replace(/^@/, "")}` },
                                pp.cashapp && { label: "Cash App", href: `https://cash.app/${pp.cashapp.replace(/^\$/, "$")}` },
                                pp.paypal && { label: "PayPal", href: `https://paypal.me/${pp.paypal.replace(/^[@\/]/, "")}` },
                                pp.zelle && { label: "Zelle", href: null, info: pp.zelle },
                              ].filter(Boolean);
                              if (payLinks.length === 0) return null;
                              return (
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                  {payLinks.map((pl) =>
                                    pl.href ? (
                                      <a key={pl.label} href={pl.href} target="_blank" rel="noopener noreferrer"
                                        className="px-2.5 py-1 rounded-full text-[10px] font-semibold"
                                        style={{ background: "rgba(200,162,124,0.15)", color: "#7A6A5A" }}>
                                        Settle via {pl.label} ↗
                                      </a>
                                    ) : (
                                      <span key={pl.label}
                                        className="px-2.5 py-1 rounded-full text-[10px] font-medium"
                                        style={{ background: "rgba(200,162,124,0.1)", color: "#9A8A7A" }}>
                                        Zelle: {pl.info}
                                      </span>
                                    )
                                  )}
                                </div>
                              );
                            })()}
                            <div className="flex gap-2">
                               <MobileSelect value={selectedMethod[exp.id] || "other"} onChange={(v) => setSelectedMethod({ ...selectedMethod, [exp.id]: v })} options={paymentMethods} placeholder="Method" />
                              <Button size="sm" className="rounded-full shrink-0 h-8 text-xs px-3" style={{ background: "#C8A27C", color: "white" }} onClick={() => markPaymentSent(exp, selectedMethod[exp.id])}>
                                <Send className="h-3 w-3 mr-1" /> Sent
                              </Button>
                            </div>
                          </div>
                        ) : myPayment.status === "pending" ? (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 shrink-0" style={{ color: "#9A7840" }} />
                            <div>
                              <p className="text-xs font-medium" style={{ color: "#9A7840" }}>Sent · Awaiting confirmation</p>
                              <p className="text-[10px]" style={{ color: "#B09050" }}>via {paymentMethods.find((m) => m.value === myPayment.payment_method)?.label}</p>
                            </div>
                          </div>
                        ) : myPayment.status === "confirmed" ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                            <p className="text-xs font-medium text-emerald-600">Confirmed · Settled</p>
                          </div>
                        ) : null}
                      </div>
                    )}

                    {exp.paid_by === user.email && (
                      <button className="flex items-center gap-1.5 text-xs w-full justify-center py-1.5 rounded-full transition-colors hover:bg-rose-50" style={{ color: "#C0A0A0" }} onClick={() => deleteExpense(exp.id)}>
                        <Trash2 className="h-3.5 w-3.5" /> Remove expense
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
                </div>
              </div>
            ));
          })()}
        </div>
      )}

      <Dialog open={!!detailModal} onOpenChange={(open) => { if (!open) setDetailModal(null); }}>
        <DialogContent className="max-w-md w-[calc(100%-2rem)] rounded-3xl p-0 gap-0 overflow-hidden" style={{ background: "#FAF7F4", maxHeight: "calc(100vh - 120px)", display: "flex", flexDirection: "column" }}>
          <DialogHeader className="px-5 pt-5 pb-3 shrink-0">
            <DialogTitle style={{ color: "#2A2018" }}>
              {detailModal === "all" ? "All Expenses" : detailModal === "owe" ? "What You Owe" : "Owed to You"}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto px-5 pb-6">
            <div className="space-y-2">
              {(() => {
                const list = detailModal === "all" ? expenses
                  : detailModal === "owe" ? oweExpenses
                  : receivedExpenses;
                if (list.length === 0) return <p className="text-sm text-center py-6" style={{ color: "#B0A090" }}>nothing here</p>;
                return list.map(exp => {
                  const status = getExpenseStatus(exp);
                  const settled = status === "settled" || exp.is_settled;
                  const myPay = getPayment(exp.id, user.email);
                  const myShare = detailModal === "owe"
                    ? (myPay?.status === "confirmed" ? 0 : getShareAmount(exp, user.email))
                    : detailModal === "received"
                    ? (exp.split_among || []).filter(em => em !== user.email).reduce((s, em) => {
                        const p = getPayment(exp.id, em);
                        if (p?.status === "confirmed") return s;
                        return s + getShareAmount(exp, em);
                      }, 0)
                    : exp.amount;
                  return (
                    <div key={exp.id} className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.9)", border: "1px solid rgba(200,162,124,0.12)" }}>
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex-1 min-w-0 pr-2">
                          <p className="text-sm font-medium" style={{ color: "#2A2018" }}>{exp.description}</p>
                          <p className="text-[11px] mt-0.5" style={{ color: "#B0A090" }}>
                            Paid by {resolveName(exp.paid_by)}
                            {exp.created_date ? ` · ${format(new Date(exp.created_date), "MMM d")}` : ""}
                          </p>
                          <p className="text-[11px] mt-0.5" style={{ color: "#B0A090" }}>Split {exp.split_among?.length || 0} ways</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold" style={{ color: detailModal === "owe" ? "#B04040" : detailModal === "received" ? "#3A7A5A" : "#2A2018" }}>${myShare.toFixed(2)}</p>
                          {settled || myShare === 0 ? (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(107,174,138,0.15)", color: "#5A9E7A" }}>Settled</span>
                          ) : detailModal === "owe" && myPay?.status === "pending" ? (
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
        </DialogContent>
      </Dialog>

      {showAdd && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={() => setShowAdd(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl max-h-[90vh] overflow-y-auto relative"
            style={{ background: "#FAF7F4" }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowAdd(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full z-10"
              style={{ background: "rgba(200,162,124,0.15)" }}
            >
              <X className="h-4 w-4" style={{ color: "#9A8A7A" }} />
            </button>

            <div className="px-6 py-6">
              <h3 className="text-lg font-semibold mb-4" style={{ color: "#2A2018" }}>Add Expense</h3>
              <form onSubmit={addExpense} className="space-y-3">
            <div>
              <Label className="text-xs font-medium mb-1 block" style={{ color: "#9A8A7A" }}>Description</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What was it for?" className="h-9 text-sm" style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(200,162,124,0.2)" }} />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <Label className="text-xs font-medium mb-1 block" style={{ color: "#9A8A7A" }}>Amount ($)</Label>
                <Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" className="h-9 text-sm" style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(200,162,124,0.2)" }} />
              </div>
              <div>
                <Label className="text-xs font-medium mb-1 block" style={{ color: "#9A8A7A" }}>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger className="h-9 text-sm" style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(200,162,124,0.2)" }}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-xs font-medium mb-1.5 block" style={{ color: "#9A8A7A" }}>Split among</Label>
              <div className="space-y-1.5 mb-2">
                {members.map((m) => {
                  const isSelected = form.split_among.includes(m.email);
                  return (
                    <button
                      type="button"
                      key={m.email}
                      onClick={() => setForm({
                        ...form,
                        split_among: isSelected
                          ? form.split_among.filter((e) => e !== m.email)
                          : [...form.split_among, m.email],
                      })}
                      className="flex items-center gap-2 text-xs w-full rounded-lg px-2 py-1.5 transition-colors"
                      style={{
                        background: isSelected ? "rgba(200,162,124,0.12)" : "transparent",
                        border: `1px solid ${isSelected ? "rgba(200,162,124,0.35)" : "rgba(200,162,124,0.1)"}`,
                      }}
                    >
                      <div className="w-4 h-4 rounded-full border flex items-center justify-center shrink-0" style={{ borderColor: isSelected ? "#C8A27C" : "#C0B0A0", background: isSelected ? "#C8A27C" : "transparent" }}>
                        {isSelected && <span style={{ color: "white", fontSize: 9 }}>✓</span>}
                      </div>
                      <span style={{ color: isSelected ? "#3A3028" : "#9A8A7A" }}>{getMemberDisplayName(m.email)}{m.email === user.email ? " (You)" : ""}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2 p-1 rounded-full" style={{ background: "rgba(200,162,124,0.08)" }}>
              {[{ key: "equal", label: "Equal split" }, { key: "custom", label: "Custom split" }].map(({ key, label }) => (
                <button type="button" key={key} onClick={() => setSplitMode(key)} className="flex-1 py-1.5 text-xs font-medium rounded-full transition-all" style={splitMode === key ? { background: "white", color: "#C8A27C", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" } : { color: "#9A8A7A" }}>
                  {label}
                </button>
              ))}
            </div>

            {splitMode === "equal" && form.amount && activeSplitList.length > 0 && (
              <p className="text-xs text-center" style={{ color: "#B0A090" }}>
                ${equalShare().toFixed(2)} per person
              </p>
            )}

            {splitMode === "custom" && (
              <div className="space-y-1.5">
                <p className="text-[11px]" style={{ color: "#B0A090" }}>Set each person's share (must total ${parseFloat(form.amount || 0).toFixed(2)})</p>
                {activeSplitList.map((email) => {
                  const m = members.find(m => m.email === email);
                  return (
                    <div key={email} className="flex items-center gap-2">
                      <span className="text-xs flex-1" style={{ color: "#3A3028" }}>{getMemberDisplayName(email)}{email === user.email ? " (You)" : ""}</span>
                      <Input
                        type="number"
                        step="0.01"
                        value={customAmounts[email] || ""}
                        onChange={(e) => setCustomAmounts({ ...customAmounts, [email]: e.target.value })}
                        className="h-8 w-24 text-xs text-right"
                        placeholder="0.00"
                      />
                    </div>
                  );
                })}
              </div>
            )}

            <div>
              <Label className="text-xs font-medium mb-1 block" style={{ color: "#9A8A7A" }}>Applies to</Label>
              {(() => {
                const dayOptions = [];
                if (trip.start_date && trip.end_date) {
                  const start = new Date(trip.start_date);
                  const end = new Date(trip.end_date);
                  const days = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
                  for (let i = 1; i <= days; i++) dayOptions.push(i);
                }
                return (
                  <Select
                    value={form.trip_wide ? "trip_wide" : String(form.day_number)}
                    onValueChange={(v) => {
                      if (v === "trip_wide") setForm((f) => ({ ...f, trip_wide: true, day_number: null }));
                      else setForm((f) => ({ ...f, trip_wide: false, day_number: parseInt(v) }));
                    }}
                  >
                    <SelectTrigger className="h-9 text-sm" style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(200,162,124,0.2)" }}>
                      <SelectValue placeholder="Select scope" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trip_wide">Trip-wide</SelectItem>
                      {dayOptions.map(d => (
                        <SelectItem key={d} value={String(d)}>Day {d}</SelectItem>
                      ))}
                      {dayOptions.length === 0 && (
                        <SelectItem value="trip_wide" disabled>No days (set trip dates to enable)</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                );
              })()}
            </div>

                {(!form.description || !form.amount) && (
              <p className="text-xs text-center" style={{ color: "#B04040" }}>Please fill in description and amount</p>
            )}
            <button type="submit" disabled={!form.description || !form.amount} className="w-full h-10 rounded-full text-sm font-semibold mt-2 disabled:opacity-40" style={{ background: "#C8A27C", color: "white" }}>Add Expense</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}