import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { DollarSign, ArrowRight } from "lucide-react";

export default function Costs() {
  const [user, setUser] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const me = await base44.auth.me();
    setUser(me);
    const allTrips = await base44.entities.Trip.list("-created_date", 50);
    const myTrips = allTrips.filter(
      (t) => t.member_emails?.includes(me.email) || t.admin_email === me.email
    );
    setTrips(myTrips);
    const allExpenses = await base44.entities.Expense.list("-created_date", 200);
    const tripIds = new Set(myTrips.map((t) => t.id));
    setExpenses(allExpenses.filter((e) => tripIds.has(e.trip_id)));
    setLoading(false);
  }

  function calculateBalances() {
    const balances = {};
    expenses.forEach((exp) => {
      if (exp.is_settled) return;
      const share = exp.amount / (exp.split_among?.length || 1);
      exp.split_among?.forEach((email) => {
        if (email !== exp.paid_by) {
          const key = `${email}->${exp.paid_by}`;
          balances[key] = (balances[key] || 0) + share;
        }
      });
    });

    const netBalances = {};
    Object.entries(balances).forEach(([key, amount]) => {
      const [from, to] = key.split("->");
      const reverseKey = `${to}->${from}`;
      if (balances[reverseKey]) {
        const net = amount - (balances[reverseKey] || 0);
        if (net > 0) {
          netBalances[key] = net;
        }
        delete balances[reverseKey];
      } else {
        netBalances[key] = amount;
      }
    });

    return netBalances;
  }

  const totalSpent = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const myExpenses = expenses.filter((e) => e.paid_by === user?.email);
  const myTotal = myExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const balances = user ? calculateBalances() : {};

  return (
    <div className="px-5 pt-14">
      <h1 className="text-2xl font-bold tracking-tight mb-2">Costs</h1>
      <p className="text-sm text-muted-foreground mb-6">All your trip expenses</p>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : expenses.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-4">
            <DollarSign className="h-7 w-7 text-primary" />
          </div>
          <h3 className="font-semibold text-lg mb-1">No expenses yet</h3>
          <p className="text-muted-foreground text-sm">Expenses from your trips will appear here</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-card rounded-2xl border border-border p-4">
              <p className="text-xs text-muted-foreground mb-1">Total Spent</p>
              <p className="text-xl font-bold">${totalSpent.toFixed(2)}</p>
            </div>
            <div className="bg-card rounded-2xl border border-border p-4">
              <p className="text-xs text-muted-foreground mb-1">You Paid</p>
              <p className="text-xl font-bold">${myTotal.toFixed(2)}</p>
            </div>
          </div>

          {Object.keys(balances).length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold mb-3">Balances</h3>
              <div className="space-y-2">
                {Object.entries(balances).map(([key, amount]) => {
                  const [from, to] = key.split("->");
                  return (
                    <div key={key} className="bg-card rounded-xl border border-border p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-medium truncate max-w-[100px]">{from.split("@")[0]}</span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium truncate max-w-[100px]">{to.split("@")[0]}</span>
                      </div>
                      <span className="text-sm font-semibold text-primary">${amount.toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <h3 className="text-sm font-semibold mb-3">Recent Expenses</h3>
          <div className="space-y-2">
            {expenses.slice(0, 20).map((exp) => {
              const trip = trips.find((t) => t.id === exp.trip_id);
              return (
                <div key={exp.id} className="bg-card rounded-xl border border-border p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{exp.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {trip?.name} · Paid by {exp.paid_by_name || exp.paid_by?.split("@")[0]}
                      </p>
                    </div>
                    <span className={`text-sm font-semibold ${exp.is_settled ? "text-muted-foreground line-through" : ""}`}>
                      ${exp.amount?.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}