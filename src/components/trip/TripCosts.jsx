import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign, Plus, Trash2, Check, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

const categories = [
  { value: "food", label: "🍕 Food" },
  { value: "transport", label: "🚕 Transport" },
  { value: "lodging", label: "🏨 Lodging" },
  { value: "activity", label: "🎯 Activity" },
  { value: "shopping", label: "🛍 Shopping" },
  { value: "other", label: "📦 Other" },
];

export default function TripCosts({ trip, user }) {
  const [expenses, setExpenses] = useState([]);
  const [members, setMembers] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    description: "",
    amount: "",
    category: "other",
    split_among: [],
  });

  useEffect(() => {
    loadData();
  }, [trip.id]);

  async function loadData() {
    const all = await base44.entities.Expense.filter({ trip_id: trip.id }, "-created_date", 200);
    setExpenses(all);
    const allUsers = await base44.entities.User.list("-created_date", 200);
    setMembers(allUsers.filter((u) => trip.member_emails?.includes(u.email)));
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

  async function toggleSettled(exp) {
    await base44.entities.Expense.update(exp.id, { is_settled: !exp.is_settled });
    loadData();
  }

  async function deleteExpense(id) {
    await base44.entities.Expense.delete(id);
    loadData();
  }

  function calculateBalances() {
    const balances = {};
    expenses.forEach((exp) => {
      if (exp.is_settled) return;
      const share = exp.amount / (exp.split_among?.length || 1);
      exp.split_among?.forEach((email) => {
        if (email !== exp.paid_by) {
          if (!balances[email]) balances[email] = {};
          balances[email][exp.paid_by] = (balances[email][exp.paid_by] || 0) + share;
        }
      });
    });
    return balances;
  }

  const total = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const unsettled = expenses.filter((e) => !e.is_settled).reduce((s, e) => s + (e.amount || 0), 0);
  const balances = calculateBalances();

  return (
    <div className="pb-24">
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-card rounded-xl border border-border p-3 text-center">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-lg font-bold">${total.toFixed(2)}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-3 text-center">
          <p className="text-xs text-muted-foreground">Unsettled</p>
          <p className="text-lg font-bold text-destructive">${unsettled.toFixed(2)}</p>
        </div>
      </div>

      {Object.keys(balances).length > 0 && (
        <div className="mb-5">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Who Owes Whom</h4>
          <div className="space-y-1.5">
            {Object.entries(balances).map(([from, owes]) =>
              Object.entries(owes).map(([to, amount]) => (
                <div key={`${from}-${to}`} className="bg-accent/50 rounded-lg px-3 py-2 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium">{from.split("@")[0]}</span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium">{to.split("@")[0]}</span>
                  </div>
                  <span className="font-semibold text-primary">${amount.toFixed(2)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <DollarSign className="h-4 w-4" /> Expenses
        </h3>
        <Button variant="outline" size="sm" className="rounded-full" onClick={() => setShowAdd(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add
        </Button>
      </div>

      {expenses.length === 0 ? (
        <p className="text-xs text-muted-foreground py-8 text-center">No expenses yet</p>
      ) : (
        <div className="space-y-2">
          {expenses.map((exp) => (
            <div key={exp.id} className={`bg-card rounded-xl border border-border p-3 ${exp.is_settled ? "opacity-60" : ""}`}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{categories.find((c) => c.value === exp.category)?.label?.split(" ")[0] || "📦"}</span>
                    <p className={`text-sm font-medium ${exp.is_settled ? "line-through" : ""}`}>{exp.description}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Paid by {exp.paid_by_name || exp.paid_by?.split("@")[0]} · Split {exp.split_among?.length || 0} ways
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-semibold mr-2">${exp.amount?.toFixed(2)}</span>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => toggleSettled(exp)}>
                    <Check className={`h-3.5 w-3.5 ${exp.is_settled ? "text-primary" : "text-muted-foreground"}`} />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteExpense(exp.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="mx-4 rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
          </DialogHeader>
          <form onSubmit={addExpense} className="space-y-4">
            <div>
              <Label>What for?</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Dinner at La Piazza" className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Amount ($)</Label>
                <Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="mt-1" />
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
                  <label key={m.email} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={form.split_among.includes(m.email)}
                      onCheckedChange={(checked) => {
                        setForm({
                          ...form,
                          split_among: checked
                            ? [...form.split_among, m.email]
                            : form.split_among.filter((e) => e !== m.email),
                        });
                      }}
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