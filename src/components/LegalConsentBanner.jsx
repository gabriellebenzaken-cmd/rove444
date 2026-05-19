import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";

const STORAGE_KEY = "rove_legal_accepted";

export default function LegalConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-[80px] left-0 right-0 z-[200] flex justify-center px-4"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div
        className="w-full max-w-sm rounded-2xl px-4 py-3 flex items-center gap-3 shadow-lg"
        style={{
          background: "rgba(42,32,24,0.93)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(200,162,124,0.25)",
        }}
      >
        <p className="flex-1 text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>
          By using ROVR, you agree to our{" "}
          <Link to="/terms" onClick={dismiss} className="underline font-semibold" style={{ color: "#C8A27C" }}>
            Terms
          </Link>,{" "}
          <Link to="/guidelines" onClick={dismiss} className="underline font-semibold" style={{ color: "#C8A27C" }}>
            Community Guidelines
          </Link>, and{" "}
          <Link to="/privacy" onClick={dismiss} className="underline font-semibold" style={{ color: "#C8A27C" }}>
            Privacy Policy
          </Link>.
        </p>
        <button
          onClick={dismiss}
          className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center active:opacity-70 transition-opacity"
          style={{ background: "rgba(255,255,255,0.12)" }}
        >
          <X className="h-3.5 w-3.5 text-white" />
        </button>
      </div>
    </div>
  );
}