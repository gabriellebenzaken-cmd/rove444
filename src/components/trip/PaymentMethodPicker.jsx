import { useState } from "react";
import { Send, CheckCircle2 } from "lucide-react";

const METHOD_CONFIG = {
  venmo:   { label: "Venmo",    prefix: "@", buildUrl: (handle) => `https://venmo.com/${handle.replace(/^@/, "")}`, color: "#3D95CE" },
  cashapp: { label: "Cash App", prefix: "$", buildUrl: (handle) => `https://cash.app/${handle.startsWith("$") ? handle : "$" + handle}`, color: "#00C244" },
  paypal:  { label: "PayPal",   prefix: "",  buildUrl: (handle) => `https://paypal.me/${handle.replace(/^[@/]/, "")}`, color: "#003087" },
  zelle:   { label: "Zelle",    prefix: "",  buildUrl: null, color: "#6D1ED4" },
};

export default function PaymentMethodPicker({ receiverProfile, receiverName, amount, onSent }) {
  const [chosen, setChosen] = useState(null); // method key or "other"
  const [ready, setReady] = useState(false);  // ready to mark as sent

  const linkedMethods = Object.entries(METHOD_CONFIG)
    .map(([key, cfg]) => {
      const handle = receiverProfile?.[key];
      if (!handle) return null;
      return { key, handle, ...cfg };
    })
    .filter(Boolean);

  function handleMethodTap(method) {
    setChosen(method.key);
    if (method.buildUrl) {
      const url = method.buildUrl(method.handle);
      window.open(url, "_blank");
    } else {
      // Zelle — copy the info
      navigator.clipboard.writeText(method.handle).catch(() => {});
    }
    setReady(true);
  }

  function handleOtherWay() {
    setChosen("other");
    setReady(true);
  }

  function handleMarkSent() {
    onSent(chosen || "other");
    setChosen(null);
    setReady(false);
  }

  return (
    <div className="space-y-2.5">
      <p className="text-xs font-medium" style={{ color: "#3A3028" }}>
        Pay ${amount?.toFixed(2)} to {receiverName}
      </p>

      {linkedMethods.length > 0 ? (
        <div className="space-y-1.5">
          {linkedMethods.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => handleMethodTap(m)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-[0.98]"
              style={{
                background: chosen === m.key ? `${m.color}18` : "rgba(255,255,255,0.85)",
                border: `1.5px solid ${chosen === m.key ? m.color : "rgba(200,162,124,0.18)"}`,
                color: m.color,
              }}
            >
              <span>Pay with {m.label}</span>
              <span style={{ color: chosen === m.key ? m.color : "#B0A090", fontWeight: 400 }}>
                {m.key === "zelle" ? `Copy: ${m.handle}` : `${m.prefix}${m.handle.replace(/^[@$]/, "")} ↗`}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <p className="text-[11px]" style={{ color: "#B0A090" }}>
          {receiverName} hasn't linked payment methods yet.
        </p>
      )}

      {/* Fallback */}
      {!ready && (
        <button
          type="button"
          onClick={handleOtherWay}
          className="w-full text-center text-[11px] py-1.5 rounded-full transition-colors"
          style={{ color: "#B0A090", background: "rgba(200,162,124,0.07)" }}
        >
          I paid another way
        </button>
      )}

      {/* Mark as sent */}
      {ready && (
        <button
          type="button"
          onClick={handleMarkSent}
          className="w-full flex items-center justify-center gap-1.5 h-9 rounded-full text-xs font-semibold transition-all active:scale-[0.98]"
          style={{ background: "#C8A27C", color: "white" }}
        >
          <Send className="h-3 w-3" />
          Mark as Sent
        </button>
      )}
    </div>
  );
}