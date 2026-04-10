import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign, Plus, Trash2, ArrowRight, Clock, CheckCircle2,
  XCircle, Send, ChevronDown, ChevronUp, Receipt
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { format } from "date-fns";

const categories = [
  { value: "food", label: "🍕 Food" },
  { value: "transport", label: "🚕 Transport" },
  { value: "lodging", label: "🏨 Lodging" },
  { value: "activity", label: "🎯 Activity" },
  { value: "shopping", label: "🛍 Shopping" },
  { value: "other", label: "📦 Other" },
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
  const [showAdd, setShowAdd] = useState(false);
  const [expandedExpense, setExpandedExpense] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState({});
  const [form, setForm] = useState({
    description: "", amount: "", category: "other", split_among: [],
  });

  useEffect(() => {
    loadData();
  }, [trip.id]);

  async function loadData() {
    const [allExpenses, allPayments, allUsers] = await Promise.all([
      base44.entities.Expense.filter({ trip_id: trip.id }, "-created_date", 200),
      base44.entities.Payment.filter({ trip_id: trip.id }, "-created_date", 200),
      base44.entities.User.list("-created_date", 200),
    ]);
    setExpenses(allExpenses);
    setPayments(allPayments);
    setMembers(allUsers.filter((u) => trip.member_emails?.includes(u.email)));
  }

  // Returns payment record for a given expense + sender pair
  function getPayment(expenseId, senderEmail) {
    return payments.find(
      (p) => p.expense_id === expenseId && p.sender_email === senderEmail
    );
  }

  function getShareAmount(expense, email) {
    const count = expense.split_among?.length || 1;
    return expense.amount / count;
  }

  async function addExpense(e) {
    e.preventDefault();
    if (!form.description || !form.amount) return;
    const splitList = form.split_among.length > 0 ? form.split_among : trip.member_emails;
    await base44.entities.Expense.create({
      description: form.description,
      amount: parseFloat(form.amount),
      category: form.category,
      paid_by: user.email,
      paid_by_name: user.full_name,
      split_among: splitList,
      trip_id: trip.id,
      is_settled: false,
    });
    setForm({ description: "", amount: "", category: "other", split_among: [] });
    setShowAdd(false);
    loadData();
  }

  async function deleteExpense(id) {
    await base44.entities.Expense.delete(id);
    // also delete related payments
    const related = payments.filter((p) => p.expense_id === id);
    await Promise.all(related.map((p) => base44.entities.Payment.delete(p.id)));
    loadData();
  }

  async function markPaymentSent(expense, method) {
    const share = getShareAmount(expense, user.email);
    const existing = getPayment(expense.id, user.email);
    if (existing) {
      await base44.entities.Payment.update(existing.id, {
        status: "pending",
        payment_method: method || "other",
        timestamp_sent: new Date().toISOString(),
      });
    } else {
      await base44.entities.Payment.create({
        expense_id: expense.id,
        trip_id: trip.id,
        sender_email: user.email,
        sender_name: user.full_name,
        receiver_email: expense.paid_by,
        receiver_name: expense.paid_by_name,
        amount: share,
        payment_method: method || "other",
        status: "pending",
        timestamp_sent: new Date().toISOString(),
      });
    }
    toast.success("Payment marked as sent — waiting for confirmation");
    loadData();
  }

  async function confirmPayment(payment) {
    await base44.entities.Payment.update(payment.id, {
      status: "confirmed",
      timestamp_confirmed: new Date().toISOString(),
    });
    // check if all shares are confirmed for this expense
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
      status: "rejected",
      timestamp_confirmed: new Date().toISOString(),
    });
    toast.error("Payment rejected — sender has been notified");
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
      if (!pay || pay.status === "rejected" || pay.status === "unpaid") {
        return s + getShareAmount(e, user.email);
      }
      return s;
    }, 0);

  const pendingConfirmation = payments.filter(
    (p) => p.receiver_email === user.email && p.status === "pending"
  ).length;

  return (
    <div className="pb-24">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        <div className="bg-card rounded-xl border border-border p-3 text-center">
          <p className="text-[10px] text-muted-foreground">Total</p>
          <p className="text-base font-bold">${total.toFixed(2)}</p>
        </div>
        <div className={`rounded-xl border p-3 text-center ${iOwe > 0 ? "bg-rose-50 border-rose-200" : "bg-card border-border"}`}>
          <p className="text-[10px] text-muted-foreground">You Owe</p>
          <p className={`text-base font-bold ${iOwe > 0 ? "text-rose-600" : ""}`}>${iOwe.toFixed(2)}</p>
        </div>
        <div className={`rounded-xl border p-3 text-center ${pendingConfirmation > 0 ? "bg-amber-50 border-amber-200" : "bg-card border-border"}`}>
          <p className="text-[10px] text-muted-foreground">Pending</p>
          <p className={`text-base font-bold ${pendingConfirmation > 0 ? "text-amber-600" : ""}`}>{pendingConfirmation}</p>
        </div>
      </div>

      {/* Confirm pending payments I should receive */}
      {payments.filter((p) => p.receiver_email === user.email && p.status === "pending").length > 0 && (
        <div className="mb-5">
          <h4 className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" /> Payments awaiting your confirmation
          </h4>
          {payments
            .filter((p) => p.receiver_email === user.email && p.status === "pending")
            .map((pay) => {
              const exp = expenses.find((e) => e.id === pay.expense_id);
              return (
                <div key={pay.id} className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-2">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium">{exp?.description || "Expense"}</p>
                      <p className="text-xs text-amber-700">
                        {pay.sender_name || pay.sender_email?.split("@")[0]} sent ${pay.amount?.toFixed(2)} via {paymentMethods.find((m) => m.value === pay.payment_method)?.label || "Other"}
                      </p>
                      {pay.timestamp_sent && (
                        <p className="text-[10px] text-amber-600 mt-0.5">
                          Sent {format(new Date(pay.timestamp_sent), "MMM d, h:mm a")}
                        </p>
                      )}
                    </div>
                    <span className="text-base font-bold text-amber-700">${pay.amount?.toFixed(2)}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white"
                      onClick={() => confirmPayment(pay)}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Confirm Received
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full border-rose-300 text-rose-600 hover:bg-rose-50"
                      onClick={() => rejectPayment(pay)}
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                    </Button>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Expenses list */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Receipt className="h-4 w-4" /> Expenses
        </h3>
        <Button variant="outline" size="sm" className="rounded-full" onClick={() => setShowAdd(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add
        </Button>
      </div>

      {expenses.length === 0 ? (
        <p className="text-xs text-muted-foreground py-8 text-center">No expenses yet</p>
      ) : (
        <div className="space-y-2">
          {expenses.map((exp) => {
            const status = getExpenseStatus(exp);
            const settled = status === "settled" || exp.is_settled;
            const isExpanded = expandedExpense === exp.id;
            const iOweThis = exp.split_among?.includes(user.email) && exp.paid_by !== user.email;
            const myPayment = getPayment(exp.id, user.email);
            const myShare = getShareAmount(exp, user.email);

            return (
              <div
                key={exp.id}
                className={`bg-card rounded-2xl border transition-all ${
                  settled ? "border-border opacity-60" : "border-border"
                }`}
              >
                {/* Expense header */}
                <div
                  className="p-3 cursor-pointer"
                  onClick={() => setExpandedExpense(isExpanded ? null : exp.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-sm">{categories.find((c) => c.value === exp.category)?.label?.split(" ")[0] || "📦"}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${settled ? "line-through text-muted-foreground" : ""}`}>
                          {exp.description}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          Paid by {exp.paid_by_name || exp.paid_by?.split("@")[0]} · {exp.split_among?.length || 0} people
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <p className={`text-sm font-semibold ${settled ? "line-through text-muted-foreground" : ""}`}>
                          ${exp.amount?.toFixed(2)}
                        </p>
                        {settled ? (
                          <Badge className="text-[9px] py-0 px-1.5 bg-emerald-100 text-emerald-700 border-emerald-200">Paid</Badge>
                        ) : status === "partial_pending" ? (
                          <Badge className="text-[9px] py-0 px-1.5 bg-amber-100 text-amber-700 border-amber-200">Pending</Badge>
                        ) : iOweThis ? (
                          <Badge className="text-[9px] py-0 px-1.5 bg-rose-100 text-rose-600 border-rose-200">You owe ${myShare.toFixed(2)}</Badge>
                        ) : null}
                      </div>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-3 pb-3 border-t border-border pt-3 space-y-3">
                    {/* Split breakdown */}
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Split breakdown</p>
                      <div className="space-y-1.5">
                        {(exp.split_among || []).filter((e) => e !== exp.paid_by).map((email) => {
                          const pay = getPayment(exp.id, email);
                          const share = getShareAmount(exp, email);
                          const memberName = members.find((m) => m.email === email)?.full_name || email.split("@")[0];
                          return (
                            <div key={email} className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-1.5">
                                <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center text-[9px] font-bold text-primary">
                                  {memberName[0]}
                                </div>
                                <span>{memberName}</span>
                                <ArrowRight className="h-2.5 w-2.5 text-muted-foreground" />
                                <span className="text-muted-foreground">{exp.paid_by_name || exp.paid_by?.split("@")[0]}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium">${share.toFixed(2)}</span>
                                {pay?.status === "confirmed" ? (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                ) : pay?.status === "pending" ? (
                                  <Clock className="h-3.5 w-3.5 text-amber-500" />
                                ) : pay?.status === "rejected" ? (
                                  <XCircle className="h-3.5 w-3.5 text-rose-500" />
                                ) : (
                                  <div className="h-3.5 w-3.5 rounded-full border-2 border-muted-foreground/30" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Payment action for current user if they owe */}
                    {iOweThis && !settled && (
                      <div className="bg-muted/50 rounded-xl p-3">
                        {!myPayment || myPayment.status === "rejected" ? (
                          <div>
                            {myPayment?.status === "rejected" && (
                              <p className="text-xs text-rose-600 mb-2 font-medium">
                                ⚠ Your payment was rejected. Please try again.
                              </p>
                            )}
                            <p className="text-xs font-semibold mb-2">
                              You owe ${myShare.toFixed(2)} to {exp.paid_by_name || exp.paid_by?.split("@")[0]}
                            </p>
                            <div className="flex gap-2">
                              <Select
                                value={selectedMethod[exp.id] || "other"}
                                onValueChange={(v) => setSelectedMethod({ ...selectedMethod, [exp.id]: v })}
                              >
                                <SelectTrigger className="h-8 text-xs rounded-full flex-1">
                                  <SelectValue placeholder="Method" />
                                </SelectTrigger>
                                <SelectContent>
                                  {paymentMethods.map((m) => (
                                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button
                                size="sm"
                                className="rounded-full shrink-0"
                                onClick={() => markPaymentSent(exp, selectedMethod[exp.id])}
                              >
                                <Send className="h-3 w-3 mr-1" /> Mark Sent
                              </Button>
                            </div>
                          </div>
                        ) : myPayment.status === "pending" ? (
                          <div className="flex items-center gap-2 text-amber-700">
                            <Clock className="h-4 w-4 shrink-0" />
                            <div>
                              <p className="text-xs font-semibold">Payment Sent – Waiting for Confirmation</p>
                              <p className="text-[10px] text-amber-600">
                                via {paymentMethods.find((m) => m.value === myPayment.payment_method)?.label}
                                {myPayment.timestamp_sent && ` · ${format(new Date(myPayment.timestamp_sent), "MMM d, h:mm a")}`}
                              </p>
                            </div>
                          </div>
                        ) : myPayment.status === "confirmed" ? (
                          <div className="flex items-center gap-2 text-emerald-700">
                            <CheckCircle2 className="h-4 w-4 shrink-0" />
                            <p className="text-xs font-semibold">Payment Confirmed – Settled ✓</p>
                          </div>
                        ) : null}
                      </div>
                    )}

                    {/* Delete button */}
                    {exp.paid_by === user.email && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-muted-foreground hover:text-destructive rounded-full w-full"
                        onClick={() => deleteExpense(exp.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete expense
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Expense Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="mx-4 rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
          </DialogHeader>
          <form onSubmit={addExpense} className="space-y-4">
            <div>
              <Label>What for?</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Dinner at La Piazza"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Amount ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Split among</Label>
              <p className="text-xs text-muted-foreground mb-2">Leave unchecked to split with everyone</p>
              <div className="space-y-2">
                {members.map((m) => (
                  <label key={m.email} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={form.split_among.includes(m.email)}
                      onCheckedChange={(checked) =>
                        setForm({
                          ...form,
                          split_among: checked
                            ? [...form.split_among, m.email]
                            : form.split_among.filter((e) => e !== m.email),
                        })
                      }
                    />
                    {m.full_name} {m.email === user.email && "(You)"}
                  </label>
                ))}
              </div>
            </div>
            <Button type="submit" className="w-full rounded-full">Add Expense</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}